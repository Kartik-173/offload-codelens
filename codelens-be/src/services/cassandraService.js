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

class CassandraService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  // Connect to Cassandra
  async connect() {
    if (this.isConnected) {
      return;
    }

    try {
      this.client = new Client({
        contactPoints: CASSANDRA_CONFIG.contactPoints,
        localDataCenter: CASSANDRA_CONFIG.datacenter,
        credentials: {
          username: CASSANDRA_CONFIG.username,
          password: CASSANDRA_CONFIG.password
        }
      });

      await this.client.connect();
      await this.client.execute(`USE ${CASSANDRA_CONFIG.keyspace}`);
      this.isConnected = true;
      console.log('✅ Connected to Cassandra');
    } catch (error) {
      console.error('❌ Failed to connect to Cassandra:', error);
      throw error;
    }
  }

  // Insert data into table
  async insert(table, data) {
    await this.connect();
    
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map(() => '?').join(', ');
      
      const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      
      const result = await this.client.execute(query, values, { prepare: true });
      
      console.log(`✅ Data inserted into ${table}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to insert into ${table}:`, error);
      throw error;
    }
  }

  // Find one record by conditions
  async findOne(table, conditions) {
    await this.connect();
    
    try {
      const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
      const values = Object.values(conditions);
      
      const query = `SELECT * FROM ${table} WHERE ${whereClause}`;
      
      const result = await this.client.execute(query, values, { prepare: true });
      
      console.log(`✅ Found ${result.rowLength} records in ${table}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to find in ${table}:`, error);
      throw error;
    }
  }

  // Find all records by conditions
  async find(table, conditions = {}) {
    await this.connect();
    
    try {
      let query = `SELECT * FROM ${table}`;
      let values = [];
      
      if (Object.keys(conditions).length > 0) {
        const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
        values = Object.values(conditions);
        query += ` WHERE ${whereClause}`;
      }
      
      const result = await this.client.execute(query, values, { prepare: true });
      
      console.log(`✅ Found ${result.rowLength} records in ${table}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to find in ${table}:`, error);
      throw error;
    }
  }

  // Update record by conditions
  async update(table, conditions, updateData) {
    await this.connect();
    
    try {
      const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
      const values = [...Object.values(updateData), ...Object.values(conditions)];
      
      const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
      
      const result = await this.client.execute(query, values, { prepare: true });
      
      console.log(`✅ Data updated in ${table}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to update in ${table}:`, error);
      throw error;
    }
  }

  // Delete record by conditions
  async delete(table, conditions) {
    await this.connect();
    
    try {
      const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
      const values = Object.values(conditions);
      
      const query = `DELETE FROM ${table} WHERE ${whereClause}`;
      
      const result = await this.client.execute(query, values, { prepare: true });
      
      console.log(`✅ Data deleted from ${table}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to delete from ${table}:`, error);
      throw error;
    }
  }

  // Execute custom query
  async execute(query, values = []) {
    await this.connect();
    
    try {
      const result = await this.client.execute(query, values, { prepare: true });
      return result;
    } catch (error) {
      console.error('❌ Failed to execute query:', error);
      throw error;
    }
  }

  // Disconnect from Cassandra
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.shutdown();
      this.isConnected = false;
      console.log('✅ Disconnected from Cassandra');
    }
  }
}

module.exports = new CassandraService();
