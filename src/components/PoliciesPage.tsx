import React from 'react';
import { ShieldAlert, RefreshCw, Truck, FileText } from 'lucide-react';

type PolicyTab = 'privacy' | 'refund' | 'shipping' | 'terms';

export const PoliciesPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<PolicyTab>('privacy');

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '80vh', paddingBottom: '100px' }}>
      
      {/* 1. Header Banner */}
      <section style={{
        background: 'linear-gradient(135deg, var(--primary-forest) 0%, #4c1f13 100%)',
        color: '#ffffff',
        padding: '50px 0 40px 0',
        borderBottom: '4px solid var(--primary-lime)',
        textAlign: 'center'
      }}>
        <div className="container">
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
            Store Guidelines & Policies
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.88rem', maxWidth: '500px', margin: '8px auto 0 auto', lineHeight: 1.5 }}>
            Read through our digital terms, shipping timeframes, returns rules, and data privacy safeguards.
          </p>
        </div>
      </section>

      {/* 2. Main Dashboard Split Layout */}
      <div className="container" style={{ marginTop: '40px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '40px',
          alignItems: 'start'
        }} className="hero-grid-split">
          
          {/* Policy Left Selector Tabs */}
          <aside style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            padding: '16px',
            boxShadow: 'var(--shadow-sm)'
          }} className="profile-sidebar-wrapper">
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              
              {/* Privacy */}
              <button
                onClick={() => setActiveTab('privacy')}
                className={`profile-nav-btn ${activeTab === 'privacy' ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: activeTab === 'privacy' ? 700 : 500,
                  backgroundColor: activeTab === 'privacy' ? 'var(--primary-lime-light)' : 'transparent',
                  color: activeTab === 'privacy' ? 'var(--primary-lime)' : 'var(--text-dark)',
                  transition: 'all 0.15s'
                }}
              >
                <ShieldAlert size={18} />
                <span>Privacy Blessings</span>
              </button>

              {/* Refund */}
              <button
                onClick={() => setActiveTab('refund')}
                className={`profile-nav-btn ${activeTab === 'refund' ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: activeTab === 'refund' ? 700 : 500,
                  backgroundColor: activeTab === 'refund' ? 'var(--primary-lime-light)' : 'transparent',
                  color: activeTab === 'refund' ? 'var(--primary-lime)' : 'var(--text-dark)',
                  transition: 'all 0.15s'
                }}
              >
                <RefreshCw size={18} />
                <span>Refund Policy</span>
              </button>

              {/* Shipping */}
              <button
                onClick={() => setActiveTab('shipping')}
                className={`profile-nav-btn ${activeTab === 'shipping' ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: activeTab === 'shipping' ? 700 : 500,
                  backgroundColor: activeTab === 'shipping' ? 'var(--primary-lime-light)' : 'transparent',
                  color: activeTab === 'shipping' ? 'var(--primary-lime)' : 'var(--text-dark)',
                  transition: 'all 0.15s'
                }}
              >
                <Truck size={18} />
                <span>Sacred Shipping</span>
              </button>

              {/* Terms */}
              <button
                onClick={() => setActiveTab('terms')}
                className={`profile-nav-btn ${activeTab === 'terms' ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: activeTab === 'terms' ? 700 : 500,
                  backgroundColor: activeTab === 'terms' ? 'var(--primary-lime-light)' : 'transparent',
                  color: activeTab === 'terms' ? 'var(--primary-lime)' : 'var(--text-dark)',
                  transition: 'all 0.15s'
                }}
              >
                <FileText size={18} />
                <span>Terms of Devotion</span>
              </button>

            </nav>
          </aside>

          {/* Policy Right Main Panel */}
          <main style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            padding: '36px',
            boxShadow: 'var(--shadow-sm)',
            minHeight: '480px',
            textAlign: 'left'
          }}>
            
            {/* ==============================================
                TAB: PRIVACY POLICY
                ============================================== */}
            {activeTab === 'privacy' && (
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '18px' }}>Privacy & Data Safeguards</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  <p>
                    At Mantra Puja Store, we treat your contact details and spiritual logs with the utmost sanctity. We collect personal name, shipping address, card/UPI identifiers, and email details strictly to pack and bless your sacred shipments correctly.
                  </p>
                  
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '10px' }}>1. What Data We Collect</h3>
                  <ul>
                    <li><strong>Contact Details:</strong> Your name, email, phone number, and physical billing/shipping location.</li>
                    <li><strong>Spiritual Goals:</strong> Choose intent lists (e.g. Vastu, Meditation) inside your dashboard so we can suggest custom energizing rituals.</li>
                    <li><strong>Transactions:</strong> Encrypted payment token logs through certified SSL secure gateway connections.</li>
                  </ul>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '10px' }}>2. Data Storage & Safety</h3>
                  <p>
                    All personal customer information undergoes AES-256 state-of-the-art encryption algorithms. We will **never sell, distribute, or leak** your contact records, emails, or personal spiritual details to bulk advertisement guilds.
                  </p>
                </div>
              </div>
            )}

            {/* ==============================================
                TAB: REFUND POLICY
                ============================================== */}
            {activeTab === 'refund' && (
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '18px' }}>Refund & Exchange Policy</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  <p>
                    We believe in delivering ultimate satisfaction along with our energized tools. If a shipped sacred idol, brass diya, or Himalayan bead is damaged during courier transit, we will happily assist with quick exchanges.
                  </p>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '10px' }}>1. 15-Day Return Window</h3>
                  <p>
                    Devotees have a full **15 days from delivery** to initiate a return or exchange. Products must remain in their original craft boxes, complete with lab-certified holographic report documents.
                  </p>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '10px' }}>2. Energized Puja Items Notice</h3>
                  <p>
                    Due to the sacred nature of energized Yantras, Kavachs, and Rudraksha Malas which undergo customized Prana-Pratishtha bathing rituals in Kashi trusts, returns are subject to a **₹800 spiritual de-energization and cleanup fee** prior to restocking.
                  </p>
                </div>
              </div>
            )}

            {/* ==============================================
                TAB: SHIPPING POLICY
                ============================================== */}
            {activeTab === 'shipping' && (
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '18px' }}>Sacred Shipping & Dispatch</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  <p>
                    We ship our blessed altars and energetic items globally with sacred care and speed via the Sacred Express courier service networks.
                  </p>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '10px' }}>1. Dispatch Processing Times</h3>
                  <p>
                    Standard orders ship within **24 to 48 hours**. Items requesting customized temple energizing (Prana Pratishtha blessings at Varanasi Trusts) will undergo rituals on Tuesday/Friday, shipping instantly within **3 to 4 days**.
                  </p>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '10px' }}>2. Courier Partners & Costs</h3>
                  <ul>
                    <li><strong>Domestic (India):</strong> Free standard delivery for orders over ₹499 (delivered in 3–5 days).</li>
                    <li><strong>Global Express:</strong> Flat shipping calculated at checkout, taking 7–10 days with complete custom tracking reports.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* ==============================================
                TAB: TERMS & CONDITIONS
                ============================================== */}
            {activeTab === 'terms' && (
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '18px' }}>Terms & Devotional Conditions</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  <p>
                    Welcome to the Mantra Puja Sacred Store. By using our website and purchasing blessed beads, altars, or incense, you agree to our terms of devotion.
                  </p>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '10px' }}>1. Intellectual Spiritual Rights</h3>
                  <p>
                    The layout, serif typography details, images, brand descriptions, and Vedic research logs published here belong to the Mantra Puja brand trust, protected by copyright and intellectual properties.
                  </p>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '10px' }}>2. Astrological disclaimer</h3>
                  <p>
                    Vedic items are energetic tools designed to cultivate focus, ritual discipline, and mindfulness. Astrological benefits depend on daily practices, faith, and local factors. These do not serve as professional medical, legal, or physical diagnostics.
                  </p>
                </div>
              </div>
            )}

          </main>

        </div>
      </div>

    </div>
  );
};
