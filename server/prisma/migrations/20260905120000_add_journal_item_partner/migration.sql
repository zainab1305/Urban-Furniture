ALTER TABLE "JournalItem" ADD COLUMN IF NOT EXISTS "partnerId" TEXT;

CREATE INDEX IF NOT EXISTS "JournalItem_partnerId_idx" ON "JournalItem"("partnerId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'JournalItem_partnerId_fkey'
  ) THEN
    ALTER TABLE "JournalItem"
      ADD CONSTRAINT "JournalItem_partnerId_fkey"
      FOREIGN KEY ("partnerId") REFERENCES "Contact"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
