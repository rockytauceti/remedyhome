-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'FAMILY', 'PRACTITIONER');

-- CreateEnum
CREATE TYPE "Kingdom" AS ENUM ('PLANT', 'MINERAL', 'ANIMAL', 'NOSODE', 'OTHER');

-- CreateEnum
CREATE TYPE "Outcome" AS ENUM ('UNKNOWN', 'WORKED', 'PARTIAL', 'NO_EFFECT', 'AGGRAVATION', 'WRONG_REMEDY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "author" TEXT,
    "year" INTEGER,
    "description" TEXT,
    "isPublicDomain" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Remedy" (
    "id" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commonName" TEXT,
    "kingdom" "Kingdom",
    "description" TEXT,

    CONSTRAINT "Remedy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rubric" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "Rubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricRemedy" (
    "id" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "remedyId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,

    CONSTRAINT "RubricRemedy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourcePreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SourcePreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "remedyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "symptoms" TEXT NOT NULL,
    "potency" TEXT,
    "dosage" TEXT,
    "duration" TEXT,
    "outcome" "Outcome" NOT NULL DEFAULT 'UNKNOWN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileRemedyNote" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "remedyId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileRemedyNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Source_slug_key" ON "Source"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Remedy_abbreviation_key" ON "Remedy"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "Rubric_path_key" ON "Rubric"("path");

-- CreateIndex
CREATE INDEX "RubricRemedy_rubricId_idx" ON "RubricRemedy"("rubricId");

-- CreateIndex
CREATE INDEX "RubricRemedy_remedyId_idx" ON "RubricRemedy"("remedyId");

-- CreateIndex
CREATE UNIQUE INDEX "RubricRemedy_rubricId_remedyId_sourceId_key" ON "RubricRemedy"("rubricId", "remedyId", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "SourcePreference_userId_sourceId_key" ON "SourcePreference"("userId", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileRemedyNote_profileId_remedyId_key" ON "ProfileRemedyNote"("profileId", "remedyId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rubric" ADD CONSTRAINT "Rubric_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Rubric"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricRemedy" ADD CONSTRAINT "RubricRemedy_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricRemedy" ADD CONSTRAINT "RubricRemedy_remedyId_fkey" FOREIGN KEY ("remedyId") REFERENCES "Remedy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricRemedy" ADD CONSTRAINT "RubricRemedy_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourcePreference" ADD CONSTRAINT "SourcePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourcePreference" ADD CONSTRAINT "SourcePreference_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_remedyId_fkey" FOREIGN KEY ("remedyId") REFERENCES "Remedy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileRemedyNote" ADD CONSTRAINT "ProfileRemedyNote_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileRemedyNote" ADD CONSTRAINT "ProfileRemedyNote_remedyId_fkey" FOREIGN KEY ("remedyId") REFERENCES "Remedy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
