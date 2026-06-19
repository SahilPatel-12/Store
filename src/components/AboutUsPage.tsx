import React from 'react';
import { Sparkles, Heart, Shield, Landmark, Eye } from 'lucide-react';

export const AboutUsPage: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '80vh', paddingBottom: '100px' }}>
      
      {/* 1. Hero Cover Header */}
      <section style={{
        background: 'linear-gradient(135deg, var(--primary-forest) 0%, #4c1f13 100%)',
        color: '#ffffff',
        padding: '80px 0 60px 0',
        borderBottom: '4px solid var(--primary-lime)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 60%)',
          zIndex: 1
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 5 }}>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            color: 'var(--primary-lime)',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            backgroundColor: 'rgba(249,115,22,0.15)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)'
          }}>Our Sacred Roots</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', marginTop: '12px' }}>
            About Mantra Puja
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.05rem', maxWidth: '600px', margin: '12px auto 0 auto', lineHeight: 1.6 }}>
            Bridging timeless Vedic wisdom with the pace of modern lives, bringing pure, energized spiritual tools directly to your home.
          </p>
        </div>
      </section>

      {/* 2. Brand Story Section (Grid Layout) */}
      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '50px',
            alignItems: 'center'
          }} className="hero-grid-split">
            
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={24} style={{ color: 'var(--primary-lime)' }} /> The Mantra Puja Brand Story
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '16px' }}>
                Mantra Puja was founded in the ancient spiritual city of Varanasi, at the banks of the sacred river Ganges. Observing how difficult it had become for devotees across the globe to procure authentic, high-quality, and spiritually energized puja elements, we set out with a simple mission: **to restore purity to personal worship.**
              </p>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                Every mala, incense burner, and deity idol in our catalog represents a piece of India's vast devotional heritage. We source directly from authentic artisans, craft communities, and trusted weavers, ensuring fair livelihood opportunities while preserving age-old Vedic arts.
              </p>
            </div>

            {/* Visual Image Placeholder Box */}
            <div style={{
              height: '300px',
              backgroundColor: '#e5e7eb',
              border: '2px dashed #d1d5db',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              padding: '24px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <span style={{ fontSize: '3rem', marginBottom: '12px' }}>🌅</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Artisanal Handcrafting Box
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Varanasi Ghats & Local Devotional Weaver Guilds
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Three Core Pillars (Grid: Mission, Authenticity, Temple) */}
      <section style={{
        padding: '60px 0',
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--border-light)',
        borderBottom: '1px solid var(--border-light)'
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-dark)' }}>Our Sacred Commitments</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              The foundational pillars upon which Mantra Puja brings Vedic worship to your home.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '30px'
          }} className="hero-grid-split">
            
            {/* Pillar 1: Spiritual Mission */}
            <div style={{
              backgroundColor: '#fafafa',
              borderRadius: 'var(--radius-lg)',
              padding: '30px 24px',
              border: '1px solid var(--border-light)',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                backgroundColor: 'var(--primary-lime-light)',
                color: 'var(--primary-lime)',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                margin: '0 auto 20px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Heart size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '10px' }}>
                Spiritual Mission
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Empowering devotees worldwide by supplying highly energized sadhana beads and ritual kits, helping them build peaceful morning routines and daily sanctuary space.
              </p>
            </div>

            {/* Pillar 2: Authenticity Promise */}
            <div style={{
              backgroundColor: '#fafafa',
              borderRadius: 'var(--radius-lg)',
              padding: '30px 24px',
              border: '1px solid var(--border-light)',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                backgroundColor: '#dcfce7',
                color: '#15803d',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                margin: '0 auto 20px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '10px' }}>
                Authenticity Promise
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Every Rudraksha bead in our store is accompanied by an independent lab certification. Our camphor is 100% organic bhimseni, free of synthetic paraffin dyes.
              </p>
            </div>

            {/* Pillar 3: Temple Connection */}
            <div style={{
              backgroundColor: '#fafafa',
              borderRadius: 'var(--radius-lg)',
              padding: '30px 24px',
              border: '1px solid var(--border-light)',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                margin: '0 auto 20px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Landmark size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '10px' }}>
                Temple Connections
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                We work alongside priests at legendary temple trusts in Varanasi and Vrindavan to host traditional Vedic chanting and energizing blessings on all shipped items.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Vision & Future Goals */}
      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '0.8fr 1.2fr',
            gap: '50px',
            alignItems: 'center'
          }} className="hero-grid-split">
            
            {/* Visual Image Placeholder Box */}
            <div style={{
              height: '300px',
              backgroundColor: '#e5e7eb',
              border: '2px dashed #d1d5db',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              padding: '24px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <span style={{ fontSize: '3rem', marginBottom: '12px' }}>✨</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Vision & Devotion Box
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Vedic Chanting & Sanctified Energized Processes
              </span>
            </div>

            <div style={{ textAlign: 'left' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={24} style={{ color: 'var(--primary-lime)' }} /> Our Vision Statement
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '16px' }}>
                Mantra Puja envisions a world where every household has a small, active, peaceful sanctuary for meditation, daily chanting, and Vedic rituals. We strive to be the most trusted global bridge for authentic Indian spirituality, combining strict ritual adherence with beautiful modern styling and user-focused simplicity.
              </p>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                In the years to come, we aim to host online daily pujas, astrology consultation guides, and custom artisan craft programs to enrich the physical and metaphysical practice of devotees globally.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};
