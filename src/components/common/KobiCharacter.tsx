import React from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { audioService } from '../../utils/audio';

interface KobiCharacterProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mood?: 'happy' | 'thinking' | 'celebrating' | 'helping' | 'waving';
  showSpeech?: boolean;
  speechText?: string;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export const KobiCharacter: React.FC<KobiCharacterProps> = ({
  size = 'md',
  mood = 'happy',
  showSpeech = false,
  speechText,
  className = '',
  onClick,
  interactive = true
}) => {
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-36 h-36',
    xl: 'w-48 h-48 md:w-60 md:h-60'
  };

  const handleKobiClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (interactive) {
      audioService.playSnapSound();
      const friendlyPhrases = [
        'Bip bop! Semangat belajar koding hari ini!',
        'Kamu hebat! Mari pecahkan tantangan berikutnya bersama Kobi!',
        'Ingat, kesalahan dalam koding adalah petunjuk untuk menemukan solusi terbaik!',
        'Kobi siap membantumu kapan saja!'
      ];
      const randomPhrase = speechText || friendlyPhrases[Math.floor(Math.random() * friendlyPhrases.length)];
      setIsSpeaking(true);
      audioService.speakText(randomPhrase, () => setIsSpeaking(false));
    }
  };

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Optional Speech Bubble */}
      {showSpeech && speechText && (
        <div className="relative mb-3 max-w-xs bg-white text-[#191b23] p-4 rounded-2xl shadow-lg border-2 border-[#adc6ff] transition-all animate-bounce-slow">
          <p className="text-sm font-bold text-center text-[#0058be] leading-relaxed">
            {speechText}
          </p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-[#adc6ff] rotate-45"></div>
        </div>
      )}

      {/* Kobi Mascot Container */}
      <div
        onClick={handleKobiClick}
        className={`relative ${sizeClasses[size]} cursor-pointer group transition-transform duration-300 hover:scale-105 active:scale-95`}
      >
        {/* Glow effect on hover/speech */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#0058be]/20 to-[#6ffbbe]/30 blur-xl group-hover:opacity-100 opacity-60 transition-opacity pointer-events-none" />

        {/* Kobi Visual Render */}
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuASL8Ya0tlN_GgiFTxe2RRjreq-bv2wfXC7kzX9yZowq26f9ApzXA95zmQ3bW5tZ1Mp5DA4vaalM95WTva7n4Ek-M8nMgTkR_5sBlzPbtqa7_85P0W0m6us3InEwkrUyDIAE2RXz3qOcSyVA_FCAq2vkR7kSy4KyV6ghDUA2K2OFLplvRftzjLpQBVWSK9BYAY72xeWJqtyC_xOXpR2TUzAXlhT4qaE9sRL4OgQXT2XAWIimvBUoiXl"
          alt="Robot Kobi"
          className={`w-full h-full object-contain drop-shadow-xl ${
            mood === 'celebrating' ? 'animate-bounce' : mood === 'waving' ? 'animate-pulse' : 'animate-float'
          }`}
        />

        {/* Speaking indicator / Audio trigger badge */}
        {interactive && (
          <button
            title="Dengarkan Kobi Berbicara"
            className="absolute -bottom-1 -right-1 bg-white hover:bg-[#d8e2ff] text-[#0058be] p-1.5 rounded-full shadow-md border-2 border-[#adc6ff] transition-all hover:scale-110 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              handleKobiClick();
            }}
          >
            {isSpeaking ? (
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
