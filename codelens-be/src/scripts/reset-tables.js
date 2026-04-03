/**
 * Reset/Clear ALB Tables Script
 * Clears all data from ALB account settings tables
 */

const { Client } = require('cassandra-driver');
const config = require('../config/env');

async function resetTables() {
  let client = null;
  
  try {
    console.log('🗑️ Resetting ALB tables...');
    
    // Use the same configuration as init-db.js and cassandra.js
    const cassandraConfig = {
      contactPoints: config.cassandra?.contactPoints ? config.cassandra.contactPoints.split(',') : ['5.223.42.164'],
      localDataCenter: config.cassandra?.datacenter || 'datacenter1',
      credentials: {
        username: config.cassandra?.username || 'cassandra',
        password: config.cassandra?.password || 'CNJUSJDJDnalyTics'
      },
      protocolOptions: {
        port: Number(config.cassandra?.port) || 9042
      }
    };
    
    client = new Client(cassandraConfig);

    await client.connect();
    console.log('✅ Connected to Cassandra');

    // Switch to keyspace
    await client.execute(`USE ${config.cassandra?.keyspace || 'codelens_alb'}`);
    console.log('✅ Using keyspace:', config.cassandra?.keyspace || 'codelens_alb');

    // Clear all data from tables
    await client.execute('TRUNCATE TABLE alb_account_settings');
    console.log('✅ Cleared alb_account_settings table');
    
    await client.execute('TRUNCATE TABLE alb_action_audit_log');
    console.log('✅ Cleared alb_action_audit_log table');
    
    await client.execute('TRUNCATE TABLE alb_auto_deregister_state');
    console.log('✅ Cleared alb_auto_deregister_state table');
    
    await client.execute('TRUNCATE TABLE user_target_selections');
    console.log('✅ Cleared user_target_selections table');

    console.log('🎉 All ALB tables cleared successfully!');
    
  } catch (error) {
    console.error('❌ Failed to reset tables:', error);
    throw error;
  } finally {
    if (client) {
      await client.shutdown();
      console.log('✅ Connection closed');
    }
  }
}

resetTables();
