import React, { useState } from 'react';
import { RestaurantInfo } from '../../types';
import { Calendar, Clock, Users, X, Send, CheckCircle2, MessageSquare } from 'lucide-react';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantInfo: RestaurantInfo;
}

export default function ReservationModal({ isOpen, onClose, restaurantInfo }: ReservationModalProps) {
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

  if (!isOpen) return null;

  const handleSubmit = (platform: 'whatsapp' | 'line') => {
    if (!name.trim()) {
      alert('Please enter your name for the reservation.');
      return;
    }
    if (!phone.trim()) {
      alert('Please enter your contact phone or WhatsApp number.');
      return;
    }

    const message = `*Table Reservation Request — ${restaurantInfo.name || 'Namaste Siam'}* 🍷
---------------------------------
👤 *Guest Name:* ${name.trim()}
📞 *Phone/WhatsApp:* ${phone.trim()}
📅 *Date:* ${date}
⏰ *Time:* ${time}
👥 *Number of Guests:* ${guests} People
🪑 *Seating Preference:* ${seatingArea === 'indoor' ? 'Indoor Air-conditioned' : seatingArea === 'outdoor' ? 'Outdoor Terrace' : 'Any Available'}
${specialRequest.trim() ? `📝 *Special Request:* ${specialRequest.trim()}\n` : ''}---------------------------------
_Sent via Namaste Siam Digital Menu_`;

    if (platform === 'whatsapp') {
      const waNumber = (restaurantInfo.whatsappNumber || '+66829560609').replace(/[^0-9]/g, '');
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
      aria-label="Table Reservation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-[#2B1A0E]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-[#FFFDF9] border border-[rgba(122,74,34,0.18)] rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-[0_25px_60px_rgba(43,26,14,0.3)] p-6 md:p-8 space-y-5 text-[#2B1A0E] font-body relative">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-[#8C5E2D] uppercase tracking-wider block">
              Experience Authentic Dining
            </span>
            <h2 className="text-2xl font-extrabold text-[#2B1A0E] tracking-tight font-display mt-0.5">
              Reserve a Table
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FDF8F1] border border-[rgba(122,74,34,0.16)] flex items-center justify-center text-[#735B43] hover:text-[#A90E02] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reservation Form */}
        <div className="space-y-4 text-xs font-semibold">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">
                Contact Phone / WhatsApp *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+66 82 956 0609"
                className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#A90E02]" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#A90E02]" /> Time
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
              >
                <option value="12:00">12:00 PM (Lunch)</option>
                <option value="12:30">12:30 PM</option>
                <option value="13:00">1:00 PM</option>
                <option value="13:30">1:30 PM</option>
                <option value="18:00">6:00 PM (Dinner)</option>
                <option value="18:30">6:30 PM</option>
                <option value="19:00">7:00 PM</option>
                <option value="19:30">7:30 PM</option>
                <option value="20:00">8:00 PM</option>
                <option value="20:30">8:30 PM</option>
                <option value="21:00">9:00 PM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#A90E02]" /> Guests
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
              >
                <option value="1">1 Person</option>
                <option value="2">2 People</option>
                <option value="3">3 People</option>
                <option value="4">4 People</option>
                <option value="5">5 People</option>
                <option value="6">6 People</option>
                <option value="7">7 People</option>
                <option value="8">8 People</option>
                <option value="10+">10+ Group</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1.5">
              Seating Preference
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'any', label: 'Any Available' },
                { id: 'indoor', label: 'Air-Conditioned' },
                { id: 'outdoor', label: 'Outdoor Terrace' },
              ].map((seat) => (
                <button
                  key={seat.id}
                  type="button"
                  onClick={() => setSeatingArea(seat.id as any)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    seatingArea === seat.id
                      ? 'bg-[rgba(169,14,2,0.08)] border-[#A90E02] text-[#A90E02] ring-1 ring-[#A90E02]'
                      : 'bg-white border-[rgba(122,74,34,0.18)] text-[#735B43] hover:bg-[#FDF8F1]'
                  }`}
                >
                  {seat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#47311B] uppercase tracking-wider mb-1">
              Special Notes / Occasion (Optional)
            </label>
            <textarea
              value={specialRequest}
              onChange={(e) => setSpecialRequest(e.target.value)}
              placeholder="e.g. Anniversary dinner, high chair needed for infant, etc."
              rows={2}
              className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-[rgba(122,74,34,0.12)]">
          <span className="block text-[11px] text-center text-[#8C7358]">
            Instant confirmation will be sent directly to your phone.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSubmit('whatsapp')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Book via WhatsApp
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('line')}
              className="flex-1 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Send className="w-4 h-4" />
              Book via LINE
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

