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
    "facebookVideoId" TEXT,
    "instagramMediaId" TEXT,
    "threadsPostId" TEXT,
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

-- CreateTable
CREATE TABLE "PublishExperiment" (
    "id" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "scheduledHour" INTEGER NOT NULL,
    "scheduledMinute" INTEGER NOT NULL DEFAULT 0,
    "isExperimental" BOOLEAN NOT NULL DEFAULT false,
    "publishedContentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishExperiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentResult" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "watchTimeMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION,
    "subscribersGained" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ExperimentResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlotScore" (
    "id" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "hour" INTEGER NOT NULL,
    "minute" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "lastAnalyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeSlotScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishReport" (
    "id" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalVideos" INTEGER NOT NULL DEFAULT 0,
    "experimentsCount" INTEGER NOT NULL DEFAULT 0,
    "bestHour" INTEGER,
    "worstHour" INTEGER,
    "avgPerformanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "improvementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recommendations" JSONB,
    "detailedData" JSONB,

    CONSTRAINT "PublishReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReadingProgress_contentType_key" ON "ReadingProgress"("contentType");

-- CreateIndex
CREATE INDEX "PublishedContent_status_idx" ON "PublishedContent"("status");

-- CreateIndex
CREATE INDEX "PublishedContent_contentType_publishedAt_idx" ON "PublishedContent"("contentType", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuotaUsage_date_key" ON "QuotaUsage"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PublishExperiment_publishedContentId_key" ON "PublishExperiment"("publishedContentId");

-- CreateIndex
CREATE INDEX "PublishExperiment_contentType_scheduledHour_idx" ON "PublishExperiment"("contentType", "scheduledHour");

-- CreateIndex
CREATE INDEX "PublishExperiment_createdAt_idx" ON "PublishExperiment"("createdAt");

-- CreateIndex
CREATE INDEX "PublishExperiment_isExperimental_idx" ON "PublishExperiment"("isExperimental");

-- CreateIndex
CREATE UNIQUE INDEX "ExperimentResult_experimentId_key" ON "ExperimentResult"("experimentId");

-- CreateIndex
CREATE INDEX "ExperimentResult_analyzedAt_idx" ON "ExperimentResult"("analyzedAt");

-- CreateIndex
CREATE INDEX "TimeSlotScore_contentType_performanceScore_idx" ON "TimeSlotScore"("contentType", "performanceScore");

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlotScore_contentType_hour_minute_key" ON "TimeSlotScore"("contentType", "hour", "minute");

-- CreateIndex
CREATE INDEX "PublishReport_reportType_periodStart_idx" ON "PublishReport"("reportType", "periodStart");

-- AddForeignKey
ALTER TABLE "PublishExperiment" ADD CONSTRAINT "PublishExperiment_publishedContentId_fkey" FOREIGN KEY ("publishedContentId") REFERENCES "PublishedContent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentResult" ADD CONSTRAINT "ExperimentResult_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "PublishExperiment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

