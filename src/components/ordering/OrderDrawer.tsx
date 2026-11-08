import React, { useState } from 'react';
import { Dish, RestaurantInfo } from '../../types';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  X,
  MessageSquare,
  Send,
  UtensilsCrossed,
  Package,
  Bike
} from 'lucide-react';

export interface CartItem {
  dish: Dish;
  quantity: number;
}

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (dishId: number, delta: number) => void;
  onRemoveItem: (dishId: number) => void;
  onClearCart: () => void;
  restaurantInfo: RestaurantInfo;
}

export default function OrderDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  restaurantInfo
}: OrderDrawerProps) {
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  if (!isOpen) return null;

  const totalTHB = cart.reduce((sum, item) => sum + item.dish.priceTHB * item.quantity, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const generateOrderMessage = (): string => {
    const typeLabel =
      orderType === 'dine_in'
        ? `🍽️ Dine-In (Table: ${tableNumber.trim() || 'Not specified'})`
        : orderType === 'takeaway'
        ? '🥡 Takeaway / Pickup'
        : '🛵 Delivery Order';

    const itemsText = cart
      .map(
        (item) =>
          `• ${item.quantity}x ${item.dish.name} — ฿${item.dish.priceTHB * item.quantity} (฿${item.dish.priceTHB} each)`
      )
      .join('\n');

    let customerDetails = '';
    if (customerName.trim()) customerDetails += `👤 *Customer:* ${customerName.trim()}\n`;
    if (customerPhone.trim()) customerDetails += `📞 *Phone:* ${customerPhone.trim()}\n`;
    if (orderType === 'delivery' && customerAddress.trim()) {
      customerDetails += `📍 *Delivery Address:* ${customerAddress.trim()}\n`;
    }

    return `*Namaste Siam Indian Kitchen — Order Request* 🍽️
---------------------------------
*Order Type:* ${typeLabel}
${customerDetails}
*Ordered Items (${totalItemsCount}):*
${itemsText}

💰 *Total Amount:* ฿${totalTHB} THB
${specialNotes.trim() ? `\n📝 *Kitchen Instructions:* ${specialNotes.trim()}\n` : ''}---------------------------------
_Sent via Namaste Siam Digital Menu_`;
  };

  const handleSendOrder = (channel: 'whatsapp' | 'line') => {
    if (cart.length === 0) {
      alert('Your order tray is empty.');
      return;
    }

    if (orderType === 'dine_in' && !tableNumber.trim()) {
      const confirmSend = window.confirm(
        'Table number is empty. Would you like to proceed anyway and inform the server directly?'
      );
      if (!confirmSend) return;
    }

    const message = generateOrderMessage();

    if (channel === 'whatsapp') {
      const waNumber = (restaurantInfo.whatsappNumber || '+66829560609').replace(/[^0-9]/g, '');
      const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const lineId = restaurantInfo.lineId || 'namastesiam';
      const url = `https://line.me/R/ti/p/~${lineId}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Order Cart"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-[#2B1A0E]/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
    >
      <div className="bg-[#FFFDF9] w-full max-w-md h-full shadow-[0_0_50px_rgba(43,26,14,0.3)] flex flex-col justify-between font-body text-[#2B1A0E] border-l border-[rgba(122,74,34,0.18)]">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-[rgba(122,74,34,0.12)] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[rgba(169,14,2,0.08)] flex items-center justify-center text-[#A90E02]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-[#2B1A0E]">Your Order Tray</h2>
              <span className="text-xs text-[#735B43] font-medium">
                {totalItemsCount} {totalItemsCount === 1 ? 'dish' : 'dishes'} selected
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="text-xs font-semibold text-[#8C7358] hover:text-[#A90E02] transition-colors px-2 py-1"
                title="Clear tray"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FDF8F1] border border-[rgba(122,74,34,0.16)] flex items-center justify-center text-[#735B43] hover:text-[#A90E02] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body (Scrollable items & Order config) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
          
          {/* Order Type Toggle Selector (F3) */}
          <div className="bg-[#FDF8F1] p-3.5 rounded-2xl border border-[rgba(122,74,34,0.14)] space-y-2.5">
            <span className="text-xs font-bold text-[#8C5E2D] uppercase tracking-wider block">
              Dining Mode
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setOrderType('dine_in')}
                className={`py-2 px-2 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
                  orderType === 'dine_in'
                    ? 'bg-white text-[#A90E02] shadow-xs border border-[#A90E02]/30'
                    : 'text-[#735B43] hover:bg-white/50'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                Dine-In
              </button>

              <button
                type="button"
                onClick={() => setOrderType('takeaway')}
                className={`py-2 px-2 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
                  orderType === 'takeaway'
                    ? 'bg-white text-[#A90E02] shadow-xs border border-[#A90E02]/30'
                    : 'text-[#735B43] hover:bg-white/50'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Takeaway
              </button>

              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`py-2 px-2 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
                  orderType === 'delivery'
                    ? 'bg-white text-[#A90E02] shadow-xs border border-[#A90E02]/30'
                    : 'text-[#735B43] hover:bg-white/50'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                Delivery
              </button>
            </div>

            {orderType === 'dine_in' && (
              <div className="pt-1">
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Enter Table Number (e.g. Table 4)"
                  className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                />
              </div>
            )}

            {orderType === 'delivery' && (
              <div className="pt-1">
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Delivery Address / Hotel Room #"
                  className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                />
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-[#8C5E2D] uppercase tracking-wider block">
              Items in Tray
            </span>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-[#8C7358] space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto text-[#8C7358]/40" />
                <p className="text-sm font-semibold">Your order tray is empty.</p>
                <p className="text-xs text-[#8C7358]/80 max-w-xs mx-auto">
                  Browse our chef-curated menu and tap "+ Add" on any dish to begin your order.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[rgba(122,74,34,0.08)]">
                {cart.map(({ dish, quantity }) => (
                  <div key={dish.id} className="py-3 flex items-center justify-between gap-3">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-12 h-12 rounded-xl object-cover border border-[rgba(122,74,34,0.12)] shrink-0 bg-[#FDF8F1]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-[#2B1A0E] truncate">{dish.name}</h4>
                      <span className="text-xs font-bold text-[#A90E02]">
                        ฿{dish.priceTHB * quantity}{' '}
                        <span className="text-[11px] text-[#8C7358] font-normal">
                          (฿{dish.priceTHB} ea)
                        </span>
                      </span>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 bg-[#FDF8F1] border border-[rgba(122,74,34,0.18)] rounded-lg p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(dish.id, -1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-[#735B43] hover:text-[#A90E02] transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-[#2B1A0E] w-4 text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(dish.id, 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-[#735B43] hover:text-[#A90E02] transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(dish.id)}
                      className="text-[#8C7358] hover:text-rose-600 transition-colors p-1 shrink-0"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Details & Notes */}
          {cart.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-[#8C5E2D] uppercase tracking-wider block">
                Contact & Preferences
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your Name (Optional)"
                  className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone / WhatsApp"
                  className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                />
              </div>

              <div>
                <textarea
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="Kitchen notes: e.g. Mild spicy, extra chutney, allergy info..."
                  rows={2}
                  className="w-full bg-white border border-[rgba(122,74,34,0.2)] rounded-xl p-2.5 text-xs text-[#2B1A0E] focus:outline-none focus:border-[#A90E02]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer with Subtotal & Instant WhatsApp / LINE Actions */}
        <div className="p-5 border-t border-[rgba(122,74,34,0.12)] bg-white space-y-3 shrink-0 shadow-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-[#735B43]">Estimated Total</span>
            <span className="text-xl font-extrabold text-[#A90E02]">฿{totalTHB} THB</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSendOrder('whatsapp')}
              disabled={cart.length === 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
            >
              <MessageSquare className="w-4 h-4" />
              Order on WhatsApp
            </button>
            <button
              type="button"
              onClick={() => handleSendOrder('line')}
              disabled={cart.length === 0}
              className="flex-1 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              Order on LINE
            </button>
          </div>
          <span className="block text-[10px] text-center text-[#8C7358]">
            Clicking sends your pre-formatted order directly to kitchen staff.
          </span>
        </div>

      </div>
    </div>
  );
}

