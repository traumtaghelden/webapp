#!/usr/bin/env python3
import re
from pathlib import Path

def aggressive_cleanup(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Entferne alle if (! && ...)-Blöcke komplett
    content = re.sub(r'if\s*\(\s*!\s*&&[^}]+\{[^}]*\}', '', content, flags=re.DOTALL)

    # Entferne alle {! ? ... : ...}
    content = re.sub(r'\{!\s*\?[^}]+:[^}]+\}', '', content)

    # Entferne {! && ...}
    content = re.sub(r'\{!\s*&&[^}]+\}', '', content)

    # Entferne const { ... } = useSubscription();
    content = re.sub(r'const\s*\{[^}]*\}\s*=\s*useSubscription\(\);\s*\n?', '', content)

    # Entferne showUpgradePrompt states
    content = re.sub(r'const\s*\[showUpgradePrompt[^\]]+\][^\n]+\n?', '', content)

    # Entferne setShowUpgradePrompt Aufrufe
    content = re.sub(r'setShowUpgradePrompt\([^)]*\);?\s*\n?', '', content)

    # Entferne <UpgradePrompt ... />
    content = re.sub(r'<UpgradePrompt[^/]*/>\s*\n?', '', content, flags=re.DOTALL)

    # Entferne title={! && ...}
    content = re.sub(r'title=\{!\s*&&[^}]+\}', '', content)

    # Cleanup Leerzeilen
    content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)

    # Entferne leere If-Blöcke
    content = re.sub(r'if\s*\(\s*\)\s*\{[^}]*\}', '', content)

    # Entferne ) { patterns (kaputte Funktionsdeklarationen)
    content = re.sub(r'\)\s*\{\s*\(false\);', ') {', content)

    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

components_dir = Path('/tmp/cc-agent/59476657/project/src/components')
changed = 0

for tsx_file in components_dir.glob('*.tsx'):
    if aggressive_cleanup(tsx_file):
        changed += 1
        print(f"Cleaned: {tsx_file.name}")

print(f"\nTotal: {changed}")
