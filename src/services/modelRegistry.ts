import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const CACHE_PATH = join(__dirname, "../../src/services/models.json");

export interface ModelEntry {
  id: string;
  score: number;
  testedAt: string;
}

const FALLBACK_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "google/gemma-4-26b-a4b-it:free",
  "openai/gpt-oss-20b:free",
];

function loadCache(): ModelEntry[] {
  try {
    if (existsSync(CACHE_PATH)) {
      return JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
    }
  } catch {}
  return [];
}

export function getFreeModels(): string[] {
  const cached = loadCache();
  if (cached.length >= 3) {
    return cached
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((m) => m.id);
  }
  return FALLBACK_MODELS;
}

export function saveCache(models: ModelEntry[]): void {
  writeFileSync(CACHE_PATH, JSON.stringify(models, null, 2), "utf-8");
}
