-- AlterTable
ALTER TABLE "Alarm" ADD COLUMN     "rosterId" TEXT;

-- AlterTable
ALTER TABLE "AlarmHistory" ALTER COLUMN "acknowledged" SET DEFAULT true,
ALTER COLUMN "active" SET DEFAULT false;

-- CreateTable
CREATE TABLE "RosterEntry" (
    "id" TEXT NOT NULL,
    "rosterId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sms" BOOLEAN NOT NULL,
    "email" BOOLEAN NOT NULL,
    "phone" BOOLEAN NOT NULL,

    CONSTRAINT "RosterEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Alarm" ADD CONSTRAINT "Alarm_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "Roster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterEntry" ADD CONSTRAINT "RosterEntry_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "Roster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterEntry" ADD CONSTRAINT "RosterEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
