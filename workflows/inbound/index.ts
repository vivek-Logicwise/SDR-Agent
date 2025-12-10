import { FormSchema } from '@/lib/types';
import {
  stepHumanFeedback,
  stepQualify,
  stepResearch,
  stepSendEmail,
  stepWriteEmail
} from './steps';


export const workflowInbound = async (data: FormSchema) => {
  'use workflow';

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

  if ( qualification.category === 'QUALIFIED' || qualification.category === 'FOLLOW_UP') 
  {
    // Step 3: Generate Email
    const email = await stepWriteEmail(research, qualification);
    
    // Step 3.5: Send Email
    console.log('Sending email...');
    await stepSendEmail(email, data.email, data.name);
    console.log('Email sent successfully');

    // // Step 4: Get Human Approval
    // console.log('Sending to Slack for approval...');
    // await stepHumanFeedback(research, email, qualification);
    // console.log('Human feedback step completed');
  } 
  else 
  {
    console.log('Lead did not qualify for email');
  }

  const workflowDuration = ((Date.now() - workflowStartTime) / 1000).toFixed(2);

  console.log('✅ Workflow completed for lead:', data.email);
  // take other actions here based on other qualification categories
};
