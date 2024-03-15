-- CreateEnum
CREATE TYPE "AlarmPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlarmConditionMode" AS ENUM ('EQUAL', 'NOT_EQUAL', 'GREATER_THAN', 'LESS_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL');

-- CreateTable
CREATE TABLE "Alarm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "priority" TEXT NOT NULL,
    "condition" JSONB NOT NULL,
    "group_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "metric_id" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL,
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "Alarm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlarmHistory" (
    "alarmId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged" BOOLEAN NOT NULL,
    "active" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "Roster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "retries" INTEGER NOT NULL,
    "timeBetweenRetries" INTEGER NOT NULL,
    "retired" BOOLEAN NOT NULL,

    CONSTRAINT "Roster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "rosterId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AlarmHistory_alarmId_timestamp_key" ON "AlarmHistory"("alarmId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "AlarmHistory" ADD CONSTRAINT "AlarmHistory_alarmId_fkey" FOREIGN KEY ("alarmId") REFERENCES "Alarm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "Roster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create Hypertable
SELECT create_hypertable('"AlarmHistory"', 'timestamp');
