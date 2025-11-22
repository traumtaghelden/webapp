# 🚀 Launch Checklist - Premium-Only System

**Use this checklist to ensure a smooth deployment**

---

## 📋 Pre-Launch Checklist

### 1. Database ✅
- [x] Migration applied successfully
- [x] All functions created (9/9)
- [x] All tables created (subscription_events, stripe_webhook_logs)
- [x] RLS policies active on all tables
- [x] Triggers configured
- [x] Indexes created
- [x] Health check passed

**Verification:**
```sql
-- Run this in Supabase SQL Editor
\i SYSTEM_HEALTH_CHECK.sql
-- All checks should show ✅ PASS
```

---

### 2. Edge Functions ⏳
- [ ] stripe-webhook deployed
- [ ] stripe-checkout deployed
- [ ] Functions tested with curl/Postman
- [ ] Environment secrets set (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)

**Deployment:**
```bash
npx supabase functions deploy stripe-webhook
npx supabase functions deploy stripe-checkout
npx supabase secrets set STRIPE_SECRET_KEY=sk_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

**Test:**
```bash
curl https://your-project.supabase.co/functions/v1/stripe-webhook
# Should return 405 (Method not allowed) - that's correct!
```

---

### 3. Stripe Configuration ⏳
- [ ] Product created ("Wedding Planner Premium")
- [ ] Price created (49,99€/month, 14-day trial)
- [ ] Price ID added to stripe-checkout function
- [ ] Webhook endpoint created
- [ ] Webhook secret copied to Supabase secrets
- [ ] Webhook events selected (subscription.*, invoice.*)
- [ ] Test webhook sent & logged

**Product Setup:**
1. Go to: https://dashboard.stripe.com/products
2. Create product: "Wedding Planner Premium"
3. Set price: 49,99 EUR/month
4. Enable 14-day trial
5. Copy Price ID (starts with `price_`)

**Webhook Setup:**
1. Go to: https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - customer.subscription.trial_will_end
   - invoice.payment_succeeded
   - invoice.payment_failed
4. Copy Signing Secret (starts with `whsec_`)

**Verification:**
```sql
-- Check webhook logs
SELECT * FROM stripe_webhook_logs ORDER BY processed_at DESC LIMIT 5;
```

---

### 4. Frontend Build ✅
- [x] Dependencies installed
- [x] Environment variables configured
- [x] Build successful (0 errors)
- [x] All components integrated

**Build:**
```bash
npm install
npm run build
# Expected: ✓ built in ~20s, 0 errors
```

---

### 5. Environment Variables ⏳

#### Frontend (.env)
- [ ] VITE_SUPABASE_URL set
- [ ] VITE_SUPABASE_ANON_KEY set
- [ ] VITE_STRIPE_PUBLISHABLE_KEY set (pk_test_... or pk_live_...)

#### Supabase Edge Functions (Secrets)
- [ ] STRIPE_SECRET_KEY set (sk_test_... or sk_live_...)
- [ ] STRIPE_WEBHOOK_SECRET set (whsec_...)

**Note:** For production, use Stripe LIVE keys!

---

### 6. Monitoring Setup ⏳
- [ ] Bookmark daily stats query in Supabase
- [ ] Bookmark webhook health query
- [ ] Set up external monitoring (optional: Better Uptime, Datadog)
- [ ] Configure email alerts (optional)

**Daily Stats Query:**
```sql
SELECT
  CURRENT_DATE as date,
  COUNT(*) FILTER (WHERE account_status = 'trial_active') as trials_active,
  COUNT(*) FILTER (WHERE account_status = 'premium_active') as premium_active,
  COUNT(*) * 49.99 FILTER (WHERE account_status = 'premium_active') as mrr
