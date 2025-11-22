import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Wedding Planner Premium',
    version: '2.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      await logWebhookEvent(null, 'signature_failed', {}, error.message);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    console.log(`Received webhook: ${event.type}`);

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function logWebhookEvent(eventId: string | null, eventType: string, payload: any, errorMessage?: string) {
  try {
    await supabase.from('stripe_webhook_logs').insert({
      event_id: eventId || `unknown_${Date.now()}`,
      event_type: eventType,
      payload: payload,
      error_message: errorMessage || null,
    });
  } catch (error) {
    console.error('Failed to log webhook event:', error);
  }
}

async function handleEvent(event: Stripe.Event) {
  try {
    await logWebhookEvent(event.id, event.type, event.data.object);

    const stripeData = event?.data?.object ?? {};

    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error: any) {
    console.error(`Error handling event ${event.type}:`, error);
    await logWebhookEvent(event.id, event.type, event.data.object, error.message);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`Subscription created: ${subscription.id}`);

  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  await syncSubscriptionToDatabase(subscription);
  await updateAccountStatus(customerId, 'premium_active', 'subscription_created', {
    subscription_id: subscription.id,
    status: subscription.status,
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}, cancel_at_period_end: ${subscription.cancel_at_period_end}`);

  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  await syncSubscriptionToDatabase(subscription);

  if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
    // Active subscription without pending cancellation
    await updateAccountStatus(customerId, 'premium_active', 'subscription_updated', {
      subscription_id: subscription.id,
      status: subscription.status,
      cancel_at_period_end: false,
    });
  } else if (subscription.status === 'active' && subscription.cancel_at_period_end) {
    // Active but scheduled for cancellation at period end
    console.log(`Subscription ${subscription.id} will cancel at ${new Date(subscription.current_period_end * 1000).toISOString()}`);

    await updateAccountStatus(customerId, 'premium_cancelled', 'subscription_cancel_scheduled', {
      subscription_id: subscription.id,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: true,
    });
  } else if (subscription.status === 'canceled') {
    // Subscription is already cancelled
    await updateAccountStatus(customerId, 'premium_cancelled', 'subscription_cancelled', {
      subscription_id: subscription.id,
      status: subscription.status,
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`Subscription deleted: ${subscription.id}`);

  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  await syncSubscriptionToDatabase(subscription);

  const deletionDate = new Date();
  deletionDate.setDate(deletionDate.getDate() + 30);

  const { error } = await supabase
    .from('user_profiles')
    .update({
      account_status: 'premium_cancelled',
      data_deletion_scheduled_at: deletionDate.toISOString(),
      subscription_cancelled_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error updating account status:', error);
  }

  await logSubscriptionEvent(customerId, 'subscription_deleted', {
    subscription_id: subscription.id,
    deletion_scheduled_at: deletionDate.toISOString(),
  });
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  console.log(`Trial will end soon for subscription: ${subscription.id}`);

  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  await logSubscriptionEvent(customerId, 'trial_ending_soon', {
    subscription_id: subscription.id,
    trial_end: subscription.trial_end,
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Payment succeeded for invoice: ${invoice.id}`);

  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const { error } = await supabase
    .from('user_profiles')
    .update({
      account_status: 'premium_active',
      data_deletion_scheduled_at: null,
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error reactivating account:', error);
  }

  await logSubscriptionEvent(customerId, 'payment_succeeded', {
    invoice_id: invoice.id,
    amount: invoice.amount_paid,
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Payment failed for invoice: ${invoice.id}`);

  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const { error } = await supabase
    .from('user_profiles')
    .update({
      account_status: 'suspended',
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error suspending account:', error);
  }

  await logSubscriptionEvent(customerId, 'payment_failed', {
    invoice_id: invoice.id,
    amount: invoice.amount_due,
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`Checkout completed: ${session.id}, mode: ${session.mode}`);

  if (session.mode !== 'subscription') {
    console.log('Not a subscription checkout, skipping');
    return;
  }

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  if (!customerId) return;

  if (session.subscription) {
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await syncSubscriptionToDatabase(subscription);
  }

  await updateAccountStatus(customerId, 'premium_active', 'checkout_completed', {
    session_id: session.id,
    subscription_id: session.subscription,
  });
}

async function syncSubscriptionToDatabase(subscription: Stripe.Subscription) {
  try {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

    const { error } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        status: subscription.status,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        metadata: subscription.metadata || {},
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (error) {
      console.error('Error syncing subscription:', error);
      throw error;
    }

    console.log(`Successfully synced subscription ${subscription.id} to database`);
  } catch (error) {
    console.error('Failed to sync subscription:', error);
    throw error;
  }
}

async function updateAccountStatus(customerId: string, newStatus: string, eventType: string, metadata: any = {}) {
  try {
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('user_id, account_status')
      .eq('stripe_customer_id', customerId)
      .single();

    if (fetchError) {
      console.error('Error fetching user profile:', fetchError);
      return;
    }

    const updates: any = {
      account_status: newStatus,
      subscription_status: metadata.status || null,
    };

    if (newStatus === 'premium_active') {
      updates.data_deletion_scheduled_at = null;
      updates.premium_since = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('stripe_customer_id', customerId);

    if (updateError) {
      console.error('Error updating account status:', updateError);
      return;
    }

    await logSubscriptionEvent(customerId, eventType, metadata);

    console.log(`Updated account status to ${newStatus} for customer ${customerId}`);
  } catch (error) {
    console.error('Failed to update account status:', error);
  }
}

async function logSubscriptionEvent(customerId: string, eventType: string, metadata: any = {}) {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!profile) {
      console.error('User profile not found for customer:', customerId);
      return;
    }

    await supabase.from('subscription_events').insert({
      user_id: profile.user_id,
      event_type: eventType,
      new_status: metadata.status || eventType,
      metadata: metadata,
      source: 'webhook',
    });
  } catch (error) {
    console.error('Failed to log subscription event:', error);
  }
}
