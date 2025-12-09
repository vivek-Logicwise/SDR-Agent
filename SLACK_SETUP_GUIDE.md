# Slack Approval Integration Setup Guide

## Overview
Your deployed application at https://sdr-agent-edex.vercel.app/ needs to be connected to Slack to enable human-in-the-loop approval for lead qualification emails.

## Current Status
✅ Slack credentials configured in `.env.local`  
✅ Slack bot code implemented  
❌ Manifest needs production URL update  
❌ Slack app needs production URL configuration  

---

## Step-by-Step Setup

### 1. Update Slack App Configuration

#### A. Go to Slack API Dashboard
1. Visit [https://api.slack.com/apps](https://api.slack.com/apps)
2. Find and select your **lead-agent** app (or the app associated with your bot token)

#### B. Update Interactivity & Shortcuts
1. In the left sidebar, click **Interactivity & Shortcuts**
2. Enable **Interactivity**
3. Set **Request URL** to:
   ```
   https://sdr-agent-edex.vercel.app/api/slack
   ```
4. Click **Save Changes**

#### C. Update Event Subscriptions
1. In the left sidebar, click **Event Subscriptions**
2. Enable **Events**
3. Set **Request URL** to:
   ```
   https://sdr-agent-edex.vercel.app/api/slack
   ```
4. Under **Subscribe to bot events**, ensure you have:
   - `app_mention`
   - `message.channels` (if you want the bot to respond to channel messages)
5. Click **Save Changes**

#### D. Verify Bot Token Scopes
1. In the left sidebar, click **OAuth & Permissions**
2. Under **Scopes** → **Bot Token Scopes**, ensure you have:
   - `chat:write` (required to send messages)
   - `chat:write.public` (if posting to public channels)
   - `app_mentions:read` (to respond to mentions)
3. If you added new scopes, you'll need to **reinstall the app** to your workspace

#### E. Reinstall App (if needed)
1. Go to **Install App** in the left sidebar
2. Click **Reinstall to Workspace**
3. Authorize the app

### 2. Update Environment Variables on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **sdr-agent-edex** project
3. Go to **Settings** → **Environment Variables**
4. Verify these variables are set:
   ```
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_SIGNING_SECRET=your-signing-secret
   SLACK_CHANNEL_ID=C0A26VDU5PD
   ```
5. If you made changes, redeploy your app

### 3. Update Your Manifest File (for reference)

Update the `manifest.json` in your repository with the production URL:

```json
{
  "display_information": {
    "name": "lead-agent"
  },
  "features": {
    "bot_user": {
      "display_name": "lead-agent",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "chat:write.public", "app_mentions:read"]
    }
  },
  "settings": {
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://sdr-agent-edex.vercel.app/api/slack"
    },
    "event_subscriptions": {
      "request_url": "https://sdr-agent-edex.vercel.app/api/slack",
      "bot_events": ["app_mention", "message.channels"]
    },
    "org_deploy_enabled": true,
    "socket_mode_enabled": false,
    "token_rotation_enabled": false
  }
}
```

### 4. Invite Bot to Your Slack Channel

1. Open Slack and go to the channel with ID `C0A26VDU5PD` (or your desired channel)
2. Type `/invite @lead-agent` (or your bot's name)
3. The bot should now be a member of the channel

---

## Testing the Integration

### Test the Complete Flow:

1. **Submit a test lead** at https://sdr-agent-edex.vercel.app/
   - Fill in the form with test data
   - Submit the form

2. **Check Slack** for the approval message
   - You should receive a message in your configured channel
   - The message will contain:
     - Lead information
     - Research summary
     - Qualification result
     - Generated email draft
     - Two buttons: **👍 Approve** and **👎 Reject**

3. **Click a button** to test the interaction
   - Approve: Will trigger email sending logic
   - Reject: Will log the rejection

### Troubleshooting

#### No message appears in Slack:
- Check Vercel logs: `vercel logs --follow`
- Verify the bot is a member of the channel
- Ensure `SLACK_CHANNEL_ID` matches your channel
- Check that the workflow completes successfully

#### Buttons don't respond:
- Verify the **Request URL** is set correctly in Slack dashboard
- Check that interactivity is enabled
- Look for errors in Vercel function logs

#### 401 Unauthorized errors:
- Verify `SLACK_SIGNING_SECRET` matches your app's secret
- Check that `SLACK_BOT_TOKEN` is valid and starts with `xoxb-`

#### Cannot find channel:
- Get the channel ID by right-clicking the channel → **View channel details** → Copy the ID at the bottom
- Update `SLACK_CHANNEL_ID` in Vercel environment variables

---

## How It Works

### Workflow Flow:
```
1. User submits form → /api/submit
2. Workflow starts → workflowInbound()
3. Research conducted → stepResearch()
4. Lead qualified → stepQualify()
5. Email generated → stepWriteEmail()
6. Slack message sent → stepHumanFeedback()
   ↓
   [Human reviews in Slack]
   ↓
7. User clicks button → /api/slack receives webhook
8. Email sent (on approval) → sendEmail()
```

### API Endpoints:
- **POST /api/submit** - Receives form submissions, kicks off workflow
- **POST /api/slack** - Receives Slack events and interactions

### Key Files:
- `lib/slack.ts` - Slack integration logic
- `app/api/slack/route.ts` - Slack webhook handler
- `workflows/inbound/steps.ts` - Workflow steps including `stepHumanFeedback`

---

## Security Notes

⚠️ **Important**: Your `.env.local` file contains sensitive credentials. Never commit this file to Git.

For production:
1. All secrets should be in Vercel Environment Variables
2. Consider rotating tokens periodically
3. Use Vercel's secret management for sensitive data

---

## Next Steps

After setup is complete:
1. Test with real leads
2. Customize the Slack message format in `lib/slack.ts`
3. Implement actual email sending in `lib/services.ts`
4. Add database storage for lead tracking
5. Customize qualification categories in `lib/types.ts`

---

## Support Resources

- [Vercel Slack Bolt Documentation](https://vercel.com/changelog/build-slack-agents-with-vercel-slack-bolt)
- [Slack Bolt for JavaScript](https://slack.dev/bolt-js/)
- [Workflow DevKit Docs](https://useworkflow.dev/)
- [Vercel AI SDK](https://ai-sdk.dev/)

