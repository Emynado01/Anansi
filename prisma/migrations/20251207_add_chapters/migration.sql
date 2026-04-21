-- Add chapter support and make top-level audio optional
ALTER TABLE "Audiobook" ALTER COLUMN "audioUrl" DROP NOT NULL;

CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "audiobookId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Chapter_audiobookId_order_idx" ON "Chapter"("audiobookId", "order");

ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_audiobookId_fkey" FOREIGN KEY ("audiobookId") REFERENCES "Audiobook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
