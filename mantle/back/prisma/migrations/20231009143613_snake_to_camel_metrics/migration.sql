/*
  Warnings:

  - You are about to drop the column `device_id` on the `Alarm` table. All the data in the column will be lost.
  - You are about to drop the column `group_id` on the `Alarm` table. All the data in the column will be lost.
  - You are about to drop the column `metric_id` on the `Alarm` table. All the data in the column will be lost.
  - You are about to drop the column `node_id` on the `Alarm` table. All the data in the column will be lost.
  - You are about to drop the column `bool_value` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `device_id` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `float_value` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `group_id` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `int_value` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `metric_id` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `node_id` on the `History` table. All the data in the column will be lost.
  - You are about to drop the column `string_value` on the `History` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[groupId,nodeId,deviceId,metricId,timestamp]` on the table `History` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deviceId` to the `Alarm` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupId` to the `Alarm` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metricId` to the `Alarm` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nodeId` to the `Alarm` table without a default value. This is not possible if the table is not empty.
  - Added the required column `boolValue` to the `History` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deviceId` to the `History` table without a default value. This is not possible if the table is not empty.
  - Added the required column `floatValue` to the `History` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupId` to the `History` table without a default value. This is not possible if the table is not empty.
  - Added the required column `intValue` to the `History` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metricId` to the `History` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nodeId` to the `History` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stringValue` to the `History` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "History_group_id_node_id_device_id_metric_id_timestamp_key";

-- AlterTable
ALTER TABLE "Alarm" DROP COLUMN "device_id",
DROP COLUMN "group_id",
DROP COLUMN "metric_id",
DROP COLUMN "node_id",
ADD COLUMN     "deviceId" TEXT NOT NULL,
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD COLUMN     "metricId" TEXT NOT NULL,
ADD COLUMN     "nodeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "History" DROP COLUMN "bool_value",
DROP COLUMN "device_id",
DROP COLUMN "float_value",
DROP COLUMN "group_id",
DROP COLUMN "int_value",
DROP COLUMN "metric_id",
DROP COLUMN "node_id",
DROP COLUMN "string_value",
ADD COLUMN     "boolValue" BOOLEAN NOT NULL,
ADD COLUMN     "deviceId" TEXT NOT NULL,
ADD COLUMN     "floatValue" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD COLUMN     "intValue" INTEGER NOT NULL,
ADD COLUMN     "metricId" TEXT NOT NULL,
ADD COLUMN     "nodeId" TEXT NOT NULL,
ADD COLUMN     "stringValue" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "History_groupId_nodeId_deviceId_metricId_timestamp_key" ON "History"("groupId", "nodeId", "deviceId", "metricId", "timestamp");
