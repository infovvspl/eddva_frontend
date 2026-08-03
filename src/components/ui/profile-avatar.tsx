import { useEffect, useMemo, useState } from 'react';
import { UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const initials = useMemo(() => getInitials(name), [name]);
  const shouldShowImage = !!src && !imageFailed && !isCartoonAvatar(src);

  return (
    <div className={cn('relative overflow-hidden bg-slate-100 flex items-center justify-center', className)}>
      {shouldShowImage ? (
        <img
          src={src ?? undefined}
          alt={alt || name || 'Profile photo'}
          className={cn('h-full w-full object-cover', imageClassName)}
          onError={() => setImageFailed(true)}
        />
      ) : initials ? (
        <span className={cn('font-bold tracking-tight text-slate-700', fallbackClassName)}>{initials}</span>
      ) : (
        <UserRound className={cn('text-slate-400', fallbackClassName)} />
      )}
    </div>
  );
}
