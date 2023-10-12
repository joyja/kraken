/*
  Warnings:

  - A unique constraint covering the columns `[alarmId,timestamp,acknowledged,active]` on the table `AlarmHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "AlarmHistory_alarmId_timestamp_key";

-- CreateIndex
CREATE UNIQUE INDEX "AlarmHistory_alarmId_timestamp_acknowledged_active_key" ON "AlarmHistory"("alarmId", "timestamp", "acknowledged", "active");
