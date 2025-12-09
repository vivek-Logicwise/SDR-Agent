import { formSchema } from '@/lib/types';
import { checkBotId } from 'botid/server';
import { start } from 'workflow/api';
import { workflowInbound } from '@/workflows/inbound';

export async function POST(request: Request) {
  console.log('\n\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                📝 NEW FORM SUBMISSION RECEIVED                    ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🌐 Request URL:', request.url);
  console.log('📍 Request Method:', request.method);

  const verification = await checkBotId();
  console.log('🤖 Bot Check:', verification.isBot ? 'BLOCKED (Bot detected)' : 'PASSED');

  if (verification.isBot) {
    console.log('❌ Access denied - Bot detected');
    console.log('════════════════════════════════════════════════════════════════════\n');
    return Response.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await request.json();
  console.log('📦 Request Body:', JSON.stringify(body, null, 2));

  const parsedBody = formSchema.safeParse(body);
  if (!parsedBody.success) {
    console.log('❌ Validation failed:', parsedBody.error.message);
    console.log('════════════════════════════════════════════════════════════════════\n');
    return Response.json({ error: parsedBody.error.message }, { status: 400 });
  }

  console.log('✅ Validation passed');
  console.log('📧 Lead Email:', parsedBody.data.email);
  console.log('👤 Lead Name:', parsedBody.data.name);
  console.log('🏢 Company:', parsedBody.data.company || 'N/A');
  console.log('📱 Phone:', parsedBody.data.phone || 'N/A');
  console.log('💬 Message Length:', parsedBody.data.message?.length || 0, 'characters');
  console.log('\n🚀 Starting workflow...');
  console.log('════════════════════════════════════════════════════════════════════\n');

  await start(workflowInbound, [parsedBody.data]);

  console.log('✅ Workflow started successfully');
  console.log('📬 Response: Form submitted successfully');
  console.log('════════════════════════════════════════════════════════════════════\n\n');

  return Response.json(
    { message: 'Form submitted successfully' },
    { status: 200 }
  );
}
