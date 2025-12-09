# Slack Approval Not Showing - Troubleshooting Guide

## Quick Diagnostic Steps

Follow these steps in order to identify why the Slack approval message isn't appearing.

---

## Step 1: Verify Environment Variables on Vercel ⚠️ **MOST COMMON ISSUE**

Your local `.env.local` has the variables, but Vercel needs them too!

### Check Variables:
1. Go to https://vercel.com/dashboard
2. Select your **sdr-agent-edex** project
3. Go to **Settings** → **Environment Variables**
4. Verify these exist:
   ```
   SLACK_BOT_TOKEN=xoxb-10094310014145-...
   SLACK_SIGNING_SECRET=5a0a1e0c23c8c2c657c466564952d737
   SLACK_CHANNEL_ID=C0A26VDU5PD
   AI_GATEWAY_API_KEY=vck_3rUEuA5K3NAvrYlDNtCjZfjEKYQqdFlQHPpupaUV1PhhBsfaUr4Da180
   EXA_API_KEY=f44061e7-66e5-4892-babd-fdefe276dc88
   OPENAI_API_KEY=sk-proj-...
   ```

### If Missing or Wrong:
1. Add/update each variable in Vercel
2. **IMPORTANT**: Go to **Deployments** tab
3. Click on the latest deployment → **⋮ (three dots)** → **Redeploy**
4. Environment variables only take effect after redeployment!

---

## Step 2: Check Vercel Deployment Logs

### View Real-Time Logs:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click **Logs** tab
4. Submit a test lead on your site
5. Watch for errors in real-time

### Common Error Messages:
- ❌ `SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET is not set` → Fix env vars
- ❌ `channel_not_found` → Wrong SLACK_CHANNEL_ID or bot not invited
- ❌ `not_in_channel` → Bot needs to be invited to channel
- ❌ `invalid_auth` → Wrong SLACK_BOT_TOKEN
- ✅ No errors but no message → Check Step 3

---

## Step 3: Verify Slack Channel ID

### Get Correct Channel ID:
1. Open Slack desktop/web app
2. Right-click on the channel name
3. Select **View channel details**
4. Scroll to the bottom
5. Copy the **Channel ID** (format: C0XXXXXXXXX)

### Update if Different:
1. In Vercel Dashboard → Settings → Environment Variables
2. Update `SLACK_CHANNEL_ID`
3. Redeploy the application

---

## Step 4: Check if Bot is in Channel

### Verify Bot Membership:
1. Open the Slack channel
2. Click the channel name at top
3. Look in the **Members** list
4. Search for **lead-agent** (or your bot name)

### If Bot is Missing:
1. In the channel, type: `/invite @lead-agent`
2. Press Enter
3. Confirm the bot is now listed in members

---

## Step 5: Verify Slack App Configuration

### Check Request URLs:
1. Go to https://api.slack.com/apps
2. Select your app
3. **Interactivity & Shortcuts**:
   - Should be **ON**
   - Request URL: `https://sdr-agent-edex.vercel.app/api/slack`
   - Click **Save Changes** if you update
4. **Event Subscriptions**:
   - Should be **ON**
   - Request URL: `https://sdr-agent-edex.vercel.app/api/slack`
   - Should show ✅ **Verified**
   - Click **Save Changes** if you update

### If URL Shows Error:
- Make sure your Vercel deployment is live
- Wait 1 minute and try verifying again
- Check that `/api/slack/route.ts` file exists

---

## Step 6: Test Workflow Execution

### Check if Workflow Runs:
1. Go to Vercel Dashboard → Logs
2. Submit a test lead
3. Look for these log messages:
   ```
   ✅ "Form submitted successfully"
   ✅ "Research agent started"
   ✅ "Qualification complete"
   ✅ "Email generated"
   ✅ "Sending to Slack..."
   ```

### If Workflow Doesn't Start:
- Check for form validation errors
- Verify bot detection isn't blocking (remove `botid` check temporarily)
- Check `/api/submit` endpoint logs

---

## Step 7: Check Bot Token Permissions

### Verify Scopes:
1. Go to https://api.slack.com/apps
2. Select your app
3. **OAuth & Permissions** → **Scopes** → **Bot Token Scopes**
4. Required scopes:
   - ✅ `chat:write`
   - ✅ `chat:write.public`

