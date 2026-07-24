import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../lib/i18n';
import {
  User,
  MapPin,
  Package,
  Heart,
  Bell,
  LogOut,
  Plus,
  Trash2,
  Check,
  ShoppingBag,
  Save,
  CheckCircle,
  Truck,
  Sparkles,
  Copy,
  Wallet,
  RefreshCw,
  Share2,
  MessageCircle,
  Upload,
  ArrowLeft,
  ChevronRight,
  Download,
  RotateCcw,
} from 'lucide-react';
import type { Product, LocalOrder, OrderDataSnapshot } from '../types';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';
import { supabase } from '../lib/supabase';
import { fetchUserProfile } from '../lib/crossPlatformSync';
import { createReferralShareCard, uploadReferralShareCard, createProductShareCard } from '../lib/shareHelper';
import { uploadToR2 } from '../lib/cloudflare/r2';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '../assets/My_logo/Frame 16.png';

const FacebookIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TwitterIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const LinkedinIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);



interface UserProfilePageProps {
  orders: LocalOrder[];
  setOrders?: React.Dispatch<React.SetStateAction<LocalOrder[]>>;
  wishlist: Record<string, boolean>;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onNavigateToShop: () => void;
  onNavigateToHome: () => void;
  onNavigateToOrders: () => void;
  products?: Product[];
  loggedInUser?: { id: string; fullName: string; email: string; phoneNumber: string } | null;
  onLogout?: () => void;
  initialTab?: 'info' | 'orders' | 'addresses' | 'wishlist' | 'notifications' | 'logout' | 'affiliate';
  onProfileUpdate?: (updatedUser: { id: string; fullName: string; email: string; phoneNumber: string }) => void;
  onNavigateToAffiliation?: () => void;
}

interface Address {
  id: string;
  type: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

const getAssetAsDataUrl = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image blob as Data URL.'));
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Error converting asset to data URL:', err);
    return url;
  }
};

const parseAddressLine2 = (addrLine2: string) => {
  if (!addrLine2) return { flat: '', landmark: '', altPhone: '', addressLine2: '' };
  
  let cleaned = addrLine2;
  const parts = addrLine2.split(' | ');
  if (parts.length > 1 && parts[parts.length - 1].startsWith('MANTRA-')) {
    cleaned = parts.slice(0, -1).join(' | ');
  }
  
  const idx = cleaned.indexOf('__STRUCTURED_ADDR__:');
  if (idx !== -1) {
    try {
      return JSON.parse(cleaned.substring(idx + 20));
    } catch (e) {
      return { flat: '', landmark: '', altPhone: '', addressLine2: cleaned.replace(/__STRUCTURED_ADDR__:\s*\{[^}]*\}/g, '').trim() };
    }
  }
  return { flat: '', landmark: '', altPhone: '', addressLine2: cleaned };
};

