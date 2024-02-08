import { supabaseAdmin } from './supabase-admin';
import { stripe } from './stripe';
import { toDateTime } from './helpers';
import { createCommission } from './stripe-helpers';

// This entire file should be removed and moved to supabase-admin
// It's not a react hook, so it shouldn't have useDatabase format
// It should also properly catch and throw errors
export const upsertProductRecord = async (product) => {
  const productData = {
    product_id: product.id,
    active: product.active,
    name: product.name,
    description: product.description,
    image: product.images?.[0] ?? null,
    metadata: product.metadata
  };

  const { error } = await supabaseAdmin
    .from('products')
    .insert([productData], { upsert: true });
  if (error) throw error;
  console.log(`Product inserted/updated: ${product.id}`);
};

export const upsertPriceRecord = async (price) => {
  const priceData = {
    id: price.id,
    product_id: price.product,
    active: price.active,
    currency: price.currency,
    description: price.nickname,
    type: price.type,
    unit_amount: price.unit_amount,
    interval: price.recurring?.interval ?? null,
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata
  };

  const { error } = await supabaseAdmin
    .from('prices')
    .insert([priceData], { upsert: true });
  if (error) throw error;
  console.log(`Price inserted/updated: ${price.id}`);
};

export const createOrRetrieveCustomer = async ({ id, teamId, email }) => {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('stripe_customer_id')
    .eq('team_id', teamId)
    .single();
  if (error) {
    // No customer record found, let's create one.
    const customerData = {
      metadata: {
        supabaseTeamId: teamId
      }
    };
    if (email) customerData.email = email;
    const customer = await stripe.customers.create(customerData);
    // Now insert the customer ID into our Supabase mapping table.
    const { error: supabaseError } = await supabaseAdmin
      .from('customers')
      .insert([{ user_id: id, team_id: teamId, stripe_customer_id: customer.id }]);
    if (supabaseError) throw supabaseError;
    console.log(`New customer created and inserted for ${teamId}.`);
    return customer.id;
  }
  if (data) return data.stripe_customer_id;
};

/**
 * Copies the billing details from the payment method to the customer object.
 */
export const copyBillingDetailsToCustomer = async (teamId, payment_method) => {
  const customer = payment_method.customer;
  const { name, phone, address } = payment_method.billing_details;
  await stripe.customers.update(customer, { name, phone, address });
  const { error } = await supabaseAdmin
    .from('teams')
    .update({
      billing_address: address,
      payment_method: payment_method[payment_method.type]
    })
    .eq('team_id', teamId);
  if (error) throw error;
};

export const manageSubscriptionStatusChange = async (
  subscriptionId,
  customerId,
  createAction = false
) => {
  // Get customer's teamId from mapping table.
  const {
    data: { team_id: teamId, user_id: userId },
    error: noCustomerError
  } = await supabaseAdmin
    .from('customers')
    .select('team_id, user_id')
    .eq('stripe_customer_id', customerId)
    .single();
  if (noCustomerError) throw noCustomerError;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method']
  });
  // Upsert the latest status of the subscription object.
  const subscriptionData = {
    user_id: userId,
    id: subscription.id,
    team_id: teamId,
    metadata: subscription.metadata,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
    quantity: subscription.quantity,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at
      ? toDateTime(subscription.cancel_at)
      : null,
    canceled_at: subscription.canceled_at
      ? toDateTime(subscription.canceled_at)
      : null,
    current_period_start: toDateTime(subscription.current_period_start),
    current_period_end: toDateTime(subscription.current_period_end),
    created: toDateTime(subscription.created),
    ended_at: subscription.ended_at ? toDateTime(subscription.ended_at) : null,
    trial_start: subscription.trial_start
      ? toDateTime(subscription.trial_start)
      : null,
    trial_end: subscription.trial_end
      ? toDateTime(subscription.trial_end)
      : null
  };

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .insert([subscriptionData], { upsert: true });
  if (error) throw error;
  console.log(
    `Inserted/updated subscription [${subscription.id}] for team [${teamId}]`
  );

  // For a new subscription copy the billing details to the customer object.
  // NOTE: This is a costly operation and should happen at the very end.
  if (createAction && subscription.default_payment_method)
    await copyBillingDetailsToCustomer(
      teamId,
      subscription.default_payment_method
    );
};

export const getCampaignData = async (companyId) => {
  const { data, error } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error) return null;

  return data;
}

export const getAccountEmail = async (id) => {
  const { data } = await supabaseAdmin
  .from('users_table')
  .select('email')
  .eq('id', id)
  .single();

  if(data){
    return data?.email ? data?.email : null;
  } else {
    return "error";
  }
}

export const getCompanyFromExternal = async (domain) => {
  let { data, error } = await supabaseAdmin
    .from('companies')
    .select('company_id, domain_verified, company_url')
    .eq('company_url', domain)
    .single();

    console.log('error here');
    console.log(error);

    if (error) return "error";

  if(data?.domain_verified === false){

    let { error } = await supabaseAdmin
    .from('companies')
    .update({
      domain_verified: true,
    })
    .eq('company_id', data?.company_id);

    console.log('error here 2');
    console.log(error);

    if (error) return "error";
  }

  return "success";
};

