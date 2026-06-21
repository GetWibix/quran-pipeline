/**
 * fileServer.ts
 * سيرفر HTTP بسيط لخدمة ملفات الفيديو للمنصات اللي تحتاج رابط عام (Instagram + Threads)
 *
 * بيشتغل كـ PM2 process مستقل (خفيف جداً):
 *   pm2 start dist/services/fileServer.js --name quran-file-server
 *
 * متطلبات (env vars):
 *   FILE_SERVER_PORT — المنفذ (default: 3456)
 *   FILE_SERVER_BASE — رابط السيرفر من برا (مثال: http://1.2.3.4:3456)
 *     إذا محددش، كيجرب يكتشف الـ IP تلقائياً
 */

import { createServer } from "http";
import { createReadStream, existsSync } from "fs";
import { extname, join, normalize } from "path";

const PORT = parseInt(process.env.FILE_SERVER_PORT || "3456", 10);
const VIDEOS_DIR = normalize(join(__dirname, "../../assets/videos"));

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
};

const server = createServer((req, res) => {
  // نسمح فقط بطلبات GET
  if (req.method !== "GET") {
    res.writeHead(405);
    return res.end("Method Not Allowed");
  }

  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  // نتأكد أن الطلب على /v/ فقط (حماية من path traversal)
  if (!pathname.startsWith("/v/")) {
    res.writeHead(404);
    return res.end("Not Found");
  }

  const filename = pathname.replace("/v/", "");
  // نمنع path traversal (مثلاً ../../etc/passwd)
  if (filename.includes("..") || filename.includes("/")) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  const filePath = join(VIDEOS_DIR, filename);

  if (!existsSync(filePath)) {
    res.writeHead(404);
    return res.end("File Not Found");
  }

  const ext = extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Disposition": `inline; filename="${filename}"`,
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Access-Control-Allow-Origin": "*",
  });

  const stream = createReadStream(filePath);
  stream.pipe(res);
  stream.on("error", () => {
    res.writeHead(500);
    res.end("Server Error");
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`📁 File Server شغال على المنفذ ${PORT}`);
  console.log(`📂 يخدم ملفات من: ${VIDEOS_DIR}`);
});

export function getFileServerBase(): string {
  const configured = process.env.FILE_SERVER_BASE;
  if (configured) return configured.replace(/\/+$/, "");

  // نحاول نكتشف IP السيرفر تلقائياً
  const os = require("os");
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return `http://${iface.address}:${PORT}`;
      }
    }
  }

  return `http://127.0.0.1:${PORT}`;
}

export function getVideoPublicUrl(filename: string): string {
  const base = getFileServerBase();
  return `${base}/v/${encodeURIComponent(filename)}`;
}
