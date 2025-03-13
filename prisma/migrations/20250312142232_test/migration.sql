/*
  Warnings:

  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mobile_no]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mobile_no` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
DROP COLUMN "emailVerified",
ADD COLUMN     "isPhoneNoVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mobile_no" TEXT NOT NULL,
ADD COLUMN     "phoneNoVerified" TIMESTAMP(3),
ALTER COLUMN "role" SET DEFAULT 'USER';

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_no_key" ON "User"("mobile_no");
