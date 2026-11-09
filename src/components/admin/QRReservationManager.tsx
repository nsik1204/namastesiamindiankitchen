import React, { useState, useEffect, useId } from 'react';
import QRCode from 'qrcode';
import { RestaurantInfo } from '../../types';
import { 
  QrCode, Download, Printer, Copy, Check, ExternalLink, Plus, Trash2, 
  Sparkles, AlertCircle, RefreshCw, Layers, CheckCircle2,
  Calendar, Phone, Smartphone, Eye
} from 'lucide-react';

interface QRReservationManagerProps {
  restaurantInfo: RestaurantInfo;
  onUpdateRestaurantInfo: (updated: RestaurantInfo) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const PRODUCTION_DOMAIN = 'https://namastesiamindiankitchen.vercel.app';

export default function QRReservationManager({
  restaurantInfo,
  onUpdateRestaurantInfo,
  showToast,
}: QRReservationManagerProps) {
  const printFrameId = useId();

  // Settings with local optimistic state
  const [qrEnabled, setQrEnabled] = useState<boolean>(() => restaurantInfo.qrTableBookingEnabled !== false);
  const [webEnabled, setWebEnabled] = useState<boolean>(() => restaurantInfo.websiteReservationEnabled !== false);
  const [tables, setTables] = useState<string[]>(() => 
    restaurantInfo.reservationTables && restaurantInfo.reservationTables.length > 0
      ? restaurantInfo.reservationTables
      : ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']
  );

  // Sync state whenever restaurantInfo prop changes
  useEffect(() => {
    if (restaurantInfo.qrTableBookingEnabled !== undefined) {
      setQrEnabled(restaurantInfo.qrTableBookingEnabled);
    }
  }, [restaurantInfo.qrTableBookingEnabled]);

  useEffect(() => {
    if (restaurantInfo.websiteReservationEnabled !== undefined) {
      setWebEnabled(restaurantInfo.websiteReservationEnabled);
    }
  }, [restaurantInfo.websiteReservationEnabled]);

  useEffect(() => {
    if (Array.isArray(restaurantInfo.reservationTables) && restaurantInfo.reservationTables.length > 0) {
      setTables(restaurantInfo.reservationTables);
    }
  }, [restaurantInfo.reservationTables]);

  const [selectedTable, setSelectedTable] = useState<string>(tables[0] || '01');
  const [newTableInput, setNewTableInput] = useState<string>('');
  const [isSavingSetting, setIsSavingSetting] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Generated QR preview
  const [qrPngUrl, setQrPngUrl] = useState<string>('');
  const [qrSvgString, setQrSvgString] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Computed public booking URL
  const bookingUrl = `${PRODUCTION_DOMAIN}/reserve?source=qr&table=${encodeURIComponent(selectedTable)}`;

  // Generate QR whenever selected table changes
  useEffect(() => {
    let active = true;
    setIsGenerating(true);

    const generateCodes = async () => {
      try {
        const [png, svg] = await Promise.all([
          QRCode.toDataURL(bookingUrl, {
            width: 1200,
            margin: 2,
            color: {
              dark: '#173D32',
              light: '#FFFFFF',
            },
            errorCorrectionLevel: 'H',
          }),
          QRCode.toString(bookingUrl, {
            type: 'svg',
            margin: 2,
            color: {
              dark: '#173D32',
              light: '#FFFFFF',
            },
            errorCorrectionLevel: 'H',
          }),
        ]);

        if (active) {
          setQrPngUrl(png);
          setQrSvgString(svg);
        }
      } catch (err: any) {
        console.error('QR code generation error:', err);
        if (active) showToast('Failed to generate QR code preview', 'error');
      } finally {
        if (active) setIsGenerating(false);
      }
    };

    generateCodes();

    return () => {
      active = false;
    };
  }, [bookingUrl, showToast]);

  // Handle Switch 1: QR Code Table Booking (Optimistic UI)
  const handleToggleQR = async () => {
    const nextState = !qrEnabled;
    setQrEnabled(nextState);
    setIsSavingSetting(true);
    try {
      await onUpdateRestaurantInfo({
        ...restaurantInfo,
        qrTableBookingEnabled: nextState,
        websiteReservationEnabled: webEnabled,
        reservationTables: tables,
      });
      showToast(
        nextState 
          ? 'QR Table Booking is now ACTIVE' 
          : 'QR Table Booking is now PAUSED (Scanned QR links will show unavailable message)',
        'success'
      );
    } catch (err: any) {
      setQrEnabled(!nextState); // Rollback
      showToast('Failed to update QR Booking setting: ' + (err?.message || ''), 'error');
    } finally {
      setIsSavingSetting(false);
    }
  };

  // Handle Switch 2: Standard Website Reservation (Optimistic UI)
  const handleToggleWebReservation = async () => {
    const nextState = !webEnabled;
    setWebEnabled(nextState);
    setIsSavingSetting(true);
    try {
      await onUpdateRestaurantInfo({
        ...restaurantInfo,
        qrTableBookingEnabled: qrEnabled,
        websiteReservationEnabled: nextState,
        reservationTables: tables,
      });
      showToast(
        nextState 
          ? 'Website "Reserve Table" button is now VISIBLE on customer website' 
          : 'Website "Reserve Table" button is now HIDDEN on customer website',
        'success'
      );
    } catch (err: any) {
      setWebEnabled(!nextState); // Rollback
      showToast('Failed to update Website Reservation setting: ' + (err?.message || ''), 'error');
    } finally {
      setIsSavingSetting(false);
    }
  };

  // Add Table
  const handleAddTable = async () => {
    const raw = newTableInput.trim();
    if (!raw) return;
    const formatted = raw.replace(/^table\s*/i, '').trim();
    if (tables.includes(formatted)) {
      showToast(`Table "${formatted}" already exists`, 'info');
      return;
    }

    const updatedTables = [...tables, formatted];
    setIsSavingSetting(true);
    try {
      await onUpdateRestaurantInfo({
        ...restaurantInfo,
        reservationTables: updatedTables,
      });
      setSelectedTable(formatted);
      setNewTableInput('');
      showToast(`Added Table "${formatted}"`, 'success');
    } catch (err: any) {
      showToast('Failed to add table: ' + (err?.message || ''), 'error');
    } finally {
      setIsSavingSetting(false);
    }
  };

  // Remove Table
  const handleRemoveTable = async (tableToRemove: string) => {
    if (tables.length <= 1) {
      showToast('At least one table must remain configured', 'error');
      return;
    }
    const updatedTables = tables.filter((t) => t !== tableToRemove);
    setIsSavingSetting(true);
    try {
      await onUpdateRestaurantInfo({
        ...restaurantInfo,
        reservationTables: updatedTables,
      });
      if (selectedTable === tableToRemove) {
        setSelectedTable(updatedTables[0]);
      }
      showToast(`Removed Table "${tableToRemove}"`, 'info');
    } catch (err: any) {
      showToast('Failed to remove table: ' + (err?.message || ''), 'error');
    } finally {
      setIsSavingSetting(false);
    }
  };

  // Copy Booking Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopiedLink(true);
      showToast(`Copied booking link for Table ${selectedTable}`, 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      showToast('Failed to copy link', 'error');
    }
  };

