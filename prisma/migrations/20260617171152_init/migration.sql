-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('SHORT', 'LONG_VIDEO');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'PUBLISHED', 'FAILED');

-- CreateTable
CREATE TABLE "ReadingProgress" (
    "id" SERIAL NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "currentSurah" INTEGER NOT NULL DEFAULT 1,
    "currentAyah" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishedContent" (
    "id" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "surahNumber" INTEGER NOT NULL,
    "fromAyah" INTEGER NOT NULL,
    "toAyah" INTEGER NOT NULL,
    "reciter" TEXT NOT NULL,
    "videoFilePath" TEXT,
    "youtubeVideoId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "watchTimeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentDecisionLog" (
    "id" TEXT NOT NULL,
    "decisionType" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "contextData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentDecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotaUsage" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "unitsUsed" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotaUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReadingProgress_contentType_key" ON "ReadingProgress"("contentType");

-- CreateIndex
CREATE INDEX "PublishedContent_status_idx" ON "PublishedContent"("status");

-- CreateIndex
CREATE INDEX "PublishedContent_contentType_publishedAt_idx" ON "PublishedContent"("contentType", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuotaUsage_date_key" ON "QuotaUsage"("date");
