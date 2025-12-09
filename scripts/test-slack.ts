/**
 * Quick script to test Slack connection
 * Run with: npx tsx scripts/test-slack.ts
 */

import { slackApp } from '@/lib/slack';

async function testSlackConnection() {
  console.log('🔍 Testing Slack connection...\n');

  if (!slackApp) {
    console.error('❌ Slack app not initialized');
    console.error('   Please check SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET');
    return;
  }

  try {
    // Test authentication
    const authTest = await slackApp.client.auth.test();
    console.log('✅ Authentication successful!');
    console.log(`   Bot User: ${authTest.user}`);
    console.log(`   Team: ${authTest.team}\n`);

    // Test channel access
    const channelId = process.env.SLACK_CHANNEL_ID;
    if (channelId) {
      console.log(`🔍 Testing channel access: ${channelId}`);
      try {
        const channelInfo = await slackApp.client.conversations.info({
          channel: channelId
        });
        console.log(`✅ Channel found: #${channelInfo.channel?.name}`);
      } catch (error: any) {
        console.error('❌ Cannot access channel');
        console.error(`   Error: ${error.message}`);
        console.error('   Make sure the bot is invited to the channel!');
      }
    } else {
      console.warn('⚠️  SLACK_CHANNEL_ID not set');
    }

    console.log('\n✨ Slack integration is ready!');
  } catch (error: any) {
    console.error('❌ Connection failed');
    console.error(`   Error: ${error.message}`);
  }
}

testSlackConnection();
