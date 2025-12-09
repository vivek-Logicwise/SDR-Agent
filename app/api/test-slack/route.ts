import { sendSlackMessageWithButtons } from '@/lib/slack';

export async function GET() {
  try {
    console.log('Testing Slack integration...');
    console.log('SLACK_BOT_TOKEN exists:', !!process.env.SLACK_BOT_TOKEN);
    console.log(
      'SLACK_SIGNING_SECRET exists:',
      !!process.env.SLACK_SIGNING_SECRET
    );
    console.log('SLACK_CHANNEL_ID:', process.env.SLACK_CHANNEL_ID);

    if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_SIGNING_SECRET) {
      return Response.json(
        {
          error:
            'SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET not set in environment variables',
          hasToken: !!process.env.SLACK_BOT_TOKEN,
          hasSecret: !!process.env.SLACK_SIGNING_SECRET
        },
        { status: 500 }
      );
    }

    const channelId = process.env.SLACK_CHANNEL_ID || '';

    if (!channelId) {
      return Response.json(
        { error: 'SLACK_CHANNEL_ID not set in environment variables' },
        { status: 500 }
      );
    }

    const result = await sendSlackMessageWithButtons(
      channelId,
      '🧪 *Test Message from Lead Agent*\n\nThis is a test to verify Slack integration is working correctly.\n\nIf you can see this message with buttons, the integration is working! ✅'
    );

    return Response.json({
      success: true,
      message: 'Test message sent successfully to Slack!',
      channelId: result.channel,
      messageTs: result.messageTs
    });
  } catch (error: any) {
    console.error('Slack test error:', error);
    return Response.json(
      {
        error: error.message,
        details: error.data || error
      },
      { status: 500 }
    );
  }
}
