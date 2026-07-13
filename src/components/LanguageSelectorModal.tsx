import React from 'react';
import { useLanguage } from '../lib/i18n';
import { useTranslation } from 'react-i18next';
import { Languages, Info } from 'lucide-react';

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
    <div className="lang-modal-overlay">
      <div className="lang-modal-container">
        {/* Beautiful spiritual language icon */}
        <div className="lang-icon-wrapper">
          <Languages size={26} />
        </div>

        <h2 className="lang-modal-title">
          {t('title')}
        </h2>
        
        <p className="lang-modal-subtitle">
          {t('subtitle')}
        </p>

        <div className="lang-options-grid">
          {/* English Option Card */}
          <button
            onClick={() => handleSelectLanguage('en')}
            className="lang-card"
            aria-label="Select English"
          >
            <span className="lang-card-letter">Aa</span>
            <span className="lang-card-name">{t('english')}</span>
            <span className="lang-card-desc">{t('englishDesc')}</span>
          </button>

          {/* Hindi Option Card */}
          <button
            onClick={() => handleSelectLanguage('hi')}
            className="lang-card"
            aria-label="हिंदी भाषा चुनें"
          >
            <span className="lang-card-letter">अ</span>
            <span className="lang-card-name">{t('hindi')}</span>
            <span className="lang-card-desc">{t('hindiDesc')}</span>
          </button>
        </div>

        {/* Footer Note Info Box */}
        <div className="lang-modal-footer-box">
          <Info size={16} style={{ color: 'var(--primary-accent)', flexShrink: 0, marginTop: '2px' }} />
          <p className="lang-modal-footer-text">
            {t('footerNote')}
          </p>
        </div>
      </div>
    </div>
  );
};

