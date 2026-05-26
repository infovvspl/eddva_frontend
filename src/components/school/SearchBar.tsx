import React from 'react';
import { Search } from 'lucide-react';
import './SearchBar.css';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ placeholder = 'Search...', value, onChange, className = '' }) => {
  return (
    <div className={`search-bar ${className}`}>
      <Search size={18} className="search-bar__icon" />
      <input
        type="text"
        className="search-bar__input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
