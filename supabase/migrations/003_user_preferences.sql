-- ============================================
-- User Preferences Table
-- ============================================
-- Stores user-specific settings that were previously in localStorage

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Theme preferences
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'system')),
  
  -- Sidebar preferences
  sidebar_width INT DEFAULT 320,
  left_sidebar_open BOOLEAN DEFAULT TRUE,
  right_sidebar_open BOOLEAN DEFAULT TRUE,
  
  -- Tour/onboarding state
  completed_tours TEXT[] DEFAULT '{}',
  seen_actions TEXT[] DEFAULT '{}',
  visited_tabs TEXT[] DEFAULT '{}',
  
  -- Notification preferences
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  
  -- UI state
  last_active_tab TEXT DEFAULT 'home',
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id)
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update trigger
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Wireframe Section States Table
-- ============================================
-- Stores wireframe section statuses per workspace

CREATE TABLE wireframe_section_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  status TEXT DEFAULT 'not_started',
  notes TEXT,
  linked_block_ids TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(workspace_id, section_id)
);

CREATE INDEX idx_wireframe_section_states_workspace_id ON wireframe_section_states(workspace_id);

-- Enable RLS
ALTER TABLE wireframe_section_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read wireframe states in own workspaces"
  ON wireframe_section_states
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = wireframe_section_states.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create wireframe states in own workspaces"
  ON wireframe_section_states
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update wireframe states in own workspaces"
  ON wireframe_section_states
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = wireframe_section_states.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete wireframe states in own workspaces"
  ON wireframe_section_states
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = wireframe_section_states.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- Auto-update trigger
CREATE TRIGGER update_wireframe_section_states_updated_at
  BEFORE UPDATE ON wireframe_section_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


