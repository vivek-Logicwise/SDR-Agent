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
import nodemailer from 'nodemailer';

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
    prompt: `
         You are a Lead Qualification AI for Datapelago.

         Your job is to classify leads into one of the following categories:
            - Qualified — Strong match to ICP, clear need, and intent to purchase
            - Follow-up — Partial fit or unclear intent; needs nurturing
            - Irrelevant — Not a target market or no business value

        Evaluate both the LEAD DATA and RESEARCH findings and return a JSON response:

        {
            "qualification": "<Qualified | Follow-up | Irrelevant>",
            "reason": "<1-3 clear bullet points about why you classified this lead>"
        }

        Rules:
           - Base your decision ONLY on provided information
           - Be concise and business-focused
           - Do not hallucinate facts not found in the data

       LEAD DATA:
           ${JSON.stringify(lead, null, 2)}

       RESEARCH:${research} `
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

  const { text } = await generateText({
    model: 'openai/gpt-5',
    prompt: `You are writing a professional, concise sales email for a ${qualification.category} lead.

Based on the research below, write an email that is:
- Direct and action-oriented
- Focused on their specific pain points and goals
- Includes a clear value proposition
- Has a strong call-to-action
- Professional but conversational tone
- grab the information and working approch from "https://www.datapelago.ai/" cause this company offering proposal reaserch based on lead problem.
- Don't '-' use overly formal language or human generated emotional to lead email templates.

Use this structure:

Subject: [Compelling subject line related to their pain point or goal]

Hi {FirstName},

[Opening paragraph: Reference their specific pain point or goal mentioned in their inquiry]

[Value proposition paragraph: Briefly explain how we can help them achieve their desired outcome]

Quick recap:
- Your goal: [Their specific goal/metric from research]
- Our approach: [Brief solution summary addressing their pain point]
- Expected impact: [Realistic metric or outcome]
- Implementation: [Timeline and what's involved]

Proposal at a glance:
- Package: [Recommended tier/plan]
- Pricing: [Pricing structure]
- Terms: [Contract details, pilot if applicable]
- Target start: [Proposed start date]


Thanks,
[Your Name]
[Your Title]
[Your Company]
[Contact details]

---

Research and lead information:
${research}

Qualification reason: ${qualification.reason}

IMPORTANT:
- Keep the email concise and proffessional tone(under 250 words for the body)
- Use specific details from the research
- Make it feel personalized, not templated
- Focus on action and next steps
- Include placeholders like {FirstName}, [calendar link], etc. for fields we don't have`
  });

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
  const message = `*New Lead Qualification*\n\n*Email:* ${email}\n*Category:* ${qualification.category}
  \n*Reason:* ${qualification.reason}\n\n*Research:*\n${research.slice(
    0,
    500
  )}...\n\n*Please review and approve or reject this email*`;

  const slackChannel = process.env.SLACK_CHANNEL_ID || '';

  if (!slackChannel) {
    throw new Error('SLACK_CHANNEL_ID is required but not set');
  }

  try {
    const result = await sendSlackMessageWithButtons(slackChannel, message);
    return result;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Send an email using Gmail SMTP
 */
export async function sendEmail(
  emailContent: string,
  recipientEmail?: string,
  recipientName?: string
) {

  try {
    // Check for required environment variables
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    const toEmail = 'viveksavani008@gmail.com';

    if (!gmailUser || !gmailAppPassword) {
      return {
        success: true,
        simulated: true,
        message: 'Email simulated - Gmail credentials not configured'
      };
    }

    // Parse email content to extract subject if present
    let subject = 'Re: Your Inquiry';
    let body = emailContent;
    
    // Try to extract subject line if email starts with "Subject:"
    const subjectMatch = emailContent.match(/^Subject:\s*(.+?)(\n|$)/i);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
      body = emailContent.substring(subjectMatch[0].length).trim();
    }
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      }
    });

    // Convert line breaks to HTML
    const htmlBody = body.replace(/\n/g, '<br>');

    // Send email
    const info = await transporter.sendMail({
      from: `"LogicWise Works" <${gmailUser}>`,
      to: recipientName ? `"${recipientName}" <${toEmail}>` : toEmail,
      subject: subject,
      text: body,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${htmlBody}</div>`
    });

    return {
      success: true,
      emailId: info.messageId,
      simulated: false
    };
  } catch (error: any) {
    // Don't throw error, just log it and return failure status
    // This prevents the workflow from breaking if email fails
    return {
      success: false,
      error: error.message,
      simulated: false
    };
  }
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
  - research should be based on this company https://www.datapelago.ai/
  
  Synthesize the information you find into a comprehensive report.
  `,
  tools: {
    search,
    queryKnowledgeBase,
    fetchUrl,
    crmSearch,
    techStackAnalysis
  },
  stopWhen: [stepCountIs(20)] // stop after max 20 steps deepdive
});
