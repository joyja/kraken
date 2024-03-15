-- DropForeignKey
ALTER TABLE "RosterEntry" DROP CONSTRAINT "RosterEntry_rosterId_fkey";

-- DropForeignKey
ALTER TABLE "RosterEntry" DROP CONSTRAINT "RosterEntry_userId_fkey";

-- AddForeignKey
ALTER TABLE "RosterEntry" ADD CONSTRAINT "RosterEntry_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "Roster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterEntry" ADD CONSTRAINT "RosterEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
