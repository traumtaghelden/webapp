#!/usr/bin/env python3
import re
import os
import sys

def fix_file(filepath):
    """Remove all broken premium checks and conditionals"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content

        # Remove broken if (!) blocks
        content = re.sub(r'\s*if\s*\(\s*!\s*\)\s*\{[^}]*\}', '', content, flags=re.MULTILINE)

        # Remove broken ternaries without condition: { ? ... : ... }
        content = re.sub(r'\{\s*\?\s*[^\n:]+:[^\n}]+\}', '', content)

        # Remove broken conditionals: { && ...}
        content = re.sub(r'\{\s*&&\s*<[^}]+\}', '', content)

        # Remove orphaned showUpgrade calls
        content = re.sub(r'\s*showUpgrade\([^)]*\);\s*', '', content)

        # Clean up excessive empty lines
        content = re.sub(r'\n\n\n+', '\n\n', content)

        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
        return False

def main():
    # Files with known issues
    files_to_fix = [
        'src/components/BudgetDetailModal.tsx',
        'src/components/VendorPaymentManager.tsx',
        'src/components/DataExport.tsx',
        'src/components/PaymentPlanModal.tsx',
        'src/components/ManualPaymentToggle.tsx',
        'src/components/FamilyGuestForm.tsx',
    ]

    fixed = 0
    for filepath in files_to_fix:
        full_path = f'/tmp/cc-agent/59476657/project/{filepath}'
        if os.path.exists(full_path):
            if fix_file(full_path):
                print(f"✓ {filepath}")
                fixed += 1

    print(f"\nFixed {fixed} files")
    return 0

if __name__ == '__main__':
    sys.exit(main())
