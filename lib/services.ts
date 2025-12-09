import {
  Experimental_Agent as Agent,
  stepCountIs,
  tool,
  generateObject,
  generateText
} from 'ai';
import {
  FormSchema,
  QualificationSchema,
  qualificationSchema
} from '@/lib/types';
import { sendSlackMessageWithButtons } from '@/lib/slack';
import { z } from 'zod';
import { exa } from '@/lib/exa';

/**
 * Qualify the lead
 */
export async function qualify(
  lead: FormSchema,
  research: string
): Promise<QualificationSchema> {
  console.log('\n════════════════════════════════════════════════════');
  console.log('🎯 STEP 2: QUALIFYING LEAD');
  console.log('════════════════════════════════════════════════════');
  console.log('📧 Lead Email:', lead.email);
  console.log('👤 Lead Name:', lead.name);
  console.log('🏢 Company:', lead.company || 'Not provided');
  console.log('📝 Message:', lead.message?.substring(0, 100) + '...');
  console.log('🔍 Research Length:', research.length, 'characters');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('────────────────────────────────────────────────────');

  const { object } = await generateObject({
    model: 'openai/gpt-5',
    schema: qualificationSchema,
    prompt: `Qualify the lead and give a reason for the qualification based on the following information: LEAD DATA: ${JSON.stringify(
      lead
    )} and RESEARCH: ${research}`
  });

  console.log('\n✅ QUALIFICATION RESULT:');
  console.log('   Category:', object.category);
  console.log('   Reason:', object.reason);
  console.log('════════════════════════════════════════════════════\n');

  return object;
}

/**
 * Write an email
 */
export async function writeEmail(
  research: string,
  qualification: QualificationSchema
) {
  console.log('\n════════════════════════════════════════════════════');
  console.log('✉️  STEP 3: GENERATING EMAIL');
  console.log('════════════════════════════════════════════════════');
  console.log('📊 Qualification Category:', qualification.category);
  console.log('💡 Reason:', qualification.reason);
  console.log('📄 Research Summary:', research.substring(0, 200) + '...');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('────────────────────────────────────────────────────');

  const { text } = await generateText({
    model: 'openai/gpt-5',
    prompt: `Write an email for a ${
      qualification.category
    } lead based on the following information: ${JSON.stringify(research)}`
  });

  console.log('\n✅ EMAIL GENERATED:');
  console.log('   Length:', text.length, 'characters');
  console.log('   Preview:', text.substring(0, 150) + '...');
  console.log('════════════════════════════════════════════════════\n');

  return text;
}

/**
 * Send the research and qualification to the human for approval in slack
 */
export async function humanFeedback(
  research: string,
  email: string,
  qualification: QualificationSchema
) {
  console.log('\n════════════════════════════════════════════════════');
  console.log('💬 STEP 4: SENDING TO SLACK FOR APPROVAL');
  console.log('════════════════════════════════════════════════════');
  console.log('📧 Email Preview:', email.substring(0, 100) + '...');
  console.log('📊 Category:', qualification.category);
  console.log('💡 Reason:', qualification.reason);
  console.log('🔧 SLACK_CHANNEL_ID:', process.env.SLACK_CHANNEL_ID || 'NOT SET');
  console.log('🔑 SLACK_BOT_TOKEN exists:', !!process.env.SLACK_BOT_TOKEN);
  console.log('🔐 SLACK_SIGNING_SECRET exists:', !!process.env.SLACK_SIGNING_SECRET);
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('────────────────────────────────────────────────────');

  const message = `*New Lead Qualification*\n\n*Email:* ${email}\n*Category:* ${
    qualification.category
  }\n*Reason:* ${qualification.reason}\n\n*Research:*\n${research.slice(
    0,
    500
  )}...\n\n*Please review and approve or reject this email*`;

  const slackChannel = process.env.SLACK_CHANNEL_ID || '';

  if (!slackChannel) {
    console.error('\n❌ ERROR: SLACK_CHANNEL_ID is not set!');
    throw new Error('SLACK_CHANNEL_ID is required but not set');
  }

  console.log('📤 Sending message to channel:', slackChannel);
  console.log('📏 Message length:', message.length, 'characters');

  try {
    const result = await sendSlackMessageWithButtons(slackChannel, message);
    console.log('\n✅ SLACK MESSAGE SENT SUCCESSFULLY!');
    console.log('   Channel:', result.channel);
    console.log('   Message TS:', result.messageTs);
    console.log('════════════════════════════════════════════════════\n');
    return result;
  } catch (error: any) {
    console.error('\n❌ SLACK ERROR:', error.message);
    console.error('   Error Code:', error.code);
    console.error('   Error Data:', error.data);
    console.error('════════════════════════════════════════════════════\n');
    throw error;
  }
}

