#!/usr/bin/env python3
import re

with open('/tmp/cc-agent/59476657/project/src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Entferne kaputte Badge-Funktion komplett
content = re.sub(r'function DashboardSubscriptionBadge\(\)[^\}]*\{[^\}]*\}[^\}]*\}[^\}]*\}', '', content, flags=re.DOTALL)

# Entferne alle verbleibenden isPremium Referenzen
content = re.sub(r'isPremium={isPremium}', '', content)
content = re.sub(r'isPremium\s*\?[^:]+:[^}]+\}', 'false', content)
content = re.sub(r',?\s*isPremium', '', content)
content = re.sub(r'\},\s*\[isPremium\]\);', '});', content)

# Entferne subscription tab display
content = re.sub(r'\{activeTab === \'subscription\' &&[^\}]*\}', '', content, flags=re.DOTALL)

# Entferne subscription onClick und title
content = re.sub(r'onClick=\{\(\)\s*=>\s*setActiveTab\(\'subscription\'\)\}', '', content)
content = re.sub(r'className="[^"]*"\s*title="Abonnement"', 'className="hidden"', content)

# Entferne PremiumTeaserWidget
content = re.sub(r'<PremiumTeaserWidget\s*/>', '', content)

# Cleanup broken code
content = re.sub(r'>\s*>', '>', content)
content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

with open('/tmp/cc-agent/59476657/project/src/components/Dashboard.tsx', 'w') as f:
    f.write(content)

print("Dashboard fixed")
