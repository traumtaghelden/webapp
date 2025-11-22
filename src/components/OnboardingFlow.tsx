import { useState, useEffect } from 'react';
import { Heart, ArrowRight, ArrowLeft, Calendar, LogOut, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OnboardingIntro from './OnboardingIntro';

interface OnboardingFlowProps {
  onComplete: (data: {
    weddingId: string;
    partner1Name: string;
    partner2Name: string;
    weddingDate: string;
  }) => void;
}

interface FormData {
  partner1Name: string;
  partner2Name: string;
  weddingDate: string;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [showIntro, setShowIntro] = useState(true);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    partner1Name: '',
    partner2Name: '',
    weddingDate: '',
  });

  const totalSteps = 3;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSubmitting(false);
        return;
      }

      // FIRST: Create or update wedding entry (upsert handles unique constraint on user_id)
      const { data, error } = await supabase
        .from('weddings')
        .upsert(
          {
            user_id: user.id,
            partner_1_name: formData.partner1Name,
            partner_2_name: formData.partner2Name,
            wedding_date: formData.weddingDate,
            guest_count: 0,
            ceremony_type: 'traditional',
            total_budget: 0,
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;

      // SECOND: Update user profile ONLY after wedding data is successfully created
     const { error: profileError } = await supabase
  .from('user_profiles')
  .upsert({
    id: user.id,
    user_id: user.id,  // ← Diese Zeile hinzufügen!
    full_name: formData.fullName,
    phone_number: formData.phoneNumber,
    updated_at: new Date().toISOString()
  });

      if (profileError) throw profileError;

      if (data) {
        onComplete({
          weddingId: data.id,
          partner1Name: formData.partner1Name,
          partner2Name: formData.partner2Name,
          weddingDate: formData.weddingDate,
        });
      }
    } catch (error) {
      console.error('Error creating wedding:', error);
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 0:
        return formData.partner1Name.trim() !== '';
      case 1:
        return formData.partner2Name.trim() !== '';
      case 2:
        return formData.weddingDate !== '';
      default:
        return false;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (showIntro) {
    return <OnboardingIntro onComplete={() => setShowIntro(false)} />;
  }

  const stepContent = [
    {
      icon: Heart,
      title: 'Wer heiratet?',
      subtitle: 'Dein Name',
      field: 'partner1Name',
      placeholder: 'z.B. Alex',
      type: 'text'
    },
    {
      icon: Heart,
      title: 'Und wer noch?',
      subtitle: 'Name deines Partners / deiner Partnerin',
      field: 'partner2Name',
      placeholder: 'z.B. Sam',
      type: 'text'
    },
    {
      icon: Calendar,
      title: 'Der große Tag',
      subtitle: 'Wann ist eure Hochzeit?',
      field: 'weddingDate',
      placeholder: '',
      type: 'date'
    }
  ];

  const currentStep = stepContent[step];
  const Icon = currentStep.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(https://res.cloudinary.com/dvaha0i6v/image/upload/v1761905970/Background_onboarding_1_jcn71r.png)' }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40"></div>

      {/* Logout Button - Only on first step */}
      {step === 0 && (
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 text-[#f7f2eb] hover:text-white transition-all duration-300 border-2 border-[#d4af37]/50 hover:border-[#d4af37] rounded-full backdrop-blur-sm hover:bg-[#d4af37]/10"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline text-sm font-medium">Abmelden</span>
        </button>
      )}

      <div className="max-w-xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8 opacity-100">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Icon className="w-16 h-16 text-[#d4af37] fill-current opacity-100" />
              <Sparkles className="w-5 h-5 text-[#f4d03f] absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 opacity-100">
          {/* Title on Modal */}
          <h2 className="text-xl font-bold text-[#0a253c] mb-6 text-center">
            {currentStep.subtitle}
          </h2>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#0a253c]">
                Schritt {step + 1} von {totalSteps}
              </span>
              <span className="text-sm font-semibold text-[#d4af37]">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-[#f7f2eb] rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-6 min-h-[200px] flex flex-col justify-center">
            <div className="opacity-100">
              <label className="block text-base font-semibold text-[#0a253c] mb-3">
                Name eingeben
              </label>
              <input
                type={currentStep.type}
                value={formData[currentStep.field as keyof FormData]}
                onChange={(e) => setFormData({ ...formData, [currentStep.field]: e.target.value })}
                className="w-full px-6 py-4 rounded-xl text-lg border-2 border-[#d4af37] focus:border-[#f4d03f] focus:ring-2 focus:ring-[#d4af37]/30 outline-none text-[#0a253c] transition-all bg-white shadow-sm"
                placeholder={currentStep.placeholder}
                autoFocus
              />
            </div>

            {/* Helper Text */}
            {step === 2 && (
              <div className="bg-[#f7f2eb] rounded-xl p-4 opacity-100">
                <p className="text-[#666666] text-sm leading-relaxed">
                  <Sparkles className="w-4 h-4 inline mr-2 text-[#d4af37]" />
                  Alle weiteren Details wie Budget, Gäste und Team erfasst ihr bequem über den Heldenplan!
                </p>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base border-2 transition-all ${
                step === 0
                  ? 'border-[#d4af37]/20 text-[#d4af37]/30 cursor-not-allowed opacity-50'
                  : 'border-[#d4af37] text-[#d4af37] font-semibold hover:bg-[#d4af37]/10 hover:scale-105 active:scale-95'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Zurück</span>
            </button>
            <button
              onClick={handleNext}
              disabled={!isStepValid() || isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a253c] font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
            >
              {isSubmitting ? (
                'Wird erstellt...'
              ) : step < totalSteps - 1 ? (
                <>
                  Weiter
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  Los geht&apos;s!
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Hint */}
        <div className="text-center mt-6 animate-in fade-in duration-1000 delay-500">
          <p className="text-[#f7f2eb]/70 text-sm">
            Nur noch {totalSteps - step - 1} {totalSteps - step - 1 === 1 ? 'Schritt' : 'Schritte'}!
          </p>
        </div>
      </div>
    </div>
  );
}