/**
 * Send an email
 */
export async function sendEmail(email: string) {
  /**
   * send email using provider like sendgrid, mailgun, resend etc.
   */
}

/**
 * ------------------------------------------------------------
 * Agent & Tools
 * ------------------------------------------------------------
 */

/**
 * Fetch tool
 */
export const fetchUrl = tool({
  description: 'Return visible text from a public URL as Markdown.',
  inputSchema: z.object({
    url: z.string().describe('Absolute URL, including http:// or https://')
  }),
  execute: async ({ url }) => {
    const result = await exa.getContents(url, {
      text: true
    });
    return result;
  }
});

/**
 * CRM Search tool
 */
export const crmSearch = tool({
  description:
    'Search existing Vercel CRM for opportunities by company name or domain',
  inputSchema: z.object({
    name: z
      .string()
      .describe('The name of the company to search for (e.g. "Vercel")')
  }),
  execute: async ({ name }) => {
    // fetch from CRM like Salesforce, Hubspot, or Snowflake, etc.
    return [];
  }
});

/**
 * Tech-stack analysis tool
 */
export const techStackAnalysis = tool({
  description: 'Return tech stack analysis for a domain.',
  inputSchema: z.object({
    domain: z.string().describe('Domain, e.g. "vercel.com"')
  }),
  execute: async ({ domain }) => {
    // fetch the tech stack for the domain
    return [];
  }
});

/**
 * Search tool
 */
const search = tool({
  description: 'Search the web for information',
  inputSchema: z.object({
    keywords: z
      .string()
      .describe(
        'The entity to search for (e.g. "Apple") — do not include any Vercel specific keywords'
      ),
    resultCategory: z
      .enum([
        'company',
        'research paper',
        'news',
        'pdf',
        'github',
        'tweet',
        'personal site',
        'linkedin profile',
        'financial report'
      ])
      .describe('The category of the result you are looking for')
  }),
  execute: async ({ keywords, resultCategory }) => {
    console.log('\n🔍 SEARCH TOOL EXECUTED:');
    console.log('   Keywords:', keywords);
    console.log('   Category:', resultCategory);
    console.log('   ⏰ Time:', new Date().toISOString());
    
    try {
      /**
       * Deep research using exa.ai
       * Return the results in markdown format
       */
      const result = await exa.searchAndContents(keywords, {
        numResults: 2,
        type: 'keyword',
        category: resultCategory,
        summary: true
      });
      
      console.log('   ✅ Results found:', result?.results?.length || 0);
      if (result?.results && result.results.length > 0) {
        result.results.forEach((r: any, i: number) => {
          console.log(`   ${i + 1}. ${r.title || 'No title'}`);
          console.log(`      URL: ${r.url || 'No URL'}`);
        });
      }
      
      return result;
    } catch (error: any) {
      console.error('   ❌ Search error:', error.message);
      throw error;
    }
  }
});

/**
 * Query the knowledge base
 */
const queryKnowledgeBase = tool({
  description: 'Query the knowledge base for the given query.',
  inputSchema: z.object({
    query: z.string()
  }),
  execute: async ({ query }: { query: string }) => {
    /**
     * Query the knowledge base for the given query
     * - ex: pull from turbopuffer, pinecone, postgres, snowflake, etc.
     * Return the context from the knowledge base
     */
    return 'Context from knowledge base for the given query';
  }
});

/**
 * Research agent
 *
 * This agent is used to research the lead and return a comprehensive report
 */
export const researchAgent = new Agent({
  model: 'openai/gpt-5',
  system: `
  You are a researcher to find information about a lead. You are given a lead and you need to find information about the lead.
  
  You can use the tools provided to you to find information about the lead: 
  - search: Searches the web for information
  - queryKnowledgeBase: Queries the knowledge base for the given query
  - fetchUrl: Fetches the contents of a public URL
  - crmSearch: Searches the CRM for the given company name
  - techStackAnalysis: Analyzes the tech stack of the given domain
  
  Synthesize the information you find into a comprehensive report.
  `,
  tools: {
    search,
    queryKnowledgeBase,
    fetchUrl,
    crmSearch,
    techStackAnalysis
    // add other tools here
  },
  stopWhen: [stepCountIs(20)] // stop after max 20 steps
});
