import re

filepath = 'src/components/DataExport.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# Remove all broken ternary blocks: { ? (...) : (...) }
content = re.sub(
    r'\s*\{\s*\?\s*\([^}]*\)\s*:\s*\([^}]*\)\s*\}',
    '',
    content,
    flags=re.DOTALL
)

# Remove orphaned closing parens/brackets
content = re.sub(r'^\s*\)\}\s*$', '', content, flags=re.MULTILINE)

with open(filepath, 'w') as f:
    f.write(content)

print("Fixed")
