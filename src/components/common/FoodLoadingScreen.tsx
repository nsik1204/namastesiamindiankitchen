import React, { useState, useEffect } from 'react';

const CULINARY_MESSAGES = [
  'Simmering rich curries & aromatic spices…',
  'Tossing fresh Thai herbs & lemongrass…',
  'Crisping golden samosas & butter naans…',
  'Crafting chef signatures fresh for you…',
];

export default function FoodLoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [stickerIndex, setStickerIndex] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % CULINARY_MESSAGES.length);
    }, 1800);

    const stickerInterval = setInterval(() => {
      setStickerIndex((prev) => (prev + 1) % 4);
    }, 1400);

    return () => {
      clearInterval(msgInterval);
      clearInterval(stickerInterval);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8EEDB] overflow-hidden select-none"
    >
      {/* Background Soft Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] rounded-full bg-gradient-to-tr from-[#D9B66D]/20 via-[#173D32]/10 to-transparent blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm w-full">
        
        {/* STICKER CONTAINER */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center mb-6">
          
          {/* Steam wisps rising */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none">
            <span className="w-1.5 h-6 rounded-full bg-[#D9B66D]/70 blur-[1px] animate-[steamRise_1.6s_ease-out_infinite]" />
            <span className="w-1.5 h-8 rounded-full bg-[#173D32]/40 blur-[1px] animate-[steamRise_1.8s_ease-out_infinite_0.4s]" />
            <span className="w-1.5 h-5 rounded-full bg-[#D9B66D]/70 blur-[1px] animate-[steamRise_1.5s_ease-out_infinite_0.8s]" />
          </div>

          {/* Little Floating Spice Sparkles */}
          <div className="absolute -top-2 right-4 text-lg animate-bounce" style={{ animationDuration: '2s' }}>
            ✨
          </div>
          <div className="absolute bottom-4 left-3 text-base animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
            🌿
          </div>
          <div className="absolute top-10 left-2 text-base animate-bounce" style={{ animationDuration: '2.2s', animationDelay: '0.8s' }}>
            🌶️
          </div>

          {/* CENTRAL STICKER BADGE WITH DIE-CUT EFFECT */}
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#FFF9EF] border-[5px] border-[#FFF9EF] shadow-[0_16px_36px_rgba(23,61,50,0.18),0_0_0_4px_#E4D7BF] flex items-center justify-center relative p-3 transition-transform duration-300 hover:rotate-2">
            
            {/* INNER DISH ILLUSTRATION (STICKER STYLE) */}
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#F8EEDB] to-[#FFF9EF] border-2 border-dashed border-[#D9B66D]/60 flex items-center justify-center relative overflow-hidden shadow-inner">
              
              {/* STICKER 1: Steaming Indian Curry Pot / Handi */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 transform ${
                  stickerIndex === 0 ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-12 pointer-events-none'
                }`}
              >
                <svg viewBox="0 0 120 120" className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-md">
                  {/* Pot Body */}
                  <ellipse cx="60" cy="50" rx="42" ry="12" fill="#B58C45" stroke="#FFF9EF" strokeWidth="3" />
                  <path d="M 20 50 Q 18 90 60 92 Q 102 90 100 50 Z" fill="#173D32" stroke="#FFF9EF" strokeWidth="4" />
                  {/* Pot Rim Highlight */}
                  <ellipse cx="60" cy="50" rx="38" ry="10" fill="#D9B66D" />
                  {/* Curry Gravy */}
                  <ellipse cx="60" cy="52" rx="34" ry="8" fill="#9B4935" />
                  {/* Cilantro garnish */}
                  <circle cx="58" cy="52" r="3" fill="#386B4D" stroke="#FFF9EF" strokeWidth="1" />
                  <circle cx="63" cy="51" r="2.5" fill="#386B4D" stroke="#FFF9EF" strokeWidth="1" />
                  {/* Handles */}
                  <path d="M 17 56 Q 8 62 17 68" fill="none" stroke="#B58C45" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 103 56 Q 112 62 103 68" fill="none" stroke="#B58C45" strokeWidth="4" strokeLinecap="round" />
                  {/* Sticker glossy highlight */}
                  <path d="M 30 64 Q 40 82 60 84" fill="none" stroke="rgba(255,249,239,0.35)" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>

              {/* STICKER 2: Crispy Golden Samosa */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 transform ${
                  stickerIndex === 1 ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 -rotate-12 pointer-events-none'
                }`}
              >
                <svg viewBox="0 0 120 120" className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-md">
                  {/* Samosa Golden Crust */}
                  <path
                    d="M 60 22 Q 62 20 65 24 L 98 84 Q 100 88 94 90 L 26 90 Q 20 88 22 84 Z"
                    fill="#D9B66D"
                    stroke="#FFF9EF"
                    strokeWidth="4"
                    strokeLinejoin="round"
                  />
                  {/* Crispy Fold Crease */}
                  <path d="M 60 24 L 62 90" stroke="#B58C45" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 60 24 L 38 88" stroke="#B58C45" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 60 24 L 84 88" stroke="#B58C45" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Little spice speckles */}
                  <circle cx="48" cy="62" r="1.5" fill="#30251E" />
                  <circle cx="72" cy="70" r="1.5" fill="#30251E" />
                  <circle cx="54" cy="78" r="1.5" fill="#30251E" />
                  {/* Mint Chutney Drop */}
                  <ellipse cx="88" cy="85" rx="7" ry="5" fill="#386B4D" stroke="#FFF9EF" strokeWidth="2" />
                </svg>
              </div>

              {/* STICKER 3: Thai Tom Yum & Noodle Bowl */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 transform ${
                  stickerIndex === 2 ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-12 pointer-events-none'
                }`}
              >
                <svg viewBox="0 0 120 120" className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-md">
                  {/* Bowl */}
                  <ellipse cx="60" cy="46" rx="42" ry="12" fill="#FFF9EF" stroke="#173D32" strokeWidth="2" />
                  <path d="M 18 46 Q 22 92 60 92 Q 98 92 102 46 Z" fill="#285747" stroke="#FFF9EF" strokeWidth="4" />
                  {/* Base Ring */}
                  <ellipse cx="60" cy="92" rx="20" ry="4" fill="#102C25" stroke="#FFF9EF" strokeWidth="2" />
                  {/* Aromatic Soup */}
                  <ellipse cx="60" cy="48" rx="36" ry="9" fill="#9B4935" />
                  {/* Thai Lime Wedge */}
                  <path d="M 40 44 Q 50 38 52 48 Z" fill="#386B4D" stroke="#FFF9EF" strokeWidth="1.5" />
                  {/* Red Chili Ring */}
                  <circle cx="72" cy="48" r="5" fill="#A33C32" stroke="#FFF9EF" strokeWidth="1.5" />
                  <circle cx="72" cy="48" r="2" fill="#9B4935" />
                  {/* Lemongrass Stick */}
                  <line x1="48" y1="32" x2="70" y2="52" stroke="#D9B66D" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>

              {/* STICKER 4: Tandoori Skewer & Fresh Naan */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 transform ${
                  stickerIndex === 3 ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 -rotate-12 pointer-events-none'
                }`}
              >
                <svg viewBox="0 0 120 120" className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-md">
                  {/* Warm Butter Naan */}
                  <ellipse cx="60" cy="62" rx="38" ry="26" fill="#F8EEDB" stroke="#FFF9EF" strokeWidth="3.5" transform="rotate(-8 60 62)" />
                  {/* Golden Butter Glow */}
                  <ellipse cx="58" cy="60" rx="30" ry="18" fill="#D9B66D" opacity="0.65" transform="rotate(-8 58 60)" />
                  {/* Char marks (Tandoor blisters) */}
                  <ellipse cx="44" cy="54" rx="4" ry="2.5" fill="#30251E" opacity="0.75" />
                  <ellipse cx="68" cy="52" rx="5" ry="3" fill="#30251E" opacity="0.75" />
                  <ellipse cx="56" cy="68" rx="6" ry="3" fill="#30251E" opacity="0.75" />
                  <ellipse cx="76" cy="65" rx="3.5" ry="2" fill="#30251E" opacity="0.75" />
                  {/* Coriander Sprinkles */}
                  <circle cx="48" cy="62" r="1.5" fill="#386B4D" />
                  <circle cx="62" cy="56" r="1.5" fill="#386B4D" />
                  <circle cx="70" cy="60" r="1.5" fill="#386B4D" />
                </svg>
              </div>

            </div>

            {/* CUTE STICKER CORNER PEEL / BADGE ACCENT */}
            <div className="absolute -bottom-2 -right-1 bg-[#173D32] text-[#FFF9EF] border-2 border-[#FFF9EF] shadow-md rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase">
              Fresh 100%
            </div>
          </div>
        </div>

        {/* BRAND TITLE */}
        <h1 className="font-display font-extrabold text-[#173D32] text-xl sm:text-2xl tracking-tight leading-snug">
          Namaste Siam
        </h1>
        <p className="font-body text-[#B58C45] font-bold text-xs uppercase tracking-widest mt-0.5">
          Indian & Thai Kitchen
        </p>

        {/* ANIMATED CULINARY STATUS */}
        <div className="h-6 mt-3 flex items-center justify-center">
          <p
            key={msgIndex}
            className="font-body text-xs sm:text-sm text-[#75685A] font-medium animate-[fadeInUp_0.4s_ease-out]"
          >
            {CULINARY_MESSAGES[msgIndex]}
          </p>
        </div>

        {/* DELICATE PROGRESS BAR */}
        <div className="w-36 sm:w-44 h-1.5 bg-[#E4D7BF] rounded-full overflow-hidden mt-4 shadow-inner">
          <div className="w-full h-full bg-gradient-to-r from-[#D9B66D] via-[#173D32] to-[#D9B66D] rounded-full animate-[progressPulse_1.4s_ease-in-out_infinite]" />
        </div>

      </div>

      {/* INLINE CSS FOR KEYFRAMES */}
      <style>{`
        @keyframes steamRise {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }
          40% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-28px) scale(1.3);
            opacity: 0;
          }
        }
        @keyframes fadeInUp {
          0% {
            transform: translateY(4px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes progressPulse {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

