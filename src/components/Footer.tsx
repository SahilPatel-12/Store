import React from 'react';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
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
      className="glass"
      style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-color)',
        padding: '60px 0 30px',
        backgroundColor: 'var(--bg-secondary)'
      }}
    >
      <div className="container">
        {/* Footer Top Links */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '40px',
            marginBottom: '40px',
            textAlign: 'left'
          }}
          className="footer-grid"
        >
          {/* Brand Info */}
          <div style={{ flex: '2 1 280px' }}>
            <div style={{ marginBottom: '16px' }}>
              <img 
                src={logo} 
                alt="Mantra Puja Logo" 
                style={{ 
                  height: '55px', 
                  objectFit: 'contain'
                }} 
              />
            </div>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '20px'
            }}>
              Curating the finest, authentic Vedic items. Energized by traditional rituals at the banks of the sacred Ganges in Varanasi, delivered straight to your home altar.
            </p>
          </div>

          {/* Quick categories */}
          <div style={{ flex: '1 1 150px' }}>
            <h4 style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--primary-deep)',
              marginBottom: '16px',
              letterSpacing: '1px'
            }}>
              Spiritual Shop
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <li><a href="#all" style={{ color: 'var(--text-secondary)' }}>All Collections</a></li>
              <li><a href="#kits" style={{ color: 'var(--text-secondary)' }}>Sacred Puja Kits</a></li>
              <li><a href="#idols" style={{ color: 'var(--text-secondary)' }}>Brass Deity Idols</a></li>
              <li><a href="#incense" style={{ color: 'var(--text-secondary)' }}>Organic Incense</a></li>
              <li><a href="#books" style={{ color: 'var(--text-secondary)' }}>Sacred Books</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div style={{ flex: '1.5 1 200px' }}>
            <h4 style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--primary-deep)',
              marginBottom: '16px',
              letterSpacing: '1px'
            }}>
              Sacred Support
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <MapPin size={16} style={{ color: 'var(--primary-gold)', marginTop: '3px', flexShrink: 0 }} />
                <span>Kedar Ghat Road, Shivala, Varanasi, UP, 221001, India</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} style={{ color: 'var(--primary-gold)', flexShrink: 0 }} />
                <a href="mailto:support@mantrapuja.com">support@mantrapuja.com</a>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} style={{ color: 'var(--primary-gold)', flexShrink: 0 }} />
                <span>+1 (800) 108-OMMM</span>
              </li>
            </ul>
          </div>

          {/* Newsletter subscription */}
          <div style={{ flex: '1.8 1 240px' }}>
            <h4 style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--primary-deep)',
              marginBottom: '16px',
              letterSpacing: '1px'
            }}>
              Join Divine Circle
            </h4>
            <p style={{
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              marginBottom: '16px'
            }}>
              Subscribe to receive sacred mantras, weekly Vastu tips, and exclusive early access to auspicious items.
            </p>

            <form onSubmit={handleSubmit} style={{
              display: 'flex',
              position: 'relative'
            }}>
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: '4px',
                  top: '4px',
                  bottom: '4px',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-deep)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-accent)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-deep)'}
              >
                <ArrowRight size={18} />
              </button>
            </form>

            {subscribed && (
              <span style={{
                fontSize: '0.8rem',
                color: 'green',
                display: 'block',
                marginTop: '8px'
              }}>
                Thank you! Welcome to the divine circle.
              </span>
            )}
          </div>
        </div>

        {/* Footer Bottom copyright */}
        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)'
        }}>
          <span>© {new Date().getFullYear()} Mantra Puja. All Spiritual Rights Reserved.</span>
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <a href="#privacy">Privacy Blessings</a>
            <a href="#terms">Terms of Devotion</a>
            <a href="#shipping">Sacred Shipping</a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid {
            flex-direction: column !important;
            gap: 30px !important;
          }
        }
      `}</style>
    </footer>
  );
};
