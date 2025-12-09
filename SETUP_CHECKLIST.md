# Slack Integration Setup Checklist

Use this checklist to track your Slack integration setup progress.

## ✅ Pre-Setup (Already Complete)
- [x] Slack bot token obtained
- [x] Slack signing secret obtained
- [x] Slack channel ID identified
- [x] Environment variables configured locally
- [x] Code implementation complete

---

## 🔧 Configuration Steps

### 1. Update Slack App Settings
Visit: https://api.slack.com/apps

- [ ] Navigate to your lead-agent app
- [ ] Update **Interactivity & Shortcuts**:
  - [ ] Enable Interactivity
  - [ ] Set Request URL: `https://sdr-agent-edex.vercel.app/api/slack`
  - [ ] Save Changes
- [ ] Update **Event Subscriptions**:
  - [ ] Enable Events
  - [ ] Set Request URL: `https://sdr-agent-edex.vercel.app/api/slack`
  - [ ] Verify bot events: `app_mention`, `message.channels`
  - [ ] Save Changes
- [ ] Verify **OAuth & Permissions**:
  - [ ] Confirm scope: `chat:write`
  - [ ] Add scope if missing: `chat:write.public`
  - [ ] Add scope if missing: `app_mentions:read`
  - [ ] Reinstall app if scopes changed

### 2. Update Vercel Environment Variables
Visit: https://vercel.com/dashboard

- [ ] Go to your project settings
- [ ] Navigate to Environment Variables
- [ ] Verify these are set:
  - [ ] `SLACK_BOT_TOKEN`
  - [ ] `SLACK_SIGNING_SECRET`
  - [ ] `SLACK_CHANNEL_ID`
  - [ ] `AI_GATEWAY_API_KEY`
  - [ ] `EXA_API_KEY`
- [ ] Redeploy if you made changes

### 3. Invite Bot to Channel
In Slack workspace:

- [ ] Open the channel (ID: C0A26VDU5PD or your channel)
- [ ] Type: `/invite @lead-agent`
- [ ] Confirm bot is now a member

### 4. Deploy Updates
In your terminal:

- [ ] Commit manifest.json changes: `git add manifest.json`
- [ ] Commit: `git commit -m "Update Slack manifest for production"`
- [ ] Push: `git push origin main`
- [ ] Verify Vercel auto-deploys the changes

---

## 🧪 Testing

### Test Slack Connection Locally (Optional)
```bash
npx tsx scripts/test-slack.ts
```

Expected output:
- ✅ Authentication successful
- ✅ Channel found

### Test Complete Integration
1. **Submit Test Lead**:
   - [ ] Go to: https://sdr-agent-edex.vercel.app/
   - [ ] Fill out the form with test data:
     - Email: test@company.com
     - Name: Test User
     - Company: Test Company
     - Message: I'm interested in your product
   - [ ] Submit form
   - [ ] Verify success message appears

2. **Check Slack Channel**:
   - [ ] Open your configured Slack channel
   - [ ] Wait for the approval message (may take 30-60 seconds)
   - [ ] Verify message contains:
     - Research summary
     - Qualification result
     - Email draft
     - Approve/Reject buttons

3. **Test Button Interaction**:
   - [ ] Click **👍 Approve** or **👎 Reject**
   - [ ] Verify button responds
   - [ ] Check Vercel logs for confirmation

---

## 🐛 Troubleshooting

### No message appears in Slack
- [ ] Check Vercel deployment logs
- [ ] Verify workflow completed successfully
- [ ] Confirm bot is channel member
- [ ] Verify SLACK_CHANNEL_ID matches channel

### Buttons don't work
- [ ] Verify Request URL in Slack dashboard
- [ ] Check interactivity is enabled
- [ ] Review Vercel function logs

### 401 Unauthorized
- [ ] Verify SLACK_SIGNING_SECRET is correct
- [ ] Confirm SLACK_BOT_TOKEN starts with `xoxb-`

---

## 📝 Post-Setup Tasks

After successful testing:

- [ ] Test with different lead types (qualified, unqualified, follow-up)
- [ ] Customize Slack message format in `lib/slack.ts`
- [ ] Implement actual email sending in `lib/services.ts`
- [ ] Set up lead tracking database
- [ ] Configure error monitoring
- [ ] Document your customizations

---

## 📚 Quick Reference

### URLs
- Production App: https://sdr-agent-edex.vercel.app/
- Slack API Dashboard: https://api.slack.com/apps
- Vercel Dashboard: https://vercel.com/dashboard

### Channel ID
- Your channel: C0A26VDU5PD

### Key Files
- Slack integration: `lib/slack.ts`
- Webhook handler: `app/api/slack/route.ts`
- Workflow steps: `workflows/inbound/steps.ts`
- Manifest: `manifest.json`

---

**Status**: In Progress  
**Last Updated**: December 9, 2025
