-- Content Visualizer Database Schema for Supabase
-- Migrated from Prisma to Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM Types
-- ============================================

CREATE TYPE block_type AS ENUM (
  'COMPANY',
  'CORE_VALUE_PROP',
  'PAIN_POINT',
  'SOLUTION',
  'FEATURE',
  'VERTICAL',
  'ARTICLE',
  'TECH_COMPONENT'
);

CREATE TYPE company AS ENUM (
  'CERE',
  'CEF',
  'SHARED'
);

CREATE TYPE block_status AS ENUM (
  'LIVE',
  'VISION',
  'DRAFT',
  'ARCHIVED',
  'PENDING_REVIEW',
  'APPROVED',
  'NEEDS_CHANGES'
);

CREATE TYPE relationship_type AS ENUM (
  'FLOWS_INTO',
  'SOLVES',
  'DEPENDS_ON',
  'REFERENCES',
  'ENABLES',
  'PART_OF'
);

-- ============================================
-- Users Table
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- Workspaces Table
-- ============================================

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  viewport_x FLOAT DEFAULT 0 NOT NULL,
  viewport_y FLOAT DEFAULT 0 NOT NULL,
  viewport_zoom FLOAT DEFAULT 1 NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id);

-- ============================================
-- Blocks Table
-- ============================================

CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type block_type NOT NULL,
  company company NOT NULL,
  status block_status DEFAULT 'DRAFT' NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT,
  tags TEXT[] DEFAULT '{}' NOT NULL,
  position_x FLOAT DEFAULT 0 NOT NULL,
  position_y FLOAT DEFAULT 0 NOT NULL,
  width FLOAT DEFAULT 280 NOT NULL,
  height FLOAT DEFAULT 120 NOT NULL,
  external_url TEXT,
  "order" INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES blocks(id) ON DELETE SET NULL
);

CREATE INDEX idx_blocks_workspace_id ON blocks(workspace_id);
CREATE INDEX idx_blocks_type ON blocks(type);
CREATE INDEX idx_blocks_company ON blocks(company);
CREATE INDEX idx_blocks_parent_id ON blocks(parent_id);

-- ============================================
-- Connections Table
-- ============================================

CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relationship_type relationship_type NOT NULL,
  label TEXT,
  animated BOOLEAN DEFAULT FALSE NOT NULL,
  style TEXT,
  from_block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  to_block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(from_block_id, to_block_id, relationship_type)
);

CREATE INDEX idx_connections_workspace_id ON connections(workspace_id);
CREATE INDEX idx_connections_from_block_id ON connections(from_block_id);
CREATE INDEX idx_connections_to_block_id ON connections(to_block_id);

-- ============================================
-- Comments Table
-- ============================================

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE NOT NULL,
  position_x FLOAT,
  position_y FLOAT,
  block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_comments_block_id ON comments(block_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (you can restrict later with proper auth)
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for workspaces" ON workspaces FOR ALL USING (true);
CREATE POLICY "Allow all for blocks" ON blocks FOR ALL USING (true);
CREATE POLICY "Allow all for connections" ON connections FOR ALL USING (true);
CREATE POLICY "Allow all for comments" ON comments FOR ALL USING (true);

-- ============================================
-- Updated At Trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocks_updated_at
  BEFORE UPDATE ON blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


