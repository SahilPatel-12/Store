import React from 'react';
import { 
  MapPin, Check, Camera, ArrowLeft, ArrowRight, 
  CheckCircle, RefreshCw, Star, Compass, Upload,
  Coins
} from 'lucide-react';
import { uploadToR2 } from '../lib/cloudflare/r2';

interface AstrologerOnboardingProps {
  loggedInUser: { id: string; fullName: string; email: string; phoneNumber: string };
  onComplete: (profileData: any) => void;
}

export const AstrologerOnboarding: React.FC<AstrologerOnboardingProps> = ({
  loggedInUser,
  onComplete
}) => {
  const [screen, setScreen] = React.useState(1);
  const [animating, setAnimating] = React.useState(false);

  // Form Fields State
  const [fullName, setFullName] = React.useState(loggedInUser.fullName || '');
  const [spiritualTitle, setSpiritualTitle] = React.useState('Vedic Astrologer');
  const [customTitle, setCustomTitle] = React.useState('');
  const [showCustomTitleInput, setShowCustomTitleInput] = React.useState(false);
  const [bio, setBio] = React.useState('');
  const [profilePhoto, setProfilePhoto] = React.useState('');
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [photoProgress, setPhotoProgress] = React.useState(0);
  
  const [experienceYears, setExperienceYears] = React.useState(10);
  const [readingsCount, setReadingsCount] = React.useState(1500);
  const [chargePerMin, setChargePerMin] = React.useState(40);
  const [isOnline, setIsOnline] = React.useState(true);

  const [selectedLanguages, setSelectedLanguages] = React.useState<string[]>(['Hindi', 'Sanskrit']);
  const [selectedSpecialties, setSelectedSpecialties] = React.useState<string[]>(['Vedic Astrology', 'Kundli Milan']);

  const [city, setCity] = React.useState('Varanasi');
  const [stateName, setStateName] = React.useState('Uttar Pradesh');
  const [fetchingLocation, setFetchingLocation] = React.useState(false);
  const [locationSuccess, setLocationSuccess] = React.useState(false);

  // Success screen bells states
  const [cosmicBlessingCount, setCosmicBlessingCount] = React.useState(0);

  const availableLanguages = [
    'Hindi', 'Sanskrit', 'English', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Punjabi'
  ];

  const titleOptions = [
    'Vedic Astrologer', 'KP Astrology Specialist', 'Vastu Shastra Expert', 'Lal Kitab Remedial Acharya', 'Tarot Reader', 'Numerologist', 'Other'
  ];

  const specialtyOptions = [
    'Vedic Astrology', 'Kundli Milan', 'Gemstone Advice', 'Vastu Dosha', 'KP Astrology', 'Palmistry', 'Numerology', 'Tarot Reading'
  ];

  // Geolocation trigger
  const requestLocation = () => {
    setFetchingLocation(true);
    setLocationSuccess(false);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      setFetchingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`);
          const data = await res.json();
          const address = data.address || {};
          const detectedCity = address.city || address.town || address.village || address.suburb || 'New Delhi';
          const detectedState = address.state || 'Delhi';
          
          setCity(detectedCity);
          setStateName(detectedState);
          setFetchingLocation(false);
          setLocationSuccess(true);
        } catch (err) {
          console.error(err);
          setCity('Mumbai');
          setStateName('Maharashtra');
          setFetchingLocation(false);
          setLocationSuccess(true);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not automatically determine location. Please enter details manually.');
        setFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Profile image uploader to Cloudflare R2
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setPhotoProgress(10);
    try {
      setPhotoProgress(35);
      const url = await uploadToR2(file, 'astrologers/photos', true);
      setPhotoProgress(85);
      setProfilePhoto(url);
      setPhotoProgress(100);
    } catch (err) {
      console.error('Error uploading photo to R2:', err);
      // Fallback: Generate a random profile photo URL using dicebear
      const fallbackUrl = `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(fullName)}`;
      setProfilePhoto(fallbackUrl);
      setPhotoProgress(100);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleSpecialty = (spec: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  // Bio template autofiller
  const generateBio = (style: string) => {
    const titleString = showCustomTitleInput ? customTitle : spiritualTitle;
    const specialtiesList = selectedSpecialties.join(', ');
    
    let text = '';
    if (style === 'classical') {
      text = `Trained under traditional Vedic systems of Horary Astrology (Prashna Kundli) and Vastu Shastra. As a ${titleString}, with over ${experienceYears} years of experience, I offer accurate predictions and simple, practical remedies for career progression, marriage blockages, and financial prosperity.`;
    } else if (style === 'modern') {
      text = `Blending classical Parashara principles with modern KP Astrology to provide logical, timing-based predictions. Specialist in ${specialtiesList || 'horoscope matching'}, gemstone therapy, and chart rectifications. Committed to guiding you towards your true planetary alignment.`;
    } else if (style === 'remedial') {
      text = `Focusing primarily on Lal Kitab remedies to remove obstacles in planetary transits. Having resolved over ${readingsCount} charts, I guide devotees with simple mantras, gem guidance, and lifestyle modifications to heal planetary doshas.`;
    }
    setBio(text);
  };

  // Navigation handlers with page slide animation
  const nextScreen = () => {
    setAnimating(true);
    setTimeout(() => {
      setScreen(prev => prev + 1);
      setAnimating(false);
    }, 300);
  };

  const prevScreen = () => {
    setAnimating(true);
    setTimeout(() => {
      setScreen(prev => prev - 1);
      setAnimating(false);
    }, 300);
  };

  const handleFinalize = async () => {
    const finalTitle = showCustomTitleInput ? customTitle : spiritualTitle;
    const finalPhoto = profilePhoto || `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(fullName)}`;
    const finalBio = bio || `Vedic astrologer with ${experienceYears} years of experience specializing in birth chart analysis and cosmic alignment.`;

    const profilePayload = {
      fullName,
      spiritualTitle: finalTitle,
      bio: finalBio,
      profilePhoto: finalPhoto,
      experienceYears,
      readingsCount,
      chargePerMin,
      languages: selectedLanguages,
      specialties: selectedSpecialties,
      city,
      state: stateName,
      isOnline,
      status: 'pending',
      onboardedAt: new Date().toISOString()
    };

    onComplete(profilePayload);
  };

  // Canvas star cascade effect on screen 13
  React.useEffect(() => {
    if (screen === 13) {
      const canvas = document.getElementById('stars-canvas') as HTMLCanvasElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = 350;

      const particles: any[] = [];
      const colors = ['#f59e0b', '#fbbf24', '#c084fc', '#818cf8', '#e2e8f0'];

      for (let i = 0; i < 75; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speed: Math.random() * 0.3 + 0.1,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: Math.random()
        });
      }

      let animationFrameId: number;

      function draw() {
        ctx!.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p) => {
          p.opacity += (Math.random() - 0.5) * 0.1;
          if (p.opacity < 0) p.opacity = 0;
          if (p.opacity > 1) p.opacity = 1;

          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx!.fillStyle = p.color;
          ctx!.globalAlpha = p.opacity;
          ctx!.fill();
        });
        animationFrameId = requestAnimationFrame(draw);
      }

      draw();
      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [screen]);

  // Screen progress calculations (1 to 12 are interactive inputs, 13 is completion)
  const progressPercent = Math.round(((screen - 1) / 12) * 100);

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#0f172a',
      border: '1px solid rgba(139, 92, 246, 0.25)',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
      position: 'relative',
      color: '#f1f5f9',
      textAlign: 'left'
    }}>
      {/* Cosmic starry Header */}
      {screen < 13 && (
        <div style={{
          backgroundColor: '#0a0f1d',
          borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={20} style={{ color: '#fbbf24', animation: 'spin 20s linear infinite' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Astrologer Onboarding &bull; Step {screen} of 12
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 200px', maxWidth: '300px' }}>
            <div style={{
              flex: 1,
              height: '6px',
              backgroundColor: '#1e293b',
              borderRadius: '9999px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#fbbf24',
                width: `${progressPercent}%`,
                borderRadius: '9999px',
                transition: 'width 0.4s ease-in-out'
              }} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fbbf24', minWidth: '35px', textAlign: 'right' }}>
              {progressPercent}%
            </span>
          </div>
        </div>
      )}

      {/* Screen Container with Slide Transition */}
      <div style={{
        padding: '32px 24px',
        minHeight: '420px',
        opacity: animating ? 0.3 : 1,
        transform: animating ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.25s, transform 0.25s',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        
        {/* =============================================================== */}
        {/* SCREEN 1: WELCOME SCREEN */}
        {/* =============================================================== */}
        {screen === 1 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #312e81 0%, #1e1b4b 100%)',
              border: '2px solid #fbbf24',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '4.5rem',
              boxShadow: '0 10px 25px rgba(245, 158, 11, 0.15)',
              animation: 'float 4s ease-in-out infinite'
            }}>
              🪐
            </div>
            
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fbbf24', marginBottom: '8px' }}>
              Mantra Puja Astrologer Portal
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#94a3b8', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Register your celestial lineage to offer birth-chart readings, Kundli matching, gemstone analysis, and remedial consultations directly to devotees.
            </p>
            
            <div style={{
              backgroundColor: 'rgba(30, 27, 75, 0.5)',
              border: '1.5px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '12px',
              padding: '16px',
              maxWidth: '460px',
              margin: '0 auto 32px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left'
            }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🛡️</span>
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600, margin: 0 }}>
                Build devotee trust instantly with verified credentials, live availability toggles, and direct online Dakshina consult payouts.
              </p>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 2: DISPLAY NAME */}
        {/* =============================================================== */}
        {screen === 2 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '3rem' }}>👤</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '8px' }}>
                What is your public name?
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Please enter your full name as you wish it to appear to devotees.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '440px', margin: '0 auto' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '6px' }}>Display Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Acharya Ramanand Shastri"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    backgroundColor: '#1e293b',
                    border: '1.5px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 700,
                    outline: 'none',
                    textAlign: 'center'
                  }}
                />
              </div>

              {/* Profile Card Live Preview */}
              <div style={{
                border: '1px dashed rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                textAlign: 'left'
              }}>
                <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Live Preview
                </span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                  borderRadius: '10px',
                  padding: '12px'
                }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(217, 119, 6, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid #fbbf24' }}>
                    🔮
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 850, color: '#fff', margin: 0 }}>
                      {showCustomTitleInput ? customTitle : spiritualTitle} {fullName || 'Ramanand Shastri'}
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                      <MapPin size={10} style={{ color: '#fbbf24' }} /> {city}, {stateName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 3: SPIRITUAL TITLE */}
        {/* =============================================================== */}
        {screen === 3 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '3rem' }}>🔮</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '8px' }}>
                Select your Astrological Title
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Choose the primary description of your lineage/methodology.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '540px', margin: '0 auto' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px'
              }}>
                {titleOptions.map((title) => {
                  const isSelected = title === 'Other' ? showCustomTitleInput : (spiritualTitle === title && !showCustomTitleInput);
                  return (
                    <button
                      key={title}
                      type="button"
                      onClick={() => {
                        if (title === 'Other') {
                           setShowCustomTitleInput(true);
                        } else {
                           setShowCustomTitleInput(false);
                           setSpiritualTitle(title);
                        }
                      }}
                      style={{
                        backgroundColor: isSelected ? 'rgba(217, 119, 6, 0.15)' : '#1e293b',
                        border: isSelected ? '2px solid #fbbf24' : '1px solid rgba(139, 92, 246, 0.15)',
                        borderRadius: '10px',
                        padding: '16px 12px',
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        color: isSelected ? '#fbbf24' : '#cbd5e1',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer'
                      }}
                    >
                      {title}
                    </button>
                  );
                })}
              </div>

              {showCustomTitleInput && (
                <div style={{ textAlign: 'left', animation: 'fadeIn 0.2s' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '6px' }}>Enter Custom Headline Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Nadi Astrologer, KP Scholar"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      backgroundColor: '#1e293b',
                      border: '1.5px solid #fbbf24',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 4: EXPERIENCE YEARS */}
        {/* =============================================================== */}
        {screen === 4 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '3rem' }}>⏳</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '8px' }}>
                How long have you offered readings?
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Select your years of active astrological practice.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                backgroundColor: '#1e293b',
                border: '1.5px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '16px',
                padding: '16px 24px',
                width: '100%',
                maxWidth: '300px'
              }}>
                <button
                  type="button"
                  onClick={() => setExperienceYears(prev => Math.max(1, prev - 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: '#fbbf24',
                    cursor: 'pointer'
                  }}
                >
                  -
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>
                    {experienceYears}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginTop: '4px' }}>
                    Years Active
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setExperienceYears(prev => Math.min(60, prev + 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: '#fbbf24',
                    cursor: 'pointer'
                  }}
                >
                  +
                </button>
              </div>

              <input
                type="range"
                min="1"
                max="50"
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  accentColor: '#fbbf24'
                }}
              />
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 5: READINGS COMPLETED */}
        {/* =============================================================== */}
        {screen === 5 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '3rem' }}>📜</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '8px' }}>
                Consultations completed so far
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Total approximate horoscopes or charts you have analyzed.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                backgroundColor: '#1e293b',
                border: '1.5px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '16px',
                padding: '16px 24px',
                width: '100%',
                maxWidth: '320px'
              }}>
                <button
                  type="button"
                  onClick={() => setReadingsCount(prev => Math.max(10, prev - 100))}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    fontSize: '1rem',
                    fontWeight: 900,
                    color: '#fbbf24',
                    cursor: 'pointer'
                  }}
                >
                  -100
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '2.25rem', fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>
                    {readingsCount}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginTop: '4px' }}>
                    Chart Consults
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setReadingsCount(prev => Math.min(100000, prev + 100))}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    fontSize: '1rem',
                    fontWeight: 900,
                    color: '#fbbf24',
                    cursor: 'pointer'
                  }}
                >
                  +100
                </button>
              </div>

              {/* Quick Presets row */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {[500, 1000, 2500, 5000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setReadingsCount(val)}
                    style={{
                      backgroundColor: readingsCount === val ? '#fbbf24' : '#1e293b',
                      color: readingsCount === val ? '#0f172a' : '#cbd5e1',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    {val}+
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 6: DAKSHINA RATE */}
        {/* =============================================================== */}
        {screen === 6 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Coins style={{ width: '48px', height: '48px', color: '#fbbf24', margin: '0 auto' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '12px' }}>
                Set your consultation charge
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Set your coin rate per minute for live chat consultation.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                backgroundColor: '#1e293b',
                border: '1.5px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '16px',
                padding: '16px 24px',
                width: '100%',
                maxWidth: '300px'
              }}>
                <button
                  type="button"
                  onClick={() => setChargePerMin(prev => Math.max(5, prev - 5))}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: '#fbbf24',
                    cursor: 'pointer'
                  }}
                >
                  -
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>
                    {chargePerMin}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginTop: '4px' }}>
                    Coins / Min
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setChargePerMin(prev => Math.min(250, prev + 5))}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: '#fbbf24',
                    cursor: 'pointer'
                  }}
                >
                  +
                </button>
              </div>

              <input
                type="range"
                min="5"
                max="150"
                value={chargePerMin}
                onChange={(e) => setChargePerMin(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  accentColor: '#fbbf24'
                }}
              />
              
              <div style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(30, 27, 75, 0.4)',
                border: '1px dashed rgba(139, 92, 246, 0.2)',
                borderRadius: '8px',
                fontSize: '0.78rem',
                color: '#cbd5e1',
                textAlign: 'center',
                maxWidth: '340px'
              }}>
                ℹ️ Devotees purchase coin bundles inside their app to request live astrology chat consults with you.
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 7: LANGUAGES */}
        {/* =============================================================== */}
        {screen === 7 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '3rem' }}>🗣️</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '8px' }}>
                Which languages do you speak?
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Select all the languages you can comfortably consult in.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxWidth: '550px', margin: '0 auto' }}>
              {availableLanguages.map((lang) => {
                const isSelected = selectedLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    style={{
                      backgroundColor: isSelected ? 'rgba(217, 119, 6, 0.2)' : '#1e293b',
                      border: isSelected ? '1.5px solid #fbbf24' : '1px solid rgba(139, 92, 246, 0.15)',
                      color: isSelected ? '#fbbf24' : '#94a3b8',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      padding: '10px 18px',
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {isSelected && <Check size={12} />}
                    <span>{lang}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 8: SPECIALTIES */}
        {/* =============================================================== */}
        {screen === 8 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '3rem' }}>🌌</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '8px' }}>
                Select your specialties
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Which branches of astrology do you practice?
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxWidth: '550px', margin: '0 auto' }}>
              {specialtyOptions.map((spec) => {
                const isSelected = selectedSpecialties.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialty(spec)}
                    style={{
                      backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.2)' : '#1e293b',
                      border: isSelected ? '1.5px solid #c084fc' : '1px solid rgba(139, 92, 246, 0.15)',
                      color: isSelected ? '#c084fc' : '#cbd5e1',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      padding: '10px 18px',
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {isSelected && <Check size={12} />}
                    <span>{spec}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 9: GEOGRAPHIC LOCATION */}
        {/* =============================================================== */}
        {screen === 9 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '3rem' }}>📍</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '8px' }}>
                Where are you based?
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Provide your city/state for location filters.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '440px', margin: '0 auto' }}>
              <button
                type="button"
                onClick={requestLocation}
                disabled={fetchingLocation}
                style={{
                  backgroundColor: '#fbbf24',
                  color: '#0f172a',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  padding: '14px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                }}
              >
                {fetchingLocation ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Locating...</span>
                  </>
                ) : (
                  <>
                    <MapPin size={18} />
                    <span>Detect Location via GPS</span>
                  </>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(139, 92, 246, 0.15)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Or manual input</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(139, 92, 246, 0.15)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'left' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '4px' }}>City *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => { setCity(e.target.value); setLocationSuccess(true); }}
                    style={{ width: '100%', padding: '12px 14px', backgroundColor: '#1e293b', border: '1.5px solid rgba(139, 92, 246, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '4px' }}>State *</label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => { setStateName(e.target.value); setLocationSuccess(true); }}
                    style={{ width: '100%', padding: '12px 14px', backgroundColor: '#1e293b', border: '1.5px solid rgba(139, 92, 246, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
              </div>

              {locationSuccess && (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  color: '#4ade80',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle size={14} />
                  <span>Linked Location: <strong>{city}, {stateName}</strong></span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 10: PROFILE PHOTO */}
        {/* =============================================================== */}
        {screen === 10 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '3rem' }}>📷</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '8px' }}>
                Add your profile photo
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Upload an official portrait photo to build devotee trust.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                {/* SVG Progress Circle */}
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
                  <circle cx="60" cy="60" r="54" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="4" fill="transparent" />
                  <circle cx="60" cy="60" r="54" stroke="#fbbf24" strokeWidth="4" fill="transparent"
                    strokeDasharray="339.29" strokeDashoffset={339.29 - (339.29 * (uploadingPhoto ? photoProgress : profilePhoto ? 100 : 0)) / 100}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.15s ease' }} />
                </svg>
                
                {/* Image container */}
                <div style={{
                  position: 'absolute',
                  top: '6px', left: '6px', right: '6px', bottom: '6px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid rgba(139, 92, 246, 0.2)'
                }}>
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : uploadingPhoto ? (
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fbbf24' }}>{photoProgress}%</span>
                  ) : (
                    <Camera size={32} style={{ color: '#94a3b8' }} />
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{
                  backgroundColor: '#1e293b',
                  border: '1.5px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Upload size={14} />
                  <span>Choose Photo File</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>

                {profilePhoto && (
                  <button
                    type="button"
                    onClick={() => setProfilePhoto('')}
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#fca5a5',
                      borderRadius: '8px',
                      padding: '10px 18px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Clear Photo
                  </button>
                )}
              </div>

              <div style={{ width: '100%', maxWidth: '360px' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px', textAlign: 'center' }}>
                  Or enter a direct photo web link:
                </span>
                <input
                  type="text"
                  placeholder="https://example.com/avatar.jpg"
                  value={profilePhoto}
                  onChange={(e) => setProfilePhoto(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#1e293b', border: '1.5px solid rgba(139, 92, 246, 0.2)', borderRadius: '8px', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 11: BIOGRAPHY */}
        {/* =============================================================== */}
        {screen === 11 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '3rem' }}>✍️</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '8px' }}>
                Tell devotees about your practice
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Describe your training background, system of analysis, and lineage.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
              {/* Template Suggestion Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px'
              }}>
                {[
                  { type: 'classical', label: '📜 Classical Horary' },
                  { type: 'modern', label: '🧭 KP Astrology' },
                  { type: 'remedial', label: '🔮 Dosha Remedies' }
                ].map((sug) => (
                  <button
                    key={sug.type}
                    type="button"
                    onClick={() => generateBio(sug.type)}
                    style={{
                      padding: '10px 8px',
                      backgroundColor: '#1e293b',
                      border: '1.5px solid rgba(139, 92, 246, 0.15)',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: '#cbd5e1',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#fbbf24'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.15)'}
                  >
                    {sug.label}
                  </button>
                ))}
              </div>

              {/* Text Area */}
              <div style={{ textAlign: 'left' }}>
                <textarea
                  placeholder="Describe your ancestral lineage, training, and spiritual approach to readings..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#1e293b',
                    border: '1.5px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.5
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginTop: '4px', textAlign: 'right' }}>
                  {bio.length} characters (Recommended 100+)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 12: PREVIEW PROFILE */}
        {/* =============================================================== */}
        {screen === 12 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '3rem' }}>🌟</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24', marginTop: '8px' }}>
                Review Cosmic Profile
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                This is how devotees will see your profile card inside the app.
              </p>
            </div>

            <div style={{
              maxWidth: '440px',
              margin: '0 auto',
              backgroundColor: '#0a0f1d',
              border: '2px solid #fbbf24',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 10px 25px rgba(245, 158, 11, 0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Mystic card border */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(to right, #fbbf24, #c084fc)' }} />

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: '2px solid #fbbf24',
                  overflow: 'hidden',
                  backgroundColor: '#1e293b',
                  flexShrink: 0
                }}>
                  <img
                    src={profilePhoto || `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(fullName)}`}
                    alt={fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                      {fullName || 'Acharya Ramanand Shastri'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: 'rgba(217, 119, 6, 0.15)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', color: '#fbbf24', fontWeight: 800 }}>
                      <Star size={10} style={{ fill: '#fbbf24', stroke: '#fbbf24' }} />
                      <span>4.8</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 800, margin: '2px 0 0 0' }}>
                    {spiritualTitle}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={10} style={{ color: '#fbbf24' }} /> {city}, {stateName}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '8px',
                margin: '16px 0',
                padding: '10px 0',
                borderTop: '1px solid rgba(139, 92, 246, 0.1)',
                borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
                textAlign: 'center'
              }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Experience</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>{experienceYears} Yrs</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Consults</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>{readingsCount}+</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Dakshina</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fbbf24' }}>{chargePerMin} coins/m</span>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Specialties</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedSpecialties.map(s => (
                    <span key={s} style={{ fontSize: '0.65rem', backgroundColor: 'rgba(192, 132, 252, 0.15)', border: '1px solid rgba(192, 132, 252, 0.3)', color: '#c084fc', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Languages</span>
                <p style={{ fontSize: '0.72rem', color: '#cbd5e1', margin: 0, fontWeight: 600 }}>
                  {selectedLanguages.join(', ')}
                </p>
              </div>

              <p style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: 0, fontStyle: 'italic', lineHeight: 1.4, borderTop: '1px solid rgba(139, 92, 246, 0.05)', paddingTop: '10px' }}>
                "{bio || `Professional consultation session with ${experienceYears} years of experience in birth charts.`}"
              </p>

              <div 
                onClick={() => setIsOnline(!isOnline)}
                style={{
                  marginTop: '16px',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: isOnline ? 'rgba(34, 197, 94, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                  color: isOnline ? '#4ade80' : '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  border: isOnline ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(100, 116, 139, 0.2)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                ● Current Status: {isOnline ? 'ONLINE / Accepting Devotee Chats (Click to Change)' : 'OFFLINE / Busy (Click to Change)'}
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 13: ONBOARDING FINALIZED */}
        {/* =============================================================== */}
        {screen === 13 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ position: 'relative', width: '100%', height: '180px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <canvas id="stars-canvas" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} />
              <div 
                className="blessing-compass" 
                onClick={() => setCosmicBlessingCount(prev => prev + 1)}
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #fef3c7 0%, #fcd34d 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  boxShadow: '0 0 30px rgba(245, 158, 11, 0.5)',
                  cursor: 'pointer',
                  zIndex: 2,
                  animation: 'pulse 2s infinite'
                }}
              >
                🔮
              </div>
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fbbf24', marginBottom: '8px' }}>
              Astrologer Registered!
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#94a3b8', maxWidth: '480px', margin: '0 auto 16px', lineHeight: 1.6 }}>
              Your celestial credentials have been linked. Devotees can now find you and request chat readings.
            </p>

            {cosmicBlessingCount > 0 && (
              <div style={{
                color: '#fbbf24',
                fontWeight: 800,
                fontSize: '0.85rem',
                margin: '10px auto',
                animation: 'bounce 0.5s'
              }}>
                ✨ Received {cosmicBlessingCount} Cosmic Blessings! ✨
              </div>
            )}

            <button
              onClick={handleFinalize}
              style={{
                backgroundColor: '#fbbf24',
                color: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 32px',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                marginTop: '16px'
              }}
            >
              Enter Astrologer Dashboard
            </button>
          </div>
        )}

        {/* Wizard Controls */}
        {screen < 13 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '32px',
            borderTop: '1px solid rgba(139, 92, 246, 0.1)',
            paddingTop: '20px'
          }}>
            {screen > 1 ? (
              <button
                type="button"
                onClick={prevScreen}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'transparent',
                  border: '1.5px solid rgba(148, 163, 184, 0.3)',
                  color: '#94a3b8',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <div />
            )}

            {screen < 12 ? (
              <button
                type="button"
                onClick={nextScreen}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#fbbf24',
                  border: 'none',
                  color: '#0f172a',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(245, 158, 11, 0.2)'
                }}
              >
                Next Step <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setScreen(13)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#fbbf24',
                  border: 'none',
                  color: '#0f172a',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}
              >
                Finish Setup <CheckCircle size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(245, 158, 11, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 45px rgba(245, 158, 11, 0.6); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};
