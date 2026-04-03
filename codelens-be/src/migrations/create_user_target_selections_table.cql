-- User Target Selections Table
-- Stores user selections for targets and target groups, and exclusions from auto-deregistration

CREATE TABLE IF NOT EXISTS user_target_selections (
    user_id TEXT PRIMARY KEY,
    selected_targets LIST<FROZEN<STRUCT<
        target_id TEXT,
        port INT,
        target_group_arn TEXT,
        target_group_name TEXT,
        alb_name TEXT,
        region TEXT,
        selected_at TIMESTAMP,
        selected_by TEXT
    >>,
    excluded_from_auto_deregister LIST<FROZEN<STRUCT<
        target_id TEXT,
        port INT,
        target_group_arn TEXT,
        target_group_name TEXT,
        alb_name TEXT,
        region TEXT,
        added_at TIMESTAMP,
        added_by TEXT,
        reason TEXT
    >>,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    updated_by TEXT,
    version BIGINT
);

-- Create secondary index for querying excluded targets (if needed)
CREATE INDEX IF NOT EXISTS idx_user_target_selections_excluded_count 
ON user_target_selections (excluded_from_auto_deregister);

-- Sample queries for reference:
-- Get user selections: SELECT * FROM user_target_selections WHERE user_id = ?;
-- Check if target is excluded: SELECT excluded_from_auto_deregister FROM user_target_selections WHERE user_id = ?;
