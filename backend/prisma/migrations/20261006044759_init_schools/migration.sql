-- CreateEnum
CREATE TYPE "SchoolBoard" AS ENUM ('CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE', 'OTHER');

-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Program" AS ENUM ('INTEGRATED', 'ADVANCED', 'REVISED_ADVANCED', 'OLYMPIAD', 'OLYMPIAD_PRIMARY');

-- CreateTable
CREATE TABLE "schools" (
    "id" UUID NOT NULL,
    "serial" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "board" "SchoolBoard" NOT NULL,
    "status" "SchoolStatus" NOT NULL DEFAULT 'ACTIVE',
    "programs" "Program"[],
    "principal_name" VARCHAR(120),
    "contact_name" VARCHAR(120) NOT NULL,
    "contact_email" VARCHAR(254) NOT NULL,
    "contact_phone" VARCHAR(20) NOT NULL,
    "address_line" VARCHAR(300) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(6) NOT NULL,
    "student_strength" INTEGER,
    "notes" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_serial_key" ON "schools"("serial");

-- CreateIndex
CREATE INDEX "schools_status_idx" ON "schools"("status");

-- CreateIndex
CREATE INDEX "schools_board_idx" ON "schools"("board");

-- CreateIndex
CREATE INDEX "schools_created_at_idx" ON "schools"("created_at");