export const inviteAffiliate = async (user, companyId, campaignId, emailInvites) => {
  const { error } = await supabaseAdmin.from('affiliates').insert({
    id: user?.id,
    team_id: user?.team_id,
    company_id: companyId,
    campaign_id: campaignId,
    invite_email: emailInvites
  });

  if (error) {
    return "error";
  } else {
    return "success";
  }
};

export const verifyReferral = async (referralCode, companyId) => {
  let referralData = null;
  let { data } = await supabaseAdmin
    .from('affiliates')
    .select('*')
    .eq('company_id', companyId)
    .eq('referral_code', referralCode)
    .single();
  
  if(data){
    referralData = data;
  } else {
    let { data } = await supabaseAdmin
      .from('affiliates')
      .select('*')
      .eq('company_id', companyId)
      .eq('affiliate_id', referralCode)
      .single();

    if(data){
      referralData = data;
    }
  }
  
  if (referralData === null) {
    return "error";
  } else {
    return referralData;
  }
};

export const fireRecordImpression = async (id) => {
  const { error } = await supabaseAdmin.rpc('referralimpression', { x: 1, affiliateid: id })

  if (error) {
    return "error";
  } else {
    return "success";
  }
};

export const createReferral = async (details) => {
  let campaignData = null;
  let { data, error } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .eq('campaign_id', details?.campaign_id)
    .single();

  if(error){
    return "error";
  }
  
  if(data){
    campaignData = data;
    
    let dateToday = new Date();
    if(data?.cookie_window){
      dateToday.setDate(dateToday.getDate() + data?.cookie_window);
    } else {
      dateToday.setDate(dateToday.getDate() + 60)
    }
    let dateTodayIso = dateToday.toISOString();
    dateToday = dateToday.toUTCString();

    let referralData = { data, error } = await supabaseAdmin.from('referrals').insert({
      id: data?.id,
      team_id: data?.team_id,
      affiliate_id: details?.affiliate_id,
      affiliate_code: details?.affiliate_code,
      campaign_id: data?.campaign_id,
      company_id: data?.company_id,
      commission_type: data?.commission_type,
      commission_value: data?.commission_value,
      cookie_window: data?.cookie_window,
      commission_period: data?.commission_period,
      minimum_days_payout: data?.minimum_days_payout,
      referral_expiry: dateTodayIso
    });

    if(referralData?.data){
      return {
        "campaign_id": campaignData?.campaign_id,
        "cookie_date": dateToday,
        "campaign_name": campaignData?.campaign_name,
        "affiliate_id": details?.affiliate_id,
        "referral_id": referralData?.data[0].referral_id
      }
    } else {
      return "error";
    }
  }
};

export const campaignInfo = async (code, companyId) => {
  let campaignData = null;
  const referralVerify = await verifyReferral(code, companyId);

  if(referralVerify === "error") return "error";

  let { data, error } = await supabaseAdmin
    .from('campaigns')
    .select('campaign_name, discount_code, discount_value, discount_type, company_id')
    .eq('campaign_id', referralVerify?.campaign_id)
    .single();

  if(error){
    return "error";
  }

  if(data){
    campaignData = data;
  }
  
  let companyData = await supabaseAdmin
    .from('companies')
    .select('company_currency')
    .eq('company_id', campaignData?.company_id)
    .single();

  if(companyData?.data !== null && companyData?.data?.company_currency){
    campaignData.company_currency = companyData?.data?.company_currency;
  }

  console.log(companyData?.data)

  return campaignData;
};

export const convertReferral = async (referralId, campaignId, affiliateId, cookieDate, email) => {
  let referralData = await supabaseAdmin
    .from('referrals')
    .select('*')
    .eq('referral_id', referralId)
    .single();

  if(referralData?.data && cookieDate){
    let dateToday = new Date();
    let dateTodayTimestamp = dateToday.getTime();
    let cookieExpiryDate = new Date(cookieDate);
    let cookieExpiryDateTimestamp = cookieExpiryDate.getTime();

    if(dateTodayTimestamp > cookieExpiryDateTimestamp){
      return "expired";
    }

    //Get stripe ID from company
    let companyData = await supabaseAdmin
      .from('companies')
      .select('stripe_id')
      .eq('company_id', referralData?.data?.company_id)
      .single();

    console.log("Stripe ID: ",companyData?.data?.stripe_id)

    if(companyData?.data?.stripe_id){  
      const commission = await createCommission(referralData, companyData?.data?.stripe_id, referralData?.data?.referral_id, email);
      return commission;
    }
  }

  return "error";
};

//Deletes stripe ID from company account
export const deleteIntegrationFromDB = async (stripeId) => {
  const { error } = await supabaseAdmin
  .from('companies')
  .update({
    stripe_id: null
  })
  .eq({ stripe_id: stripeId })
  if (error) return "error";
};