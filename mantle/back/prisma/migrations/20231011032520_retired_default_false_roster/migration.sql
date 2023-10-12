/*
  Warnings:

  - Added the required column `order` to the `RosterEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Roster" ALTER COLUMN "retired" SET DEFAULT false;

-- AlterTable
ALTER TABLE "RosterEntry" ADD COLUMN     "order" INTEGER NOT NULL;
