-- Install TimescaleDB if not insalled
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- CreateTable
CREATE TABLE "History" (
    "group_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "metric_id" TEXT NOT NULL,
    "int_value" INTEGER NOT NULL,
    "float_value" DOUBLE PRECISION NOT NULL,
    "string_value" TEXT NOT NULL,
    "bool_value" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "History_group_id_node_id_device_id_metric_id_timestamp_key" ON "History"("group_id", "node_id", "device_id", "metric_id", "timestamp");

-- Create Hypertable
SELECT create_hypertable('"History"', 'timestamp');
