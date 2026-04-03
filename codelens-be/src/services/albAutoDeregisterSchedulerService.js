const AlbAutoDeregisterState = require('../models/albAutoDeregisterState');
const AlbAutoDeregisterService = require('./albAutoDeregisterService');
const { readAWSCreds } = require('../utils/vault');

class AlbAutoDeregisterSchedulerService {
  constructor() {
    this.intervalHandle = null;
    this.pollIntervalMs = 60 * 1000; // 1 minute
    this.isTickRunning = false;
    this.runningAccounts = new Set();
  }

  start(pollIntervalMs = null) {
    if (this.intervalHandle) {
      return { success: true, message: 'Scheduler already running' };
    }

    if (pollIntervalMs) {
      this.pollIntervalMs = pollIntervalMs;
    }

    console.log(`⏰ Auto-deregister scheduler starting (poll every ${Math.round(this.pollIntervalMs / 1000)}s)`);

    // Kick one tick immediately
    this.tick();

    this.intervalHandle = setInterval(() => {
      this.tick();
    }, this.pollIntervalMs);

    return { success: true, message: 'Scheduler started', pollIntervalMs: this.pollIntervalMs };
  }

  stop() {
    if (!this.intervalHandle) {
      return { success: true, message: 'Scheduler already stopped' };
    }

    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
    this.runningAccounts.clear();
    console.log('⏹️ Auto-deregister scheduler stopped');

    return { success: true, message: 'Scheduler stopped' };
  }

  async tick() {
    if (this.isTickRunning) {
      return;
    }

    this.isTickRunning = true;

    try {
      const activeStates = await AlbAutoDeregisterState.getAllActive();
      if (!activeStates?.length) {
        return;
      }

      const now = Date.now();
      const dueStates = activeStates.filter((s) => {
        if (!s.nextRunAt) return true;
        const next = new Date(s.nextRunAt).getTime();
        return Number.isFinite(next) && next <= now;
      });

      if (!dueStates.length) {
        return;
      }

      console.log(`⏰ Scheduler tick: ${dueStates.length} account(s) due for auto-deregister`);

      for (const state of dueStates) {
        const accountId = state.accountId;
        if (!accountId) continue;
        if (this.runningAccounts.has(accountId)) {
          continue;
        }

        this.runningAccounts.add(accountId);
        this.runOne(accountId, state)
          .catch((e) => {
            console.error(`❌ Scheduler run failed for account ${accountId}:`, e.message);
          })
          .finally(() => {
            this.runningAccounts.delete(accountId);
          });
      }
    } catch (error) {
      console.error('❌ Auto-deregister scheduler tick failed:', error);
    } finally {
      this.isTickRunning = false;
    }
  }

  async runOne(accountId, state) {
    try {
      console.log(`🚀 Starting auto-deregister run for account: ${accountId}`);
      console.log(`📊 State config:`, JSON.stringify(state.config, null, 2));
      
      const userId = state?.config?.userId;
      const regions = state?.config?.regions || ['us-east-1'];

      console.log(`🔍 User ID check: ${userId ? 'Found' : 'Missing'}`);
      console.log(`🔍 Regions: ${regions.join(', ')}`);

      if (!userId) {
        console.log(`⚠️ Skipping auto-deregister for ${accountId} - no userId in config. Disabling this state.`);
        await AlbAutoDeregisterState.upsert(accountId, {
          isActive: false,
          runStatus: 'disabled',
          errorMessage: 'Auto-disabled: Missing userId in config (please restart auto-deregister from UI)'
        });
        return;
      }

      const secret = await readAWSCreds(userId, String(accountId));
      const inner = secret?.data?.data || secret?.data || secret;

      const accessKeyId = inner?.access_key;
      const secretAccessKey = inner?.secret_key;
      const sessionToken = inner?.session_token;

      console.log(`🔐 Debug - Credentials loaded for user ${userId}, account ${accountId}:`);
      console.log(`   - Access Key ID: ${accessKeyId ? 'Present' : 'Missing'}`);
      console.log(`   - Secret Access Key: ${secretAccessKey ? 'Present' : 'Missing'}`);
      console.log(`   - Session Token: ${sessionToken ? 'Present' : 'Missing'}`);
      console.log(`🔐 Full secret object:`, JSON.stringify(secret, null, 2));

      if (!accessKeyId || !secretAccessKey) {
        console.log(`❌ AWS credentials incomplete - cannot proceed`);
        await AlbAutoDeregisterState.upsert(accountId, {
          runStatus: 'failed',
          errorMessage: 'AWS credentials missing/incomplete in Vault for this user/account'
        });
        return;
      }

      console.log(`✅ AWS credentials loaded successfully - proceeding to auto-deregister`);

      const creds = {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken && { sessionToken }),
        accountId,
        userId,
      };

      console.log(`🔄 Scheduler running auto-deregister for account ${accountId} (user ${userId}) in regions: ${regions.join(', ')}`);

      console.log(`🎯 Calling AlbAutoDeregisterService.performAutoDeregister...`);
      const result = await AlbAutoDeregisterService.performAutoDeregister(accountId, creds, regions);
      
      console.log(`✅ Auto-deregister completed for account ${accountId}:`);
      console.log(`   - Total processed: ${result.totalProcessed || 0}`);
      console.log(`   - Total deregistered: ${result.totalDeregistered || 0}`);
      console.log(`   - Total excluded: ${result.totalExcluded || 0}`);
      console.log(`   - Total selected: ${result.totalSelected || 0}`);
      console.log(`   - Success: ${result.success}`);
      if (result.error) {
        console.log(`   - Error: ${result.error}`);
      }

      const normalIntervalMs = state.config?.interval || 5 * 60 * 1000;
      const unhealthyIntervalMs = state.config?.unhealthyInterval || 60 * 1000;

      // If there are unhealthy targets, re-run quickly to react ASAP (but avoid tight loops).
      const shouldRetrySoon = (result?.totalUnhealthy || 0) > 0;
      const nextRunTime = new Date(Date.now() + (shouldRetrySoon ? unhealthyIntervalMs : normalIntervalMs));
      await AlbAutoDeregisterState.upsert(accountId, {
        nextRunAt: nextRunTime,
        runStatus: result?.skipped ? 'active' : (result?.success ? 'completed' : 'failed'),
      });
      
      console.log(`⏰ Next run scheduled for: ${nextRunTime.toISOString()}`);
    } catch (error) {
      await AlbAutoDeregisterState.upsert(accountId, {
        runStatus: 'failed',
        errorMessage: error.message,
      });
      throw error;
    }
  }
}

module.exports = new AlbAutoDeregisterSchedulerService();
