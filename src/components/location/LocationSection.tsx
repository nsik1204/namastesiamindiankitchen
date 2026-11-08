import React, { useState, useMemo } from 'react';
import { RestaurantInfo } from '../../types';
import {
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  Navigation,
  Copy,
  Check,
  Star,
  ExternalLink,
  Utensils
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface LocationSectionProps {
  info: RestaurantInfo;
}

export default function LocationSection({ info }: LocationSectionProps) {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);

  // Calculate live Thailand operating status (ICT / UTC+7)
  const isCurrentlyOpen = useMemo(() => {
    try {
      const now = new Date();
      // Thailand is UTC+7
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const bkkTime = new Date(utc + 3600000 * 7);
      const hours = bkkTime.getHours();
      return hours >= 11 && hours < 23;
    } catch {
      return true; // fallback
    }
  }, []);

  const address = info.address || '456 Flavor Street, Bangkok 10110, Thailand';
  const phone = info.phone || '+66-2-123-4567';
  const waNumber = (info.whatsappNumber || '+66829560609').replace(/[^0-9]/g, '');

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    'Namaste Siam Indian Kitchen ' + address
  )}`;

  const handleCopyAddress = () => {
    try {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    'Namaste Siam Indian Kitchen ' + address
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <section id="info" className="max-w-[1180px] mx-auto px-5 pt-14">
      {/* Section Title */}
      <div className="mb-6">
        <h2 className="text-[clamp(24px,3.5vw,32px)] font-extrabold text-[#2B1A0E] font-display m-0">
          {t('findUsLead')} <span className="text-[#A90E02]">{t('findUsAccent')}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Card: Verified Details, Actions & Hours (7 Cols) */}
        <div className="lg:col-span-7 bg-[#FFFDF9] border border-[rgba(122,74,34,0.18)] rounded-3xl p-6 md:p-8 shadow-[0_14px_40px_rgba(61,31,0,0.07)] flex flex-col justify-between space-y-6">
          
          {/* Header Status & Social Proof */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[rgba(122,74,34,0.12)]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isCurrentlyOpen ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    isCurrentlyOpen ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                ></span>
              </span>
              <span
                className={`text-xs font-bold tracking-wide uppercase ${
                  isCurrentlyOpen ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                {isCurrentlyOpen ? t('openNow') : t('closedNow')} • {t('operatingHoursToday')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#FDF8F1] px-3 py-1 rounded-full border border-[rgba(122,74,34,0.15)] text-[#9A580C] text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-[#9A580C] text-[#9A580C]" />
              <span>{t('socialProofRating')}</span>
            </div>
          </div>

          {/* Location & Address Box */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[rgba(169,14,2,0.08)] text-[#A90E02] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#2B1A0E] tracking-tight m-0">
                    {t('addressTitle')}
                  </h3>
                  <p className="text-xs md:text-sm text-[#6B533E] font-medium leading-relaxed mt-1">
                    {address}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyAddress}
                className="shrink-0 text-xs font-bold text-[#9A580C] hover:text-[#A90E02] bg-[#FDF8F1] hover:bg-white border border-[rgba(122,74,34,0.18)] px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1"
                title={t('copyAddress')}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? t('addressCopied') : t('copyAddress')}</span>
              </button>
            </div>
          </div>

          {/* Quick Contact & Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#A90E02] hover:bg-[#8A0B02] text-[#FFFDF9] font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Navigation className="w-4 h-4" />
              <span>{t('getDirections')}</span>
            </a>

            <a
              href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
              className="bg-[#FDF8F1] hover:bg-white border border-[rgba(122,74,34,0.2)] text-[#2B1A0E] font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4 text-[#A90E02]" />
              <span>{t('callUs')}</span>
            </a>

            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-emerald-800 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-[#25D366]" />
              <span>{t('chatWhatsApp')}</span>
            </a>
          </div>

          {/* Schedule & Atmosphere Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[rgba(122,74,34,0.1)] text-xs text-[#6B533E]">
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-[#9A580C] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-[#2B1A0E] mb-0.5">{t('hoursTitle')}</strong>
                <span>{info.openingHours || t('hoursDaily')}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Utensils className="w-4 h-4 text-[#9A580C] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-[#2B1A0E] mb-0.5">{t('diningStyleTitle')}</strong>
                <span>{info.diningStyle || 'Premium Casual • Family Friendly • Authentic Taste'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Card: Responsive Google Maps Interactive Embed (5 Cols) */}
        <div className="lg:col-span-5 bg-[#FFFDF9] border border-[rgba(122,74,34,0.18)] rounded-3xl p-3 shadow-[0_14px_40px_rgba(61,31,0,0.07)] flex flex-col min-h-[340px] md:min-h-[400px] relative overflow-hidden">
          <div className="w-full h-full rounded-2xl overflow-hidden relative border border-[rgba(122,74,34,0.12)] flex-1">
            <iframe
              title={t('interactiveMapTitle')}
              src={mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '340px' }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>

            {/* Quick Map Link Pill */}
            <div className="absolute top-3 right-3 bg-[#FFFDF9]/95 backdrop-blur-xs border border-[rgba(122,74,34,0.2)] rounded-full px-3 py-1 shadow-md">
              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-[#A90E02] flex items-center gap-1 hover:underline"
              >
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
