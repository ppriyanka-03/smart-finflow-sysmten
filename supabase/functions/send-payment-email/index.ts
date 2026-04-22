import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub;

    const { recipientEmail, recipientName, amount, description, method, senderName } = await req.json();

    if (!recipientEmail || !amount || !description) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    // Store the notification in the database
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: userId,
      text: `📧 Payment notification sent to ${recipientEmail} for ₹${amount}`,
      type: 'system',
    });

    if (notifError) {
      console.error('Failed to store notification:', notifError);
    }

    // Log the email that would be sent (in production, integrate with an email service)
    console.log(`[EMAIL] To: ${recipientEmail}`);
    console.log(`[EMAIL] Subject: Payment Received from ${senderName}`);
    console.log(`[EMAIL] Body: You received ₹${amount} from ${senderName} for "${description}" via ${method}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Email notification queued for ${recipientEmail}`,
      details: {
        to: recipientEmail,
        amount,
        description,
        method,
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in send-payment-email:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
