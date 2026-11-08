import React, { useState } from 'react';
import { RestaurantInfo } from '../../types';
import { Calendar, Clock, Users, X, Send, MessageSquare, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantInfo: RestaurantInfo;
}

export default function ReservationModal({ isOpen, onClose, restaurantInfo }: ReservationModalProps) {
  const { language, t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('19:00');
  const [guests, setGuests] = useState('2');
  const [seatingArea, setSeatingArea] = useState<'indoor' | 'outdoor' | 'any'>('any');
  const [specialRequest, setSpecialRequest] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (platform: 'whatsapp' | 'line') => {
    setValidationError(null);

    // 1. Name validation
    if (!name.trim()) {
      const err = t('valNameRequired');
      setValidationError(err);
      return;
    }

    // 2. Phone validation
    if (!phone.trim()) {
      const err = t('valPhoneRequired');
      setValidationError(err);
      return;
    }

    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length < 8) {
      const err = t('valPhoneInvalid');
      setValidationError(err);
      return;
    }

    // 3. Past date validation
    try {
      const selected = new Date(date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        const err = t('valDatePast');
        setValidationError(err);
        return;
      }
    } catch {
      // ignore
    }

    // Generate bilingual reservation message
    let message = '';
    if (language === 'th') {
      const seatingAreaTH =
        seatingArea === 'indoor'
          ? 'ห้องแอร์ (ในร้าน)'
          : seatingArea === 'outdoor'
          ? 'ระเบียงด้านนอก'
          : 'ที่นั่งว่างใดก็ได้';

      message = `*คำขอจองโต๊ะอาหาร — ${restaurantInfo.name || 'Namaste Siam'}* 🍷
---------------------------------
👤 *ชื่อผู้จอง:* ${name.trim()}
📞 *เบอร์โทร/WhatsApp:* ${phone.trim()}
📅 *วันที่:* ${date}
⏰ *เวลา:* ${time}
👥 *จำนวนแขก:* ${guests} ท่าน
🪑 *โซนที่นั่ง:* ${seatingAreaTH}
${specialRequest.trim() ? `📝 *ข้อกำหนดพิเศษ:* ${specialRequest.trim()}\n` : ''}---------------------------------
_ส่งผ่านระบบเมนูดิจิทัล Namaste Siam_`;
    } else {
      const seatingAreaEN =
        seatingArea === 'indoor'
          ? 'Indoor Air-conditioned'
          : seatingArea === 'outdoor'
          ? 'Outdoor Terrace'
          : 'Any Available';

      message = `*Table Reservation Request — ${restaurantInfo.name || 'Namaste Siam'}* 🍷
---------------------------------
👤 *Guest Name:* ${name.trim()}
📞 *Phone/WhatsApp:* ${phone.trim()}
📅 *Date:* ${date}
⏰ *Time:* ${time}
👥 *Number of Guests:* ${guests} People
🪑 *Seating Preference:* ${seatingAreaEN}
${specialRequest.trim() ? `📝 *Special Request:* ${specialRequest.trim()}\n` : ''}---------------------------------
_Sent via Namaste Siam Digital Menu_`;
    }

    if (platform === 'whatsapp') {
      const rawNumber = restaurantInfo.whatsappNumber || '+66829560609';
      const waNumber = rawNumber.replace(/[^0-9]/g, '');
      const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const lineId = restaurantInfo.lineId || 'namastesiam';
      const url = `https://line.me/R/ti/p/~${lineId}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('resModalTitle')}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-[#102C25]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-[#FFF9EF] border border-[#E4D7BF] rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-[0_25px_60px_rgba(16,44,37,0.35)] p-6 md:p-8 space-y-5 text-[#30251E] font-body relative">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-[#B58C45] uppercase tracking-wider block">
              {t('resModalSubtitle')}
            </span>
            <h2 className="text-2xl font-extrabold text-[#173D32] tracking-tight font-display mt-0.5">
              {t('resModalTitle')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F8EEDB] border border-[#E4D7BF] flex items-center justify-center text-[#75685A] hover:text-[#173D32] transition-colors"
            aria-label={t('close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Validation Error Alert Box */}
        {validationError && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-[#FDF2F0] border border-[#A33C32]/30 text-[#A33C32] text-xs font-semibold flex items-center gap-2 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-[#A33C32] shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Reservation Form */}
        <div className="space-y-4 text-xs font-semibold">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1">
                {t('fullNameLabel')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder={t('fullNamePlaceholder')}
                className="w-full bg-white border border-[#E4D7BF] rounded-xl p-2.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1">
                {t('phoneLabel')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder={t('phonePlaceholder')}
                className="w-full bg-white border border-[#E4D7BF] rounded-xl p-2.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#173D32]" /> {t('dateLabel')}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                className="w-full bg-white border border-[#E4D7BF] rounded-xl p-2 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#173D32]" /> {t('timeLabel')}
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-white border border-[#E4D7BF] rounded-xl p-2 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32]"
              >
                <option value="12:00">12:00 PM</option>
                <option value="12:30">12:30 PM</option>
                <option value="13:00">1:00 PM</option>
                <option value="13:30">1:30 PM</option>
                <option value="18:00">6:00 PM</option>
                <option value="18:30">6:30 PM</option>
                <option value="19:00">7:00 PM</option>
                <option value="19:30">7:30 PM</option>
                <option value="20:00">8:00 PM</option>
                <option value="20:30">8:30 PM</option>
                <option value="21:00">9:00 PM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#173D32]" /> {t('guestsLabel')}
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="w-full bg-white border border-[#E4D7BF] rounded-xl p-2 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32]"
              >
                <option value="1">{language === 'th' ? '1 ท่าน' : '1 Person'}</option>
                <option value="2">{language === 'th' ? '2 ท่าน' : '2 People'}</option>
                <option value="3">{language === 'th' ? '3 ท่าน' : '3 People'}</option>
                <option value="4">{language === 'th' ? '4 ท่าน' : '4 People'}</option>
                <option value="5">{language === 'th' ? '5 ท่าน' : '5 People'}</option>
                <option value="6">{language === 'th' ? '6 ท่าน' : '6 People'}</option>
                <option value="7">{language === 'th' ? '7 ท่าน' : '7 People'}</option>
                <option value="8">{language === 'th' ? '8 ท่าน' : '8 People'}</option>
                <option value="10+">{language === 'th' ? '10+ ท่าน (กลุ่มใหญ่)' : '10+ Group'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1.5">
              {t('seatingLabel')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'any', label: t('seatAny') },
                { id: 'indoor', label: t('seatIndoor') },
                { id: 'outdoor', label: t('seatOutdoor') },
              ].map((seat) => (
                <button
                  key={seat.id}
                  type="button"
                  onClick={() => setSeatingArea(seat.id as any)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    seatingArea === seat.id
                      ? 'bg-[#173D32]/10 border-[#173D32] text-[#173D32] ring-1 ring-[#173D32]'
                      : 'bg-white border-[#E4D7BF] text-[#75685A] hover:bg-[#F8EEDB]'
                  }`}
                >
                  {seat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1">
              {t('specialNotesLabel')}
            </label>
            <textarea
              value={specialRequest}
              onChange={(e) => setSpecialRequest(e.target.value)}
              placeholder={t('specialNotesPlaceholder')}
              rows={2}
              className="w-full bg-white border border-[#E4D7BF] rounded-xl p-2.5 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32]"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-[#E4D7BF]">
          <span className="block text-[11px] text-center text-[#75685A]">
            {t('resConfirmNote')}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSubmit('whatsapp')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              {t('bookWhatsApp')}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('line')}
              className="flex-1 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Send className="w-4 h-4" />
              {t('bookLine')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
