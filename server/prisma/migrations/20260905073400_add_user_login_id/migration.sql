-- Add the required login identifier to the empty User table.
ALTER TABLE "User" ADD COLUMN "loginId" TEXT NOT NULL;

CREATE UNIQUE INDEX "User_loginId_key" ON "User"("loginId");
