/*
  Warnings:

  - A unique constraint covering the columns `[googleid]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "googleid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleid_key" ON "User"("googleid");
