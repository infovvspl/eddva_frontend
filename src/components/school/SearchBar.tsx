import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ placeholder = 'Search...', value, onChange, className = '' }) => {
  return (
    <div
      className={cn(
        "flex items-center bg-white border-[1.5px] border-[var(--gray-200)] rounded-[var(--radius-md)] px-3 max-w-[320px] transition-all duration-150",
        "focus-within:border-indigo-300 focus-within:shadow-[0_0_0_3px_rgba(124,58,237,0.08)]",
        className,
      )}
    >
      <Search size={18} className="text-[var(--gray-400)] shrink-0" />
      <Input
        type="text"
        className="flex-1 h-auto border-0 rounded-none bg-transparent px-2.5 py-2 text-[0.813rem] text-[var(--gray-800)] placeholder:text-[var(--gray-400)] focus-visible:ring-0 focus-visible:ring-offset-0"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
