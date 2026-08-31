import React, { useState } from 'react';

interface UserAvatarProps {
  name?: string;
  avatar?: string;
  avatarUrl?: string;
  avatarType?: 'preset' | 'custom' | 'initial';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  alt?: string;
}

const COLOR_PALETTES = [
  'bg-blue-600 text-white',
  'bg-indigo-600 text-white',
  'bg-purple-600 text-white',
  'bg-emerald-600 text-white',
  'bg-teal-600 text-white',
  'bg-cyan-600 text-white',
  'bg-amber-600 text-white',
  'bg-rose-600 text-white',
  'bg-violet-600 text-white',
  'bg-pink-600 text-white'
];

/**
 * Deterministically get initials and color based on name
 */
export function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'CN';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarColor(name?: string): string {
  if (!name) return COLOR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTES.length;
  return COLOR_PALETTES[index];
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = '',
  avatar,
  avatarUrl,
  avatarType,
  size = 'md',
  className = '',
  alt
}) => {
  const [imageError, setImageError] = useState(false);
  const src = avatarUrl || avatar;

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-extrabold',
    lg: 'w-14 h-14 text-base font-extrabold',
    xl: 'w-20 h-20 text-xl font-extrabold',
    '2xl': 'w-28 h-28 text-3xl font-extrabold'
  };

  const initials = getInitials(name);
  const colorClass = getAvatarColor(name);

  // If user explicitly has 'initial' avatarType or no src or image errored
  const showInitials = avatarType === 'initial' || !src || imageError;

  if (showInitials) {
    return (
      <div
        className={`rounded-full flex items-center justify-center font-['Plus_Jakarta_Sans'] select-none shrink-0 uppercase shadow-inner ${colorClass} ${sizeClasses[size]} ${className}`}
        title={name}
        aria-label={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      <img
        src={src}
        alt={alt || name || 'Avatar Pengguna'}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
};
