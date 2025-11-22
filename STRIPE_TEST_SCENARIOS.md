# 🧪 Stripe Test Scenarios

**Complete testing guide for the Premium system**

---

## 🎯 Test Card Numbers

### Success Scenarios
| Card Number | Use Case |
|-------------|----------|
| 4242 4242 4242 4242 | Standard success |
| 5555 5555 5555 4444 | Mastercard success |
| 3782 822463 10005 | American Express success |

### Failure Scenarios
| Card Number | Error Type |
|-------------|-----------|
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0000 0000 0127 | Incorrect CVC |
| 4000 0000 0000 0069 | Expired card |

**For all test cards:**
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

---

## 🧪 Test Scenario 1: Successful Trial → Premium

### Step 1: Register & Start Trial
1. Register new user: `test1@example.com`
2. Verify in database:
```sql
SELECT email, account_status, trial_ends_at
FROM user_profiles
WHERE email = 'test1@example.com';
```

**Expected:**
- account_status: `trial_active`
- trial_ends_at: 14 days from now

### Step 2: Verify Trial Banner
1. Login to app
2. Should see yellow TrialBanner
3. Should show "14 Tage verbleibend"

### Step 3: Upgrade to Premium
1. Click "Jetzt upgraden" button
2. Stripe Checkout opens
3. Use card: `4242 4242 4242 4242`
4. Complete payment

### Step 4: Verify Webhook
```sql
-- Check webhook was received
SELECT event_type, error_message
FROM stripe_webhook_logs
WHERE user_id = (SELECT id FROM user_profiles WHERE email = 'test1@example.com')
ORDER BY processed_at DESC
LIMIT 5;
```

**Expected Events:**
- customer.subscription.created
- invoice.payment_succeeded

### Step 5: Verify Premium Status
```sql
SELECT email, account_status, premium_since
FROM user_profiles
WHERE email = 'test1@example.com';
```

**Expected:**
- account_status: `premium_active`
- premium_since: [timestamp]

### Step 6: Verify UI
1. Refresh app
2. TrialBanner should be gone
3. Full access to all features

**✅ Test Pass Criteria:**
- All webhooks processed without errors
- Status changed to premium_active
- No banners visible
- Full feature access

---

## 🧪 Test Scenario 2: Trial Expiration Flow

### Step 1: Create Test User
1. Register: `test2@example.com`
2. Manually expire trial:
```sql
UPDATE user_profiles
SET
  trial_ends_at = NOW() - INTERVAL '1 day',
  account_status = 'trial_expired'::account_status_type,
  data_deletion_scheduled_at = NOW() + INTERVAL '30 days'
WHERE email = 'test2@example.com';
```

### Step 2: Verify Read-Only Banner
1. Login as test2@example.com
2. Should see red ReadOnlyBanner
3. Should show deletion countdown

### Step 3: Test Read-Only Mode
1. Try to create new guest → Should fail
2. Try to add budget item → Should fail
3. Try to create task → Should fail
4. Can VIEW all data → Should work

### Step 4: Verify Database
```sql
SELECT * FROM is_read_only_mode(
  (SELECT id FROM user_profiles WHERE email = 'test2@example.com')
);
```

**Expected:** `true`

**✅ Test Pass Criteria:**
- ReadOnlyBanner visible
- Cannot modify data
- Can view existing data
- Deletion countdown shown

---

## 🧪 Test Scenario 3: Failed Payment

### Step 1: Create Trial User
1. Register: `test3@example.com`

### Step 2: Attempt Upgrade with Failing Card
1. Click "Jetzt upgraden"
2. Use card: `4000 0000 0000 0002` (Declined)
3. Payment should fail

### Step 3: Verify Status Unchanged
```sql
SELECT email, account_status
FROM user_profiles
WHERE email = 'test3@example.com';
```

**Expected:**
- account_status: Still `trial_active`

### Step 4: Retry with Valid Card
1. Try again with `4242 4242 4242 4242`
2. Should succeed

**✅ Test Pass Criteria:**
- Failed payment doesn't break system
- User can retry
- Valid payment works after failed attempt

