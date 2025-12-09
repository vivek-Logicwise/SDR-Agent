# Quick Setup Commands

## Deploy Updated Manifest to Git

```bash
git add manifest.json
git commit -m "Update Slack manifest with production URL"
git push origin main
```

Vercel will automatically redeploy your app.

---

## Get Slack Channel ID

If you need to find your Slack channel ID:

1. Right-click on the channel name in Slack
2. Select "View channel details"
3. Scroll to the bottom
4. Copy the Channel ID (starts with C...)

---

## Test Slack Connection Locally

```bash
npx tsx scripts/test-slack.ts
```

---

## View Vercel Logs (Real-time)

```bash
vercel logs --follow
```

Or visit: https://vercel.com/dashboard → Your Project → Logs

---

## Verify Environment Variables on Vercel

```bash
vercel env ls
```

Or visit: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

---

## Key Slack URLs to Update

In Slack API Dashboard (https://api.slack.com/apps):

1. **Interactivity & Shortcuts** → Request URL:
   ```
   https://sdr-agent-edex.vercel.app/api/slack
   ```

2. **Event Subscriptions** → Request URL:
   ```
   https://sdr-agent-edex.vercel.app/api/slack
   ```

---

## Test the Full Flow

1. Visit: https://sdr-agent-edex.vercel.app/
2. Submit a test lead
3. Check your Slack channel for the approval message
4. Click Approve or Reject

---

## Troubleshooting Quick Fixes

### Issue: Bot not in channel
```
Solution: In Slack, type: /invite @lead-agent
```

### Issue: Request URL verification failed
```
Solution: 
1. Ensure app is deployed to Vercel
2. Wait 30 seconds for deployment
3. Try updating the URL again in Slack dashboard
```

### Issue: Environment variables not working
```
Solution:
1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Add/update variables
4. Redeploy: Go to Deployments → Click "..." → Redeploy
```

---

## Required Environment Variables

Set these in Vercel Dashboard:

```
AI_GATEWAY_API_KEY=vck_...
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_CHANNEL_ID=C...
EXA_API_KEY=...
OPENAI_API_KEY=sk-proj-...
```

⚠️ Never commit `.env.local` to Git!
