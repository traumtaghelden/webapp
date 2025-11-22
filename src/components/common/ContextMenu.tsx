import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { haptics } from '../../utils/hapticFeedback';

export interface ContextMenuItem {
  icon?: React.ElementType;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: ContextMenuItem[];
  position?: { x: number; y: number };
  title?: string;
}

export default function ContextMenu({
  isOpen,
  onClose,
  items,
  position,
  title,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    haptics.light();
    item.onClick();
    onClose();
  };

  // Position the menu
  const style: React.CSSProperties = position
    ? {
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
      }
    : {};

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-[100] animate-fade-in" onClick={onClose} />

      {/* Context Menu */}
      <div
        ref={menuRef}
        className="fixed z-[101] bg-gradient-to-b from-[#0a253c] to-[#1a3a5c] rounded-2xl shadow-2xl border border-[#d4af37]/30 overflow-hidden animate-scale-in min-w-[240px] max-w-[90vw]"
        style={style}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Schließen"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>
        )}

        {/* Menu Items */}
        <div className="py-2">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ${
                  item.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : item.destructive
                    ? 'hover:bg-red-500/20 text-red-400 active:scale-95'
                    : 'hover:bg-white/10 text-white active:scale-95'
                }`}
              >
                {Icon && (
                  <Icon className={`w-5 h-5 flex-shrink-0 ${
                    item.destructive ? 'text-red-400' : 'text-[#d4af37]'
                  }`} />
                )}
                <span className="font-medium text-sm flex-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
