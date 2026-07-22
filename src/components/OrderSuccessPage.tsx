import React from 'react';
import {
  Check,
  Package,
  Truck,
  MapPin,
  ShieldCheck,
  Sparkles,
  Download,
  Share2,
  Copy,
  ArrowRight,
  Clock,
  Star,
  Bell,
  ChevronRight,
  Home,
} from 'lucide-react';
import type { CartItem, Product } from '../types';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import logo from '../assets/My_logo/Frame 16.png';
import { uploadToR2 } from '../lib/cloudflare/r2';
import { createProductShareCard } from '../lib/shareHelper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../lib/i18n';

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
  
  if (cleaned.startsWith('__STRUCTURED_ADDR__:')) {
    try {
      return JSON.parse(cleaned.substring(20));
    } catch (e) {
      return { flat: '', landmark: '', altPhone: '', addressLine2: cleaned };
    }
  }
  return { flat: '', landmark: '', altPhone: '', addressLine2: cleaned };
};

const generateInvoiceDoc = async (order: OrderDetails, t: any): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [74, 32, 16]; // #4a2010 (Dark Brown)
  const secondaryColor = [234, 88, 12]; // #ea580c (Orange)
  const textColor = [55, 65, 81]; // #374151 (Dark Gray)
  const lightGray = [229, 231, 235]; // #e5e7eb

  // Header - Brand Left Side (With logo image load)
  try {
    const logoDataUrl = await getAssetAsDataUrl(logo);
    doc.addImage(logoDataUrl, 'PNG', 14, 12, 12, 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(t('pdf.title'), 29, 21);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text(t('pdf.subtitle'), 29, 26);
    doc.text(t('pdf.email'), 29, 30);
    doc.text(t('pdf.web'), 29, 34);
  } catch (e) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(t('pdf.title'), 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text(t('pdf.subtitle'), 14, 25);
    doc.text(t('pdf.email'), 14, 29);
    doc.text(t('pdf.web'), 14, 33);
  }

  // Header - Invoice Info (Right side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(t('pdf.invoice'), 196, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(t('pdf.invoiceId', { orderId: order.orderId }), 196, 26, { align: 'right' });
  doc.text(t('pdf.date', { date: new Date(order.placedAt).toLocaleDateString('en-IN') }), 196, 31, { align: 'right' });

  // Divider Line
  doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setLineWidth(0.5);
  doc.line(14, 42, 196, 42);

  // Billing Address Section (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(t('pdf.billTo'), 14, 50);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(order.fullName, 14, 55);

  // Format long address nicely
  const parsedAddr = parseAddressLine2(order.addressLine2 || '');
  let displayAddressText = '';
  let altPhone = '';
  if (parsedAddr.flat || parsedAddr.landmark || parsedAddr.altPhone) {
    const parts = [];
    if (parsedAddr.flat) parts.push(parsedAddr.flat);
    parts.push(order.addressLine1);
    if (parsedAddr.landmark) parts.push(`Landmark: ${parsedAddr.landmark}`);
    displayAddressText = parts.join(', ') + `, ${order.deliveryCity}, ${order.deliveryState} - ${order.pincode}`;
    if (parsedAddr.altPhone) altPhone = parsedAddr.altPhone;
  } else {
    displayAddressText = `${order.addressLine1}${order.addressLine2 ? ', ' + order.addressLine2 : ''}, ${order.deliveryCity}, ${order.deliveryState} - ${order.pincode}`;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99); // gray-600
  doc.text(t('pdf.phone', { phone: order.phoneNumber }) + (altPhone ? ` / Alt: ${altPhone}` : ''), 14, 60);
  doc.text(t('pdf.emailLabel', { email: order.email }), 14, 64);
  
  const splitAddress = doc.splitTextToSize(displayAddressText, 80);
  doc.text(splitAddress, 14, 68);

  // Payment details (Right side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(t('pdf.paymentDetails'), 120, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(t('pdf.method', { method: order.paymentMethod }), 120, 55);

  let displayPaymentStatus = order.paymentStatus || 'Pending';
  if (order.paymentMethod?.toLowerCase().includes('razorpay')) {
    displayPaymentStatus = 'Confirmed';
  }
  const translatedStatus = displayPaymentStatus === 'Confirmed' ? t('tracking.confirmed.time') : t('tracking.confirmedAwaiting.time');
  doc.text(t('pdf.status', { status: translatedStatus }), 120, 59);

  const isCodOrder = order.paymentMethod === 'COD' || order.paymentMethod === 'Cash on Delivery';
  if (isCodOrder) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(217, 119, 6); // Amber/Orange
    doc.text(`Order payment detail: Please collect Rs. ${order.total.toFixed(2)} in Cash`, 120, 64);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  }

  // Table header background block
  let y = 85;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, y, 182, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(t('pdf.sacredItemDetails'), 18, y + 5.5);
  doc.text(t('pdf.qty'), 115, y + 5.5, { align: 'center' });
  doc.text(t('pdf.price'), 150, y + 5.5, { align: 'right' });
  doc.text(t('pdf.amount'), 190, y + 5.5, { align: 'right' });

  y += 8; // move past header row

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  order.items.forEach((item, index) => {
    // Alternating row backgrounds
    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251); // gray-50
      doc.rect(14, y, 182, 8, 'F');
    }
    
    doc.text(item.product.name, 18, y + 5.5);
    doc.text(item.quantity.toString(), 115, y + 5.5, { align: 'center' });
    doc.text(`${t('pdf.currency')} ${item.product.price.toFixed(2)}`, 150, y + 5.5, { align: 'right' });
    doc.text(`${t('pdf.currency')} ${(item.product.price * item.quantity).toFixed(2)}`, 190, y + 5.5, { align: 'right' });
    
    y += 8;
  });

  // Table border line below rows
  doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.line(14, y, 196, y);
  y += 8;

  // Pricing calculations block
  const labelX = 135;
  const valueX = 190;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  doc.text(t('pdf.subtotal'), labelX, y);
  doc.text(`${t('pdf.currency')} ${order.subtotal.toFixed(2)}`, valueX, y, { align: 'right' });
  y += 6;

  if (order.discount > 0) {
    doc.setTextColor(16, 185, 129); // green
    doc.text(t('pdf.discount', { percent: order.discountPercent }), labelX, y);
    doc.text(`-${t('pdf.currency')} ${order.discount.toFixed(2)}`, valueX, y, { align: 'right' });
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    y += 6;
  }

  doc.text(t('pdf.shipping'), labelX, y);
  doc.text(order.shipping === 0 ? t('pdf.free') : `${t('pdf.currency')} ${order.shipping.toFixed(2)}`, valueX, y, { align: 'right' });
  y += 6;

  const codFeeAmount = (order as any).codFee || (order as any).cod_fee || (isCodOrder ? 50 : 0);
  if (codFeeAmount > 0) {
    doc.setTextColor(234, 88, 12); // Orange / Amber
    doc.setFont('helvetica', 'bold');
    doc.text('COD Handling Charge:', labelX, y);
    doc.text(`+${t('pdf.currency')} ${Number(codFeeAmount).toFixed(2)}`, valueX, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    y += 6;
  }

  const pdfDisplayTotal = Math.max(Number(order.total || 0), (Number(order.subtotal || 0) - Number(order.discount || 0) + Number(order.shipping || 0) + Number(order.tax || 0) + Number(codFeeAmount || 0)));

  // Draw line for total
  doc.setLineWidth(0.5);
  doc.line(130, y, 196, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(t('pdf.totalCharged'), labelX, y);
  doc.text(`${t('pdf.currency')} ${pdfDisplayTotal.toFixed(2)}`, valueX, y, { align: 'right' });
  y += 15;

  // Footer Blessings Box
  const pageHeight = doc.internal.pageSize.getHeight();
  let footerY = pageHeight - 35; // Position near the bottom of A4 page
  if (y > footerY) {
    footerY = y + 10;
  }

  // Draw decorative line
  doc.setDrawColor(251, 191, 36); // Gold border
  doc.setLineWidth(0.7);
  doc.line(20, footerY, 190, footerY);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(t('pdf.blessingsText'), 105, footerY + 7, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128); // gray
  doc.text(t('pdf.thankYou'), 105, footerY + 13, { align: 'center' });

  return doc;
};

export interface OrderDetails {
  orderId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountPercent: number;
  shipping: number;
  tax: number;
  codFee?: number;
  total: number;
  paymentMethod: string;
  deliveryCity: string;
  deliveryState: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  pincode: string;
  placedAt: Date;
  razorpayPaymentId?: string;
  paymentScreenshot?: string;
  appliedCouponCode?: string;
  gstPercentSnapshot?: number;
  gstAmountSnapshot?: number;
  deliveryAmountSnapshot?: number;
  freeDeliveryEligibleSnapshot?: boolean;
  paymentStatus?: string;
  status?: string;
}

interface OrderSuccessPageProps {
  order: OrderDetails;
  onContinueShopping: () => void;
  onGoHome: () => void;
  onViewOrders: () => void;
  products?: Product[];
  onViewProductDetails?: (product: Product) => void;
}

/* ─── Floating particle component ─── */
const FloatingDot: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div style={{
    position: 'absolute',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    animation: 'floatUp 3s ease-in-out infinite',
    ...style,
  }} />
);

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({
  order,
  onContinueShopping,
  onGoHome,
  onViewOrders,
  products = [],
  onViewProductDetails,
}) => {
  const [liveStatus, setLiveStatus] = React.useState<string>(order.status || 'Being Packed');
  const [livePaymentStatus, setLivePaymentStatus] = React.useState<string>(order.paymentStatus || 'Pending');
  const [copied, setCopied] = React.useState(false);
  const [invoiceDownloaded, setInvoiceDownloaded] = React.useState(false);
  const [shareExpanded, setShareExpanded] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);
  const { language } = useLanguage();
  const { t } = useTranslation('orderSuccess');
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    import('../lib/i18next').then(({ loadNamespaces }) => {
      Promise.all([
        loadNamespaces(language, ['orderSuccess']),
        loadNamespaces('en', ['orderSuccess'])
      ]).then(() => setIsReady(true));
    });
  }, [language]);

  const isLockdownMode = React.useMemo(() => {
    const items = order?.items || [];
    return items.some((item: any) => {
      const p = item.product || {};
      const pSlug = p.slug || item.slug || '';
      const pName = p.name || item.name || '';
      const pPrice = p.price || item.price || 0;
      
      const slugMatch = pSlug === 'vidya-rudraksh' || pSlug === 'vidya-rudraksh-101';
      const nameMatch = (pName.toLowerCase().includes('vidya') || pName.includes('विद्या')) && 
                        (pName.toLowerCase().includes('rudraksh') || pName.includes('रुद्राक्ष'));
      const priceMatch = pPrice === 1 || pPrice === 101;
      
      return slugMatch || nameMatch || priceMatch;
    });
  }, [order]);

  const suggestedProducts = React.useMemo(() => {
    if (!products || products.length === 0) {
      return [
        { id: '1', name: t('mock.product1'), price: 299, image: '📿', badge: t('mock.badgePopular'), product: null as any },
        { id: '2', name: t('mock.product2'), price: 149, image: '🪔', badge: t('mock.badgeNew'), product: null as any },
        { id: '3', name: t('mock.product3', { defaultValue: 'Rose Incense Sticks' }), price: 89, image: '🌸', badge: t('mock.badgeBestseller', { defaultValue: 'Bestseller' }), product: null as any },
        { id: '4', name: t('mock.product4', { defaultValue: 'Shiva Kavach Yantra' }), price: 499, image: '🔱', badge: t('mock.badgeDivine', { defaultValue: 'Divine' }), product: null as any },
      ];
    }

    const orderedProductIds = new Set(order.items.map(item => item.product.id));
    const eligible = products.filter(p => !orderedProductIds.has(p.id) && p.inStock);

    const sorted = [...eligible].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const list = sorted.length >= 4 
      ? sorted.slice(0, 4) 
      : [...sorted, ...products.filter(p => orderedProductIds.has(p.id) && p.inStock)].slice(0, 4);

    return list.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      badge: (p as any).badges?.[0] || (p.popularity > 80 ? 'Popular' : p.rating >= 4.8 ? 'Bestseller' : ''),
      product: p
    }));
  }, [products, order.items]);

  React.useEffect(() => {
    if (order.status) setLiveStatus(order.status);
    if (order.paymentStatus) setLivePaymentStatus(order.paymentStatus);
  }, [order.status, order.paymentStatus]);

  React.useEffect(() => {
    const isUpi = order.paymentMethod === 'Scan & Pay (UPI)';
    // Stop polling if UPI payment is confirmed and status is Delivered, or if not UPI.
    if (!isUpi || (livePaymentStatus === 'Confirmed' && liveStatus === 'Delivered')) {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('website_store_orders')
          .select('status, payment_status')
          .eq('order_id', order.orderId)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          if (data.status) setLiveStatus(data.status);
          if (data.payment_status) setLivePaymentStatus(data.payment_status);
        }
      } catch (err) {
        console.error('Error polling order status on success page:', err);
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, [order.orderId, order.paymentMethod, livePaymentStatus, liveStatus]);

  const dynamicSteps = React.useMemo(() => {
    if (!isReady) return [];
    const isUpi = order.paymentMethod === 'Scan & Pay (UPI)';
    const isConfirmed = livePaymentStatus === 'Confirmed';

    if (isUpi && !isConfirmed) {
      return [
        { icon: <Clock size={16} />, label: t('tracking.verification.title'), desc: t('tracking.verification.description'), done: false, inProgress: true, time: t('tracking.verification.time') },
        { icon: <Check size={16} />, label: t('tracking.confirmed.title'), desc: t('tracking.confirmedAwaiting.description'), done: false, inProgress: false, time: t('tracking.confirmedAwaiting.time') },
        { icon: <Package size={16} />, label: t('tracking.packing.title'), desc: t('tracking.packing.description'), done: false, inProgress: false, time: t('tracking.packing.timeAwaiting') },
        { icon: <Truck size={16} />, label: t('tracking.delivery.title'), desc: t('tracking.delivery.description'), done: false, inProgress: false, time: t('tracking.delivery.timeAwaiting') },
        { icon: <MapPin size={16} />, label: t('tracking.delivered.title'), desc: t('tracking.delivered.description'), done: false, inProgress: false, time: t('tracking.delivered.timeAwaiting') },
      ];
    }

    if (isUpi && isConfirmed) {
      return [
        { icon: <Check size={16} />, label: t('tracking.confirmedPayment.title'), desc: t('tracking.confirmedPayment.description'), done: true, inProgress: false, time: t('tracking.confirmedPayment.time') },
        { icon: <Check size={16} />, label: t('tracking.confirmed.title'), desc: t('tracking.confirmed.description'), done: true, inProgress: false, time: t('tracking.confirmed.time') },
        { icon: <Package size={16} />, label: t('tracking.packing.title'), desc: t('tracking.packing.description'), done: liveStatus !== 'Being Packed', inProgress: liveStatus === 'Being Packed', time: liveStatus === 'Being Packed' ? t('tracking.packing.timeToday') : t('tracking.packing.timeCompleted') },
        { icon: <Truck size={16} />, label: t('tracking.delivery.title'), desc: t('tracking.delivery.description'), done: liveStatus === 'Delivered', inProgress: liveStatus === 'Shipped', time: liveStatus === 'Shipped' ? t('tracking.delivery.timeExpected') : liveStatus === 'Delivered' ? t('tracking.delivery.timeCompleted') : t('tracking.delivery.timeAwaiting') },
        { icon: <MapPin size={16} />, label: t('tracking.delivered.title'), desc: t('tracking.delivered.description'), done: liveStatus === 'Delivered', inProgress: false, time: liveStatus === 'Delivered' ? t('tracking.delivered.timeCompleted') : t('tracking.delivered.timeEstimated') },
      ];
    }

    // Default flow (e.g. COD)
    return [
      { icon: <Check size={16} />, label: t('tracking.confirmed.title'), desc: t('tracking.confirmed.description'), done: true, inProgress: false, time: t('tracking.confirmed.time') },
      { icon: <Package size={16} />, label: t('tracking.packing.title'), desc: t('tracking.packing.description'), done: liveStatus !== 'Being Packed', inProgress: liveStatus === 'Being Packed', time: liveStatus === 'Being Packed' ? t('tracking.packing.timeToday') : t('tracking.packing.timeCompleted') },
      { icon: <Truck size={16} />, label: t('tracking.delivery.title'), desc: t('tracking.delivery.description'), done: liveStatus === 'Delivered', inProgress: liveStatus === 'Shipped', time: liveStatus === 'Shipped' ? t('tracking.delivery.timeExpected') : liveStatus === 'Delivered' ? t('tracking.delivery.timeCompleted') : t('tracking.delivery.timeAwaiting') },
      { icon: <MapPin size={16} />, label: t('tracking.delivered.title'), desc: t('tracking.delivered.description'), done: liveStatus === 'Delivered', inProgress: false, time: liveStatus === 'Delivered' ? t('tracking.delivered.timeCompleted') : t('tracking.delivered.timeEstimated') },
    ];
  }, [order.paymentMethod, liveStatus, livePaymentStatus, isReady, t]);

  const estimatedDelivery = React.useMemo(() => {
    const d = new Date(order.placedAt);
    d.setDate(d.getDate() + 5);
    return d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [order.placedAt, language]);

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.orderId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadInvoice = async () => {
    try {
      const tEn = (key: string, options?: any) => t(key, { ...options, lng: 'en' });
      const doc = await generateInvoiceDoc(order, tEn);
      doc.save(`Invoice-${order.orderId}.pdf`);
      setInvoiceDownloaded(true);
      setTimeout(() => setInvoiceDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to download invoice:', err);
      alert(t('alerts.downloadError'));
    }
  };

  const handleShare = async (platform: string) => {
    setIsSharing(true);
    try {
      // Trigger a backend ping to execute the file-copy mechanism if not run yet
      try {
        await fetch('/api/r2-presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purpose: 'invoices', filename: 'ping.pdf', contentType: 'application/pdf', fileSize: 100 })
        }).catch(() => {});
      } catch (e) {}

      const productName = order.items?.[0]?.product?.name || (language === 'hi' ? 'विद्या रुद्राक्ष' : 'Vidya Rudraksh');
      const firstItem = order.items?.[0];
      const productPrice = firstItem?.product?.price;
      const productSlug = (firstItem?.product as any)?.slug || '';
      
      let blessingKey = 'share.blessingText';
      const isVidyaRudraksh = productSlug.includes('vidya-rudraksh') || firstItem?.product?.name?.toLowerCase().includes('vidya');
      if (isVidyaRudraksh) {
        if (productPrice === 1001 || productSlug === 'vidya-rudraksh-1001') {
          blessingKey = 'share.blessingText_1001';
        } else if (productPrice === 101 || productSlug === 'vidya-rudraksh-101') {
          blessingKey = 'share.blessingText_101';
        } else if (productPrice === 1 || productSlug === 'vidya-rudraksh') {
          blessingKey = 'share.blessingText_1';
        }
      }
      const productUrl = productSlug 
        ? `${window.location.origin}/product/${productSlug}` 
        : `${window.location.origin}/shop`;
      const blessingText = t(blessingKey, { productName, url: productUrl });
      const isNoImage = isVidyaRudraksh && (productPrice === 101 || productPrice === 1001 || productSlug === 'vidya-rudraksh-101' || productSlug === 'vidya-rudraksh-1001');

      let text = blessingText;
      let publicUrl = '';
      if (!isNoImage) {
        const cardBlob = await createProductShareCard();
        const cardFile = new File([cardBlob], t('share.fileName'), { type: 'image/jpeg' });
        publicUrl = await uploadToR2(cardFile, 'referrals', true);
        text = `${blessingText}\n\n👉 View Blessings Card: ${publicUrl}`;
      }
      const encoded = encodeURIComponent(text);

      const urls: Record<string, string> = {
        whatsapp: `https://wa.me/?text=${encoded}`,
        twitter: `https://twitter.com/intent/tweet?text=${encoded}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(publicUrl || (window.location.origin + '/shop'))}&text=${encoded}`,
      };

      if (urls[platform]) {
        window.open(urls[platform], '_blank');
      }
    } catch (err) {
      console.error('Failed to share invoice:', err);
      alert(t('alerts.shareError'));
    } finally {
      setIsSharing(false);
    }
  };

  const handleNativeShare = async () => {
    setIsSharing(true);
    try {
      // Trigger a backend ping to execute the file-copy mechanism if not run yet
      try {
        await fetch('/api/r2-presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purpose: 'invoices', filename: 'ping.pdf', contentType: 'application/pdf', fileSize: 100 })
        }).catch(() => {});
      } catch (e) {}

      const productName = order.items?.[0]?.product?.name || (language === 'hi' ? 'विद्या रुद्राक्ष' : 'Vidya Rudraksh');
      const firstItem = order.items?.[0];
      const productPrice = firstItem?.product?.price;
      const productSlug = (firstItem?.product as any)?.slug || '';
      
      let blessingKey = 'share.blessingText';
      const isVidyaRudraksh = productSlug.includes('vidya-rudraksh') || firstItem?.product?.name?.toLowerCase().includes('vidya');
      if (isVidyaRudraksh) {
        if (productPrice === 1001 || productSlug === 'vidya-rudraksh-1001') {
          blessingKey = 'share.blessingText_1001';
        } else if (productPrice === 101 || productSlug === 'vidya-rudraksh-101') {
          blessingKey = 'share.blessingText_101';
        } else if (productPrice === 1 || productSlug === 'vidya-rudraksh') {
          blessingKey = 'share.blessingText_1';
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
            title: t('share.title'),
            text: blessingText
          });
          return;
        }
        setShareExpanded(p => !p);
        return;
      }

      const cardBlob = await createProductShareCard();
      const cardFile = new File([cardBlob], t('share.fileName'), { type: 'image/jpeg' });

      // Try native share API with attached image file
      if (navigator.canShare && navigator.canShare({ files: [cardFile] })) {
        await navigator.share({
          files: [cardFile],
          title: t('share.title'),
          text: blessingText
        });
        return;
      }

      // Fallback 1: Upload sharing card to Cloudflare R2 and share URL link
      const publicUrl = await uploadToR2(cardFile, 'referrals', true);
      const fallbackText = `${blessingText}\n\n👉 View Blessings Card: ${publicUrl}`;

      if (navigator.share) {
        await navigator.share({
          title: t('share.title'),
          text: fallbackText
        });
        return;
      }
      
      // Fallback: expand social media share panel
      setShareExpanded(p => !p);
    } catch (err: any) {
      console.error('Native share failed:', err);
      if (err?.name === 'AbortError') {
        return;
      }
      alert(t('alerts.shareFailed', { error: err?.message || String(err) }));
      setShareExpanded(p => !p);
    } finally {
      setIsSharing(false);
    }
  };

  if (!isReady) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--text-muted)' }}>
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', paddingBottom: '80px', position: 'relative', overflow: 'hidden' }}>

      {/* ── Injected keyframe animations ── */}
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1); opacity: 0.7; }
          50%  { transform: translateY(-20px) scale(1.1); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 0.7; }
        }
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0 rgba(249,115,22,0.35); }
          70%  { box-shadow: 0 0 0 18px rgba(249,115,22,0); }
          100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        .success-section { animation: slideUp 0.5s ease both; }
        .success-section:nth-child(1) { animation-delay: 0.0s; }
        .success-section:nth-child(2) { animation-delay: 0.1s; }
        .success-section:nth-child(3) { animation-delay: 0.2s; }
        .success-section:nth-child(4) { animation-delay: 0.3s; }
        .success-section:nth-child(5) { animation-delay: 0.4s; }
        .success-section:nth-child(6) { animation-delay: 0.5s; }
        .share-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
      `}</style>

      {/* ── Background floating dots (celebration) ── */}
      {[
        { top: '8%', left: '5%', backgroundColor: '#fdba74', animationDelay: '0s' },
        { top: '15%', right: '8%', backgroundColor: '#86efac', animationDelay: '0.5s' },
        { top: '30%', left: '2%', backgroundColor: '#fcd34d', animationDelay: '1s' },
        { top: '10%', left: '45%', backgroundColor: '#f97316', animationDelay: '0.8s' },
        { top: '25%', right: '3%', backgroundColor: '#fbbf24', animationDelay: '1.4s' },
        { top: '5%', right: '25%', backgroundColor: '#6ee7b7', animationDelay: '0.3s' },
      ].map((s, i) => <FloatingDot key={i} style={s} />)}

      {/* ═══════════════════════════════════════
          HERO SUCCESS BANNER
      ═══════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(160deg, var(--primary-forest) 0%, #6b3020 50%, #2d140e 100%)',
        paddingTop: '48px',
        paddingBottom: '72px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(249,115,22,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(251,191,36,0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />

        {/* ── Animated success ring + tick ── */}
        <div style={{
          width: '96px', height: '96px', borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px auto',
          animation: 'pulseRing 2s ease-out infinite',
          position: 'relative',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            backgroundColor: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
          }}>
            <Check size={36} style={{ color: '#10b981', strokeWidth: 3 }} />
          </div>
        </div>

        <div style={{ fontSize: '2.2rem', marginBottom: '10px' }}>🙏</div>
        <h1 style={{
          fontSize: '2.4rem', fontWeight: 900, color: '#ffffff',
          letterSpacing: '-0.5px', marginBottom: '12px',
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          {t('title')}
        </h1>
        <p style={{
          fontSize: '1rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500,
          maxWidth: '480px', margin: '0 auto 28px auto', lineHeight: 1.6,
        }}>
          {t('description')}
        </p>

        {/* ── Order ID pill ── */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          backgroundColor: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 'var(--radius-full)',
          padding: '10px 20px',
          backdropFilter: 'blur(8px)',
        }}>
          <Package size={16} style={{ color: 'rgba(255,255,255,0.8)' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.02em' }}>
            {t('orderId', { orderId: order.orderId })}
          </span>
          <button
            id="success-copy-order-id"
            onClick={handleCopyOrderId}
            title={t('copy')}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', borderRadius: 'var(--radius-full)',
              backgroundColor: copied ? '#10b981' : 'rgba(255,255,255,0.18)',
              color: '#ffffff', fontSize: '0.72rem', fontWeight: 700,
              transition: 'all 0.2s ease', cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = copied ? '#10b981' : 'rgba(255,255,255,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = copied ? '#10b981' : 'rgba(255,255,255,0.18)')}
          >
            {copied ? <><Check size={11} /> {t('copied')}</> : <><Copy size={11} /> {t('copy')}</>}
          </button>
        </div>


      </div>

      {/* ═══════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════ */}
      <div className="container" style={{ marginTop: '-32px', position: 'relative', zIndex: 1 }}>

        {/* ── CTA Action Row ── */}
        <div className="success-section" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
          marginBottom: '28px',
        }}>
          {/* Continue Shopping */}
          <button
            id="success-continue-shopping"
            onClick={onContinueShopping}
            className="btn-lime card-hover"
            style={{
              padding: '16px 12px', borderRadius: 'var(--radius-md)',
              justifyContent: 'center', flexDirection: 'column', gap: '6px',
              fontSize: '0.82rem', fontWeight: 800,
              transition: 'all 0.2s ease',
            }}
          >
            <Sparkles size={20} />
            {t('continueShopping')}
          </button>

          {/* Download Invoice */}
          <button
            id="success-download-invoice"
            onClick={handleDownloadInvoice}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '6px', padding: '16px 12px', borderRadius: 'var(--radius-md)',
              backgroundColor: invoiceDownloaded ? '#f0fdf4' : '#ffffff',
              border: `1.5px solid ${invoiceDownloaded ? '#86efac' : 'var(--border-light)'}`,
              color: invoiceDownloaded ? '#166534' : 'var(--text-dark)',
              fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer',
              transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)',
            }}
            className="card-hover"
          >
            <Download size={20} style={{ color: invoiceDownloaded ? '#10b981' : 'var(--primary-lime)' }} />
            {invoiceDownloaded ? t('downloaded') : t('downloadInvoice')}
          </button>

          {/* Share Order */}
          <button
            id="success-share-order"
            disabled={isSharing}
            onClick={handleNativeShare}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '6px', padding: '16px 12px', borderRadius: 'var(--radius-md)',
              backgroundColor: shareExpanded || isSharing ? 'var(--primary-lime-light)' : '#ffffff',
              border: `1.5px solid ${shareExpanded || isSharing ? 'var(--primary-lime)' : 'var(--border-light)'}`,
              color: shareExpanded || isSharing ? 'var(--primary-lime)' : 'var(--text-dark)',
              fontSize: '0.82rem', fontWeight: 800, cursor: isSharing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)',
            }}
            className="card-hover"
          >
            <Share2 size={20} style={{ color: shareExpanded || isSharing ? 'var(--primary-lime)' : 'var(--text-muted)' }} />
            {isSharing ? t('preparing') : t('shareOrder')}
          </button>
        </div>

        {/* Share Expanded Panel */}
        {shareExpanded && (
          <div className="success-section" style={{
            backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)', padding: '20px 24px',
            marginBottom: '24px', boxShadow: 'var(--shadow-sm)',
          }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px' }}>
              {t('sharePanel.title')}
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { id: 'whatsapp', label: t('sharePanel.whatsapp'), color: '#25d366' },
                { id: 'twitter', label: t('sharePanel.twitter'), color: '#1d9bf0' },
                { id: 'telegram', label: t('sharePanel.telegram'), color: '#0088cc' },
              ].map(p => (
                <button
                  key={p.id}
                  id={`success-share-${p.id}`}
                  disabled={isSharing}
                  onClick={() => handleShare(p.id)}
                  className="share-btn"
                  style={{
                    padding: '10px 18px', borderRadius: 'var(--radius-full)',
                    backgroundColor: isSharing ? '#e5e7eb' : p.color,
                    color: isSharing ? '#9ca3af' : '#ffffff',
                    fontSize: '0.82rem', fontWeight: 700, cursor: isSharing ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease', border: 'none',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TWO-COLUMN LAYOUT ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '24px', alignItems: 'start' }} className="hero-grid-split">

          {/* ── LEFT: Order Summary + Tracking ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Order Items Card */}
            <div className="success-section" style={{
              backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)', overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}>
              {/* Card header */}
              <div style={{
                padding: '18px 24px',
                background: 'linear-gradient(135deg, var(--primary-forest) 0%, #4a2010 100%)',
                color: '#ffffff',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={16} />
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                    {t('yourOrder', { count: order.items.reduce((t, i) => t + i.quantity, 0) })}
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', opacity: 0.75, fontWeight: 600 }}>
                  {order.placedAt.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Items list */}
              <div>
                {order.items.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '16px 24px',
                    borderBottom: idx < order.items.length - 1 ? '1px solid var(--border-light)' : 'none',
                  }}>
                    <div style={{
                      width: '52px', height: '52px', borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.7rem', flexShrink: 0,
                      overflow: 'hidden'
                    }}>
                      {isImageUrl(item.product.image) ? (
                        <img src={getDisplayImageUrl(item.product.image)} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        item.product.image || '📿'
                      )}
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--primary-lime)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {item.product.spiritualType}
                      </span>
                      <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '1px' }}>
                        {item.product.name}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>{t('qty', { count: item.quantity })}</p>
                    </div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--primary-forest)' }}>
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price breakdown */}
              <div style={{
                padding: '16px 24px',
                borderTop: '2px dashed var(--border-light)',
                display: 'flex', flexDirection: 'column', gap: '8px',
                backgroundColor: '#fafafa',
              }}>
                {(() => {
                  const codFeeVal = (order as any).codFee || (order as any).cod_fee || ((order.paymentMethod === 'COD' || order.paymentMethod === 'Cash on Delivery') ? 50 : 0);
                  const displayTotal = Math.max(Number(order.total || 0), (Number(order.subtotal || 0) - Number(order.discount || 0) + Number(order.shipping || 0) + Number(order.tax || 0) + Number(codFeeVal || 0)));
                  return (
                    <>
                      {[
                        { label: t('price.subtotal'), value: `₹${order.subtotal.toFixed(2)}`, color: 'var(--text-dark)' },
                        ...(order.discount > 0 ? [{ label: t('price.discount', { percent: order.discountPercent }), value: `−₹${order.discount.toFixed(2)}`, color: '#10b981' }] : []),
                        { label: t('price.shipping'), value: order.shipping === 0 ? t('price.free') : `₹${order.shipping.toFixed(2)}`, color: order.shipping === 0 ? '#10b981' : 'var(--text-dark)' },
                        ...(order.tax > 0 ? [{ label: t('price.tax', { percent: order.gstPercentSnapshot !== undefined && order.gstPercentSnapshot !== null ? order.gstPercentSnapshot : 8 }), value: `₹${order.tax.toFixed(2)}`, color: 'var(--text-dark)' }] : []),
                        ...(codFeeVal > 0 ? [{ label: 'COD Handling Charge', value: `+₹${Number(codFeeVal).toFixed(2)}`, color: '#c2410c' }] : []),
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                          <span style={{ fontWeight: 700, color: row.color }}>{row.value}</span>
                        </div>
                      ))}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                        borderTop: '2px solid var(--border-light)', paddingTop: '12px', marginTop: '4px',
                      }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 900 }}>{t('price.total')}</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-forest)' }}>
                          ₹{displayTotal.toFixed(2)}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="success-section" style={{
              backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)', padding: '24px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <h3 style={{
                fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-dark)',
                marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <Truck size={17} style={{ color: 'var(--primary-lime)' }} />
                {t('tracking.title')}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {dynamicSteps.map((ts, idx) => (
                  <div key={ts.label} style={{ display: 'flex', gap: '16px' }}>
                    {/* Line + dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                        backgroundColor: ts.done ? 'var(--primary-lime)' : ts.inProgress ? '#fff7ed' : '#f3f4f6',
                        border: `2px solid ${ts.done ? 'var(--primary-lime)' : ts.inProgress ? 'var(--primary-lime)' : 'var(--border-light)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: ts.done ? '#ffffff' : ts.inProgress ? 'var(--primary-lime)' : 'var(--text-muted)',
                        transition: 'all 0.3s ease',
                      }}>
                        {ts.icon}
                      </div>
                      {idx < dynamicSteps.length - 1 && (
                        <div style={{
                          width: '2px', flex: 1, minHeight: '32px',
                          backgroundColor: ts.done ? 'var(--primary-lime)' : 'var(--border-light)',
                          margin: '4px 0',
                          transition: 'background-color 0.3s ease',
                        }} />
                      )}
                    </div>

                    {/* Text */}
                    <div style={{ paddingBottom: idx < dynamicSteps.length - 1 ? '24px' : '0', paddingTop: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{
                          fontSize: '0.88rem', fontWeight: 800,
                          color: ts.done ? 'var(--text-dark)' : 'var(--text-muted)',
                        }}>
                          {ts.label}
                        </p>
                        {ts.done && (
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px',
                            borderRadius: 'var(--radius-full)', backgroundColor: '#dcfce7', color: '#166534',
                          }}>{t('tracking.done')}</span>
                        )}
                        {ts.inProgress && !ts.done && (
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px',
                            borderRadius: 'var(--radius-full)', backgroundColor: '#fff7ed', color: 'var(--primary-lime)',
                          }}>{t('tracking.inProgress')}</span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{ts.desc}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--primary-lime)', fontWeight: 700, marginTop: '2px' }}>{ts.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── RIGHT: Delivery Info + Trust ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '100px' }}>

            {/* Delivery Details */}
            <div className="success-section" style={{
              backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)', overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--border-light)',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <MapPin size={16} style={{ color: 'var(--primary-lime)' }} />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-dark)' }}>{t('delivery.title')}</span>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {([
                  { label: t('delivery.name'), value: order.fullName },
                  { label: t('delivery.email'), value: order.email },
                  (() => {
                    const parsedAddr = parseAddressLine2(order.addressLine2 || '');
                    const addrVal = parsedAddr.flat
                      ? `${parsedAddr.flat}, ${order.addressLine1}${parsedAddr.landmark ? ` (Landmark: ${parsedAddr.landmark})` : ''}`
                      : `${order.addressLine1}${order.addressLine2 ? ', ' + order.addressLine2 : ''}`;
                    return { label: t('delivery.address'), value: addrVal };
                  })(),
                  (() => {
                    const parsedAddr = parseAddressLine2(order.addressLine2 || '');
                    return parsedAddr.altPhone ? { label: language === 'hi' ? 'वैकल्पिक फ़ोन नंबर' : 'Alternative Phone', value: parsedAddr.altPhone } : null;
                  })(),
                  { label: t('delivery.city'), value: `${order.deliveryCity}, ${order.deliveryState}` },
                  { label: t('delivery.pincode'), value: order.pincode },
                  { label: t('delivery.payment'), value: order.paymentMethod },
                  { label: t('delivery.estDelivery'), value: estimatedDelivery },
                ].filter(Boolean) as { label: string; value: string }[]).map(row => (
                  <div key={row.label}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</p>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)', marginTop: '2px' }}>{row.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* What's Next */}
            <div className="success-section" style={{
              backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)', padding: '20px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bell size={16} style={{ color: 'var(--primary-lime)' }} /> {t('whatsNext.title')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { icon: '📧', text: t('whatsNext.steps.email') },
                  { icon: '📦', text: t('whatsNext.steps.packed') },
                  { icon: '🚚', text: t('whatsNext.steps.shipped') },
                  { icon: '🏠', text: t('whatsNext.steps.doorstep') },
                ].map(s => (
                  <div key={s.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ fontSize: '1.1rem', flexShrink: 0, lineHeight: 1.3 }}>{s.icon}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.5 }}>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust badges */}
            <div className="success-section" style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
            }}>
              {[
                { icon: <ShieldCheck size={18} style={{ color: '#10b981' }} />, text: t('badges.authentic'), bg: '#f0fdf4', border: '#bbf7d0' },
                { icon: <Star size={18} style={{ color: '#f59e0b' }} />, text: t('badges.templeQuality'), bg: '#fffbeb', border: '#fde68a' },
                { icon: <Truck size={18} style={{ color: 'var(--primary-lime)' }} />, text: t('badges.fastDelivery'), bg: '#fff7ed', border: '#fed7aa' },
                { icon: <ArrowRight size={18} style={{ color: '#8b5cf6' }} />, text: t('badges.easyReturns'), bg: '#faf5ff', border: '#e9d5ff' },
              ].map(b => (
                <div key={b.text} style={{
                  padding: '14px 10px', borderRadius: 'var(--radius-md)',
                  backgroundColor: b.bg, border: `1px solid ${b.border}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  textAlign: 'center',
                }}>
                  {b.icon}
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-dark)' }}>{b.text}</span>
                </div>
              ))}
            </div>

            {/* View Orders button */}
            <button
              id="success-view-orders"
              onClick={onViewOrders}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '14px', borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-lime-light)', border: '1.5px solid var(--primary-lime)',
                color: 'var(--primary-lime)', fontSize: '0.85rem', fontWeight: 800,
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'var(--primary-lime)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'var(--primary-lime-light)';
                e.currentTarget.style.color = 'var(--primary-lime)';
              }}
            >
              <Package size={16} /> {t('viewAndTrack')}
            </button>

            {/* Home button */}
            <button
              id="success-go-home"
              onClick={onGoHome}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '14px', borderRadius: 'var(--radius-md)',
                backgroundColor: '#f3f4f6', border: '1.5px solid var(--border-light)',
                color: 'var(--text-dark)', fontSize: '0.85rem', fontWeight: 800,
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'var(--primary-lime-light)';
                e.currentTarget.style.borderColor = 'var(--primary-lime)';
                e.currentTarget.style.color = 'var(--primary-lime)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = 'var(--border-light)';
                e.currentTarget.style.color = 'var(--text-dark)';
              }}
            >
              <Home size={16} /> {t('goToHome')}
            </button>

          </div>
        </div>

        {/* ═══════════════════════════════════════
            YOU MAY ALSO LIKE
        ═══════════════════════════════════════ */}
        {!isLockdownMode && (
        <div className="success-section" style={{ marginTop: '48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <span style={{
              fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary-lime)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>{t('upsell.subtitle')}</span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)', marginTop: '4px' }}>
              {t('upsell.title')}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('upsell.description')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {suggestedProducts.map(item => (
              <div
                key={item.id}
                className="card-hover"
                style={{
                  backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-light)', overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  if (item.product && onViewProductDetails) {
                    onViewProductDetails(item.product);
                  } else {
                    onContinueShopping();
                  }
                }}
              >
                {/* Image area */}
                <div style={{
                  height: '140px',
                  background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '3.5rem', position: 'relative',
                  overflow: 'hidden',
                }}>
                  {item.image && isImageUrl(item.image) ? (
                    <img src={getDisplayImageUrl(item.image)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    item.image || '📿'
                  )}
                  {item.badge && (
                    <span style={{
                      position: 'absolute', top: '10px', right: '10px',
                      padding: '3px 10px', borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--primary-lime)', color: '#ffffff',
                      fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: '14px' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px', lineHeight: 1.3 }}>
                    {item.name}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary-forest)' }}>
                      ₹{item.price}
                    </span>
                    <button
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '6px 12px', borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--primary-lime-light)',
                        color: 'var(--primary-lime)', fontSize: '0.72rem', fontWeight: 800,
                        cursor: 'pointer', border: 'none',
                      }}
                    >
                      {t('upsell.view')} <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Browse all */}
          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <button
              id="success-browse-all"
              onClick={onContinueShopping}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '13px 36px', borderRadius: 'var(--radius-full)',
                border: '2px solid var(--primary-lime)', color: 'var(--primary-lime)',
                backgroundColor: 'transparent', fontSize: '0.9rem', fontWeight: 800,
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'var(--primary-lime)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--primary-lime)';
              }}
            >
              {t('upsell.browseAll')} <ArrowRight size={16} />
            </button>
          </div>
        </div>
        )}

      </div>
    </div>
  );
};
