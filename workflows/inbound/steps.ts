import {
  humanFeedback,
  qualify,
  researchAgent,
  sendEmail,
  writeEmail
} from '@/lib/services';
import { FormSchema, QualificationSchema } from '@/lib/types';

/**
 * step to qualify the lead
 */
export const stepQualify = async (data: FormSchema, research: string) => {
  'use step';

  const qualification = await qualify(data, research);
  return qualification;
};

/**
 * step to research the lead
 */
export const stepResearch = async (data: FormSchema) => {
  'use step';

  console.log('\n════════════════════════════════════════════════════════');
  console.log('🔬 STEP 1: RESEARCH AGENT STARTING');
  console.log('════════════════════════════════════════════════════════');
  console.log('📧 Lead Email:', data.email);
  console.log('👤 Lead Name:', data.name);
  console.log('🏢 Company:', data.company || 'Not provided');
  console.log('📱 Phone:', data.phone || 'Not provided');
  console.log('💬 Message Preview:', data.message?.substring(0, 100) + '...');
  console.log('⏰ Start Time:', new Date().toISOString());
  console.log('────────────────────────────────────────────────────────');

  const startTime = Date.now();
  
  const { text: research } = await researchAgent.generate({
    prompt: `Research the lead: ${JSON.stringify(data)}`
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n✅ RESEARCH COMPLETED:');
  console.log('   Duration:', duration, 'seconds');
  console.log('   Research Length:', research.length, 'characters');
  console.log('   Research Preview:', research.substring(0, 200) + '...');
  console.log('════════════════════════════════════════════════════════\n');

  return research;
};

/**
 * step to write an email for the lead
 */
export const stepWriteEmail = async (
  research: string,
  qualification: QualificationSchema
) => {
  'use step';

  const email = await writeEmail(research, qualification);
  return email;
};

/**
 * step to send an email
 */
export const stepSendEmail = async (
  emailContent: string,
  recipientEmail?: string,
  recipientName?: string
) => {
  'use step';

  const result = await sendEmail(emailContent, recipientEmail, recipientName);
  return result;
};

/**
 * step to get human feedback for the email
 */
export const stepHumanFeedback = async (
  research: string,
  email: string,
  qualification: QualificationSchema
) => {
  'use step';

  console.log('🔍 stepHumanFeedback: Starting...');
  console.log('  - Has SLACK_BOT_TOKEN:', !!process.env.SLACK_BOT_TOKEN);
  console.log(
    '  - Has SLACK_SIGNING_SECRET:',
    !!process.env.SLACK_SIGNING_SECRET
  );
  console.log('  - SLACK_CHANNEL_ID:', process.env.SLACK_CHANNEL_ID);
  console.log('  - Qualification category:', qualification.category);

  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_SIGNING_SECRET) {
    console.warn(
      '⚠️  SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET is not set, skipping human feedback step'
    );
    return;
  }

  console.log('✅ Slack credentials found, sending message...');
  const slackMessage = await humanFeedback(research, email, qualification);
  console.log('✅ Slack message sent successfully:', slackMessage);
  return slackMessage;
};
