-- Teams: Add settings
ALTER TABLE teams ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{ "statuses": ["未着手", "進行中", "完了"], "custom_fields": [] }';

-- Clients: Add credentials and resources
ALTER TABLE clients ADD COLUMN IF NOT EXISTS credentials JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '[]';

-- Tasks: Add workflow_status, parent_id, is_milestone, is_private
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workflow_status TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES tasks(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_milestone BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
