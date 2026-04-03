const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { sendSlackText } = require('./slackAlertService');

class EmailService {
  constructor() {
    console.log(`📧 EMAIL SERVICE: Initializing email service...`);
    
    // Don't create SES client immediately - we'll create it dynamically with credentials
    this.sesClient = null;
    this.fromEmail = process.env.SES_FROM_EMAIL;
    this.emailsEnabled = process.env.ENABLE_HEALTH_CHECK_EMAILS === 'true';
    
    console.log(`📧 EMAIL SERVICE: Configuration loaded:`);
    console.log(`📧 EMAIL SERVICE: - From Email: ${this.fromEmail}`);
    console.log(`📧 EMAIL SERVICE: - Emails Enabled: ${this.emailsEnabled}`);
    
    if (!this.fromEmail) {
      console.warn(`📧 EMAIL SERVICE: ⚠️  WARNING - SES_FROM_EMAIL not configured`);
    }
    
    console.log(`📧 EMAIL SERVICE: Email service initialization complete`);
  }

  normalizeEmailList(toEmails) {
    const raw = Array.isArray(toEmails) ? toEmails : (toEmails ? [toEmails] : []);

    const split = raw
      .flatMap((v) => {
        if (typeof v !== 'string') return [];
        return v.split(/[;,]/g);
      })
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter(Boolean);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalized = [...new Set(split)].filter((email) => emailRegex.test(email));

    return normalized;
  }

  // Method to get to addresses from Cassandra user config
  getToAddresses() {
    console.warn('📧 EMAIL SERVICE: getToAddresses() called without userId - use getUserEmailConfig(userId) instead');
    return [];
  }

  // Method to get user-specific email configuration from Cassandra
  async getUserEmailConfig(userId) {
    try {
      if (!userId || userId === 'default') {
        console.warn('📧 EMAIL SERVICE: No userId provided - cannot fetch email config from Cassandra');
        return {
          fromEmail: process.env.SES_FROM_EMAIL || 'team@cloudsanalytics.ai',
          toEmails: [],
          emailsEnabled: false,
          interval: 5,
        };
      }

      // Get user-specific configuration from Cassandra
      const userEmailService = require('./userEmailService');
      const userConfigResponse = await userEmailService.getUserEmailConfig(userId);

      if (userConfigResponse && userConfigResponse.success && userConfigResponse.data) {
        const userConfig = userConfigResponse.data;
        const normalizedToEmails = this.normalizeEmailList(userConfig.toEmails);
        return {
          ...userConfig,
          fromEmail: process.env.SES_FROM_EMAIL || 'team@cloudsanalytics.ai',
          toEmails: normalizedToEmails,
          emailsEnabled: userConfig.emailsEnabled !== false,
        };
      }

      console.warn(`📧 EMAIL SERVICE: No email config found in Cassandra for user ${userId}`);
      return {
        fromEmail: process.env.SES_FROM_EMAIL || 'team@cloudsanalytics.ai',
        toEmails: [],
        emailsEnabled: false,
        interval: 5,
      };
    } catch (error) {
      console.error('📧 EMAIL SERVICE: Error getting user email config from Cassandra:', error);
      return {
        fromEmail: process.env.SES_FROM_EMAIL || 'team@cloudsanalytics.ai',
        toEmails: [],
        emailsEnabled: false,
        interval: 5,
      };
    }
  }

  // Method to initialize SES client with credentials
  async initializeSESClient() {
    try {
      // Use the same credentials as the ALB controller
      const credentials = {
        accessKeyId: process.env.ACCESSKEYID,
        secretAccessKey: process.env.SECRETACCESSKEY,
      };
      
      console.log(`📧 EMAIL SERVICE: Using AWS credentials for SES`);
      console.log(`📧 EMAIL SERVICE: Access Key ID: ${credentials.accessKeyId ? 'Set' : 'NOT SET'}`);
      console.log(`📧 EMAIL SERVICE: Secret Key: ${credentials.secretAccessKey ? 'Set' : 'NOT SET'}`);
      
      if (!credentials.accessKeyId || !credentials.secretAccessKey) {
        throw new Error('AWS credentials not configured for email service');
      }
      
      this.sesClient = new SESClient({
        region: process.env.SES_REGION || 'ap-south-1',
        credentials: credentials,
      });
      
      console.log(`📧 EMAIL SERVICE: SES client initialized successfully`);
    } catch (error) {
      console.error(`📧 EMAIL SERVICE: Failed to initialize SES client:`, error);
      throw error;
    }
  }

  async sendCustomHealthCheckEmail(status, targets, totalTargets, userId = null) {
    if (!this.emailsEnabled) {
      console.log('📧 EMAIL SERVICE: Health check emails are disabled');
      return;
    }

    console.log(`📧 EMAIL SERVICE: Starting ${status} email send process`);
    console.log(`📧 EMAIL SERVICE: User ID: ${userId || 'default'}`);
    console.log(`📧 EMAIL SERVICE: Status: ${status}`);
    console.log(`📧 EMAIL SERVICE: Targets count: ${targets.length}`);
    console.log(`📧 EMAIL SERVICE: Total instances: ${totalTargets}`);

    try {
      // Initialize SES client if not already done
      if (!this.sesClient) {
        await this.initializeSESClient();
      }

      // Get user-specific email configuration
      const emailConfig = await this.getUserEmailConfig(userId);
      
      const toAddresses = this.normalizeEmailList(emailConfig.toEmails);

      console.log(`📧 EMAIL SERVICE: Using email config:`, {
        fromEmail: emailConfig.fromEmail,
        toEmails: toAddresses,
        emailsEnabled: emailConfig.emailsEnabled,
      });

      if (!emailConfig.emailsEnabled) {
        console.log('📧 EMAIL SERVICE: User has disabled email notifications');
        return;
      }

      if (toAddresses.length === 0) {
        throw new Error('No valid recipient emails configured');
      }

      const subject = status === 'HEALTHY' 
        ? `✅ AWS ALB Health Check Report - All Systems Operational`
        : `🚨 AWS ALB Health Check Alert - ${targets.length} Unhealthy Instances Detected`;
      
      console.log(`📧 EMAIL SERVICE: Subject: ${subject}`);
      
      let htmlBody = status === 'HEALTHY' 
        ? this.generateHealthyEmailHTML(targets, totalTargets)
        : this.generateHealthCheckEmailHTML(targets, totalTargets);
      
      let textBody = status === 'HEALTHY'
        ? this.generateHealthyEmailText(targets, totalTargets)
        : this.generateHealthCheckEmailText(targets, totalTargets);

      const htmlOk = typeof htmlBody === 'string' && htmlBody.trim().length > 50;
      const textOk = typeof textBody === 'string' && textBody.trim().length > 20;

      if (!htmlOk || !textOk) {
        const safeTargets = Array.isArray(targets) ? targets : [];
        const safeTotalTargets = Number.isFinite(totalTargets) ? totalTargets : safeTargets.length;
        const safeCount = safeTargets.length;

        htmlBody = `<!DOCTYPE html>
<html>
  <head><meta charset="UTF-8"></head>
  <body style="font-family: Arial, sans-serif;">
    <h2>${status === 'HEALTHY' ? 'AWS ALB Health Check Report' : 'AWS ALB Health Check Alert'}</h2>
    <p>Status: <strong>${status}</strong></p>
    <p>Instances in this email: <strong>${safeCount}</strong></p>
    <p>Total instances: <strong>${safeTotalTargets}</strong></p>
    <p>Time: ${new Date().toLocaleString()}</p>
    <pre style="white-space: pre-wrap; word-break: break-word;">${JSON.stringify(safeTargets.slice(0, 25), null, 2)}</pre>
  </body>
</html>`;

        textBody = `${status === 'HEALTHY' ? 'AWS ALB HEALTH CHECK REPORT' : 'AWS ALB HEALTH CHECK ALERT'}

Status: ${status}
Instances in this email: ${safeCount}
Total instances: ${safeTotalTargets}
Time: ${new Date().toLocaleString()}

Instances (first 25):
${JSON.stringify(safeTargets.slice(0, 25), null, 2)}
`;
      }

      console.log(`📧 EMAIL SERVICE: HTML body length: ${htmlBody.length} characters`);
      console.log(`📧 EMAIL SERVICE: Text body length: ${textBody.length} characters`);

      const params = {
        Source: emailConfig.fromEmail,
        Destination: {
          ToAddresses: toAddresses,
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textBody,
              Charset: 'UTF-8',
            },
          },
        },
      };

