-- SQL to drop tables, ensuring foreign key dependencies are handled.
-- This script is intended to be run before applying a new schema.

DROP TABLE IF EXISTS pending_point_claims CASCADE;
DROP TABLE IF EXISTS offer_products CASCADE;
DROP TABLE IF EXISTS redemptions CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_store_memberships CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
