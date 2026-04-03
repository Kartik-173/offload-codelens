/**
 * Database Initialization Script
 * Creates keyspace and tables for ALB account settings
 */

const { Client } = require('cassandra-driver');

// Constants for Cassandra configuration
const CASSANDRA_CONFIG = {
  contactPoints: ['5.223.42.164'],
  port: 9042,
  datacenter: 'datacenter1',
  username: 'cassandra',
  password: 'CNJUSJDJDnalyTics',
  keyspace: 'codelens_alb'
};

async function init() {
  let client = null;
  
  try {
    console.log('🚀 Initializing Cassandra database...');
    
    console.log('🔧 Using config:', {
      contactPoints: CASSANDRA_CONFIG.contactPoints,
      datacenter: CASSANDRA_CONFIG.datacenter,
      keyspace: CASSANDRA_CONFIG.keyspace,
      username: CASSANDRA_CONFIG.username
    });
    
    // Connect without keyspace first
    client = new Client({
      contactPoints: CASSANDRA_CONFIG.contactPoints,
      localDataCenter: CASSANDRA_CONFIG.datacenter,
      credentials: {
        username: CASSANDRA_CONFIG.username,
        password: CASSANDRA_CONFIG.password
      }
    });

    await client.connect();
    console.log('✅ Connected to Cassandra');

    // Create keyspace
    const keyspaceQuery = `
      CREATE KEYSPACE IF NOT EXISTS ${CASSANDRA_CONFIG.keyspace}
      WITH REPLICATION = {
        'class': 'SimpleStrategy',
        'replication_factor': 1
      }
    `;
    await client.execute(keyspaceQuery);
    console.log('✅ Keyspace created:', CASSANDRA_CONFIG.keyspace);

    // Ensure replication factor is correct for single-node Cassandra
    const alterKeyspaceQuery = `
      ALTER KEYSPACE ${CASSANDRA_CONFIG.keyspace}
      WITH REPLICATION = {
        'class': 'SimpleStrategy',
        'replication_factor': 1
      }
    `;
    await client.execute(alterKeyspaceQuery);
    console.log('✅ Keyspace replication factor set to 1');

    // Switch to keyspace
    await client.execute(`USE ${CASSANDRA_CONFIG.keyspace}`);

    const dropColumnIfExists = async (tableName, columnName) => {
      const table = await client.metadata.getTable(CASSANDRA_CONFIG.keyspace, tableName);
      if (!table) return;
      if (!table.columns || !table.columns[columnName]) return;
      await client.execute(`ALTER TABLE ${tableName} DROP ${columnName}`);
    };

    // Cleanup obsolete auto-delete artifacts (without touching other data)
    await client.execute('DROP TABLE IF EXISTS alb_auto_delete_state');
    await dropColumnIfExists('alb_account_settings', 'auto_delete_enabled');
    await dropColumnIfExists('user_alb_preferences', 'auto_delete_enabled');

    // Create settings table
    const settingsTableQuery = `
      CREATE TABLE IF NOT EXISTS alb_account_settings (
        account_id TEXT PRIMARY KEY,
        auto_deregister_enabled BOOLEAN,
        email_from TEXT,
        email_to_emails LIST<TEXT>,
        email_notifications_enabled BOOLEAN,
        email_check_interval INT,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        updated_by TEXT,
        version BIGINT
      )
    `;
    await client.execute(settingsTableQuery);
    console.log('✅ Settings table created');

    // Create audit log table
    const auditTableQuery = `
      CREATE TABLE IF NOT EXISTS alb_action_audit_log (
        action_id UUID PRIMARY KEY,
        account_id TEXT,
        action_type TEXT,
        resource_type TEXT,
        resource_id TEXT,
        details TEXT,
        timestamp TIMESTAMP,
        success BOOLEAN,
        error_message TEXT
      )
    `;
    await client.execute(auditTableQuery);
    console.log('✅ Audit table created');

    // Create user ALB preferences table
    const userPreferencesTableQuery = `
      CREATE TABLE IF NOT EXISTS user_alb_preferences (
        user_id TEXT PRIMARY KEY,
        auto_deregister_enabled BOOLEAN,
        email_from TEXT,
        email_to_emails LIST<TEXT>,
        email_notifications_enabled BOOLEAN,
        email_check_interval INT,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        updated_by TEXT,
        version BIGINT
      )
    `;
    await client.execute(userPreferencesTableQuery);
    console.log('✅ User ALB preferences table created');

    // Create user target selections table
    const userTargetSelectionsTableQuery = `
      CREATE TABLE IF NOT EXISTS user_target_selections (
        user_id TEXT PRIMARY KEY,
        selected_targets TEXT,
        excluded_from_auto_deregister TEXT,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        updated_by TEXT,
        version BIGINT
      )
    `;
    await client.execute(userTargetSelectionsTableQuery);
    console.log('✅ User target selections table created');

    // Create auto deregister state table
    const autoDeregisterStateTableQuery = `
      CREATE TABLE IF NOT EXISTS alb_auto_deregister_state (
        account_id TEXT PRIMARY KEY,
        is_active BOOLEAN,
        last_run_at TIMESTAMP,
        next_run_at TIMESTAMP,
        total_processed INT,
        total_deregistered INT,
        total_excluded INT,
        selected_count INT,
        protected_count INT,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        run_status TEXT,
        error_message TEXT,
        config MAP<TEXT, TEXT>
      )
    `;
    await client.execute(autoDeregisterStateTableQuery);
    console.log('✅ Auto deregister state table created');

    console.log('🎉 Database initialization completed successfully!');
    console.log('📊 Tables created: alb_account_settings, alb_action_audit_log, user_alb_preferences, user_target_selections, alb_auto_deregister_state');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.shutdown();
      console.log('✅ Connection closed');
    }
  }
}

init();