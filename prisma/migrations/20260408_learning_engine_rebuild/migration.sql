-- CreateEnum
CREATE TYPE "LearningItemType" AS ENUM ('quiz', 'flashcard', 'match', 'remember', 'mini_game');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('VIEW', 'CORRECT', 'WRONG', 'SKIP', 'SAVE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "firebaseUid" TEXT NOT NULL,
    "targetExam" TEXT DEFAULT 'JEE',
    "preferredTopics" JSONB,
    "preferredDifficulty" INTEGER DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalGenerated" INTEGER NOT NULL DEFAULT 0,
    "totalCompleted" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" "LearningItemType" NOT NULL,
    "topic" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 2,
    "payload" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "masteredByUser" BOOLEAN NOT NULL DEFAULT false,
    "lastInteractedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedItem" (
    "id" TEXT NOT NULL,
    "learningItemId" TEXT NOT NULL,
    "publishedByUserId" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "learningItemId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "isCorrect" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "PushToken_token_key" ON "PushToken"("token");

-- CreateIndex
CREATE INDEX "LearningItem_userId_createdAt_idx" ON "LearningItem"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LearningItem_sessionId_createdAt_idx" ON "LearningItem"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "LearningItem_topic_difficulty_idx" ON "LearningItem"("topic", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "FeedItem_learningItemId_key" ON "FeedItem"("learningItemId");

-- CreateIndex
CREATE INDEX "FeedItem_publishedAt_idx" ON "FeedItem"("publishedAt");

-- CreateIndex
CREATE INDEX "UserInteraction_userId_createdAt_idx" ON "UserInteraction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserInteraction_learningItemId_type_idx" ON "UserInteraction"("learningItemId", "type");

-- AddForeignKey
ALTER TABLE "PushToken" ADD CONSTRAINT "PushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningItem" ADD CONSTRAINT "LearningItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningItem" ADD CONSTRAINT "LearningItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LearningSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedItem" ADD CONSTRAINT "FeedItem_learningItemId_fkey" FOREIGN KEY ("learningItemId") REFERENCES "LearningItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_learningItemId_fkey" FOREIGN KEY ("learningItemId") REFERENCES "LearningItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

