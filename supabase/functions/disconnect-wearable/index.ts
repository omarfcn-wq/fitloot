import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { provider, userId } = await req.json();

    if (!provider || !userId) {
      throw new Error('Provider and userId are required');
    }

    const { data: connection } = await supabaseClient
      .from('wearable_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (connection?.access_token) {
      try {
        if (provider === 'fitbit') {
          const clientId = Deno.env.get('FITBIT_CLIENT_ID') ?? '';
          const clientSecret = Deno.env.get('FITBIT_CLIENT_SECRET') ?? '';
          await fetch('https://api.fitbit.com/oauth2/revoke', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `token=${connection.access_token}`
          });
        } else if (provider === 'google_fit') {
          await fetch('https://oauth2.googleapis.com/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `token=${connection.access_token}`
          });
        }
      } catch (revokeError) {
        console.warn('Failed to revoke token at provider:', revokeError);
      }
    }

    const { error: updateError } = await supabaseClient
      .from('wearable_connections')
      .update({
        is_active: false,
        access_token: null,
        refresh_token: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('provider', provider);

    if (updateError) {
      throw new Error('Failed to disconnect device');
    }

    return new Response(
      JSON.stringify({ success: true, message: `${provider} disconnected successfully` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error: any) {
    console.error('Disconnect error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});
