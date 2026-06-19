import React from 'react';
import { Mail, Phone, MessageSquare, ChevronDown, CheckCircle, Send, AlertCircle } from 'lucide-react';

interface FAQ {
  q: string;
  a: string;
}

export const ContactUsPage: React.FC = () => {
  // Contact Form State
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [formSubmitted, setFormSubmitted] = React.useState(false);

  // FAQ Accordion State
  const [openFAQIndex, setOpenFAQIndex] = React.useState<number | null>(0);

  const faqs: FAQ[] = [
    {
      q: 'Are the deity idols and brass items authentic and pure?',
      a: 'Yes, all Mantra Puja idols and brasswares are solid brass or copper, handcrafted by generational brass-smiths in Varanasi. There are zero synthetic metals, coatings, or toxic additives used.',
    },
    {
      q: 'How do you energize (Prana Pratishtha) shipped items?',
      a: 'We collaborate with traditional Vedic priests in Kashi. Every Tuesday and Friday, purchased Rudrakshas, Yantras, and puja altars undergo customized holy bathing (Abhishekam) and energetic mantra chanting prior to dispatch.',
    },
    {
      q: 'Do you ship certified beads globally?',
      a: 'We offer worldwide express shipping. Every single bead of Rudraksha ships with an authentic, holographic lab testing report detailing its dimensions, face-count (Mukhi), and energetic signature.',
    },
    {
      q: 'What is your refund policy on sanctified tools?',
      a: 'We offer an easy 15-day return policy. If you receive a product damaged during express transit or are not fully satisfied, please initiate a return through your dashboard, and we will happily assist with refunds.',
    },
  ];

  const handleFAQToggle = (index: number) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Full Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please provide a valid email';
    }
    if (!formData.subject.trim()) errors.subject = 'Subject is required';
    if (!formData.message.trim()) {
      errors.message = 'Message description is required';
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters long';
    }
    return errors;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      setFormSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setFormSubmitted(false), 5000); // Reset alert after 5s
    }
  };

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '80vh', paddingBottom: '100px' }}>
      
      {/* 1. Header Cover */}
      <section style={{
        background: 'linear-gradient(135deg, var(--primary-forest) 0%, #4c1f13 100%)',
        color: '#ffffff',
        padding: '50px 0 40px 0',
        borderBottom: '4px solid var(--primary-lime)',
        textAlign: 'center'
      }}>
        <div className="container">
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
            Sacred Support & Contact
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.88rem', maxWidth: '500px', margin: '8px auto 0 auto', lineHeight: 1.5 }}>
            Have questions about Rudraksha sizing, puja timings, or bulk orders? Reach out and connect with our Vedic support sadhakas.
          </p>
        </div>
      </section>

      {/* 2. Main Content Grid (Form + Communication Columns) */}
      <div className="container" style={{ marginTop: '40px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: '40px',
          alignItems: 'start'
        }} className="hero-grid-split">
          
          {/* Left Column: Form Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            padding: '32px',
            boxShadow: 'var(--shadow-sm)',
            textAlign: 'left'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px' }}>Send Us a Message</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '24px' }}>We typically respond to spiritual inquiries within 12–24 hours.</p>

            {formSubmitted && (
              <div style={{
                backgroundColor: '#dcfce7',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '24px',
                animation: 'slideUp 0.2s ease-out'
              }}>
                <CheckCircle size={18} />
                <span>Message sent successfully! Our temple representative will contact you shortly.</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '6px' }}>Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${formErrors.name ? '#dc2626' : 'var(--border-light)'}`,
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                    placeholder="Enter your name"
                  />
                  {formErrors.name && (
                    <span style={{ color: '#dc2626', fontSize: '0.72rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                      <AlertCircle size={10} /> {formErrors.name}
                    </span>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '6px' }}>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${formErrors.email ? '#dc2626' : 'var(--border-light)'}`,
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                    placeholder="you@email.com"
                  />
                  {formErrors.email && (
                    <span style={{ color: '#dc2626', fontSize: '0.72rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                      <AlertCircle size={10} /> {formErrors.email}
                    </span>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '6px' }}>Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${formErrors.subject ? '#dc2626' : 'var(--border-light)'}`,
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                    placeholder="Puja ritual questions, shipping, custom requests..."
                  />
                  {formErrors.subject && (
                    <span style={{ color: '#dc2626', fontSize: '0.72rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                      <AlertCircle size={10} /> {formErrors.subject}
                    </span>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '6px' }}>Message Description</label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${formErrors.message ? '#dc2626' : 'var(--border-light)'}`,
                      fontSize: '0.88rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                    placeholder="Write detailed questions here..."
                  />
                  {formErrors.message && (
                    <span style={{ color: '#dc2626', fontSize: '0.72rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                      <AlertCircle size={10} /> {formErrors.message}
                    </span>
                  )}
                </div>

                <div style={{ marginTop: '8px' }}>
                  <button
                    type="submit"
                    className="btn-lime"
                    style={{
                      padding: '12px 28px',
                      fontSize: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Send size={15} />
                    <span>Send Message</span>
                  </button>
                </div>

              </div>
            </form>
          </div>

          {/* Right Column: Communication Toggles & Contact Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* WhatsApp Card */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <div style={{
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>WhatsApp Live Chat</h4>
                  <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700 }}>Online • Quick Support</span>
                </div>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
                Connect directly with our Varanasi temple dispatch managers for immediate status, customs inquiries, or photo approvals.
              </p>
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: '#166534',
                  backgroundColor: '#dcfce7',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                Chat on WhatsApp
              </a>
            </div>

            {/* Email Support Card */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <div style={{
                  backgroundColor: 'var(--primary-lime-light)',
                  color: 'var(--primary-lime)',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Mail size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>Support Email</h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--primary-lime)', fontWeight: 700 }}>24hr SLA Responses</span>
                </div>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
                For custom deity order sizing requests, certificate queries, or temple trust collaborations, drop us a direct email.
              </p>
              <a
                href="mailto:support@mantrapuja.com"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8' + 'rem',
                  fontWeight: 800,
                  color: 'var(--primary-lime)',
                  backgroundColor: 'var(--primary-lime-light)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                Email: support@mantrapuja.com
              </a>
            </div>

            {/* Phone Hotline Card */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <div style={{
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Phone size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>Call Center Helpline</h4>
                  <span style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 700 }}>Toll-Free in India</span>
                </div>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '4px' }}>
                Connect directly over voice helpline calls (9 AM - 6 PM IST).
              </p>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                Helpline: 1800-108-OMMM
              </span>
            </div>

          </div>
        </div>

        {/* 3. Collapsible FAQ Preview Accordion Section */}
        <section style={{
          marginTop: '60px',
          borderTop: '1px solid var(--border-light)',
          paddingTop: '50px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)' }}>Frequently Sacred Questions</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Quick answers to common questions regarding temple energizing practices and express shipping.
            </p>
          </div>

          <div style={{
            maxWidth: '720px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            textAlign: 'left'
          }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFAQIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-light)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <button
                    onClick={() => handleFAQToggle(idx)}
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '20px',
                      backgroundColor: isOpen ? 'var(--primary-lime-light)' : '#ffffff',
                      textAlign: 'left',
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)' }}>{faq.q}</span>
                    <ChevronDown size={16} style={{
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      color: isOpen ? 'var(--primary-lime)' : 'var(--text-muted)',
                      transition: 'transform 0.2s'
                    }} />
                  </button>

                  {isOpen && (
                    <div style={{
                      padding: '20px 24px',
                      borderTop: '1px solid var(--border-light)',
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.6,
                      backgroundColor: '#ffffff',
                      animation: 'slideUp 0.15s ease-out'
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </div>

    </div>
  );
};
