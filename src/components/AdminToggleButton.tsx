import React from 'react';
import { Shield, X } from 'lucide-react';

interface Props {
  onToggle: () => void;
  isMinimized?: boolean;
}

export default function AdminToggleButton({ onToggle, isMinimized = false }: Props) {
  return (
    <button
      onClick={onToggle}
      className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[#F5B800] to-[#E0A800] hover:from-[#E0A800] hover:to-[#D09700] text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center gap-3 group"
      title={isMinimized ? 'Zurück zum Admin Dashboard' : 'Admin Dashboard minimieren'}
    >
      <Shield className="w-6 h-6" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-medium">
        {isMinimized ? 'Admin Dashboard' : 'Zur User-Ansicht'}
      </span>
      {!isMinimized && <X className="w-4 h-4 ml-2" />}
    </button>
  );
}
