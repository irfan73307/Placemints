/**
 * Avatar Component
 * 
 * Purpose:
 * Circular profile avatar component that renders the user image or generates fallback initials.
 * 
 * Future Backend Integration:
 * Renders user profile photo URL from GET /api/profile or Auth Context.
 */

import React, { useState } from 'react';
import { cn } from '../utils/cn';

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl font-bold',
};

export function Avatar({ name = 'Student', src, size = 'md', className }) {
  const [imgError, setImgError] = useState(false);

  const getInitials = (str) => {
    if (!str) return 'S';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const showImage = src && !imgError;

  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center overflow-hidden shrink-0 select-none bg-brand-100 text-brand-700 font-semibold border border-brand-200 shadow-subtle',
        sizeMap[size] || sizeMap.md,
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

export default Avatar;
