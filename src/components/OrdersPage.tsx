import React from 'react';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  Download,
  RotateCcw,
  Info,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import type { Product, LocalOrder } from '../types';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';
import { supabase } from '../lib/supabase';

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

  // Filter Tabs State
  const [filterTab, setFilterTab] = React.useState<'All' | 'Active' | 'Completed' | 'Cancelled'>('All');

  // Cancel order modal state
  const [selectedCancelOrder, setSelectedCancelOrder] = React.useState<LocalOrder | null>(null);
  const [cancelReason, setCancelReason] = React.useState('');
  const [cancelSuccessAlert, setCancelSuccessAlert] = React.useState('');

  // Track milestones card expansion state
  const [expandedTrackingOrderId, setExpandedTrackingOrderId] = React.useState<string | null>(null);

  // Detailed Order modal state
  const [selectedDetailsOrder, setSelectedDetailsOrder] = React.useState<LocalOrder | null>(null);

  // Success Feedback
  const [feedbackToast, setFeedbackToast] = React.useState('');

  React.useEffect(() => {
    if (cancelSuccessAlert) {
      const t = setTimeout(() => setCancelSuccessAlert(''), 5000);
      return () => clearTimeout(t);
    }
  }, [cancelSuccessAlert]);

  React.useEffect(() => {
    if (feedbackToast) {
      const t = setTimeout(() => setFeedbackToast(''), 3000);
      return () => clearTimeout(t);
    }
  }, [feedbackToast]);

  // Filters calculation
  const filteredOrders = React.useMemo(() => {
    return orders.filter((o) => {
      if (filterTab === 'Active') return o.status === 'Being Packed' || o.status === 'Shipped';
      if (filterTab === 'Completed') return o.status === 'Delivered';
      if (filterTab === 'Cancelled') return o.status === 'Cancelled';
      return true;
    });
  }, [orders, filterTab]);

  // Cancel Order Submission
  const handleCancelOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCancelOrder) return;
    
    try {
      const { error } = await supabase
        .from('website_store_orders')
        .update({ status: 'Cancelled' })
        .eq('order_id', selectedCancelOrder.orderId);
      if (error) throw error;
    } catch (err) {
      console.error('Failed to cancel order in Supabase:', err);
    }
    
    setOrders(
      orders.map((o) =>
        o.orderId === selectedCancelOrder.orderId
          ? { ...o, status: 'Cancelled' }
          : o
      )
    );
    setCancelSuccessAlert(`Order #${selectedCancelOrder.orderId} cancelled. Refund of ₹${selectedCancelOrder.total.toFixed(2)} processed to ${selectedCancelOrder.paymentMethod}.`);
    setSelectedCancelOrder(null);
    setCancelReason('');
  };

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
  const handleDownloadInvoice = (order: LocalOrder) => {
    const lines = [
      '══════════════════════════════════',
      '       MANTRA PUJA — INVOICE      ',
      '══════════════════════════════════',
      `Order ID  : ${order.orderId}`,
      `Date      : ${order.placedAt.toLocaleDateString('en-IN')}`,
      `Name      : ${order.fullName}`,
      `Email     : ${order.email}`,
      `Address   : ${order.addressLine1}${order.addressLine2 ? ', ' + order.addressLine2 : ''}`,
      `            ${order.deliveryCity}, ${order.deliveryState} — ${order.pincode}`,
      `Payment   : ${order.paymentMethod}`,
      `Status    : ${order.status}`,
      '──────────────────────────────────',
      'ITEMS:',
      ...order.items.map(i => `  ${i.product.name} × ${i.quantity}  —  $${(i.product.price * i.quantity).toFixed(2)}`),
      '──────────────────────────────────',
      `Subtotal  : $${order.subtotal.toFixed(2)}`,
      order.discount > 0 ? `Discount  : -$${order.discount.toFixed(2)} (${order.discountPercent}%)` : '',
      `Shipping  : ${order.shipping === 0 ? 'FREE' : '$' + order.shipping.toFixed(2)}`,
      `Tax       : $${order.tax.toFixed(2)}`,
      `TOTAL     : $${order.total.toFixed(2)}`,
      '══════════════════════════════════',
      'Thank you for your sacred purchase!',
      'May these items bring you peace & blessings.',
    ].filter(Boolean).join('\n');

    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${order.orderId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    setFeedbackToast(`Downloaded invoice for #${order.orderId}!`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return { bg: '#dcfce7', text: '#15803d', icon: <CheckCircle size={14} /> };
      case 'Cancelled':
        return { bg: '#fee2e2', text: '#dc2626', icon: <XCircle size={14} /> };
      case 'Shipped':
        return { bg: '#dbeafe', text: '#1d4ed8', icon: <Truck size={14} /> };
      default:
        return { bg: 'var(--primary-lime-light)', text: 'var(--primary-lime)', icon: <Clock size={14} /> };
    }
  };

  const getCategoryGradient = (cat: string) => {
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

      {/* Success Alert Banner for cancellation */}
      {cancelSuccessAlert && (
        <div style={{
          backgroundColor: '#fef2f2',
          borderBottom: '2px solid #fecaca',
          color: '#dc2626',
          padding: '16px 20px',
          fontSize: '0.9rem',
          fontWeight: 700,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={18} />
          <span>{cancelSuccessAlert}</span>
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
                <ArrowLeft size={14} /> Back to Home
              </button>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
                My Sacred Orders
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.88rem', marginTop: '4px' }}>
                Trace divine packages and historical orders filled with healing spiritual energy.
              </p>
            </div>

            {/* Quick stats grid */}
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
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase' }}>Total Orders</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 900, color: '#6ee7b7' }}>
                  {orders.filter((o) => o.status === 'Being Packed' || o.status === 'Shipped').length}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase' }}>Active</span>
              </div>
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
          <div style={{ display: 'flex', gap: '8px' }}>
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
                {tab === 'Active' ? 'Active Shipments' : tab === 'Completed' ? 'Completed Orders' : `${tab} Orders`}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Showing {filteredOrders.length} orders
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
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '20px', color: 'var(--text-dark)' }}>No orders found</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '24px' }}>
              Your selected filters returned zero results. Explore our spiritual catalogs to find sacred essentials.
            </p>
            <button onClick={onNavigateToShop} className="btn-lime" style={{ fontSize: '0.88rem', padding: '12px 28px' }}>
              Explore Sacred Store
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {filteredOrders.map((order) => {
              const theme = getStatusColor(order.status);
              const isTrackingExpanded = expandedTrackingOrderId === order.orderId;

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
                    padding: '18px 24px',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}>
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Order Placed</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                          {order.placedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Amount</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 900, color: 'var(--primary-forest)' }}>
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Order ID</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)' }}>#{order.orderId}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Ship To</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)' }}>{order.fullName}</span>
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
                        {order.status === 'Being Packed' ? 'Preparing Package' : order.status}
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
                        title="View Full Invoice breakdown"
                      >
                        <Info size={14} /> Details
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
                              background: getCategoryGradient(item.product.category),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.8rem',
                              flexShrink: 0,
                              overflow: 'hidden'
                            }}>
                              {isImageUrl(item.product.image) ? (
                                <img src={getDisplayImageUrl(item.product.image)} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                item.product.image || '📿'
                              )}
                            </div>
                            <div>
                              <span style={{ fontSize: '0.68rem', color: 'var(--primary-lime)', fontWeight: 800, textTransform: 'uppercase' }}>
                                {item.product.spiritualType}
                              </span>
                              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '2px' }}>
                                {item.product.name}
                              </h4>
                              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Quantity: {item.quantity} • price: ${item.product.price.toFixed(2)} each
                              </p>
                            </div>
                          </div>

                          <span style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                            ${(item.product.price * item.quantity).toFixed(2)}
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
                            <Truck size={15} style={{ color: 'var(--primary-lime)' }} /> Live Courier Journey (Sacred Express)
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AWB: SEC-{order.orderId}</span>
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

                          {/* 1. Confirmed */}
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
                            <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dark)' }}>Ordered</span>
                            <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)' }}>Verified</span>
                          </div>

                          {/* 2. Packing */}
                          <div style={{ textAlign: 'center', position: 'relative', zIndex: 5 }}>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: order.status !== 'Cancelled' ? 'var(--primary-lime)' : 'var(--border-light)',
                              border: '3px solid #ffffff',
                              boxShadow: order.status !== 'Cancelled' ? '0 0 0 1px var(--primary-lime)' : 'none',
                              margin: '0 auto 6px auto'
                            }} />
                            <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: order.status !== 'Cancelled' ? 'var(--text-dark)' : 'var(--text-muted)' }}>Prepared</span>
                            <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)' }}>Blessed</span>
                          </div>

                          {/* 3. Dispatched */}
                          <div style={{ textAlign: 'center', position: 'relative', zIndex: 5 }}>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: order.status === 'Shipped' || order.status === 'Delivered' ? 'var(--primary-lime)' : 'var(--border-light)',
                              border: '3px solid #ffffff',
                              margin: '0 auto 6px auto'
                            }} />
                            <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: order.status === 'Shipped' || order.status === 'Delivered' ? 'var(--text-dark)' : 'var(--text-muted)' }}>Dispatched</span>
                            <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)' }}>Varanasi Hub</span>
                          </div>

                          {/* 4. Near Hub */}
                          <div style={{ textAlign: 'center', position: 'relative', zIndex: 5 }}>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: order.status === 'Delivered' ? 'var(--primary-lime)' : 'var(--border-light)',
                              border: '3px solid #ffffff',
                              margin: '0 auto 6px auto'
                            }} />
                            <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: order.status === 'Delivered' ? 'var(--text-dark)' : 'var(--text-muted)' }}>In Transit</span>
                            <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)' }}>Near City</span>
                          </div>

                          {/* 5. Delivered */}
                          <div style={{ textAlign: 'center', position: 'relative', zIndex: 5 }}>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: order.status === 'Delivered' ? 'var(--primary-lime)' : 'var(--border-light)',
                              border: '3px solid #ffffff',
                              margin: '0 auto 6px auto'
                            }} />
                            <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: order.status === 'Delivered' ? 'var(--text-dark)' : 'var(--text-muted)' }}>Delivered</span>
                            <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)' }}>Handed over</span>
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
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    {/* Left Actions: Tracking and Cancel controls */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {order.status !== 'Cancelled' ? (
                        <button
                          onClick={() => setExpandedTrackingOrderId(isTrackingExpanded ? null : order.orderId)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            backgroundColor: isTrackingExpanded ? 'var(--primary-forest)' : '#ffffff',
                            color: isTrackingExpanded ? '#ffffff' : 'var(--text-dark)',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <Truck size={14} style={{ color: isTrackingExpanded ? '#ffffff' : 'var(--primary-lime)' }} />
                          <span>{isTrackingExpanded ? 'Close Tracking' : 'Track Order'}</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={14} style={{ color: '#ef4444' }} /> Ordered Cancelled
                        </span>
                      )}

                      {/* Cancel order only if packing/processing */}
                      {order.status === 'Being Packed' && (
                        <button
                          onClick={() => setSelectedCancelOrder(order)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            backgroundColor: '#fff5f5',
                            color: '#e53e3e',
                            border: '1px solid #fed7d7',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.8rem',
                            fontWeight: 700
                          }}
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>

                    {/* Right Actions: Reorder, invoice */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      
                      <button
                        onClick={() => handleDownloadInvoice(order)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          backgroundColor: '#ffffff',
                          color: 'var(--text-dark)',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <Download size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>Invoice</span>
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
                            gap: '6px'
                          }}
                        >
                          <RotateCcw size={14} />
                          <span>Reorder Items</span>
                        </button>
                      )}

                    </div>

                  </div>
                </div>
              );
            })}

          </div>
        )}

      </div>

      {/* ==============================================
          MODAL: CANCEL ORDER FLOW
          ============================================== */}
      {selectedCancelOrder && (
        <div style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0, left: 0,
          backgroundColor: 'rgba(45, 20, 14, 0.8)',
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
            maxWidth: '460px',
            padding: '30px',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={22} style={{ color: '#ef4444' }} /> Cancel Order #{selectedCancelOrder.orderId}?
            </h3>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
              Are you sure you want to cancel your spiritual order? These items are currently being prepared and energized with sacred chanting. Cancellations are permanent and refunds take 2-3 business days.
            </p>

            <form onSubmit={handleCancelOrderSubmit} style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '6px' }}>Reason for cancellation</label>
                  <select
                    value={cancelReason}
                    required
                    onChange={(e) => setCancelReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select a reason...</option>
                    <option value="Ordered wrong item">Ordered wrong spiritual item</option>
                    <option value="Found better alternative">Found alternative ritual kit</option>
                    <option value="Incorrect shipping address">Incorrect delivery details</option>
                    <option value="Changed mind">Changed mind / Delay in pooja</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      padding: '10px 20px',
                      borderRadius: 'var(--radius-md)',
                      flexGrow: 1
                    }}
                  >
                    Confirm Cancellation
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCancelOrder(null)}
                    className="btn-outline"
                    style={{
                      padding: '10px 20px',
                      fontSize: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    Keep Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Order Details: #{selectedDetailsOrder.orderId}</h3>
              <button
                onClick={() => setSelectedDetailsOrder(null)}
                style={{ color: '#ffffff', fontSize: '0.82rem', fontWeight: 700 }}
              >
                Close
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              
              {/* Delivery info */}
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                  <MapPin size={12} style={{ color: 'var(--primary-lime)' }} /> Delivery Address
                </span>
                <div style={{ backgroundColor: '#fafafa', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                  <p style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)' }}>{selectedDetailsOrder.fullName}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Email: {selectedDetailsOrder.email}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dark)', marginTop: '6px', lineHeight: 1.4 }}>
                    {selectedDetailsOrder.addressLine1}
                    {selectedDetailsOrder.addressLine2 ? `, ${selectedDetailsOrder.addressLine2}` : ''}
                    <br />
                    {selectedDetailsOrder.deliveryCity}, {selectedDetailsOrder.deliveryState} - {selectedDetailsOrder.pincode}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                  <Package size={12} style={{ color: 'var(--primary-lime)' }} /> Purchased Sacred Items
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedDetailsOrder.items.map((i, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                        {i.product.name} <span style={{ color: 'var(--text-muted)' }}>× {i.quantity}</span>
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                        ${(i.product.price * i.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing details */}
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                  Billing Breakdown
                </span>
                <div style={{ backgroundColor: 'var(--primary-lime-light)', border: '1px solid #ffedd5', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Items Subtotal</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>${selectedDetailsOrder.subtotal.toFixed(2)}</span>
                    </div>
                    {selectedDetailsOrder.discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Coupon Savings ({selectedDetailsOrder.discountPercent}%)</span>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>-${selectedDetailsOrder.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Sacred Shipping</span>
                      <span style={{ fontWeight: 700, color: selectedDetailsOrder.shipping === 0 ? '#10b981' : 'var(--text-dark)' }}>
                        {selectedDetailsOrder.shipping === 0 ? 'FREE' : `$${selectedDetailsOrder.shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Vedic Services Tax</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>${selectedDetailsOrder.tax.toFixed(2)}</span>
                    </div>
                    <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '6px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '1rem', fontWeight: 900 }}>
                      <span>Grand Total</span>
                      <span style={{ color: 'var(--primary-forest)', fontSize: '1.2rem' }}>${selectedDetailsOrder.total.toFixed(2)}</span>
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
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded SlideUp keyframes */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

    </div>
  );
};
