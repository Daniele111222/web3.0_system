\set ON_ERROR_STOP on
SELECT 'CREATE DATABASE ipnft_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ipnft_db')\gexec
\connect ipnft_db

\i ../create_tables.sql
