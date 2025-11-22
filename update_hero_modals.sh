#!/bin/bash

# Script um alle HeroJourney Modals einheitlich anzupassen

MODAL_DIR="/tmp/cc-agent/59804649/project/src/components/HeroJourney"

# Liste der zu ändernden Modals (ohne WeddingDateModal, da bereits fertig)
MODALS=(
  "GuestCountModal.tsx"
  "BudgetDefinitionModal.tsx"
  "LocationModal.tsx"
  "CeremonyModal.tsx"
  "GuestPlanningModal.tsx"
  "PersonalPlanningModal.tsx"
  "StyleSettingsModal.tsx"
  "TimelineChecklistModal.tsx"
  "StepDetailModal.tsx"
)

echo "Starte Anpassung der HeroJourney Modals..."

for MODAL in "${MODALS[@]}"; do
  FILE="$MODAL_DIR/$MODAL"

  if [ ! -f "$FILE" ]; then
    echo "⚠️  Datei nicht gefunden: $MODAL"
    continue
  fi

  echo "📝 Bearbeite: $MODAL"

  # 1. Backdrop: items-start → items-center, py-8 px-4 → p-4, overflow-y-auto → overflow-hidden
  sed -i 's/flex items-start justify-center py-8 px-4 overflow-y-auto/flex items-center justify-center p-4 overflow-hidden/g' "$FILE"

  # 2. Modal Container: border-[#d4af37]/30 → border-[#F5B800]/30, + max-h-[90vh] flex flex-col
  sed -i 's/rounded-2xl w-full shadow-2xl border border-\[#d4af37\]\/30 relative mx-auto/rounded-2xl w-full shadow-2xl border border-[#F5B800]\/30 relative max-h-[90vh] flex flex-col/g' "$FILE"
  sed -i 's/rounded-2xl w-full shadow-2xl border border-\[#d4af37\]\/30 relative/rounded-2xl w-full shadow-2xl border border-[#F5B800]\/30 relative max-h-[90vh] flex flex-col/g' "$FILE"

  # 3. Blur Circles standardisieren
  sed -i 's/from-\[#d4af37\]\/5 via-transparent to-blue-500\/5/from-[#d4af37]\/10 via-transparent to-[#f4d03f]\/10/g' "$FILE"
  sed -i 's/bg-\[#d4af37\]\/10 rounded-full blur-3xl translate-x-1\/2 -translate-y-1\/2 animate-pulse/bg-[#d4af37]\/20 rounded-full blur-3xl -translate-x-1\/2 -translate-y-1\/2 animate-pulse pointer-events-none/g' "$FILE"

  # 4. Header: gap-4 p-6 → gap-3 p-4, + flex-shrink-0
  sed -i 's/flex items-start gap-4 p-6 border-b border-gray-700\/50/flex items-start gap-3 p-4 border-b border-gray-700\/50 flex-shrink-0/g' "$FILE"

  # 5. Header Icon: p-4 rounded-xl → p-2.5 rounded-lg, w-8 h-8 → w-5 h-5, shadow-2xl → shadow-xl, /50 → /40
  sed -i 's/p-4 rounded-xl shadow-2xl shadow-\[#d4af37\]\/50/p-2.5 rounded-lg shadow-xl shadow-[#d4af37]\/40/g' "$FILE"
  sed -i 's/<Calendar className="w-8 h-8 text-white" \/>/<Calendar className="w-5 h-5 text-white" \/>/g' "$FILE"
  sed -i 's/<Users className="w-8 h-8 text-white" \/>/<Users className="w-5 h-5 text-white" \/>/g' "$FILE"
  sed -i 's/<MapPin className="w-8 h-8 text-white" \/>/<MapPin className="w-5 h-5 text-white" \/>/g' "$FILE"

  # 6. Header Title: text-3xl → text-xl, flex-1 → flex-1 min-w-0, + truncate
  sed -i 's/<h2 className="text-3xl font-bold text-white mb-1">/<h2 className="text-xl font-bold text-white truncate">/g' "$FILE"
  sed -i 's/<div className="flex-1">/<div className="flex-1 min-w-0">/g' "$FILE"

  # 7. Header Subtitle: text-sm text-gray-300 → text-xs text-gray-400
  sed -i 's/<p className="text-sm text-gray-300">/<p className="text-xs text-gray-400">/g' "$FILE"

  # 8. Close Button: w-6 h-6 → w-5 h-5, + flex-shrink-0
  sed -i 's/hover:rotate-90 duration-300">/hover:rotate-90 duration-300 flex-shrink-0">/g' "$FILE"
  sed -i 's/<X className="w-6 h-6" \/>/<X className="w-5 h-5" \/>/g' "$FILE"

  # 9. Content: p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-220px)] → p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar
  sed -i 's/p-6 space-y-6 overflow-y-auto max-h-\[calc(90vh-220px)\]/p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar/g' "$FILE"
  sed -i 's/p-6 space-y-6/p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar/g' "$FILE"

  # 10. Footer: gap-4 p-6 → gap-2 p-4, + flex-shrink-0
  sed -i 's/flex justify-end gap-4 p-6 border-t border-gray-700\/50/flex justify-end gap-2 p-4 border-t border-gray-700\/50 flex-shrink-0/g' "$FILE"

  # 11. Buttons: px-8 py-3 rounded-xl → px-4 py-2 rounded-lg (Abbrechen), px-5 py-2 rounded-lg (Speichern)
  sed -i 's/px-8 py-3 rounded-xl text-gray-300 border-2 border-gray-600\/50/px-4 py-2 rounded-lg text-sm text-gray-300 border border-gray-600\/50/g' "$FILE"
  sed -i 's/px-8 py-3 rounded-xl bg-gradient-to-r from-\[#d4af37\] to-\[#c19a2e\]/px-5 py-2 rounded-lg text-sm bg-gradient-to-r from-[#d4af37] to-[#f4d03f]/g' "$FILE"

  # 12. Button Icons: w-5 h-5 → w-4 h-4
  sed -i 's/gap-2">$/gap-1.5">/g' "$FILE"

  echo "✅ Fertig: $MODAL"
done

echo ""
echo "🎉 Alle Modals wurden angepasst!"
