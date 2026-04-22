-- Adds optional demographic buckets captured by the TUNE IT chips on the
-- landing page. All three columns are nullable — visitors who skip the
-- TUNE IT panel still produce valid lead rows, they just have NULL buckets.
--
-- Values are the human-readable bucket labels the visitor saw at the booth
-- (e.g. "25-34" / "175-185" / "60-75"), NOT the midpoint numbers we feed
-- into the routine generator. Storing the label means marketing can segment
-- on the exact buckets without re-binning, and we don't pretend to numeric
-- precision we never collected.
--
-- Idempotent — safe to re-run.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS age_range    TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS height_range TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS weight_range TEXT;

-- Optional: lightweight sanity check so a typo in the client can't pollute
-- the segmentation column. Comment out if you'd rather keep the schema
-- permissive and validate at the application layer.
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_age_range_chk,
  ADD CONSTRAINT leads_age_range_chk
    CHECK (age_range IS NULL OR age_range IN ('18-24','25-34','35-44','45-54','55+'));

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_height_range_chk,
  ADD CONSTRAINT leads_height_range_chk
    CHECK (height_range IS NULL OR height_range IN ('<165','165-175','175-185','185+'));

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_weight_range_chk,
  ADD CONSTRAINT leads_weight_range_chk
    CHECK (weight_range IS NULL OR weight_range IN ('<60','60-75','75-90','90-105','105+'));