const generateInvoiceDoc = async (order: LocalOrder, source?: 'primary' | 'corrected'): Promise<jsPDF> => {
  const dataToUse: OrderDataSnapshot = (source === 'primary' && order.originalData)
    ? order.originalData
    : (order.activeData || {
        fullName: order.fullName,
        phoneNumber: order.phoneNumber,
        email: order.email,
        addressLine1: order.addressLine1,
        addressLine2: order.addressLine2,
        deliveryCity: order.deliveryCity,
        deliveryState: order.deliveryState,
        pincode: order.pincode,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        shipping: order.shipping,
        tax: order.tax,
        total: order.total
      });

  const parsedAddr = parseAddressLine2(dataToUse.addressLine2 || '');
  let displayAddressText = '';
  let altPhone = '';
  if (parsedAddr.flat || parsedAddr.landmark || parsedAddr.altPhone || parsedAddr.addressLine2) {
    const parts = [];
    if (parsedAddr.flat) parts.push(parsedAddr.flat.trim());
    if (dataToUse.addressLine1) parts.push(dataToUse.addressLine1.trim());
    if (parsedAddr.addressLine2) parts.push(parsedAddr.addressLine2.trim());
    if (parsedAddr.landmark) parts.push(`Landmark: ${parsedAddr.landmark.trim()}`);
    displayAddressText = parts.filter(Boolean).join(', ') + `, ${dataToUse.deliveryCity}, ${dataToUse.deliveryState} - ${dataToUse.pincode}`;
    if (parsedAddr.altPhone) altPhone = parsedAddr.altPhone.trim();
  } else {
    displayAddressText = `${dataToUse.addressLine1}${dataToUse.addressLine2 ? ', ' + dataToUse.addressLine2 : ''}, ${dataToUse.deliveryCity}, ${dataToUse.deliveryState} - ${dataToUse.pincode}`;
  }

  const isCodOrder = order.paymentMethod === 'COD' || order.paymentMethod === 'Cash on Delivery';

  let logoDataUrl = '';
  try {
    logoDataUrl = await getAssetAsDataUrl(logo);
  } catch (e) {
    console.error("Failed to fetch logo:", e);
  }

  let footerQrDataUrl = '';
  try {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://shop.mantrapuja.com`;
    footerQrDataUrl = await getAssetAsDataUrl(qrCodeUrl);
  } catch (e) {
    console.error("Failed to fetch QR data for footer:", e);
  }

  let displayPaymentStatus = order.paymentStatus || 'Pending';
  if (order.paymentMethod?.toLowerCase().includes('razorpay')) {
    displayPaymentStatus = 'Confirmed';
  }

  const discountPercent = order.discountPercent || Math.round((order.discount / (order.subtotal || 1)) * 100);
  const codFeeAmount = (order as any).codFee || (order as any).cod_fee || (isCodOrder ? 50 : 0);
  const pdfDisplayTotal = Math.max(Number(order.total || 0), (Number(order.subtotal || 0) - Number(order.discount || 0) + Number(order.shipping || 0) + Number(order.tax || 0) + Number(codFeeAmount || 0)));

  const hasVidyaRudraksha = order.items.some(item => {
    const itemName = (item.product?.name || '').toLowerCase();
    return itemName.includes('vidya') || itemName.includes('विद्या');
  });

  const invoiceDiv = document.createElement('div');
  invoiceDiv.style.position = 'absolute';
  invoiceDiv.style.left = '-9999px';
  invoiceDiv.style.top = '-9999px';
  invoiceDiv.style.width = '800px';

  invoiceDiv.innerHTML = `
    <div id="invoice-capture" style="
      width: 800px;
      min-height: 1060px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-family: 'Segoe UI', 'Roboto', 'Noto Sans', 'Noto Sans Devanagari', sans-serif;
      background-color: #ffffff;
      color: #374151;
      padding: 40px;
      box-sizing: border-box;
      position: relative;
      line-height: 1.5;
    ">
      <div>
        <!-- Brand and Invoice Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${logoDataUrl ? `<img src="${logoDataUrl}" style="height: 48px; width: auto;" />` : ''}
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 24px; font-weight: 800; color: #4a2010; line-height: 1.1;">MANTRA PUJA</span>
              <span style="font-size: 10px; color: #6b7280; font-weight: 600; margin-top: 2px;">Spiritual & Temple Offerings</span>
              <span style="font-size: 9px; color: #6b7280; font-weight: 500;">Email: support@mantrapuja.com</span>
              <span style="font-size: 9px; color: #6b7280; font-weight: 500;">Web: www.mantrapuja.com</span>
            </div>
          </div>
          <div style="text-align: right; display: flex; flex-direction: column; justify-content: flex-start; line-height: 1.3;">
            <span style="font-size: 22px; font-weight: 800; color: #ea580c; letter-spacing: 0.5px;">INVOICE</span>
            <span style="font-size: 10px; font-weight: bold; color: #374151; margin-top: 4px;">Invoice ID: ${order.orderId}</span>
            <span style="font-size: 10px; color: #6b7280;">Date: ${new Date(order.placedAt).toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        <div style="border-top: 1.5px solid #e5e7eb; margin-bottom: 20px;"></div>

        <!-- Addresses & Payment Section -->
        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 30px; margin-bottom: 25px;">
          <!-- Bill To Address -->
          <div>
            <div style="font-size: 11px; font-weight: bold; color: #4a2010; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">BILL TO:</div>
            <div style="font-size: 13px; font-weight: 800; color: #111827; margin-bottom: 2px;">${dataToUse.fullName}</div>
            <div style="font-size: 10px; color: #374151; line-height: 1.4; word-break: break-word; font-weight: 500;">
              <strong style="color: #111827;">Phone:</strong> ${dataToUse.phoneNumber}${altPhone ? ' / Alt: ' + altPhone : ''}<br />
              <strong style="color: #111827;">Email:</strong> ${dataToUse.email}<br />
              ${displayAddressText}
            </div>
          </div>
          
          <!-- Payment Details -->
          <div>
            <div style="font-size: 11px; font-weight: bold; color: #4a2010; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">PAYMENT DETAILS:</div>
            <div style="font-size: 10px; color: #374151; line-height: 1.4; font-weight: 500;">
              <div>Method: <strong style="color: #111827;">${order.paymentMethod}</strong></div>
              <div style="margin-top: 2px;">Status: <strong style="color: #111827;">${displayPaymentStatus}</strong></div>
              
              ${isCodOrder ? `
                <div style="margin-top: 4px; font-size: 9.5px; font-weight: bold; color: #ea580c;">
                  Order payment detail: Please collect Rs. ${dataToUse.total.toFixed(2)} in Cash
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Table Section -->
        <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 25px; font-size: 11px;">
          <thead>
            <tr style="background-color: #4a2010; color: #ffffff; font-weight: bold;">
              <th style="padding: 8px 12px; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">Sacred Item Details</th>
              <th style="padding: 8px 12px; text-align: center; width: 60px;">Qty</th>
              <th style="padding: 8px 12px; text-align: right; width: 100px;">Price</th>
              <th style="padding: 8px 12px; text-align: right; width: 110px; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${dataToUse.items.map((item, index) => `
              <tr style="background-color: ${index % 2 === 1 ? '#f9fafb' : '#ffffff'}; border-bottom: 1px solid #e5e7eb; color: #374151;">
                <td style="padding: 10px 12px; font-weight: 600;">${item.product.name}</td>
                <td style="padding: 10px 12px; text-align: center; font-weight: 600;">${item.quantity}</td>
                <td style="padding: 10px 12px; text-align: right;">Rs. ${item.product.price.toFixed(2)}</td>
                <td style="padding: 10px 12px; text-align: right; font-weight: 600;">Rs. ${(item.product.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Pricing Details Section -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 25px;">
          <div style="width: 320px; font-size: 11px; display: flex; flex-direction: column; gap: 5px;">
            <div style="display: flex; justify-content: space-between; color: #4b5563;">
              <span>Subtotal:</span>
              <span style="font-weight: 600; color: #111827;">Rs. ${dataToUse.subtotal.toFixed(2)}</span>
            </div>
            
            ${dataToUse.discount > 0 ? `
              <div style="display: flex; justify-content: space-between; color: #10b981; font-weight: 500;">
                <span>Discount (${discountPercent}%):</span>
                <span>-Rs. ${dataToUse.discount.toFixed(2)}</span>
              </div>
            ` : ''}
            
            <div style="display: flex; justify-content: space-between; color: #4b5563;">
              <span>Shipping:</span>
              <span style="font-weight: 600; color: #111827;">${dataToUse.shipping === 0 ? 'FREE' : `Rs. ${dataToUse.shipping.toFixed(2)}`}</span>
            </div>

            ${codFeeAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; color: #ea580c; font-weight: 600;">
                <span>COD Handling Charge:</span>
                <span>+Rs. ${Number(codFeeAmount).toFixed(2)}</span>
              </div>
            ` : ''}

            <div style="border-top: 1px solid #e5e7eb; margin: 4px 0;"></div>
            
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; color: #4a2010;">
              <span>Total Charged:</span>
              <span>Rs. ${pdfDisplayTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Vidya Rudraksha Box -->
        ${hasVidyaRudraksha ? `
          <div style="
            background-color: #fffdfa;
            border: 2px solid #f59e0b;
            border-radius: 10px;
            padding: 14px 18px;
            color: #374151;
            box-sizing: border-box;
            margin-bottom: 25px;
            box-shadow: 0 2px 6px rgba(245, 158, 11, 0.05);
          ">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px; border-bottom: 1.5px dashed #fcd34d; padding-bottom: 6px;">
              <span style="font-size: 16px;">🕉️</span>
              <span style="font-size: 16px; font-weight: 800; color: #9a3412; letter-spacing: 0.5px;">विद्या रुद्राक्ष धारण विधि</span>
              <span style="font-size: 16px;">🪔</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 11.5px; line-height: 1.45;">
              <div style="display: flex; gap: 8px; align-items: flex-start;">
                <span style="font-size: 13px; line-height: 1.2;">🪔</span>
                <div>
                  <strong style="color: #c2410c; font-size: 12px;">अष्टमी, नवमी और दशमी के दिन:</strong>
                  <span style="color: #374151; margin-left: 4px;">विद्या रुद्राक्ष को शुद्ध देसी गाय के घी में रखें। (तीन दिन तक)</span>
                </div>
              </div>

              <div style="display: flex; gap: 8px; align-items: flex-start;">
                <span style="font-size: 13px; line-height: 1.2;">🪔</span>
                <div>
                  <strong style="color: #c2410c; font-size: 12px;">एकादशी के दिन:</strong>
                  <span style="color: #374151; margin-left: 4px;">विद्या रुद्राक्ष को गंगाजल से धो लें और शुद्ध एवं स्वच्छ कपड़े से पोंछ लें। इसके बाद श्रद्धा भाव से रुद्राक्ष को धारण करें।</span>
                </div>
              </div>

              <div style="display: flex; gap: 8px; align-items: flex-start;">
                <span style="font-size: 13px; line-height: 1.2;">🪔</span>
                <div style="width: 100%;">
                  <strong style="color: #c2410c; font-size: 12px;">मंत्र जाप करें:</strong>
                  <span style="color: #374151; margin-left: 4px;">रुद्राक्ष को हाथ में लेकर 11, 21 या 108 बार नीचे दिए गए मंत्र का जाप करें:</span>
                  <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 4px 10px; margin-top: 4px; font-weight: bold; color: #9a3412; font-size: 12.5px; text-align: center;">
                    ॐ ह्रीं नमः । ॐ रुद्राय नमः । ॐ नमः शिवाय ॥
                  </div>
                </div>
              </div>

              <div style="display: flex; gap: 8px; align-items: flex-start;">
                <span style="font-size: 13px; line-height: 1.2;">🪔</span>
                <div>
                  <strong style="color: #c2410c; font-size: 12px;">लाल धागे में धारण करें:</strong>
                  <span style="color: #374151; margin-left: 4px;">रुद्राक्ष को लाल धागे में पिरोकर तैयार करें।</span>
                </div>
              </div>

              <div style="display: flex; gap: 8px; align-items: flex-start;">
                <span style="font-size: 13px; line-height: 1.2;">🪔</span>
                <div>
                  <strong style="color: #c2410c; font-size: 12px;">बच्चे को धारण कराएं:</strong>
                  <span style="color: #374151; margin-left: 4px;">एकादशी के शुभ दिन बच्चे के गले में श्रद्धा और विश्वास के साथ विद्या रुद्राक्ष पहनाएं।</span>
                </div>
              </div>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Footer Blessings Box -->
      <div style="
        background-color: #fdfbf7;
        padding: 20px;
        color: #374151;
        display: grid;
        grid-template-columns: 2.2fr 1fr 1.1fr 1.1fr;
        gap: 15px;
        box-sizing: border-box;
        border-top: 3px solid #fbbf24;
        border-radius: 4px;
        line-height: 1.45;
      ">
        <!-- Column 1: Brand & Thanks -->
        <div>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span style="font-size: 18px;">🕉️</span>
            <span style="font-size: 15px; font-weight: bold; color: #4a2010; letter-spacing: 0.5px;">MantraPuja</span>
            <span style="font-size: 10px; color: #ea580c; background-color: #fef3c7; padding: 1.5px 6px; border-radius: 4px; font-weight: 600; margin-left: 4px;">आस्था से आराधना तक</span>
          </div>
          <div style="font-size: 11px; font-weight: bold; color: #4a2010; margin-bottom: 3px;">धन्यवाद! 🙏</div>
          <div style="font-size: 10px; margin-bottom: 6px; color: #4b5563; text-align: justify;">
            आपने MantraPuja पर विश्वास जताया, इसके लिए हम आपका हार्दिक आभार व्यक्त करते हैं।
          </div>
          <div style="font-size: 9.5px; color: #4b5563; text-align: justify;">
            हमारा उद्देश्य आपके घर तक प्रमाणित आध्यात्मिक उत्पाद, पूजा सामग्री, ऑनलाइन पूजा सेवाएँ एवं ज्योतिष परामर्श सरल, सुरक्षित और विश्वसनीय रूप से पहुँचाना है।
          </div>
          <div style="font-size: 10px; font-style: italic; color: #ea580c; font-weight: 600; border-left: 2px solid #ea580c; padding-left: 6px; margin-top: 6px;">
            "मन से पूजा, मन से जुड़ाव, मन से मंत्रपूजा।"
          </div>
        </div>

        <!-- Column 2: Services -->
        <div>
          <div style="font-size: 11px; font-weight: bold; color: #4a2010; border-bottom: 1.5px solid #fbbf24; padding-bottom: 3px; margin-bottom: 6px; letter-spacing: 0.3px;">
            हमारी सेवाएँ
          </div>
          <ul style="list-style: none; padding: 0; margin: 0; font-size: 10px; display: flex; flex-direction: column; gap: 5px; color: #4b5563;">
            <li style="display: flex; align-items: center; gap: 4px;"><span>📿</span> सिद्ध रुद्राक्ष एवं मालाएँ</li>
            <li style="display: flex; align-items: center; gap: 4px;"><span>🛕</span> ऑनलाइन पूजा बुकिंग</li>
            <li style="display: flex; align-items: center; gap: 4px;"><span>👨🏻‍🦳</span> प्रमाणित पंडित सेवा</li>
            <li style="display: flex; align-items: center; gap: 4px;"><span>🔮</span> ज्योतिष एवं कुंडली परामर्श</li>
            <li style="display: flex; align-items: center; gap: 4px;"><span>🛍️</span> आध्यात्मिक एवं पूजा उत्पाद</li>
          </ul>
        </div>

        <!-- Column 3: Info & Socials -->
        <div>
          <div style="font-size: 10px; font-weight: bold; color: #dc2626; margin-bottom: 5px;">
            ⚠️ महत्वपूर्ण सूचना
          </div>
          <ul style="padding: 0 0 0 10px; margin: 0 0 10px 0; font-size: 9px; color: #4b5563; line-height: 1.35;">
            <li>उत्पाद प्राप्त होने पर पैकेज अवश्य जाँचें।</li>
            <li>किसी भी सहायता के लिए हमारी टीम से संपर्क करें।</li>
            <li>श्रद्धा एवं विश्वास के साथ उपयोग करें।</li>
          </ul>
          
          <div style="font-size: 10px; font-weight: bold; color: #4a2010; margin-bottom: 5px;">
            हमसे जुड़ें
          </div>
          <div style="font-size: 9px; color: #4b5563; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center; gap: 4px;"><span>📷</span> Instagram : @mantrapujaa</div>
            <div style="display: flex; align-items: center; gap: 4px;"><span>📘</span> Facebook : @mantrapujaa</div>
            <div style="display: flex; align-items: center; gap: 4px;"><span>▶️</span> YouTube : @MantraPujaOfficials</div>
          </div>
        </div>

        <!-- Column 4: Big QR Code & Team -->
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; border-left: 1.5px dashed #e5e7eb; padding-left: 10px; height: 100%;">
          <div style="font-size: 10px; font-weight: bold; color: #ea580c; margin-bottom: 4px; letter-spacing: 0.3px;">
            SCAN TO SHOP
          </div>
          ${footerQrDataUrl ? `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 3px; margin-bottom: 6px;">
            <img src="${footerQrDataUrl}" style="width: 75px; height: 75px; border: 1.5px solid #fbbf24; border-radius: 6px; padding: 2px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.02);" />
            <span style="font-size: 8px; font-weight: bold; color: #4a2010;">shop.mantrapuja.com</span>
          </div>
          ` : ''}
          <div style="font-size: 9px; color: #4a2010; font-weight: bold; line-height: 1.2; margin-top: auto;">
            <span style="color: #ea580c; display: block; margin-bottom: 1px;">🙏 जय श्री महाकाल 🙏</span>
            <span style="font-size: 8px; color: #6b7280; font-weight: normal;">MantraPuja Team</span>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(invoiceDiv);

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(invoiceDiv.querySelector('#invoice-capture') as HTMLElement, {
      scale: 2.2,
      useCORS: true,
      logging: false
    });
  } finally {
    document.body.removeChild(invoiceDiv);
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const imgWidth = 210;
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;
  const pageData = canvas.toDataURL('image/jpeg', 0.95);

  doc.addImage(pageData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    doc.addPage();
    doc.addImage(pageData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  return doc;
};

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  orders,
  setOrders,
  wishlist,
  onToggleWishlist,
  onAddToCart,
  onNavigateToShop,
  onNavigateToHome,
  onNavigateToOrders,
  products: productsProp,
  loggedInUser,
  onLogout,
  initialTab,
  onProfileUpdate,
  onNavigateToAffiliation,
}) => {
  const { language } = useLanguage();
  const { t } = useTranslation(['profile', 'wishlist', 'notifications', 'orderSuccess']);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    import('../lib/i18next').then(({ loadNamespaces }) => {
      loadNamespaces(language, ['profile', 'wishlist', 'notifications', 'orderSuccess']).then(() => setIsReady(true));
    });
  }, [language]);
  const [activeTab, setActiveTab] = React.useState<
    'info' | 'orders' | 'addresses' | 'wishlist' | 'notifications' | 'logout' | 'affiliate'
  >(initialTab || 'info');

  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' ? window.innerWidth <= 900 : false);
  const [mobileShowMenu, setMobileShowMenu] = React.useState(!initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      setMobileShowMenu(false);
    } else {
      setActiveTab('info');
      setMobileShowMenu(true);
    }
  }, [initialTab]);

  React.useEffect(() => {
    if (!loggedInUser?.phoneNumber) return;
    let isSubscribed = true;
    (async () => {
      try {
        const profile = await fetchUserProfile(loggedInUser.phoneNumber);
        if (isSubscribed && profile && profile.full_name && profile.full_name !== loggedInUser.fullName) {
          const updated = {
            ...loggedInUser,
            fullName: profile.full_name,
            email: profile.email || loggedInUser.email
          };
          onProfileUpdate?.(updated);
        }
      } catch (err) {
        console.warn('[UserProfilePage] Profile sync warning:', err);
      }
    })();
    return () => { isSubscribed = false; };
  }, [loggedInUser?.phoneNumber]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileShowMenu(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Affiliate State
  const [affiliateProfile, setAffiliateProfile] = React.useState<{
    affiliate_code: string;
    affiliate_status: string;
    joined_at: string;
    total_earned: number;
    pending_earnings: number;
    approved_earnings: number;
    available_balance: number;
  } | null>(null);
  const [, setAffiliateLoading] = React.useState(false);
  const [enrollmentStep, setEnrollmentStep] = React.useState<'none' | 'terms' | 'success'>('none');
  const [termsChecked, setTermsChecked] = React.useState(false);
  const [joiningProgram, setJoiningProgram] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  const [referralTree, setReferralTree] = React.useState<{
    user_id: string;
    full_name: string;
    referred_by: string;
    level: number;
    joined_at: string;
  }[]>([]);
  const [treeLoading, setTreeLoading] = React.useState(false);

  // Additional user-facing affiliate states
  const [commissions, setCommissions] = React.useState<any[]>([]);
  const [isLoadingCommissions, setIsLoadingCommissions] = React.useState(false);
  const [payoutHistory, setPayoutHistory] = React.useState<any[]>([]);
  const [isLoadingPayoutHistory, setIsLoadingPayoutHistory] = React.useState(false);
  const [isSubmittingPayout, setIsSubmittingPayout] = React.useState(false);
  const [payoutMethod, setPayoutMethod] = React.useState<'upi' | 'bank'>('upi');

  // Payment Verification States for Profile Orders History
  const [localScreenshots, setLocalScreenshots] = React.useState<Record<string, string>>({});
  const [barcodeSettings, setBarcodeSettings] = React.useState<{ upiId?: string; barcodeUrl?: string } | null>(null);
  const [uploadingOrderId, setUploadingOrderId] = React.useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = React.useState<Record<string, string>>({});
  const [copiedUpiOrderId, setCopiedUpiOrderId] = React.useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = React.useState<Record<string, File>>({});

  React.useEffect(() => {
    async function loadConfig() {
      try {
        const { data: barcodeData } = await supabase
          .from('website_settings')
          .select('value')
          .eq('key', 'payment_barcode_settings')
          .single();
        if (barcodeData && barcodeData.value) {
          const val = barcodeData.value as { upi_id?: string; barcode_url?: string };
          setBarcodeSettings({ upiId: val.upi_id, barcodeUrl: val.barcode_url });
        }
      } catch (err) {
        console.error('Barcode settings load error:', err);
      }
    }
    loadConfig();
  }, []);

  const handleOrderScreenshotUpload = async (orderId: string, file: File) => {
    if (!file) return;
    setUploadingOrderId(orderId);
    setUploadErrors(prev => ({ ...prev, [orderId]: '' }));
    try {
      const url = await uploadToR2(file, 'orders/proofs');
      
      const { error } = await supabase
        .from('website_store_orders')
        .update({ 
          payment_screenshot: url,
          payment_status: 'Pending'
        })
        .eq('order_id', orderId);
      
      if (error) throw error;
      
      setLocalScreenshots(prev => ({ ...prev, [orderId]: url }));
      if (setOrders) {
        setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, paymentScreenshot: url, paymentStatus: 'Pending' } : o));
      }

      // Clear selected file
      setSelectedFiles(prev => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    } catch (err) {
      console.error('Failed to upload proof of payment:', err);
      setUploadErrors(prev => ({ ...prev, [orderId]: 'Failed to upload screenshot. Please verify connection and try again.' }));
    } finally {
      setUploadingOrderId(null);
    }
  };

  const handleCopyOrderUpi = (orderId: string, upi: string) => {
    try {
      navigator.clipboard.writeText(upi);
      setCopiedUpiOrderId(orderId);
      setTimeout(() => setCopiedUpiOrderId(null), 2000);
    } catch (err) {
      console.error('Failed to copy UPI ID:', err);
    }
  };

  const handleUpiRedirect = (orderId: string, amount: number) => {
    const upi = barcodeSettings?.upiId || '7974478098@paytm';
    const uri = `upi://pay?pa=${upi}&pn=Mantra%20Puja&am=${amount.toFixed(2)}&cu=INR&tn=Order%20${orderId}`;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = uri;
    } else {
      alert("UPI App direct launching is only supported on mobile devices. Please scan the QR code to pay ₹" + amount.toFixed(2) + "!");
    }
  };

  const [upiId, setUpiId] = React.useState('');
  const [upiHolderName, setUpiHolderName] = React.useState('');
  const [bankHolderName, setBankHolderName] = React.useState('');
  const [bankAccountNumber, setBankAccountNumber] = React.useState('');
  const [bankIfsc, setBankIfsc] = React.useState('');
  const [bankName, setBankName] = React.useState('');
  const [referralSearch, setReferralSearch] = React.useState('');

  // Sharing & Toast states
  const shareMessage = '🙏 Join me on Mantra Puja and explore divine offerings! Bring peace, health & prosperity home. Access authentic Pujas, Yagnas and spiritual items here:';
  const [showInstagramTip, setShowInstagramTip] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };
  const [devoteeSubTab, setDevoteeSubTab] = React.useState<'network' | 'earnings' | 'payout'>('network');
  const [minWithdrawalLimit, setMinWithdrawalLimit] = React.useState<number>(1000);
  const [activeLevels, setActiveLevels] = React.useState<number[]>([1, 2, 3]);

  const [sharingOrderId, setSharingOrderId] = React.useState<string | null>(null);

  const handleDownloadInvoice = async (order: LocalOrder) => {
    try {
      const doc = await generateInvoiceDoc(order);
      doc.save(`Invoice-${order.orderId}.pdf`);
      triggerToast(`Downloaded invoice for #${order.orderId}!`);
    } catch (err) {
      console.error('Failed to download invoice:', err);
      triggerToast('Failed to download invoice.');
    }
  };

  const handleNativeShareInvoice = async (order: LocalOrder) => {
    setSharingOrderId(order.orderId);
    try {
      // Trigger a backend ping to execute the file-copy mechanism if not run yet
      try {
        await fetch('/api/r2-presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purpose: 'invoices', filename: 'ping.pdf', contentType: 'application/pdf', fileSize: 100 })
        }).catch(() => {});
      } catch (e) {}

      const firstItem = order.items?.[0];
      const productName = firstItem?.product?.name || (language === 'hi' ? 'विद्या रुद्राक्ष' : 'Vidya Rudraksh');
      const productPrice = firstItem?.product?.price;
      const productSlug = (firstItem?.product as any)?.slug || '';
      
      let blessingKey = 'orderSuccess:share.blessingText';
      const isVidyaRudraksh = productSlug.includes('vidya-rudraksh') || firstItem?.product?.name?.toLowerCase().includes('vidya');
      if (isVidyaRudraksh) {
        if (productPrice === 1001 || productSlug === 'vidya-rudraksh-1001') {
          blessingKey = 'orderSuccess:share.blessingText_1001';
        } else if (productPrice === 101 || productSlug === 'vidya-rudraksh-101') {
          blessingKey = 'orderSuccess:share.blessingText_101';
        } else if (productPrice === 1 || productSlug === 'vidya-rudraksh') {
          blessingKey = 'orderSuccess:share.blessingText_1';
        }
      }
      const productUrl = productSlug 
        ? `${window.location.origin}/product/${productSlug}` 
        : `${window.location.origin}/shop`;
      const blessingText = t(blessingKey, { productName, url: productUrl });
      const isNoImage = isVidyaRudraksh && (productPrice === 101 || productPrice === 1001 || productSlug === 'vidya-rudraksh-101' || productSlug === 'vidya-rudraksh-1001');

      if (isNoImage) {
        if (navigator.share) {
          await navigator.share({
            title: t('orderSuccess:share.title', 'Mantra Puja Blessings'),
            text: blessingText
          });
          return;
        } else {
          await navigator.clipboard.writeText(blessingText);
          triggerToast('Message & link copied to clipboard!');
          return;
        }
      }

      const cardBlob = await createProductShareCard();
      const cardFile = new File([cardBlob], 'VidyaRudraksh-Blessings.jpg', { type: 'image/jpeg' });

      // Try native share API with attached image file
      if (navigator.canShare && navigator.canShare({ files: [cardFile] })) {
        await navigator.share({
          files: [cardFile],
          title: t('orderSuccess:share.title', 'Mantra Puja Blessings'),
          text: blessingText
        });
        return;
      }

      // Fallback 1: Upload sharing card to Cloudflare R2 and share URL link
      const publicUrl = await uploadToR2(cardFile, 'referrals', true);
      const fallbackText = `${blessingText}\n\n👉 View Blessings Card: ${publicUrl}`;

      if (navigator.share) {
        await navigator.share({
          title: t('orderSuccess:share.title', 'Mantra Puja Blessings'),
          text: fallbackText
        });
        return;
      } else {
        // Fallback 2: copy to clipboard
        await navigator.clipboard.writeText(fallbackText);
        triggerToast('Message & link copied to clipboard!');
      }
    } catch (err: any) {
      console.error('Native share failed:', err);
      if (err?.name === 'AbortError') {
        return;
      }
      triggerToast(`Sharing failed: ${err?.message || String(err)}`);
    } finally {
      setSharingOrderId(null);
    }
  };

  const handleReorder = (order: LocalOrder) => {
    order.items.forEach((item) => {
      onAddToCart(item.product, item.quantity);
    });
    triggerToast(`Successfully reordered ${order.items.length} sacred products!`);
  };

  const fetchAffiliateProfile = React.useCallback(async () => {
    if (!loggedInUser) return;
    const token = localStorage.getItem('session_token') || '260529';
    setAffiliateLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_affiliate_profile', {
        p_session_token: token
      });
      if (error) {
        console.warn('Failed to retrieve affiliate profile:', error.message);
      }
      if (data && data.length > 0 && data[0].affiliate_code) {
        setAffiliateProfile(data[0]);
      } else {
        setAffiliateProfile(null);
      }
    } catch (err) {
      console.error('Error in fetchAffiliateProfile:', err);
    } finally {
      setAffiliateLoading(false);
    }
  }, [loggedInUser]);

  const fetchAffiliateSettings = React.useCallback(async () => {
    try {
      // Fetch minimum withdrawal limit
      const { data: settingsData } = await supabase
        .from('affiliate_settings')
        .select('value')
        .eq('key', 'payout_rules')
        .single();
      
      if (settingsData && settingsData.value) {
        const rules = settingsData.value as Record<string, any>;
        if (rules.min_withdrawal_amount !== undefined) {
          setMinWithdrawalLimit(parseFloat(rules.min_withdrawal_amount));
        }
      }

      // Fetch active levels
      const { data: levelsData } = await supabase
        .from('affiliate_levels')
        .select('level_number')
        .eq('enabled', true)
        .order('level_number', { ascending: true });
      
      if (levelsData) {
        setActiveLevels(levelsData.map(l => l.level_number));
      }
    } catch (err) {
      console.error('Error fetching affiliate settings:', err);
    }
  }, []);

  const fetchReferralTree = React.useCallback(async () => {
    if (!loggedInUser) return;
    const token = localStorage.getItem('session_token') || '260529';
    setTreeLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_referral_tree_by_session', {
        p_session_token: token,
        p_max_depth: 5
      });
      if (error) {
        console.warn('Failed to retrieve referral tree:', error.message);
      }
      if (data) {
        setReferralTree(data);
      }
    } catch (err) {
      console.error('Error in fetchReferralTree:', err);
    } finally {
      setTreeLoading(false);
    }
  }, [loggedInUser]);

  const getShareOrigin = () => {
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'https://mantrapuja.com';
    }
    return origin;
  };

  const handleNativeShare = async () => {
    if (!affiliateProfile?.affiliate_code) return;
    const code = affiliateProfile.affiliate_code;
    const shareOrigin = getShareOrigin();
    const referralUrl = `${shareOrigin}?ref=${code}`;
    
    triggerToast('Generating blessings card...');
    try {
      const cardBlob = await createReferralShareCard(referralUrl);
      const cardFile = new File([cardBlob], `MantraPuja-Blessings-Card.png`, { type: 'image/png' });
      const filesArray = [cardFile];
      
      const cardUrl = await uploadReferralShareCard(referralUrl, code);
      const shareUrl = `${shareOrigin}/share?ref=${code}&card=${encodeURIComponent(cardUrl)}`;
      const fullMessage = `${shareMessage}\n${shareUrl}`;
      
      if (navigator.canShare && navigator.canShare({ files: filesArray })) {
        await navigator.share({
          title: 'Mantra Puja Referral',
          text: fullMessage,
          url: shareUrl,
          files: filesArray
        });
        triggerToast('Blessings shared successfully!');
      } else if (navigator.share) {
        await navigator.share({
          title: 'Mantra Puja Referral',
          text: fullMessage,
          url: shareUrl
        });
        triggerToast('Shared link & message successfully!');
      } else {
        throw new Error('Native share not supported.');
      }
    } catch (err) {
      console.error('Web Share API error:', err);
      try {
        const cardBlob = await createReferralShareCard(referralUrl);
        const cardUrl = await uploadReferralShareCard(referralUrl, code);
        const shareUrl = `${shareOrigin}/share?ref=${code}&card=${encodeURIComponent(cardUrl)}`;
        const fullMessage = `${shareMessage}\n${shareUrl}`;
        
        try {
          const item = new ClipboardItem({ 'image/png': cardBlob });
          await navigator.clipboard.write([item]);
          triggerToast('Blessings card image copied to clipboard! Paste it to share.');
        } catch {
          await navigator.clipboard.writeText(fullMessage);
          triggerToast('Message & link copied to clipboard!');
        }
      } catch (innerErr) {
        const fallbackUrl = `${shareOrigin}?ref=${code}`;
        const fullMessage = `${shareMessage}\n${fallbackUrl}`;
        await navigator.clipboard.writeText(fullMessage);
        triggerToast('Link copied to clipboard!');
      }
    }
  };

  const handleWhatsappShare = async () => {
    if (!affiliateProfile?.affiliate_code) return;
    const code = affiliateProfile.affiliate_code;
    const shareOrigin = getShareOrigin();
    const referralUrl = `${shareOrigin}?ref=${code}`;
    
    triggerToast('Preparing blessings card...');
    try {
      const cardBlob = await createReferralShareCard(referralUrl);
      const cardUrl = await uploadReferralShareCard(referralUrl, code);
      const shareUrl = `${shareOrigin}/share?ref=${code}&card=${encodeURIComponent(cardUrl)}`;
      const fullMessage = `${shareMessage}\n${shareUrl}`;
      
      try {
        const item = new ClipboardItem({ 'image/png': cardBlob });
        await navigator.clipboard.write([item]);
        triggerToast('Blessings image copied! Open WhatsApp & Paste.');
      } catch {
        await navigator.clipboard.writeText(fullMessage);
        triggerToast('Referral link copied!');
      }
      
      setTimeout(() => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`, '_blank');
      }, 1200);
    } catch (err) {
      console.error('Failed to generate referral card image:', err);
      const fallbackUrl = `${shareOrigin}?ref=${code}`;
      const fullMessage = `${shareMessage}\n${fallbackUrl}`;
      await navigator.clipboard.writeText(fullMessage);
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`, '_blank');
    }
  };

  const handleFacebookShare = async () => {
    if (!affiliateProfile?.affiliate_code) return;
    const code = affiliateProfile.affiliate_code;
    const shareOrigin = getShareOrigin();
    const referralUrl = `${shareOrigin}?ref=${code}`;
    
    triggerToast('Preparing Facebook sharing...');
    try {
      const cardBlob = await createReferralShareCard(referralUrl);
      const cardUrl = await uploadReferralShareCard(referralUrl, code);
      const shareUrl = `${shareOrigin}/share?ref=${code}&card=${encodeURIComponent(cardUrl)}`;
      const fullMessage = `${shareMessage}\n${shareUrl}`;
      
      try {
        const item = new ClipboardItem({ 'image/png': cardBlob });
        await navigator.clipboard.write([item]);
        triggerToast('Blessings image copied! Open Facebook & Paste.');
      } catch {
        await navigator.clipboard.writeText(fullMessage);
      }
      
      setTimeout(() => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
      }, 1200);
    } catch (err) {
      console.error(err);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`, '_blank');
    }
  };

  const handleTwitterShare = async () => {
    if (!affiliateProfile?.affiliate_code) return;
    const code = affiliateProfile.affiliate_code;
    const shareOrigin = getShareOrigin();
    const referralUrl = `${shareOrigin}?ref=${code}`;
    
    triggerToast('Preparing Twitter sharing...');
    try {
      const cardBlob = await createReferralShareCard(referralUrl);
      const cardUrl = await uploadReferralShareCard(referralUrl, code);
      const shareUrl = `${shareOrigin}/share?ref=${code}&card=${encodeURIComponent(cardUrl)}`;
      const fullMessage = `${shareMessage}\n${shareUrl}`;
      
      try {
        const item = new ClipboardItem({ 'image/png': cardBlob });
        await navigator.clipboard.write([item]);
        triggerToast('Blessings image copied! Open Twitter & Paste.');
      } catch {
        await navigator.clipboard.writeText(fullMessage);
      }
      
      setTimeout(() => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(fullMessage)}`, '_blank');
      }, 1200);
    } catch (err) {
      console.error(err);
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(referralUrl)}`, '_blank');
    }
  };

  const handleLinkedinShare = async () => {
    if (!affiliateProfile?.affiliate_code) return;
    const code = affiliateProfile.affiliate_code;
    const shareOrigin = getShareOrigin();
    const referralUrl = `${shareOrigin}?ref=${code}`;
    
    triggerToast('Preparing LinkedIn sharing...');
    try {
      const cardBlob = await createReferralShareCard(referralUrl);
      const cardUrl = await uploadReferralShareCard(referralUrl, code);
      const shareUrl = `${shareOrigin}/share?ref=${code}&card=${encodeURIComponent(cardUrl)}`;
      const fullMessage = `${shareMessage}\n${shareUrl}`;
      
      try {
        const item = new ClipboardItem({ 'image/png': cardBlob });
        await navigator.clipboard.write([item]);
        triggerToast('Blessings image copied! Open LinkedIn & Paste.');
      } catch {
        await navigator.clipboard.writeText(fullMessage);
      }
      
      setTimeout(() => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
      }, 1200);
    } catch (err) {
      console.error(err);
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`, '_blank');
    }
  };

  const handleInstagramShare = async () => {
    if (!affiliateProfile?.affiliate_code) return;
    const code = affiliateProfile.affiliate_code;
    const shareOrigin = getShareOrigin();
    const referralUrl = `${shareOrigin}?ref=${code}`;
    
    triggerToast('Referral link copied! Generating card...');
    try {
      const cardBlob = await createReferralShareCard(referralUrl);
      const cardUrl = await uploadReferralShareCard(referralUrl, code);
      const shareUrl = `${shareOrigin}/share?ref=${code}&card=${encodeURIComponent(cardUrl)}`;
      const fullMessage = `${shareMessage}\n${shareUrl}`;
      
      try {
        const item = new ClipboardItem({ 'image/png': cardBlob });
        await navigator.clipboard.write([item]);
        triggerToast('Blessings image copied! Story tutorial opening...');
      } catch {
        await navigator.clipboard.writeText(fullMessage);
      }
    } catch (e) {
      console.error('Error sharing blessings card:', e);
      await navigator.clipboard.writeText(referralUrl);
    }
    setShowInstagramTip(true);
  };

  const fetchCommissionsHistory = React.useCallback(async () => {
    if (!loggedInUser) return;
    const token = localStorage.getItem('session_token') || '260529';
    setIsLoadingCommissions(true);
    try {
      const { data, error } = await supabase.rpc('get_commissions_history_by_session', {
        p_session_token: token
      });
      if (error) {
        console.warn('Failed to retrieve commissions history:', error.message);
      }
      if (data) {
        setCommissions(data);
      }
    } catch (err) {
      console.error('Error in fetchCommissionsHistory:', err);
    } finally {
      setIsLoadingCommissions(false);
    }
  }, [loggedInUser]);

  const fetchPayoutHistory = React.useCallback(async () => {
    if (!loggedInUser) return;
    const token = localStorage.getItem('session_token') || '260529';
    setIsLoadingPayoutHistory(true);
    try {
      const { data, error } = await supabase.rpc('get_withdrawal_history_by_session', {
        p_session_token: token
      });
      if (error) {
        console.warn('Failed to retrieve payout history:', error.message);
      }
      if (data) {
        setPayoutHistory(data);
      }
    } catch (err) {
      console.error('Error in fetchPayoutHistory:', err);
    } finally {
      setIsLoadingPayoutHistory(false);
    }
  }, [loggedInUser]);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser || !affiliateProfile) return;
    
    const token = localStorage.getItem('session_token') || '260529';

    if (affiliateProfile.affiliate_status === 'suspended') {
      alert('Your affiliate account has been suspended. Please contact support for assistance.');
      return;
    }
    
    if (affiliateProfile.available_balance < minWithdrawalLimit) {
      alert(`Your available balance is below the minimum withdrawal threshold of ₹${minWithdrawalLimit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`);
      return;
    }

    let details: Record<string, string> = {};
    if (payoutMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        alert('Please enter a valid UPI ID (e.g. name@upi).');
        return;
      }
      if (!upiHolderName.trim()) {
        alert('Please enter account holder name.');
        return;
      }
      details = {
        upi_id: upiId.trim(),
        account_holder_name: upiHolderName.trim()
      };
    } else {
      if (!bankHolderName.trim() || !bankAccountNumber.trim() || !bankIfsc.trim() || !bankName.trim()) {
        alert('Please fill out all bank transfer fields.');
        return;
      }
      if (bankAccountNumber.trim().length < 9 || bankAccountNumber.trim().length > 18) {
        alert('Bank account number should be between 9 and 18 digits.');
        return;
      }
      if (bankIfsc.trim().length !== 11) {
        alert('IFSC Code must be exactly 11 characters.');
        return;
      }
      details = {
        account_name: bankHolderName.trim(),
        account_number: bankAccountNumber.trim(),
        ifsc_code: bankIfsc.trim().toUpperCase(),
        bank_name: bankName.trim()
      };
    }

    const confirmMsg = `Are you sure you want to request a payout of ₹${affiliateProfile.available_balance.toFixed(2)}? This amount will be locked until processing is complete.`;
    if (!confirm(confirmMsg)) return;

    setIsSubmittingPayout(true);
    try {
      const { data, error } = await supabase.rpc('create_withdrawal_request', {
        p_session_token: token,
        p_amount: affiliateProfile.available_balance,
        p_method: payoutMethod,
        p_details: details
      });
      if (error) throw error;
      if (data) {
        alert('Payout request submitted successfully! Funds have been reserved for admin review.');
        setUpiId('');
        setUpiHolderName('');
        setBankHolderName('');
        setBankAccountNumber('');
        setBankIfsc('');
        setBankName('');
        
        await fetchAffiliateProfile();
        await fetchPayoutHistory();
      }
    } catch (err) {
      console.error('Failed to submit payout request:', err);
      alert('Error: ' + (err as Error).message);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'affiliate') {
      fetchAffiliateProfile();
      fetchReferralTree();
      fetchCommissionsHistory();
      fetchPayoutHistory();
      fetchAffiliateSettings();
    }
  }, [loggedInUser, activeTab, fetchAffiliateProfile, fetchReferralTree, fetchCommissionsHistory, fetchPayoutHistory, fetchAffiliateSettings]);

  const filteredReferralTree = React.useMemo(() => {
    return referralTree.filter(n => activeLevels.includes(n.level));
  }, [referralTree, activeLevels]);



  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const lowerQuery = query.toLowerCase();
    const index = text.toLowerCase().indexOf(lowerQuery);
    if (index === -1) return text;

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return (
      <span>
        {before}
        <mark style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '1px 2px', borderRadius: '2px' }}>{match}</mark>
        {after}
      </span>
    );
  };


  const handleJoinAffiliate = async () => {
    if (!loggedInUser) {
      alert('Please log in to participate in the program.');
      return;
    }
    const token = localStorage.getItem('session_token') || '260529';
    setJoiningProgram(true);
    try {
      const { data, error } = await supabase.rpc('join_affiliate_program', {
        p_session_token: token
      });
      if (error) throw error;
      if (data && data.length > 0) {
        const profile = data[0];
        setAffiliateProfile({
          affiliate_code: profile.affiliate_code,
          affiliate_status: profile.affiliate_status,
          joined_at: profile.affiliate_joined_at,
          total_earned: 0.00,
          pending_earnings: 0.00,
          approved_earnings: 0.00,
          available_balance: 0.00
        });
        setEnrollmentStep('success');
      }
    } catch (err) {
      console.error('Failed to register devotee as affiliate:', err);
      alert('Failed to register: ' + (err as Error).message);
    } finally {
      setJoiningProgram(false);
    }
  };

  // User Profile State
  const [userProfile, setUserProfile] = React.useState({
    name: 'Sahil Patel',
    email: 'sahil.patel@devotion.com',
    phone: '+91 98765 43210',
    spiritualGoal: 'Peace & Daily Rituals',
    avatarAura: 'Golden Radiance',
  });

  React.useEffect(() => {
    if (loggedInUser) {
      const isPlaceholder = loggedInUser.email && loggedInUser.email.startsWith('devotee_') && loggedInUser.email.endsWith('@spiritual.com');
      const savedGoal = localStorage.getItem(`spiritual_goal_${loggedInUser.id}`);
      setUserProfile(prev => ({
        ...prev,
        name: loggedInUser.fullName || '',
        email: isPlaceholder ? '' : (loggedInUser.email || ''),
        phone: loggedInUser.phoneNumber,
        spiritualGoal: savedGoal || prev.spiritualGoal
      }));
      setNewAddress(prev => ({
        ...prev,
        name: loggedInUser.fullName || ''
      }));
      fetchAddresses();
    } else {
      setAddresses([]);
    }
  }, [loggedInUser]);
  const [profileSuccessMessage, setProfileSuccessMessage] = React.useState('');

  // Saved Addresses State
  const [addresses, setAddresses] = React.useState<Address[]>([]);

  const fetchAddresses = React.useCallback(async () => {
    if (!loggedInUser) return;
    try {
      const token = localStorage.getItem('session_token') || '';
      const response = await fetch(`/api/customer/addresses?sessionToken=${token}`);
      if (!response.ok) throw new Error('Failed to fetch addresses');
      const data = await response.json();

      if (data) {
        const mapped: Address[] = data.map((item: any) => ({
          id: item.id,
          type: item.type,
          name: item.name,
          phone: item.phone,
          street: item.street,
          city: item.city,
          state: item.state,
          zip: item.zip,
          isDefault: item.is_default
        }));
        setAddresses(mapped);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  }, [loggedInUser]);

  const [showAddAddressForm, setShowAddAddressForm] = React.useState(false);
  const [addressSuccessMessage, setAddressSuccessMessage] = React.useState('');
  const [newAddress, setNewAddress] = React.useState({
    type: 'Home',
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
  });

  // Notifications State
  const [notificationSettings, setNotificationSettings] = React.useState({
    emailSpiritual: true,
    emailOrders: true,
    whatsappUpdates: true,
    smsAlerts: false,
    dailyIntention: true,
  });
  const [notifSuccessMessage, setNotifSuccessMessage] = React.useState('');

  // Wishlist synchronized items
  const wishlistedProducts = (productsProp || []).filter((p) => wishlist[p.id]);

  // Map orders from prop
  const allOrders = React.useMemo(() => {
    return orders.map((o) => ({
      id: o.orderId,
      date: new Date(o.placedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      total: o.total,
      paymentMethod: o.paymentMethod,
      status: o.status,
      paymentStatus: o.paymentStatus || 'Pending',
      paymentDeclineCount: o.paymentDeclineCount || 0,
      paymentScreenshot: localScreenshots[o.orderId] || o.paymentScreenshot,
      items: o.items.map((i) => ({
        name: i.product.name,
        qty: i.quantity,
        price: i.product.price,
        image: i.product.image,
      })),
      rawOrder: o,
    }));
  }, [orders, localScreenshots]);

  // Feedback Messages auto-clear
  React.useEffect(() => {
    if (profileSuccessMessage) {
      const timer = setTimeout(() => setProfileSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [profileSuccessMessage]);

  React.useEffect(() => {
    if (addressSuccessMessage) {
      const timer = setTimeout(() => setAddressSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [addressSuccessMessage]);

  React.useEffect(() => {
    if (notifSuccessMessage) {
      const timer = setTimeout(() => setNotifSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [notifSuccessMessage]);

  // Profile Edit Save
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) return;
    setIsSavingProfile(true);
    try {
      const trimmedEmail = userProfile.email ? userProfile.email.trim() : '';
      const emailToSave = trimmedEmail !== '' ? trimmedEmail : null;

      const { error } = await supabase
        .from('website_store_users')
        .update({
          full_name: userProfile.name,
          email: emailToSave,
          phone_number: userProfile.phone
        })
        .eq('id', loggedInUser.id);

      if (error) throw error;

      // Save spiritual goal to localStorage
      localStorage.setItem(`spiritual_goal_${loggedInUser.id}`, userProfile.spiritualGoal);

      if (onProfileUpdate) {
        onProfileUpdate({
          id: loggedInUser.id,
          fullName: userProfile.name,
          email: emailToSave || '',
          phoneNumber: userProfile.phone
        });
      }

      setProfileSuccessMessage('Spiritual Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Error updating profile: ' + (err as Error).message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleResetProfile = () => {
    if (loggedInUser) {
      const isPlaceholder = loggedInUser.email && loggedInUser.email.startsWith('devotee_') && loggedInUser.email.endsWith('@spiritual.com');
      const savedGoal = localStorage.getItem(`spiritual_goal_${loggedInUser.id}`);
      setUserProfile({
        name: loggedInUser.fullName || '',
        email: isPlaceholder ? '' : (loggedInUser.email || ''),
        phone: loggedInUser.phoneNumber,
        spiritualGoal: savedGoal || 'Peace & Daily Rituals',
        avatarAura: 'Golden Radiance'
      });
    }
  };

  // Add Address Save
  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) {
      alert('Please log in to save addresses.');
      return;
    }
    if (
      !newAddress.phone ||
      !newAddress.street ||
      !newAddress.city ||
      !newAddress.state ||
      !newAddress.zip
    ) {
      alert('Please fill out all address details.');
      return;
    }

    const isDefault = addresses.length === 0;
    const addressData = {
      user_id: loggedInUser.id,
      type: newAddress.type || 'Other Address',
      name: newAddress.name || loggedInUser.fullName || 'Devotee',
      phone: newAddress.phone,
      street: newAddress.street,
      city: newAddress.city,
      state: newAddress.state,
      zip: newAddress.zip,
      is_default: isDefault,
    };

    try {
      const token = localStorage.getItem('session_token') || '';
      const response = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionToken: token,
          type: addressData.type,
          name: addressData.name,
          phone: addressData.phone,
          street: addressData.street,
          city: addressData.city,
          state: addressData.state,
          zip: addressData.zip,
          is_default: addressData.is_default
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server error saving address');
      }

      const data = await response.json();

      if (data) {
        const added: Address = {
          id: data.id,
          type: data.type,
          name: data.name,
          phone: data.phone,
          street: data.street,
          city: data.city,
          state: data.state,
          zip: data.zip,
          isDefault: data.is_default,
        };
        setAddresses([...addresses, added]);
      }
      
      setShowAddAddressForm(false);
      setNewAddress({
        type: 'Home',
        name: loggedInUser.fullName || '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zip: '',
      });
      setAddressSuccessMessage('New address saved to dashboard.');
    } catch (err) {
      console.error('Failed to save address:', err);
      alert('Error saving address. Please try again.');
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id: string) => {
    if (!loggedInUser) return;
    try {
      const token = localStorage.getItem('session_token') || '';
      const response = await fetch('/api/customer/addresses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          addressId: id,
          sessionToken: token
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server error deleting address');
      }

      const deletedAddr = addresses.find((a) => a.id === id);
      const nextAddresses = addresses.filter((a) => a.id !== id);
      
      // If we deleted the default, set first remaining as default
      if (deletedAddr?.isDefault && nextAddresses.length > 0) {
        const newDefault = nextAddresses[0];
        const updateResponse = await fetch('/api/customer/addresses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionToken: token,
            id: newDefault.id,
            type: newDefault.type,
            name: newDefault.name,
            phone: newDefault.phone,
            street: newDefault.street,
            city: newDefault.city,
            state: newDefault.state,
            zip: newDefault.zip,
            is_default: true
          })
        });

        if (!updateResponse.ok) {
          const errData = await updateResponse.json().catch(() => ({}));
          throw new Error(errData.error || 'Server error setting default address');
        }

        newDefault.isDefault = true;
      }
      
      setAddresses(nextAddresses);
      setAddressSuccessMessage('Address removed successfully.');
    } catch (err) {
      console.error('Failed to delete address:', err);
      alert('Error deleting address. Please try again.');
    }
  };

  // Set Default Address
  const handleSetDefaultAddress = async (id: string) => {
    if (!loggedInUser) return;
    try {
      const token = localStorage.getItem('session_token') || '';
      const target = addresses.find(a => a.id === id);
      if (!target) return;

      const response = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionToken: token,
          id: target.id,
          type: target.type,
          name: target.name,
          phone: target.phone,
          street: target.street,
          city: target.city,
          state: target.state,
          zip: target.zip,
          is_default: true
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server error setting default address');
      }

      setAddresses(
        addresses.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      );
      setAddressSuccessMessage('Primary delivery address updated.');
    } catch (err) {
      console.error('Failed to set default address:', err);
      alert('Error updating default address. Please try again.');
    }
  };

  // Notification Preference Save
  const handleSaveNotifications = () => {
    setNotifSuccessMessage(t('notifications:saveSuccess', { defaultValue: 'Devotional communication channels updated!' }));
  };

  // Secure Logout simulation
  const [logoutConfirmed, setLogoutConfirmed] = React.useState(false);
  const handleLogoutAction = () => {
    setLogoutConfirmed(true);
    setTimeout(() => {
      if (onLogout) {
        onLogout();
      } else {
        onNavigateToHome();
      }
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return { bg: '#dcfce7', text: '#15803d' };
      case 'Shipped':
        return { bg: '#dbeafe', text: '#1d4ed8' };
      case 'Ready for Dispatch':
        return { bg: '#fef3c7', text: '#d97706' }; // Amber/Yellow
      case 'Payment Pending':
        return { bg: '#fff7ed', text: '#c2410c' };
      default:
        return { bg: 'var(--primary-lime-light)', text: 'var(--primary-lime)' };
    }
  };

  const getCategoryGradient = (cat?: string) => {
    if (!cat) {
      return 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)';
    }
    switch (cat.toLowerCase()) {
      case 'rudraksha':
      case 'tulsi mala':
      case 'crystal mala':
        return 'linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 100%)';
      case 'shiva nataraja':
      case 'shiva murti':
      case 'ganesh murti':
      case 'hanuman murti':
      case 'lakshmi murti':
        return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
      default:
        return 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)';
    }
  };

  if (!isReady) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--text-muted)' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '80vh', paddingBottom: '80px' }}>
      
      {/* Dynamic Devotional Keyframe Animations */}
      <style>{`
        @keyframes floatDevotee {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
          100% { transform: translateY(0px); }
        }
        @keyframes auraGlow {
          0% { box-shadow: 0 0 15px rgba(251, 191, 36, 0.45), 0 0 0 4px rgba(255, 255, 255, 0.2); }
          50% { box-shadow: 0 0 35px rgba(251, 191, 36, 0.8), 0 0 0 6px rgba(251, 191, 36, 0.25); }
          100% { box-shadow: 0 0 15px rgba(251, 191, 36, 0.45), 0 0 0 4px rgba(255, 255, 255, 0.2); }
        }
        @keyframes bgShiftDevotional {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes rotateMandala {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .devotional-gradient-header {
          background: linear-gradient(135deg, #450a0a 0%, #7f1d1d 30%, #c2410c 65%, #d97706 100%);
          background-size: 200% 200%;
          animation: bgShiftDevotional 12s ease-in-out infinite;
        }
        .floating-devotee-avatar {
          animation: floatDevotee 4s ease-in-out infinite, auraGlow 3s ease-in-out infinite;
        }
      `}</style>
      
      {/* 1. Header Banner */}
      <section className="devotional-gradient-header" style={{
        color: '#ffffff',
        padding: '72px 0 54px 0',
        borderBottom: '4px solid var(--primary-lime)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 -10px 25px rgba(0,0,0,0.15)'
      }}>
        {/* Shanti aura background glow */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        {/* 100% Lightweight Rotating Sahasrara Lotus Mandala SVG (0ms load time) */}
        <svg viewBox="0 0 100 100" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '340px',
          height: '340px',
          marginTop: '-170px',
          marginLeft: '-170px',
          opacity: 0.09,
          transformOrigin: 'center',
          animation: 'rotateMandala 50s linear infinite',
          pointerEvents: 'none',
          zIndex: 2
        }}>
          <circle cx="50" cy="50" r="45" fill="none" stroke="#ffffff" strokeWidth="0.4" strokeDasharray="3,3" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="#ffffff" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="25" fill="none" stroke="#ffffff" strokeWidth="0.4" strokeDasharray="2,2" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <g transform={`rotate(${deg} 50 50)`} key={deg}>
              <path d="M50 5 C55 20, 55 35, 50 50 C45 35, 45 20, 50 5" fill="none" stroke="#ffffff" strokeWidth="0.5" />
              <path d="M50 15 C53 25, 53 35, 50 45 C47 35, 47 25, 50 15" fill="none" stroke="#ffffff" strokeWidth="0.3" opacity="0.6" />
            </g>
          ))}
        </svg>

        <div className="container" style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          
          {/* Avatar Area with golden sunset aura and breathing glow */}
          <div className="floating-devotee-avatar" style={{
            position: 'relative',
            width: '108px',
            height: '108px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fde047 0%, #f97316 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            border: '4px solid #ffffff',
            transition: 'transform 0.3s ease',
            cursor: 'pointer'
          }}>
            {/* Custom Meditating Devotee SVG */}
            <svg viewBox="0 0 100 100" style={{ width: '68px', height: '68px' }}>
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
              
              {/* Head */}
              <circle cx="50" cy="35" r="9" fill="#fed7aa" />
              {/* Hair */}
              <path d="M41 33c0-8 18-8 18 0 2 0 3-2 3-4 0-6-6-10-12-10s-12 4-12 10c0 2 1 4 3 4z" fill="#1e293b" />
              {/* Closed eyes lines */}
              <path d="M46 36.5c0.5 0.5 1.5 0.5 2 0M52 36.5c0.5 0.5 1.5 0.5 2 0" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              {/* Tilak / Devotional mark */}
              <path d="M49 28h2v5h-2z" fill="#dc2626" />
              
              {/* Body / Shirt */}
              <path d="M33 58c0-10 11-12 17-12s17 2 17 12v9H33v-9z" fill="#0d9488" />
              
              {/* Meditating Hands & Legs (Lotus position) */}
              <path d="M24 70c0-6 10-6 14-3M76 70c0-6-10-6-14-3" stroke="#fed7aa" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              {/* Lotus legs folded */}
              <path d="M26 70c10-2 38-2 48 0" stroke="#fb923c" strokeWidth="5.5" strokeLinecap="round" fill="none" />
              
              {/* Praying/resting hands skin details */}
              <circle cx="39" cy="65" r="3" fill="#fed7aa" />
              <circle cx="61" cy="65" r="3" fill="#fed7aa" />
            </svg>

            {/* Devotee Rank Badge */}
            <div style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              backgroundColor: '#eab308',
              color: '#ffffff',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: '2px solid #ffffff'
            }} title="Spiritual Devotee Rank">
              <Sparkles size={13} />
            </div>
          </div>

          <h1 style={{
            fontSize: isMobile ? '1.8rem' : '2.3rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.3px',
            textShadow: '0 2px 4px rgba(0,0,0,0.15)'
          }}>
            Namaste, {userProfile.name}
          </h1>

          {/* Glassmorphic contact & goal badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginTop: '12px'
          }}>
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.82rem',
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 500
            }}>
              {userProfile.email}
            </span>
            <span style={{
              backgroundColor: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              backdropFilter: 'blur(10px)',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.82rem',
              color: '#fef08a',
              fontWeight: 700,
              letterSpacing: '0.2px'
            }}>
              ✨ {userProfile.spiritualGoal}
            </span>
          </div>

        </div>
      </section>

      {/* 2. Main Dashboard Layout Container */}
      <div className="container" style={{ marginTop: '40px' }}>
        {isMobile && mobileShowMenu ? (
          /* Mobile Menu Index View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 8px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px', textAlign: 'left' }}>
              {t('tabs.accountSettings')}
            </h2>
            
            {[
              { tab: 'info', label: t('tabs.info'), desc: t('tabs.infoDesc'), icon: <User size={20} color="var(--primary-lime)" />, badge: null },
              { tab: 'orders', label: t('tabs.orders'), desc: t('tabs.ordersDesc'), icon: <Package size={20} color="#3b82f6" />, badge: allOrders.length > 0 ? allOrders.length : null },
              { tab: 'addresses', label: t('tabs.addresses'), desc: t('tabs.addressesDesc'), icon: <MapPin size={20} color="#10b981" />, badge: null },
              { tab: 'wishlist', label: t('tabs.wishlist'), desc: t('tabs.wishlistDesc'), icon: <Heart size={20} color="#ec4899" />, badge: wishlistedProducts.length > 0 ? wishlistedProducts.length : null },
              { tab: 'notifications', label: t('tabs.notifications'), desc: t('tabs.notificationsDesc'), icon: <Bell size={20} color="#f59e0b" />, badge: null },
              { tab: 'affiliate', label: t('tabs.affiliate'), desc: t('tabs.affiliateDesc'), icon: <Sparkles size={20} color="#8b5cf6" />, badge: affiliateProfile && affiliateProfile.affiliate_status === 'active' ? t('affiliate.status.active') : null },
            ].map((item) => (
              <button
                key={item.tab}
                onClick={() => {
                  if (item.tab === 'affiliate') {
                    if (!affiliateProfile || affiliateProfile.affiliate_status !== 'active') {
                      if (onNavigateToAffiliation) {
                        onNavigateToAffiliation();
                        return;
                      }
                    }
                  }
                  setActiveTab(item.tab as any);
                  setMobileShowMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-light)',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  outline: 'none'
                }}
                className="profile-mobile-menu-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--primary-lime-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>{item.label}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{item.desc}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.badge !== null && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      backgroundColor: item.tab === 'affiliate' ? '#fff7ed' : 'var(--primary-lime-light)',
                      color: item.tab === 'affiliate' ? '#c2410c' : 'var(--primary-lime)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      border: item.tab === 'affiliate' ? '1.5px solid #ffedd5' : '1px solid var(--border-light)'
                    }}>
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              </button>
            ))}

            <div style={{ height: '1px', backgroundColor: 'var(--border-light)', margin: '12px 0' }} />

            {/* Logout button */}
            <button
              onClick={() => {
                setActiveTab('logout');
                setMobileShowMenu(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #fee2e2',
                backgroundColor: '#fffbfa',
                textAlign: 'left',
                cursor: 'pointer',
                width: '100%',
                outline: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <LogOut size={20} color="#dc2626" />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#dc2626', margin: 0 }}>Secure Logout</h4>
                  <p style={{ fontSize: '0.78rem', color: '#f87171', margin: '2px 0 0 0' }}>Sign out of your active session</p>
                </div>
              </div>
              <ChevronRight size={16} color="#f87171" />
            </button>
          </div>
        ) : (
          /* Normal Dashboard Layout */
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '260px 1fr',
            gap: isMobile ? '20px' : '40px',
            alignItems: 'start'
          }} className="hero-grid-split">
            
            {/* Dashboard Left Sidebar Tabs (desktop only) */}
            {!isMobile && (
              <aside style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                padding: '16px',
                boxShadow: 'var(--shadow-sm)'
              }} className="profile-sidebar-wrapper">
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`profile-nav-btn ${activeTab === 'info' ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      fontWeight: activeTab === 'info' ? 700 : 500,
                      backgroundColor: activeTab === 'info' ? 'var(--primary-lime-light)' : 'transparent',
                      color: activeTab === 'info' ? 'var(--primary-lime)' : 'var(--text-dark)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <User size={18} />
                    <span>{t('tabs.info')}</span>
                  </button>

                  <button
                    onClick={onNavigateToOrders}
                    className={`profile-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      fontWeight: activeTab === 'orders' ? 700 : 500,
                      backgroundColor: activeTab === 'orders' ? 'var(--primary-lime-light)' : 'transparent',
                      color: activeTab === 'orders' ? 'var(--primary-lime)' : 'var(--text-dark)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Package size={18} />
                    <span>{t('tabs.orders')}</span>
                    {allOrders.length > 0 && (
                      <span style={{
                        marginLeft: 'auto',
                        backgroundColor: activeTab === 'orders' ? 'var(--primary-lime)' : 'var(--border-light)',
                        color: activeTab === 'orders' ? 'var(--text-dark)' : 'var(--text-muted)',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)'
                      }}>
                        {allOrders.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('addresses')}
                    className={`profile-nav-btn ${activeTab === 'addresses' ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      fontWeight: activeTab === 'addresses' ? 700 : 500,
                      backgroundColor: activeTab === 'addresses' ? 'var(--primary-lime-light)' : 'transparent',
                      color: activeTab === 'addresses' ? 'var(--primary-lime)' : 'var(--text-dark)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <MapPin size={18} />
                    <span>{t('tabs.addresses')}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('wishlist')}
                    className={`profile-nav-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      fontWeight: activeTab === 'wishlist' ? 700 : 500,
                      backgroundColor: activeTab === 'wishlist' ? 'var(--primary-lime-light)' : 'transparent',
                      color: activeTab === 'wishlist' ? 'var(--primary-lime)' : 'var(--text-dark)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Heart size={18} />
                    <span>{t('tabs.wishlist')}</span>
                    {wishlistedProducts.length > 0 && (
                      <span style={{
                        marginLeft: 'auto',
                        backgroundColor: 'var(--primary-lime)',
                        color: 'var(--text-dark)',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)'
                      }}>
                        {wishlistedProducts.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`profile-nav-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      fontWeight: activeTab === 'notifications' ? 700 : 500,
                      backgroundColor: activeTab === 'notifications' ? 'var(--primary-lime-light)' : 'transparent',
                      color: activeTab === 'notifications' ? 'var(--primary-lime)' : 'var(--text-dark)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Bell size={18} />
                    <span>{t('tabs.notifications')}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!affiliateProfile || affiliateProfile.affiliate_status !== 'active') {
                        if (onNavigateToAffiliation) {
                          onNavigateToAffiliation();
                          return;
                        }
                      }
                      setActiveTab('affiliate');
                    }}
                    className={`profile-nav-btn ${activeTab === 'affiliate' ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      fontWeight: activeTab === 'affiliate' ? 700 : 500,
                      backgroundColor: activeTab === 'affiliate' ? 'var(--primary-lime-light)' : 'transparent',
                      color: activeTab === 'affiliate' ? 'var(--primary-lime)' : 'var(--text-dark)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Sparkles size={18} />
                    <span>{t('tabs.affiliate')}</span>
                    {affiliateProfile && affiliateProfile.affiliate_status === 'active' && (
                      <span style={{
                        marginLeft: 'auto',
                        backgroundColor: '#fef3c7',
                        color: '#d97706',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-full)',
                        border: '1.5px solid #fde68a'
                      }}>
                        {t('affiliate.status.active')}
                      </span>
                    )}
                  </button>

                  <div className="profile-sidebar-nav-divider" style={{ height: '1px', backgroundColor: 'var(--border-light)', margin: '12px 0' }} />

                  <button
                    onClick={() => setActiveTab('logout')}
                    className={`profile-nav-btn logout-btn ${activeTab === 'logout' ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      fontWeight: activeTab === 'logout' ? 700 : 500,
                      backgroundColor: activeTab === 'logout' ? '#fef2f2' : 'transparent',
                      color: activeTab === 'logout' ? '#dc2626' : 'var(--text-muted)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <LogOut size={18} />
                    <span>{t('tabs.logout')}</span>
                  </button>

                </nav>
              </aside>
            )}

            {/* Dashboard Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', overflow: 'hidden' }}>
              {isMobile && (
                <button
                  onClick={() => setMobileShowMenu(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-light)',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-dark)',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    alignSelf: 'flex-start',
                    transition: 'all 0.15s ease',
                    marginBottom: '8px'
                  }}
                  className="btn-back-menu"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Menu</span>
                </button>
              )}

              {/* Dashboard Right Main Content Panel */}
              <main className="profile-content-panel" style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                padding: isMobile ? '20px' : '32px',
                boxShadow: 'var(--shadow-sm)',
                minHeight: '480px',
                textAlign: 'left',
                overflow: 'hidden',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                
                {/* Carousel Inner Container */}
                <div
                  className="profile-carousel-inner"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'nowrap',
                    transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                    transform: `translateX(-${(() => {
                      const tabTabs = ['info', 'orders', 'addresses', 'wishlist', 'notifications', 'affiliate', 'logout'];
                      const activeIndex = tabTabs.indexOf(activeTab);
                      return activeIndex !== -1 ? activeIndex : 0;
                    })() * 100}%)`,
                    width: '100%',
                    alignItems: 'flex-start'
                  }}
                >
              
              {/* ==============================================
                  TAB: USER INFORMATION (EDIT PROFILE)
                  ============================================== */}
              <div className={`profile-carousel-slide ${activeTab === 'info' ? 'active' : ''}`} style={{ width: '100%', flexShrink: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)' }}>Spiritual Account Profile</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>Update your contact information and spiritual puja intentions.</p>
                  </div>
                </div>

                {profileSuccessMessage && (
                  <div style={{
                    backgroundColor: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '20px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <CheckCircle size={16} />
                    <span>{profileSuccessMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="form-grid-2col">
                      
                      {/* Name Input */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '6px' }}>Full Name</label>
                        <input
                          type="text"
                          value={userProfile.name}
                          onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            outline: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            color: 'var(--text-dark)'
                          }}
                        />
                      </div>

                      {/* Email Input */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '6px' }}>Email Address</label>
                        <input
                          type="email"
                          value={userProfile.email}
                          onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            outline: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            color: 'var(--text-dark)'
                          }}
                        />
                      </div>

                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="form-grid-2col">
                      
                      {/* Phone Input */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '6px' }}>Phone Number</label>
                        <input
                          type="text"
                          value={userProfile.phone}
                          onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            outline: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            color: 'var(--text-dark)'
                          }}
                        />
                      </div>

                      {/* Spiritual Goal Selector */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '6px' }}>Puja Intention / Spiritual Goal</label>
                        <select
                          value={userProfile.spiritualGoal}
                          onChange={(e) => setUserProfile({ ...userProfile, spiritualGoal: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            outline: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            color: 'var(--text-dark)',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="Peace & Daily Rituals">Peace & Daily Rituals</option>
                          <option value="Meditation & Focus">Meditation & Focus</option>
                          <option value="Vastu & Home Prosperity">Vastu & Home Prosperity</option>
                          <option value="Wisdom & Chanting">Wisdom & Chanting</option>
                          <option value="Spiritual Gift Giver">Spiritual Gift Giver</option>
                        </select>
                      </div>

                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="btn-lime"
                        style={{ padding: '12px 24px', fontSize: '0.88rem', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: isSavingProfile ? 0.7 : 1, cursor: isSavingProfile ? 'not-allowed' : 'pointer' }}
                      >
                        <Save size={16} />
                        <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={isSavingProfile}
                        onClick={handleResetProfile}
                        className="btn-outline"
                        style={{ padding: '12px 24px', fontSize: '0.88rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', cursor: isSavingProfile ? 'not-allowed' : 'pointer' }}
                      >
                        Reset
                      </button>
                    </div>

                  </div>
                </form>

                {/* Account Details Box */}
                <div className="profile-membership-box" style={{
                  marginTop: '32px',
                  padding: '20px',
                  backgroundColor: 'var(--primary-lime-light)',
                  border: '1px solid #ffedd5',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{
                    backgroundColor: 'var(--primary-lime)',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-dark)'
                  }}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>Sadhaka Elite Membership</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      You have unlocked complimentary Gangajal blessing and temple priority dispatch with every checkout!
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* ==============================================
                TAB: ORDERS (MOCK + RECENT LIVE ORDERS)
                ============================================== */}
            <div className={`profile-carousel-slide ${activeTab === 'orders' ? 'active' : ''}`} style={{ width: '100%', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px' }}>My Devotional Orders</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Trace the shipment progress and history of your ordered sacred items.</p>

                {allOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                    <span style={{ fontSize: '3rem' }}>🛍️</span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '16px' }}>No orders placed yet</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '20px' }}>
                      Embark on your spiritual journey today and explore our catalog of certified energetic products.
                    </p>
                    <button onClick={onNavigateToShop} className="btn-lime" style={{ fontSize: '0.85rem', padding: '10px 24px' }}>
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {allOrders.map((order) => {
                      const isPendingUpi = order.paymentMethod === 'Scan & Pay (UPI)' && order.paymentStatus !== 'Confirmed' && order.status !== 'Cancelled';
                      const isPendingPayment = (order.paymentMethod === 'Scan & Pay (UPI)' || order.paymentMethod === 'Razorpay') && order.paymentStatus !== 'Confirmed' && order.status !== 'Cancelled' && order.status !== 'Payment Pending';
                      const badge = getStatusColor(order.status);
                      return (
                        <div
                          key={order.id}
                          style={{
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-lg)',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          {/* Order Card Header */}
                          <div style={{
                            backgroundColor: '#fafafa',
                            padding: isMobile ? '12px 16px' : '16px 24px',
                            borderBottom: '1px solid var(--border-light)',
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            justifyContent: 'space-between',
                            alignItems: isMobile ? 'flex-start' : 'center',
                            gap: '12px'
                          }}>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'row',
                              width: isMobile ? '100%' : 'auto',
                              justifyContent: 'space-between',
                              gap: isMobile ? '8px' : '20px',
                              flexWrap: 'nowrap'
                            }}>
                              <div>
                                <span style={{ display: 'block', fontSize: isMobile ? '0.62rem' : '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                                  {isMobile ? 'ID' : 'Order ID'}
                                </span>
                                <div style={{ fontSize: isMobile ? '0.75rem' : '0.88rem', fontWeight: 800, color: 'var(--text-dark)', whiteSpace: 'nowrap' }}>
                                  {isMobile ? `#${order.id.replace('MANTRA-', '')}` : `#${order.id}`}
                                </div>
                              </div>
                              <div>
                                <span style={{ display: 'block', fontSize: isMobile ? '0.62rem' : '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                                  {isMobile ? 'Placed' : 'Date Placed'}
                                </span>
                                <div style={{ fontSize: isMobile ? '0.75rem' : '0.88rem', fontWeight: 700, color: 'var(--text-dark)', whiteSpace: 'nowrap' }}>
                                  {isMobile ? order.date.replace(', 2026', '') : order.date}
                                </div>
                              </div>
                              <div>
                                <span style={{ display: 'block', fontSize: isMobile ? '0.62rem' : '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                                  {isMobile ? 'Total' : 'Total Price'}
                                </span>
                                <div style={{ fontSize: isMobile ? '0.75rem' : '0.88rem', fontWeight: 800, color: 'var(--primary-forest)', whiteSpace: 'nowrap' }}>
                                  ₹{isMobile ? order.total.toFixed(0) : order.total.toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <span style={{ display: 'block', fontSize: isMobile ? '0.62rem' : '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                                  {isMobile ? 'Pay' : 'Payment'}
                                </span>
                                <div style={{ fontSize: isMobile ? '0.75rem' : '0.88rem', fontWeight: 700, color: 'var(--text-dark)', whiteSpace: 'nowrap' }}>
                                  {isMobile ? (order.paymentMethod === 'Scan & Pay (UPI)' ? 'UPI' : order.paymentMethod) : order.paymentMethod}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                backgroundColor: badge.bg,
                                color: badge.text,
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                padding: '4px 12px',
                                borderRadius: 'var(--radius-full)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: badge.text }} />
                                {order.status}
                              </span>
                              {isPendingPayment && (
                                <span style={{
                                  backgroundColor: '#fff7ed',
                                  color: '#c2410c',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  padding: '4px 12px',
                                  borderRadius: 'var(--radius-full)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  border: '1.5px solid #ffedd5'
                                }}>
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#c2410c' }} />
                                  Payment Pending
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Order Products List */}
                          <div style={{ padding: '20px 24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {order.items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                      width: '40px',
                                      height: '40px',
                                      borderRadius: 'var(--radius-sm)',
                                      backgroundColor: '#f3f4f6',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '1.4rem'
                                    }}>
                                      {item.image && isImageUrl(item.image) ? (
                                        <img 
                                          src={getDisplayImageUrl(item.image)} 
                                          alt={item.name} 
                                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} 
                                        />
                                      ) : (
                                        item.image
                                      )}
                                    </div>
                                    <div>
                                      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)' }}>{item.name}</h4>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quantity: {item.qty}</span>
                                    </div>
                                  </div>
                                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                                    ₹{(item.price * item.qty).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Shipment Status timeline tracker if order is not delivered */}
                            {order.status !== 'Delivered' && (
                              <div style={{
                                marginTop: '24px',
                                paddingTop: '20px',
                                borderTop: '1px solid var(--border-light)'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                  <Truck size={16} style={{ color: 'var(--primary-lime)' }} />
                                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-dark)' }}>Live Tracking Progress</span>
                                </div>
                                <div className="tracking-progress-timeline-horizontal" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', position: 'relative' }}>
                                   {/* Progress bar line */}
                                   <div className="tracking-progress-line-horizontal" style={{
                                     position: 'absolute',
                                     top: '7px',
                                     left: '12.5%',
                                     right: '12.5%',
                                     height: '2px',
                                     backgroundColor: 'var(--border-light)',
                                     zIndex: 1
                                   }} />
                                   
                                   {/* Confirmed */}
                                   <div style={{ textAlign: 'center', position: 'relative', zIndex: 5 }}>
                                     <div style={{
                                       width: '16px',
                                       height: '16px',
                                       borderRadius: '50%',
                                       backgroundColor: 'var(--primary-lime)',
                                       border: '3px solid #ffffff',
                                       boxShadow: '0 0 0 1px var(--primary-lime)',
                                       margin: '0 auto 6px auto'
                                     }} />
                                     <span style={{ display: 'block', fontSize: isMobile ? '0.62rem' : '0.7rem', fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.1 }}>Ordered</span>
                                   </div>

                                   {/* Packed */}
                                   <div style={{ textAlign: 'center', position: 'relative', zIndex: 5 }}>
                                     <div style={{
                                       width: '16px',
                                       height: '16px',
                                       borderRadius: '50%',
                                       backgroundColor: ['Being Packed', 'Ready for Dispatch', 'Shipped', 'Delivered'].includes(order.status) ? 'var(--primary-lime)' : 'var(--border-light)',
                                       border: '3px solid #ffffff',
                                       boxShadow: ['Being Packed', 'Ready for Dispatch'].includes(order.status) ? '0 0 0 1px var(--primary-lime)' : 'none',
                                       margin: '0 auto 6px auto'
                                     }} />
                                     <span style={{ display: 'block', fontSize: isMobile ? '0.62rem' : '0.7rem', fontWeight: ['Being Packed', 'Ready for Dispatch'].includes(order.status) ? 800 : 500, color: ['Being Packed', 'Ready for Dispatch', 'Shipped', 'Delivered'].includes(order.status) ? 'var(--primary-lime)' : 'var(--text-muted)', lineHeight: 1.1 }}>{order.status === 'Ready for Dispatch' ? 'Ready to Dispatch' : 'Packed'}</span>
                                   </div>

                                   {/* Shipped */}
                                   <div style={{ textAlign: 'center', position: 'relative', zIndex: 5 }}>
                                     <div style={{
                                       width: '16px',
                                       height: '16px',
                                       borderRadius: '50%',
                                       backgroundColor: ['Shipped', 'Delivered'].includes(order.status) ? 'var(--primary-lime)' : 'var(--border-light)',
                                       border: '3px solid #ffffff', boxShadow: order.status === 'Shipped' ? '0 0 0 1px var(--primary-lime)' : 'none',
                                       margin: '0 auto 6px auto'
                                     }} />
                                     <span style={{ display: 'block', fontSize: isMobile ? '0.62rem' : '0.7rem', fontWeight: order.status === 'Shipped' ? 800 : 500, color: ['Shipped', 'Delivered'].includes(order.status) ? 'var(--primary-lime)' : 'var(--text-muted)', lineHeight: 1.1 }}>In Transit</span>
                                   </div>

                                   {/* Delivered */}
                                   <div style={{ textAlign: 'center', position: 'relative', zIndex: 5 }}>
                                     <div style={{
                                       width: '16px',
                                       height: '16px',
                                       borderRadius: '50%',
                                       backgroundColor: order.status === 'Delivered' ? 'var(--primary-lime)' : 'var(--border-light)',
                                       border: '3px solid #ffffff', boxShadow: order.status === 'Delivered' ? '0 0 0 1px var(--primary-lime)' : 'none',
                                       margin: '0 auto 6px auto'
                                     }} />
                                     <span style={{ display: 'block', fontSize: isMobile ? '0.62rem' : '0.7rem', fontWeight: order.status === 'Delivered' ? 800 : 500, color: order.status === 'Delivered' ? 'var(--primary-lime)' : 'var(--text-muted)', lineHeight: 1.1 }}>Delivered</span>
                                   </div>

                                 </div>
                              </div>
                            )}

                            {/* UPI QR Payment and Screenshot Upload Panel */}
                            {isPendingUpi && (
                              <div style={{
                                marginTop: '24px',
                                paddingTop: '20px',
                                borderTop: '1px solid var(--border-light)'
                              }}>
                                <div style={{
                                  backgroundColor: '#fffbeb',
                                  border: '1.5px solid #fef3c7',
                                  borderRadius: 'var(--radius-lg)',
                                  padding: '20px'
                                }}>
                                  <h5 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#92400e', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Sparkles size={16} style={{ color: '#d97706' }} /> Complete Direct UPI Payment
                                  </h5>
                                  <p style={{ fontSize: '0.8rem', color: '#78350f', marginBottom: '16px', lineHeight: 1.4 }}>
                                    Please scan the QR code to complete your payment of <strong>₹{order.total.toFixed(2)}</strong>. After making the payment, upload your transaction confirmation screenshot below.
                                  </p>

                                  {order.paymentStatus === 'Declined' && (
                                    <div style={{
                                      backgroundColor: '#fee2e2',
                                      border: '1.5px solid #fca5a5',
                                      borderRadius: 'var(--radius-md)',
                                      padding: '12px',
                                      marginBottom: '16px',
                                      color: '#991b1b',
                                      fontSize: '0.78rem',
                                      fontWeight: 700
                                    }}>
                                      ⚠️ Your payment was not done properly. Please check your transaction details and re-upload a valid payment screenshot. (Decline Attempt {order.paymentDeclineCount || 0} of 3)
                                    </div>
                                  )}

                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1.1fr 1.9fr',
                                    gap: '20px',
                                    alignItems: 'start'
                                  }} className="hero-grid-split">
                                    {/* QR Code Column */}
                                    <div style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      textAlign: 'center',
                                      padding: '12px',
                                      backgroundColor: '#ffffff',
                                      border: '1.5px solid #f3f4f6',
                                      borderRadius: 'var(--radius-md)',
                                    }}>
                                      {barcodeSettings?.barcodeUrl ? (
                                        <img
                                          src={barcodeSettings.barcodeUrl}
                                          alt="UPI QR Code"
                                          style={{ width: '130px', height: '130px', objectFit: 'contain', marginBottom: '8px' }}
                                        />
                                      ) : (
                                        <img
                                          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                                            `upi://pay?pa=${barcodeSettings?.upiId || '7974478098@paytm'}&pn=Mantra%20Puja&am=${order.total.toFixed(
                                              2
                                            )}&cu=INR&tn=Order%20${order.id}`
                                          )}`}
                                          alt="UPI QR Code"
                                          style={{ width: '130px', height: '130px', objectFit: 'contain', marginBottom: '8px' }}
                                        />
                                      )}
                                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                                        Scan to Pay ₹{order.total.toFixed(2)}
                                      </span>

                                      <div style={{
                                        marginTop: '10px',
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        backgroundColor: '#fafafa',
                                        padding: '6px 10px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid #e5e7eb',
                                      }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                          <span style={{ fontSize: '0.55rem', color: '#9ca3af', fontWeight: 700 }}>UPI ID / VPA (Click to Pay)</span>
                                          <a
                                            href={`upi://pay?pa=${barcodeSettings?.upiId || '7974478098@paytm'}&pn=Mantra%20Puja&am=${order.total.toFixed(2)}&cu=INR&tn=Order%20${order.id}`}
                                            style={{
                                              fontSize: '0.68rem',
                                              fontWeight: 800,
                                              color: 'var(--primary-lime, #15803d)',
                                              fontFamily: 'monospace',
                                              textDecoration: 'underline',
                                              cursor: 'pointer',
                                              wordBreak: 'break-all'
                                            }}
                                          >
                                            {barcodeSettings?.upiId || '7974478098@paytm'}
                                          </a>
                                        </div>
                                        <button
                                          onClick={() => handleCopyOrderUpi(order.id, barcodeSettings?.upiId || '7974478098@paytm')}
                                          style={{
                                            padding: '4px 6px',
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            backgroundColor: copiedUpiOrderId === order.id ? '#dcfce7' : '#ffffff',
                                            color: copiedUpiOrderId === order.id ? '#15803d' : 'var(--text-dark)',
                                            border: '1px solid #d1d5db',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '2px',
                                            flexShrink: 0
                                          }}
                                        >
                                          {copiedUpiOrderId === order.id ? <Check size={8} /> : <Copy size={8} />}
                                          {copiedUpiOrderId === order.id ? 'Copied' : 'Copy'}
                                        </button>
                                      </div>

                                      <button
                                        onClick={() => handleUpiRedirect(order.id, order.total)}
                                        style={{
                                          marginTop: '10px',
                                          width: '100%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          padding: '8px 12px',
                                          borderRadius: '6px',
                                          backgroundColor: 'var(--primary-lime)',
                                          color: '#ffffff',
                                          border: 'none',
                                          fontSize: '0.78rem',
                                          fontWeight: 800,
                                          cursor: 'pointer',
                                          transition: 'background-color 0.2s',
                                          boxShadow: 'var(--shadow-sm)'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-forest)'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary-lime)'}
                                      >
                                        ⚡ Pay via UPI App
                                      </button>
                                    </div>

                                    {/* Upload Screen Column */}
                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                                      {uploadingOrderId === order.id ? (
                                        <div style={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          textAlign: 'center',
                                          padding: '24px 16px',
                                          border: '2px dashed var(--primary-lime)',
                                          borderRadius: 'var(--radius-md)',
                                          backgroundColor: '#ffffff',
                                          minHeight: '160px',
                                          justifyContent: 'center'
                                        }}>
                                          <div style={{
                                            width: '20px',
                                            height: '20px',
                                            border: '2px solid #e5e7eb',
                                            borderTopColor: 'var(--primary-lime)',
                                            borderRadius: '50%',
                                            margin: '0 auto 8px auto',
                                            animation: 'spin-anim 1s linear infinite',
                                          }} />
                                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)' }}>Uploading to Temple server...</span>
                                        </div>
                                      ) : selectedFiles[order.id] ? (
                                        <div style={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          textAlign: 'center',
                                          padding: '16px',
                                          backgroundColor: '#fffbeb',
                                          border: '1.5px dashed var(--primary-lime)',
                                          borderRadius: 'var(--radius-md)',
                                        }}>
                                          <img
                                            src={URL.createObjectURL(selectedFiles[order.id])}
                                            alt="Selected Preview"
                                            style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '4px', marginBottom: '8px', border: '1px solid var(--border-light)' }}
                                          />
                                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)', wordBreak: 'break-all' }}>
                                            Selected: {selectedFiles[order.id].name}
                                          </span>
                                          <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '12px' }}>
                                            <button
                                              onClick={() => handleOrderScreenshotUpload(order.id, selectedFiles[order.id])}
                                              className="btn-lime"
                                              style={{
                                                flex: 1,
                                                padding: '8px 12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                borderRadius: 'var(--radius-sm)',
                                                justifyContent: 'center',
                                                cursor: 'pointer'
                                              }}
                                            >
                                              Submit
                                            </button>
                                            <button
                                              onClick={() => {
                                                setSelectedFiles(prev => {
                                                  const next = { ...prev };
                                                  delete next[order.id];
                                                  return next;
                                                });
                                              }}
                                              style={{
                                                padding: '8px 12px',
                                                backgroundColor: '#ffffff',
                                                border: '1px solid var(--border-light)',
                                                color: 'var(--text-dark)',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                borderRadius: 'var(--radius-sm)',
                                                cursor: 'pointer'
                                              }}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : order.paymentScreenshot ? (
                                        <div style={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          textAlign: 'center',
                                          padding: '16px',
                                          backgroundColor: '#f0fdf4',
                                          border: '1.5px dashed #bbf7d0',
                                          borderRadius: 'var(--radius-md)',
                                        }}>
                                          <img
                                            src={order.paymentScreenshot}
                                            alt="Payment Screenshot"
                                            style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px', border: '1px solid #bbf7d0' }}
                                          />
                                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckCircle size={14} style={{ color: '#15803d' }} /> Receipt Uploaded
                                          </span>
                                          <p style={{ fontSize: '0.7rem', color: '#166534', marginTop: '2px', marginBottom: '10px' }}>
                                            Awaiting confirmation from our admin team.
                                          </p>
                                          <label
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              padding: '5px 12px',
                                              backgroundColor: '#ffffff',
                                              border: '1px solid #bbf7d0',
                                              borderRadius: 'var(--radius-sm)',
                                              color: '#15803d',
                                              fontSize: '0.72rem',
                                              fontWeight: 700,
                                              cursor: 'pointer',
                                            }}
                                          >
                                            <Upload size={10} />
                                            Re-upload proof
                                            <input
                                              type="file"
                                              accept="image/*"
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                  setSelectedFiles(prev => ({ ...prev, [order.id]: file }));
                                                }
                                              }}
                                              style={{ display: 'none' }}
                                            />
                                          </label>
                                        </div>
                                      ) : (
                                        <label
                                          style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '24px 16px',
                                            border: '2px dashed #d1d5db',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            backgroundColor: '#ffffff',
                                            transition: 'border-color 0.2s',
                                            minHeight: '160px'
                                          }}
                                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-lime)')}
                                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                                        >
                                          <Upload size={20} style={{ color: 'var(--text-muted)', marginBottom: '6px' }} />
                                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                                            Upload Payment Screenshot
                                          </span>
                                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            JPG, PNG files
                                          </span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                setSelectedFiles(prev => ({ ...prev, [order.id]: file }));
                                              }
                                            }}
                                            style={{ display: 'none' }}
                                          />
                                        </label>
                                      )}

                                      {uploadErrors[order.id] && (
                                        <p style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 600, marginTop: '6px', textAlign: 'center' }}>
                                          {uploadErrors[order.id]}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>

                          {/* Card Bottom Actions Toolbar */}
                          <div style={{
                            padding: '12px 16px',
                            backgroundColor: '#fafafa',
                            borderTop: '1px solid var(--border-light)',
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'nowrap',
                            gap: '8px'
                          }}>
                            {/* Left button: Share */}
                            <button
                              disabled={sharingOrderId === order.id}
                              onClick={() => handleNativeShareInvoice(order.rawOrder)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                backgroundColor: sharingOrderId === order.id ? 'var(--primary-lime-light)' : '#ffffff',
                                color: sharingOrderId === order.id ? 'var(--primary-lime)' : 'var(--text-dark)',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                boxShadow: 'var(--shadow-sm)',
                                cursor: sharingOrderId === order.id ? 'not-allowed' : 'pointer',
                                flex: '1 1 auto',
                                minWidth: '60px'
                              }}
                            >
                              <Share2 size={13} style={{ color: 'var(--text-muted)' }} />
                              <span>{sharingOrderId === order.id ? 'Sharing...' : 'Share'}</span>
                            </button>

                            {/* Middle button: Invoice */}
                            <button
                              onClick={() => handleDownloadInvoice(order.rawOrder)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                backgroundColor: '#ffffff',
                                color: 'var(--text-dark)',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                boxShadow: 'var(--shadow-sm)',
                                cursor: 'pointer',
                                flex: '1 1 auto',
                                minWidth: '60px'
                              }}
                            >
                              <Download size={13} style={{ color: 'var(--text-muted)' }} />
                              <span>Invoice</span>
                            </button>

                            {/* Right button: Reorder */}
                            {order.status !== 'Cancelled' && (
                              <button
                                onClick={() => handleReorder(order.rawOrder)}
                                className="btn-lime"
                                style={{
                                  padding: '8px 14px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  borderRadius: 'var(--radius-md)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  cursor: 'pointer',
                                  flex: '1.2 1 auto',
                                  minWidth: '100px'
                                }}
                              >
                                <RotateCcw size={13} />
                                <span>Reorder Items</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            </div>

            {/* ==============================================
                TAB: SAVED ADDRESSES (MANAGE ADDRESSES)
                ============================================== */}
            <div className={`profile-carousel-slide ${activeTab === 'addresses' ? 'active' : ''}`} style={{ width: '100%', flexShrink: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)' }}>Saved Delivery Addresses</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>Manage addresses to make your sacred checkout flows faster.</p>
                  </div>
                  {!showAddAddressForm && (
                    <button
                      onClick={() => setShowAddAddressForm(true)}
                      className="btn-lime"
                      style={{ padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', borderRadius: 'var(--radius-md)' }}
                    >
                      <Plus size={16} />
                      <span>Add New</span>
                    </button>
                  )}
                </div>

                {addressSuccessMessage && (
                  <div style={{
                    backgroundColor: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '20px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <CheckCircle size={16} />
                    <span>{addressSuccessMessage}</span>
                  </div>
                )}

                {/* Inline form to Add Address */}
                {showAddAddressForm && (
                  <div style={{
                    border: '2px solid var(--primary-lime)',
                    backgroundColor: 'var(--primary-lime-light)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    marginBottom: '32px',
                  }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '16px' }}>Add Sacred Delivery Address</h3>
                    <form onSubmit={handleAddAddressSubmit}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }} className="form-grid-3col">
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>Receiver's Full Name</label>
                            <input
                              type="text"
                              required
                              placeholder="Devotee Name"
                              value={newAddress.name}
                              onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>Address Label</label>
                            <input
                              type="text"
                              placeholder="e.g. Home, Office, Temple"
                              value={newAddress.type}
                              onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>Contact Phone</label>
                            <input
                              type="text"
                              required
                              placeholder="Phone Number"
                              value={newAddress.phone}
                              onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>Full Street Address</label>
                          <input
                            type="text"
                            required
                            placeholder="House / Apartment No, Street name, Landmark"
                            value={newAddress.street}
                            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }} className="form-grid-3col">
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>City</label>
                            <input
                              type="text"
                              required
                              placeholder="City"
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>State</label>
                            <input
                              type="text"
                              required
                              placeholder="State"
                              value={newAddress.state}
                              onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>ZIP Code</label>
                            <input
                              type="text"
                              required
                              placeholder="ZIP code"
                              value={newAddress.zip}
                              onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                          <button
                            type="submit"
                            className="btn-lime"
                            style={{ padding: '10px 20px', fontSize: '0.82rem', borderRadius: 'var(--radius-md)' }}
                          >
                            Save Address
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddAddressForm(false)}
                            className="btn-outline"
                            style={{ padding: '10px 20px', fontSize: '0.82rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                          >
                            Cancel
                          </button>
                        </div>

                      </div>
                    </form>
                  </div>
                )}

                {/* Saved Addresses List Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="hero-grid-split">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      style={{
                        border: addr.isDefault ? '2px solid var(--primary-lime)' : '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '20px',
                        backgroundColor: addr.isDefault ? 'var(--primary-lime-light)' : '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '180px',
                        boxShadow: 'var(--shadow-sm)',
                        position: 'relative'
                      }}
                    >
                      <div>
                        {/* Address Label Line */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: addr.isDefault ? 'var(--primary-lime)' : 'var(--text-dark)',
                            backgroundColor: addr.isDefault ? '#ffedd5' : '#f3f4f6',
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)'
                          }}>
                            {addr.type}
                          </span>
                          {addr.isDefault && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-lime)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <Check size={12} /> Primary Delivery
                            </span>
                          )}
                        </div>

                        {/* Name & Phone */}
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-dark)' }}>{addr.name}</h4>
                        {(() => {
                          let displayStreet = addr.street || '';
                          let displayFlat = '';
                          let landmarkText = '';
                          let altPhoneText = '';

                          if (displayStreet.includes('__STRUCTURED_ADDR__:')) {
                            try {
                              const idx = displayStreet.indexOf('__STRUCTURED_ADDR__:');
                              const parsed = JSON.parse(displayStreet.substring(idx + 20));
                              displayFlat = parsed.flat || '';
                              displayStreet = parsed.street || parsed.addressLine1 || '';
                              landmarkText = parsed.landmark || '';
                              altPhoneText = parsed.altPhone || '';
                            } catch (e) {
                              displayStreet = displayStreet.replace(/__STRUCTURED_ADDR__:\s*\{[^}]*\}/g, '').trim();
                            }
                          }

                          return (
                            <>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Phone: {addr.phone}
                                {altPhoneText ? ` / Alt: ${altPhoneText}` : ''}
                              </p>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-dark)', lineHeight: 1.4, marginTop: '8px' }}>
                                {displayFlat ? `${displayFlat}, ` : ''}{displayStreet}
                                {landmarkText && <><br />Landmark: {landmarkText}</>}
                                <br />
                                {addr.city}, {addr.state} - {addr.zip}
                              </p>
                            </>
                          );
                        })()}
                      </div>

                      {/* Address Actions Toolbar */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '20px',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(0,0,0,0.06)'
                      }}>
                        {!addr.isDefault ? (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            style={{ fontSize: '0.78rem', color: 'var(--primary-lime)', fontWeight: 700 }}
                          >
                            Set as Primary
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Default Address</span>
                        )}

                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          style={{
                            color: '#ef4444',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 700
                          }}
                          title="Remove address"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* ==============================================
                TAB: WISHLIST (WISHLIST SYNC)
                ============================================== */}
            <div className={`profile-carousel-slide ${activeTab === 'wishlist' ? 'active' : ''}`} style={{ width: '100%', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px' }}>{t('wishlist:tabTitle', { defaultValue: 'My Sacred Wishlist' })}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>{t('wishlist:tabDesc', { defaultValue: 'Items saved for special pujas, auspicious days, or gifting. Synced in real-time.' })}</p>

                {wishlistedProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                    <span style={{ fontSize: '3rem' }}>❤️</span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '16px' }}>{t('wishlist:emptyTitle', { defaultValue: 'Your Wishlist is empty' })}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '20px' }}>
                      {t('wishlist:emptyDesc', { defaultValue: 'Tap the heart icon on any product in the shop to add it to your wishlist.' })}
                    </p>
                    <button onClick={onNavigateToShop} className="btn-lime" style={{ fontSize: '0.85rem', padding: '10px 24px' }}>
                      {t('wishlist:exploreBtn', { defaultValue: 'Explore Products' })}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="hero-grid-split">
                    {wishlistedProducts.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          backgroundColor: '#ffffff',
                          boxShadow: 'var(--shadow-sm)',
                          position: 'relative'
                        }}
                      >
                        {/* Remove from wishlist top-right x */}
                        <button
                          onClick={() => onToggleWishlist(p.id)}
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            color: '#ef4444',
                            backgroundColor: '#fef2f2',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px'
                          }}
                          className="flex-center"
                          title={t('wishlist:removeFromWishlist', { defaultValue: 'Remove from Wishlist' })}
                        >
                          <Trash2 size={12} />
                        </button>

                        <div style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: 'var(--radius-md)',
                          background: getCategoryGradient(p?.category),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {p?.image && isImageUrl(p?.image) ? (
                            <img 
                              src={getDisplayImageUrl(p?.image)} 
                              alt={p?.name || 'Product'} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} 
                            />
                          ) : (
                            <span style={{ fontSize: '2.2rem' }}>{p.image}</span>
                          )}
                        </div>

                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--primary-lime)', fontWeight: 800, textTransform: 'uppercase' }}>
                            {p.spiritualType}
                          </span>
                          <h4 style={{
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            color: 'var(--text-dark)',
                            margin: '2px 0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {p.name}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-forest)' }}>₹{p.price}</span>
                            
                            <button
                              onClick={() => {
                                onAddToCart(p, 1);
                                alert(t('wishlist:addedAlert', { name: p.name, defaultValue: `"${p.name}" added to cart from Wishlist!` }));
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'var(--primary-lime)'
                              }}
                            >
                              <ShoppingBag size={12} /> {t('wishlist:addToCart', { defaultValue: 'Add to Cart' })}
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>

            {/* ==============================================
                TAB: NOTIFICATION SETTINGS
                ============================================== */}
            <div className={`profile-carousel-slide ${activeTab === 'notifications' ? 'active' : ''}`} style={{ width: '100%', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px' }}>{t('notifications:tabTitle', { defaultValue: 'Communication Channels' })}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>{t('notifications:tabDesc', { defaultValue: 'Choose how you wish to receive order reports, daily blessings, and spiritual reminders.' })}</p>

                {notifSuccessMessage && (
                  <div style={{
                    backgroundColor: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '20px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <CheckCircle size={16} />
                    <span>{notifSuccessMessage}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Whatsapp Updates Toggle */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <div style={{ flexGrow: 1, paddingRight: '16px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>{t('notifications:whatsappTitle', { defaultValue: 'WhatsApp Dispatch Alerts' })}</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {t('notifications:whatsappDesc', { defaultValue: 'Receive real-time tracking links, invoice downloads, and puja blessing photos directly on WhatsApp.' })}
                      </p>
                    </div>
                    <label style={{ display: 'inline-flex', cursor: 'pointer', position: 'relative' }}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.whatsappUpdates}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, whatsappUpdates: e.target.checked })}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: '46px',
                        height: '24px',
                        backgroundColor: notificationSettings.whatsappUpdates ? 'var(--primary-lime)' : '#e5e7eb',
                        borderRadius: 'var(--radius-full)',
                        padding: '2px',
                        transition: 'background-color 0.2s ease'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: '#ffffff',
                          borderRadius: '50%',
                          transform: notificationSettings.whatsappUpdates ? 'translateX(22px)' : 'translateX(0)',
                          transition: 'transform 0.2s ease',
                          boxShadow: 'var(--shadow-sm)'
                        }} />
                      </div>
                    </label>
                  </div>

                  {/* Email newsletters Toggle */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <div style={{ flexGrow: 1, paddingRight: '16px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>{t('notifications:newsletterTitle', { defaultValue: 'Sacred Intention & Festival Newsletters' })}</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {t('notifications:newsletterDesc', { defaultValue: 'Curated monthly suggestions from Vedic experts on upcoming astrological transits, festival pujas, and rituals.' })}
                      </p>
                    </div>
                    <label style={{ display: 'inline-flex', cursor: 'pointer', position: 'relative' }}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailSpiritual}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, emailSpiritual: e.target.checked })}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: '46px',
                        height: '24px',
                        backgroundColor: notificationSettings.emailSpiritual ? 'var(--primary-lime)' : '#e5e7eb',
                        borderRadius: 'var(--radius-full)',
                        padding: '2px',
                        transition: 'background-color 0.2s ease'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: '#ffffff',
                          borderRadius: '50%',
                          transform: notificationSettings.emailSpiritual ? 'translateX(22px)' : 'translateX(0)',
                          transition: 'transform 0.2s ease',
                          boxShadow: 'var(--shadow-sm)'
                        }} />
                      </div>
                    </label>
                  </div>

                  {/* Email Order confirmation Toggle */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <div style={{ flexGrow: 1, paddingRight: '16px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>{t('notifications:receiptsTitle', { defaultValue: 'Transactional Email Receipts' })}</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {t('notifications:receiptsDesc', { defaultValue: 'Receive digital receipts and secure payment invoice PDFs instantly upon checkout.' })}
                      </p>
                    </div>
                    <label style={{ display: 'inline-flex', cursor: 'pointer', position: 'relative' }}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailOrders}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, emailOrders: e.target.checked })}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: '46px',
                        height: '24px',
                        backgroundColor: notificationSettings.emailOrders ? 'var(--primary-lime)' : '#e5e7eb',
                        borderRadius: 'var(--radius-full)',
                        padding: '2px',
                        transition: 'background-color 0.2s ease'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: '#ffffff',
                          borderRadius: '50%',
                          transform: notificationSettings.emailOrders ? 'translateX(22px)' : 'translateX(0)',
                          transition: 'transform 0.2s ease',
                          boxShadow: 'var(--shadow-sm)'
                        }} />
                      </div>
                    </label>
                  </div>

                  {/* Daily Intention reminder Toggle */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)'
                  }}>
                    <div style={{ flexGrow: 1, paddingRight: '16px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>{t('notifications:mantraTitle', { defaultValue: 'Daily Mantra & Chanting Reminder' })}</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {t('notifications:mantraDesc', { defaultValue: 'Begin every morning with an encouraging spiritual quote or ritual recommendation based on current lunar phase (Tithi).' })}
                      </p>
                    </div>
                    <label style={{ display: 'inline-flex', cursor: 'pointer', position: 'relative' }}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.dailyIntention}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, dailyIntention: e.target.checked })}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: '46px',
                        height: '24px',
                        backgroundColor: notificationSettings.dailyIntention ? 'var(--primary-lime)' : '#e5e7eb',
                        borderRadius: 'var(--radius-full)',
                        padding: '2px',
                        transition: 'background-color 0.2s ease'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: '#ffffff',
                          borderRadius: '50%',
                          transform: notificationSettings.dailyIntention ? 'translateX(22px)' : 'translateX(0)',
                          transition: 'transform 0.2s ease',
                          boxShadow: 'var(--shadow-sm)'
                        }} />
                      </div>
                    </label>
                  </div>

                </div>

                <div style={{ marginTop: '28px' }}>
                  <button onClick={handleSaveNotifications} className="btn-lime" style={{ padding: '12px 28px', fontSize: '0.88rem' }}>
                    {t('notifications:saveBtn', { defaultValue: 'Save Preferences' })}
                  </button>
                </div>

              </div>
            </div>

            {/* ==============================================
                TAB: AFFILIATE PARTNERSHIP
                ============================================== */}
            <div className={`profile-carousel-slide ${activeTab === 'affiliate' ? 'active' : ''}`} style={{ width: '100%', flexShrink: 0 }}>
              <div>
                {(!affiliateProfile || affiliateProfile.affiliate_status === 'inactive') ? (
                  <div>
                    {enrollmentStep === 'none' && (
                      <div style={{
                        padding: '40px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        textAlign: 'center',
                        boxShadow: 'var(--shadow-sm)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: 0, left: 0, right: 0,
                          height: '4px',
                          background: 'linear-gradient(90deg, var(--primary-forest) 0%, var(--primary-lime) 100%)'
                        }} />
                        <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '20px' }}>🕉️</span>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)' }}>Join Mantra Puja Affiliate Program</h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '480px', margin: '8px auto 24px auto', lineHeight: 1.5 }}>
                          Become a devotee partner, share the divine blessings of certified Vedic pujas, and earn commission for every referred devotee.
                        </p>
                        
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '20px',
                          maxWidth: '440px',
                          margin: '0 auto 32px auto',
                          textAlign: 'left'
                        }} className="hero-grid-split">
                          <div style={{ padding: '16px', backgroundColor: 'var(--primary-lime-light)', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a' }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-lime)' }}>Direct Referrals</h4>
                            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-dark)', margin: '4px 0' }}>10%</p>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>On referred devotee checkouts</span>
                          </div>
                          <div style={{ padding: '16px', backgroundColor: 'var(--primary-lime-light)', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a' }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#b45309' }}>Lifetime Rewards</h4>
                            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-dark)', margin: '4px 0' }}>Unlimited</p>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Whenever they buy again</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setEnrollmentStep('terms')}
                          className="btn-lime"
                          style={{ padding: '12px 32px', fontSize: '0.9rem', fontWeight: 700 }}
                        >
                          Become an Affiliate
                        </button>
                      </div>
                    )}

                    {enrollmentStep === 'terms' && (
                      <div style={{
                        padding: '32px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-md)'
                      }}>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '16px' }}>Devotee Partnership Guidelines & Terms</h2>
                        
                        <div style={{
                          maxHeight: '280px',
                          overflowY: 'auto',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px 20px',
                          backgroundColor: '#f9fafb',
                          fontSize: '0.85rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.6,
                          marginBottom: '24px'
                        }}>
                          <h4 style={{ color: 'var(--text-dark)', fontWeight: 800, marginBottom: '6px' }}>1. Referral Commissions</h4>
                          <p style={{ marginBottom: '16px' }}>
                            You will receive a 10.00% commission on purchases made by users referred through your personal referral link. Share with one or multiple people and receive lifetime commissions whenever your referred devotees make a purchase.
                          </p>

                          <h4 style={{ color: 'var(--text-dark)', fontWeight: 800, marginBottom: '6px' }}>2. Holding Period and Security Lock</h4>
                          <p style={{ marginBottom: '16px' }}>
                            All earned commissions are initially placed in a pending state. Commissions are approved and released for withdrawal after a 7-day post-delivery cooling/holding period to protect against order returns and fraud.
                          </p>

                          <h4 style={{ color: 'var(--text-dark)', fontWeight: 800, marginBottom: '6px' }}>3. Minimum Withdrawal Threshold</h4>
                          <p style={{ marginBottom: '16px' }}>
                            Withdrawal requests can be submitted once your approved available balance is ₹1,000 or greater. Payments are processed within 3-5 business days upon administrative verification.
                          </p>

                          <h4 style={{ color: 'var(--text-dark)', fontWeight: 800, marginBottom: '6px' }}>4. Self-Referral and Integrity Rules</h4>
                          <p>
                            Purchasing items through your own referral link is strictly prohibited. Any suspicious, collusive, or fraudulent activity will result in immediate termination of affiliate status and the forfeiture of all unpaid earnings.
                          </p>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginBottom: '24px' }}>
                          <input
                            type="checkbox"
                            checked={termsChecked}
                            onChange={(e) => setTermsChecked(e.target.checked)}
                            style={{ marginTop: '3px' }}
                          />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)', userSelect: 'none' }}>
                            I agree to the devotee program guidelines, commission tiers, and withdrawal conditions.
                          </span>
                        </label>

                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={handleJoinAffiliate}
                            disabled={!termsChecked || joiningProgram}
                            className="btn-lime"
                            style={{
                              padding: '12px 28px',
                              fontSize: '0.88rem',
                              fontWeight: 700,
                              opacity: (!termsChecked || joiningProgram) ? 0.6 : 1,
                              cursor: (!termsChecked || joiningProgram) ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            {joiningProgram ? (
                              <>
                                <span style={{
                                  display: 'inline-block',
                                  width: '14px',
                                  height: '14px',
                                  border: '2px solid rgba(255,255,255,0.3)',
                                  borderTopColor: '#ffffff',
                                  borderRadius: '50%',
                                  animation: 'spin 0.6s linear infinite'
                                }} />
                                <span>Activating...</span>
                              </>
                            ) : (
                              <span>Accept & Join Program</span>
                            )}
                          </button>
                          
                          <button
                            onClick={() => setEnrollmentStep('none')}
                            disabled={joiningProgram}
                            className="btn-outline"
                            style={{ padding: '12px 24px', fontSize: '0.88rem', border: '1px solid var(--border-light)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {enrollmentStep === 'success' && affiliateProfile && (
                      <div style={{
                        padding: '40px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        textAlign: 'center',
                        boxShadow: 'var(--shadow-lg)'
                      }}>
                        <div style={{
                          width: '72px',
                          height: '72px',
                          borderRadius: '50%',
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 20px auto',
                          fontSize: '2.5rem'
                        }}>
                          ✓
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)' }}>Devoted Partnership Activated!</h2>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '8px', marginBottom: '28px' }}>
                          Your affiliate code has been generated. You can now start sharing your unique links to track commissions.
                        </p>

                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px',
                          maxWidth: '460px',
                          margin: '0 auto 32px auto',
                          textAlign: 'left'
                        }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Your Referral Code</span>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: '#f9fafb',
                              border: '1.5px solid var(--border-light)',
                              borderRadius: 'var(--radius-md)',
                              padding: '12px 16px',
                              fontSize: '1.1rem',
                              fontWeight: 800,
                              color: 'var(--primary-forest)'
                            }}>
                              <code>{affiliateProfile.affiliate_code}</code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(affiliateProfile.affiliate_code);
                                  setCopiedLink(true);
                                  setTimeout(() => setCopiedLink(false), 2000);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--primary-lime)',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Copy size={14} />
                                <span>Copy Code</span>
                              </button>
                            </div>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Default Sharing Link</span>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: '#f9fafb',
                              border: '1.5px solid var(--border-light)',
                              borderRadius: 'var(--radius-md)',
                              padding: '12px 16px',
                              fontSize: '0.88rem',
                              fontWeight: 600,
                              color: 'var(--text-dark)'
                            }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '16px' }}>
                                {window.location.origin + '?ref=' + affiliateProfile.affiliate_code}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(window.location.origin + '?ref=' + affiliateProfile.affiliate_code);
                                  setCopiedLink(true);
                                  setTimeout(() => setCopiedLink(false), 2000);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--primary-lime)',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  flexShrink: 0
                                }}
                              >
                                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                                <span>{copiedLink ? t('affiliate.copied') : t('affiliate.copy')}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setEnrollmentStep('none')}
                          className="btn-lime"
                          style={{ padding: '12px 28px', fontSize: '0.88rem', fontWeight: 700 }}
                        >
                          {t('affiliate.goDashboard')}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                      <div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)' }}>{t('affiliate.dashboardTitle')}</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {t('affiliate.dashboardDesc')}
                        </p>
                      </div>
                      
                      {(() => {
                        const status = affiliateProfile.affiliate_status;
                        let bg = '#fee2e2';
                        let text = '#991b1b';
                        let border = '#fecaca';
                        if (status === 'active') {
                          bg = '#dcfce7';
                          text = '#15803d';
                          border = '#bbf7d0';
                        } else if (status === 'pending') {
                          bg = '#fff7ed';
                          text = '#c2410c';
                          border = '#ffedd5';
                        }
                        return (
                          <span style={{
                            padding: '4px 14px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            backgroundColor: bg,
                            color: text,
                            border: `1px solid ${border}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: text }} />
                            {t('affiliate.statusLabel')}: {status.toUpperCase()}
                          </span>
                        );
                      })()}
                    </div>

                    {affiliateProfile.affiliate_status === 'pending' ? (
                      /* Application Pending Approval Banner */
                      <div style={{
                        backgroundColor: '#fffbeb',
                        border: '1.5px solid #fef3c7',
                        borderRadius: 'var(--radius-lg)',
                        padding: '40px 24px',
                        textAlign: 'center',
                        boxShadow: 'var(--shadow-sm)',
                        margin: '24px 0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px'
                      }}>
                        <span style={{ fontSize: '3.5rem', display: 'block' }}>⏳</span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b45309', margin: 0 }}>
                          {t('affiliate.pendingApprovalTitle')}
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#6b5a55', margin: 0, maxWidth: '480px', lineHeight: 1.6 }}>
                          {t('affiliate.pendingApprovalDesc')}
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Suspension Banner */}
                    {affiliateProfile.affiliate_status === 'suspended' && (
                      <div style={{
                        backgroundColor: '#fef2f2',
                        border: '1.5px solid #fecaca',
                        color: '#991b1b',
                        padding: '16px 20px',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: '28px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        lineHeight: 1.5,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}>
                        <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                        <div>
                          <p style={{ fontWeight: 800 }}>{t('affiliate.suspendedTitle')}</p>
                          <p style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '2px', fontWeight: 500 }}>
                            {t('affiliate.suspendedDesc')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Earnings Stats Cards */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px',
                      marginBottom: '32px'
                    }} className="hero-grid-split">
                      
                      <div style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('affiliate.statsLabel.totalEarned')}</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-dark)', marginTop: '4px' }}>₹{affiliateProfile.total_earned.toFixed(2)}</div>
                      </div>

                      <div style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('affiliate.statsLabel.availableBalance')}</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary-forest)', marginTop: '4px' }}>₹{affiliateProfile.available_balance.toFixed(2)}</div>
                      </div>

                      <div style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('affiliate.statsLabel.pendingEarnings')}</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f59e0b', marginTop: '4px' }}>₹{affiliateProfile.pending_earnings.toFixed(2)}</div>
                      </div>

                      <div style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('affiliate.statsLabel.totalReferrals')}</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary-lime)', marginTop: '4px' }}>
                          {filteredReferralTree.filter(n => n.level === 1).length} {t('affiliate.statsLabel.devotees')}
                        </div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {t('affiliate.statsLabel.referredDesc')}
                        </span>
                      </div>

                    </div>

                    {/* Share Info Box */}
                    {affiliateProfile.affiliate_status !== 'suspended' && (
                      <div style={{
                        backgroundColor: 'rgba(254, 243, 199, 0.4)',
                        border: '1.5px solid #ffedd5',
                        borderRadius: 'var(--radius-lg)',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        marginBottom: '30px'
                      }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Wallet size={18} style={{ color: 'var(--primary-lime)' }} />
                          Your Devotional Share Info
                        </h3>

                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ flex: '1 1 300px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                              Referral Sharing Link
                            </label>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: '#ffffff',
                              border: '1px solid var(--border-light)',
                              borderRadius: 'var(--radius-md)',
                              padding: '10px 14px',
                              fontSize: '0.85rem'
                            }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '12px', fontWeight: 600 }}>
                                {window.location.origin + '?ref=' + affiliateProfile.affiliate_code}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(window.location.origin + '?ref=' + affiliateProfile.affiliate_code);
                                  triggerToast('Referral link copied to clipboard!');
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--primary-lime)', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                                title="Copy Link"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Referral Barcode / QR Code */}
                          <div style={{ flex: '0 0 160px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', textAlign: 'center' }}>Referral QR Code</span>
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.origin + '?ref=' + affiliateProfile.affiliate_code)}`}
                              alt="Referral QR Code"
                              style={{ width: '120px', height: '120px', display: 'block' }}
                            />
                            <button
                              onClick={async () => {
                                try {
                                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '?ref=' + affiliateProfile.affiliate_code)}`;
                                  const response = await fetch(qrUrl);
                                  const blob = await response.blob();
                                  const blobUrl = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = blobUrl;
                                  a.download = `MantraPuja-Referral-QR-${affiliateProfile.affiliate_code}.png`;
                                  a.click();
                                  URL.revokeObjectURL(blobUrl);
                                } catch {
                                  window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(window.location.origin + '?ref=' + affiliateProfile.affiliate_code)}`, '_blank');
                                }
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary-lime)',
                                cursor: 'pointer',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              Download QR
                            </button>
                          </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '4px 0' }} />

                        {/* SOCIAL SHARE CONSOLE */}
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={16} style={{ color: 'var(--primary-lime)' }} />
                            🌸 Divine Blessings Share Console
                          </h3>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            
                            {/* Device native share */}
                            <button
                              onClick={handleNativeShare}
                              style={{
                                width: '100%',
                                padding: '14px',
                                backgroundColor: 'var(--primary-lime)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '0.92rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 10px rgba(22, 163, 74, 0.25)',
                                transition: 'transform 0.2s, background-color 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.backgroundColor = 'var(--primary-forest)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.backgroundColor = 'var(--primary-lime)';
                              }}
                            >
                              <Share2 size={18} />
                              Share This
                            </button>

                            {/* Channel items */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                              gap: '8px',
                              marginTop: '4px'
                            }}>
                              
                              <button
                                onClick={handleWhatsappShare}
                                style={{
                                  padding: '10px 8px',
                                  backgroundColor: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '10px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                              >
                                <MessageCircle size={14} />
                                WhatsApp
                              </button>

                              <button
                                onClick={handleFacebookShare}
                                style={{
                                  padding: '10px 8px',
                                  backgroundColor: '#1877f2',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '10px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                              >
                                <FacebookIcon size={14} />
                                Facebook
                              </button>

                              <button
                                onClick={handleTwitterShare}
                                style={{
                                  padding: '10px 8px',
                                  backgroundColor: '#000000',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '10px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                              >
                                <TwitterIcon size={14} />
                                Twitter
                              </button>

                              <button
                                onClick={handleLinkedinShare}
                                style={{
                                  padding: '10px 8px',
                                  backgroundColor: '#0077b5',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '10px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                              >
                                <LinkedinIcon size={14} />
                                LinkedIn
                              </button>

                              <button
                                onClick={handleInstagramShare}
                                style={{
                                  padding: '10px 8px',
                                  backgroundColor: '#e1306c',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '10px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                              >
                                <InstagramIcon size={14} />
                                Instagram
                              </button>

                            </div>

                          </div>
                        </div>

                      </div>
                    )}

                    {/* Dashboard Sub-tabs */}
                    <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setDevoteeSubTab('network')}
                        style={{
                          background: devoteeSubTab === 'network' ? 'var(--primary-lime-light)' : 'transparent',
                          border: devoteeSubTab === 'network' ? '1px solid var(--primary-lime)' : '1px solid transparent',
                          color: devoteeSubTab === 'network' ? 'var(--primary-lime)' : 'var(--text-muted)',
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        🌿 {t('affiliate.tabs.tree')}
                      </button>
                      <button
                        onClick={() => setDevoteeSubTab('earnings')}
                        style={{
                          background: devoteeSubTab === 'earnings' ? 'var(--primary-lime-light)' : 'transparent',
                          border: devoteeSubTab === 'earnings' ? '1px solid var(--primary-lime)' : '1px solid transparent',
                          color: devoteeSubTab === 'earnings' ? 'var(--primary-lime)' : 'var(--text-muted)',
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        📊 {t('affiliate.tabs.commissions')}
                      </button>
                      <button
                        onClick={() => setDevoteeSubTab('payout')}
                        style={{
                          background: devoteeSubTab === 'payout' ? 'var(--primary-lime-light)' : 'transparent',
                          border: devoteeSubTab === 'payout' ? '1px solid var(--primary-lime)' : '1px solid transparent',
                          color: devoteeSubTab === 'payout' ? 'var(--primary-lime)' : 'var(--text-muted)',
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        💰 {t('affiliate.tabs.payouts')}
                      </button>
                    </div>

                    {/* SUBTAB: NETWORK */}
                    {devoteeSubTab === 'network' && (
                      <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '24px',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                          <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>🌿</span>
                            {t('affiliate.network.listTitle')}
                            <button
                              onClick={() => {
                                fetchReferralTree();
                                fetchAffiliateProfile();
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                padding: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                transition: 'color 0.2s',
                              }}
                              title="Refresh Referrals Data"
                            >
                              <RefreshCw size={14} className={treeLoading ? 'spin' : ''} />
                            </button>
                          </h3>
                          <input
                            type="text"
                            placeholder={t('affiliate.network.searchPlaceholder')}
                            value={referralSearch}
                            onChange={(e) => setReferralSearch(e.target.value)}
                            style={{
                              border: '1px solid var(--border-light)',
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8rem',
                              width: '200px',
                              outline: 'none'
                            }}
                          />
                        </div>
                        
                        {treeLoading ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                            {t('affiliate.network.loading')}
                          </div>
                        ) : filteredReferralTree.filter(n => n.level === 1).length === 0 ? (
                          <div style={{
                            padding: '24px',
                            textAlign: 'center',
                            backgroundColor: '#f9fafb',
                            border: '1px dashed var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.88rem',
                            color: 'var(--text-muted)',
                            lineHeight: 1.5
                          }}>
                            {t('affiliate.network.emptyDesc')}
                          </div>
                        ) : (
                          <div style={{
                            backgroundColor: '#f9fafb',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            padding: '16px 20px',
                            maxHeight: '400px',
                            overflowY: 'auto'
                          }}>
                            {filteredReferralTree.filter(n => n.level === 1).map(node => {
                              const displayName = node.full_name && node.full_name.trim() !== '' ? node.full_name : node.user_id;
                              return (
                                <div key={node.user_id} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '12px 16px',
                                  borderBottom: '1px solid var(--border-light)',
                                  backgroundColor: '#ffffff',
                                  borderRadius: 'var(--radius-md)',
                                  marginBottom: '8px',
                                  boxShadow: 'var(--shadow-sm)'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '1.5rem' }}>👤</span>
                                    <div>
                                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                                        {highlightText(displayName, referralSearch)}
                                      </h4>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {t('affiliate.network.joined')}: {new Date(node.joined_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 700, backgroundColor: 'var(--primary-lime-light)', color: 'var(--primary-lime)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                                    {t('affiliate.network.referredBadge')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB: EARNINGS LEDGER */}
                    {devoteeSubTab === 'earnings' && (
                      <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '24px',
                        boxShadow: 'var(--shadow-sm)',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                      }}>
                        <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                          📊 {t('affiliate.ledger.title')}
                        </h3>

                        {/* Commissions Table */}
                        {isLoadingCommissions ? (
                          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                            {t('affiliate.ledger.loading')}
                          </div>
                        ) : commissions.length === 0 ? (
                          <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f9fafb', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                            {t('affiliate.ledger.emptyDesc')}
                          </div>
                        ) : (
                          <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--border-light)' }}>
                                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>{t('affiliate.ledger.thBuyer')}</th>
                                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>{t('affiliate.ledger.thOrderId')}</th>
                                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>{t('affiliate.ledger.thOrderTotal')}</th>
                                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>{t('affiliate.ledger.thRate')}</th>
                                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>{t('affiliate.ledger.thEarnings')}</th>
                                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>{t('affiliate.ledger.thStatus')}</th>
                                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>{t('affiliate.ledger.thDatePlaced')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {commissions.map((comm) => (
                                  <tr key={comm.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                    <td style={{ padding: '10px 14px', fontWeight: 'bold' }}>{comm.buyer_name || t('affiliate.ledger.anonymous')}</td>
                                    <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>#{comm.order_id}</td>
                                    <td style={{ padding: '10px 14px' }}>₹{parseFloat(comm.order_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td style={{ padding: '10px 14px' }}>{comm.commission_percent}%</td>
                                    <td style={{ padding: '10px 14px', fontWeight: 800, color: comm.status === 'cancelled' ? '#991b1b' : 'var(--primary-lime)' }}>
                                      {comm.status === 'cancelled' ? '-' : ''}₹{parseFloat(comm.commission_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                      <span style={{
                                        padding: '2px 8px',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.68rem',
                                        fontWeight: 800,
                                        backgroundColor:
                                          comm.status === 'approved' ? '#dcfce7' :
                                          comm.status === 'cancelled' ? '#fee2e2' :
                                          comm.status === 'delivered_pending_hold' ? '#dbeafe' : '#fef3c7',
                                        color:
                                          comm.status === 'approved' ? '#15803d' :
                                          comm.status === 'cancelled' ? '#991b1b' :
                                          comm.status === 'delivered_pending_hold' ? '#1d4ed8' : '#b45309',
                                        border: '1px solid ' + (
                                          comm.status === 'approved' ? '#bbf7d0' :
                                          comm.status === 'cancelled' ? '#fecaca' :
                                          comm.status === 'delivered_pending_hold' ? '#bfdbfe' : '#fde68a'
                                        )
                                      }}>
                                        {comm.status === 'delivered_pending_hold' ? t('affiliate.ledger.holdWindow') : comm.status.toUpperCase()}
                                      </span>
                                    </td>
                                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                                      {new Date(comm.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB: PAYOUT REQUESTS & HISTORY */}
                    {devoteeSubTab === 'payout' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '30px' }} className="hero-grid-split">
                        
                        {/* Payout History queue list */}
                        <div style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '24px',
                          boxShadow: 'var(--shadow-sm)',
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px'
                        }}>
                          <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                            💰 {t('affiliate.payouts.historyTitle')}
                          </h3>

                          {isLoadingPayoutHistory ? (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                              {t('affiliate.payouts.loading')}
                            </div>
                          ) : payoutHistory.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f9fafb', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                              {t('affiliate.payouts.emptyDesc')}
                            </div>
                          ) : (
                            <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                                <thead>
                                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--border-light)' }}>
                                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>{t('affiliate.payouts.thDate')}</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>{t('affiliate.payouts.thMethod')}</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>{t('affiliate.payouts.thAmount')}</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>{t('affiliate.payouts.thStatus')}</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>{t('affiliate.payouts.thRef')}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {payoutHistory.map((h) => (
                                    <tr key={h.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                                        {new Date(h.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </td>
                                      <td style={{ padding: '10px 14px', fontWeight: 700, textTransform: 'uppercase' }}>{h.payment_method === 'upi' ? t('affiliate.payouts.upiLabel') : t('affiliate.payouts.bankLabel')}</td>
                                      <td style={{ padding: '10px 14px', fontWeight: 800 }}>₹{parseFloat(h.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                      <td style={{ padding: '10px 14px' }}>
                                        <span style={{
                                          padding: '2px 8px',
                                          borderRadius: 'var(--radius-full)',
                                          fontSize: '0.68rem',
                                          fontWeight: 800,
                                          backgroundColor:
                                            h.status === 'paid' ? '#dcfce7' :
                                            h.status === 'approved' ? '#dbeafe' :
                                            h.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                          color:
                                            h.status === 'paid' ? '#15803d' :
                                            h.status === 'approved' ? '#1d4ed8' :
                                            h.status === 'rejected' ? '#991b1b' : '#b45309',
                                          border: '1px solid ' + (
                                            h.status === 'paid' ? '#bbf7d0' :
                                            h.status === 'approved' ? '#bfdbfe' :
                                            h.status === 'rejected' ? '#fecaca' : '#fde68a'
                                          )
                                        }}>
                                          {h.status.toUpperCase()}
                                        </span>
                                        {h.status === 'rejected' && h.admin_notes && (
                                          <p style={{ margin: '3px 0 0 0', fontSize: '0.68rem', color: '#b91c1c' }}>{t('affiliate.payouts.reasonLabel')}: {h.admin_notes}</p>
                                        )}
                                      </td>
                                      <td style={{ padding: '10px 14px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                        {h.status === 'paid' && h.txn_id ? (
                                          <span style={{ color: '#16a34a', fontWeight: 700, fontFamily: 'monospace' }}>{t('affiliate.payouts.txnRef')}: {h.txn_id}</span>
                                        ) : h.payment_method === 'upi' ? (
                                          <span>{t('affiliate.payouts.upiLabel')}: {h.payment_details?.upi_id}</span>
                                        ) : (
                                          <span>{t('affiliate.payouts.bankLabel')}: {h.payment_details?.bank_name} - *{h.payment_details?.account_number?.slice(-4)}</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Payout Request Panel Form */}
                        <div style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '24px',
                          boxShadow: 'var(--shadow-sm)',
                          textAlign: 'left',
                          height: 'fit-content'
                        }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '16px' }}>
                            {t('affiliate.payouts.reqTitle')}
                          </h3>

                          {affiliateProfile.affiliate_status === 'suspended' ? (
                            <div style={{
                              padding: '16px',
                              backgroundColor: '#fee2e2',
                              border: '1px solid #fca5a5',
                              borderRadius: 'var(--radius-md)',
                              color: '#991b1b',
                              fontSize: '0.82rem',
                              lineHeight: 1.5
                            }}>
                              <strong>{t('affiliate.payouts.suspendedError')}</strong>
                            </div>
                          ) : affiliateProfile.available_balance < minWithdrawalLimit ? (
                            <div style={{
                              padding: '16px',
                              backgroundColor: '#fffbeb',
                              border: '1px solid #fde68a',
                              borderRadius: 'var(--radius-md)',
                              color: '#b45309',
                              fontSize: '0.8rem',
                              lineHeight: 1.5
                            }}>
                              <strong>{t('affiliate.payouts.thresholdError', { limit: minWithdrawalLimit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) })}</strong><br />
                              {t('affiliate.payouts.currentBalance', { balance: affiliateProfile.available_balance.toFixed(2) })}
                            </div>
                          ) : (
                            <form onSubmit={handleRequestPayout} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <div style={{ padding: '12px', backgroundColor: 'var(--primary-lime-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-lime)' }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>{t('affiliate.payouts.withdrawAmountLabel')}</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                                  ₹{affiliateProfile.available_balance.toFixed(2)}
                                </span>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('affiliate.payouts.channelLabel')}</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button
                                    type="button"
                                    onClick={() => setPayoutMethod('upi')}
                                    style={{
                                      flex: 1,
                                      padding: '8px',
                                      borderRadius: 'var(--radius-sm)',
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      border: payoutMethod === 'upi' ? '1.5px solid var(--primary-lime)' : '1px solid var(--border-light)',
                                      background: payoutMethod === 'upi' ? 'var(--primary-lime-light)' : '#ffffff',
                                      color: payoutMethod === 'upi' ? 'var(--primary-lime)' : 'var(--text-muted)'
                                    }}
                                  >
                                    {t('affiliate.payouts.upiTransfer')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPayoutMethod('bank')}
                                    style={{
                                      flex: 1,
                                      padding: '8px',
                                      borderRadius: 'var(--radius-sm)',
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      border: payoutMethod === 'bank' ? '1.5px solid var(--primary-lime)' : '1px solid var(--border-light)',
                                      background: payoutMethod === 'bank' ? 'var(--primary-lime-light)' : '#ffffff',
                                      color: payoutMethod === 'bank' ? 'var(--primary-lime)' : 'var(--text-muted)'
                                    }}
                                  >
                                    {t('affiliate.payouts.bankTransfer')}
                                  </button>
                                </div>
                              </div>

                              {payoutMethod === 'upi' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('affiliate.payouts.upiAddressLabel')}</label>
                                    <input
                                      type="text"
                                      placeholder={t('affiliate.payouts.upiAddressPlaceholder')}
                                      required
                                      value={upiId}
                                      onChange={(e) => setUpiId(e.target.value)}
                                      style={{ border: '1px solid var(--border-light)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', outline: 'none' }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('affiliate.payouts.holderNameLabel')}</label>
                                    <input
                                      type="text"
                                      placeholder={t('affiliate.payouts.holderNamePlaceholder')}
                                      required
                                      value={upiHolderName}
                                      onChange={(e) => setUpiHolderName(e.target.value)}
                                      style={{ border: '1px solid var(--border-light)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', outline: 'none' }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('affiliate.payouts.holderNameLabel')}</label>
                                    <input
                                      type="text"
                                      placeholder={t('affiliate.payouts.fullNamePlaceholder')}
                                      required
                                      value={bankHolderName}
                                      onChange={(e) => setBankHolderName(e.target.value)}
                                      style={{ border: '1px solid var(--border-light)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', outline: 'none' }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('affiliate.payouts.accNumLabel')}</label>
                                    <input
                                      type="text"
                                      placeholder={t('affiliate.payouts.accNumPlaceholder')}
                                      required
                                      value={bankAccountNumber}
                                      onChange={(e) => setBankAccountNumber(e.target.value)}
                                      style={{ border: '1px solid var(--border-light)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', outline: 'none' }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('affiliate.payouts.ifscLabel')}</label>
                                    <input
                                      type="text"
                                      maxLength={11}
                                      placeholder={t('affiliate.payouts.ifscPlaceholder')}
                                      required
                                      value={bankIfsc}
                                      onChange={(e) => setBankIfsc(e.target.value)}
                                      style={{ border: '1px solid var(--border-light)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', outline: 'none' }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('affiliate.payouts.bankNameLabel')}</label>
                                    <input
                                      type="text"
                                      placeholder={t('affiliate.payouts.bankNamePlaceholder')}
                                      required
                                      value={bankName}
                                      onChange={(e) => setBankName(e.target.value)}
                                      style={{ border: '1px solid var(--border-light)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', outline: 'none' }}
                                    />
                                  </div>
                                </div>
                              )}

                              <button
                                type="submit"
                                disabled={isSubmittingPayout}
                                style={{
                                  backgroundColor: 'var(--primary-lime)',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '11px',
                                  borderRadius: 'var(--radius-sm)',
                                  fontWeight: 700,
                                  fontSize: '0.82rem',
                                  cursor: 'pointer',
                                  marginTop: '8px'
                                }}
                              >
                                {isSubmittingPayout ? t('affiliate.payouts.submitting') : t('affiliate.payouts.submitBtn')}
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    )}

                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ==============================================
                TAB: LOGOUT (SECURE LOGOUT SESSION CLEAR)
                ============================================== */}
            <div className={`profile-carousel-slide ${activeTab === 'logout' ? 'active' : ''}`} style={{ width: '100%', flexShrink: 0 }}>
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <span style={{ fontSize: '4rem', display: 'block', marginBottom: '20px' }}>🧘‍♀️</span>
                
                {logoutConfirmed ? (
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>{t('logout.loggingOut')}</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      {t('logout.returningHome')}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)' }}>{t('logout.title')}</h2>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '440px', margin: '6px auto 32px auto', lineHeight: 1.5 }}>
                      {t('logout.confirmDesc')}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                      <button
                        onClick={handleLogoutAction}
                        style={{
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          padding: '12px 28px',
                          borderRadius: 'var(--radius-md)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <LogOut size={16} />
                        <span>{t('logout.confirm')}</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('info')}
                        className="btn-outline"
                        style={{
                          padding: '12px 28px',
                          fontSize: '0.9rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)'
                        }}
                      >
                        {t('logout.cancel')}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

            </div> {/* End profile-carousel-inner */}

          </main>

          </div> {/* Closes content area wrapper div */}
        </div>
      )}
    </div> {/* Closes .container */}

        {showInstagramTip && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(45, 20, 14, 0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '2px solid #ffedd5',
              padding: '32px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 16px 0', color: '#2d140e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <InstagramIcon size={24} color="#e1306c" />
                Share on Instagram Stories
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#6b5a55', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                Instagram does not support direct links or file transfers from web browsers. We have automatically uploaded your unified **Blessings Card** image to Cloudflare CDN and copied the share message containing your referral link and card preview link to your clipboard.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#fcf8f5', borderRadius: '16px', padding: '16px', border: '1px solid #ffedd5', marginBottom: '24px', fontSize: '0.85rem', color: '#4c1d11', textAlign: 'left' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ fontWeight: 800, color: '#ea580c' }}>1.</span>
                  <span>Open your Instagram App and swipe right to create a new **Story**.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ fontWeight: 800, color: '#ea580c' }}>2.</span>
                  <span>Use the **Link Sticker** to add your copied referral link.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ fontWeight: 800, color: '#ea580c' }}>3.</span>
                  <span>Paste the full spiritual message and dynamic barcode link directly on your story and publish!</span>
                </div>
              </div>
              <button
                onClick={() => setShowInstagramTip(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.2)'
                }}
              >
                Got It, Open Instagram
              </button>
            </div>
          </div>
        )}

        {/* Toast popup */}
        {toastMsg && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#2d140e',
            color: '#ffffff',
            padding: '16px 24px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem',
            fontWeight: 700,
            border: '1.5px solid #ea580c',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <CheckCircle size={18} style={{ color: '#ea580c' }} />
            <span>{toastMsg}</span>
          </div>
        )}

      </div>
  );
};
