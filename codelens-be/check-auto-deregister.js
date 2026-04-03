const AlbAutoDeregisterState = require('./src/models/albAutoDeregisterState');

async function checkAutoDeregisterStatus() {
  try {
    console.log('🔍 Checking auto-deregister status...\n');
    
    // Get all active states
    const activeStates = await AlbAutoDeregisterState.getAllActive();
    console.log(`📊 Found ${activeStates.length} active auto-deregister states:\n`);
    
    for (const state of activeStates) {
      console.log(`🔸 Account: ${state.accountId}`);
      console.log(`   - Active: ${state.isActive}`);
      console.log(`   - Status: ${state.runStatus}`);
      console.log(`   - Last Run: ${state.lastRunAt}`);
      console.log(`   - Next Run: ${state.nextRunAt}`);
      console.log(`   - Total Processed: ${state.totalProcessed}`);
      console.log(`   - Total Deregistered: ${state.totalDeregistered}`);
      console.log(`   - Error: ${state.errorMessage || 'None'}`);
      console.log(`   - Config:`, JSON.stringify(state.config, null, 2));
      console.log('');
    }
    
    // Check specific account
    const testAccount = await AlbAutoDeregisterState.getByAccountId('654654634301');
    if (testAccount) {
      console.log('🎯 Specific account 654654634301:');
      console.log('   - Next run due:', testAccount.nextRunAt);
      console.log('   - Is due now?', new Date(testAccount.nextRunAt) <= new Date());
      console.log('   - Minutes until next run:', Math.max(0, Math.ceil((new Date(testAccount.nextRunAt) - new Date()) / 60000)));
    } else {
      console.log('❌ No auto-deregister state found for account 654654634301');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAutoDeregisterStatus();
