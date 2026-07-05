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
  videoBackgroundPath?: string; // خلفية واحدة (قديم/للمطابقة)
  videoBackgroundPaths?: string[]; // خلفية لكل مشهد
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

  if (opts.videoBackgroundPaths && opts.videoBackgroundPaths.length > 0) {
    await renderWithMultiBackgrounds(opts, mergedAudioPath, dims, threads, workDir);
  } else if (opts.videoBackgroundPath) {
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
    "-an",
    "-i", bg,
  ];

  for (const scene of opts.scenes) {
    ffmpegArgs.push("-i", scene.imagePath);
  }

  ffmpegArgs.push("-i", mergedAudioPath);

  ffmpegArgs.push("-filter_complex",
    `[0:v]scale=${dims},setpts=PTS-STARTPTS[bgv];${filterChain.replace(/\[0:v\]/g, "[bgv]")}`);

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

/**
 * رندر بمشاهد متعددة، لكل مشهد خلفية فيديو مختلفة + الصورة بتاعته
 * كيقلل الضغط مقارنة بالطريقة القديمة (بدون enable='between(t,...)')
 */
async function renderWithMultiBackgrounds(
  opts: RenderOptions,
  mergedAudioPath: string,
  dims: string,
  threads: number,
  workDir: string
): Promise<void> {
  const bgs = opts.videoBackgroundPaths!;
  const n = opts.scenes.length;
  const concatSegments: string[] = [];

  const ffmpegArgs: string[] = ["-y"];

  // نجيب كل فيديوهات الخلفية + صور المشاهد
  for (let i = 0; i < n; i++) {
    const bgIdx = i < bgs.length ? i : Math.floor(Math.random() * bgs.length);
    ffmpegArgs.push("-stream_loop", "-1", "-an", "-i", bgs[bgIdx]);
    ffmpegArgs.push("-i", opts.scenes[i].imagePath);
  }

  ffmpegArgs.push("-i", mergedAudioPath);

  // نبني filter complex: trim + scale لكل خلفية → overlay مع الصورة
  const filterParts: string[] = [];
  const inputLabels: string[] = [];

  for (let i = 0; i < n; i++) {
    const bgIn = i * 2;          // مدخل الخلفية (0,2,4,...)
    const imgIn = i * 2 + 1;     // مدخل الصورة (1,3,5,...)
    const bgTrimmed = `[bg${i}]`;
    const segLabel = `[s${i}]`;
    const dur = opts.scenes[i].durationSeconds.toFixed(3);

    filterParts.push(
      `[${bgIn}:v]trim=duration=${dur},setpts=PTS-STARTPTS,scale=${dims}[bg${i}t]`
    );
    filterParts.push(
      `[bg${i}t][${imgIn}:v]overlay${segLabel}`
    );
    inputLabels.push(segLabel);
  }

  // concat كل المشاهد
  const concatLabel = inputLabels.join("");
  filterParts.push(
    `${concatLabel}concat=n=${n}:v=1:a=0[final_v]`
  );

  ffmpegArgs.push("-filter_complex", filterParts.join(";"));

  ffmpegArgs.push("-map", "[final_v]");
  ffmpegArgs.push("-map", `${2 * n}:a`);
  ffmpegArgs.push(
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
  );

  await execFileAsync("ffmpeg", ffmpegArgs);
}

export async function cleanupWorkDir(workDir: string): Promise<void> {
  await execFileAsync("rm", ["-rf", workDir]);
}
