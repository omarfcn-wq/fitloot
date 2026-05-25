import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { verifyWebhook, EventName, type PaddleEnv } from '../_shared/paddle.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, paddle-signature',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const env: PaddleEnv = url.searchParams.get('env') === 'live' ? 'live' : 'sandbox';

  try {
    const event = await verifyWebhook(req, env);
    console.log(`[webhook ${env}] ${event.eventType}`);

    if (
      event.eventType === EventName.SubscriptionCreated ||
      event.eventType === EventName.SubscriptionUpdated ||
      event.eventType === EventName.SubscriptionCanceled
    ) {
      const sub: any = event.data;
      const userId = sub.customData?.userId;
      const item = sub.items?.[0];
      const productExternalId = item?.price?.product?.importMeta?.externalId || item?.product?.importMeta?.externalId;
      const priceExternalId = item?.price?.importMeta?.externalId;

      if (!userId) {
        console.log('Missing userId in customData, skipping');
        return new Response(JSON.stringify({ ok: true, skipped: 'no userId' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!productExternalId || !priceExternalId) {
        console.log('Missing importMeta.externalId, skipping');
        return new Response(JSON.stringify({ ok: true, skipped: 'no externalId' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase.from('subscriptions').upsert(
        {
          user_id: userId,
          paddle_subscription_id: sub.id,
          paddle_customer_id: sub.customerId,
          product_id: productExternalId,
          price_id: priceExternalId,
          status: sub.status,
          current_period_start: sub.currentBillingPeriod?.startsAt ?? null,
          current_period_end: sub.currentBillingPeriod?.endsAt ?? null,
          cancel_at_period_end: sub.scheduledChange?.action === 'cancel',
          environment: env,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'paddle_subscription_id' },
      );
      if (error) throw error;

      // Notify user on creation
      if (event.eventType === EventName.SubscriptionCreated) {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'premium',
          title: '⭐ ¡Bienvenido a Premium!',
          message: 'Ahora ganás 1.5x créditos en cada actividad. ¡A entrenar!',
          icon: 'sparkles',
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
