-- Add per-platform engagement columns to PublishedContent
ALTER TABLE "PublishedContent" ADD COLUMN IF NOT EXISTS "facebookEngagement" DOUBLE PRECISION;
ALTER TABLE "PublishedContent" ADD COLUMN IF NOT EXISTS "instagramEngagement" DOUBLE PRECISION;
