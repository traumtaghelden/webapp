#!/usr/bin/env python3
import re
from pathlib import Path

def clean_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Entferne isPremium, limits, canAddGuest Referenzen
    content = re.sub(r',?\s*isPremium', '', content)
    content = re.sub(r'isPremium={[^}]+}', '', content)
    content = re.sub(r'limits\?.guests &&', '', content)
    content = re.sub(r'limits\.guests\.max', '999', content)
    content = re.sub(r'limits\.guests\.current', '0', content)
    content = re.sub(r'!canAddGuest\(\) &&', '', content)
    content = re.sub(r'disabled={!canAddGuest\(\) && [^}]+}', '', content)
    content = re.sub(r'if \(!canAddGuest\(\)\)[^}]+\}', '', content)

    # Entferne Premium Badge Spans
    content = re.sub(r'\s*\{!isPremium && <span[^>]*>.*?Premium.*?</span>\}', '', content, flags=re.DOTALL)

    # Cleanup doppelte Leerzeilen
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

components_dir = Path('/tmp/cc-agent/59476657/project/src/components')
changed = 0

for tsx_file in components_dir.glob('*.tsx'):
    if clean_file(tsx_file):
        changed += 1
        print(f"Cleaned: {tsx_file.name}")

print(f"\nTotal files cleaned: {changed}")
