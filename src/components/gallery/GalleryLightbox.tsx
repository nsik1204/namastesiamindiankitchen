import React, { useEffect } from 'react';
import { GalleryItem } from '../../types';
import { X, ChevronLeft, ChevronRight, Instagram, ZoomIn } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface GalleryLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  items: GalleryItem[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  instagramHandle?: string;
}

export default function GalleryLightbox({
  isOpen,
  onClose,
  items,
  currentIndex,
  onNavigate,
  instagramHandle = 'namastesiam'
}: GalleryLightboxProps) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        onNavigate((currentIndex - 1 + items.length) % items.length);
      } else if (e.key === 'ArrowRight') {
        onNavigate((currentIndex + 1) % items.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, items.length, onNavigate, onClose]);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex];
  if (!currentItem) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate((currentIndex - 1 + items.length) % items.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate((currentIndex + 1) % items.length);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo Lightbox"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#102C25]/95 backdrop-blur-md flex flex-col items-center justify-between p-4 md:p-6 animate-in fade-in duration-200 select-none"
    >
      {/* Top Header Controls */}
      <div
        className="w-full max-w-5xl flex items-center justify-between text-[#FFF9EF] z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs md:text-sm font-bold tracking-wider bg-[#D9B66D]/20 text-[#D9B66D] px-3 py-1.5 rounded-full border border-[#D9B66D]/40">
            {t('photoOf')} {currentIndex + 1} {t('of')} {items.length}
          </span>
          <span className="text-xs md:text-sm font-semibold opacity-80 hidden sm:inline">
            {currentItem.title || currentItem.alt || 'Namaste Siam Restaurant Ambience'}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all hover:scale-105"
          aria-label={t('close')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Stage with Next/Prev Arrows */}
      <div
        className="relative w-full max-w-5xl flex-1 flex items-center justify-center my-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Previous Button */}
        {items.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 md:-left-4 z-20 w-11 h-11 md:w-13 md:h-13 rounded-full bg-[#102C25]/80 hover:bg-[#173D32] text-[#FFF9EF] flex items-center justify-center transition-all shadow-xl hover:scale-110 border border-[#D9B66D]/30 hover:border-[#D9B66D]"
            aria-label={t('prevPhoto')}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* The Image */}
        <div className="relative max-h-[76vh] max-w-full flex items-center justify-center">
          <img
            src={currentItem.image}
            alt={currentItem.alt || currentItem.title || 'Restaurant photograph'}
            className="max-h-[76vh] max-w-full object-contain rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/15 animate-in zoom-in-95 duration-200"
          />
        </div>

        {/* Next Button */}
        {items.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 md:-right-4 z-20 w-11 h-11 md:w-13 md:h-13 rounded-full bg-[#102C25]/80 hover:bg-[#173D32] text-[#FFF9EF] flex items-center justify-center transition-all shadow-xl hover:scale-110 border border-[#D9B66D]/30 hover:border-[#D9B66D]"
            aria-label={t('nextPhoto')}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Footer Caption & Instagram deep-link */}
      <div
        className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 text-white/90 z-10 pt-2 border-t border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs md:text-sm font-medium text-center sm:text-left">
          {currentItem.title || currentItem.alt || 'Namaste Siam Indian Kitchen — Authentic Dining & Tandoor Ambience'}
        </p>

        {instagramHandle && (
          <a
            href={`https://instagram.com/${instagramHandle.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#D9B66D] hover:text-[#FFF9EF] bg-white/5 hover:bg-white/15 px-3 py-1.5 rounded-full border border-[#D9B66D]/35 transition-all shrink-0"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>{t('viewInstagram')}</span>
          </a>
        )}
      </div>
    </div>
  );
}