  // Download PNG (1200x1200px)
  const handleDownloadPNG = () => {
    if (!qrPngUrl) return;
    const link = document.createElement('a');
    link.href = qrPngUrl;
    link.download = `NamasteSiam-Table-${selectedTable}-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded PNG for Table ${selectedTable} (1200×1200px)`, 'success');
  };

  // Download SVG
  const handleDownloadSVG = () => {
    if (!qrSvgString) return;
    const blob = new Blob([qrSvgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NamasteSiam-Table-${selectedTable}-QR.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded SVG vector for Table ${selectedTable}`, 'success');
  };

  // Print Table Tent Card
  const handlePrintCard = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      showToast('Please allow pop-ups to print table tent card', 'error');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Table ${selectedTable} QR Tent Card — Namaste Siam</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff;
            color: #173D32;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
          }
          .tent-card {
            width: 130mm;
            border: 3px solid #173D32;
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            background: #FFF9EF;
            box-shadow: 0 4px 20px rgba(23,61,50,0.1);
            position: relative;
          }
          .inner-border {
            border: 1.5px dashed #D9B66D;
            border-radius: 12px;
            padding: 20px;
          }
          .logo-badge {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #B58C45;
            margin-bottom: 6px;
          }
          .title {
            font-size: 24px;
            font-weight: 900;
            color: #173D32;
            margin-bottom: 2px;
          }
          .subtitle {
            font-size: 12px;
            color: #75685A;
            margin-bottom: 16px;
          }
          .table-pill {
            display: inline-block;
            background: #173D32;
            color: #D9B66D;
            font-size: 16px;
            font-weight: 800;
            padding: 6px 20px;
            border-radius: 999px;
            margin-bottom: 18px;
            letter-spacing: 1px;
          }
          .qr-wrapper {
            background: #ffffff;
            padding: 16px;
            border-radius: 12px;
            border: 1px solid #E4D7BF;
            display: inline-block;
            margin-bottom: 16px;
          }
          .qr-img {
            width: 220px;
            height: 220px;
            display: block;
          }
          .instructions-en {
            font-size: 14px;
            font-weight: 800;
            color: #173D32;
            margin-bottom: 4px;
          }
          .instructions-th {
            font-size: 13px;
            color: #75685A;
            margin-bottom: 14px;
          }
          .footer-note {
            font-size: 10px;
            color: #9B8C7C;
            border-top: 1px solid #E4D7BF;
            padding-top: 10px;
            margin-top: 8px;
          }
          @media print {
            body { padding: 0; }
            .tent-card { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="tent-card">
          <div class="inner-border">
            <div class="logo-badge">Namaste Siam</div>
            <h1 class="title">Indian Kitchen</h1>
            <p class="subtitle">Phra Khanong, Bangkok</p>
            
            <div class="table-pill">TABLE ${selectedTable}</div>

            <div class="qr-wrapper">
              <img class="qr-img" src="${qrPngUrl}" alt="Table ${selectedTable} Reservation QR" />
            </div>

            <div class="instructions-en">Scan to Reserve Your Table</div>
            <div class="instructions-th">สแกนเพื่อจองโต๊ะอาหาร</div>

            <div class="footer-note">
              https://namastesiamindiankitchen.vercel.app • Tel: +66 82 956 0609
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 font-body">
      {/* Top Banner / Overview */}
      <div className="bg-[#FFF9EF] border border-[#E4D7BF] rounded-3xl p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4D7BF] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#B58C45] uppercase tracking-wider">
                Console Settings & QR Studio
              </span>
              <span className="text-[10px] font-bold bg-[#173D32] text-[#D9B66D] px-2 py-0.5 rounded-full">
                Independent Switches
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#173D32] font-display mt-1">
              Reservation & QR Settings
            </h2>
            <p className="text-xs text-[#75685A] mt-1 max-w-xl">
              Control the customer website reservation buttons and the physical table QR code booking system independently. Generate print-ready branded QR codes for all restaurant tables.
            </p>
          </div>

          {/* Current Status Matrix Pill */}
          <div className="bg-[#F8EEDB] border border-[#E4D7BF] rounded-2xl p-4 shrink-0 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#173D32] text-[#D9B66D]">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <span className="text-[#75685A] block font-medium">Operating Mode</span>
              <span className="font-bold text-[#173D32]">
                {qrEnabled && webEnabled && 'All Booking Channels ON'}
                {!qrEnabled && webEnabled && 'Website Only (QR Paused)'}
                {qrEnabled && !webEnabled && 'QR Table Only (Website Hidden)'}
                {!qrEnabled && !webEnabled && 'All Bookings Paused'}
              </span>
            </div>
          </div>
        </div>

        {/* Phase 1 & 5: Two Independent Switches */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          {/* Switch 1: QR Code Table Booking */}
          <div className={`p-5 rounded-2xl border transition-all ${
            qrEnabled 
              ? 'bg-[#173D32]/5 border-[#173D32]/40 shadow-xs' 
              : 'bg-[#F8EEDB]/40 border-[#E4D7BF]'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#173D32] text-[#D9B66D]">
                    <QrCode className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-[#173D32]">
                    QR Code Table Booking
                  </h3>
                </div>
                <p className="text-[11px] text-[#75685A] leading-relaxed">
                  Controls table-specific QR scans. When OFF, scanned QR codes immediately show a polite unavailable notice and block bookings.
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleQR}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${
                  qrEnabled ? 'bg-[#173D32]' : 'bg-[#C4B7A6]'
                }`}
                role="switch"
                aria-checked={qrEnabled}
                aria-label="Toggle QR Table Booking"
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    qrEnabled ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E4D7BF] flex items-center justify-between text-xs">
              <span className="text-[#75685A]">Current Status:</span>
              <span className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                qrEnabled 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${qrEnabled ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
                {qrEnabled ? 'Active & Accepting Bookings' : 'Paused (Blocks QR Submissions)'}
              </span>
            </div>
          </div>

          {/* Switch 2: Standard Website Reserve Table */}
          <div className={`p-5 rounded-2xl border transition-all ${
            webEnabled 
              ? 'bg-[#173D32]/5 border-[#173D32]/40 shadow-xs' 
              : 'bg-[#F8EEDB]/40 border-[#E4D7BF]'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#D9B66D] text-[#173D32]">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-[#173D32]">
                    Standard Website Reserve Table
                  </h3>
                </div>
                <p className="text-[11px] text-[#75685A] leading-relaxed">
                  Controls the "Reserve Table" button in the public website header. When OFF, the button is completely hidden from public view.
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleWebReservation}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${
                  webEnabled ? 'bg-[#173D32]' : 'bg-[#C4B7A6]'
                }`}
                role="switch"
                aria-checked={webEnabled}
                aria-label="Toggle Website Reservation"
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    webEnabled ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E4D7BF] flex items-center justify-between text-xs">
              <span className="text-[#75685A]">Current Status:</span>
              <span className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                webEnabled 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-stone-200 text-stone-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${webEnabled ? 'bg-emerald-600' : 'bg-stone-500'}`}></span>
                {webEnabled ? 'Visible in Header' : 'Hidden from Public Website'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 2, 3, 6: QR Code Studio & Table Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Table Management & URL Configuration */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#FFF9EF] border border-[#E4D7BF] rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#E4D7BF] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#173D32] flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#B58C45]" />
                  Table Selector & Generator
                </h3>
                <p className="text-xs text-[#75685A] mt-0.5">
                  Select a table to preview, download, or print its dedicated QR code.
                </p>
              </div>
              <span className="text-xs font-bold bg-[#F8EEDB] text-[#173D32] border border-[#E4D7BF] px-3 py-1 rounded-full">
                {tables.length} Active Tables
              </span>
            </div>

            {/* Table Selection Pills */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider">
                Select Restaurant Table:
              </label>
              <div className="flex flex-wrap gap-2">
                {tables.map((tbl) => (
                  <button
                    key={tbl}
                    type="button"
                    onClick={() => setSelectedTable(tbl)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedTable === tbl
                        ? 'bg-[#173D32] text-[#D9B66D] shadow-sm ring-2 ring-[#D9B66D]/40'
                        : 'bg-white border border-[#E4D7BF] text-[#30251E] hover:bg-[#F8EEDB]'
                    }`}
                  >
                    <span>Table {tbl}</span>
                    {selectedTable === tbl && (
                      <Check className="w-3.5 h-3.5 text-[#D9B66D]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Custom Table Input */}
            <div className="pt-2 border-t border-[#E4D7BF]">
              <label className="block text-xs font-bold text-[#30251E] uppercase tracking-wider mb-2">
                Add New Table Identifier:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTableInput}
                  onChange={(e) => setNewTableInput(e.target.value)}
                  placeholder="e.g. 11, VIP-1, Terrace-02"
                  className="flex-1 bg-white border border-[#E4D7BF] rounded-xl px-3 py-2 text-xs text-[#30251E] focus:outline-none focus:border-[#173D32]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTable();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddTable}
                  disabled={!newTableInput.trim() || isSavingSetting}
                  className="bg-[#173D32] hover:bg-[#102C25] text-[#F8EEDB] font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 text-[#D9B66D]" />
                  Add Table
                </button>
              </div>
            </div>

            {/* Remove Current Table (if more than 1) */}
            {tables.length > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-[#75685A]">Want to remove Table {selectedTable}?</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTable(selectedTable)}
                  disabled={isSavingSetting}
                  className="text-red-700 hover:text-red-900 font-semibold flex items-center gap-1 text-[11px] hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Table {selectedTable}
                </button>
              </div>
            )}
          </div>

          {/* Public Booking Link Card */}
          <div className="bg-[#FFF9EF] border border-[#E4D7BF] rounded-3xl p-6 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-[#30251E] uppercase tracking-wider flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-[#B58C45]" />
              Verified Public Destination URL
            </h4>
            <div className="bg-white border border-[#E4D7BF] rounded-xl p-3 flex items-center justify-between gap-3">
              <span className="text-xs font-mono text-[#173D32] truncate select-all">
                {bookingUrl}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-lg bg-[#F8EEDB] hover:bg-[#E4D7BF] text-[#173D32] transition-colors cursor-pointer"
                  title="Copy link"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-[#173D32] hover:bg-[#102C25] text-[#D9B66D] transition-colors"
                  title="Open live link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Quick Testing Matrix Note */}
            <div className="p-3.5 rounded-xl bg-[#F8EEDB]/60 border border-[#E4D7BF] text-xs text-[#75685A] space-y-1">
              <div className="font-bold text-[#173D32] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#B58C45]" />
                Live Behavior Verification
              </div>
              <p className="text-[11px] leading-relaxed">
                When QR Booking is <strong>ON</strong>, scanning loads the table booking form pre-filled with <strong>Table {selectedTable}</strong>. When <strong>OFF</strong>, scanning shows a branded unavailable message directing guests to call or talk to their server.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Branded Preview Card & Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#173D32] border-2 border-[#D9B66D]/50 rounded-3xl p-6 text-center shadow-[0_20px_50px_rgba(23,61,50,0.25)] space-y-5 text-[#F8EEDB] relative overflow-hidden">
            {/* Background Decorative Accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D9B66D]/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D9B66D]/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Header in Preview */}
            <div className="relative z-10 space-y-1">
              <span className="text-[10px] font-bold text-[#D9B66D] tracking-widest uppercase block">
                Namaste Siam
              </span>
              <h3 className="text-xl font-extrabold text-[#F8EEDB] font-display">
                Indian Kitchen
              </h3>
              <p className="text-[11px] text-[#F8EEDB]/70">
                Phra Khanong, Bangkok
              </p>
            </div>

            {/* Table Badge */}
            <div className="relative z-10">
              <span className="inline-block bg-[#D9B66D] text-[#173D32] text-xs font-black px-4 py-1.5 rounded-full shadow-md uppercase tracking-wider">
                TABLE {selectedTable}
              </span>
            </div>

            {/* QR Code Container */}
            <div className="relative z-10 bg-white p-4 rounded-2xl border-2 border-[#D9B66D]/60 inline-block shadow-lg">
              {isGenerating ? (
                <div className="w-56 h-56 flex flex-col items-center justify-center gap-2 text-[#75685A]">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#173D32]" />
                  <span className="text-xs font-medium">Generating QR...</span>
                </div>
              ) : qrPngUrl ? (
                <img
                  src={qrPngUrl}
                  alt={`Table ${selectedTable} QR Code`}
                  className="w-56 h-56 block rounded-lg"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-red-600 font-bold">
                  Generation Error
                </div>
              )}
            </div>

            {/* Scan Instructions */}
            <div className="relative z-10 space-y-1">
              <div className="text-xs font-extrabold text-[#F8EEDB] tracking-wide">
                Scan to Reserve Your Table
              </div>
              <div className="text-[11px] text-[#D9B66D] font-medium">
                สแกนเพื่อจองโต๊ะอาหาร
              </div>
            </div>

            {/* QR Action Buttons */}
            <div className="relative z-10 pt-3 border-t border-[#D9B66D]/20 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleDownloadPNG}
                disabled={!qrPngUrl}
                className="bg-[#D9B66D] hover:bg-[#c9a65d] text-[#173D32] font-bold py-2.5 px-2 rounded-xl text-xs flex flex-col items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                title="Download 1200x1200px PNG"
              >
                <Download className="w-4 h-4" />
                <span className="text-[10px]">PNG (Print)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSVG}
                disabled={!qrSvgString}
                className="bg-[#FFF9EF] hover:bg-[#F8EEDB] text-[#173D32] font-bold py-2.5 px-2 rounded-xl text-xs flex flex-col items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                title="Download Vector SVG"
              >
                <QrCode className="w-4 h-4" />
                <span className="text-[10px]">SVG (Vector)</span>
              </button>

              <button
                type="button"
                onClick={handlePrintCard}
                disabled={!qrPngUrl}
                className="bg-[#102C25] hover:bg-[#0b1f1a] text-[#F8EEDB] border border-[#D9B66D]/40 font-bold py-2.5 px-2 rounded-xl text-xs flex flex-col items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                title="Print Table Tent Card"
              >
                <Printer className="w-4 h-4 text-[#D9B66D]" />
                <span className="text-[10px]">Print Card</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Table Directory */}
      <div className="bg-[#FFF9EF] border border-[#E4D7BF] rounded-3xl p-6 md:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4D7BF] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#173D32] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#B58C45]" />
              Restaurant Tables Directory
            </h3>
            <p className="text-xs text-[#75685A] mt-0.5">
              Complete inventory of table QR links for Namaste Siam Indian Kitchen.
            </p>
          </div>
          <span className="text-xs text-[#75685A]">
            Total tables configured: <strong>{tables.length}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {tables.map((tbl) => {
            const tblUrl = `${PRODUCTION_DOMAIN}/reserve?source=qr&table=${encodeURIComponent(tbl)}`;
            const isCurrent = selectedTable === tbl;
            return (
              <div
                key={tbl}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-[#173D32] text-[#F8EEDB] border-[#D9B66D]/60 shadow-md'
                    : 'bg-white border-[#E4D7BF] text-[#30251E] hover:border-[#173D32]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                    isCurrent ? 'bg-[#D9B66D] text-[#173D32]' : 'bg-[#173D32] text-[#D9B66D]'
                  }`}>
                    Table {tbl}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedTable(tbl)}
                    className={`text-[10px] font-bold underline cursor-pointer ${
                      isCurrent ? 'text-[#D9B66D]' : 'text-[#173D32]'
                    }`}
                  >
                    Select
                  </button>
                </div>

                <div className={`text-[10px] truncate font-mono mb-2.5 ${
                  isCurrent ? 'text-[#F8EEDB]/70' : 'text-[#75685A]'
                }`}>
                  /reserve?table={tbl}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(tblUrl);
                        showToast(`Copied Table ${tbl} URL`, 'success');
                      } catch {
                        showToast('Failed to copy', 'error');
                      }
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer ${
                      isCurrent 
                        ? 'bg-[#102C25] text-[#D9B66D] hover:bg-black' 
                        : 'bg-[#F8EEDB] text-[#173D32] hover:bg-[#E4D7BF]'
                    }`}
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                  <a
                    href={tblUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-1.5 rounded-lg flex items-center justify-center ${
                      isCurrent 
                        ? 'bg-[#D9B66D] text-[#173D32]' 
                        : 'bg-[#173D32] text-[#D9B66D]'
                    }`}
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

