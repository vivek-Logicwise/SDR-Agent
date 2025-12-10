import { FormSchema } from '@/lib/types';
import {
  stepHumanFeedback,
  stepQualify,
  stepResearch,
  stepSendEmail,
  stepWriteEmail
} from './steps';

/**
 * workflow to handle the inbound lead
 * - research the lead
 * - qualify the lead
 * - if the lead is qualified or follow up:
 *   - write an email for the lead
 *   - get human feedback for the email
 *   - send the email to the human for approval
 * - if the lead is not qualified or follow up:
 *   - take other actions here based on other qualification categories
 */
export const workflowInbound = async (data: FormSchema) => {
  'use workflow';

  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                  🚀 INBOUND LEAD WORKFLOW STARTED                 ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log('📧 Lead Email:', data.email);
  console.log('👤 Name:', data.name);
  console.log('🏢 Company:', data.company || 'N/A');
  console.log('📱 Phone:', data.phone || 'N/A');
  console.log('💬 Message:', data.message);
  console.log('⏰ Workflow Start:', new Date().toISOString());
  console.log('════════════════════════════════════════════════════════════════════\n');

  const workflowStartTime = Date.now();

  // Step 1: Research
  const research = await stepResearch(data);
  console.log('✅ Research completed');

  // Step 2: Qualify
  const qualification = await stepQualify(data, research);
  console.log('✅ Qualification completed:', {
    category: qualification.category,
    reason: qualification.reason
  });

  if (
    qualification.category === 'QUALIFIED' ||
    qualification.category === 'FOLLOW_UP'
  ) {
    console.log('\n✅ Lead qualifies for email (', qualification.category, ')');
    console.log('────────────────────────────────────────────────────────────────────');
    
    // Step 3: Generate Email
    const email = await stepWriteEmail(research, qualification);
    console.log('✅ Email generated successfully');
    console.log('📧 EMAIL CONTENT:');
    console.log('────────────────────────────────────────────────────────────────────');
    console.log(email);
    console.log('────────────────────────────────────────────────────────────────────\n');
    
    // Step 3.5: Send Email
    console.log('📧 Sending email...');
    await stepSendEmail(email, data.email, data.name);
    console.log('✅ Email sent successfully');

    // Step 4: Get Human Approval
    console.log('📤 Sending to Slack for approval...');
    await stepHumanFeedback(research, email, qualification);
    console.log('✅ Human feedback step completed');
  } else {
    console.log('\n⚠️  Lead did not qualify for email');
    console.log('   Category:', qualification.category);
    console.log('   Reason:', qualification.reason);
    console.log('   No Slack message will be sent.');
  }

  const workflowDuration = ((Date.now() - workflowStartTime) / 1000).toFixed(2);
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║               ✅ WORKFLOW COMPLETED SUCCESSFULLY                   ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log('⏱️  Total Duration:', workflowDuration, 'seconds');
  console.log('⏰ Workflow End:', new Date().toISOString());
  console.log('════════════════════════════════════════════════════════════════════\n\n');

  console.log('✅ Workflow completed for lead:', data.email);
  // take other actions here based on other qualification categories
};
