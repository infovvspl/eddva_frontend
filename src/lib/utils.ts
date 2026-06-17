import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeSubjectName(name: string | null | undefined): string {
  if (!name) return '';
  const cleaned = name.trim().replace(/\s+/g, ' ');
  const lowerCleaned = cleaned.toLowerCase();
  
  if (lowerCleaned === 'math' || lowerCleaned === 'maths' || lowerCleaned === 'mathematics') {
    return 'Mathematics';
  }
  if (lowerCleaned === 'hindi') {
    return 'Hindi';
  }
  if (lowerCleaned === 'english') {
    return 'English';
  }
  if (lowerCleaned === 'science') {
    return 'Science';
  }
  if (lowerCleaned === 'biology') {
    return 'Biology';
  }
  if (lowerCleaned === 'computer science') {
    return 'Computer Science';
  }
  if (lowerCleaned === 'social science') {
    return 'Social Science';
  }
  if (lowerCleaned === 'history') {
    return 'History';
  }
  
  // Title case general words
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
