-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "petFriendly" BOOLEAN NOT NULL,
    "smallDogOnly" BOOLEAN NOT NULL DEFAULT false,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "imageUrl" TEXT,
    "source" TEXT NOT NULL,
    "sourceTier" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