---

## 🧪 Test Scenario 4: Subscription Cancellation

### Step 1: Create Premium User
1. Use test1@example.com (from Scenario 1)
2. Or create new premium user

### Step 2: Cancel in Stripe
1. Go to Stripe Dashboard
2. Find subscription
3. Click "Cancel subscription"
4. Choose "Cancel immediately"

### Step 3: Verify Webhook
```sql
SELECT event_type, new_status, metadata
FROM subscription_events
WHERE user_id = (SELECT id FROM user_profiles WHERE email = 'test1@example.com')
ORDER BY created_at DESC
LIMIT 3;
```

**Expected Event:**
- event_type: `subscription_cancelled`
- new_status: `premium_cancelled`

### Step 4: Verify Status
```sql
SELECT
  email,
  account_status,
  data_deletion_scheduled_at
FROM user_profiles
WHERE email = 'test1@example.com';
```

**Expected:**
- account_status: `premium_cancelled`
- data_deletion_scheduled_at: 30 days from now

### Step 5: Verify UI
1. Login as user
2. Should see red ReadOnlyBanner
3. Should show deletion warning

**✅ Test Pass Criteria:**
- Webhook processed correctly
- Status updated to premium_cancelled
- Deletion scheduled 30 days out
- User sees ReadOnlyBanner

---

## 🧪 Test Scenario 5: Admin Functions

### Test extend_trial_period()
```sql
-- Create test user with expiring trial
INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'admin-test1@example.com');

-- Extend trial
SELECT * FROM extend_trial_period(
  (SELECT id FROM user_profiles WHERE email = 'admin-test1@example.com'),
  7
);

-- Verify
SELECT email, trial_ends_at, account_status
FROM user_profiles
WHERE email = 'admin-test1@example.com';
```

**Expected:**
- trial_ends_at extended by 7 days
- account_status: `trial_active`

### Test force_premium_activation()
```sql
SELECT * FROM force_premium_activation(
  (SELECT id FROM user_profiles WHERE email = 'admin-test1@example.com'),
  'Testing admin function'
);

-- Verify
SELECT account_status, premium_since
FROM user_profiles
WHERE email = 'admin-test1@example.com';
```

**Expected:**
- account_status: `premium_active`
- premium_since: [current timestamp]

**✅ Test Pass Criteria:**
- All admin functions execute without errors
- Changes reflected in database
- Events logged in subscription_events

---

## 🧪 Test Scenario 6: Deletion Warning Modal

### Step 1: Create User Near Deletion
```sql
UPDATE user_profiles
SET
  account_status = 'trial_expired'::account_status_type,
  data_deletion_scheduled_at = NOW() + INTERVAL '6 days'
WHERE email = 'test2@example.com';

-- Clear warning seen flag
DELETE FROM localStorage WHERE key = 'deletion_warning_seen';
```

### Step 2: Login
1. Login as test2@example.com
2. DeletionWarningModal should appear automatically

### Step 3: Test "Später erinnern"
1. Click "Später erinnern"
2. Modal closes
3. Logout & login again
4. Modal appears again (next day)

### Step 4: Test "Jetzt Premium holen"
1. Click "Jetzt Premium holen"
2. PricingModal opens
3. Complete upgrade
4. Modal never shows again

**✅ Test Pass Criteria:**
- Modal appears 7 days before deletion
- Shows correct deletion date
- "Später erinnern" works
- "Premium holen" flow works

---

## 🧪 Test Scenario 7: Multiple Trial Attempts

### Test: User tries to create second trial

**Expected Behavior:**
- One user can only have ONE trial
- If user signs up again with same email → Should error
- System prevents trial abuse

**Verification:**
```sql
-- Should only be 1 row per email
SELECT email, COUNT(*)
FROM user_profiles
GROUP BY email
HAVING COUNT(*) > 1;
```

**Expected:** No results

---

## 🧪 Test Scenario 8: Concurrent Upgrade Attempts

### Test: User clicks upgrade multiple times

**Steps:**
1. Start upgrade flow
2. Before completion, click upgrade again
3. Complete first checkout
4. Second checkout should fail gracefully

