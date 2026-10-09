import { useMemo } from 'react';
import { UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

function getInitials(name?: string | null) {
  const clean = String(name || '').trim();
  if (!clean) return '';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

interface ProfileAvatarProps {
  src?: string | null;
  name?: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}

function isCartoonAvatar(src?: string | null): boolean {
  if (!src) return false;
  const lower = src.toLowerCase();
  if (lower.includes('dicebear') || lower.includes('robohash') || lower.includes('multiavatar') || lower.includes('cartoon')) {
    return true;
  }
  return false;
}

export function ProfileAvatar({
  src,
  name,
  alt,
  className,
  imageClassName,
  fallbackClassName,
}: ProfileAvatarProps) {
  const initials = useMemo(() => getInitials(name), [name]);
  const showImage = !!src && !isCartoonAvatar(src);

  return (
    <Avatar className={cn('bg-slate-100', className)}>
      {showImage && (
        <AvatarImage
          src={src ?? undefined}
          alt={alt || name || 'Profile photo'}
          className={cn('object-cover', imageClassName)}
        />
      )}
      <AvatarFallback className="bg-slate-100">
        {initials ? (
          <span className={cn('font-bold tracking-tight text-slate-700', fallbackClassName)}>{initials}</span>
        ) : (
          <UserRound className={cn('text-slate-400', fallbackClassName)} />
        )}
      </AvatarFallback>
    </Avatar>
  );
}
