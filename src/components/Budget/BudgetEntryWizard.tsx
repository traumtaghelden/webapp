import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, DollarSign, Users, Lock, CheckCircle } from 'lucide-react';
import { supabase, type BudgetCategory } from '../../lib/supabase';
import { BUDGET, COMMON } from '../../constants/terminology';

interface BudgetEntryWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  weddingId: string;
  categories: BudgetCategory[];
  onCreateCategory: () => void;
  prefillVendorId?: string;
  prefillVendorName?: string;
  prefillLocationId?: string;
  prefillLocationName?: string;
}

type Step = 1 | 2 | 3;
type CalculationType = 'total' | 'perHead';
type PaymentType = 'open' | 'paid';

export default function BudgetEntryWizard({
  isOpen,
  onClose,
  onSuccess,
  weddingId,
  categories,
  onCreateCategory,
  prefillVendorId,
  prefillVendorName,
  prefillLocationId,
  prefillLocationName,
}: BudgetEntryWizardProps) {

  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [calculationType, setCalculationType] = useState<CalculationType>('total');
  const [totalAmount, setTotalAmount] = useState('');
  const [perHeadAmount, setPerHeadAmount] = useState('');
  const [guestCount, setGuestCount] = useState(0);
  const [paymentType, setPaymentType] = useState<PaymentType>('open');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadGuestCount();
      // Prefill from URL parameters
      if (prefillVendorId) {
        setVendorId(prefillVendorId);
        if (prefillVendorName) {
          setTitle(`${prefillVendorName} - Dienstleistung`);
        }
      }
      if (prefillLocationId) {
        setLocationId(prefillLocationId);
        if (prefillLocationName) {
          setTitle(`${prefillLocationName} - Location`);
        }
      }
    }
  }, [isOpen, weddingId, prefillVendorId, prefillVendorName, prefillLocationId, prefillLocationName]);

  const loadGuestCount = async () => {
    try {
      const { data } = await supabase
        .from('guests')
        .select('invitation_status')
        .eq('wedding_id', weddingId);

      if (data) {
        const confirmed = data.filter(g => g.invitation_status === 'confirmed').length;
        setGuestCount(confirmed);
      }
    } catch (error) {
      console.error('Error loading guest count:', error);
    }
  };

  const resetForm = () => {
    setStep(1);
    setTitle('');
    setCategory('');
    setCalculationType('total');
    setTotalAmount('');
    setPerHeadAmount('');
    setPaymentType('open');
    setVendorId(null);
    setLocationId(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const canProceedStep1 = title.trim() !== '' && category !== '';
  const canProceedStep2 = calculationType === 'total' ? totalAmount !== '' : perHeadAmount !== '';

  const calculatedTotal = calculationType === 'perHead' && perHeadAmount
    ? parseFloat(perHeadAmount) * guestCount
    : parseFloat(totalAmount) || 0;

  const handleStep2Next = () => {
    setStep(3);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const actualCost = calculatedTotal;
      const isPaid = paymentType === 'paid';

      const { error: itemError } = await supabase
        .from('budget_items')
        .insert({
          wedding_id: weddingId,
          category,
          item_name: title,
          estimated_cost: actualCost,
          payment_status: isPaid ? 'paid' : 'open',
          is_per_person: calculationType === 'perHead',
          cost_per_person: calculationType === 'perHead' ? parseFloat(perHeadAmount) : null,
          vendor_id: vendorId,
          location_id: locationId,
        })
        .select()
        .single();

      if (itemError) throw itemError;

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating budget item:', error);
      alert('Fehler beim Erstellen des Eintrags');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = window.getComputedStyle(document.body).overflow;
      const originalHtmlOverflow = window.getComputedStyle(document.documentElement).overflow;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.paddingRight = '';
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 overflow-y-auto"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="bg-gradient-to-b from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-3xl shadow-gold-lg border-2 border-[#d4af37]/30 max-w-2xl w-full max-h-[90vh] flex flex-col relative overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyMTIsIDE3NSwgNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
        <div className="relative z-10 p-6 border-b border-[#d4af37]/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">{BUDGET.ADD_ITEM}</h2>
            <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
              <X className="w-6 h-6 text-white/80 hover:text-white" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all ${
                    step >= s
                      ? 'bg-[#d4af37] text-white'
                      : 'bg-white/20 text-white/60'
                  }`}
                >
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-16 h-1 mx-2 rounded ${step > s ? 'bg-[#d4af37]' : 'bg-white/20'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6">
              {/* Prefill Info Badge */}
              {(prefillVendorName || prefillLocationName) && (
                <div className="bg-[#d4af37]/20 border-2 border-[#d4af37] rounded-xl p-4">
                  <p className="text-white text-sm font-semibold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#d4af37]" />
                    Wird verknüpft mit: {prefillVendorName || prefillLocationName}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">
                  Titel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="z.B. Hochzeitstorte"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">
                  {BUDGET.CATEGORY} <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#d4af37]/30 bg-white/10 text-white placeholder-white/50 focus:border-[#d4af37] focus:outline-none backdrop-blur-sm transition-all [&>option]:bg-[#0a253c] [&>option]:text-white [&>option]:py-2"
                >
                  <option value="" className="bg-[#0a253c] text-white">{BUDGET.CATEGORY} auswählen</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name} className="bg-[#0a253c] text-white">
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={onCreateCategory}
                  className="mt-2 text-sm text-[#d4af37] hover:underline font-semibold"
                >
                  + Neue {BUDGET.CATEGORY} erstellen
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">Berechnungsart</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCalculationType('total')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      calculationType === 'total'
                        ? 'border-[#d4af37] bg-[#d4af37]/20'
                        : 'border-white/20 hover:border-[#d4af37]/50'
                    }`}
                  >
                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-[#d4af37]" />
                    <div className="font-semibold text-white">Gesamtbetrag</div>
                  </button>

                  <button
                    onClick={() => {
                      setCalculationType('perHead');
                    }}
                    className={`p-4 rounded-xl border-2 transition-all relative ${
                      calculationType === 'perHead'
                        ? 'border-[#d4af37] bg-[#d4af37]/20'
                        : 'border-white/20 hover:border-[#d4af37]/50'
                    }`}
                  >
                    <Users className="w-6 h-6 mx-auto mb-2 text-[#d4af37]" />
                    <div className="font-semibold text-white">Pro Kopf</div>
                    {false && (
                      <div className="absolute -top-2 -right-2 bg-[#d4af37] text-white rounded-full p-1">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {calculationType === 'total' ? (
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2">
                    Gesamtbetrag <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={totalAmount}
                      onChange={e => setTotalAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-white/20 focus:border-[#d4af37] focus:outline-none transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 font-semibold">€</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-white/90 mb-2">
                    Betrag pro Person <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={perHeadAmount}
                      onChange={e => setPerHeadAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-white/20 focus:border-[#d4af37] focus:outline-none transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 font-semibold">€</span>
                  </div>

                  {perHeadAmount && (
                    <div className="mt-4 p-4 bg-blue-500/20 rounded-xl border-2 border-blue-500/50">
                      <div className="text-sm text-blue-300 mb-1">Live-Berechnung:</div>
                      <div className="text-2xl font-bold text-white">
                        {guestCount} Gäste × {perHeadAmount} € = {calculatedTotal.toLocaleString('de-DE')} €
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">Zahlungsstatus</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentType('open')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentType === 'open'
                        ? 'border-[#d4af37] bg-[#d4af37]/20'
                        : 'border-white/20 hover:border-[#d4af37]/50'
                    }`}
                  >
                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                    <div className="text-sm font-semibold text-white">Offen</div>
                    <p className="text-xs text-white/60 mt-1">Noch zu bezahlen</p>
                  </button>

                  <button
                    onClick={() => setPaymentType('paid')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentType === 'paid'
                        ? 'border-[#d4af37] bg-[#d4af37]/20'
                        : 'border-white/20 hover:border-[#d4af37]/50'
                    }`}
                  >
                    <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500" />
                    <div className="text-sm font-semibold text-white">Bereits bezahlt</div>
                    <p className="text-xs text-white/60 mt-1">Komplett beglichen</p>
                  </button>
                </div>

                {paymentType === 'paid' && (
                  <div className="mt-4 p-4 bg-green-500/20 rounded-xl border-2 border-green-500/50">
                    <div className="flex items-center gap-2 text-green-300">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Dieser Betrag wird als bereits bezahlt markiert.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 p-6 border-t border-[#d4af37]/30 flex justify-between gap-3 bg-gradient-to-b from-transparent to-[#0a253c]/50 backdrop-blur-sm">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as Step)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-[#d4af37]/40 text-white/70 rounded-xl font-semibold hover:bg-white/10 hover:scale-[1.02] active:scale-95 transition-all min-h-[40px]"
            >
              <ArrowLeft className="w-4 h-4" />
              {COMMON.BACK}
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="px-4 py-2 border-2 border-[#d4af37]/40 text-white/70 rounded-xl font-semibold hover:bg-white/10 hover:scale-[1.02] active:scale-95 transition-all min-h-[40px]"
            >
              {COMMON.CANCEL}
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => (step === 1 ? setStep(2) : handleStep2Next())}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
            >
              Weiter
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
            >
              <CheckCircle className="w-4 h-4" />
              {isSubmitting ? 'Wird erstellt...' : `${BUDGET.ITEM} erstellen`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
