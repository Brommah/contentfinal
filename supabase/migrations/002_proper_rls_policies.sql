-- ============================================
-- Proper Row Level Security (RLS) Policies
-- ============================================
-- This migration updates RLS policies to use proper authentication

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all for users" ON users;
DROP POLICY IF EXISTS "Allow all for workspaces" ON workspaces;
DROP POLICY IF EXISTS "Allow all for blocks" ON blocks;
DROP POLICY IF EXISTS "Allow all for connections" ON connections;
DROP POLICY IF EXISTS "Allow all for comments" ON comments;

-- ============================================
-- Users Table Policies
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow insert for new users (during signup)
CREATE POLICY "Allow insert for authenticated users"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- Workspaces Table Policies
-- ============================================

-- Users can read workspaces they own
CREATE POLICY "Users can read own workspaces"
  ON workspaces
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can create workspaces
CREATE POLICY "Users can create workspaces"
  ON workspaces
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can update their own workspaces
CREATE POLICY "Users can update own workspaces"
  ON workspaces
  FOR UPDATE
  USING (auth.uid() = owner_id);

-- Users can delete their own workspaces
CREATE POLICY "Users can delete own workspaces"
  ON workspaces
  FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================
-- Blocks Table Policies
-- ============================================

-- Users can read blocks in their workspaces
CREATE POLICY "Users can read blocks in own workspaces"
  ON blocks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = blocks.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- Users can create blocks in their workspaces
CREATE POLICY "Users can create blocks in own workspaces"
  ON blocks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- Users can update blocks in their workspaces
CREATE POLICY "Users can update blocks in own workspaces"
  ON blocks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = blocks.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- Users can delete blocks in their workspaces
CREATE POLICY "Users can delete blocks in own workspaces"
  ON blocks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = blocks.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- ============================================
-- Connections Table Policies
-- ============================================

-- Users can read connections in their workspaces
CREATE POLICY "Users can read connections in own workspaces"
  ON connections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = connections.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- Users can create connections in their workspaces
CREATE POLICY "Users can create connections in own workspaces"
  ON connections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- Users can update connections in their workspaces
CREATE POLICY "Users can update connections in own workspaces"
  ON connections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = connections.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- Users can delete connections in their workspaces
CREATE POLICY "Users can delete connections in own workspaces"
  ON connections
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = connections.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- ============================================
-- Comments Table Policies
-- ============================================

-- Users can read comments on blocks in their workspaces
CREATE POLICY "Users can read comments in own workspaces"
  ON comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blocks
      JOIN workspaces ON workspaces.id = blocks.workspace_id
      WHERE blocks.id = comments.block_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- Users can create comments on blocks in their workspaces
CREATE POLICY "Users can create comments in own workspaces"
  ON comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blocks
      JOIN workspaces ON workspaces.id = blocks.workspace_id
      WHERE blocks.id = block_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON comments
  FOR UPDATE
  USING (auth.uid() = author_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON comments
  FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- Service Role Bypass (for server-side operations)
-- ============================================
-- Note: The service role key bypasses RLS by default.
-- For demo/anonymous access, you can create a public policy:

-- Optional: Allow anonymous read access to demo workspace (for demos)
-- Uncomment if you want public demo access
-- CREATE POLICY "Allow anonymous read for demo workspace"
--   ON blocks
--   FOR SELECT
--   USING (workspace_id = 'demo-workspace-id');


