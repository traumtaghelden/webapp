import { ReactNode, useEffect, useState } from 'react';
import TabNavigation from './TabNavigation';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number | string;
  disabled?: boolean;
  content: ReactNode;
  shortLabel?: string;
}

interface TabContainerProps {
  tabs: Tab[];
  defaultTab?: string;
  storageKey?: string;
  urlParam?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  activeTab?: string;
}

export default function TabContainer({
  tabs,
  defaultTab,
  storageKey,
  urlParam,
  onTabChange,
  className = '',
  activeTab: externalActiveTab
}: TabContainerProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<string>(() => {
    if (urlParam) {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get(urlParam);
      if (urlTab && tabs.some(t => t.id === urlTab)) {
        return urlTab;
      }
    }

    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored && tabs.some(t => t.id === stored)) {
        return stored;
      }
    }

    return defaultTab || tabs[0]?.id || '';
  });

  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;

  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, activeTab);
    }

    if (urlParam) {
      const url = new URL(window.location.href);
      url.searchParams.set(urlParam, activeTab);
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeTab, storageKey, urlParam]);

  const handleTabChange = (tabId: string) => {
    if (tabs.find(t => t.id === tabId)?.disabled) return;

    setIsTransitioning(true);
    setTimeout(() => {
      if (externalActiveTab === undefined) {
        setInternalActiveTab(tabId);
      }
      setIsTransitioning(false);
      onTabChange?.(tabId);
    }, 150);
  };

  const activeTabObj = tabs.find(t => t.id === activeTab);

  return (
    <div className={`space-y-6 ${className}`}>
      <TabNavigation
        tabs={tabs.map(t => ({
          id: t.id,
          label: t.label,
          icon: t.icon,
          badge: t.badge,
          disabled: t.disabled,
          shortLabel: t.shortLabel
        }))}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        variant="page"
      />

      <div
        className={`transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTabObj?.content}
      </div>
    </div>
  );
}
