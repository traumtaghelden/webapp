#!/usr/bin/env python3
import re
from pathlib import Path

def fix_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Entferne kaputte Badge-Reste: {! && <span>...</span>}
    content = re.sub(r'\s*\{!\s*&&\s*<span[^>]*>.*?</span>\}', '', content, flags=re.DOTALL)

    # Entferne kaputte Crown-Reste: {! && <Crown ... />}
    content = re.sub(r'\s*\{!\s*&&\s*<Crown[^/]*\/>\}', '', content)

    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

components_dir = Path('/tmp/cc-agent/59476657/project/src/components')
changed = 0

for tsx_file in components_dir.glob('*.tsx'):
    if fix_file(tsx_file):
        changed += 1
        print(f"Fixed: {tsx_file.name}")

print(f"\nTotal files fixed: {changed}")
