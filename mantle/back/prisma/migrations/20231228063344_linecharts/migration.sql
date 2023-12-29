-- CreateTable
CREATE TABLE "ChartPage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ChartPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chart" (
    "id" TEXT NOT NULL,
    "chartPageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Chart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pen" (
    "id" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "Pen_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChartPage" ADD CONSTRAINT "ChartPage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chart" ADD CONSTRAINT "Chart_chartPageId_fkey" FOREIGN KEY ("chartPageId") REFERENCES "ChartPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pen" ADD CONSTRAINT "Pen_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "Chart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