### If Scopes Missing:
1. Click **Add an OAuth Scope**
2. Add missing scopes
3. **Important**: Click **Reinstall to Workspace** at top
4. Authorize the updated permissions
5. Copy the new bot token if it changed
6. Update `SLACK_BOT_TOKEN` in Vercel if needed

---

## Step 8: Manual Test Script

Run this locally to test Slack connection:

```bash
npx tsx scripts/test-slack.ts
```

Expected output:
```
✅ Authentication successful!
   Bot User: U0123456789
   Team: Your Workspace

✅ Channel found: #your-channel

✨ Slack integration is ready!
```

If this fails locally, your tokens are invalid or bot isn't set up correctly.

---

## Step 9: Test with Simple Message

Let's verify Slack works at all by sending a test message.

### Create Test Endpoint:
Create `app/api/test-slack/route.ts`:

```typescript
import { sendSlackMessageWithButtons } from '@/lib/slack';

export async function GET() {
  try {
    const channelId = process.env.SLACK_CHANNEL_ID || '';
    const result = await sendSlackMessageWithButtons(
      channelId,
      '*Test Message* from lead-agent\n\nThis is a test to verify Slack integration.'
    );
    return Response.json({ success: true, result });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

### Test It:
1. Deploy the changes
2. Visit: `https://sdr-agent-edex.vercel.app/api/test-slack`
3. Check if message appears in Slack
4. If yes: Problem is in the workflow
5. If no: Problem is with Slack connection

---

## Step 10: Check Form Submission

### Verify Lead Qualifies for Slack:
Look at `workflows/inbound/index.ts`:

```typescript
if (
  qualification.category === 'QUALIFIED' ||
  qualification.category === 'FOLLOW_UP'
) {
  const email = await stepWriteEmail(research, qualification);
  await stepHumanFeedback(research, email, qualification);
}
```

**The lead must be QUALIFIED or FOLLOW_UP** to trigger Slack approval!

### Test with Qualifying Lead:
Submit a form with these values:
- **Email**: ceo@bigcompany.com
- **Name**: John Smith
- **Company**: Microsoft
- **Phone**: +1234567890
- **Message**: "We're interested in your enterprise solution for our 10,000+ employees"

This should definitely qualify and trigger Slack.

---

## Common Solutions

### ✅ Solution 1: Environment Variables Not Set
```bash
# Fix: Add to Vercel → Settings → Environment Variables
# Then: Redeploy the application
```

### ✅ Solution 2: Bot Not in Channel
```bash
# Fix: In Slack, type: /invite @lead-agent
```

### ✅ Solution 3: Wrong Channel ID
```bash
# Fix: Get correct ID from channel details
# Update SLACK_CHANNEL_ID in Vercel
# Redeploy
```

### ✅ Solution 4: Stale Deployment
```bash
# Fix: Force redeploy in Vercel Dashboard
# Deployments → Latest → ⋮ → Redeploy
```

### ✅ Solution 5: Lead Doesn't Qualify
```bash
# Fix: Submit test lead with "enterprise" or "interested in product"
# This should trigger QUALIFIED or FOLLOW_UP category
```

---

## Debug Checklist

Use this checklist to track what you've verified:

- [ ] Environment variables set in Vercel
- [ ] Application redeployed after env var changes
- [ ] SLACK_CHANNEL_ID matches actual channel
- [ ] Bot invited to Slack channel
- [ ] Bot visible in channel member list
- [ ] Slack Request URLs updated to production
- [ ] Request URLs show as "Verified" in Slack dashboard
- [ ] Bot token has `chat:write` scope
- [ ] Vercel logs show no Slack errors
- [ ] Test lead qualifies as QUALIFIED or FOLLOW_UP
- [ ] Workflow completes successfully in logs

---

## Get Help

If still not working, gather this info:

1. **Vercel Logs**: Copy last 50 lines after submitting lead
2. **Slack App ID**: From https://api.slack.com/apps
3. **Channel ID**: From Slack channel details
4. **Error Messages**: Any red errors in logs

Then we can debug further!

---

## Quick Command Reference

```bash
# View Vercel logs
vercel logs --follow

# Test Slack connection locally
npx tsx scripts/test-slack.ts

# Check git status
git status

# Redeploy (if using Vercel CLI)
vercel --prod
```
