-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('MATHEMATICS', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'SCIENCE');

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "subjects" "Subject"[] DEFAULT ARRAY[]::"Subject"[];

-- Existing schools keep access to every subject they could already see.
UPDATE "schools" SET "subjects" = ARRAY['MATHEMATICS', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'SCIENCE']::"Subject"[];
