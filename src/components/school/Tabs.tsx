import React, { useEffect, useMemo, useState } from 'react';
import './Tabs.css';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTabId?: string;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'pills' | 'stacked';
  onChange?: (tabId: string) => void;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  activeTabId,
  className = '',
  orientation = 'horizontal',
  variant = 'pills',
  onChange,
}) => {
  const firstTabId = tabs[0]?.id ?? '';
  const initialTab = activeTabId && tabs.some((tab) => tab.id === activeTabId)
    ? activeTabId
    : defaultTab && tabs.some((tab) => tab.id === defaultTab)
      ? defaultTab
      : firstTabId;
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const nextTab = defaultTab && tabs.some((tab) => tab.id === defaultTab) ? defaultTab : tabs[0]?.id ?? '';
    setActiveTab((currentTab) => {
      if (tabs.some((tab) => tab.id === currentTab)) return currentTab;
      return nextTab;
    });
  }, [defaultTab, tabs]);

  useEffect(() => {
    if (activeTabId && tabs.some((tab) => tab.id === activeTabId)) {
      setActiveTab(activeTabId);
    }
  }, [activeTabId, tabs]);

  // Notify the parent of the active tab (initial + on change) so it can
  // lazy-load that tab's data instead of fetching every tab upfront.
  useEffect(() => {
    if (activeTab && (!activeTabId || activeTab !== activeTabId)) {
      onChange?.(activeTab);
    }
  }, [activeTab, activeTabId, onChange]);

  const activeContent = useMemo(() => tabs.find((t) => t.id === activeTab)?.content, [activeTab, tabs]);

  if (!tabs.length) return null;

  return (
    <div className={`tabs tabs--${orientation} tabs--${variant} ${className}`.trim()}>
      <div className="tabs__header" role="tablist" aria-orientation={orientation}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              disabled={tab.disabled}
              className={`tabs__tab ${isActive ? 'tabs__tab--active' : ''} ${tab.disabled ? 'tabs__tab--disabled' : ''}`}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
            >
              {tab.icon && <span className="tabs__tab-icon">{tab.icon}</span>}
              <span className="tabs__tab-text">
                <span className="tabs__tab-label">{tab.label}</span>
                {tab.description && <span className="tabs__tab-description">{tab.description}</span>}
              </span>
            </button>
          );
        })}
      </div>
      <div className="tabs__content" role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeContent}
      </div>
    </div>
  );
};

export default Tabs;
