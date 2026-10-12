-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "account_email" VARCHAR(254),
ADD COLUMN     "account_phone" VARCHAR(20),
ADD COLUMN     "password_hash" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "schools_account_email_key" ON "schools"("account_email");

-- CreateIndex
CREATE UNIQUE INDEX "schools_account_phone_key" ON "schools"("account_phone");
