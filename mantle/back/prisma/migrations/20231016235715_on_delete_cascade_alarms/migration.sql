-- DropForeignKey
ALTER TABLE "AlarmHistory" DROP CONSTRAINT "AlarmHistory_alarmId_fkey";

-- AddForeignKey
ALTER TABLE "AlarmHistory" ADD CONSTRAINT "AlarmHistory_alarmId_fkey" FOREIGN KEY ("alarmId") REFERENCES "Alarm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
