-- CreateTable
CREATE TABLE "MateriaMedica" (
    "id" TEXT NOT NULL,
    "remedyId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "fullText" TEXT NOT NULL,
    "keynotes" TEXT,

    CONSTRAINT "MateriaMedica_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MateriaMedica_remedyId_idx" ON "MateriaMedica"("remedyId");

-- CreateIndex
CREATE UNIQUE INDEX "MateriaMedica_remedyId_sourceId_key" ON "MateriaMedica"("remedyId", "sourceId");

-- AddForeignKey
ALTER TABLE "MateriaMedica" ADD CONSTRAINT "MateriaMedica_remedyId_fkey" FOREIGN KEY ("remedyId") REFERENCES "Remedy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MateriaMedica" ADD CONSTRAINT "MateriaMedica_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
