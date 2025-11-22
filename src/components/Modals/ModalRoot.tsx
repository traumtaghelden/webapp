import { useEffect, useState } from 'react';
import { subscribe, getActiveModal, closeModal } from '../../lib/modalManager';
import ModalBackdrop from './ModalBackdrop';
import ModalContainer from './ModalContainer';
import FeaturesModal from './FeaturesModal';
import PricingModal from './PricingModal';
import HowItWorksModal from './HowItWorksModal';
import FAQModal from './FAQModal';
import ImpressumModal from './ImpressumModal';
import PrivacyModal from './PrivacyModal';
import TermsModal from './TermsModal';
import LoginModal from './LoginModal';
import StartModal from './StartModal';

const modalConfigs = {
  features: {
    title: 'Features',
    component: FeaturesModal,
    maxWidth: '2xl' as const,
  },
  pricing: {
    title: 'Preise',
    component: PricingModal,
    maxWidth: '2xl' as const,
  },
  howitworks: {
    title: "So funktioniert's",
    component: HowItWorksModal,
    maxWidth: 'xl' as const,
  },
  faq: {
    title: 'Häufig gestellte Fragen',
    component: FAQModal,
    maxWidth: 'xl' as const,
  },
  impressum: {
    title: 'Impressum',
    component: ImpressumModal,
    maxWidth: 'lg' as const,
  },
  privacy: {
    title: 'Datenschutz',
    component: PrivacyModal,
    maxWidth: 'xl' as const,
  },
  terms: {
    title: 'Allgemeine Geschäftsbedingungen',
    component: TermsModal,
    maxWidth: 'xl' as const,
  },
  login: {
    title: 'Login & Registrierung',
    component: LoginModal,
    maxWidth: 'md' as const,
  },
  start: {
    title: 'Kostenlos starten',
    component: StartModal,
    maxWidth: 'md' as const,
  },
};

export default function ModalRoot() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setActiveModal(getActiveModal());
    });

    setActiveModal(getActiveModal());

    return unsubscribe;
  }, []);

  if (!activeModal || !(activeModal in modalConfigs)) {
    return null;
  }

  const config = modalConfigs[activeModal as keyof typeof modalConfigs];
  const ModalComponent = config.component;

  return (
    <>
      <ModalBackdrop onClick={closeModal} />
      <ModalContainer onClose={closeModal} title={config.title} maxWidth={config.maxWidth}>
        <ModalComponent />
      </ModalContainer>
    </>
  );
}
