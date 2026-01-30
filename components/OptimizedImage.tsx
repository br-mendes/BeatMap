 'use client'

import React, { useState } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ src, alt, className = '', ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-beatmap-card/50 ${className}`}>
      {!isLoaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-beatmap-border/5" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-beatmap-card text-beatmap-muted text-xs">
          N/A
        </div>
      )}
    </div>
  );
};
