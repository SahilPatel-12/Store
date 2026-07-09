import React from 'react';
import { Mail, Phone, MapPin, ArrowRight, ShieldCheck, Sparkles, Award } from 'lucide-react';
import logo from '../assets/My_logo/Frame 16.png';

export const Footer: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer
      className="devotional-gradient-header"
      style={{
        marginTop: 'auto',
        background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 30%, #c2410c 65%, #d97706 100%)',
        backgroundSize: '200% 200%',
        borderTop: '4px solid #ea580c', // Saffron divider
        position: 'relative',
        overflow: 'hidden',
        color: '#f3f4f6',
        textAlign: 'left'
      }}
    >
      {/* 100% Lightweight Rotating Lotus Mandala SVG overlay */}
      <svg className="footer-mandala" viewBox="0 0 100 100" style={{
        position: 'absolute',
        bottom: '-120px',
        right: '-120px',
        width: '400px',
        height: '400px',
        opacity: 0.04,
        transformOrigin: 'center',
        animation: 'spinMandala 80s linear infinite',
        pointerEvents: 'none',
        zIndex: 1
      }}>
        <circle cx="50" cy="50" r="45" fill="none" stroke="#ffffff" strokeWidth="0.4" strokeDasharray="3,3" />
        <circle cx="50" cy="50" r="35" fill="none" stroke="#ffffff" strokeWidth="0.4" />
        <circle cx="50" cy="50" r="25" fill="none" stroke="#ffffff" strokeWidth="0.4" strokeDasharray="2,2" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <g transform={`rotate(${deg} 50 50)`} key={deg}>
            <path d="M50 5 C55 20, 55 35, 50 50 C45 35, 45 20, 50 5" fill="none" stroke="#ffffff" strokeWidth="0.5" />
          </g>
        ))}
      </svg>

      {/* Embedded CSS for expanding underlines and keyframe spins */}
      <style>{`
        @keyframes bgShiftDevotional {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .devotional-gradient-header {
          padding: 80px 0 40px 0;
          background: linear-gradient(135deg, #450a0a 0%, #7f1d1d 30%, #c2410c 65%, #d97706 100%);
          background-size: 200% 200%;
          animation: bgShiftDevotional 12s ease-in-out infinite;
        }
        @keyframes spinMandala {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .footer-link {
          color: #d1d5db;
          transition: all 0.25s ease;
          position: relative;
          text-decoration: none;
        }
        .footer-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 1px;
          bottom: -2px;
          left: 0;
          background-color: #f59e0b;
          transition: width 0.25s ease;
        }
        .footer-link:hover {
          color: #fde047 !important;
          padding-left: 4px;
        }
        .footer-link:hover::after {
          width: 100%;
        }
        .footer-trust-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          borderRadius: 8px;
          transition: all 0.25s ease;
        }
        .footer-trust-badge:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(250, 204, 21, 0.15);
          transform: translateY(-2px);
        }
        @media (max-width: 768px) {
          .devotional-gradient-header {
            padding: 40px 0 24px 0 !important;
          }
          .footer-grid {
            flex-direction: column !important;
            gap: 20px !important;
          }
          .footer-trust-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            margin-bottom: 40px !important;
          }
          .footer-trust-badge {
            padding: 10px 14px !important;
            gap: 10px !important;
          }
          .footer-trust-badge p {
            display: none !important;
          }
          .footer-trust-badge h5 {
            font-size: 0.76rem !important;
          }
          .footer-trust-badge svg {
            width: 16px !important;
            height: 16px !important;
          }
          .footer-mandala {
            width: 240px !important;
            height: 240px !important;
            bottom: -60px !important;
            right: -60px !important;
          }
        }
      `}</style>

      <div className="container" style={{ position: 'relative', zIndex: 5 }}>
        
        {/* Trust Badges Bar */}
        <div 
          className="footer-trust-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '60px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '40px'
          }}
        >
          <div className="footer-trust-badge">
            <div style={{ backgroundColor: 'rgba(234, 88, 12, 0.15)', padding: '10px', borderRadius: '50%', color: '#fb923c' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h5 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, color: '#f9fafb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Directly From Varanasi</h5>
              <p style={{ fontSize: '0.76rem', color: '#9ca3af', margin: '2px 0 0 0' }}>Energized on the holy banks of the Ganges River.</p>
            </div>
          </div>

          <div className="footer-trust-badge">
            <div style={{ backgroundColor: 'rgba(250, 204, 21, 0.15)', padding: '10px', borderRadius: '50%', color: '#facc15' }}>
              <Award size={20} />
            </div>
            <div>
              <h5 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, color: '#f9fafb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Certified Vedic Items</h5>
              <p style={{ fontSize: '0.76rem', color: '#9ca3af', margin: '2px 0 0 0' }}>100% natural stones & lab-certified Rudrakshas.</p>
            </div>
          </div>

          <div className="footer-trust-badge">
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '50%', color: '#34d399' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h5 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, color: '#f9fafb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Spiritual Guarantee</h5>
              <p style={{ fontSize: '0.76rem', color: '#9ca3af', margin: '2px 0 0 0' }}>Sourced sustainably supporting temple karigars.</p>
            </div>
          </div>
        </div>

        {/* Footer Top Links */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '40px',
            marginBottom: '60px'
          }}
          className="footer-grid"
        >
          {/* Brand Info */}
          <div style={{ flex: '2 1 280px' }}>
            <div style={{ marginBottom: '20px' }}>
              <img 
                src={logo} 
                alt="Mantra Puja Logo" 
                style={{ 
                  height: '60px', 
                  objectFit: 'contain'
                }} 
              />
            </div>
            <p style={{
              fontSize: '0.9rem',
              color: '#9ca3af',
              lineHeight: 1.6,
              marginBottom: '20px'
            }}>
              Curating authentic, high-vibrational Vedic artifacts, brass deities, and energetic beads. Hand-blessed through ancient invocation rituals in Kashi (Varanasi) to grace your home altar with peace.
            </p>
          </div>

          {/* Quick categories */}
          <div style={{ flex: '1 1 150px' }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              background: 'linear-gradient(90deg, #fef08a 0%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '20px',
              letterSpacing: '1px'
            }}>
              Spiritual Shop
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', padding: 0, margin: 0 }}>
              <li><a href="#all" className="footer-link">All Collections</a></li>
              <li><a href="#kits" className="footer-link">Sacred Puja Kits</a></li>
              <li><a href="#idols" className="footer-link">Brass Deity Idols</a></li>
              <li><a href="#incense" className="footer-link">Organic Incense</a></li>
              <li><a href="#books" className="footer-link">Sacred Books</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div style={{ flex: '1.5 1 220px' }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              background: 'linear-gradient(90deg, #fef08a 0%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '20px',
              letterSpacing: '1px'
            }}>
              Sacred Support
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem', padding: 0, margin: 0, color: '#d1d5db' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <MapPin size={16} style={{ color: '#fb923c', marginTop: '3px', flexShrink: 0 }} />
                <span>Kedar Ghat Road, Shivala, Varanasi, UP, 221001, India</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={16} style={{ color: '#fb923c', flexShrink: 0 }} />
                <a href="mailto:support@mantrapuja.com" style={{ color: '#d1d5db', textDecoration: 'none' }} className="footer-link">support@mantrapuja.com</a>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={16} style={{ color: '#fb923c', flexShrink: 0 }} />
                <span>+1 (800) 108-OMMM (6666)</span>
              </li>
            </ul>
          </div>

          {/* Newsletter subscription */}
          <div style={{ flex: '1.8 1 240px' }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              background: 'linear-gradient(90deg, #fef08a 0%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '20px',
              letterSpacing: '1px'
            }}>
              Divine Circle
            </h4>
            <p style={{
              fontSize: '0.86rem',
              color: '#9ca3af',
              marginBottom: '20px',
              lineHeight: 1.5
            }}>
              Subscribe to receive weekly Panchang updates, auspicious dates (Purnima, Ekadashi), and priority access to limited beads.
            </p>

            <form onSubmit={handleSubmit} style={{
              display: 'flex',
              position: 'relative'
            }}>
              <input
                type="email"
                required
                placeholder="Devotee Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 52px 14px 18px',
                  borderRadius: '12px',
                  border: '1.5px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  color: '#ffffff',
                  outline: 'none',
                  fontSize: '0.85rem',
                  transition: 'all 0.25s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#fb923c';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(249, 115, 22, 0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '6px',
                  bottom: '6px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease-in-out',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
              >
                <ArrowRight size={18} />
              </button>
            </form>

            {subscribed && (
              <span style={{
                fontSize: '0.8rem',
                color: '#34d399',
                display: 'block',
                marginTop: '10px',
                fontWeight: 700
              }}>
                🕉️ Thank you! Welcome to our spiritual community.
              </span>
            )}
          </div>
        </div>

        {/* Footer Bottom copyright */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '28px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.82rem',
          color: '#9ca3af'
        }}>
          <span>© {new Date().getFullYear()} Mantra Puja Trust. All Spiritual Rights Preserved.</span>
          <div style={{ display: 'flex', gap: '24px', marginTop: '12px', flexWrap: 'wrap' }}>
            <a href="#privacy" className="footer-link" style={{ color: '#9ca3af' }}>Privacy Blessings</a>
            <a href="#terms" className="footer-link" style={{ color: '#9ca3af' }}>Terms of Devotion</a>
            <a href="#shipping" className="footer-link" style={{ color: '#9ca3af' }}>Sacred Shipping</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

