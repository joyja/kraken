/*
  Warnings:

  - Added the required column `x` to the `Chart` table without a default value. This is not possible if the table is not empty.
  - Added the required column `y` to the `Chart` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Chart" ADD COLUMN     "x" JSONB NOT NULL,
ADD COLUMN     "y" JSONB NOT NULL;
