import { FormSchema } from '@/lib/types';
import {
  stepHumanFeedback,
  stepQualify,
  stepResearch,
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

  console.log('🚀 Workflow started for lead:', data.email);

  const research = await stepResearch(data);
  console.log('✅ Research completed');

  const qualification = await stepQualify(data, research);
  console.log('✅ Qualification completed:', {
    category: qualification.category,
    reason: qualification.reason
  });

  if (
    qualification.category === 'QUALIFIED' ||
    qualification.category === 'FOLLOW_UP'
  ) {
    console.log('✅ Lead qualifies for email - generating email...');
    const email = await stepWriteEmail(research, qualification);
    console.log('✅ Email generated - sending for approval...');
    await stepHumanFeedback(research, email, qualification);
    console.log('✅ Human feedback step completed');
  } else {
    console.log(
      '⚠️  Lead did not qualify for email. Category:',
      qualification.category
    );
  }

  console.log('✅ Workflow completed for lead:', data.email);
  // take other actions here based on other qualification categories
};
