-- URL Shortener Database Schema
-- This file can be used to manually create the database schema

-- Create urls table
CREATE TABLE IF NOT EXISTS urls (
  id SERIAL PRIMARY KEY,
  short_code VARCHAR(20) NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  clicks INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_urls_updated_at ON urls;
CREATE TRIGGER update_urls_updated_at
    BEFORE UPDATE ON urls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Display table info
SELECT 'Database schema created successfully' AS status;
