/*
  Warnings:

  - You are about to drop the column `rosterId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_rosterId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "rosterId";
