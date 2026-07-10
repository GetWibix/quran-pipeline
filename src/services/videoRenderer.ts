import { writeFile, mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface SceneInput {
  imagePath: string;
  audioPath: string;
  durationSeconds: number;
}

export interface RenderOptions {
  scenes: SceneInput[];
  aspectRatio: "9:16" | "16:9";
  outputPath: string;
  maxThreads?: number;
  videoBackgroundPath?: string;
  videoBackgroundPaths?: string[];
}

const DIMENSIONS = {
  "9:16": "1080x1920",
  "16:9": "1920x1080",
};

const FPS = {
  "9:16": 50,
  "16:9": 30,
};

async function concatAudioFiles(
  audioPaths: string[],
  outputPath: string,
  workDir: string
): Promise<void> {
  const listFile = path.join(workDir, "audio-list.txt");
  const listContent = audioPaths
    .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
    .join("\n");
  await writeFile(listFile, listContent);

  await execFileAsync("ffmpeg", [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", listFile,
    "-c", "copy",
    outputPath,
  ]);
}

function sanitizePath(p: string): string {
  return p.replace(/'/g, "'\\''");
}

async function renderSingleScene(
  bgPath: string,
  imagePath: string,
  audioPath: string,
  duration: number,
  dims: string,
  fps: number,
  outputPath: string,
): Promise<void> {
  const fadeDur = 0.4;
  const fadeOutStart = Math.max(0, duration - fadeDur).toFixed(3);
  const dur = duration.toFixed(3);

  await execFileAsync("ffmpeg", [
    "-y",
    "-stream_loop", "-1", "-an", "-i", bgPath,
    "-i", imagePath,
    "-i", audioPath,
    "-filter_complex",
    `[0:v]trim=duration=${dur},setpts=PTS-STARTPTS,fps=${fps},scale=${dims},setsar=1[bgv];[bgv][1:v]overlay,fade=t=in:d=${fadeDur},fade=t=out:st=${fadeOutStart}:d=${fadeDur}`,
    "-map", "2:a",
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-crf", "28",
    "-x264opts", "rc-lookahead=5:bframes=1:ref=1",
    "-pix_fmt", "yuv420p",
    "-c:a", "copy",
    "-t", dur,
    "-shortest",
    outputPath,
  ]);
}

async function concatWithCopy(
  inputPaths: string[],
  outputPath: string,
  workDir: string,
): Promise<void> {
  const listFile = path.join(workDir, "concat-video-list.txt");
  const content = inputPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
  await writeFile(listFile, content);

  await execFileAsync("ffmpeg", [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", listFile,
    "-c", "copy",
    outputPath,
  ]);
}

export async function renderVideo(opts: RenderOptions): Promise<string> {
  const workDir = await mkdtemp(path.join(tmpdir(), "quran-render-"));
  const threads = opts.maxThreads ?? 2;
  const dims = DIMENSIONS[opts.aspectRatio];
  const fps = FPS[opts.aspectRatio];

  if (opts.videoBackgroundPaths && opts.videoBackgroundPaths.length > 0) {
    await renderPerScene(
      opts, dims, fps, threads, workDir
    );
  } else if (opts.videoBackgroundPath) {
    const bgs = Array(opts.scenes.length).fill(opts.videoBackgroundPath);
    const withBgs: RenderOptions = { ...opts, videoBackgroundPaths: bgs };
    await renderPerScene(
      withBgs, dims, fps, threads, workDir
    );
  } else {
    await renderWithStaticImages(opts, dims, threads, workDir);
  }

  return opts.outputPath;
}

async function renderPerScene(
  opts: RenderOptions,
  dims: string,
  fps: number,
  threads: number,
  workDir: string,
): Promise<void> {
  const bgs = opts.videoBackgroundPaths!;
  const n = opts.scenes.length;
  const sceneVideos: string[] = [];

  for (let i = 0; i < n; i++) {
    const bgIdx = i < bgs.length ? i : Math.floor(Math.random() * bgs.length);
    const sceneOut = path.join(workDir, `scene-${String(i).padStart(4, "0")}.mp4`);

    await renderSingleScene(
      bgs[bgIdx],
      opts.scenes[i].imagePath,
      opts.scenes[i].audioPath,
      opts.scenes[i].durationSeconds,
      dims,
      fps,
      sceneOut,
    );

    sceneVideos.push(sceneOut);
  }

  await concatWithCopy(sceneVideos, opts.outputPath, workDir);
}

async function renderWithStaticImages(
  opts: RenderOptions,
  dims: string,
  threads: number,
  workDir: string,
): Promise<void> {
  const mergedAudioPath = path.join(workDir, "merged-audio.mp3");
  await concatAudioFiles(
    opts.scenes.map((s) => s.audioPath),
    mergedAudioPath,
    workDir
  );

  const listFile = path.join(workDir, "images-list.txt");
  let content = "";
  for (const scene of opts.scenes) {
    content += `file '${sanitizePath(scene.imagePath)}'\n`;
    content += `duration ${scene.durationSeconds.toFixed(3)}\n`;
  }
  const lastImage = opts.scenes[opts.scenes.length - 1].imagePath;
  content += `file '${sanitizePath(lastImage)}'\n`;
  await writeFile(listFile, content);

  await execFileAsync("ffmpeg", [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", listFile,
    "-i", mergedAudioPath,
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-crf", "28",
    "-x264opts", "rc-lookahead=5:bframes=1:ref=1",
    "-pix_fmt", "yuv420p",
    "-c:a", "copy",
    "-shortest",
    opts.outputPath,
  ]);
}

export async function cleanupWorkDir(workDir: string): Promise<void> {
  await rm(workDir, { recursive: true, force: true });
}