**Verification:**
```sql
-- Check for duplicate subscriptions
SELECT
  sc.user_id,
  COUNT(*) as subscription_count
FROM stripe_subscriptions ss
JOIN stripe_customers sc ON sc.customer_id = ss.customer_id
WHERE ss.status = 'active'
GROUP BY sc.user_id
HAVING COUNT(*) > 1;
```

**Expected:** No results (no duplicate subscriptions)

---

## 🧪 Test Scenario 9: Webhook Signature Verification

### Test: Send invalid webhook

**Steps:**
1. Use curl to send fake webhook:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "customer.subscription.created"}'
```

**Expected:**
- Request rejected (signature verification failed)
- Error logged

**Verification:**
```sql
SELECT event_type, error_message
FROM stripe_webhook_logs
ORDER BY processed_at DESC
LIMIT 1;
```

**Expected Error:** "Signature verification failed" or similar

---

## 🧪 Test Scenario 10: Trial Countdown Accuracy

### Test: Trial banner shows correct days

**Day 1:**
```sql
-- Trial just started
SELECT email, EXTRACT(DAY FROM (trial_ends_at - NOW())) as days
FROM user_profiles WHERE email = 'test@example.com';
```
**Expected UI:** "14 Tage verbleibend" (Yellow banner)

**Day 12:**
```sql
-- Simulate day 12
UPDATE user_profiles
SET trial_ends_at = NOW() + INTERVAL '3 days'
WHERE email = 'test@example.com';
```
**Expected UI:** "3 Tage verbleibend" (Orange urgent banner)

**Day 15:**
```sql
-- Trial expired
UPDATE user_profiles
SET
  trial_ends_at = NOW() - INTERVAL '1 day',
  account_status = 'trial_expired'::account_status_type
WHERE email = 'test@example.com';
```
**Expected UI:** Red ReadOnlyBanner

---

## 📊 Test Checklist

### Pre-Launch Testing
- [ ] Successful trial → premium (Scenario 1)
- [ ] Trial expiration flow (Scenario 2)
- [ ] Failed payment handling (Scenario 3)
- [ ] Subscription cancellation (Scenario 4)
- [ ] All admin functions (Scenario 5)
- [ ] Deletion warning modal (Scenario 6)
- [ ] Trial abuse prevention (Scenario 7)
- [ ] Concurrent upgrades (Scenario 8)
- [ ] Webhook security (Scenario 9)
- [ ] Banner accuracy (Scenario 10)

### Performance Testing
- [ ] 100 concurrent users can register
- [ ] Webhook processing <2s
- [ ] Page load times <3s
- [ ] Database queries optimized

### Security Testing
- [ ] RLS prevents cross-user access
- [ ] Webhook signature verified
- [ ] Service role key protected
- [ ] No secrets in frontend

---

## 🔍 Debugging Tips

### Webhook not received?
```sql
-- Check last webhook
SELECT * FROM stripe_webhook_logs
ORDER BY processed_at DESC LIMIT 1;
```

If empty:
1. Check Stripe Dashboard → Webhooks → Events
2. Verify webhook URL is correct
3. Check webhook secret is set
4. Test with "Send test webhook"

### Status not updating?
```sql
-- Compare stored vs computed status
SELECT
  email,
  account_status as stored,
  get_account_status(id) as computed
FROM user_profiles
WHERE email = 'user@example.com';
```

If different:
1. Check subscription_events for clues
2. Manually update if needed
3. Investigate webhook errors

### Read-only mode not working?
```sql
-- Test RLS directly
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO 'user-uuid';

-- Try insert
INSERT INTO guests (wedding_id, first_name)
VALUES ('wedding-uuid', 'Test');
-- Should fail if read-only
```

---

## 📚 Resources

- **Stripe Test Cards:** https://stripe.com/docs/testing
- **Webhook Testing:** https://stripe.com/docs/webhooks/test
- **Admin Guide:** ADMIN_GUIDE.md
- **Quick Reference:** QUICK_REFERENCE.md

---

**Always test in STAGING first!** 🚨
