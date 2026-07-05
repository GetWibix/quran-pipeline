-- Add performance indexes for common queries

CREATE INDEX IF NOT EXISTS "PublishedContent_facebookVideoId_idx" ON "PublishedContent"("facebookVideoId");
CREATE INDEX IF NOT EXISTS "PublishedContent_youtubeVideoId_idx" ON "PublishedContent"("youtubeVideoId");
CREATE INDEX IF NOT EXISTS "PublishedContent_publishedAt_idx" ON "PublishedContent"("publishedAt");
CREATE INDEX IF NOT EXISTS "PublishedContent_status_publishedAt_idx" ON "PublishedContent"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "PublishExperiment_createdAt_idx" ON "PublishExperiment"("createdAt");
