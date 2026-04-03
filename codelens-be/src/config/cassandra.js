const cassandra = require('cassandra-driver');
const config = require('./env');

// Cassandra configuration
const cassandraConfig = {
  contactPoints: config.cassandra?.contactPoints ? config.cassandra.contactPoints.split(',') : ['5.223.42.164'],
  localDataCenter: config.cassandra?.datacenter || 'datacenter1',
  keyspace: config.cassandra?.keyspace || 'codelens_alb',

  credentials: {
    username: config.cassandra?.username || 'cassandra',
    password: config.cassandra?.password || 'CNJUSJDJDnalyTics'
  },

  protocolOptions: {
    port: Number(config.cassandra?.port) || 9042
  },

  socketOptions: {
    connectTimeout: 5000,
    readTimeout: 12000,
    keepAlive: true
  },

  queryOptions: {
    consistency: cassandra.types.consistencies.quorum
  },

  pooling: {
    coreConnectionsPerHost: 2,
    maxRequestsPerConnection: 128,
    maxConcurrentRequestsPerConnection: 128
  },

  policies: {
    loadBalancing: new cassandra.policies.loadBalancing.DCAwareRoundRobinPolicy(
      config.cassandra?.datacenter || 'datacenter1'
    ),

    reconnection: new cassandra.policies.reconnection.ExponentialReconnectionPolicy(
      1000,
      600000 // 10 minutes
    )
  }
};

// Create client
const client = new cassandra.Client(cassandraConfig);

// Connect to Cassandra
const initializeCassandra = async () => {
  try {
    console.log('🔧 Connecting to Cassandra...');

    await client.connect();

    console.log('✅ Cassandra connected');

    // Create keyspace if not exists
    await createKeyspaceIfNotExists();

    // Create tables if not exists
    await createTablesIfNotExists();

    console.log('✅ Cassandra ready');
    return client;

  } catch (error) {
    console.error('❌ Cassandra connection failed:', error.message);
    return null;
  }
};

// Create keyspace
const createKeyspaceIfNotExists = async () => {
  const query = `
    CREATE KEYSPACE IF NOT EXISTS ${cassandraConfig.keyspace}
    WITH REPLICATION = {
      'class': 'SimpleStrategy',
      'replication_factor': 3
    }
  `;

  await client.execute(query);

  console.log(`✅ Keyspace ${cassandraConfig.keyspace} ready`);
};

// Create tables
const createTablesIfNotExists = async () => {
  const tables = [

    `
    CREATE TABLE IF NOT EXISTS alb_account_settings (
      account_id TEXT PRIMARY KEY,
      auto_deregister_enabled BOOLEAN,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      updated_by TEXT,
      version INT
    ) WITH default_time_to_live = 2592000
    `,

    `
    CREATE TABLE IF NOT EXISTS alb_action_audit_log (
      action_id UUID PRIMARY KEY,
      account_id TEXT,
      action_type TEXT,
      resource_type TEXT,
      resource_id TEXT,
      resource_arn TEXT,
      region TEXT,
      action_details TEXT,
      timestamp TIMESTAMP,
      success BOOLEAN,
      error_message TEXT,
      ip_address TEXT,
      user_agent TEXT
    ) WITH default_time_to_live = 7776000
    `,

    `
    CREATE TABLE IF NOT EXISTS user_target_selections (
      user_id TEXT PRIMARY KEY,
      selected_targets TEXT,
      excluded_from_auto_deregister TEXT,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      updated_by TEXT,
      version BIGINT
    ) WITH default_time_to_live = 2592000
    `,

    `
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
    `,
  ];

  for (const query of tables) {
    await client.execute(query);
  }

  console.log('✅ Tables ready');
};

// Graceful shutdown
const shutdownCassandra = async () => {
  try {
    await client.shutdown();
    console.log('✅ Cassandra connection closed');
  } catch (err) {
    console.error('❌ Shutdown error:', err.message);
  }
};

// Handle shutdown
process.on('SIGINT', shutdownCassandra);
process.on('SIGTERM', shutdownCassandra);

module.exports = {
  client,
  initializeCassandra,
  shutdownCassandra,
  createKeyspaceIfNotExists,
  createTablesIfNotExists
};
