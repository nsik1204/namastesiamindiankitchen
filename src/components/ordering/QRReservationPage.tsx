import React, { useState, useEffect } from 'react';
import { RestaurantInfo } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Calendar, Clock, Users, Send, MessageSquare, AlertCircle, 
  CheckCircle2, ArrowLeft, Phone, Utensils, QrCode, Sparkles, MapPin, PauseCircle
} from 'lucide-react';

interface QRReservationPageProps {
  restaurantInfo: RestaurantInfo;
  onNavigateHome?: () => void;
}

export default function QRReservationPage({ restaurantInfo, onNavigateHome }: QRReservationPageProps) {
  const { language, setLanguage, t } = useLanguage();

  // Read URL search params
  const [tableParam, setTableParam] = useState<string>('');
  const [sourceParam, setSourceParam] = useState<string>('');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tbl = params.get('table') || '';
      const src = params.get('source') || '';
      setTableParam(tbl);
      setSourceParam(src);
    } catch {
      // fallback
    }
  }, []);

  const isQREnabled = restaurantInfo.qrTableBookingEnabled !== false;

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('19:00');
  const [guests, setGuests] = useState('2');
  const [tableNumber, setTableNumber] = useState('');
  const [seatingArea, setSeatingArea] = useState<'indoor' | 'outdoor' | 'any'>('any');
  const [specialRequest, setSpecialRequest] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedChannel, setSubmittedChannel] = useState<'whatsapp' | 'line'>('whatsapp');

  // Pre-fill table number when detected
  useEffect(() => {
    if (tableParam) {
      setTableNumber(tableParam);
    }
  }, [tableParam]);

  const handleReturnHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleSubmit = (platform: 'whatsapp' | 'line') => {
    if (!isQREnabled) {
      setValidationError(t('qrBookingUnavailableMsg'));
      return;
    }

    setValidationError(null);

    // 1. Name validation
    if (!name.trim()) {
      setValidationError(t('valNameRequired'));
      return;
    }

    // 2. Phone validation
    if (!phone.trim()) {
      setValidationError(t('valPhoneRequired'));
      return;
    }

    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length < 8) {
      setValidationError(t('valPhoneInvalid'));
      return;
    }

    // 3. Past date validation
    try {
      const selected = new Date(date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        setValidationError(t('valDatePast'));
        return;
      }
    } catch {
      // ignore
    }

    // Compose formatted reservation request
    const tableId = (tableNumber.trim() || tableParam || '').trim();
    const tableLine = tableId ? `\n📍 *${language === 'th' ? 'หมายเลขโต๊ะ' : 'Table Identifier'}:* Table ${tableId}` : '';
    const sourceLine = sourceParam ? `\n🏷️ *Source:* QR Scan (${sourceParam})` : '\n🏷️ *Source:* Table QR Code';

    let message = '';
    if (language === 'th') {
      const seatingAreaTH =
        seatingArea === 'indoor'
          ? 'ห้องแอร์ (ในร้าน)'
          : seatingArea === 'outdoor'
          ? 'ระเบียงด้านนอก'
          : 'ที่นั่งว่างใดก็ได้';

      message = `*คำขอจองโต๊ะอาหาร (QR Table Reservation) — ${restaurantInfo.name || 'Namaste Siam'}* 🍷${tableLine}${sourceLine}
---------------------------------
👤 *ชื่อผู้จอง:* ${name.trim()}
📞 *เบอร์โทร/WhatsApp:* ${phone.trim()}
📅 *วันที่:* ${date}
⏰ *เวลา:* ${time}
👥 *จำนวนแขก:* ${guests} ท่าน
🪑 *โซนที่นั่ง:* ${seatingAreaTH}
${specialRequest.trim() ? `📝 *ข้อกำหนดพิเศษ:* ${specialRequest.trim()}\n` : ''}---------------------------------
_คำขอจองส่งผ่านคิวอาร์โค้ดโต๊ะอาหาร Namaste Siam_`;
    } else {
      const seatingAreaEN =
        seatingArea === 'indoor'
          ? 'Indoor Air-conditioned'
          : seatingArea === 'outdoor'
          ? 'Outdoor Terrace'
          : 'Any Available';

      message = `*Table Reservation Request (QR Table Booking) — ${restaurantInfo.name || 'Namaste Siam'}* 🍷${tableLine}${sourceLine}
---------------------------------
👤 *Guest Name:* ${name.trim()}
📞 *Phone/WhatsApp:* ${phone.trim()}
📅 *Date:* ${date}
⏰ *Time:* ${time}
👥 *Number of Guests:* ${guests} People
🪑 *Seating Preference:* ${seatingAreaEN}
${specialRequest.trim() ? `📝 *Special Request:* ${specialRequest.trim()}\n` : ''}---------------------------------
_Request submitted via Table QR Scan — Namaste Siam Indian Kitchen_`;
    }

    try {
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

      setSubmittedChannel(platform);
      setIsSubmitted(true);
    } catch (err: any) {
      setValidationError('Failed to launch messaging app. Please contact us directly.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9EF] text-[#30251E] font-body selection:bg-[#D9B66D]/30 flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#173D32] text-[#F8EEDB] border-b border-[#D9B66D]/30 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReturnHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D9B66D] hover:text-[#FFF9EF] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'th' ? 'กลับหน้าหลัก' : 'Back to Menu'}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm tracking-wide text-[#F8EEDB]">
              Namaste Siam
            </span>
            <span className="hidden sm:inline-block text-[10px] text-[#D9B66D] border border-[#D9B66D]/40 px-2 py-0.5 rounded-full font-medium">
              Indian Kitchen
            </span>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-[#102C25] border border-[#D9B66D]/30 rounded-full p-0.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-[#D9B66D] text-[#173D32] shadow-xs'
                  : 'text-[#F8EEDB]/70 hover:text-[#F8EEDB]'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('th')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                language === 'th'
                  ? 'bg-[#D9B66D] text-[#173D32] shadow-xs'
                  : 'text-[#F8EEDB]/70 hover:text-[#F8EEDB]'
              }`}
            >
              ไทย
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 py-8 md:py-12 w-full flex-1">
        {/* State 1: QR Booking is DISABLED by Admin */}
        {!isQREnabled ? (
          <div className="bg-[#FFFDF8] border-2 border-[#E4D7BF] rounded-3xl p-8 md:p-10 shadow-[0_20px_50px_rgba(23,61,50,0.08)] text-center space-y-6 animate-in fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FFF5E6] border border-[#D9B66D] flex items-center justify-center text-[#B58C45]">
              <PauseCircle className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#B58C45] uppercase tracking-widest block">
                {language === 'th' ? 'แจ้งเตือนสถานะ' : 'Service Notice'}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#173D32] font-display">
                {t('qrBookingUnavailableTitle')}
              </h1>
              <p className="text-sm text-[#75685A] max-w-md mx-auto leading-relaxed">
                {t('qrBookingUnavailableMsg')}
              </p>
            </div>

            {tableParam && (
              <div className="inline-flex items-center gap-2 bg-[#F8EEDB] border border-[#E4D7BF] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#173D32]">
                <MapPin className="w-3.5 h-3.5 text-[#B58C45]" />
                <span>Scanned from Table {tableParam}</span>
              </div>
            )}

            <div className="pt-4 border-t border-[#E4D7BF] flex flex-col sm:flex-row gap-3">
              <a
                href={`tel:${(restaurantInfo.phone || '+66829560609').replace(/[^0-9+]/g, '')}`}
                className="flex-1 bg-[#173D32] hover:bg-[#102C25] text-[#F8EEDB] font-bold py-3 px-5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <Phone className="w-4 h-4 text-[#D9B66D]" />
                {t('callUs')}
              </a>
              <a
                href={`https://wa.me/${(restaurantInfo.whatsappNumber || '+66829560609').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello Namaste Siam, I am at the restaurant and would like to reserve or order.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                {t('chatWhatsApp')}
              </a>
              <button
                type="button"
                onClick={handleReturnHome}
                className="flex-1 bg-[#FFF9EF] hover:bg-[#F8EEDB] border border-[#E4D7BF] text-[#173D32] font-bold py-3 px-5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Utensils className="w-4 h-4 text-[#B58C45]" />
                {language === 'th' ? 'ดูเมนูอาหาร' : 'View Menu'}
              </button>
            </div>
          </div>
        ) : isSubmitted ? (
          /* State 2: Request Submitted Successfully */
          <div className="bg-[#FFFDF8] border-2 border-[#D9B66D]/60 rounded-3xl p-8 md:p-10 shadow-[0_20px_50px_rgba(23,61,50,0.12)] text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#B58C45] uppercase tracking-widest block">
                {language === 'th' ? 'ส่งคำขอเรียบร้อยแล้ว' : 'Step 1 Completed'}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#173D32] font-display">
                {t('qrSubmitSuccessTitle')}
              </h1>
              <p className="text-sm font-medium text-[#30251E] max-w-md mx-auto leading-relaxed">
                {t('qrSubmitSuccessMsg')}
              </p>
            </div>

            {/* Submission Summary Card */}
            <div className="bg-[#F8EEDB]/60 border border-[#E4D7BF] rounded-2xl p-4 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between items-center pb-2 border-b border-[#E4D7BF]">
                <span className="text-[#75685A]">{language === 'th' ? 'ชื่อผู้จอง' : 'Guest Name'}:</span>
                <span className="font-bold text-[#173D32]">{name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#E4D7BF]">
                <span className="text-[#75685A]">{language === 'th' ? 'เบอร์ติดต่อ' : 'Phone'}:</span>
                <span className="font-bold text-[#173D32]">{phone}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#E4D7BF]">
                <span className="text-[#75685A]">{language === 'th' ? 'วันและเวลา' : 'Date & Time'}:</span>
                <span className="font-bold text-[#173D32]">{date} at {time}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#E4D7BF]">
                <span className="text-[#75685A]">{language === 'th' ? 'จำนวนแขก' : 'Party Size'}:</span>
                <span className="font-bold text-[#173D32]">{guests} {language === 'th' ? 'ท่าน' : 'Guests'}</span>
              </div>
              {tableNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-[#75685A]">{language === 'th' ? 'โต๊ะที่สแกน' : 'Table'}:</span>
                  <span className="font-bold text-[#B58C45] bg-[#173D32] text-[#F8EEDB] px-2 py-0.5 rounded-md">
                    Table {tableNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Mandatory Availability Notice */}
            <div className="p-3.5 rounded-xl bg-[#FFF5E6] border border-[#D9B66D]/40 text-left text-xs text-[#75685A] leading-relaxed flex items-start gap-2.5 max-w-md mx-auto">
              <Sparkles className="w-4 h-4 text-[#B58C45] shrink-0 mt-0.5" />
              <span>{t('qrNoticeStaffConfirm')}</span>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={handleReturnHome}
                className="flex-1 bg-[#173D32] hover:bg-[#102C25] text-[#F8EEDB] font-bold py-3 px-5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <Utensils className="w-4 h-4 text-[#D9B66D]" />
                {language === 'th' ? 'ดูเมนูอาหารทั้งหมด' : 'Browse Full Menu'}
              </button>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="bg-[#FFF9EF] hover:bg-[#F8EEDB] border border-[#E4D7BF] text-[#75685A] font-bold py-3 px-4 rounded-2xl text-xs transition-all cursor-pointer"
              >
                {language === 'th' ? 'แก้ไขข้อมูล' : 'Edit Details'}
              </button>
            </div>
          </div>
        ) : (
          /* State 3: Active Reservation Form */
          <div className="bg-[#FFFDF8] border-2 border-[#E4D7BF] rounded-3xl p-6 md:p-9 shadow-[0_25px_60px_rgba(23,61,50,0.09)] space-y-6">
            {/* Header Badge & Title */}
            <div className="border-b border-[#E4D7BF] pb-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-[#B58C45] uppercase tracking-widest flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-[#B58C45]" />
                  {t('qrBookingSubtitle')}
                </span>

                {tableNumber && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#173D32] text-[#D9B66D] px-3 py-1 rounded-full shadow-xs">
                    <MapPin className="w-3.5 h-3.5 text-[#D9B66D]" />
                    {language === 'th' ? `โต๊ะ ${tableNumber}` : `Table ${tableNumber}`}
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-[#173D32] font-display tracking-tight">
                {t('qrBookingTitle')}
              </h1>
              <p className="text-xs text-[#75685A] mt-1">
                {language === 'th'
                  ? 'กรอกข้อมูลด้านล่างเพื่อส่งคำขอจองโต๊ะ เจ้าหน้าที่จะตรวจสอบและติดต่อกลับโดยเร็ว'
                  : 'Enter your booking details below. Our restaurant team will verify table availability.'}
              </p>
            </div>

            {/* Validation Error Alert Box */}
            {validationError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-[#FDF2F0] border border-[#A33C32]/30 text-[#A33C32] text-xs font-semibold flex items-center gap-2.5 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 text-[#A33C32] shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
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
                    className="w-full bg-white border border-[#E4D7BF] rounded-xl p-3 text-xs text-[#30251E] font-medium focus:outline-none focus:border-[#173D32] shadow-2xs"
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
                    className="w-full bg-white border border-[#E4D7BF] rounded-xl p-3 text-xs text-[#30251E] font-medium focus:outline-none focus:border-[#173D32] shadow-2xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#173D32]" /> {t('dateLabel')}
                  </label>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    className="w-full bg-white border border-[#E4D7BF] rounded-xl p-2.5 text-xs text-[#30251E] font-medium focus:outline-none focus:border-[#173D32] shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#173D32]" /> {t('timeLabel')}
                  </label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-white border border-[#E4D7BF] rounded-xl p-2.5 text-xs text-[#30251E] font-medium focus:outline-none focus:border-[#173D32] shadow-2xs"
                  >
                    <option value="11:30">11:30 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="12:30">12:30 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="13:30">1:30 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="17:30">5:30 PM</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="18:30">6:30 PM</option>
                    <option value="19:00">7:00 PM</option>
                    <option value="19:30">7:30 PM</option>
                    <option value="20:00">8:00 PM</option>
                    <option value="20:30">8:30 PM</option>
                    <option value="21:00">9:00 PM</option>
                    <option value="21:30">9:30 PM</option>
                    <option value="22:00">10:00 PM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#173D32]" /> {t('guestsLabel')}
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full bg-white border border-[#E4D7BF] rounded-xl p-2.5 text-xs text-[#30251E] font-medium focus:outline-none focus:border-[#173D32] shadow-2xs"
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

              {/* Table Reference (Editable if user moved tables or needs custom note) */}
              <div>
                <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-1">
                  {t('tableReferenceBadge')}
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder={language === 'th' ? 'เช่น โต๊ะ 01, โต๊ะ 04' : 'e.g. 01, Table 04, VIP 2'}
                  className="w-full bg-white border border-[#E4D7BF] rounded-xl p-2.5 text-xs text-[#30251E] font-medium focus:outline-none focus:border-[#173D32]"
                />
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
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
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
                  className="w-full bg-white border border-[#E4D7BF] rounded-xl p-3 text-xs text-[#30251E] font-medium focus:outline-none focus:border-[#173D32] shadow-2xs"
                />
              </div>
            </div>

            {/* Note & Action Buttons */}
            <div className="pt-4 border-t border-[#E4D7BF] space-y-3">
              <p className="text-[11px] text-center text-[#75685A]">
                {t('resConfirmNote')}
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSubmit('whatsapp')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  {t('bookWhatsApp')}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('line')}
                  className="flex-1 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {t('bookLine')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#102C25] text-[#F8EEDB]/70 border-t border-[#D9B66D]/20 py-6 px-4 text-center text-xs">
        <p className="font-medium text-[#F8EEDB]">
          Namaste Siam Indian Kitchen • Phra Khanong, Bangkok
        </p>
        <p className="text-[11px] text-[#D9B66D]/80 mt-1">
          Open Daily: 11:00 AM – 11:00 PM • Tel: +66 82 956 0609
        </p>
      </footer>
    </div>
  );
}

