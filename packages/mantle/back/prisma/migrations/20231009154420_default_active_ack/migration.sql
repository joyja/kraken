-- AlterTable
ALTER TABLE "Alarm" ALTER COLUMN "acknowledged" SET DEFAULT true,
ALTER COLUMN "active" SET DEFAULT false;

-- AlterTable
ALTER TABLE "AlarmHistory" ALTER COLUMN "acknowledged" DROP DEFAULT,
ALTER COLUMN "active" DROP DEFAULT;
