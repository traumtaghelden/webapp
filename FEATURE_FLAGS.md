# Feature Flags Documentation

## Overview

This project uses a centralized feature flag system for safely rolling out modal/popup optimizations and v2 rebuilds.

## Three-Tier Fallback System

Feature flags are resolved in this priority order:

1. **URL Parameters** (highest priority) - Runtime overrides
2. **localStorage** - Persisted from URL overrides
3. **Default Config** - Values from `featureFlags.ts`

## Usage

### In React Components

```typescript
import { useFeatureFlag } from '../hooks/useFeatureFlag';

function BudgetManager() {
  const useBudgetV2 = useFeatureFlag('BUDGET_DETAIL_V2');

  return (
    <>
      {useBudgetV2 ? (
        <BudgetDetailModalV2 {...props} />
      ) : (
        <BudgetDetailModal {...props} />
      )}
    </>
  );
}
```

### Multiple Flags

```typescript
import { useFeatureFlags } from '../hooks/useFeatureFlag';

function MyComponent() {
  const flags = useFeatureFlags(['BUDGET_DETAIL_V2', 'TASK_DETAIL_V2']);

  if (flags.BUDGET_DETAIL_V2) {
    // Use new version
  }
}
```

### In Utility Functions

```typescript
import { getFeatureFlag } from '../config/featureFlags';

function myUtility() {
  if (getFeatureFlag('LAZY_MODAL_TABS')) {
    // Use lazy loading
  }
}
```

## URL Parameter Override

Enable flags via URL for testing or debugging:

### Single Flag

```
https://yourapp.com?ff=budget-detail-v2=on
https://yourapp.com?ff=new-popups=off
```

### Multiple Flags

```
https://yourapp.com?ff=budget-detail-v2=on,task-detail-v2=on
```

**Note:** URL parameters persist to localStorage automatically, so they remain active across page reloads.

## Available Flags

### Global Toggles

- `NEW_POPUPS` - Master toggle for all new modal implementations

### Individual Modal V2 Toggles

- `BUDGET_DETAIL_V2` - Use optimized BudgetDetailModal v2
- `TASK_DETAIL_V2` - Use optimized TaskDetailModal v2
- `BUDGET_ADD_V2` - Use optimized BudgetAddModal v2
- `GUEST_DETAIL_V2` - Use optimized GuestDetailModal v2
- `VENDOR_DETAIL_V2` - Use optimized VendorDetailModal v2

### Performance Features

- `LAZY_MODAL_TABS` - Enable lazy loading for modal tabs (default: true)
- `VIRTUALIZED_LISTS` - Enable list virtualization for long lists (default: true)
- `DEBOUNCED_INPUTS` - Enable input debouncing for better performance (default: true)

## Default Values

By default (Phase 1):
- All v2 modals are **OFF** (use old versions)
- Performance features are **ON** (applied to old versions)

This ensures safe rollout - we optimize the existing modals first, then gradually enable v2 versions as they're proven stable.

## Clearing Flags

To reset all flags to defaults, open browser console:

```javascript
import { clearFeatureFlags } from './config/featureFlags';
clearFeatureFlags();
```

Or manually clear localStorage:
```javascript
// Clear all feature flags
Object.keys(localStorage)
  .filter(key => key.startsWith('ff_'))
  .forEach(key => localStorage.removeItem(key));
```

## Debug Information

Get current flag state:

```javascript
import { getFeatureFlagDebugInfo } from './config/featureFlags';
console.log(getFeatureFlagDebugInfo());
```

This returns:
- `current`: All flags with final resolved values
- `defaults`: Default values from config
- `stored`: Values persisted in localStorage
- `url`: Values from current URL parameters

## Rollout Strategy

### Phase 1: Optimize Existing Modals
- All v2 flags OFF
- Performance flags ON
- Apply debouncing, memoization, lazy loading to existing components

### Phase 2: Test V2 Modals
- Enable v2 flags via URL for testing
- Verify performance improvements
- Gather feedback

### Phase 3: Gradual Rollout
- Enable v2 flags for 10% users via config
- Monitor performance metrics
- Increase to 50%, then 100%
- Remove old versions after 2 weeks of stability

### Phase 4: Cleanup
- Remove feature flags for stable v2 modals
- Delete old modal versions from `_legacy` directory
- Update default config

## Best Practices

1. **Always test both versions** - Ensure old and new modals work correctly
2. **Monitor performance** - Track Key-to-Frame, Click-to-Open metrics
3. **Document changes** - Note why a flag was changed in commit messages
4. **Clean up old code** - Remove feature flags once rollout is complete
5. **Keep defaults safe** - New features should default to OFF initially

## Troubleshooting

### Flag Not Working

1. Check URL parameter format: `?ff=flag-name=on` (no spaces, dash-separated)
2. Check localStorage: Open dev tools → Application → Local Storage
3. Check default config in `featureFlags.ts`
4. Clear flags and try again

### Modal Shows Old Version

1. Verify flag is enabled: `getFeatureFlag('BUDGET_DETAIL_V2')`
2. Check component is using useFeatureFlag hook
3. Verify v2 component exists and is imported correctly
4. Check for console errors

### Performance Issues

1. Verify `LAZY_MODAL_TABS` is enabled
2. Check `DEBOUNCED_INPUTS` is enabled
3. Monitor re-renders with React DevTools Profiler
4. Check for console warnings about missing optimizations

## Related Files

- `/src/config/featureFlags.ts` - Flag definitions and logic
- `/src/hooks/useFeatureFlag.ts` - React hooks for accessing flags
- `/src/components/v2/` - New modal versions
- `/src/components/_legacy/` - Backup of old modals
- `MODAL_INVENTORY.md` - Complete modal audit and optimization plan
