-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashed_password" TEXT NOT NULL,
    "hashed_refresh_token" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
