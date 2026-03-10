-- Add pest detection fields to Detection table
ALTER TABLE "Detection" ADD COLUMN IF NOT EXISTS "pest"            TEXT;
ALTER TABLE "Detection" ADD COLUMN IF NOT EXISTS "pestConfidence"  DOUBLE PRECISION;
ALTER TABLE "Detection" ADD COLUMN IF NOT EXISTS "pestSeverity"    TEXT;
ALTER TABLE "Detection" ADD COLUMN IF NOT EXISTS "pestDescription" TEXT;
ALTER TABLE "Detection" ADD COLUMN IF NOT EXISTS "pestTreatment"   TEXT;
ALTER TABLE "Detection" ADD COLUMN IF NOT EXISTS "pestPrevention"  TEXT;
