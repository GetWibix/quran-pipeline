import { writeFile, mkdtemp } from "fs/promises";
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
}

const DIMENSIONS = {
  "9:16": "1080x1920",
  "16:9": "1920x1080",
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

export async function renderVideo(opts: RenderOptions): Promise<string> {
  const workDir = await mkdtemp(path.join(tmpdir(), "quran-render-"));
  const threads = opts.maxThreads ?? 2;
  const dims = DIMENSIONS[opts.aspectRatio];

  const mergedAudioPath = path.join(workDir, "merged-audio.mp3");
  await concatAudioFiles(
    opts.scenes.map((s) => s.audioPath),
    mergedAudioPath,
    workDir
  );

  if (opts.videoBackgroundPath) {
    await renderWithVideoBackground(opts, mergedAudioPath, dims, threads, workDir);
  } else {
    await renderWithStaticImages(opts, mergedAudioPath, dims, threads, workDir);
  }

  return opts.outputPath;
}

async function renderWithStaticImages(
  opts: RenderOptions,
  mergedAudioPath: string,
  dims: string,
  threads: number,
  workDir: string
): Promise<void> {
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
    "-preset", "veryfast",
    "-crf", "23",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "128k",
    "-shortest",
    "-threads", String(threads),
    "-movflags", "+faststart",
    opts.outputPath,
  ]);
}

async function renderWithVideoBackground(
  opts: RenderOptions,
  mergedAudioPath: string,
  dims: string,
  threads: number,
  workDir: string
): Promise<void> {
  const bg = opts.videoBackgroundPath!;
  const totalDuration = opts.scenes.reduce((s, c) => s + c.durationSeconds, 0);

  let currentTime = 0;
  const overlayFilters: string[] = [];
  const inputs: string[] = [];

  inputs.push(bg);

  for (let i = 0; i < opts.scenes.length; i++) {
    const scene = opts.scenes[i];
    const out = `[t${i}]`;
    const prev = i === 0 ? "[0:v]" : `[t${i - 1}]`;
    overlayFilters.push(
      `${prev}[${i + 1}:v]overlay=enable='between(t,${currentTime.toFixed(2)},${(currentTime + scene.durationSeconds).toFixed(2)})'${out}`
    );
    inputs.push(scene.imagePath);
    currentTime += scene.durationSeconds;
  }

  const finalLabel = opts.scenes.length === 0 ? "[0:v]" : `[t${opts.scenes.length - 1}]`;
  const filterChain = overlayFilters.join(";");

  const ffmpegArgs: string[] = [
    "-y",
    "-stream_loop", "-1",
    "-i", bg,
  ];

  for (const scene of opts.scenes) {
    ffmpegArgs.push("-i", scene.imagePath);
  }

  ffmpegArgs.push("-i", mergedAudioPath);

  ffmpegArgs.push("-filter_complex",
    `[0:v]scale=${dims},setpts=PTS-STARTPTS,loop=-1:size=1[bgv];${filterChain.replace(/\[0:v\]/g, "[bgv]")}`);

  if (opts.scenes.length > 0) {
    ffmpegArgs.push("-map", finalLabel);
  } else {
    ffmpegArgs.push("-map", "[bgv]");
  }

  ffmpegArgs.push(
    "-map", `${opts.scenes.length + 1}:a`,
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "23",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "128k",
    "-t", totalDuration.toFixed(3),
    "-shortest",
    "-threads", String(threads),
    "-movflags", "+faststart",
    opts.outputPath,
  );

  await execFileAsync("ffmpeg", ffmpegArgs);
}

export async function cleanupWorkDir(workDir: string): Promise<void> {
  await execFileAsync("rm", ["-rf", workDir]);
}
