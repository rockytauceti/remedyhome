-- CreateTable
CREATE TABLE "CommunityRemedyStat" (
    "id" TEXT NOT NULL,
    "remedyId" TEXT NOT NULL,
    "totalCases" INTEGER NOT NULL DEFAULT 0,
    "workedCases" INTEGER NOT NULL DEFAULT 0,
    "partialCases" INTEGER NOT NULL DEFAULT 0,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityRemedyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityRemedyStat_remedyId_key" ON "CommunityRemedyStat"("remedyId");

-- AddForeignKey
ALTER TABLE "CommunityRemedyStat" ADD CONSTRAINT "CommunityRemedyStat_remedyId_fkey" FOREIGN KEY ("remedyId") REFERENCES "Remedy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
