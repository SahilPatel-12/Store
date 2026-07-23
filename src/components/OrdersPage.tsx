import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  Download,
  Share2,
  RotateCcw,
  Info,
  ArrowLeft,
  Upload,
  Copy,
  Sparkles,
  Check,
} from 'lucide-react';
import type { Product, LocalOrder, OrderDataSnapshot } from '../types';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';
import { supabase } from '../lib/supabase';
import { uploadToR2 } from '../lib/cloudflare/r2';
import { createProductShareCard } from '../lib/shareHelper';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '../assets/My_logo/Frame 16.png';

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

  const discountPercent = order.discountPercent || Math.round((dataToUse.discount / (dataToUse.subtotal || 1)) * 100);
  const codFeeAmount = (order as any).codFee || (order as any).cod_fee || (isCodOrder ? 50 : 0);
  const pdfDisplayTotal = Math.max(Number(dataToUse.total || 0), (Number(dataToUse.subtotal || 0) - Number(dataToUse.discount || 0) + Number(dataToUse.shipping || 0) + Number(dataToUse.tax || 0) + Number(codFeeAmount || 0)));

  const hasVidyaRudraksha = dataToUse.items.some(item => {
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
        margin-top: auto;
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
  const pageData = canvas.toDataURL('image/png');

  doc.addImage(pageData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    doc.addPage();
    doc.addImage(pageData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  return doc;
};;

interface OrdersPageProps {
  onAddToCart: (product: Product, quantity?: number) => void;
  onNavigateToShop: () => void;
  onNavigateToHome: () => void;
  onNavigateToCart: () => void;
  orders: LocalOrder[];
  setOrders: React.Dispatch<React.SetStateAction<LocalOrder[]>>;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  onAddToCart,
  onNavigateToShop,
  onNavigateToHome,
  onNavigateToCart,
  orders,
  setOrders,
}) => {
  const { t, i18n } = useTranslation(['profile', 'common', 'shop', 'orderSuccess']);
  const language = i18n.language || 'en';
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    import('../lib/i18next').then(({ loadNamespaces }) => {
      loadNamespaces(language, ['profile', 'shop', 'common', 'orderSuccess']).then(() => setIsReady(true));
    });
  }, [language]);



  // Filter Tabs State
  const [filterTab, setFilterTab] = React.useState<'All' | 'Active' | 'Completed' | 'Cancelled'>('All');
  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Track milestones card expansion state
  const [expandedTrackingOrderId, setExpandedTrackingOrderId] = React.useState<string | null>(null);

  // Detailed Order modal state
  const [selectedDetailsOrder, setSelectedDetailsOrder] = React.useState<LocalOrder | null>(null);

  // Success Feedback
  const [feedbackToast, setFeedbackToast] = React.useState('');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Payment Verification States for Orders History
  const [barcodeSettings, setBarcodeSettings] = React.useState<{ upiId?: string; barcodeUrl?: string } | null>(null);
  const [uploadingOrderId, setUploadingOrderId] = React.useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = React.useState<Record<string, string>>({});
  const [copiedUpiOrderId, setCopiedUpiOrderId] = React.useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = React.useState<Record<string, File>>({});
  const [sharingOrderId, setSharingOrderId] = React.useState<string | null>(null);
  const [shareExpandedOrderId, setShareExpandedOrderId] = React.useState<string | null>(null);

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
      
      // Update local state in parent
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, paymentScreenshot: url, paymentStatus: 'Pending' } : o));

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

  const refreshOrders = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const token = localStorage.getItem('session_token') || '';
      const response = await fetch(`/api/customer/orders?sessionToken=${token}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      if (data) {
          const mappedOrders: LocalOrder[] = data.map((o: any) => ({
            orderId: o.order_id,
            userId: o.user_id,
            placedAt: new Date(o.created_at),
            total: typeof o.total === 'string' ? parseFloat(o.total) : o.total,
            subtotal: typeof o.subtotal === 'string' ? parseFloat(o.subtotal) : o.subtotal,
            discount: typeof o.discount === 'string' ? parseFloat(o.discount) : o.discount,
            discountPercent: o.discount_percent,
            shipping: typeof o.shipping === 'string' ? parseFloat(o.shipping) : o.shipping,
            tax: typeof o.tax === 'string' ? parseFloat(o.tax) : o.tax,
            paymentMethod: o.payment_method,
            deliveryCity: o.delivery_city,
            deliveryState: o.delivery_state,
            fullName: o.full_name,
            email: o.email,
            phoneNumber: o.phone_number,
            addressLine1: o.address_line1,
            addressLine2: o.address_line2 || undefined,
            pincode: o.pincode,
            status: o.status,
            items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
            razorpayPaymentId: o.razorpay_payment_id || undefined,
            paymentScreenshot: o.payment_screenshot || undefined,
            paymentStatus: o.payment_status || 'Pending',
            paymentDeclineCount: o.payment_decline_count || 0
          }));
          setOrders(mappedOrders);
          if (showToast) setFeedbackToast('Order statuses successfully synced!');
        }
    } catch (err) {
      console.error('Failed to sync orders:', err);
    } finally {
      if (showToast) setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    const hasPendingUpi = orders.some(o => o.paymentMethod === 'Scan & Pay (UPI)' && o.paymentStatus !== 'Confirmed');
    if (!hasPendingUpi) return;

    const interval = setInterval(() => {
      refreshOrders(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [orders]);


  React.useEffect(() => {
    if (feedbackToast) {
      const t = setTimeout(() => setFeedbackToast(''), 3000);
      return () => clearTimeout(t);
    }
  }, [feedbackToast]);

  // Filters calculation
  const filteredOrders = React.useMemo(() => {
    return orders.filter((o) => {
      if (filterTab === 'Active') return o.status === 'Being Packed' || o.status === 'Ready for Dispatch' || o.status === 'Shipped';
      if (filterTab === 'Completed') return o.status === 'Delivered';
      if (filterTab === 'Cancelled') return o.status === 'Cancelled';
      return true;
    });
  }, [orders, filterTab]);

  if (!isReady) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' }}>
        <div className="flex-col-center">
          <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: 'var(--primary-lime)', borderRadius: '50%', animation: 'spin-anim 1s linear infinite' }} />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '12px', fontWeight: 600 }}>
            {t('orders.loading', { defaultValue: 'Loading devotional orders...' })}
          </span>
        </div>
      </div>
    );
  }


  // Reorder Products: adds all products to cart and navigates to cart
  const handleReorder = (order: LocalOrder) => {
    order.items.forEach((item) => {
      onAddToCart(item.product, item.quantity);
    });
    setFeedbackToast(`Successfully reordered ${order.items.length} sacred products!`);
    setTimeout(() => {
      onNavigateToCart();
    }, 1000);
  };

  // Download Invoice receipt builder
  const handleDownloadInvoice = async (order: LocalOrder) => {
    try {
      const doc = await generateInvoiceDoc(order);
      doc.save(`Invoice-${order.orderId}.pdf`);
      setFeedbackToast(`Downloaded invoice for #${order.orderId}!`);
    } catch (err) {
      console.error('Failed to download invoice:', err);
      setFeedbackToast('Failed to download invoice.');
    }
  };

  const handleShareInvoice = async (order: LocalOrder, platform: string) => {
    setSharingOrderId(order.orderId);
    try {
      const doc = await generateInvoiceDoc(order);
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], `Invoice-${order.orderId}.pdf`, { type: 'application/pdf' });

      // Upload public invoice PDF to Cloudflare R2
      const pdfUrl = await uploadToR2(pdfFile, 'invoices', true);

      // Construct sharing message with thank you text from Mantra Puja team
      const text = `🕉️ Dear ${order.fullName}, thank you for purchasing from the Mantra Puja team! 🙏✨ May these sacred items bring peace, prosperity, and divine energy to your home. Here is your order invoice: ${pdfUrl} 📿🔱`;
      const encoded = encodeURIComponent(text);

      const urls: Record<string, string> = {
        whatsapp: `https://wa.me/?text=${encoded}`,
        twitter: `https://twitter.com/intent/tweet?text=${encoded}`,
        telegram: `https://t.me/share/url?url=${pdfUrl}&text=${encoded}`,
      };

      if (urls[platform]) {
        window.open(urls[platform], '_blank');
      }
    } catch (err) {
      console.error('Failed to share invoice:', err);
      setFeedbackToast('Failed to generate sharing link.');
    } finally {
      setSharingOrderId(null);
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
        }
        setShareExpandedOrderId(prev => prev === order.orderId ? null : order.orderId);
        return;
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

      // Try native share API with text & link
      if (navigator.share) {
        await navigator.share({
          title: t('orderSuccess:share.title', 'Mantra Puja Blessings'),
          text: fallbackText
        });
        return;
      }
      
      // Fallback: expand social media share panel
      setShareExpandedOrderId(prev => prev === order.orderId ? null : order.orderId);
    } catch (err: any) {
      console.error('Native share failed:', err);
      if (err?.name === 'AbortError') {
        return;
      }
      setFeedbackToast(`Sharing failed: ${err?.message || String(err)}`);
      setShareExpandedOrderId(prev => prev === order.orderId ? null : order.orderId);
    } finally {
      setSharingOrderId(null);
    }
  };

  const getStatusColor = (order: LocalOrder) => {
    if (order.status === 'Cancelled') {
      return { bg: '#fee2e2', text: '#dc2626', icon: <XCircle size={14} />, label: t('orders.actions.cancelled', { defaultValue: 'Cancelled' }) };
    }
    if ((order.paymentMethod === 'Scan & Pay (UPI)' || order.paymentMethod === 'Razorpay') && order.paymentStatus !== 'Confirmed') {
      return { bg: '#fff7ed', text: '#c2410c', icon: <Clock size={14} />, label: t('orders.actions.pendingUpi', { defaultValue: 'Payment Pending' }) };
    }
    switch (order.status) {
      case 'Delivered':
        return { bg: '#dcfce7', text: '#15803d', icon: <CheckCircle size={14} />, label: t('orders.tracking.delivered', { defaultValue: 'Delivered' }) };
      case 'Shipped':
        return { bg: '#dbeafe', text: '#1d4ed8', icon: <Truck size={14} />, label: t('orders.tracking.dispatched', { defaultValue: 'Shipped' }) };
      case 'Ready for Dispatch':
        return { bg: '#fef3c7', text: '#d97706', icon: <Package size={14} />, label: t('orders.tracking.readyForDispatch', { defaultValue: 'Packed & Ready for Dispatch' }) };
      default:
        return { bg: 'var(--primary-lime-light)', text: 'var(--primary-lime)', icon: <Clock size={14} />, label: t('orders.actions.preparingPackage', { defaultValue: 'Preparing Package' }) };
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

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '80vh', paddingBottom: '100px' }}>
      
      {/* Dynamic Notification Toast */}
      {feedbackToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: 'var(--primary-forest)',
          color: '#ffffff',
          padding: '16px 24px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem',
          fontWeight: 700,
          border: '1.5px solid var(--primary-lime)',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <CheckCircle size={18} style={{ color: 'var(--primary-lime)' }} />
          <span>{feedbackToast}</span>
        </div>
      )}


      {/* 1. Spiritual Dashboard Header */}
      <section style={{
        background: 'linear-gradient(135deg, var(--primary-forest) 0%, #4c1f13 100%)',
        color: '#ffffff',
        padding: '48px 0 40px 0',
        borderBottom: '4px solid var(--primary-lime)'
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ textAlign: 'left' }}>
              <button
                onClick={onNavigateToHome}
                style={{
                  color: 'rgba(255, 255, 255, 0.75)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '12px'
                }}
              >
                <ArrowLeft size={14} /> {t('common:actions.backToHome', { defaultValue: 'Back to Home' })}
              </button>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
                {t('orders.title')}
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.88rem', marginTop: '4px' }}>
                {t('orders.subtitle')}
              </p>
            </div>

            {/* Quick stats grid + Sync */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                display: 'flex',
                gap: '16px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                padding: '16px 24px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)'
              }}>
                <div style={{ textAlign: 'center', paddingRight: '16px', borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-lime)' }}>{orders.length}</span>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase' }}>{t('orders.totalOrdersCount', { defaultValue: 'Total Orders' })}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 900, color: '#6ee7b7' }}>
                    {orders.filter((o) => o.status === 'Being Packed' || o.status === 'Ready for Dispatch' || o.status === 'Shipped').length}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase' }}>{t('orders.activeOrders', { defaultValue: 'Active' })}</span>
                </div>
              </div>

              <button
                onClick={() => refreshOrders(true)}
                disabled={isRefreshing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(8px)'
                }}
                className="card-hover"
                title={t('orders.syncTooltip', { defaultValue: 'Sync Statuses from Temple Server' })}
              >
                <RotateCcw size={18} className={isRefreshing ? 'spin-anim' : ''} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Dashboard Content Grid */}
      <div className="container" style={{ marginTop: '36px' }}>
        
        {/* Filter Navigation Tabs Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '16px',
          marginBottom: '28px'
        }}>
          {/* Tabs */}
          <div className="scrollable-tabs-container" style={{ display: 'flex', gap: '8px' }}>
            {(['All', 'Active', 'Completed', 'Cancelled'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: filterTab === tab ? '1px solid var(--primary-lime)' : '1px solid var(--border-light)',
                  backgroundColor: filterTab === tab ? 'var(--primary-lime-light)' : '#ffffff',
                  color: filterTab === tab ? 'var(--primary-lime)' : 'var(--text-dark)',
                  transition: 'all 0.15s'
                }}
              >
                {tab === 'Active' ? t('orders.tabs.active', { defaultValue: 'Active Shipments' }) : tab === 'Completed' ? t('orders.tabs.completed', { defaultValue: 'Completed Orders' }) : tab === 'Cancelled' ? t('orders.tabs.cancelled', { defaultValue: 'Cancelled Orders' }) : t('orders.tabs.all', { defaultValue: 'All Orders' })}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {language === 'hi' ? `${filteredOrders.length} ऑर्डर दिखाए जा रहे हैं` : `Showing ${filteredOrders.length} orders`}
          </span>
        </div>

        {/* Orders Card Grid */}
        {filteredOrders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ fontSize: '3.5rem' }}>🕉️</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '20px', color: 'var(--text-dark)' }}>{t('orders.emptyTitle')}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '24px' }}>
              {t('orders.emptyFilterDesc', { defaultValue: 'Your selected filters returned zero results. Explore our spiritual catalogs to find sacred essentials.' })}
            </p>
            <button onClick={onNavigateToShop} className="btn-lime" style={{ fontSize: '0.88rem', padding: '12px 28px' }}>
              {t('orders.startShopping', { defaultValue: 'Explore Sacred Store' })}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {filteredOrders.map((order) => {
              const theme = getStatusColor(order);
              const isTrackingExpanded = expandedTrackingOrderId === order.orderId;

              // Compute milestones dynamically
              const isUpi = order.paymentMethod === 'Scan & Pay (UPI)';
              const isConfirmed = order.paymentStatus === 'Confirmed';
              const milestones = isUpi && !isConfirmed ? [
                { label: t('orders.tracking.payment', { defaultValue: 'Payment' }), sublabel: t('orders.tracking.verifying', { defaultValue: 'Verifying' }), done: false, inProgress: true },
                { label: t('orders.tracking.confirmed', { defaultValue: 'Confirmed' }), sublabel: t('orders.tracking.awaiting', { defaultValue: 'Awaiting' }), done: false, inProgress: false },
                { label: t('orders.tracking.prepared', { defaultValue: 'Prepared' }), sublabel: t('orders.tracking.awaiting', { defaultValue: 'Awaiting' }), done: false, inProgress: false },
                { label: t('orders.tracking.dispatched', { defaultValue: 'Dispatched' }), sublabel: t('orders.tracking.awaiting', { defaultValue: 'Awaiting' }), done: false, inProgress: false },
                { label: t('orders.tracking.delivered', { defaultValue: 'Delivered' }), sublabel: t('orders.tracking.awaiting', { defaultValue: 'Awaiting' }), done: false, inProgress: false },
              ] : [
                { label: t('orders.tracking.confirmed', { defaultValue: 'Confirmed' }), sublabel: t('orders.tracking.verified', { defaultValue: 'Verified' }), done: true, inProgress: false },
                { 
                  label: t('orders.tracking.prepared', { defaultValue: 'Prepared' }), 
                  sublabel: order.status === 'Ready for Dispatch' 
                    ? t('orders.tracking.readyForDispatchSub', { defaultValue: 'Ready for Dispatch' })
                    : (order.status === 'Being Packed' ? t('orders.tracking.blessing', { defaultValue: 'Blessing items...' }) : t('orders.tracking.blessed', { defaultValue: 'Blessed' })), 
                  done: order.status !== 'Being Packed' && order.status !== 'Cancelled', 
                  inProgress: order.status === 'Being Packed' 
                },
                { label: t('orders.tracking.dispatched', { defaultValue: 'Dispatched' }), sublabel: t('orders.tracking.hub', { defaultValue: 'Varanasi Hub' }), done: order.status === 'Shipped' || order.status === 'Delivered', inProgress: order.status === 'Shipped' },
                { label: t('orders.tracking.inTransit', { defaultValue: 'In Transit' }), sublabel: t('orders.tracking.nearCity', { defaultValue: 'Near City' }), done: order.status === 'Delivered', inProgress: false },
                { label: t('orders.tracking.delivered', { defaultValue: 'Delivered' }), sublabel: t('orders.tracking.handedOver', { defaultValue: 'Handed over' }), done: order.status === 'Delivered', inProgress: false },
              ];

              return (
                <div
                  key={order.orderId}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    textAlign: 'left'
                  }}
                >
                  {/* Card Main Info Bar */}
                  <div style={{
                     backgroundColor: '#fafafa',
                     padding: isMobile ? '12px 16px' : '18px 24px',
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
                       gap: isMobile ? '8px' : '24px',
                       flexWrap: 'nowrap'
                     }}>
                       <div>
                         <span style={{ display: 'block', fontSize: isMobile ? '0.62rem' : '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                           {isMobile ? t('orders.placed') : t('orders.datePlaced')}
                         </span>
                         <span style={{ fontSize: isMobile ? '0.75rem' : '0.88rem', fontWeight: 700, color: 'var(--text-dark)', whiteSpace: 'nowrap' }}>
                           {isMobile ? order.placedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : order.placedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                         </span>
                       </div>
                       <div>
                         <span style={{ display: 'block', fontSize: isMobile ? '0.62rem' : '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                           {isMobile ? t('orders.total') : t('orders.totalAmount')}
                         </span>
                         <span style={{ fontSize: isMobile ? '0.75rem' : '0.88rem', fontWeight: 900, color: 'var(--primary-forest)', whiteSpace: 'nowrap' }}>
                           ₹{isMobile ? order.total.toFixed(0) : order.total.toFixed(2)}
                         </span>
                       </div>
                       <div>
                         <span style={{ display: 'block', fontSize: isMobile ? '0.62rem' : '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                           {isMobile ? t('orders.id') : t('orders.orderId')}
                         </span>
                         <span style={{ fontSize: isMobile ? '0.75rem' : '0.88rem', fontWeight: 800, color: 'var(--text-dark)', whiteSpace: 'nowrap' }}>
                           {isMobile ? `#${order.orderId.replace('MANTRA-', '')}` : `#${order.orderId}`}
                         </span>
                       </div>
                       <div>
                         <span style={{ display: 'block', fontSize: isMobile ? '0.62rem' : '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                           {t('orders.shipTo', { defaultValue: 'Ship To' })}
                         </span>
                         <span style={{ fontSize: isMobile ? '0.75rem' : '0.88rem', fontWeight: 700, color: 'var(--text-dark)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: isMobile ? '70px' : 'none' }}>
                           {order.fullName}
                         </span>
                       </div>
                       <div>
                         <span style={{ display: 'block', fontSize: isMobile ? '0.62rem' : '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                           {isMobile ? 'PAYMENT' : t('orders.paymentMethod', { defaultValue: 'PAYMENT METHOD' })}
                         </span>
                         <span style={{
                           fontSize: isMobile ? '0.70rem' : '0.78rem',
                           fontWeight: 800,
                           color: (order.paymentMethod === 'COD' || order.paymentMethod === 'Cash on Delivery') ? '#c2410c' : '#0369a1',
                           backgroundColor: (order.paymentMethod === 'COD' || order.paymentMethod === 'Cash on Delivery') ? '#fff7ed' : '#f0f9ff',
                           border: (order.paymentMethod === 'COD' || order.paymentMethod === 'Cash on Delivery') ? '1px solid #ffedd5' : '1px solid #e0f2fe',
                           padding: '2px 8px',
                           borderRadius: '4px',
                           display: 'inline-block',
                           marginTop: '2px',
                           whiteSpace: 'nowrap'
                         }}>
                           {(order.paymentMethod === 'COD' || order.paymentMethod === 'Cash on Delivery')
                             ? 'COD'
                             : (order.paymentMethod === 'Scan & Pay (UPI)' ? 'UPI' : (order.paymentMethod || 'Razorpay'))}
                         </span>
                       </div>
                     </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        backgroundColor: theme.bg,
                        color: theme.text,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {theme.icon}
                        {theme.label}
                      </span>

                      <button
                        onClick={() => setSelectedDetailsOrder(order)}
                        style={{
                          color: 'var(--text-muted)',
                          padding: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}
                        title={t('orders.actions.viewInvoiceBreakdown', { defaultValue: 'View Full Invoice breakdown' })}
                      >
                        <Info size={14} /> {t('orders.actions.details', { defaultValue: 'Details' })}
                      </button>
                    </div>
                  </div>

                  {/* Card Items list */}
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '20px',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: 'var(--radius-md)',
                              background: getCategoryGradient(item.product?.category),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.8rem',
                              flexShrink: 0,
                              overflow: 'hidden'
                            }}>
                              {isImageUrl(item.product?.image) ? (
                                <img src={getDisplayImageUrl(item.product?.image)} alt={item.product?.name || 'Product'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                item.product?.image || '📿'
                              )}
                            </div>
                            <div>
                              <span style={{ fontSize: '0.68rem', color: 'var(--primary-lime)', fontWeight: 800, textTransform: 'uppercase' }}>
                                {item.product?.spiritualType || 'Sacred Item'}
                              </span>
                              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '2px' }}>
                                {item.product?.name || 'Spiritual Item'}
                              </h4>
                              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {t('orders.qty')}: {item.quantity} • {t('shop:price', { defaultValue: 'Price' })}: ₹{(item.product?.price || 0).toFixed(2)} {t('shop:each', { defaultValue: 'each' })}
                              </p>
                            </div>
                          </div>

                          <span style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                            ₹{((item.product?.price || 0) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Collapsible Tracking Timeline Container */}
                    {isTrackingExpanded && (
                      <div style={{
                        marginTop: '24px',
                        padding: '20px',
                        backgroundColor: 'var(--primary-lime-light)',
                        border: '1.5px solid var(--primary-lime)',
                        borderRadius: 'var(--radius-lg)',
                        animation: 'slideUp 0.2s ease-out'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-dark)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Truck size={15} style={{ color: 'var(--primary-lime)' }} /> {t('orders.liveCourierJourney', { defaultValue: 'Live Courier Journey (Sacred Express)' })}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('orders.awb', { defaultValue: 'AWB' })}: SEC-{order.orderId}</span>
                        </div>

                        {/* Tracker Milestones Visual Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', position: 'relative', marginTop: '8px' }}>
                          
                          <div style={{
                            position: 'absolute',
                            top: '7px',
                            left: '10%',
                            right: '10%',
                            height: '2px',
                            backgroundColor: 'var(--border-light)',
                            zIndex: 1
                          }} />

                          {milestones.map((m, mIdx) => (
                             <div key={mIdx} style={{ textAlign: 'center', position: 'relative', zIndex: 5 }}>
                               <div style={{
                                 width: '16px',
                                 height: '16px',
                                 borderRadius: '50%',
                                 backgroundColor: m.done ? 'var(--primary-lime)' : m.inProgress ? '#fbbf24' : 'var(--border-light)',
                                 border: '3px solid #ffffff',
                                 boxShadow: m.done ? '0 0 0 1px var(--primary-lime)' : m.inProgress ? '0 0 0 1px #fbbf24' : 'none',
                                 margin: '0 auto 6px auto',
                                 animation: m.inProgress ? 'spin-anim 2s linear infinite' : 'none'
                               }} />
                               <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: m.done || m.inProgress ? 'var(--text-dark)' : 'var(--text-muted)' }}>{m.label}</span>
                               <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{m.sublabel}</span>
                             </div>
                           ))}

                        </div>
                      </div>
                    )}

                    {/* UPI QR Payment and Screenshot Upload Panel */}
                    {isUpi && !isConfirmed && order.status !== 'Cancelled' && (
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
                              {language === 'hi' ? (
                                <>⚠️ आपका भुगतान ठीक से नहीं हुआ था। कृपया अपने लेन-देन विवरण की जाँच करें और एक मान्य भुगतान स्क्रीनशॉट पुनः अपलोड करें। (अस्वीकृति प्रयास 3 में से {order.paymentDeclineCount || 0})</>
                              ) : (
                                <>⚠️ Your payment was not done properly. Please check your transaction details and re-upload a valid payment screenshot. (Decline Attempt {order.paymentDeclineCount || 0} of 3)</>
                              )}
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
                                    )}&cu=INR&tn=Order%20${order.orderId}`
                                  )}`}
                                  alt="UPI QR Code"
                                  style={{ width: '130px', height: '130px', objectFit: 'contain', marginBottom: '8px' }}
                                />
                              )}
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                                {t('orders.actions.scanToPay', { defaultValue: 'Scan to Pay' })} ₹{order.total.toFixed(2)}
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
                                  <span style={{ fontSize: '0.55rem', color: '#9ca3af', fontWeight: 700 }}>{t('orders.actions.upiId', { defaultValue: 'UPI ID / VPA (Click to Pay)' })}</span>
                                  <a
                                    href={`upi://pay?pa=${barcodeSettings?.upiId || '7974478098@paytm'}&pn=Mantra%20Puja&am=${order.total.toFixed(2)}&cu=INR&tn=Order%20${order.orderId}`}
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
                                  onClick={() => handleCopyOrderUpi(order.orderId, barcodeSettings?.upiId || '7974478098@paytm')}
                                  style={{
                                    padding: '4px 6px',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    backgroundColor: copiedUpiOrderId === order.orderId ? '#dcfce7' : '#ffffff',
                                    color: copiedUpiOrderId === order.orderId ? '#15803d' : 'var(--text-dark)',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    flexShrink: 0
                                  }}>
                                  {copiedUpiOrderId === order.orderId ? <Check size={8} /> : <Copy size={8} />}
                                  {copiedUpiOrderId === order.orderId ? t('affiliate.copied', { defaultValue: 'Copied!' }) : t('affiliate.copy', { defaultValue: 'Copy' })}
                                </button>
                              </div>

                              <button
                                onClick={() => handleUpiRedirect(order.orderId, order.total)}
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
                                {t('orders.actions.payViaUpiApp', { defaultValue: '⚡ Pay via UPI App' })}
                              </button>
                            </div>

                            {/* Upload Screen Column */}
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                              {uploadingOrderId === order.orderId ? (
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
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)' }}>{t('orders.actions.uploading')}</span>
                                </div>
                              ) : selectedFiles[order.orderId] ? (
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
                                    src={URL.createObjectURL(selectedFiles[order.orderId])}
                                    alt="Selected Preview"
                                    style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '4px', marginBottom: '8px', border: '1px solid var(--border-light)' }}
                                  />
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)', wordBreak: 'break-all' }}>
                                    {t('orders.actions.selected')}: {selectedFiles[order.orderId].name}
                                  </span>
                                  <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '12px' }}>
                                    <button
                                      onClick={() => handleOrderScreenshotUpload(order.orderId, selectedFiles[order.orderId])}
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
                                      {t('common:actions.submit', { defaultValue: 'Submit' })}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedFiles(prev => {
                                          const next = { ...prev };
                                          delete next[order.orderId];
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
                                      {t('common:actions.cancel', { defaultValue: 'Cancel' })}
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
                                    <CheckCircle size={14} style={{ color: '#15803d' }} /> {t('orders.actions.receiptUploaded')}
                                  </span>
                                  <p style={{ fontSize: '0.7rem', color: '#166534', marginTop: '2px', marginBottom: '10px' }}>
                                    {t('orders.actions.awaitingConfirmation')}
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
                                    {t('orders.actions.reuploadProof')}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          setSelectedFiles(prev => ({ ...prev, [order.orderId]: file }));
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
                                    {t('orders.actions.uploadPaymentScreenshot', { defaultValue: 'Upload Payment Screenshot' })}
                                  </span>
                                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {t('orders.actions.imageFilesOnly', { defaultValue: 'JPG, PNG files' })}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setSelectedFiles(prev => ({ ...prev, [order.orderId]: file }));
                                      }
                                    }}
                                    style={{ display: 'none' }}
                                  />
                                </label>
                              )}

                              {uploadErrors[order.orderId] && (
                                <p style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 600, marginTop: '6px', textAlign: 'center' }}>
                                  {uploadErrors[order.orderId]}
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
                    padding: '16px 24px',
                    backgroundColor: '#fafafa',
                    borderTop: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }} className="orders-card-toolbar">
                    {/* Left Actions: Tracking and Cancel controls */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: '1 1 auto', minWidth: '140px' }} className="orders-toolbar-left">
                      {order.status !== 'Cancelled' ? (
                        <button
                          onClick={() => setExpandedTrackingOrderId(isTrackingExpanded ? null : order.orderId)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            backgroundColor: isTrackingExpanded ? 'var(--primary-forest)' : '#ffffff',
                            color: isTrackingExpanded ? '#ffffff' : 'var(--text-dark)',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            boxShadow: 'var(--shadow-sm)',
                            cursor: 'pointer',
                            flex: '1 1 auto'
                          }}
                        >
                          <Truck size={14} style={{ color: isTrackingExpanded ? '#ffffff' : 'var(--primary-lime)' }} />
                          <span>{isTrackingExpanded ? t('orders.actions.closeTracking', { defaultValue: 'Close Tracking' }) : t('orders.actions.trackOrder', { defaultValue: 'Track Order' })}</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={14} style={{ color: '#ef4444' }} /> {t('orders.actions.cancelled', { defaultValue: 'Cancelled' })}
                        </span>
                      )}
                    </div>

                    {/* Right Actions: Reorder, Share, Invoice */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end', minWidth: '200px' }} className="orders-toolbar-right">
                      {/* Share Order button */}
                      <button
                        disabled={sharingOrderId === order.orderId}
                        onClick={() => handleNativeShareInvoice(order)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          backgroundColor: shareExpandedOrderId === order.orderId || sharingOrderId === order.orderId ? 'var(--primary-lime-light)' : '#ffffff',
                          color: shareExpandedOrderId === order.orderId || sharingOrderId === order.orderId ? 'var(--primary-lime)' : 'var(--text-dark)',
                          border: `1.5px solid ${shareExpandedOrderId === order.orderId || sharingOrderId === order.orderId ? 'var(--primary-lime)' : 'var(--border-light)'}`,
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          boxShadow: 'var(--shadow-sm)',
                          cursor: sharingOrderId === order.orderId ? 'not-allowed' : 'pointer',
                          flex: '1 1 auto'
                        }}
                      >
                        <Share2 size={14} style={{ color: shareExpandedOrderId === order.orderId || sharingOrderId === order.orderId ? 'var(--primary-lime)' : 'var(--text-muted)' }} />
                        <span>{sharingOrderId === order.orderId ? t('orders.sharing') : t('orders.share')}</span>
                      </button>

                      {/* Download Invoice button */}
                      <button
                        onClick={() => handleDownloadInvoice(order)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          backgroundColor: '#ffffff',
                          color: 'var(--text-dark)',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          boxShadow: 'var(--shadow-sm)',
                          cursor: 'pointer',
                          flex: '1 1 auto'
                        }}
                      >
                        <Download size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{t('orders.downloadInvoice')}</span>
                      </button>

                      {order.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleReorder(order)}
                          className="btn-lime"
                          style={{
                            padding: '8px 18px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            borderRadius: 'var(--radius-md)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            flex: '1 1 auto'
                          }}
                        >
                          <RotateCcw size={14} />
                          <span>{t('orders.actions.reorder', { defaultValue: 'Reorder Items' })}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Share Expanded Panel for this order card */}
                  {shareExpandedOrderId === order.orderId && (
                    <div style={{
                      backgroundColor: '#ffffff',
                      borderTop: '1px solid var(--border-light)',
                      padding: '16px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      textAlign: 'left'
                    }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                        Share your order invoice PDF with a thank you message 🙏
                      </span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[
                          { id: 'whatsapp', label: '💬 WhatsApp', color: '#25d366' },
                          { id: 'twitter', label: '🐦 X (Twitter)', color: '#1d9bf0' },
                          { id: 'telegram', label: '✈️ Telegram', color: '#0088cc' },
                        ].map(p => (
                          <button
                            key={p.id}
                            disabled={sharingOrderId === order.orderId}
                            onClick={() => handleShareInvoice(order, p.id)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: sharingOrderId === order.orderId ? '#e5e7eb' : p.color,
                              color: sharingOrderId === order.orderId ? '#9ca3af' : '#ffffff',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: sharingOrderId === order.orderId ? 'not-allowed' : 'pointer',
                              border: 'none',
                              transition: 'all 0.2s ease',
                              flex: '1 1 auto',
                              textAlign: 'center'
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          </div>
        )}

      </div>


      {/* ==============================================
          MODAL: VIEW DETAILS DRAWER
          ============================================== */}
      {selectedDetailsOrder && (
        <div style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0, left: 0,
          backgroundColor: 'rgba(45, 20, 14, 0.85)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            width: '90%',
            maxWidth: '520px',
            overflow: 'hidden',
            textAlign: 'left'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, var(--primary-forest) 0%, #4a2010 100%)',
              color: '#ffffff',
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{t('orders.detailsTitle', { defaultValue: 'Order Details' })}: #{selectedDetailsOrder.orderId}</h3>
              <button
                onClick={() => setSelectedDetailsOrder(null)}
                style={{ color: '#ffffff', fontSize: '0.82rem', fontWeight: 700 }}
              >
                {t('common:actions.close', { defaultValue: 'Close' })}
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              
              {/* Delivery info */}
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                  <MapPin size={12} style={{ color: 'var(--primary-lime)' }} /> {t('orders.deliveryAddress', { defaultValue: 'Delivery Address' })}
                </span>
                <div style={{ backgroundColor: '#fafafa', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                  <p style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)' }}>{selectedDetailsOrder.fullName}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Email: {selectedDetailsOrder.email}</p>
                  {(() => {
                    const parsedAddr = parseAddressLine2(selectedDetailsOrder.addressLine2 || '');
                    return (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Phone: {selectedDetailsOrder.phoneNumber}
                        {parsedAddr.altPhone ? ` / Alt: ${parsedAddr.altPhone}` : ''}
                      </p>
                    );
                  })()}
                  {(() => {
                    const parsedAddr = parseAddressLine2(selectedDetailsOrder.addressLine2 || '');
                    if (parsedAddr.flat || parsedAddr.landmark || parsedAddr.altPhone) {
                      return (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dark)', marginTop: '6px', lineHeight: 1.4 }}>
                          {parsedAddr.flat ? `${parsedAddr.flat}, ` : ''}{selectedDetailsOrder.addressLine1}
                          {parsedAddr.landmark && <><br />Landmark: {parsedAddr.landmark}</>}
                          <br />
                          {selectedDetailsOrder.deliveryCity}, {selectedDetailsOrder.deliveryState} - {selectedDetailsOrder.pincode}
                        </p>
                      );
                    }
                    return (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-dark)', marginTop: '6px', lineHeight: 1.4 }}>
                        {selectedDetailsOrder.addressLine1}
                        {selectedDetailsOrder.addressLine2 ? `, ${selectedDetailsOrder.addressLine2}` : ''}
                        <br />
                        {selectedDetailsOrder.deliveryCity}, {selectedDetailsOrder.deliveryState} - {selectedDetailsOrder.pincode}
                      </p>
                    );
                  })()}
                </div>
              </div>

              {/* Items List */}
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                  <Package size={12} style={{ color: 'var(--primary-lime)' }} /> {t('orders.purchasedSacredItems', { defaultValue: 'Purchased Sacred Items' })}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedDetailsOrder.items.map((i, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                        {i.product.name} <span style={{ color: 'var(--text-muted)' }}>× {i.quantity}</span>
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                        ₹{(i.product.price * i.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing details */}
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                  {t('orders.billingBreakdown', { defaultValue: 'Billing Breakdown' })}
                </span>
                <div style={{ backgroundColor: 'var(--primary-lime-light)', border: '1px solid #ffedd5', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t('orders.subtotal', { defaultValue: 'Items Subtotal' })}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>₹{selectedDetailsOrder.subtotal.toFixed(2)}</span>
                    </div>
                    {selectedDetailsOrder.discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{t('orders.couponSavings', { defaultValue: 'Coupon Savings' })} ({selectedDetailsOrder.discountPercent}%)</span>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>-₹{selectedDetailsOrder.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t('orders.shippingMethod', { defaultValue: 'Sacred Shipping' })}</span>
                      <span style={{ fontWeight: 700, color: selectedDetailsOrder.shipping === 0 ? '#10b981' : 'var(--text-dark)' }}>
                        {selectedDetailsOrder.shipping === 0 ? t('checkout:free', { defaultValue: 'FREE' }) : `₹${selectedDetailsOrder.shipping.toFixed(2)}`}
                      </span>
                    </div>
                     {selectedDetailsOrder.tax > 0 && (
                       <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{t('orders.vedicTax', { defaultValue: 'Vedic Services Tax' })} ({selectedDetailsOrder.gstPercentSnapshot !== undefined && selectedDetailsOrder.gstPercentSnapshot !== null ? selectedDetailsOrder.gstPercentSnapshot : 8}%)</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>₹{selectedDetailsOrder.tax.toFixed(2)}</span>
                       </div>
                     )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t('orders.paymentMethod', { defaultValue: 'Payment Method' })}</span>
                      <span style={{
                        fontWeight: 800,
                        color: (selectedDetailsOrder.paymentMethod === 'COD' || selectedDetailsOrder.paymentMethod === 'Cash on Delivery') ? '#c2410c' : '#0369a1'
                      }}>
                        {(selectedDetailsOrder.paymentMethod === 'COD' || selectedDetailsOrder.paymentMethod === 'Cash on Delivery')
                          ? 'Cash on Delivery (COD)'
                          : (selectedDetailsOrder.paymentMethod === 'Scan & Pay (UPI)' ? 'Scan & Pay (UPI)' : (selectedDetailsOrder.paymentMethod || 'Razorpay'))}
                        {selectedDetailsOrder.paymentStatus ? ` (${selectedDetailsOrder.paymentStatus})` : ''}
                      </span>
                    </div>
                    <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '6px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '1rem', fontWeight: 900 }}>
                      <span>{t('orders.grandTotal', { defaultValue: 'Grand Total' })}</span>
                      <span style={{ color: 'var(--primary-forest)', fontSize: '1.2rem' }}>₹{selectedDetailsOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#fafafa' }}>
              <button
                onClick={() => setSelectedDetailsOrder(null)}
                className="btn-lime"
                style={{ padding: '10px 24px', fontSize: '0.82rem', borderRadius: 'var(--radius-md)' }}
              >
                {t('common:actions.close', { defaultValue: 'Close' })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded SlideUp & spin keyframes */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .spin-anim {
          animation: spin 1s linear infinite;
        }
      `}</style>

    </div>
  );
};