      console.log(`📧 EMAIL SERVICE: SES Parameters:`, JSON.stringify(params, null, 2));

      const command = new SendEmailCommand(params);
      console.log(`📧 EMAIL SERVICE: Sending SES command...`);
      
      const result = await this.sesClient.send(command);
      
      console.log(`📧 EMAIL SERVICE: ✅ Email sent successfully!`);
      console.log(`📧 EMAIL SERVICE: Message ID: ${result.MessageId}`);
      console.log(`📧 EMAIL SERVICE: Response metadata:`, result.$metadata);

      try {
        const safeTargets = Array.isArray(targets) ? targets : [];
        const count = safeTargets.length;
        const top = safeTargets.slice(0, 10);

        const truncate = (v, max) => {
          const s = String(v ?? '');
          return s.length > max ? `${s.slice(0, Math.max(0, max - 1))}…` : s;
        };

        const rows = top.map((t) => {
          const id = t?.id || t?.targetId || 'unknown';
          const port = t?.port ?? '';
          const instance = `${id}${port ? `:${port}` : ''}`;
          const tg = t?.targetGroupName || 'unknown-tg';
          const alb = t?.albName || t?.albDisplayName || 'unknown-alb';
          const region = t?.region || 'unknown-region';
          const reason = t?.reason || 'unknown';
          return {
            instance: truncate(instance, 22),
            alb: truncate(alb, 18),
            tg: truncate(tg, 18),
            region: truncate(region, 12),
            reason: truncate(reason, 22),
          };
        });

        const header = ['INSTANCE', 'ALB', 'TG', 'REGION', 'REASON'];
        const widths = {
          instance: 22,
          alb: 18,
          tg: 18,
          region: 12,
          reason: 22,
        };

        const pad = (s, w) => {
          const str = String(s ?? '');
          return str.length >= w ? str : str + ' '.repeat(w - str.length);
        };

        const divider = (w) => '-'.repeat(w);
        const tableLines = [];
        tableLines.push(
          `${pad(header[0], widths.instance)}  ${pad(header[1], widths.alb)}  ${pad(header[2], widths.tg)}  ${pad(header[3], widths.region)}  ${pad(header[4], widths.reason)}`
        );
        tableLines.push(
          `${divider(widths.instance)}  ${divider(widths.alb)}  ${divider(widths.tg)}  ${divider(widths.region)}  ${divider(widths.reason)}`
        );
        rows.forEach((r) => {
          tableLines.push(
            `${pad(r.instance, widths.instance)}  ${pad(r.alb, widths.alb)}  ${pad(r.tg, widths.tg)}  ${pad(r.region, widths.region)}  ${pad(r.reason, widths.reason)}`
          );
        });
        if (count > top.length) {
          tableLines.push(`...and ${count - top.length} more`);
        }

        const title = status === 'HEALTHY' ? '✅ AWS ALB Health Check Report' : '🚨 AWS ALB Health Check Alert';
        const totalPart = Number.isFinite(Number(totalTargets)) ? ` / ${totalTargets}` : '';
        const summary = `*Status:* ${status}   *Targets:* ${count}${totalPart}`;
        const timeLine = `*Time:* ${new Date().toLocaleString()}`;

        const payload = {
          text: `${title} - ${status} (${count}${totalPart})`,
          mrkdwn: true,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: title,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `${summary}\n${timeLine}`,
              },
            },
            { type: 'divider' },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `\`\`\`\n${tableLines.join('\n')}\n\`\`\``,
              },
            },
          ],
        };

        await sendSlackText(payload);
      } catch (slackErr) {
        console.error('🔔 SLACK: Failed to mirror health check email to Slack:', slackErr.response?.data || slackErr.message);
      }
      
      return result;
    } catch (error) {
      console.error(`📧 EMAIL SERVICE: ❌ Failed to send ${status} email:`, error);
      console.error(`📧 EMAIL SERVICE: Error name:`, error.name);
      console.error(`📧 EMAIL SERVICE: Error message:`, error.message);
      console.error(`📧 EMAIL SERVICE: Error code:`, error.Code);
      console.error(`📧 EMAIL SERVICE: Error stack:`, error.stack);
      
      // Log specific SES error details
      if (error.Code === 'MessageRejected') {
        console.error(`📧 EMAIL SERVICE: Message rejected - Check sender email verification in SES`);
      } else if (error.Code === 'InvalidParameterValue') {
        console.error(`📧 EMAIL SERVICE: Invalid parameter - Check email addresses and configuration`);
      } else if (error.Code === 'NotAuthorizedException') {
        console.error(`📧 EMAIL SERVICE: Not authorized - Check IAM permissions for SES`);
      } else if (error.Code === 'LimitExceeded') {
        console.error(`📧 EMAIL SERVICE: Limit exceeded - Check SES sending limits`);
      }
      
      throw error;
    }
  }

  generateHealthyEmailHTML(targets, totalTargets) {
    const healthyCount = targets.filter(t => t.health === 'healthy').length;
    const unhealthyCount = targets.filter(t => t.health === 'unhealthy').length;
    const healthPercentage = totalTargets > 0 ? ((healthyCount / totalTargets) * 100).toFixed(1) : 0;

    let targetsTable = '';
    targets.forEach(target => {
      const statusColor = target.health === 'healthy' ? '#28a745' : 
                         target.health === 'unhealthy' ? '#dc3545' : '#ffc107';
      
      targetsTable += `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 12px; font-family: Arial, sans-serif;">${target.targetGroupName}</td>
          <td style="padding: 12px; font-family: Arial, sans-serif;">${target.albDisplayName}</td>
          <td style="padding: 12px; font-family: Arial, sans-serif;">${target.id}</td>
          <td style="padding: 12px; font-family: Arial, sans-serif;">${target.port || 'N/A'}</td>
          <td style="padding: 12px; font-family: Arial, sans-serif;">
            <span style="background-color: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              ${target.health?.toUpperCase() || 'UNKNOWN'}
            </span>
          </td>
          <td style="padding: 12px; font-family: Arial, sans-serif;">${target.targetType?.toUpperCase() || 'UNKNOWN'}</td>
        </tr>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>AWS ALB Health Check Report</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #ffffff;">
        <div style="max-width: 1200px; margin: 0 auto; background-color: white; border: 1px solid #ddd; border-radius: 8px;">
          
          <!-- Header -->
          <div style="background-color: ${unhealthyCount > 0 ? '#fff3cd' : '#f8f9fa'}; color: ${unhealthyCount > 0 ? '#856404' : '#333'}; padding: 30px; border-radius: 8px 8px 0 0; border-bottom: 1px solid #ddd;">
            <h1 style="margin: 0; font-size: 28px; color: ${unhealthyCount > 0 ? '#856404' : '#333'};">✅ AWS ALB Health Check Report</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; color: ${unhealthyCount > 0 ? '#856404' : '#666'};">
              ${unhealthyCount > 0 ? `${unhealthyCount} unhealthy instance${unhealthyCount > 1 ? 's' : ''} detected, ${healthyCount} healthy instance${healthyCount > 1 ? 's' : ''} operating normally` : 'All monitored instances are operating normally'}
            </p>
          </div>
        <!-- Summary -->
          <div style="padding: 30px; background-color: #ffffff;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
              <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: #28a745;">${healthyCount}</div>
                <div style="color: #6c757d; font-size: 14px;">Healthy Instances</div>
              </div>
              ${unhealthyCount > 0 ? `
              <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: #dc3545;">${unhealthyCount}</div>
                <div style="color: #6c757d; font-size: 14px;">Unhealthy Instances</div>
              </div>` : ''}
              <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: ${unhealthyCount > 0 ? '#ffc107' : '#28a745'};">${totalTargets}</div>
                <div style="color: #6c757d; font-size: 14px;">Total Instances</div>
              </div>
              <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: ${unhealthyCount > 0 ? '#ffc107' : '#28a745'};">${healthPercentage}%</div>
                <div style="color: #6c757d; font-size: 14px;">Health Score</div>
              </div>
              <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: ${unhealthyCount > 0 ? '#ffc107' : '#28a745'};">${unhealthyCount > 0 ? '⚠️' : '✓'}</div>
                <div style="color: #6c757d; font-size: 14px;">${unhealthyCount > 0 ? 'Warning' : 'All Good'}</div>
              </div>
            </div>
          </div>

          <!-- All Instances Table -->
          <div style="padding: 30px;">
            <h2 style="color: #333; margin-bottom: 20px;">📋 All Instances Status</h2>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Target Group</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Load Balancer</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Instance ID</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Port</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Status</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Type</th>
                  </tr>
                </thead>
                <tbody>
                  ${targetsTable}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Success Message -->
          <div style="padding: 30px; background-color: ${unhealthyCount > 0 ? '#fff3cd' : '#d4edda'}; border-left: 4px solid ${unhealthyCount > 0 ? '#ffc107' : '#28a745'};">
            <h2 style="color: ${unhealthyCount > 0 ? '#856404' : '#155724'}; margin-top: 0;">${unhealthyCount > 0 ? '⚠️ System Status: Attention Required' : '🎉 System Status: Excellent'}</h2>
            <p style="color: ${unhealthyCount > 0 ? '#856404' : '#155724'}; line-height: 1.6;">
              ${unhealthyCount > 0 
                ? `${unhealthyCount} unhealthy instance${unhealthyCount > 1 ? 's' : ''} detected. Please review the instances table above and take appropriate action. ${healthyCount} instance${healthyCount > 1 ? 's' : ''} are operating normally.` 
                : 'All monitored instances are operating normally. Your AWS infrastructure is performing as expected. Continue monitoring for any changes in health status.'
              }
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 20px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px; color: #6c757d; font-size: 12px;">
            <p>This report was generated automatically by CodeLens AWS ALB Health Monitor</p>
            <p>Time: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateHealthyEmailText(targets, totalTargets) {
    const healthyCount = targets.filter(t => t.health === 'healthy').length;
    const unhealthyCount = targets.filter(t => t.health === 'unhealthy').length;
    const healthPercentage = totalTargets > 0 ? ((healthyCount / totalTargets) * 100).toFixed(1) : 0;

    let text = `
AWS ALB HEALTH CHECK REPORT
===========================

${unhealthyCount > 0 
  ? `⚠️ ${unhealthyCount} unhealthy instance${unhealthyCount > 1 ? 's' : ''} detected, ${healthyCount} healthy instance${healthyCount > 1 ? 's' : ''} operating normally`
  : '✅ All monitored instances are operating normally'
}

SUMMARY:
--------
Healthy Instances: ${healthyCount}
${unhealthyCount > 0 ? `Unhealthy Instances: ${unhealthyCount}\n` : ''}Total Instances: ${totalTargets}
Health Score: ${healthPercentage}%
Status: ${unhealthyCount > 0 ? '⚠️ Attention Required' : '✓ All Good'}

ALL INSTANCES STATUS:
---------------------`;

    targets.forEach((target, index) => {
      text += `
${index + 1}. Target Group: ${target.targetGroupName}
   Load Balancer: ${target.albDisplayName}
   Instance ID: ${target.id}
   Port: ${target.port || 'N/A'}
   Status: ${target.health?.toUpperCase() || 'UNKNOWN'}
   Type: ${target.targetType?.toUpperCase() || 'UNKNOWN'}
   `;
    });

    text += `

SYSTEM STATUS: ${unhealthyCount > 0 ? 'ATTENTION REQUIRED ⚠️' : 'EXCELLENT ✅'}
${unhealthyCount > 0 
  ? `${unhealthyCount} unhealthy instance${unhealthyCount > 1 ? 's' : ''} detected. Please review the instances above and take appropriate action. ${healthyCount} instance${healthyCount > 1 ? 's' : ''} are operating normally.`
  : 'All monitored instances are operating normally. Your AWS infrastructure is performing as expected. Continue monitoring for any changes in health status.'
}

This report was generated automatically by CodeLens AWS ALB Health Monitor
Time: ${new Date().toLocaleString()}
`;

    return text;
  }

  async sendHealthCheckAlert(unhealthyTargets, totalTargets, userId = null) {
    console.log(`📧 EMAIL SERVICE: sendHealthCheckAlert called`);
    console.log(`📧 EMAIL SERVICE: User ID: ${userId || 'default'}`);
    console.log(`📧 EMAIL SERVICE: Emails enabled: ${this.emailsEnabled}`);
    console.log(`📧 EMAIL SERVICE: Unhealthy instances: ${unhealthyTargets?.length || 0}`);
    console.log(`📧 EMAIL SERVICE: Total instances: ${totalTargets}`);

    if (!this.emailsEnabled) {
      console.log('📧 EMAIL SERVICE: Health check emails are disabled');
      return;
    }

    if (!unhealthyTargets || unhealthyTargets.length === 0) {
      console.log('📧 EMAIL SERVICE: No unhealthy instances to report');
      return;
    }

    console.log(`📧 EMAIL SERVICE: Proceeding to send unhealthy instances alert`);
    
    try {
      const result = await this.sendCustomHealthCheckEmail('UNHEALTHY', unhealthyTargets, totalTargets, userId);
      console.log(`📧 EMAIL SERVICE: Unhealthy alert email sent successfully`);
      return result;
    } catch (error) {
      console.error(`📧 EMAIL SERVICE: Failed to send unhealthy alert email:`, error);
      throw error;
    }
  }

  // Send combined deregistration and health check email
  async sendCombinedDeregistrationAndHealthEmail(options) {
    if (!this.emailsEnabled) {
      console.log('📧 EMAIL SERVICE: Combined deregistration + health check emails are disabled');
      return;
    }

    console.log(`📧 EMAIL SERVICE: Starting combined deregistration + health check email send process`);
    console.log(`📧 EMAIL SERVICE: User ID: ${options.userId || 'default'}`);
    console.log(`📧 EMAIL SERVICE: Target ID: ${options.targetId}`);
    console.log(`📧 EMAIL SERVICE: Region: ${options.region}`);
    console.log(`📧 EMAIL SERVICE: Options received:`, JSON.stringify(options, null, 2));

    try {
      // Initialize SES client if not already done
      if (!this.sesClient) {
        await this.initializeSESClient();
      }

      // Get user-specific email configuration
      const emailConfig = await this.getUserEmailConfig(options.userId);
      
      const toAddresses = this.normalizeEmailList(emailConfig.toEmails);

      console.log(`📧 EMAIL SERVICE: Using email config:`, {
        fromEmail: emailConfig.fromEmail,
        toEmails: toAddresses,
        emailsEnabled: emailConfig.emailsEnabled,
      });

      if (!emailConfig.emailsEnabled) {
        console.log('📧 EMAIL SERVICE: User has disabled email notifications');
        return;
      }

      if (toAddresses.length === 0) {
        throw new Error('No valid recipient emails configured');
      }

      const subject = `✅ AWS ALB Health Check Report - All Systems Operational`;
      
      console.log(`📧 EMAIL SERVICE: Subject: ${subject}`);
      
      // Generate combined HTML with both deregistration and health check info
      const htmlBody = this.generateCombinedDeregistrationAndHealthHTML(options);
      const textBody = this.generateCombinedDeregistrationAndHealthText(options);
      
      // Send email
      const params = {
        Source: emailConfig.fromEmail,
        Destination: {
          ToAddresses: toAddresses,
        },
        Message: {
          Subject: { Data: subject },
          Body: {
            Html: { Data: htmlBody },
            Text: { Data: textBody },
          },
        },
      };

      console.log(`📧 EMAIL SERVICE: Sending combined email to ${toAddresses.join(', ')}`);
      
      const result = await this.sesClient.send(new SendEmailCommand(params));
      
      console.log(`📧 EMAIL SERVICE: Combined email sent successfully! Message ID: ${result.MessageId}`);
      console.log(`📧 EMAIL SERVICE: Combined email sent to: ${toAddresses.join(', ')}`);

      try {
        const orgRegion = options?.region || 'unknown';
        const mode = options?.deregistrationMode || 'auto';
        const targetId = options?.targetId || 'unknown';
        const targetPort = options?.targetPort ?? '';
        const tgName = options?.targetGroupName || options?.targetName || 'unknown-tg';
        const albName = options?.albDisplayName || options?.albName || 'unknown-alb';
        const totalHealthy = Number.isFinite(Number(options?.totalHealthyTargets)) ? Number(options.totalHealthyTargets) : null;
        const totalUnhealthy = Number.isFinite(Number(options?.totalUnhealthyTargets)) ? Number(options.totalUnhealthyTargets) : null;
        const totalAll = Number.isFinite(Number(options?.totalAllTargets)) ? Number(options.totalAllTargets) : null;

        const text = [
          '🔄 ALB Deregistration + Health Report',
          `Mode: ${mode}`,
          `Region: ${orgRegion}`,
          `Deregistering: ${targetId}${targetPort ? `:${targetPort}` : ''}`,
          `ALB: ${albName}`,
          `Target Group: ${tgName}`,
          totalAll != null ? `Totals: healthy=${totalHealthy ?? 'n/a'}, unhealthy=${totalUnhealthy ?? 'n/a'}, total=${totalAll}` : null,
          `Time: ${new Date().toLocaleString()}`,
        ]
          .filter(Boolean)
          .join('\n');

        await sendSlackText(text);
      } catch (slackErr) {
        console.error('🔔 SLACK: Failed to mirror combined deregistration email to Slack:', slackErr.response?.data || slackErr.message);
      }
      
      return result;
    } catch (error) {
      console.error('📧 EMAIL SERVICE: Failed to send combined deregistration + health check email:', error);
      throw error;
    }
  }

  // Generate combined HTML for deregistration + health check
  generateCombinedDeregistrationAndHealthHTML(options) {
    const healthPercentage = options.totalAllTargets > 0 ? ((options.totalHealthyTargets / options.totalAllTargets) * 100).toFixed(1) : 0;
    const remainingUnhealthy = Math.max(0, options.totalUnhealthyTargets - 1); // One target is being deregistered

    const deregistrationMode = options.deregistrationMode || 'auto';
    const isManual = deregistrationMode === 'manual';

    const healthyTargets = (options.allTargets || []).filter(t => t.health === 'healthy');
    const remainingUnhealthyTargets = (options.allTargets || []).filter(t => t.health === 'unhealthy' && !(t.id === options.targetId && t.port === options.targetPort));

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>AWS ALB Health Check Report - Deregistration in Progress</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #ffffff;">
        <div style="max-width: 1200px; margin: 0 auto; background-color: white; border: 1px solid #ddd; border-radius: 8px;">
          
          <!-- Header -->
          <div style="background-color: #d4edda; color: #155724; padding: 30px; border-radius: 8px 8px 0 0; border-bottom: 1px solid #ddd;">
            <h1 style="margin: 0; font-size: 28px; color: #155724;">✅ AWS ALB Health Check Report - All Systems Operational</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; color: #155724;">
              Unhealthy instance has been identified and is being ${isManual ? 'manually' : 'automatically'} deregistered
            </p>
          </div>

          <!-- Deregistration Details -->
          <div style="padding: 30px; background-color: #fff3cd;">
            <h2 style="color: #856404; margin-bottom: 20px;">🔄 Instance Deregistration in Progress</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
              <div style="background-color: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <div style="color: #6c757d; font-size: 14px; margin-bottom: 5px;">Region</div>
                <div style="font-size: 16px; font-weight: bold; color: #333;">${options.region || 'unknown'}</div>
              </div>
              <div style="background-color: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <div style="color: #6c757d; font-size: 14px; margin-bottom: 5px;">Instance Being Deregistered</div>
                <div style="font-size: 16px; font-weight: bold; color: #dc3545;">${options.targetId}:${options.targetPort || 'N/A'}</div>
              </div>
              <div style="background-color: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <div style="color: #6c757d; font-size: 14px; margin-bottom: 5px;">Target Group</div>
                <div style="font-size: 16px; font-weight: bold; color: #333;">${options.targetGroupName || 'Unknown'}</div>
              </div>
              <div style="background-color: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <div style="color: #6c757d; font-size: 14px; margin-bottom: 5px;">Load Balancer</div>
                <div style="font-size: 16px; font-weight: bold; color: #333;">${options.albDisplayName || options.albName || 'Unknown'}</div>
              </div>
            </div>
          </div>

          <!-- Current Status Summary -->
          <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #333; margin-bottom: 20px;">📊 Current System Status</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
              <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: #28a745;">${options.totalHealthyTargets}</div>
                <div style="color: #6c757d; font-size: 14px;">Healthy Instances</div>
              </div>
              ${remainingUnhealthy > 0 ? `
              <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: #dc3545;">${remainingUnhealthy}</div>
                <div style="color: #6c757d; font-size: 14px;">Remaining Unhealthy Instances</div>
              </div>` : ''}
              <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: ${remainingUnhealthy > 0 ? '#ffc107' : '#007bff'};">${options.totalAllTargets}</div>
                <div style="color: #6c757d; font-size: 14px;">Total Instances</div>
              </div>
              <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: ${healthPercentage >= 90 ? '#28a745' : healthPercentage >= 70 ? '#ffc107' : '#dc3545'};">${healthPercentage}%</div>
                <div style="color: #6c757d; font-size: 14px;">Health Score</div>
              </div>
            </div>
          </div>

          ${healthyTargets.length > 0 ? `
          <!-- Healthy Targets -->
          <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #28a745; margin-bottom: 20px;">✅ Healthy Instances</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Instance</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Target Group</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Load Balancer</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Port</th>
                </tr>
              </thead>
              <tbody>
                ${healthyTargets.map(t => `
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${t.id}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${t.targetGroupName || 'N/A'}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${t.albDisplayName || 'N/A'}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${t.port || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>` : ''}

          ${remainingUnhealthyTargets.length > 0 ? `
          <!-- Remaining Unhealthy Targets -->
          <div style="padding: 30px; background-color: #fff3cd;">
            <h2 style="color: #856404; margin-bottom: 20px;">⚠️ Remaining Unhealthy Instances</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Instance</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Target Group</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Load Balancer</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Port</th>
                </tr>
              </thead>
              <tbody>
                ${remainingUnhealthyTargets.map(t => `
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${t.id}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${t.targetGroupName || 'N/A'}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${t.albDisplayName || 'N/A'}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${t.port || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>` : ''}

          <!-- Success Message -->
          <div style="padding: 30px; background-color: #d4edda; border-left: 4px solid #28a745;">
            <h2 style="color: #155724; margin-top: 0;">🎉 Automatic System Recovery in Progress</h2>
            <p style="color: #155724; line-height: 1.6;">
              The unhealthy instance has been ${isManual ? 'manually identified and is being removed from the load balancer.' : 'automatically identified and is being removed from the load balancer.'}
              Your AWS infrastructure is ${isManual ? 'being updated to maintain optimal health and performance.' : 'automatically maintaining optimal health and performance.'}
              The deregistration process will complete shortly.
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 20px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px; color: #6c757d; font-size: 12px;">
            <p>This notification was generated automatically by CodeLens AWS ALB Health Monitor</p>
            <p>Time: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate combined text for deregistration + health check
  generateCombinedDeregistrationAndHealthText(options) {
    const healthPercentage = options.totalAllTargets > 0 ? ((options.totalHealthyTargets / options.totalAllTargets) * 100).toFixed(1) : 0;
    const remainingUnhealthy = Math.max(0, options.totalUnhealthyTargets - 1);

    const deregistrationMode = options.deregistrationMode || 'auto';
    const isManual = deregistrationMode === 'manual';

    const healthyTargets = (options.allTargets || []).filter(t => t.health === 'healthy');
    const remainingUnhealthyTargets = (options.allTargets || []).filter(t => t.health === 'unhealthy' && !(t.id === options.targetId && t.port === options.targetPort));

    let text = `
✅ AWS ALB HEALTH CHECK REPORT - ALL SYSTEMS OPERATIONAL
========================================================

Unhealthy instance has been identified and is being ${isManual ? 'manually' : 'automatically'} deregistered

🔄 INSTANCE DEREGISTRATION IN PROGRESS:
=====================================

🔧 DEREGISTRATION DETAILS:
- Region: ${options.region || 'unknown'}
- Instance Being Deregistered: ${options.targetId}:${options.targetPort || 'N/A'}
- Target Group: ${options.targetGroupName || 'Unknown'}
- Load Balancer: ${options.albDisplayName || options.albName || 'Unknown'}

📊 CURRENT SYSTEM STATUS:
========================

Healthy Instances: ${options.totalHealthyTargets}
${remainingUnhealthy > 0 ? `Remaining Unhealthy Instances: ${remainingUnhealthy}` : ''}
Total Instances: ${options.totalAllTargets}
Health Score: ${healthPercentage}%

🎉 AUTOMATIC SYSTEM RECOVERY IN PROGRESS:
=========================================

The unhealthy instance has been ${isManual ? 'manually identified and is being removed from the load balancer.' : 'automatically identified and is being removed from the load balancer.'}
Your AWS infrastructure is ${isManual ? 'being updated to maintain optimal health and performance.' : 'automatically maintaining optimal health and performance.'}
The deregistration process will complete shortly.
`;

    if (healthyTargets.length > 0) {
      text += `\n✅ HEALTHY INSTANCES:\n====================\n`;
      healthyTargets.forEach(t => {
        text += `- ${t.id} | TG: ${t.targetGroupName || 'N/A'} | ALB: ${t.albDisplayName || 'N/A'} | Port: ${t.port || 'N/A'}\n`;
      });
    }

    if (remainingUnhealthyTargets.length > 0) {
      text += `\n⚠️ REMAINING UNHEALTHY INSTANCES:\n================================\n`;
      remainingUnhealthyTargets.forEach(t => {
        text += `- ${t.id} | TG: ${t.targetGroupName || 'N/A'} | ALB: ${t.albDisplayName || 'N/A'} | Port: ${t.port || 'N/A'}\n`;
      });
    }

    text += `\n---
This notification was generated automatically by CodeLens AWS ALB Health Monitor
Time: ${new Date().toLocaleString()}
`;

    return text;
  }

  async sendDeregisterSuccessEmail({ userId = null, region, targetGroupArn, targetId, targetPort, targetName, unhealthyDeletedCount, healthyCount }) {
    console.log('🔧 DEBUG: Email service received - healthyCount:', healthyCount, 'unhealthyDeletedCount:', unhealthyDeletedCount);
    
    if (!this.emailsEnabled) {
      console.log('📧 EMAIL SERVICE: Deregister success emails are disabled');
      return;
    }

    try {
      if (!this.sesClient) {
        await this.initializeSESClient();
      }

      const emailConfig = await this.getUserEmailConfig(userId);

      const toAddresses = this.normalizeEmailList(emailConfig.toEmails);

      if (!emailConfig.emailsEnabled) {
        console.log('📧 EMAIL SERVICE: User has disabled email notifications');
        return;
      }

      if (toAddresses.length === 0) {
        throw new Error('No valid recipient emails configured');
      }

      const subject = `✅ Unhealthy Instance Deregistered Successfully`;

      const safeRegion = region || 'us-east-1';
      const safeTargetPort = targetPort ?? '';
      const safeHealthyCount = Number.isFinite(Number(healthyCount)) ? Number(healthyCount) : 0;
      const safeUnhealthyDeletedCount = Number.isFinite(Number(unhealthyDeletedCount)) ? Number(unhealthyDeletedCount) : 1;

      const htmlBody = `<!DOCTYPE html>
<html>
  <head><meta charset="UTF-8"></head>
  <body style="font-family: Arial, sans-serif;">
    <h2>✅ Unhealthy Instance Deregistered Successfully</h2>
    <p><strong>Region:</strong> ${safeRegion}</p>
    <p><strong>Instance:</strong> ${targetName || targetId}${safeTargetPort ? `:${safeTargetPort}` : ''}</p>
    <p><strong>Target Group ARN:</strong> ${targetGroupArn || ''}</p>
    <hr />
    <p><strong>Deregistered in this action:</strong> ${safeUnhealthyDeletedCount}</p>
    <p><strong>Healthy instances (reported):</strong> ${safeHealthyCount}</p>
    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
  </body>
</html>`;

      const textBody = `UNHEALTHY INSTANCE DEREGISTERED SUCCESSFULLY

Region: ${safeRegion}
Instance: ${targetName || targetId}${safeTargetPort ? `:${safeTargetPort}` : ''}
Target Group ARN: ${targetGroupArn || ''}

Deregistered in this action: ${safeUnhealthyDeletedCount}
Healthy instances (reported): ${safeHealthyCount}
Time: ${new Date().toLocaleString()}
`;

      const params = {
        Source: emailConfig.fromEmail,
        Destination: { ToAddresses: toAddresses },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: htmlBody, Charset: 'UTF-8' },
            Text: { Data: textBody, Charset: 'UTF-8' },
          },
        },
      };

      console.log(`📧 EMAIL SERVICE: Sending deregister success email to ${toAddresses.join(', ')}`);
      const result = await this.sesClient.send(new SendEmailCommand(params));
      console.log(`📧 EMAIL SERVICE: Deregister success email sent successfully! Message ID: ${result.MessageId}`);

      try {
        const safeRegion = region || 'unknown';
        const safeTargetPort = targetPort ?? '';
        const safeHealthyCount = Number.isFinite(Number(healthyCount)) ? Number(healthyCount) : 0;
        const safeUnhealthyDeletedCount = Number.isFinite(Number(unhealthyDeletedCount)) ? Number(unhealthyDeletedCount) : 1;

        const text = [
          '✅ Unhealthy Instance Deregistered Successfully',
          `Region: ${safeRegion}`,
          `Instance: ${targetName || targetId}${safeTargetPort ? `:${safeTargetPort}` : ''}`,
          `Deregistered in this action: ${safeUnhealthyDeletedCount}`,
          `Healthy instances (reported): ${safeHealthyCount}`,
          `Time: ${new Date().toLocaleString()}`,
        ].join('\n');

        await sendSlackText(text);
      } catch (slackErr) {
        console.error('🔔 SLACK: Failed to mirror deregister success email to Slack:', slackErr.response?.data || slackErr.message);
      }
      return result;

    } catch (error) {
      console.error('📧 EMAIL SERVICE: Failed to send deregister success email:', error);
      throw error;
    }
  }

  async sendDeregisterFailureEmail({ userId, region, targetGroupArn, targetId, targetPort, error }) {
    try {
      if (!this.emailsEnabled) {
        console.log('📧 EMAIL SERVICE: Deregister failure emails are disabled');
        return;
      }

      if (!this.sesClient) {
        await this.initializeSESClient();
      }

      const emailConfig = await this.getUserEmailConfig(userId);
      if (!emailConfig) {
        console.log('📧 EMAIL SERVICE: No email config found for user, skipping deregister failure email');
        return;
      }

      if (!emailConfig.emailsEnabled) {
        console.log('📧 EMAIL SERVICE: User has disabled email notifications');
        return;
      }

      const toEmails = this.normalizeEmailList(emailConfig.toEmails);
      if (!toEmails || toEmails.length === 0) {
        console.log('📧 EMAIL SERVICE: No recipients configured, skipping deregister failure email');
        return;
      }

      const subject = `🚨 ALB Instance Deregistration Failed - ${targetId}`;
      
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .target-info { background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc3545; }
            .error-info { background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107; }
            .label { font-weight: bold; color: #495057; }
            .value { color: #212529; margin-bottom: 10px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Instance Deregistration Failed</h1>
              <p>Unable to deregister unhealthy instance from ALB</p>
            </div>
            <div class="content">
              <p>An attempt to deregister an unhealthy instance from the Application Load Balancer has failed.</p>
              
              <div class="target-info">
                <h3>Instance Information</h3>
                <div class="label">Instance ID:</div>
                <div class="value">${targetId}</div>
                
                <div class="label">Instance Port:</div>
                <div class="value">${targetPort || 'N/A (Lambda target)'}</div>
                
                <div class="label">Target Group ARN:</div>
                <div class="value" style="word-break: break-all; font-size: 12px;">${targetGroupArn}</div>
                
                <div class="label">Region:</div>
                <div class="value">${region}</div>
                
                <div class="label">Requested By:</div>
                <div class="value">${userId || 'Unknown'}</div>
              </div>
              
              <div class="error-info">
                <h3>⚠️ Error Details</h3>
                <div class="value" style="color: #856404; font-family: monospace; background-color: #fff; padding: 10px; border-radius: 4px; border: 1px solid #ffeaa7;">
                  ${error || 'Unknown error occurred'}
                </div>
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Check AWS credentials and permissions</li>
                <li>Verify the target exists and is unhealthy</li>
                <li>Review the error details above</li>
                <li>Try deregistering again manually</li>
              </ul>
            </div>
            <div class="footer">
              <p>This alert was generated by the ALB Health Monitor System</p>
              <p>Generated at: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textBody = `
        ALB Instance Deregistration Failed
        
        Instance ID: ${targetId}
        Instance Port: ${targetPort || 'N/A (Lambda target)'}
        Target Group ARN: ${targetGroupArn}
        Region: ${region}
        Requested By: ${userId || 'Unknown'}
        
        Error: ${error || 'Unknown error occurred'}
        
        Next Steps:
        - Check AWS credentials and permissions
        - Verify the target exists and is unhealthy
        - Review the error details above
        - Try deregistering again manually
        
        Generated at: ${new Date().toLocaleString()}
      `;

      const params = {
        Source: process.env.SES_FROM_EMAIL,
        Destination: {
          ToAddresses: toEmails,
        },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: htmlBody, Charset: 'UTF-8' },
            Text: { Data: textBody, Charset: 'UTF-8' },
          },
        },
      };

      const command = new SendEmailCommand(params);
      const result = await this.sesClient.send(command);

      try {
        const safeRegion = region || 'unknown';
        const safeTargetPort = targetPort ?? '';
        const errText = typeof error === 'string' ? error : (error?.message || 'Unknown error');

        const text = [
          `🚨 ALB Instance Deregistration Failed - ${targetId}`,
          `Region: ${safeRegion}`,
          `Target Group ARN: ${targetGroupArn || ''}`,
          `Instance: ${targetId}${safeTargetPort ? `:${safeTargetPort}` : ''}`,
          `Error: ${errText}`,
          `Time: ${new Date().toLocaleString()}`,
        ].join('\n');

        await sendSlackText(text);
      } catch (slackErr) {
        console.error('🔔 SLACK: Failed to mirror deregister failure email to Slack:', slackErr.response?.data || slackErr.message);
      }

      return result;
    } catch (error) {
      console.error('📧 EMAIL SERVICE: Failed to send deregister failure email:', error);
      throw error;
    }
  }

  generateHealthCheckEmailHTML(unhealthyTargets, totalTargets) {
    const unhealthyCount = unhealthyTargets.length;
    const healthyCount = totalTargets - unhealthyCount;
    const healthPercentage = totalTargets > 0 ? ((healthyCount / totalTargets) * 100).toFixed(1) : 0;

    let targetsTable = '';
    unhealthyTargets.forEach(target => {
      const severity = this.getSeverityColor(target.severity);
      targetsTable += `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 12px; font-family: Arial, sans-serif;">${target.targetGroupName}</td>
          <td style="padding: 12px; font-family: Arial, sans-serif;">${target.albName}</td>
          <td style="padding: 12px; font-family: Arial, sans-serif;">${target.id}</td>
          <td style="padding: 12px; font-family: Arial, sans-serif;">${target.port || 'N/A'}</td>
          <td style="padding: 12px; font-family: Arial, sans-serif;">
            <span style="background-color: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              ${target.health?.toUpperCase() || 'UNKNOWN'}
            </span>
          </td>
          <td style="padding: 12px; font-family: Arial, sans-serif;">${target.reason || 'No reason provided'}</td>
          <td style="padding: 12px; font-family: Arial, sans-serif;">
            <span style="background-color: ${severity.color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              ${target.severity?.toUpperCase() || 'MEDIUM'}
            </span>
          </td>
        </tr>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>AWS ALB Health Check Alert</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #ffffff;">
        <div style="max-width: 1200px; margin: 0 auto; background-color: white; border: 1px solid #ddd; border-radius: 8px;">
          
          <!-- Header -->
          <div style="background-color: #f8f9fa; color: #333; padding: 30px; border-radius: 8px 8px 0 0; border-bottom: 1px solid #ddd;">
            <h1 style="margin: 0; font-size: 28px; color: #333;">🚨 AWS ALB Health Check Alert</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; color: #666;">
              Automatic health monitoring detected issues with your load balancer instances
            </p>
          </div>

          <!-- Summary -->
          <div style="padding: 30px; background-color: #ffffff;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
              <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: #dc3545;">${unhealthyCount}</div>
                <div style="color: #6c757d; font-size: 14px;">Unhealthy Instances</div>
              </div>
              <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: #28a745;">${healthyCount}</div>
                <div style="color: #6c757d; font-size: 14px;">Healthy Instances</div>
              </div>
              <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: #007bff;">${totalTargets}</div>
                <div style="color: #6c757d; font-size: 14px;">Total Instances</div>
              </div>
              <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: ${healthPercentage >= 90 ? '#28a745' : healthPercentage >= 70 ? '#ffc107' : '#dc3545'};">${healthPercentage}%</div>
                <div style="color: #6c757d; font-size: 14px;">Health Score</div>
              </div>
            </div>
          </div>

          <!-- Unhealthy Targets Table -->
          <div style="padding: 30px;">
            <h2 style="color: #333; margin-bottom: 20px;">📋 Unhealthy Instances Details</h2>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Target Group</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Load Balancer</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Instance ID</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Port</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Status</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Reason</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  ${targetsTable}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Recommended Actions -->
          <div style="padding: 30px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
            <h2 style="color: #856404; margin-top: 0;">⚡ Recommended Actions</h2>
            <ul style="color: #856404; line-height: 1.6;">
              <li>Check application logs for errors on the unhealthy instances</li>
              <li>Verify that applications/services are running on the target instances</li>
              <li>Check network connectivity and security group rules</li>
              <li>Restart applications if necessary</li>
              <li>Monitor system resources (CPU, memory, disk space)</li>
              <li>Consider scaling up if instances are overloaded</li>
            </ul>
          </div>

          <!-- Footer -->
          <div style="padding: 20px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px; color: #6c757d; font-size: 12px;">
            <p>This alert was generated automatically by CodeLens AWS ALB Health Monitor</p>
            <p>Time: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateHealthCheckEmailText(unhealthyTargets, totalTargets) {
    const unhealthyCount = unhealthyTargets.length;
    const healthyCount = totalTargets - unhealthyCount;
    const healthPercentage = totalTargets > 0 ? ((healthyCount / totalTargets) * 100).toFixed(1) : 0;

    let text = `
AWS ALB HEALTH CHECK ALERT
==========================

SUMMARY:
- Unhealthy Instances: ${unhealthyCount}
- Healthy Instances: ${healthyCount}
- Total Instances: ${totalTargets}
- Health Score: ${healthPercentage}%

UNHEALTHY INSTANCES DETAILS:
`;

    unhealthyTargets.forEach((target, index) => {
      text += `
${index + 1}. Target Group: ${target.targetGroupName}
   Load Balancer: ${target.albName}
   Instance ID: ${target.id}
   Port: ${target.port || 'N/A'}
   Status: ${target.health?.toUpperCase() || 'UNKNOWN'}
   Reason: ${target.reason || 'No reason provided'}
   Severity: ${target.severity?.toUpperCase() || 'MEDIUM'}
   `;
    });

    text += `
RECOMMENDED ACTIONS:
- Check application logs for errors on the unhealthy instances
- Verify that applications/services are running on the target instances
- Check network connectivity and security group rules
- Restart applications if necessary
- Monitor system resources (CPU, memory, disk space)
- Consider scaling up if instances are overloaded

This alert was generated automatically by CodeLens AWS ALB Health Monitor
Time: ${new Date().toLocaleString()}
`;

    return text;
  }

  getSeverityColor(severity) {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return '#dc3545';
      case 'high':
        return '#fd7e14';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  }

  generateDeregisterSuccessHTML({ region, targetGroupArn, targetId, targetPort, targetName, unhealthyDeletedCount, allTargets, totalTargets, healthyCount, unhealthyCount, deregisteredTarget }) {
    const healthPercentage = totalTargets > 0 ? ((healthyCount / totalTargets) * 100).toFixed(1) : 0;

    // Generate all targets table
    let targetsTable = '';
    allTargets.forEach(target => {
      const statusColor = target.health === 'healthy' ? '#28a745' : 
                         target.health === 'unhealthy' ? '#dc3545' : '#ffc107';
      
      targetsTable += `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 12px; font-family: Arial, sans-serif;">${target.targetGroupName}</td>
          <td style="padding: 12px; font-family: Arial, sans-serif;">${target.albDisplayName}</td>
          <td style="padding: 12px; font-family: Arial, sans-serif;">${target.id}</td>
          <td style="padding: 12px; font-family: Arial, sans-serif;">${target.port || 'N/A'}</td>
          <td style="padding: 12px; font-family: Arial, sans-serif;">
            <span style="background-color: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              ${target.health?.toUpperCase() || 'UNKNOWN'}
            </span>
          </td>
          <td style="padding: 12px; font-family: Arial, sans-serif;">${target.targetType?.toUpperCase() || 'UNKNOWN'}</td>
        </tr>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Unhealthy Instance Deregistered Successfully</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #ffffff;">
        <div style="max-width: 1200px; margin: 0 auto; background-color: white; border: 1px solid #ddd; border-radius: 8px;">
          
          <!-- Header -->
          <div style="background-color: #d4edda; color: #155724; padding: 30px; border-radius: 8px 8px 0 0; border-bottom: 1px solid #ddd;">
            <h1 style="margin: 0; font-size: 28px; color: #155724;">✅ Unhealthy Instance Deregistered Successfully</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; color: #155724;">
              The unhealthy instance has been successfully removed from the load balancer
            </p>
          </div>

          <!-- Deregistration Details -->
          <div style="padding: 30px; background-color: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">🔧 Deregistration Details</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
              <div style="background-color: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <div style="color: #6c757d; font-size: 14px; margin-bottom: 5px;">Region</div>
                <div style="font-size: 16px; font-weight: bold; color: #333;">${region || 'unknown'}</div>
              </div>
              <div style="background-color: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <div style="color: #6c757d; font-size: 14px; margin-bottom: 5px;">Instance Name</div>
                <div style="font-size: 16px; font-weight: bold; color: #333;">${targetName || targetId || ''}</div>
              </div>
              <div style="background-color: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <div style="color: #6c757d; font-size: 14px; margin-bottom: 5px;">Deregistered Instance</div>
                <div style="font-size: 16px; font-weight: bold; color: #dc3545;">${deregisteredTarget}</div>
              </div>
              <div style="background-color: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <div style="color: #6c757d; font-size: 14px; margin-bottom: 5px;">Unhealthy Deleted Count</div>
                <div style="font-size: 16px; font-weight: bold; color: #dc3545;">${unhealthyDeletedCount || '1'}</div>
              </div>
            </div>
            <div style="margin-top: 20px;">
              <div style="color: #6c757d; font-size: 14px; margin-bottom: 5px;">Target Group ARN</div>
              <div style="font-size: 12px; color: #333; word-break: break-all; background-color: white; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">${targetGroupArn || ''}</div>
            </div>
          </div>

          <!-- Current Status Summary -->
          <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #333; margin-bottom: 20px;">📊 Current Status Summary</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
              <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: #28a745;">${healthyCount}</div>
                <div style="color: #6c757d; font-size: 14px;">Healthy Instances</div>
              </div>
              ${unhealthyCount > 0 ? `
              <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: #dc3545;">${unhealthyCount}</div>
                <div style="color: #6c757d; font-size: 14px;">Unhealthy Instances</div>
              </div>` : ''}
              <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: ${unhealthyCount > 0 ? '#ffc107' : '#007bff'};">${totalTargets}</div>
                <div style="color: #6c757d; font-size: 14px;">Total Instances</div>
              </div>
              <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: ${healthPercentage >= 90 ? '#28a745' : healthPercentage >= 70 ? '#ffc107' : '#dc3545'};">${healthPercentage}%</div>
                <div style="color: #6c757d; font-size: 14px;">Health Score</div>
              </div>
              <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">
                <div style="font-size: 32px; font-weight: bold; color: ${unhealthyCount > 0 ? '#ffc107' : '#28a745'};">${unhealthyCount > 0 ? '⚠️' : '✓'}</div>
                <div style="color: #6c757d; font-size: 14px;">${unhealthyCount > 0 ? 'Attention Required' : 'All Good'}</div>
              </div>
            </div>
          </div>

          <!-- All Instances Table -->
          ${allTargets.length > 0 ? `
          <div style="padding: 30px;">
            <h2 style="color: #333; margin-bottom: 20px;">📋 All Instances Status</h2>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Target Group</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Load Balancer</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Instance ID</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Port</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Status</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-family: Arial, sans-serif;">Type</th>
                  </tr>
                </thead>
                <tbody>
                  ${targetsTable}
                </tbody>
              </table>
            </div>
          </div>` : ''}

          <!-- Success Message -->
          <div style="padding: 30px; background-color: #d4edda; border-left: 4px solid #28a745;">
            <h2 style="color: #155724; margin-top: 0;">🎉 Deregistration Completed Successfully</h2>
            <p style="color: #155724; line-height: 1.6;">
              The unhealthy instance has been successfully removed from the load balancer. Your AWS infrastructure is now operating with the remaining healthy instances.
              Continue monitoring for any changes in health status.
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 20px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px; color: #6c757d; font-size: 12px;">
            <p>This notification was generated automatically by CodeLens AWS ALB Health Monitor</p>
            <p>Time: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateDeregisterSuccessText({ region, targetGroupArn, targetId, targetPort, targetName, unhealthyDeletedCount, allTargets, totalTargets, healthyCount, unhealthyCount, deregisteredTarget }) {
    const healthPercentage = totalTargets > 0 ? ((healthyCount / totalTargets) * 100).toFixed(1) : 0;

    let text = `
 Unhealthy Instance Deregistered Successfully
=============================================
 
 Deregistration Details:
--------------------------
Region: ${region || 'unknown'}
Target Group ARN: ${targetGroupArn || ''}
Instance Name: ${targetName || targetId || ''}
Deregistered Instance: ${deregisteredTarget}
Unhealthy Deleted Count: ${unhealthyDeletedCount || '1'}

 Current Status Summary:
-------------------------
Healthy Instances: ${healthyCount}
${unhealthyCount > 0 ? `Unhealthy Instances: ${unhealthyCount}\n` : ''}Total Instances: ${totalTargets}
Health Score: ${healthPercentage}%
Status: ${unhealthyCount > 0 ? ' Attention Required' : ' All Good'}

`;

    if (allTargets.length > 0) {
      text += `
 All Instances Status:
------------------------

`;
      allTargets.forEach((target, index) => {
        text += `
${index + 1}. Target Group: ${target.targetGroupName}
   Load Balancer: ${target.albDisplayName}
   Instance ID: ${target.id}
   Port: ${target.port || 'N/A'}
   Status: ${target.health?.toUpperCase() || 'UNKNOWN'}
   Type: ${target.targetType?.toUpperCase() || 'UNKNOWN'}
   `;
      });
    }

    text += `

 Deregistration Completed Successfully
The unhealthy instance has been successfully removed from the load balancer. Your AWS infrastructure is now operating with the remaining healthy instances.
Continue monitoring for any changes in health status.

This notification was generated automatically by CodeLens AWS ALB Health Monitor
Time: ${new Date().toLocaleString()}
`;

    return text;
  }

  // Diagnostic method to test SES connectivity and configuration
  async testSESConnectivity() {
    console.log(`📧 EMAIL SERVICE: Testing SES connectivity...`);
    
    try {
      // Initialize SES client if not already done
      if (!this.sesClient) {
        await this.initializeSESClient();
      }
      
      // Test 1: Check configuration
      const config = {
        fromEmail: this.fromEmail,
        toEmails: this.getToAddresses(),
        emailsEnabled: this.emailsEnabled,
        region: process.env.SES_REGION || 'ap-south-1',
        hasCredentials: !!(process.env.ACCESSKEYID && process.env.SECRETACCESSKEY),
      };
      
      console.log(`📧 EMAIL SERVICE: Configuration check:`, config);
      
      if (!config.hasCredentials) {
        throw new Error('AWS credentials not configured');
      }
      
      if (!config.fromEmail) {
        throw new Error('From email not configured');
      }
      
      if (!config.toEmails || config.toEmails.length === 0) {
        throw new Error('Recipient emails not configured');
      }
      
      // Test 2: Try to send a simple test email
      const testParams = {
        Source: this.fromEmail,
        Destination: {
          ToAddresses: config.toEmails,
        },
        Message: {
          Subject: {
            Data: '📧 SES Connectivity Test - CodeLens Health Monitor',
            Charset: 'UTF-8',
          },
          Body: {
            Text: {
              Data: 'This is a test email to verify SES connectivity.\n\nIf you receive this email, SES is working correctly.\n\nSent at: ' + new Date().toISOString(),
              Charset: 'UTF-8',
            },
          },
        },
      };
      
      console.log(`📧 EMAIL SERVICE: Sending connectivity test email...`);
      console.log(`📧 EMAIL SERVICE: Test email parameters:`, JSON.stringify(testParams, null, 2));
      
      const command = new SendEmailCommand(testParams);
      const result = await this.sesClient.send(command);
      
      console.log(`📧 EMAIL SERVICE: ✅ SES connectivity test successful!`);
      console.log(`📧 EMAIL SERVICE: Test email Message ID: ${result.MessageId}`);
      console.log(`📧 EMAIL SERVICE: Response metadata:`, result.$metadata);
      
      return {
        success: true,
        messageId: result.MessageId,
        config: {
          fromEmail: this.fromEmail,
          toEmails: this.getToAddresses(),
          emailsEnabled: this.emailsEnabled,
          region: process.env.SES_REGION || 'ap-south-1',
          hasCredentials: !!(process.env.ACCESSKEYID && process.env.SECRETACCESSKEY),
        },
        timestamp: new Date().toISOString(),
      };
      
    } catch (error) {
      console.error(`📧 EMAIL SERVICE: ❌ SES connectivity test failed:`, error);
      console.error(`📧 EMAIL SERVICE: Error name:`, error.name);
      console.error(`📧 EMAIL SERVICE: Error message:`, error.message);
      console.error(`📧 EMAIL SERVICE: Error code:`, error.Code);
      console.error(`📧 EMAIL SERVICE: Error stack:`, error.stack);
      console.error(`📧 EMAIL SERVICE: Full error object:`, JSON.stringify(error, null, 2));
      
      // Log specific SES error details
      if (error.Code === 'MessageRejected') {
        console.error(`📧 EMAIL SERVICE: Message rejected - Check sender email verification in SES`);
        console.error(`📧 EMAIL SERVICE: SOLUTION: Verify the sender email ${this.fromEmail} is verified in SES console`);
      } else if (error.Code === 'InvalidParameterValue') {
        console.error(`📧 EMAIL SERVICE: Invalid parameter - Check email addresses and configuration`);
        console.error(`📧 EMAIL SERVICE: SOLUTION: Verify email addresses are valid and properly formatted`);
      } else if (error.Code === 'NotAuthorizedException') {
        console.error(`📧 EMAIL SERVICE: Not authorized - Check IAM permissions for SES`);
        console.error(`📧 EMAIL SERVICE: SOLUTION: Add ses:SendEmail permission to IAM user/role`);
        console.error(`📧 EMAIL SERVICE: REQUIRED PERMISSIONS:`);
        console.error(`📧 EMAIL SERVICE: - ses:SendEmail`);
        console.error(`📧 EMAIL SERVICE: - ses:SendRawEmail (optional)`);
      } else if (error.Code === 'LimitExceeded') {
        console.error(`📧 EMAIL SERVICE: Limit exceeded - Check SES sending limits`);
        console.error(`📧 EMAIL SERVICE: SOLUTION: Check SES sandbox status and sending limits`);
      } else if (error.Code === 'InvalidClientTokenId') {
        console.error(`📧 EMAIL SERVICE: Invalid credentials - Check AWS credentials`);
        console.error(`📧 EMAIL SERVICE: SOLUTION: Verify ACCESSKEYID and SECRETACCESSKEY are correct`);
        console.error(`📧 EMAIL SERVICE: CURRENT CREDS:`, {
          accessKeyId: process.env.ACCESSKEYID ? 'Set' : 'NOT SET',
          secretAccessKey: process.env.SECRETACCESSKEY ? 'Set' : 'NOT SET',
        });
      }
      
      return {
        success: false,
        error: {
          message: error.message,
          code: error.Code,
          name: error.name,
          stack: error.stack,
        },
        config: {
          fromEmail: this.fromEmail,
          toEmails: this.getToAddresses(),
          emailsEnabled: this.emailsEnabled,
          region: process.env.SES_REGION || 'ap-south-1',
          hasCredentials: !!(process.env.ACCESSKEYID && process.env.SECRETACCESSKEY),
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = new EmailService();
