-- Add imageUrls column to goods_offers table
ALTER TABLE "goods_offers" ADD COLUMN "imageUrls" TEXT[] DEFAULT '{}';

-- Verify
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'goods_offers';
