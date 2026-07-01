import React from 'react';
import { 
  MapPin, Check, Camera, Upload, ArrowLeft, ArrowRight, 
  CheckCircle, Search, RefreshCw, Star
} from 'lucide-react';

interface PunditOnboardingProps {
  loggedInUser: { id: string; fullName: string; email: string; phoneNumber: string };
  onComplete: (profileData: any) => void;
  onLogout: () => void;
}

export const PunditOnboarding: React.FC<PunditOnboardingProps> = ({
  loggedInUser,
  onComplete
}) => {
  const [screen, setScreen] = React.useState(1);
  const [animating, setAnimating] = React.useState(false);

  // Form Fields State
  const [fullName, setFullName] = React.useState(loggedInUser.fullName || '');
  const [spiritualTitle, setSpiritualTitle] = React.useState('Shastri');
  const [customTitle, setCustomTitle] = React.useState('');
  const [showCustomTitleInput, setShowCustomTitleInput] = React.useState(false);
  const [selectedLanguages, setSelectedLanguages] = React.useState<string[]>(['Hindi', 'Sanskrit']);
  const [gotra, setGotra] = React.useState('Bharadwaj');
  const [customGotra, setCustomGotra] = React.useState('');
  const [showCustomGotraInput, setShowCustomGotraInput] = React.useState(false);
  const [experienceYears, setExperienceYears] = React.useState(15);
  const [serviceModes, setServiceModes] = React.useState<string[]>(['Temple', 'Home Visits']);
  const [templeName, setTempleName] = React.useState('');
  const [serviceArea, setServiceArea] = React.useState('');
  const [specialties, setSpecialties] = React.useState<string[]>(['🔥 Havan', '🏡 Griha Pravesh', '🕉 Rudrabhishek']);
  const [profilePhoto, setProfilePhoto] = React.useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [photoProgress, setPhotoProgress] = React.useState(0);
  const [bio, setBio] = React.useState('');
  const [geoState, setGeoState] = React.useState({
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    latitude: 25.3176,
    longitude: 82.9739,
    loading: false,
    success: true
  });
  
  // Verification Docs
  const [docs, setDocs] = React.useState<Record<string, { name: string; url?: string }>>({});
  const [uploadingDoc, setUploadingDoc] = React.useState<string | null>(null);
  
  // Search state for Gotra
  const [gotraSearch, setGotraSearch] = React.useState('');
  const [showGotraDropdown, setShowGotraDropdown] = React.useState(false);

  // Success screen bells states
  const [bellRings, setBellRings] = React.useState(0);

  // Language & Specialties Constants
  const availableLanguages = [
    'Hindi', 'Sanskrit', 'English', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Punjabi'
  ];

  const gotraOptions = [
    'Bharadwaj', 'Kashyap', 'Vashishtha', 'Gautam', 'Atri', 'Agastya', 'Vatsa', 'Angirasa', 'Vishwamitra', 'Not listed?'
  ];

  const specialtyOptions = [
    { name: '🔥 Havan', desc: 'Sacred fire rituals' },
    { name: '🏡 Griha Pravesh', desc: 'House warming prayers' },
    { name: '🕉 Rudrabhishek', desc: 'Shiva invocation rituals' },
    { name: '💰 Lakshmi Puja', desc: 'Wealth & prosperity prayers' },
    { name: '🪔 Satyanarayan Katha', desc: 'Auspicious storytelling' },
    { name: '🏠 Vastu Shanti', desc: 'Home energy harmonizing' },
    { name: '🌞 Navgraha Puja', desc: 'Planetary peace ritual' },
    { name: '💍 Vivah Sanskar', desc: 'Sacred wedding rituals' }
  ];

  // Geolocation trigger
  const requestLocation = () => {
    setGeoState(prev => ({ ...prev, loading: true, success: false }));
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      setGeoState(prev => ({ ...prev, loading: false }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Fetch reverse geocoding from OpenStreetMap Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`);
          const data = await res.json();
          const address = data.address || {};
          const city = address.city || address.town || address.village || address.suburb || 'New Delhi';
          const state = address.state || 'Delhi';
          
          setGeoState({
            city,
            state,
            latitude,
            longitude,
            loading: false,
            success: true
          });
        } catch (err) {
          console.error(err);
          // Fallback to defaults but with fetched coords
          setGeoState({
            city: 'Mumbai',
            state: 'Maharashtra',
            latitude,
            longitude,
            loading: false,
            success: true
          });
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not automatically determine location. Please enter details manually.');
        setGeoState(prev => ({ ...prev, loading: false }));
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Profile image simulator
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setPhotoProgress(0);

    // Read local file as base64 for preview
    const reader = new FileReader();
    reader.onload = () => {
      const interval = setInterval(() => {
        setPhotoProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setUploadingPhoto(false);
            setProfilePhoto(reader.result as string);
            return 100;
          }
          return prev + 20;
        });
      }, 150);
    };
    reader.readAsDataURL(file);
  };

  // Mock document uploader
  const handleDocUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(key);
    setTimeout(() => {
      setDocs(prev => ({
        ...prev,
        [key]: { name: file.name, url: '#' }
      }));
      setUploadingDoc(null);
    }, 1500);
  };

  // Toggle multi-selects
  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleSpecialty = (spec: string) => {
    setSpecialties(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const toggleServiceMode = (mode: string) => {
    setServiceModes(prev => 
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  // Bio template autofiller
  const generateBio = (promptType: string) => {
    const titleString = showCustomTitleInput ? customTitle : spiritualTitle;
    const gotraString = showCustomGotraInput ? customGotra : gotra;
    const specialtiesList = specialties.map(s => s.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim()).join(', ');
    
    let templateText = '';
    if (promptType === 'gurukul') {
      templateText = `Trained in traditional Gurukul scriptures, specializing in Shukla Yajurveda rituals. As a ${titleString} of ${gotraString} Gotra, I have spent ${experienceYears} years conducting ${specialtiesList || 'Vedic Pujas'} across India with accurate Vedic pronunciation and purity.`;
    } else if (promptType === 'practice') {
      templateText = `Blessed with ${experienceYears} years of practice in offering authentic spiritual counseling and conducting holy rituals. Specialist in ${specialtiesList || 'Havans & Graha Pravesh'} according to Vedic Sanatan traditions. Dedicated to bringing positive vibrations and divine peace.`;
    } else if (promptType === 'journey') {
      templateText = `My spiritual journey began in search of spreading Vedic wisdom. For ${experienceYears} years, I have been conducting Vedic Pujas and rituals such as ${specialtiesList || 'Rudrabhishek and Lakshmi Puja'} under traditional guidelines. I ensure complete devotion and guidance for every devotee.`;
    } else if (promptType === 'rituals') {
      templateText = `Focusing on custom family-oriented rituals, Griha Pravesh, and Vastu Shanti. Performing pujas in ${selectedLanguages.join(', ')} with detailed explanations of Sankalpa, Mantras, and Yajnas. Experience of ${experienceYears} years as an active priest.`;
    }
    setBio(templateText);
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

  // Final Registration Save
  const handleFinalize = async () => {
    const finalTitle = showCustomTitleInput ? customTitle : spiritualTitle;
    const finalGotra = showCustomGotraInput ? customGotra : gotra;
    
    const profilePayload = {
      fullName,
      spiritualTitle: finalTitle,
      languages: selectedLanguages,
      gotra: finalGotra,
      experience: experienceYears,
      location: {
        city: geoState.city,
        state: geoState.state,
        latitude: geoState.latitude,
        longitude: geoState.longitude
      },
      serviceModes,
      templeName: serviceModes.includes('Temple') ? templeName : '',
      serviceArea: serviceModes.includes('Home Visits') ? serviceArea : '',
      ritualExpertise: specialties,
      profilePhoto: profilePhoto || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + encodeURIComponent(fullName),
      bio: bio || `Vedic priest with ${experienceYears} years of experience in conducting sacred rituals.`,
      verificationUploaded: Object.keys(docs).length > 0,
      verifiedBadge: Object.keys(docs).length > 0 ? 'Verified Pandit' : 'Registered Partner',
      onboardedAt: new Date().toISOString()
    };

    onComplete(profilePayload);
  };

  // Canvas confetti effect
  React.useEffect(() => {
    if (screen === 14) {
      const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = 350;

      const colors = ['#f97316', '#ea580c', '#eab308', '#22c55e', '#3b82f6'];
      const particles: any[] = [];

      for (let i = 0; i < 100; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          r: Math.random() * 5 + 3,
          d: Math.random() * canvas.height,
          color: colors[Math.floor(Math.random() * colors.length)],
          tilt: Math.random() * 10 - 5,
          tiltAngleIncremental: Math.random() * 0.07 + 0.02,
          tiltAngle: 0
        });
      }

      let animationFrameId: number;

      function draw() {
        ctx!.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((p) => {
          p.tiltAngle += p.tiltAngleIncremental;
          p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
          p.x += Math.sin(p.tiltAngle);
          p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 5;

          ctx!.beginPath();
          ctx!.lineWidth = p.r;
          ctx!.strokeStyle = p.color;
          ctx!.moveTo(p.x + p.tilt + p.r / 2, p.y);
          ctx!.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
          ctx!.stroke();

          if (p.y > canvas.height) {
            p.x = Math.random() * canvas.width;
            p.y = -20;
          }
        });

        animationFrameId = requestAnimationFrame(draw);
      }

      draw();
      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [screen]);

  // Screen Progress Percentages
  const progressPercent = Math.round(((screen - 1) / 13) * 100);

  // Render Functions
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Top Progress Bar */}
      {screen < 14 && (
        <div style={{
          backgroundColor: '#fafafa',
          borderBottom: '1px solid #e5e7eb',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>🕉️</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2d140e' }}>
              Shastri Onboarding &bull; Step {screen} of 13
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 200px', maxWidth: '300px' }}>
            <div style={{
              flex: 1,
              height: '6px',
              backgroundColor: '#e5e7eb',
              borderRadius: '9999px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#f97316',
                width: `${progressPercent}%`,
                borderRadius: '9999px',
                transition: 'width 0.4s ease-in-out'
              }} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f97316', minWidth: '35px', textAlign: 'right' }}>
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
        {/* SCREEN 1: WELCOME */}
        {/* =============================================================== */}
        {screen === 1 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div className="bounce-avatar" style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #ffedd5 0%, #ffdbb5 100%)',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '4.5rem',
              boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.2)'
            }}>
              🙏
            </div>
            
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#2d140e', marginBottom: '8px' }}>
              Welcome to MantraPuja
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#6b7280', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Join thousands of verified Vedic priests and offer your ritual services, customized homas, and consultations directly to devotees across India.
            </p>
            
            <div style={{
              backgroundColor: '#fff7ed',
              border: '1.5px solid #ffedd5',
              borderRadius: '12px',
              padding: '16px',
              maxWidth: '440px',
              margin: '0 auto 32px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left'
            }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🛡️</span>
              <p style={{ fontSize: '0.82rem', color: '#7c2d12', fontWeight: 600, margin: 0 }}>
                Build devotee trust instantly with verified Shastri badges, flexible ritual scheduling, and direct Dakshina payments.
              </p>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 2: LOCATION */}
        {/* =============================================================== */}
        {screen === 2 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '3rem' }}>📍</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d140e', marginTop: '8px' }}>
                Where do you conduct your rituals?
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Devotees lookup priests near their city or temple area.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '440px', margin: '0 auto 20px' }}>
              <button
                onClick={requestLocation}
                disabled={geoState.loading}
                style={{
                  backgroundColor: '#f97316',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  padding: '14px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'opacity 0.2s',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)'
                }}
              >
                {geoState.loading ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Fetching GPS Location...</span>
                  </>
                ) : (
                  <>
                    <MapPin size={18} />
                    <span>Allow Location Access (Recommended)</span>
                  </>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Or manual input</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'left' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 850, color: '#4b5563', textTransform: 'uppercase', marginBottom: '4px' }}>City *</label>
                  <input
                    type="text"
                    value={geoState.city}
                    onChange={(e) => setGeoState(prev => ({ ...prev, city: e.target.value, success: true }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 850, color: '#4b5563', textTransform: 'uppercase', marginBottom: '4px' }}>State *</label>
                  <input
                    type="text"
                    value={geoState.state}
                    onChange={(e) => setGeoState(prev => ({ ...prev, state: e.target.value, success: true }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>
              </div>

              {geoState.success && (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle size={14} style={{ color: '#22c55e' }} />
                  <span>
                    Location Linked: <strong>{geoState.city}, {geoState.state}</strong> (Lat: {geoState.latitude.toFixed(4)}, Lng: {geoState.longitude.toFixed(4)})
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 3: NAME INPUT */}
        {/* =============================================================== */}
        {screen === 3 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '3rem' }}>👤</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d140e', marginTop: '8px' }}>
                What should devotees call you?
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Please enter your full name as you wish it to appear on certificates.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '440px', margin: '0 auto' }}>
              <div style={{ textAlign: 'left' }}>
                <label htmlFor="pundit-fullname" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 850, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Full Name *</label>
                <input
                  id="pundit-fullname"
                  type="text"
                  placeholder="e.g. Acharya Rajesh Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    outline: 'none',
                    textAlign: 'center'
                  }}
                />
              </div>

              {/* Profile Card Live Preview */}
              <div style={{
                border: '1px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '16px',
                backgroundColor: '#fafafa',
                textAlign: 'left'
              }}>
                <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Live Preview
                </span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '12px'
                }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                    🕉️
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#2d140e', margin: 0 }}>
                      {showCustomTitleInput ? customTitle : spiritualTitle} {fullName || 'Rajesh Sharma'}
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                      <MapPin size={10} /> {geoState.city}, {geoState.state}
                    </span>
                  </div>
                </div>
                <span style={{ display: 'block', fontSize: '0.68rem', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
                  💡 This is how devotees will find you in searches.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 4: SPIRITUAL TITLE */}
        {/* =============================================================== */}
        {screen === 4 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '3rem' }}>🌟</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d140e', marginTop: '8px' }}>
                Select your Spiritual Title
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Choose the title that best describes your position.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px'
              }}>
                {['Acharya', 'Shastri', 'Guru Ji', 'Swami', 'Pandit Ji', 'Other'].map((title) => {
                  const isSelected = title === 'Other' ? showCustomTitleInput : (spiritualTitle === title && !showCustomTitleInput);
                  return (
                    <button
                      key={title}
                      onClick={() => {
                        if (title === 'Other') {
                          setShowCustomTitleInput(true);
                        } else {
                          setShowCustomTitleInput(false);
                          setSpiritualTitle(title);
                        }
                      }}
                      style={{
                        backgroundColor: isSelected ? '#fff7ed' : '#ffffff',
                        border: isSelected ? '2px solid #f97316' : '1px solid #e5e7eb',
                        borderRadius: '10px',
                        padding: '16px 12px',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        color: isSelected ? '#f97316' : '#374151',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 4px 6px -1px rgba(249, 115, 22, 0.1)' : 'none'
                      }}
                    >
                      {title}
                    </button>
                  );
                })}
              </div>

              {showCustomTitleInput && (
                <div style={{ textAlign: 'left', animation: 'fadeIn 0.2s' }}>
                  <label htmlFor="pundit-customtitle" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Enter Custom Title *</label>
                  <input
                    id="pundit-customtitle"
                    type="text"
                    placeholder="e.g. Mahant, Pujari"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1.5px solid #f97316',
                      borderRadius: '8px',
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
        {/* SCREEN 5: LANGUAGES */}
        {/* =============================================================== */}
        {screen === 5 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '3rem' }}>🗣️</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d140e', marginTop: '8px' }}>
                Which languages can you perform pujas in?
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                You can select multiple options.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxWidth: '550px', margin: '0 auto' }}>
              {availableLanguages.map((lang) => {
                const isSelected = selectedLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    style={{
                      backgroundColor: isSelected ? '#ffedd5' : '#ffffff',
                      border: isSelected ? '1.5px solid #f97316' : '1px solid #cbd5e1',
                      color: isSelected ? '#ea580c' : '#4b5563',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      padding: '10px 18px',
                      borderRadius: '9999px',
                      transition: 'all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
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
        {/* SCREEN 6: GOTRA */}
        {/* =============================================================== */}
        {screen === 6 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '3rem' }}>🧬</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d140e', marginTop: '8px' }}>
                What is your Gotra?
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Select your Gotra from the list or enter manually.
              </p>
            </div>

            <div style={{ position: 'relative', maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search Gotra..."
                  value={gotraSearch}
                  onFocus={() => setShowGotraDropdown(true)}
                  onChange={(e) => {
                    setGotraSearch(e.target.value);
                    setShowGotraDropdown(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 36px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>

              {showGotraDropdown && (
                <div style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  textAlign: 'left',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}>
                  {gotraOptions
                    .filter(opt => opt.toLowerCase().includes(gotraSearch.toLowerCase()))
                    .map((opt) => (
                      <div
                        key={opt}
                        onClick={() => {
                          if (opt === 'Not listed?') {
                            setShowCustomGotraInput(true);
                          } else {
                            setShowCustomGotraInput(false);
                            setGotra(opt);
                          }
                          setGotraSearch(opt);
                          setShowGotraDropdown(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 650,
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: gotra === opt && !showCustomGotraInput ? '#fff7ed' : '#ffffff'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = gotra === opt && !showCustomGotraInput ? '#fff7ed' : '#ffffff'}
                      >
                        {opt}
                      </div>
                    ))}
                </div>
              )}

              {showCustomGotraInput && (
                <div style={{ textAlign: 'left', animation: 'fadeIn 0.2s' }}>
                  <label htmlFor="pundit-customgotra" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Enter Manual Gotra *</label>
                  <input
                    id="pundit-customgotra"
                    type="text"
                    placeholder="e.g. Kashyap, Shandilya"
                    value={customGotra}
                    onChange={(e) => setCustomGotra(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1.5px solid #f97316',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              )}

              <div style={{
                padding: '10px 14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#475569',
                textAlign: 'center',
                fontWeight: 700
              }}>
                Selected Gotra: <strong style={{ color: '#ea580c' }}>{showCustomGotraInput ? (customGotra || 'Not Entered') : gotra}</strong>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 7: EXPERIENCE */}
        {/* =============================================================== */}
        {screen === 7 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '3rem' }}>📜</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d140e', marginTop: '8px' }}>
                How long have you been performing rituals?
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Select your years of Vedic ritual practice.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              {/* Wheel dial picker simulation */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                backgroundColor: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '16px',
                padding: '16px 24px',
                width: '100%',
                maxWidth: '300px'
              }}>
                <button
                  onClick={() => setExperienceYears(prev => Math.max(1, prev - 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: '#6b7280'
                  }}
                >
                  -
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '3rem',
                    fontWeight: 900,
                    color: '#f97316',
                    lineHeight: 1,
                    animation: 'scaleUp 0.15s ease'
                  }}>
                    {experienceYears}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginTop: '4px' }}>
                    Years Practice
                  </span>
                </div>

                <button
                  onClick={() => setExperienceYears(prev => Math.min(60, prev + 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: '#6b7280'
                  }}
                >
                  +
                </button>
              </div>

              {/* Slider helper */}
              <input
                type="range"
                min="1"
                max="50"
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  accentColor: '#f97316'
                }}
              />
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 8: SERVICE MODES */}
        {/* =============================================================== */}
        {screen === 8 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '3rem' }}>🏛️</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d140e', marginTop: '8px' }}>
                Where do you conduct your rituals?
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Select all service modes that you offer to devotees.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px', margin: '0 auto' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px'
              }}>
                {[
                  { key: 'Temple', label: '🏛 Temple', desc: 'Rituals at your local/base temple' },
                  { key: 'Home Visits', label: '🏠 Home Visits', desc: 'Travel to devotee home/office' },
                  { key: 'Online', label: '💻 Online', desc: 'Perform via Zoom/video call' }
                ].map((mode) => {
                  const isSelected = serviceModes.includes(mode.key);
                  return (
                    <button
                      key={mode.key}
                      onClick={() => toggleServiceMode(mode.key)}
                      style={{
                        backgroundColor: isSelected ? '#fff7ed' : '#ffffff',
                        border: isSelected ? '2px solid #f97316' : '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '16px 12px',
                        textAlign: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: isSelected ? '#f97316' : '#1f2937', margin: '0 0 4px 0' }}>
                        {mode.label}
                      </h4>
                      <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0 }}>
                        {mode.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {serviceModes.includes('Temple') && (
                <div style={{ textAlign: 'left', animation: 'slideUp 0.2s' }}>
                  <label htmlFor="pundit-templename" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Temple Name *</label>
                  <input
                    id="pundit-templename"
                    type="text"
                    placeholder="e.g. Kashi Vishwanath Temple, Shiv Mandir"
                    value={templeName}
                    onChange={(e) => setTempleName(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
              )}

              {serviceModes.includes('Home Visits') && (
                <div style={{ textAlign: 'left', animation: 'slideUp 0.2s' }}>
                  <label htmlFor="pundit-servicearea" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Service Area / District *</label>
                  <input
                    id="pundit-servicearea"
                    type="text"
                    placeholder="e.g. South Delhi, Western Suburbs Mumbai"
                    value={serviceArea}
                    onChange={(e) => setServiceArea(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 9: SPECIALTIES */}
        {/* =============================================================== */}
        {screen === 9 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '3rem' }}>🔥</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d140e', marginTop: '8px' }}>
                Select your specialties
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Which Vedic pujas and rituals are you most expert in?
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '550px', margin: '0 auto' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '10px'
              }}>
                {specialtyOptions.map((opt) => {
                  const isSelected = specialties.includes(opt.name);
                  return (
                    <button
                      key={opt.name}
                      onClick={() => toggleSpecialty(opt.name)}
                      style={{
                        backgroundColor: isSelected ? '#fff7ed' : '#ffffff',
                        border: isSelected ? '1.8px solid #f97316' : '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '12px 10px',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                    >
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: isSelected ? '#f97316' : '#1f2937' }}>
                        {opt.name}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div style={{
                padding: '8px 16px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                fontSize: '0.78rem',
                color: '#1e40af',
                fontWeight: 700,
                textAlign: 'center'
              }}>
                📊 Selected {specialties.length} Specialties
              </div>
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
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d140e', marginTop: '8px' }}>
                Add your profile photo
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Upload a clear portrait photo in traditional attire.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                {/* SVG Progress Circle */}
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
                  <circle cx="60" cy="60" r="54" stroke="#e5e7eb" strokeWidth="5" fill="transparent" />
                  <circle cx="60" cy="60" r="54" stroke="#f97316" strokeWidth="5" fill="transparent"
                    strokeDasharray="339.29" strokeDashoffset={339.29 - (339.29 * (uploadingPhoto ? photoProgress : profilePhoto ? 100 : 0)) / 100}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.15s ease' }} />
                </svg>
                
                {/* Image / Icon container */}
                <div style={{
                  position: 'absolute',
                  top: '6px', left: '6px', right: '6px', bottom: '6px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #cbd5e1'
                }}>
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : uploadingPhoto ? (
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f97316' }}>{photoProgress}%</span>
                  ) : (
                    <Camera size={32} style={{ color: '#94a3b8' }} />
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 750,
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Upload size={14} />
                  <span>Choose Image</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>

                {profilePhoto && (
                  <button
                    onClick={() => setProfilePhoto('')}
                    style={{
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fee2e2',
                      color: '#dc2626',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '0.82rem',
                      fontWeight: 750
                    }}
                  >
                    Clear Photo
                  </button>
                )}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                Supported formats: JPG, PNG. Max size 2MB.
              </span>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 11: BIO */}
        {/* =============================================================== */}
        {screen === 11 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '3rem' }}>✍️</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d140e', marginTop: '8px' }}>
                Tell devotees about yourself
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Click a template card below to automatically pre-fill your bio statement!
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
                  { type: 'gurukul', label: '🎓 Gurukul Training' },
                  { type: 'practice', label: '🕉️ Years of Practice' },
                  { type: 'journey', label: '⛵ Spiritual Journey' },
                  { type: 'rituals', label: '📜 Specialized Pujas' }
                ].map((sug) => (
                  <button
                    key={sug.type}
                    onClick={() => generateBio(sug.type)}
                    style={{
                      padding: '10px 8px',
                      backgroundColor: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#475569',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f97316'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                  >
                    {sug.label}
                  </button>
                ))}
              </div>

              {/* Text Area */}
              <div style={{ textAlign: 'left' }}>
                <textarea
                  placeholder="Tell devotees about your lineage, training, and spiritual approach..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '0.88rem',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.5
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'block', marginTop: '4px', textAlign: 'right' }}>
                  {bio.length} characters (Recommended 100+)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 12: VERIFICATION */}
        {/* =============================================================== */}
        {screen === 12 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '3rem' }}>🛡️</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d140e', marginTop: '8px' }}>
                Help devotees trust your profile
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Upload verification documents to receive the "Verified Pandit" badge. (Optional initially)
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '480px', margin: '0 auto' }}>
              {[
                { key: 'aadhaar', label: 'National ID (Aadhaar / Passport)' },
                { key: 'certificate', label: 'Priest/Gurukul Certificate' },
                { key: 'templeAuth', label: 'Temple Authorization / Letter' }
              ].map((doc) => {
                const isUploaded = !!docs[doc.key];
                return (
                  <div
                    key={doc.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#ffffff',
                      border: '1px solid ' + (isUploaded ? '#bbf7d0' : '#cbd5e1'),
                      borderRadius: '10px',
                      padding: '12px 16px',
                      textAlign: 'left'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1f2937', margin: 0 }}>{doc.label}</h4>
                      <span style={{ fontSize: '0.72rem', color: isUploaded ? '#166534' : '#6b7280', display: 'block', marginTop: '2px' }}>
                        {isUploaded ? `✅ ${docs[doc.key].name}` : 'Not uploaded yet'}
                      </span>
                    </div>

                    <label style={{
                      backgroundColor: isUploaded ? '#f0fdf4' : '#f1f5f9',
                      border: '1px solid ' + (isUploaded ? '#22c55e' : '#cbd5e1'),
                      color: isUploaded ? '#166534' : '#475569',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {uploadingDoc === doc.key ? (
                        <>
                          <RefreshCw size={12} className="spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={12} />
                          <span>{isUploaded ? 'Re-upload' : 'Upload File'}</span>
                        </>
                      )}
                      <input
                        type="file"
                        onChange={(e) => handleDocUpload(doc.key, e)}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 13: PREVIEW PROFILE CARD */}
        {/* =============================================================== */}
        {screen === 13 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '3rem' }}>👁️</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d140e', marginTop: '8px' }}>
                Profile Preview
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                This is exactly how devotees will view your card in search results.
              </p>
            </div>

            {/* High fidelity Preview Card */}
            <div style={{
              maxWidth: '420px',
              margin: '0 auto',
              borderRadius: '16px',
              border: '2px solid #ffedd5',
              boxShadow: '0 10px 25px -5px rgba(249, 115, 22, 0.1)',
              backgroundColor: '#ffffff',
              overflow: 'hidden',
              textAlign: 'left'
            }}>
              {/* Header Gradient */}
              <div style={{
                background: 'linear-gradient(135deg, #2d140e 0%, #451a03 100%)',
                padding: '20px',
                position: 'relative',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '2.5px solid #f97316',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  flexShrink: 0
                }}>
                  <img
                    src={profilePhoto || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + encodeURIComponent(fullName)}
                    alt="Pandit avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      backgroundColor: '#ffedd5',
                      color: '#c2410c',
                      fontSize: '0.62rem',
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      textTransform: 'uppercase'
                    }}>
                      {showCustomTitleInput ? customTitle : spiritualTitle}
                    </span>
                    
                    {Object.keys(docs).length > 0 && (
                      <span style={{
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        fontSize: '0.62rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <Star size={8} fill="currentColor" /> Verified
                      </span>
                    )}
                  </div>
                  
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '4px 0 0 0', color: '#ffffff' }}>
                    {fullName || 'Acharya Rajesh Sharma'}
                  </h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
                    <MapPin size={11} style={{ color: '#f97316' }} />
                    <span>{geoState.city}, {geoState.state}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ backgroundColor: '#fafafa', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', display: 'block' }}>Gotra</span>
                    <strong style={{ fontSize: '0.85rem', color: '#2d140e' }}>
                      {showCustomGotraInput ? (customGotra || 'Not Set') : gotra}
                    </strong>
                  </div>
                  <div style={{ backgroundColor: '#fafafa', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', display: 'block' }}>Experience</span>
                    <strong style={{ fontSize: '0.85rem', color: '#2d140e' }}>
                      {experienceYears} Years Vedic Practice
                    </strong>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Languages</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedLanguages.map(l => (
                      <span key={l} style={{ fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px' }}>
                        {l}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Specialty Pujas</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {specialties.map(s => (
                      <span key={s} style={{ fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5', padding: '3px 8px', borderRadius: '6px' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Profile Biography</span>
                  <p style={{ fontSize: '0.78rem', color: '#4b5563', lineHeight: 1.5, margin: 0 }}>
                    {bio || `Performing traditional Vedic rituals with dedicated devotion and scriptural purity.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* SCREEN 14: SUCCESS */}
        {/* =============================================================== */}
        {screen === 14 && (
          <div style={{ textAlign: 'center', padding: '20px 0', position: 'relative' }}>
            <canvas id="confetti-canvas" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />
            
            {/* Swinging Temple Bell Vector Illustration */}
            <div style={{ position: 'relative', zIndex: 2, marginBottom: '24px' }}>
              <div 
                className="temple-bell" 
                onClick={() => setBellRings(prev => prev + 1)}
                style={{
                  fontSize: '5rem',
                  display: 'inline-block',
                  cursor: 'pointer',
                  userSelect: 'none',
                  animation: 'bellSwing 1.8s ease-in-out infinite alternate',
                  transformOrigin: 'top center'
                }}
              >
                🔔
              </div>
              {bellRings > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  border: '2px solid #f97316',
                  animation: 'ripple 0.8s ease-out forwards',
                  pointerEvents: 'none',
                  width: '10px', height: '10px'
                }} />
              )}
            </div>

            <div style={{ position: 'relative', zIndex: 2 }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2d140e', marginBottom: '8px' }}>
                Registration Complete!
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#6b7280', maxWidth: '440px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                Your auspicious profile has been logged and is currently being reviewed by MantraPuja admin team. You can now access your bookings.
              </p>
              
              <div style={{
                fontSize: '0.78rem',
                color: '#7c2d12',
                backgroundColor: '#fff7ed',
                border: '1px solid #ffedd5',
                borderRadius: '8px',
                padding: '10px 16px',
                display: 'inline-block',
                fontWeight: 750,
                marginBottom: '32px'
              }}>
                🔔 Ring the temple bell to receive virtual blessings! (Clicked {bellRings} times)
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM ACTION BUTTONS */}
        <div style={{
          display: 'flex',
          justifyContent: screen === 1 ? 'flex-end' : 'space-between',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '24px',
          marginTop: '32px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {screen > 1 && screen < 14 && (
            <button
              onClick={prevScreen}
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#475569',
                borderRadius: '8px',
                padding: '10px 20px',
                fontWeight: 750,
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          )}

          {screen === 1 ? (
            <button
              onClick={nextScreen}
              style={{
                backgroundColor: '#f97316',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)'
              }}
            >
              <span>Begin Registration</span>
              <ArrowRight size={16} />
            </button>
          ) : screen === 13 ? (
            <button
              onClick={nextScreen}
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 28px',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)'
              }}
            >
              <span>Looks Good!</span>
              <CheckCircle size={16} />
            </button>
          ) : screen === 14 ? (
            <button
              onClick={handleFinalize}
              style={{
                backgroundColor: '#2d140e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 32px',
                fontWeight: 800,
                fontSize: '0.95rem',
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(45, 20, 14, 0.25)'
              }}
            >
              <span>Go to Dashboard</span>
              <CheckCircle size={16} />
            </button>
          ) : (
            <button
              onClick={nextScreen}
              disabled={
                (screen === 2 && !geoState.success) ||
                (screen === 3 && !fullName.trim()) ||
                (screen === 4 && showCustomTitleInput && !customTitle.trim()) ||
                (screen === 6 && showCustomGotraInput && !customGotra.trim())
              }
              style={{
                backgroundColor: '#f97316',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)',
                cursor: ((screen === 2 && !geoState.success) || (screen === 3 && !fullName.trim())) ? 'not-allowed' : 'pointer',
                opacity: ((screen === 2 && !geoState.success) || (screen === 3 && !fullName.trim())) ? 0.5 : 1
              }}
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Embedded CSS Animations */}
      <style>{`
        @keyframes bellSwing {
          0% { transform: rotate(-10deg); }
          100% { transform: rotate(10deg); }
        }
        @keyframes ripple {
          0% { width: 10px; height: 10px; opacity: 1; }
          100% { width: 120px; height: 120px; opacity: 0; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.85); opacity: 0.5; }
          to { transform: scale(1); opacity: 1; }
        }
        .spin {
          animation: spin 1.2s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .bounce-avatar {
          animation: avatarBounce 1.5s infinite ease-in-out alternate;
        }
        @keyframes avatarBounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};
