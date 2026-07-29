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
  const isControlled = activeTabId !== undefined;

  const [internalActiveTab, setInternalActiveTab] = useState(() => {
    if (defaultTab && tabs.some((t) => t.id === defaultTab)) return defaultTab;
    return firstTabId;
  });

  const activeTab = isControlled
    ? (tabs.some((t) => t.id === activeTabId) ? activeTabId : (defaultTab || firstTabId))
    : (tabs.some((t) => t.id === internalActiveTab) ? internalActiveTab : firstTabId);

  const handleTabClick = (tabId: string) => {
    if (!isControlled) {
      setInternalActiveTab(tabId);
    }
    onChange?.(tabId);
  };

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
              onClick={() => !tab.disabled && handleTabClick(tab.id)}
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
