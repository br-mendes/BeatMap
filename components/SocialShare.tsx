import React, { useState } from 'react';
import { Twitter, Share2, Copy, Check, ExternalLink, Instagram } from 'lucide-react';

interface SocialShareProps {
  spotifyUrl?: string | null;
  shareTitle: string;
  shareText: string;
  size?: 'sm' | 'md' | 'lg';
  showSpotify?: boolean;
}

export const SocialShare: React.FC<SocialShareProps> = ({ 
  spotifyUrl, 
  shareTitle, 
  shareText, 
  size = 'md',
  showSpotify = true
}) => {
  const [copied, setCopied] = useState(false);

  // Construct URLs
  const appUrl = window.location.origin;
  const targetUrl = spotifyUrl || appUrl;
  
  // Twitter Intent
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(targetUrl)}&hashtags=BeatMap,NewMusic,Spotify`;

  // Safe check for navigator.share support
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleNativeShare = async () => {
    if (canShare) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: targetUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareText} ${targetUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btnClass = size === 'sm' ? 'p-2' : size === 'lg' ? 'px-6 py-3' : 'px-4 py-2';
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      
      {/* 1. Priority: Direct Spotify Link */}
      {showSpotify && spotifyUrl && (
        <a 
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-full 
            flex items-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-green-900/20
            ${btnClass} ${textSize}
          `}
          aria-label="Abrir no Spotify"
        >
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span className={size === 'sm' ? 'sr-only md:not-sr-only' : ''}>Ouvir</span>
        </a>
      )}

      {/* 2. Twitter / X */}
      <a 
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`
          bg-black hover:bg-gray-900 text-white rounded-full border border-gray-800
          flex items-center gap-2 transition-colors
          ${btnClass} ${textSize}
        `}
        aria-label="Compartilhar no X (Twitter)"
      >
        <Twitter size={iconSize} fill="currentColor" />
        <span className={size === 'sm' ? 'hidden' : 'hidden md:inline'}>Postar</span>
      </a>

      {/* 3. Native Share / Instagram Stories (Mobile) */}
      <button 
        onClick={handleNativeShare}
        className={`
          bg-gradient-to-tr from-yellow-500 via-purple-500 to-blue-500 text-white rounded-full
          flex items-center gap-2 hover:opacity-90 transition-opacity
          ${btnClass} ${textSize}
        `}
        aria-label="Compartilhar no Instagram Stories ou Outros"
      >
        {canShare ? <Instagram size={iconSize} /> : <Share2 size={iconSize} />}
        <span className={size === 'sm' ? 'hidden' : 'hidden md:inline'}>
            {canShare ? 'Stories' : 'Compartilhar'}
        </span>
      </button>

      {/* 4. Copy Link Fallback */}
      {!canShare && (
        <button 
            onClick={handleCopy}
            className={`
                bg-beatmap-card hover:bg-beatmap-border/20 text-beatmap-muted hover:text-beatmap-text 
                rounded-full border border-beatmap-border/10 transition-colors
                ${btnClass} ${textSize}
            `}
            aria-label="Copiar Link"
            title="Copiar Link"
        >
            {copied ? <Check size={iconSize} className="text-green-500" /> : <Copy size={iconSize} />}
        </button>
      )}

    </div>
  );
};