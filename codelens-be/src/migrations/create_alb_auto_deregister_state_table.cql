-- Create ALB Auto Deregister State Table
CREATE TABLE IF NOT EXISTS alb_auto_deregister_state (
    account_id text PRIMARY KEY,
    is_active boolean,
    last_run_at timestamp,
    next_run_at timestamp,
    total_processed int,
    total_deregistered int,
    total_excluded int,
    selected_count int,
    protected_count int,
    created_at timestamp,
    updated_at timestamp,
    run_status text,
    error_message text,
    config map<text, text>
);

-- Create index for active states
CREATE INDEX IF NOT EXISTS idx_alb_auto_deregister_state_active ON alb_auto_deregister_state (is_active);

-- Create index for run status
CREATE INDEX IF NOT EXISTS idx_alb_auto_deregister_state_status ON alb_auto_deregister_state (run_status);

-- Create index for next run time
CREATE INDEX IF NOT EXISTS idx_alb_auto_deregister_state_next_run ON alb_auto_deregister_state (next_run_at);
