import {
  Experimental_Agent as Agent,
  stepCountIs,
  tool,
  generateObject,
  generateText
} from 'ai';
import { openai } from '@ai-sdk/openai';
import OpenAI from 'openai';
import {
  FormSchema,
  QualificationSchema,
  qualificationSchema
} from '@/lib/types';
import { sendSlackMessageWithButtons } from '@/lib/slack';
import { z } from 'zod';
import { exa } from '@/lib/exa';

// Initialize OpenAI client
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

/**
 * Qualify the lead
 */
export async function qualify(
  lead: FormSchema,
  research: string
): Promise<QualificationSchema> {
  try {
    console.log('🎯 Qualifying lead with OpenAI...');

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a lead qualification expert. Analyze leads and categorize them accurately.'
        },
        {
          role: 'user',
          content: `Qualify the lead and give a reason for the qualification based on the following information:

LEAD DATA: ${JSON.stringify(lead, null, 2)}

RESEARCH: ${research}

Respond in JSON format with:
{
  "category": "QUALIFIED" | "FOLLOW_UP" | "UNQUALIFIED" | "SUPPORT",
  "reason": "brief explanation for the qualification decision"
}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    console.log('✅ Qualification result:', parsed.category);

    return {
      category: parsed.category || 'UNQUALIFIED',
      reason: parsed.reason || 'Unable to qualify lead'
    };
  } catch (error) {
    console.error('❌ Qualification error:', error);
    return {
      category: 'UNQUALIFIED',
      reason: 'Error during qualification process'
    };
  }
}

/**
 * Write an email
 */
export async function writeEmail(
  research: string,
  qualification: QualificationSchema
) {
  try {
    console.log('✉️ Generating email with OpenAI...');

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional sales email writer. Create personalized, engaging emails that provide value.'
        },
        {
          role: 'user',
          content: `Write a personalized email for a ${qualification.category} lead based on the following information:

RESEARCH: ${research}

QUALIFICATION REASON: ${qualification.reason}

Requirements:
- Professional and friendly tone
- Reference specific details from the research
- Provide clear value proposition
- Include a clear call-to-action
- Keep it concise (3-4 paragraphs max)
- No subject line, just the email body`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const email = completion.choices[0]?.message?.content || '';

    console.log('✅ Email generated successfully');

    return email;
  } catch (error) {
    console.error('❌ Email generation error:', error);
    return 'Hello,\n\nThank you for your interest. We would love to discuss how we can help your organization.\n\nBest regards';
  }
}

/**
 * Send the research and qualification to the human for approval in slack
 */
export async function humanFeedback(
  research: string,
  email: string,
  qualification: QualificationSchema
) {
  const message = `*New Lead Qualification*\n\n*Email:* ${email}\n*Category:* ${
    qualification.category
  }\n*Reason:* ${qualification.reason}\n\n*Research:*\n${research.slice(
    0,
    500
  )}...\n\n*Please review and approve or reject this email*`;

  const slackChannel = process.env.SLACK_CHANNEL_ID || '';

  return await sendSlackMessageWithButtons(slackChannel, message);
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
    return result;
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
  model: openai('gpt-4o-mini'),
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
