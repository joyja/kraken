/*
  Warnings:

  - The `priority` column on the `Alarm` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Alarm" DROP COLUMN "priority",
ADD COLUMN     "priority" "AlarmPriority" NOT NULL DEFAULT 'LOW';
