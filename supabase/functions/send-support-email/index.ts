import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SupportEmailRequest {
  userEmail: string;
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const { userEmail, subject, message, priority }: SupportEmailRequest = await req.json();

    if (!userEmail || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const brevoApiKey = Deno.env.get('BREVO_API_KEY');

    if (!brevoApiKey) {
      console.error('BREVO_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const priorityLabel = priority === 'high' ? '🔴 HOCH' : priority === 'normal' ? '🟡 NORMAL' : '🟢 NIEDRIG';

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #d4af37 0%, #c19a2e 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .field { margin-bottom: 20px; }
    .label { font-weight: bold; color: #0a253c; margin-bottom: 5px; }
    .value { background: white; padding: 10px; border-radius: 5px; border-left: 3px solid #d4af37; }
    .priority { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin-bottom: 10px; }
    .priority-high { background: #ffebee; color: #c62828; }
    .priority-normal { background: #fff9e6; color: #f57f17; }
    .priority-low { background: #e8f5e9; color: #2e7d32; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">💌 Neue Support-Anfrage</h2>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">TraumtagHelden - Hochzeitsplaner</p>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Priorität:</div>
        <div class="priority priority-${priority}">
          ${priorityLabel}
        </div>
      </div>

      <div class="field">
        <div class="label">Von:</div>
        <div class="value">${userEmail}</div>
      </div>

      <div class="field">
        <div class="label">Betreff:</div>
        <div class="value">${subject}</div>
      </div>

      <div class="field">
        <div class="label">Nachricht:</div>
        <div class="value" style="white-space: pre-wrap;">${message}</div>
      </div>

      <div class="footer">
        <p>Diese Nachricht wurde über das Kontaktformular auf TraumtagHelden.de gesendet.</p>
        <p>Zeitstempel: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'TraumtagHelden Support',
          email: 'noreply@traumtaghelden.de',
        },
        to: [
          {
            email: 'sven@traumtaghelden.de',
            name: 'Sven - TraumtagHelden Support',
          },
        ],
        replyTo: {
          email: userEmail,
        },
        subject: `[${priorityLabel}] ${subject}`,
        htmlContent: emailBody,
      }),
    });

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      console.error('Brevo API error:', errorText);
      throw new Error(`Brevo API returned ${brevoResponse.status}`);
    }

    console.log(`Support email sent successfully from ${userEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error sending support email:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
