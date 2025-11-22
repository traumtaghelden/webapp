#!/usr/bin/env python3
import re

file_path = '/tmp/cc-agent/59476657/project/src/components/GuestManager.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Entferne alle canAddGuest Referenzen
content = re.sub(r'canAddGuest\(\)', 'true', content)

# Entferne alle limits Referenzen
content = re.sub(r'limits\?\.guests', '{ current: 0, max: 999 }', content)

# Entferne alle { 999 !== null && (...)} Blöcke
content = re.sub(r'\{\s*999\s*!==\s*null\s*&&\s*\([^)]+\)\s*\}', '', content)

# Entferne title={!canAddGuest() ? ... : ''}
content = re.sub(r'title=\{!true\s*\?[^}]+:\s*[\'"][\'"]?\}', '', content)

# Entferne disabled={ showAddForm}
content = re.sub(r'disabled=\{\s*showAddForm\}', '', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("GuestManager cleaned")
