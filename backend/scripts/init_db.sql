-- Database initialization script for IP-NFT Management System
-- Run this script as a PostgreSQL superuser to create the database and user

-- Create database user (if not exists)
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'ipnft_user') THEN
      CREATE ROLE ipnft_user LOGIN PASSWORD 'ipnft_password';
   END IF;
END
$do$;

-- Create database (run this separately if needed)
-- CREATE DATABASE ipnft_db OWNER ipnft_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ipnft_db TO ipnft_user;

-- Connect to ipnft_db and run the following:
-- GRANT ALL ON SCHEMA public TO ipnft_user;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO ipnft_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ipnft_user;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
