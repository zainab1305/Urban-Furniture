ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "contactId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_contactId_key" ON "User"("contactId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_contactId_fkey'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_contactId_fkey"
      FOREIGN KEY ("contactId") REFERENCES "Contact"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
