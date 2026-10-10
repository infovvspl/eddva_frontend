import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: Option[];
  className?: string;
  menuClassName?: string;
  /** When provided, onChange fires a synthetic event { target: { name, value } } for form compatibility */
  name?: string;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  /** Additional classes for the trigger button */
  triggerClassName?: string;
  /** Adds a text filter above the option list — for long lists (parents, students, subjects) */
  searchable?: boolean;
  /** Placeholder for the search input; defaults to "Search..." */
  searchPlaceholder?: string;
  /** Shown in the menu when a search filters every option out */
  noResultsText?: string;
}

// Radix's <Select.Item> forbids value="" (reserved to mean "no selection"), but callers
// commonly pass an empty-string option for a "Select..."/"All" placeholder entry. Swap it
// for a sentinel only at the Radix boundary so that contract keeps working unchanged.
const EMPTY_VALUE_SENTINEL = "__eddva_empty__";
const toItemValue = (value: string | number) => (String(value) === "" ? EMPTY_VALUE_SENTINEL : String(value));
const fromItemValue = (itemValue: string) => (itemValue === EMPTY_VALUE_SENTINEL ? "" : itemValue);

const DEFAULT_TRIGGER_CLASSES =
  "flex h-[50px] min-h-[50px] w-full items-center justify-between gap-2 px-4 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-sm font-semibold outline-none hover:bg-slate-50/80 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed";

export const CustomSelect = React.forwardRef<HTMLDivElement, CustomSelectProps>(
  (
    {
      value,
      onChange,
      options,
      className,
      menuClassName,
      name,
      disabled,
      id,
      placeholder,
      triggerClassName,
      searchable,
      searchPlaceholder,
      noResultsText,
    },
    forwardedRef,
  ) => {
    const [open, setOpen] = React.useState(false);
    const selectedOption = options.find((o) => String(o.value) === String(value));

    const emit = (optValue: string | number) => {
      if (name) {
        onChange({ target: { name, value: optValue } } as any);
      } else {
        onChange(optValue);
      }
    };

    const triggerClasses = triggerClassName ?? cn(DEFAULT_TRIGGER_CLASSES, selectedOption ? "text-slate-900 dark:text-white" : "text-slate-400");

    if (searchable) {
      return (
        <div ref={forwardedRef} className={className}>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button type="button" id={id} disabled={disabled} className={cn("relative w-full", triggerClasses)}>
                <span className="truncate">{selectedOption?.label || placeholder || "Select..."}</span>
                <ChevronDown
                  className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0 transition-transform", open && "rotate-180")}
                />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className={cn("w-[var(--radix-popover-trigger-width)] p-0", menuClassName)}>
              <Command>
                <CommandInput placeholder={searchPlaceholder || "Search..."} />
                <CommandList>
                  <CommandEmpty>{noResultsText || "No matches"}</CommandEmpty>
                  <CommandGroup>
                    {options.map((opt) => (
                      <CommandItem
                        key={String(opt.value)}
                        disabled={opt.disabled}
                        value={opt.label}
                        onSelect={() => {
                          emit(opt.value);
                          setOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", String(value) === String(opt.value) ? "opacity-100" : "opacity-0")} />
                        {opt.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      );
    }

    return (
      <div ref={forwardedRef} className={className}>
        <Select
          value={toItemValue(value === undefined || value === null ? "" : value)}
          onValueChange={(val) => {
            const actual = fromItemValue(val);
            const opt = options.find((o) => String(o.value) === actual);
            emit(opt ? opt.value : actual);
          }}
          disabled={disabled}
        >
          <SelectTrigger id={id} className={triggerClasses}>
            <SelectValue placeholder={placeholder || "Select..."} />
          </SelectTrigger>
          <SelectContent className={menuClassName}>
            {options.map((opt) => (
              <SelectItem key={toItemValue(opt.value)} value={toItemValue(opt.value)} disabled={opt.disabled}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  },
);
CustomSelect.displayName = "CustomSelect";
