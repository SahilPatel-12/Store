import React from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Truck, 
  X, 
  ChevronLeft, 
  ShoppingBag, 
  ArrowRight,
  Sparkles,
  Package,
  Clock,
  Trash2
} from 'lucide-react';
import type { LocalOrder } from '../types';

export interface LocalNotification {
  id: string;
  orderId: string;
  type: 
    | 'order_placed'
    | 'payment_pending'
    | 'payment_verification_pending'
    | 'payment_confirmed'
    | 'payment_declined'
    | 'order_prepared'
    | 'order_shipped'
    | 'order_delivered'
    | 'order_cancelled';
  message: string;
  timestamp: Date;
  read: boolean;
  attemptCount?: number;
}

interface NotificationsPageProps {
  orders: LocalOrder[];
  readNotificationIds: string[];
  clearedNotificationIds: string[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotification: (id: string) => void;
  onClearAllNotifications: (ids: string[]) => void;
  onNavigateToHome: () => void;
  onNavigateToShop: () => void;
  onNavigateToOrders: () => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  orders,
  readNotificationIds,
  clearedNotificationIds,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
  onClearAllNotifications,
  onNavigateToHome,
  onNavigateToShop,
  onNavigateToOrders
}) => {

  const notifications = React.useMemo(() => {
    const list: LocalNotification[] = [];
    orders.forEach(order => {
      // 1. Order Placed (Always shown)
      list.push({
        id: `${order.orderId}_placed`,
        orderId: order.orderId,
        type: 'order_placed',
        message: `Your order #${order.orderId} has been successfully placed! Total amount: ₹${order.total.toFixed(2)}.`,
        timestamp: order.placedAt,
        read: readNotificationIds.includes(`${order.orderId}_placed`)
      });

      // 2. Payment Pending / Verification Pending (Only for UPI orders)
      if (order.paymentMethod === 'Scan & Pay (UPI)') {
        if (order.paymentStatus === 'Pending') {
          if (order.paymentScreenshot) {
            list.push({
              id: `${order.orderId}_verification_pending`,
              orderId: order.orderId,
              type: 'payment_verification_pending',
              message: `Payment screenshot for Order #${order.orderId} has been uploaded successfully. Admin verification is pending.`,
              timestamp: order.placedAt,
              read: readNotificationIds.includes(`${order.orderId}_verification_pending`)
            });
          } else {
            list.push({
              id: `${order.orderId}_payment_pending`,
              orderId: order.orderId,
              type: 'payment_pending',
              message: `Please scan the QR code and upload your transaction confirmation screenshot for Order #${order.orderId} to begin verification.`,
              timestamp: order.placedAt,
              read: readNotificationIds.includes(`${order.orderId}_payment_pending`)
            });
          }
        }
      }

      // 3. Payment Confirmed
      if (order.paymentStatus === 'Confirmed') {
        list.push({
          id: `${order.orderId}_confirmed`,
          orderId: order.orderId,
          type: 'payment_confirmed',
          message: `Your payment for Order #${order.orderId} has been successfully verified and confirmed by the admin!`,
          timestamp: order.placedAt,
          read: readNotificationIds.includes(`${order.orderId}_confirmed`)
        });
      }

      // 4. Payment Declined
      if (order.paymentStatus === 'Declined') {
        list.push({
          id: `${order.orderId}_declined_${order.paymentDeclineCount || 0}`,
          orderId: order.orderId,
          type: 'payment_declined',
          message: `Payment proof for Order #${order.orderId} was declined by the admin. (Attempt ${order.paymentDeclineCount || 1}/3). Please re-upload a valid transaction screenshot.`,
          timestamp: order.placedAt,
          read: readNotificationIds.includes(`${order.orderId}_declined_${order.paymentDeclineCount || 0}`),
          attemptCount: order.paymentDeclineCount || 1
        });
      }

      // 5. Preparing Package (When payment confirmed and status is Being Packed)
      if (order.status === 'Being Packed' && order.paymentStatus === 'Confirmed') {
        list.push({
          id: `${order.orderId}_prepared`,
          orderId: order.orderId,
          type: 'order_prepared',
          message: `Your order #${order.orderId} is being prepared and packed for shipment.`,
          timestamp: order.placedAt,
          read: readNotificationIds.includes(`${order.orderId}_prepared`)
        });
      }

      // 6. Shipped Alert
      if (order.status === 'Shipped') {
        list.push({
          id: `${order.orderId}_shipped`,
          orderId: order.orderId,
          type: 'order_shipped',
          message: `Order #${order.orderId} has been shipped and is now in transit.`,
          timestamp: order.placedAt,
          read: readNotificationIds.includes(`${order.orderId}_shipped`)
        });
      }

      // 7. Delivered Alert
      if (order.status === 'Delivered') {
        list.push({
          id: `${order.orderId}_delivered`,
          orderId: order.orderId,
          type: 'order_delivered',
          message: `Order #${order.orderId} has been delivered. We hope it brings peace and positive energy!`,
          timestamp: order.placedAt,
          read: readNotificationIds.includes(`${order.orderId}_delivered`)
        });
      }

      // 8. Cancelled Alert
      if (order.status === 'Cancelled') {
        list.push({
          id: `${order.orderId}_cancelled`,
          orderId: order.orderId,
          type: 'order_cancelled',
          message: `Order #${order.orderId} was cancelled.`,
          timestamp: order.placedAt,
          read: readNotificationIds.includes(`${order.orderId}_cancelled`)
        });
      }
    });

    const NOTIFICATION_PRIORITY: Record<string, number> = {
      order_placed: 1,
      payment_pending: 2,
      payment_verification_pending: 3,
      payment_declined: 4,
      payment_confirmed: 5,
      order_prepared: 6,
      order_shipped: 7,
      order_delivered: 8,
      order_cancelled: 9
    };

    return list
      .filter(n => !clearedNotificationIds.includes(n.id))
      .sort((a, b) => {
        const timeDiff = b.timestamp.getTime() - a.timestamp.getTime();
        if (timeDiff !== 0) return timeDiff;
        const prioA = NOTIFICATION_PRIORITY[a.type] || 0;
        const prioB = NOTIFICATION_PRIORITY[b.type] || 0;
        return prioB - prioA;
      });
  }, [orders, readNotificationIds, clearedNotificationIds]);

  const unreadCount = React.useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const getNotificationIcon = (type: LocalNotification['type']) => {
    switch (type) {
      case 'order_placed':
        return <CheckCircle size={20} style={{ color: '#0f766e' }} />;
      case 'payment_pending':
        return <AlertTriangle size={20} style={{ color: '#d97706' }} />;
      case 'payment_verification_pending':
        return <Clock size={20} style={{ color: '#8b5cf6' }} />;
      case 'payment_declined':
        return <AlertTriangle size={20} style={{ color: '#ef4444' }} />;
      case 'payment_confirmed':
        return <CheckCircle size={20} style={{ color: '#22c55e' }} />;
      case 'order_prepared':
        return <Package size={20} style={{ color: '#d97706' }} />;
      case 'order_shipped':
        return <Truck size={20} style={{ color: '#3b82f6' }} />;
      case 'order_delivered':
        return <ShoppingBag size={20} style={{ color: 'var(--primary-forest, #1e3a1e)' }} />;
      case 'order_cancelled':
        return <X size={20} style={{ color: '#ef4444' }} />;
    }
  };

  const getNotificationStyle = (type: LocalNotification['type'], read: boolean) => {
    let borderColor = 'var(--border-light, #e2e8f0)';
    let bgColor = '#ffffff';

    if (!read) {
      bgColor = '#f8fafc';
      if (type === 'payment_declined' || type === 'order_cancelled') {
        borderColor = '#fca5a5'; // Red tint
        bgColor = '#fff5f5';
      } else if (type === 'payment_confirmed' || type === 'order_delivered') {
        borderColor = '#86efac'; // Green tint
        bgColor = '#f0fdf4';
      } else if (type === 'payment_verification_pending' || type === 'order_prepared') {
        borderColor = '#fef3c7'; // Gold/Amber tint
        bgColor = '#fffbeb';
      }
    }

    return { borderColor, bgColor };
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '40px auto',
      padding: '0 20px',
      minHeight: '60vh',
      fontFamily: 'inherit'
    }}>
      {/* Header back button & title */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '28px'
      }}>
        <button
          onClick={onNavigateToHome}
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
            fontWeight: 600,
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-dark)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ChevronLeft size={16} />
          Back to Home
        </button>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 900,
              color: 'var(--text-dark)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              letterSpacing: '-0.5px'
            }}>
              <Bell size={28} style={{ color: 'var(--primary-gold, #d97706)' }} />
              Sacred Alerts
            </h1>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              marginTop: '4px',
              marginRight: 0,
              marginBottom: 0,
              marginLeft: 0
            }}>
              Dynamic status updates regarding your spiritual orders and verification logs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--primary-forest, #1e3a1e)',
                  backgroundColor: 'var(--primary-lime-light, #f0fdf4)',
                  border: '1px solid var(--primary-lime, #86efac)',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Sparkles size={14} />
                Mark all as read
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={() => onClearAllNotifications(notifications.map(n => n.id))}
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#dc2626',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Trash2 size={14} />
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications container */}
      {notifications.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl, 16px)',
          border: '1px solid var(--border-light, #e2e8f0)',
          boxShadow: 'var(--shadow-sm)',
          textAlign: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}>
            <Bell size={32} style={{ opacity: 0.5 }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>No Alerts Yet</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '300px' }}>
              Your spiritual updates, shipping notices, and payment confirmations will appear here.
            </p>
          </div>
          <button
            onClick={onNavigateToShop}
            className="btn-lime"
            style={{
              padding: '10px 20px',
              fontSize: '0.85rem',
              fontWeight: 800,
              borderRadius: '8px',
              cursor: 'pointer',
              border: 'none',
              boxShadow: 'var(--shadow-sm)',
              marginTop: '8px'
            }}
          >
            Go to Pooja Store
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {notifications.map((notif) => {
            const { borderColor, bgColor } = getNotificationStyle(notif.type, notif.read);
            return (
              <div
                key={notif.id}
                onClick={() => onMarkAsRead(notif.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '18px',
                  backgroundColor: bgColor,
                  border: `1.5px solid ${borderColor}`,
                  borderRadius: 'var(--radius-lg, 12px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                className="notification-item-card"
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.01)';
                }}
              >
                {/* Unread Indicator Dot */}
                {!notif.read && (
                  <span style={{
                    position: 'absolute',
                    top: '20px',
                    right: '40px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: notif.type === 'payment_declined' ? '#ef4444' : 'var(--primary-lime, #15803d)'
                  }} />
                )}

                {/* Individual Clear Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearNotification(notif.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '6px',
                    borderRadius: '6px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Clear alert"
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = '#dc2626';
                    e.currentTarget.style.backgroundColor = '#fee2e2';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Trash2 size={14} />
                </button>

                {/* Left: Icon box */}
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-light, #e2e8f0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                }}>
                  {getNotificationIcon(notif.type)}
                </div>

                {/* Right: Message & Metadata */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)'
                    }}>
                      Order #{notif.orderId}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)'
                    }}>
                      • {notif.timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p style={{
                    fontSize: '0.88rem',
                    fontWeight: notif.read ? 500 : 700,
                    color: 'var(--text-dark)',
                    margin: 0,
                    lineHeight: '1.4',
                    paddingRight: '20px'
                  }}>
                    {notif.message}
                  </p>

                  {/* Direct Action Prompt for payment re-upload */}
                  {notif.type === 'payment_declined' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid triggering card click
                        onMarkAsRead(notif.id);
                        onNavigateToOrders();
                      }}
                      style={{
                        alignSelf: 'flex-start',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '8px',
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                    >
                      Re-upload Payment Proof
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
