-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "Habit" AS ENUM ('gym', 'wake_up_early', 'reading', 'coding', 'meditation');

-- CreateEnum
CREATE TYPE "HiveStatus" AS ENUM ('active', 'dissolved');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('reminder', 'dissolution', 'rematch', 'ai_suggestion');

-- CreateEnum
CREATE TYPE "AiInsightType" AS ENUM ('weekly_summary', 'suggestion', 'risk_score');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "habit" "Habit" NOT NULL,
    "timezone" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "preferred_checkin_time" TEXT NOT NULL,
    "current_hive_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hives" (
    "id" TEXT NOT NULL,
    "status" "HiveStatus" NOT NULL,
    "habit" "Habit" NOT NULL,
    "compatibility_score" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dissolved_at" TIMESTAMP(3),
    "dissolution_reason" TEXT,

    CONSTRAINT "hives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hive_members" (
    "id" TEXT NOT NULL,
    "hive_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "miss_count" INTEGER NOT NULL DEFAULT 0,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hive_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkins" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hive_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "text" TEXT,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "hive_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "AiInsightType" NOT NULL,
    "content" TEXT NOT NULL,
    "risk_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "hive_members_hive_id_user_id_idx" ON "hive_members"("hive_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "hive_members_hive_id_user_id_key" ON "hive_members"("hive_id", "user_id");

-- CreateIndex
CREATE INDEX "checkins_user_id_date_idx" ON "checkins"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "checkins_user_id_date_key" ON "checkins"("user_id", "date");

-- CreateIndex
CREATE INDEX "messages_hive_id_idx" ON "messages"("hive_id");

-- CreateIndex
CREATE INDEX "messages_hive_id_created_at_idx" ON "messages"("hive_id", "created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_current_hive_id_fkey" FOREIGN KEY ("current_hive_id") REFERENCES "hives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hive_members" ADD CONSTRAINT "hive_members_hive_id_fkey" FOREIGN KEY ("hive_id") REFERENCES "hives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hive_members" ADD CONSTRAINT "hive_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_hive_id_fkey" FOREIGN KEY ("hive_id") REFERENCES "hives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_hive_id_fkey" FOREIGN KEY ("hive_id") REFERENCES "hives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
