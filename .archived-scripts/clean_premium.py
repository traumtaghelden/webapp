#!/usr/bin/env python3
import re
from pathlib import Path

def clean_component(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # Entferne Hook-Deklarationen
    content = re.sub(r'\s*const\s*{\s*[^}]*isPremium[^}]*}\s*=\s*useSubscription\(\);?\s*\n?', '', content)
    content = re.sub(r'\s*const\s*{\s*[^}]*showUpgrade[^}]*}\s*=\s*useUpgrade\(\);?\s*\n?', '', content)
    content = re.sub(r'\s*const\s*\[showUpgradePrompt,\s*setShowUpgradePrompt\]\s*=\s*useState.*?;?\s*\n?', '', content)

    # Entferne isPremium-Conditional onClick
    content = re.sub(
        r'onClick=\{\(\)\s*=>\s*\{\s*if\s*\(\s*!\s*isPremium\s*\)\s*\{[^\}]+\}\s*else\s*\{([^\}]+)\}\s*\}\}',
        r'onClick={() => \1}',
        content
    )

    # Entferne Premium-Badges
    content = re.sub(r'\{!isPremium\s*&&\s*<Crown[^/>]*\/>}\s*', '', content)
    content = re.sub(r'\{!isPremium\s*&&\s*<span[^>]*>\(Premium\)<\/span>}\s*', '', content)

    # Entferne title mit Premium
    content = re.sub(r'\s*title=\{!isPremium\s*\?[^\}]+:[^\}]+\}\s*', '', content)

    # Entferne disabled=! isPremium
    content = re.sub(r'\s*disabled=\{!isPremium\}\s*', '', content)

    # Entferne UpgradePrompt
    content = re.sub(r'\s*\{showUpgradePrompt\s*&&\s*<UpgradePrompt[^/]*/>\}\s*\n?', '', content)

    # Entferne conditional Premium-Components
    content = re.sub(r'\s*\{!isPremium\s*&&\s*<[A-Z][a-zA-Z]*\s*/>\}\s*\n?', '', content)

    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

components_dir = Path('/tmp/cc-agent/59476657/project/src/components')
changed = 0
for tsx_file in components_dir.glob('*.tsx'):
    if clean_component(tsx_file):
        changed += 1
        print(f"Cleaned: {tsx_file.name}")

print(f"Total: {changed} files")
