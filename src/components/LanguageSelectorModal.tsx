import React from 'react';
import { useLanguage } from '../lib/i18n';
import { useTranslation } from 'react-i18next';

export const LanguageSelectorModal: React.FC = () => {
  const { isLanguageReady, hasLanguagePreference, setLanguage } = useLanguage();
  const { t } = useTranslation('languageSelector');

  if (!isLanguageReady || hasLanguagePreference) {
    return null;
  }

  const handleSelectLanguage = (lang: 'en' | 'hi') => {
    setLanguage(lang);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="glass animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px 24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '2px solid var(--primary-gold, #d97706)',
          textAlign: 'center',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 900,
            color: 'var(--primary-deep, #450a0a)',
            marginBottom: '6px',
            fontFamily: 'Playfair Display, serif',
          }}
        >
          {t('title')}
        </h2>
        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            color: 'var(--text-dark, #111827)',
            marginBottom: '24px',
          }}
        >
          {t('subtitle')}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* English Option */}
          <button
            onClick={() => handleSelectLanguage('en')}
            style={{
              padding: '14px 20px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #e5e7eb)',
              backgroundColor: '#f9fafb',
              color: 'var(--text-primary, #1f2937)',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-gold, #d97706)';
              e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.05)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color, #e5e7eb)';
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {t('english')}
          </button>

          {/* Hindi Option */}
          <button
            onClick={() => handleSelectLanguage('hi')}
            style={{
              padding: '14px 20px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #e5e7eb)',
              backgroundColor: '#f9fafb',
              color: 'var(--text-primary, #1f2937)',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-gold, #d97706)';
              e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.05)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color, #e5e7eb)';
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {t('hindi')}
          </button>
        </div>

        <p
          style={{
            fontSize: '0.74rem',
            color: 'var(--text-muted, #6b7280)',
            marginTop: '20px',
            lineHeight: '1.4',
          }}
        >
          {t('footerNote')}
        </p>
      </div>
    </div>
  );
};
