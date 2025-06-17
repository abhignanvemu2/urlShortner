-- Initialize PostgreSQL database for URL Shortener
-- This file is used by Docker to set up the initial database

-- Create database if it doesn't exist (handled by Docker environment variables)
-- The database name is set via POSTGRES_DB environment variable

-- Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better text search performance
-- These will be created by migrations, but having them here as reference

-- Note: The actual table creation is handled by Sequelize migrations
-- This file is mainly for PostgreSQL extensions and initial setup