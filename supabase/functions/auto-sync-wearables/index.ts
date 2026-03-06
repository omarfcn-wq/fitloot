import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active wearable connections
    const { data: connections, error: connError } = await supabaseClient
      .from('wearable_connections')
      .select('*')
      .eq('is_active', true);

    if (connError) {
      throw new Error(`Failed to fetch connections: ${connError.message}`);
    }

    if (!connections || connections.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active connections to sync', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Auto-sync: Found ${connections.length} active connections`);

    let totalActivities = 0;
    let totalCredits = 0;
    let errors: string[] = [];

    for (const connection of connections) {
      try {
        // Call the existing sync function for each connection
        const syncUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-wearable-activities`;
        const response = await fetch(syncUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            provider: connection.provider,
            userId: connection.user_id,
          }),
        });

        const result = await response.json();

        if (result.success) {
          totalActivities += result.activitiesAdded || 0;
          totalCredits += result.creditsEarned || 0;
          console.log(`Synced ${connection.provider} for user ${connection.user_id}: +${result.activitiesAdded} activities, +${result.creditsEarned} credits`);
        } else {
          errors.push(`${connection.provider}/${connection.user_id}: ${result.error}`);
          console.error(`Sync failed for ${connection.provider}/${connection.user_id}: ${result.error}`);
        }
      } catch (err: any) {
        errors.push(`${connection.provider}/${connection.user_id}: ${err.message}`);
        console.error(`Error syncing ${connection.provider}/${connection.user_id}:`, err.message);
      }
    }

    console.log(`Auto-sync complete: ${totalActivities} activities, ${totalCredits} credits, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        synced: connections.length,
        totalActivities,
        totalCredits,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Auto-sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
