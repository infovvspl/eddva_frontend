import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

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
  onChange,
}) => {
  if (!tabs.length) return null;

  const firstTabId = tabs[0]?.id ?? '';
  const isControlled = activeTabId !== undefined;
  const fallback = defaultTab && tabs.some((t) => t.id === defaultTab) ? defaultTab : firstTabId;

  const rootProps = isControlled
    ? { value: tabs.some((t) => t.id === activeTabId) ? activeTabId : fallback }
    : { defaultValue: fallback };

  return (
    <TabsPrimitive.Root
      {...rootProps}
      onValueChange={onChange}
      orientation={orientation}
      className={cn(
        "flex flex-col gap-4",
        orientation === 'vertical' && "grid grid-cols-[minmax(220px,280px)_1fr] items-start gap-4",
        className,
      )}
    >
      <TabsPrimitive.List
        className={cn(
          "flex gap-2",
          orientation === 'horizontal'
            ? "overflow-x-auto p-[0.4rem] border border-slate-400/[0.18] rounded-[1.25rem] bg-white/[0.72] backdrop-blur-[18px] shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:bg-slate-900/[0.68] dark:border-slate-600/45"
            : "flex-col overflow-visible p-2 border border-slate-400/[0.16] rounded-[1.5rem] bg-white/[0.72] backdrop-blur-[18px] shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:bg-slate-900/[0.68] dark:border-slate-600/45",
        )}
      >
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
            className={cn(
              "flex items-center gap-[5px] rounded-2xl text-sm font-semibold text-[var(--gray-500)] transition-all whitespace-nowrap cursor-pointer text-left font-sans",
              "hover:text-[var(--gray-700)] hover:bg-blue-600/[0.06]",
              "data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-[0_12px_28px_rgba(37,99,235,0.22)] data-[state=active]:hover:text-white data-[state=active]:hover:bg-blue-600",
              "disabled:opacity-45 disabled:cursor-not-allowed",
              orientation === 'vertical' ? "w-full justify-start px-[1.1rem] py-4" : "px-4 py-[0.8rem]",
            )}
          >
            {tab.icon && (
              <span className="inline-flex shrink-0 items-center justify-center h-[18px] w-[18px] opacity-95 [&_svg]:h-4 [&_svg]:w-4">
                {tab.icon}
              </span>
            )}
            <span className="flex flex-col gap-0.5">
              <span className="leading-tight">{tab.label}</span>
              {tab.description && <span className="text-[0.72rem] font-medium opacity-70">{tab.description}</span>}
            </span>
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {tabs.map((tab) => (
        <TabsPrimitive.Content
          key={tab.id}
          value={tab.id}
          className={cn("min-w-0", orientation === 'vertical' && "pt-0")}
        >
          {tab.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
};

export default Tabs;
