-- Migration: Add store theme colors table
-- Created: 2025-01-07
-- Description: Creates a table to store customizable theme colors for the website store

-- Create store_theme_colors table
CREATE TABLE IF NOT EXISTS store_theme_colors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  primary_color TEXT NOT NULL DEFAULT '#5d1f1f',
  primary_hover_color TEXT NOT NULL DEFAULT '#4A1616',
  is_active BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE store_theme_colors ENABLE ROW LEVEL SECURITY;

-- Allow all users to read theme colors (needed for public website)
CREATE POLICY "Anyone can view theme colors"
  ON store_theme_colors
  FOR SELECT
  USING (true);

-- Only authenticated users can insert/update/delete theme colors
CREATE POLICY "Authenticated users can manage theme colors"
  ON store_theme_colors
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Insert default red theme
INSERT INTO store_theme_colors (name, primary_color, primary_hover_color, is_active, is_default)
VALUES ('أحمر كلاسيكي', '#5d1f1f', '#4A1616', true, true)
ON CONFLICT (name) DO NOTHING;

-- Create function to ensure only one active theme at a time
CREATE OR REPLACE FUNCTION ensure_single_active_theme()
RETURNS TRIGGER AS $$
BEGIN
  -- If this theme is being set to active
  IF NEW.is_active = true THEN
    -- Deactivate all other themes
    UPDATE store_theme_colors
    SET is_active = false
    WHERE id != NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single active theme
DROP TRIGGER IF EXISTS trigger_ensure_single_active_theme ON store_theme_colors;
CREATE TRIGGER trigger_ensure_single_active_theme
  BEFORE INSERT OR UPDATE ON store_theme_colors
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_theme();

-- Create function to prevent deletion of default theme
CREATE OR REPLACE FUNCTION prevent_default_theme_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_default = true THEN
    RAISE EXCEPTION 'Cannot delete the default theme';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent default theme deletion
DROP TRIGGER IF EXISTS trigger_prevent_default_theme_deletion ON store_theme_colors;
CREATE TRIGGER trigger_prevent_default_theme_deletion
  BEFORE DELETE ON store_theme_colors
  FOR EACH ROW
  EXECUTE FUNCTION prevent_default_theme_deletion();

-- Add comments
COMMENT ON TABLE store_theme_colors IS 'Stores customizable theme colors for the website store';
COMMENT ON COLUMN store_theme_colors.name IS 'Display name of the theme (e.g., "أحمر كلاسيكي")';
COMMENT ON COLUMN store_theme_colors.primary_color IS 'Primary color used for headers, buttons, etc.';
COMMENT ON COLUMN store_theme_colors.primary_hover_color IS 'Darker shade used for hover states';
COMMENT ON COLUMN store_theme_colors.is_active IS 'Whether this theme is currently active';
COMMENT ON COLUMN store_theme_colors.is_default IS 'Whether this is the default theme (cannot be deleted)';
