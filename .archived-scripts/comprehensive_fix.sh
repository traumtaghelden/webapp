#!/bin/bash

# Find and fix all broken if (!) statements
find src/components -name "*.tsx" -type f -exec sed -i '/if\s*(\s*!\s*)\s*{/,/}/d' {} \;

# Remove broken ternaries
find src/components -name "*.tsx" -type f -exec sed -i '/{\s*?\s*(/,/}\s*)/d' {} \;

# Remove orphaned showUpgrade calls  
find src/components -name "*.tsx" -type f -exec sed -i '/showUpgrade(/d' {} \;

# Remove broken { && patterns
find src/components -name "*.tsx" -type f -exec sed -i 's/{\s*&&\s*/{ /g' {} \;

echo "Comprehensive cleanup complete"
