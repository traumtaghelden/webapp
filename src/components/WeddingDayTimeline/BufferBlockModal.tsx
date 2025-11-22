import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Car, Coffee, Users, MapPin } from 'lucide-react';

interface BufferBlockModalProps {
  startTime: string;
  endTime: string;
  onSave: (bufferType: string, bufferName: string) => void;
  onClose: () => void;
  existingBlock?: {
    title: string;
    event_type: string;
  };
  isEdit?: boolean;
}

const bufferTypes = [
  { value: 'waiting', label: 'Wartezeit', icon: Clock, color: '#94A3B8' },
  { value: 'travel', label: 'Weg/Fahrt', icon: Car, color: '#64748B' },
  { value: 'break', label: 'Pause', icon: Coffee, color: '#8B5CF6' },
  { value: 'preparation', label: 'Vorbereitung', icon: Users, color: '#3B82F6' },
  { value: 'transfer', label: 'Transfer', icon: MapPin, color: '#10B981' },
];

export default function BufferBlockModal({ startTime, endTime, onSave, onClose, existingBlock, isEdit = false }: BufferBlockModalProps) {
  const [selectedType, setSelectedType] = useState(existingBlock?.event_type || 'waiting');
  const [bufferName, setBufferName] = useState(existingBlock?.title || '');

  const calculateDuration = () => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const durationMin = (endH * 60 + endM) - (startH * 60 + startM);
    const hours = Math.floor(durationMin / 60);
    const minutes = durationMin % 60;

    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}min`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}min`;
  };

  const handleSubmit = () => {
    if (!bufferName.trim()) {
      alert('Bitte geben Sie einen Namen für den Puffer ein!');
      return;
    }

    onSave(selectedType, bufferName.trim());
  };

  const selectedTypeData = bufferTypes.find(t => t.value === selectedType);
  const IconComponent = selectedTypeData?.icon || Clock;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000 }}
    >
      <div className="bg-gradient-to-br from-[#0A1F3D] via-[#1a3a5c] to-[#2a4a6c] rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-gray-700">
          <div className="bg-[#94A3B8] p-3 rounded-lg">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{isEdit ? 'Pufferzeit bearbeiten' : 'Pufferzeit hinzufügen'}</h2>
            <p className="text-sm text-gray-300 mt-1">
              {startTime} - {endTime} ({calculateDuration()})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Buffer Type Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Art des Puffers<span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {bufferTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.value;

                return (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-[#F5B800] bg-[#F5B800]/10'
                        : 'border-gray-600 hover:border-gray-500 bg-[#1a3a5c]/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: isSelected ? type.color : '#374151' }}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className={`text-sm font-medium ${
                        isSelected ? 'text-[#F5B800]' : 'text-gray-300'
                      }`}>
                        {type.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buffer Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Name/Beschreibung<span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={bufferName}
              onChange={(e) => setBufferName(e.target.value)}
              placeholder={`z.B. "Fahrt zur Location", "Wartezeit vor Kirche", etc.`}
              className="w-full bg-[#1a3a5c] border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20 outline-none transition-all"
              autoFocus
            />
          </div>

          {/* Preview */}
          <div className="bg-[#1a3a5c]/50 border border-gray-600 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-2">Vorschau:</div>
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: selectedTypeData?.color || '#94A3B8' }}
              >
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">
                  {bufferName || 'Puffername eingeben...'}
                </div>
                <div className="text-xs text-gray-400">
                  {selectedTypeData?.label} • {startTime} - {endTime}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Always visible */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700 flex-shrink-0 bg-[#0A1F3D]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-gray-300 border border-gray-600 hover:bg-gray-700/30 transition-all"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-lg bg-[#F5B800] hover:bg-[#E0A800] text-gray-900 font-medium transition-all"
          >
            {isEdit ? 'Speichern' : 'Puffer hinzufügen'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
