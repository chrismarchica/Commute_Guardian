-- Database initialization script for Commute Guardian
-- This script runs when the PostgreSQL container starts for the first time

-- Create database (if not exists - though docker-compose creates it)
-- CREATE DATABASE IF NOT EXISTS commute_guardian;

-- Set up extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a user for the application (optional - using postgres user for simplicity)
-- CREATE USER commute_guardian WITH PASSWORD 'commute_guardian_password';
-- GRANT ALL PRIVILEGES ON DATABASE commute_guardian TO commute_guardian;

-- Set timezone
SET timezone = 'America/New_York';

-- Create any initial configuration tables or data
-- (The main schema will be created by Flyway migrations)

-- Log the initialization
DO $$
BEGIN
    RAISE NOTICE 'Commute Guardian database initialized at %', NOW();
END $$;
