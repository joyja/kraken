/*
  Warnings:

  - You are about to drop the column `userId` on the `ChartPage` table. All the data in the column will be lost.
  - Added the required column `description` to the `ChartPage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `ChartPage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChartPage" DROP CONSTRAINT "ChartPage_userId_fkey";

-- AlterTable
ALTER TABLE "ChartPage" DROP COLUMN "userId",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;