FROM user_profiles;
```

---

### 7. Testing ⏳

#### Staging Environment
- [ ] Deploy to staging
- [ ] Test user registration
- [ ] Test trial banner display
- [ ] Test upgrade flow (Stripe test card: 4242 4242 4242 4242)
- [ ] Test webhook processing
- [ ] Test read-only mode (manually expire trial)
- [ ] Test deletion warning modal

#### Admin Functions
- [ ] Test get_system_statistics()
- [ ] Test extend_trial_period()
- [ ] Test extend_grace_period()
- [ ] Test cancel_scheduled_deletion()
- [ ] Test force_premium_activation()

**Test User:**
```sql
-- Create test user (use your staging auth)
-- Then run:
SELECT * FROM check_trial_status();
```

---

### 8. Documentation ✅
- [x] README_PREMIUM_SYSTEM.md complete
- [x] DEPLOYMENT_QUICKSTART.md complete
- [x] ADMIN_GUIDE.md complete
- [x] ADMIN_QUERIES.sql complete
- [x] SYSTEM_HEALTH_CHECK.sql complete
- [x] EXECUTIVE_SUMMARY.md complete

---

### 9. Team Training ⏳
- [ ] Support team reviewed ADMIN_GUIDE.md
- [ ] Support team tested admin functions
- [ ] Escalation process defined
- [ ] FAQ document created (optional)

---

### 10. Backup & Rollback Plan ⏳
- [ ] Database backup created
- [ ] Rollback procedure documented
- [ ] Emergency contacts listed

**Backup:**
```bash
# Create database dump before migration
npx supabase db dump -f backup_$(date +%Y%m%d).sql
```

---

## 🚀 Launch Day Checklist

### Morning (Pre-Launch)
- [ ] Final health check
- [ ] All systems green
- [ ] Support team on standby
- [ ] Monitoring dashboards open

**Health Check:**
```sql
\i SYSTEM_HEALTH_CHECK.sql
```

### Launch
- [ ] Switch Stripe to LIVE mode
- [ ] Update LIVE webhook URL
- [ ] Update LIVE price ID in stripe-checkout
- [ ] Update frontend environment variables (LIVE keys)
- [ ] Deploy frontend to production
- [ ] Verify deployment successful

### Post-Launch (First Hour)
- [ ] Register test account
- [ ] Complete upgrade flow
- [ ] Check webhook logs
- [ ] Monitor error rates
- [ ] Check system statistics

**System Stats:**
```sql
SELECT * FROM get_system_statistics();
```

---

## 📊 First 24 Hours Monitoring

### Every 2 Hours
- [ ] Check system statistics
- [ ] Check webhook errors
- [ ] Check user registrations
- [ ] Check conversion rate

### Issues to Watch For
- High webhook error rate (>5%)
- No user registrations
- Payment failures
- Frontend errors

---

## 🆘 Emergency Contacts

### Technical Issues
- Database: [Supabase Dashboard](https://supabase.com/dashboard)
- Stripe: [Stripe Dashboard](https://dashboard.stripe.com)
- Hosting: [Your hosting provider]

### Rollback Procedure
If critical issues occur:

1. **Stop new signups** (temporarily disable registration)
2. **Check logs:**
   ```sql
   SELECT * FROM stripe_webhook_logs
   WHERE error_message IS NOT NULL
   ORDER BY processed_at DESC LIMIT 20;
   ```
3. **Identify issue** (webhook, payment, RLS, etc.)
4. **Fix or rollback** (restore from backup if needed)
5. **Re-test** before re-enabling signups

---

## ✅ Success Criteria (Week 1)

### Technical
- [ ] >99% uptime
- [ ] <1% webhook error rate
- [ ] <2s average page load time
- [ ] Zero security incidents

### Business
- [ ] >50 trial signups
- [ ] >10% conversion rate
- [ ] <5% support ticket rate
- [ ] Positive user feedback

---

## 📈 Week 1 Tasks

### Daily
- [ ] Morning: Check overnight stats
- [ ] Afternoon: Review webhook logs
- [ ] Evening: Check conversion funnel

### Weekly Review (End of Week 1)
- [ ] Analyze conversion rate
- [ ] Review support tickets
- [ ] Identify optimization opportunities
- [ ] Plan improvements for Week 2

---

## 🎯 Launch Complete!

When all checkboxes are marked ✅, you're ready to launch! 🚀

**Remember:**
- Monitor closely for first 24-48 hours
- Be ready to respond quickly to issues
- Collect user feedback
- Iterate and improve

---

## 📚 Quick Reference

| Resource | Location |
|----------|----------|
| Main Docs | README_PREMIUM_SYSTEM.md |
| Deployment | DEPLOYMENT_QUICKSTART.md |
| Admin Guide | ADMIN_GUIDE.md |
| Health Check | SYSTEM_HEALTH_CHECK.sql |
| Monitoring | ADMIN_QUERIES.sql |
| Executive Summary | EXECUTIVE_SUMMARY.md |

---

**Good luck with your launch!** 🎉
