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

const generateInvoiceDoc = async (order: OrderDetails): Promise<jsPDF> => {
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
    doc.text('MANTRA PUJA', 29, 21);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text('Spiritual & Temple Offerings', 29, 26);
    doc.text('Email: support@mantrapuja.com', 29, 30);
    doc.text('Web: www.mantrapuja.com', 29, 34);
  } catch (e) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('MANTRA PUJA', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text('Spiritual & Temple Offerings', 14, 25);
    doc.text('Email: support@mantrapuja.com', 14, 29);
    doc.text('Web: www.mantrapuja.com', 14, 33);
  }

  // Header - Invoice Info (Right side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('INVOICE', 196, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Invoice ID: ${order.orderId}`, 196, 26, { align: 'right' });
  doc.text(`Date: ${new Date(order.placedAt).toLocaleDateString('en-IN')}`, 196, 31, { align: 'right' });

  // Divider Line
  doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setLineWidth(0.5);
  doc.line(14, 42, 196, 42);

  // Billing Address Section (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('BILL TO:', 14, 50);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(order.fullName, 14, 55);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99); // gray-600
  doc.text(`Phone: ${order.phoneNumber}`, 14, 60);
  doc.text(`Email: ${order.email}`, 14, 64);
  
  // Format long address nicely
  const addressText = `${order.addressLine1}${order.addressLine2 ? ', ' + order.addressLine2 : ''}, ${order.deliveryCity}, ${order.deliveryState} - ${order.pincode}`;
  const splitAddress = doc.splitTextToSize(addressText, 80);
  doc.text(splitAddress, 14, 68);

  // Payment details (Right side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('PAYMENT DETAILS:', 120, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(`Method: ${order.paymentMethod}`, 120, 55);

  let displayPaymentStatus = order.paymentStatus || 'Pending';
  if (order.paymentMethod?.toLowerCase().includes('razorpay')) {
    displayPaymentStatus = 'Confirmed';
  }
  doc.text(`Status: ${displayPaymentStatus}`, 120, 59);

  // Table header background block
  let y = 85;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, y, 182, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('Sacred Item Details', 18, y + 5.5);
  doc.text('Qty', 115, y + 5.5, { align: 'center' });
  doc.text('Price', 150, y + 5.5, { align: 'right' });
  doc.text('Amount', 190, y + 5.5, { align: 'right' });

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
    doc.text(`Rs. ${item.product.price.toFixed(2)}`, 150, y + 5.5, { align: 'right' });
    doc.text(`Rs. ${(item.product.price * item.quantity).toFixed(2)}`, 190, y + 5.5, { align: 'right' });
    
    y += 8;
  });

  // Table border line below rows
  doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.line(14, y, 196, y);
  y += 8;

  // Pricing calculations block
  const labelX = 140;
  const valueX = 190;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  doc.text('Subtotal:', labelX, y);
  doc.text(`Rs. ${order.subtotal.toFixed(2)}`, valueX, y, { align: 'right' });
  y += 6;

  if (order.discount > 0) {
    doc.setTextColor(16, 185, 129); // green
    doc.text(`Discount (${order.discountPercent}%):`, labelX, y);
    doc.text(`-Rs. ${order.discount.toFixed(2)}`, valueX, y, { align: 'right' });
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    y += 6;
  }

  doc.text('Shipping:', labelX, y);
  doc.text(order.shipping === 0 ? 'FREE' : `Rs. ${order.shipping.toFixed(2)}`, valueX, y, { align: 'right' });
  y += 6;

  // Draw line for total
  doc.setLineWidth(0.5);
  doc.line(130, y, 196, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Total Charged:', labelX, y);
  doc.text(`Rs. ${order.total.toFixed(2)}`, valueX, y, { align: 'right' });
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
  doc.text('May these sacred items bring peace, prosperity, and divine blessings to your home.', 105, footerY + 7, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128); // gray
  doc.text('Thank you for shopping with Mantra Puja!', 105, footerY + 13, { align: 'center' });

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

  const suggestedProducts = React.useMemo(() => {
    if (!products || products.length === 0) {
      return [
        { id: '1', name: 'Panchmukhi Rudraksha', price: 299, image: '📿', badge: 'Popular', product: null as any },
        { id: '2', name: 'Brass Diya Set', price: 149, image: '🪔', badge: 'New', product: null as any },
        { id: '3', name: 'Rose Incense Sticks', price: 89, image: '🌸', badge: 'Bestseller', product: null as any },
        { id: '4', name: 'Shiva Kavach Yantra', price: 499, image: '🔱', badge: 'Divine', product: null as any },
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
    const isUpi = order.paymentMethod === 'Scan & Pay (UPI)';
    const isConfirmed = livePaymentStatus === 'Confirmed';

    if (isUpi && !isConfirmed) {
      return [
        { icon: <Clock size={16} />, label: 'Payment Verification', desc: 'Verifying your screenshot proof', done: false, inProgress: true, time: 'Pending Admin Approval' },
        { icon: <Check size={16} />, label: 'Order Confirmed', desc: 'Awaiting payment verification', done: false, inProgress: false, time: 'Pending' },
        { icon: <Package size={16} />, label: 'Being Packed', desc: 'Sacred items being prepared', done: false, inProgress: false, time: 'Awaiting' },
        { icon: <Truck size={16} />, label: 'Out for Delivery', desc: 'On the way to you', done: false, inProgress: false, time: 'Awaiting' },
        { icon: <MapPin size={16} />, label: 'Delivered', desc: 'Blessings at your doorstep', done: false, inProgress: false, time: 'Awaiting' },
      ];
    }

    if (isUpi && isConfirmed) {
      return [
        { icon: <Check size={16} />, label: 'Payment Confirmed', desc: 'Payment successfully verified', done: true, inProgress: false, time: 'Verified' },
        { icon: <Check size={16} />, label: 'Order Confirmed', desc: 'Your order has been received and confirmed', done: true, inProgress: false, time: 'Confirmed' },
        { icon: <Package size={16} />, label: 'Being Packed', desc: 'Sacred items being prepared', done: liveStatus !== 'Being Packed', inProgress: liveStatus === 'Being Packed', time: liveStatus === 'Being Packed' ? 'Expected: Today' : 'Completed' },
        { icon: <Truck size={16} />, label: 'Out for Delivery', desc: 'On the way to you', done: liveStatus === 'Delivered', inProgress: liveStatus === 'Shipped', time: liveStatus === 'Shipped' ? 'Expected: 3–5 days' : liveStatus === 'Delivered' ? 'Completed' : 'Awaiting' },
        { icon: <MapPin size={16} />, label: 'Delivered', desc: 'Blessings at your doorstep', done: liveStatus === 'Delivered', inProgress: false, time: liveStatus === 'Delivered' ? 'Delivered' : 'Estimated' },
      ];
    }

    // Default flow (e.g. COD)
    return [
      { icon: <Check size={16} />, label: 'Order Confirmed', desc: 'Your order has been received', done: true, inProgress: false, time: 'Confirmed' },
      { icon: <Package size={16} />, label: 'Being Packed', desc: 'Sacred items being prepared', done: liveStatus !== 'Being Packed', inProgress: liveStatus === 'Being Packed', time: liveStatus === 'Being Packed' ? 'Expected: Today' : 'Completed' },
      { icon: <Truck size={16} />, label: 'Out for Delivery', desc: 'On the way to you', done: liveStatus === 'Delivered', inProgress: liveStatus === 'Shipped', time: liveStatus === 'Shipped' ? 'Expected: 3–5 days' : liveStatus === 'Delivered' ? 'Completed' : 'Awaiting' },
      { icon: <MapPin size={16} />, label: 'Delivered', desc: 'Blessings at your doorstep', done: liveStatus === 'Delivered', inProgress: false, time: liveStatus === 'Delivered' ? 'Delivered' : 'Estimated' },
    ];
  }, [order.paymentMethod, liveStatus, livePaymentStatus]);

  const estimatedDelivery = React.useMemo(() => {
    const d = new Date(order.placedAt);
    d.setDate(d.getDate() + 5);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [order.placedAt]);

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.orderId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadInvoice = async () => {
    try {
      const doc = await generateInvoiceDoc(order);
      doc.save(`Invoice-${order.orderId}.pdf`);
      setInvoiceDownloaded(true);
      setTimeout(() => setInvoiceDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to download invoice:', err);
      alert('Could not download invoice. Please try again.');
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

      const productName = order.items?.[0]?.product?.name || 'Vidya Rudraksh';
      const blessingText = `🕉️ सांदीपनि आश्रम से सिद्ध "${productName}" 🙏✨

बच्चों की पढ़ाई, एकाग्रता और सीखने की क्षमता के लिए विशेष! 📚🧠

🔗 आज ही अपने बच्चे के लिए प्राप्त करें:
${window.location.origin}/shop

May divine blessings bring success and wisdom to your family! 📿🔱`;

      const cardBlob = await createProductShareCard();
      const cardFile = new File([cardBlob], 'VidyaRudraksh-Blessings.jpg', { type: 'image/jpeg' });

      // Upload public sharing card to Cloudflare R2
      const publicUrl = await uploadToR2(cardFile, 'referrals', true);
      const text = `${blessingText}\n\n👉 View Blessings Card: ${publicUrl}`;
      const encoded = encodeURIComponent(text);

      const urls: Record<string, string> = {
        whatsapp: `https://wa.me/?text=${encoded}`,
        twitter: `https://twitter.com/intent/tweet?text=${encoded}`,
        telegram: `https://t.me/share/url?url=${publicUrl}&text=${encoded}`,
      };

      if (urls[platform]) {
        window.open(urls[platform], '_blank');
      }
    } catch (err) {
      console.error('Failed to share invoice:', err);
      alert('Could not generate sharing link. Please try again.');
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

      const productName = order.items?.[0]?.product?.name || 'Vidya Rudraksh';
      const blessingText = `🕉️ सांदीपनि आश्रम से सिद्ध "${productName}" 🙏✨

बच्चों की पढ़ाई, एकाग्रता और सीखने की क्षमता के लिए विशेष! 📚🧠

🔗 आज ही अपने बच्चे के लिए प्राप्त करें:
${window.location.origin}/shop

May divine blessings bring success and wisdom to your family! 📿🔱`;

      const cardBlob = await createProductShareCard();
      const cardFile = new File([cardBlob], 'VidyaRudraksh-Blessings.jpg', { type: 'image/jpeg' });

      // Try native share API with attached image file
      if (navigator.canShare && navigator.canShare({ files: [cardFile] })) {
        await navigator.share({
          files: [cardFile],
          title: `Mantra Puja Blessings`,
          text: blessingText
        });
        return;
      }

      // Fallback 1: Upload sharing card to Cloudflare R2 and share URL link
      const publicUrl = await uploadToR2(cardFile, 'referrals', true);
      const fallbackText = `${blessingText}\n\n👉 View Blessings Card: ${publicUrl}`;

      if (navigator.share) {
        await navigator.share({
          title: `Mantra Puja Blessings`,
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
      alert(`Sharing failed: ${err?.message || String(err)}`);
      setShareExpanded(p => !p);
    } finally {
      setIsSharing(false);
    }
  };

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
          Order Placed Successfully!
        </h1>
        <p style={{
          fontSize: '1rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500,
          maxWidth: '480px', margin: '0 auto 28px auto', lineHeight: 1.6,
        }}>
          Your sacred items are confirmed and will be packed with divine care. May these bring peace and blessings to your home.
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
            Order ID: {order.orderId}
          </span>
          <button
            id="success-copy-order-id"
            onClick={handleCopyOrderId}
            title="Copy order ID"
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
            {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
          </button>
        </div>

        {/* Estimated delivery chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
          marginTop: '16px',
        }}>
          <Clock size={14} style={{ color: '#fbbf24' }} />
          <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
            Estimated Delivery by <strong style={{ color: '#fbbf24' }}>{estimatedDelivery}</strong>
          </span>
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
            Continue Shopping
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
            {invoiceDownloaded ? 'Downloaded!' : 'Download Invoice'}
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
            {isSharing ? 'Preparing...' : 'Share Order'}
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
              Share your order invoice PDF with a thank you message 🙏
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { id: 'whatsapp', label: '💬 WhatsApp', color: '#25d366' },
                { id: 'twitter', label: '🐦 X (Twitter)', color: '#1d9bf0' },
                { id: 'telegram', label: '✈️ Telegram', color: '#0088cc' },
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
                    Your Order ({order.items.reduce((t, i) => t + i.quantity, 0)} items)
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', opacity: 0.75, fontWeight: 600 }}>
                  {order.placedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>Qty: {item.quantity}</p>
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
                {[
                  { label: 'Subtotal', value: `₹${order.subtotal.toFixed(2)}`, color: 'var(--text-dark)' },
                  ...(order.discount > 0 ? [{ label: `Discount (${order.discountPercent}%)`, value: `−₹${order.discount.toFixed(2)}`, color: '#10b981' }] : []),
                  { label: 'Shipping', value: order.shipping === 0 ? 'FREE' : `₹${order.shipping.toFixed(2)}`, color: order.shipping === 0 ? '#10b981' : 'var(--text-dark)' },
                  { label: `Tax (${order.gstPercentSnapshot !== undefined && order.gstPercentSnapshot !== null ? order.gstPercentSnapshot : 8}%)`, value: `₹${order.tax.toFixed(2)}`, color: 'var(--text-dark)' },
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
                  <span style={{ fontSize: '0.95rem', fontWeight: 900 }}>Total Charged</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-forest)' }}>
                    ₹{order.total.toFixed(2)}
                  </span>
                </div>
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
                Order Tracking
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
                          }}>✓ DONE</span>
                        )}
                        {ts.inProgress && !ts.done && (
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px',
                            borderRadius: 'var(--radius-full)', backgroundColor: '#fff7ed', color: 'var(--primary-lime)',
                          }}>IN PROGRESS</span>
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
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-dark)' }}>Delivery Details</span>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { label: 'Name', value: order.fullName },
                  { label: 'Email', value: order.email },
                  { label: 'Address', value: `${order.addressLine1}${order.addressLine2 ? ', ' + order.addressLine2 : ''}` },
                  { label: 'City', value: `${order.deliveryCity}, ${order.deliveryState}` },
                  { label: 'Pincode', value: order.pincode },
                  { label: 'Payment', value: order.paymentMethod },
                  { label: 'Est. Delivery', value: estimatedDelivery },
                ].map(row => (
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
                <Bell size={16} style={{ color: 'var(--primary-lime)' }} /> What Happens Next?
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { icon: '📧', text: 'Order confirmation sent to your email' },
                  { icon: '📦', text: 'Items packed with sacred care within 24hrs' },
                  { icon: '🚚', text: 'Shipped via Sacred Express courier' },
                  { icon: '🏠', text: 'Delivered to your doorstep in 3–5 days' },
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
                { icon: <ShieldCheck size={18} style={{ color: '#10b981' }} />, text: '100% Authentic', bg: '#f0fdf4', border: '#bbf7d0' },
                { icon: <Star size={18} style={{ color: '#f59e0b' }} />, text: 'Temple Quality', bg: '#fffbeb', border: '#fde68a' },
                { icon: <Truck size={18} style={{ color: 'var(--primary-lime)' }} />, text: 'Fast Delivery', bg: '#fff7ed', border: '#fed7aa' },
                { icon: <ArrowRight size={18} style={{ color: '#8b5cf6' }} />, text: 'Easy Returns', bg: '#faf5ff', border: '#e9d5ff' },
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
              <Package size={16} /> View & Track Order
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
              <Home size={16} /> Go to Home
            </button>

          </div>
        </div>

        {/* ═══════════════════════════════════════
            YOU MAY ALSO LIKE
        ═══════════════════════════════════════ */}
        <div className="success-section" style={{ marginTop: '48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <span style={{
              fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary-lime)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>Discover More</span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)', marginTop: '4px' }}>
              You May Also Like
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Curated divine items to complement your order
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
                      View <ChevronRight size={12} />
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
              Browse All Sacred Items <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
