import React from 'react';
import {
  BarChart3,
  Package,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  CheckCircle,
  Truck,
  X,
  User,
  Sparkles,
  Settings,
  Layout,
  Upload,
  CreditCard
} from 'lucide-react';
import type { Product, PoojaProduct, LocalOrder } from '../types';
import { supabase } from '../lib/supabase';
import { encryptText, decryptText } from '../lib/crypto';
import { ProductCard } from './ProductCard';
import { ProductDetailPage } from './ProductDetailPage';
import { uploadToR2 } from '../lib/cloudflare/r2';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';

interface AdminPanelPageProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: LocalOrder[];
  setOrders: React.Dispatch<React.SetStateAction<LocalOrder[]>>;
  onNavigateToHome: () => void;
  onNavigateToShop: () => void;
  onLogout?: () => void;
  adminSession?: { username: string; loginTime: string } | null;
}

type Tab = 'analytics' | 'products' | 'orders' | 'settings' | 'pooja_products' | 'homepage_editor' | 'shop_banners';

export const AdminPanelPage: React.FC<AdminPanelPageProps> = ({
  products,
  setProducts,
  orders,
  setOrders,
  onNavigateToHome,
  onNavigateToShop,
  onLogout,
  adminSession,
}) => {
  const [activeTab, setActiveTab] = React.useState<Tab>('analytics');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All');

  // WhatsApp settings state
  const [whatsappEndpoint, setWhatsappEndpoint] = React.useState('');
  const [whatsappToken, setWhatsappToken] = React.useState('');
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(false);
  const [isSavingSettings, setIsSavingSettings] = React.useState(false);

  // Razorpay settings state
  const [razorpayKeyId, setRazorpayKeyId] = React.useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = React.useState('');
  const [isSavingRazorpay, setIsSavingRazorpay] = React.useState(false);
  // Homepage Customizer settings state
  const [featuredTitle, setFeaturedTitle] = React.useState('Our Featured Collection');
  const [featuredSubtitle, setFeaturedSubtitle] = React.useState('Get 30% off when you purchase our featured bundle');
  const [featuredProductIds, setFeaturedProductIds] = React.useState<string[]>([]);

  const [saleTitle, setSaleTitle] = React.useState('Exceptional Discounts up to 30%');
  const [saleSubtitle, setSaleSubtitle] = React.useState('EXCLUSIVE OFFERS WEEK');
  const [saleDiscount, setSaleDiscount] = React.useState(30);
  const [saleProductIds, setSaleProductIds] = React.useState<string[]>([]);

  const [newArrivalsTitle, setNewArrivalsTitle] = React.useState('Discover Our New Arrivals');
  const [newArrivalsSubtitle, setNewArrivalsSubtitle] = React.useState('Discover More');
  const [newArrivalsProductIds, setNewArrivalsProductIds] = React.useState<string[]>([]);

  const [bannerImages, setBannerImages] = React.useState<string[]>([]);
  const [showcaseImage, setShowcaseImage] = React.useState<string>('');
  const [isUploadingBanner, setIsUploadingBanner] = React.useState(false);
  const [isUploadingShowcase, setIsUploadingShowcase] = React.useState(false);
  const [activePreviewSlide, setActivePreviewSlide] = React.useState(0);

  const [isLoadingHomepage, setIsLoadingHomepage] = React.useState(false);
  const [isSavingHomepage, setIsSavingHomepage] = React.useState(false);
  const [homepageSearchQuery, setHomepageSearchQuery] = React.useState('');

  // Shop Banners state
  const shopCategories = [
    'Rudraksha', 'Bracelet', 'Murti', 'Yantras', 'Anklet', 'Frames', 'Rashi',
    'Karungali', 'Jadi', 'Pyrite', 'Kavach', 'Siddh Range', 'Gemstones',
    'Pyramid', 'Necklaces/Mala', 'Tower & Tumbles', 'Crystal Dome Trees',
    'Women Bracelets', 'Evil Eye', 'Gifting'
  ];
  const [shopMainBanners, setShopMainBanners] = React.useState<string[]>([]);
  const [shopCategoryBanners, setShopCategoryBanners] = React.useState<Record<string, string[]>>({});
  const [isUploadingShopMain, setIsUploadingShopMain] = React.useState(false);
  const [isUploadingShopCategory, setIsUploadingShopCategory] = React.useState<Record<string, boolean>>({});
  const [isSavingShopBanners, setIsSavingShopBanners] = React.useState(false);
  const [isLoadingShopBanners, setIsLoadingShopBanners] = React.useState(false);
  const [shopBannerPreviewSlide, setShopBannerPreviewSlide] = React.useState(0);

  React.useEffect(() => {
    async function loadHomepageSettings() {
      setIsLoadingHomepage(true);
      try {
        const { data } = await supabase
          .from('website_settings')
          .select('value')
          .eq('key', 'homepage_settings')
          .single();
        
        if (data && data.value) {
          const val = data.value;
          setFeaturedTitle(val.featuredTitle || 'Our Featured Collection');
          setFeaturedSubtitle(val.featuredSubtitle || 'Get 30% off when you purchase our featured bundle');
          setFeaturedProductIds(val.featuredProductIds || []);

          setSaleTitle(val.saleTitle || 'Exceptional Discounts up to 30%');
          setSaleSubtitle(val.saleSubtitle || 'EXCLUSIVE OFFERS WEEK');
          setSaleDiscount(val.saleDiscount ?? 30);
          setSaleProductIds(val.saleProductIds || []);

          setNewArrivalsTitle(val.newArrivalsTitle || 'Discover Our New Arrivals');
          setNewArrivalsSubtitle(val.newArrivalsSubtitle || 'Discover More');
          setNewArrivalsProductIds(val.newArrivalsProductIds || []);

          setBannerImages(val.bannerImages || []);
          setShowcaseImage(val.showcaseImage || '');
        } else {
          if (products && products.length > 0) {
            setFeaturedProductIds(products.slice(0, 4).map(p => p.id));
            setSaleProductIds(products.slice(4, 7).map(p => p.id));
            setNewArrivalsProductIds(products.slice(7, 10).map(p => p.id));
          }
        }
      } catch (err) {
        console.error('Error fetching homepage settings:', err);
      } finally {
        setIsLoadingHomepage(false);
      }
    }

    if (activeTab === 'homepage_editor') {
      loadHomepageSettings();
      loadShopBannersSettings();
    }
    if (activeTab === 'shop_banners') {
      loadShopBannersSettings();
    }
  }, [activeTab, products]);

  const handleSaveHomepageSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHomepage(true);
    try {
      const { error } = await supabase
        .from('website_settings')
        .upsert({
          key: 'homepage_settings',
          value: {
            featuredTitle,
            featuredSubtitle,
            featuredProductIds,
            saleTitle,
            saleSubtitle,
            saleDiscount,
            saleProductIds,
            newArrivalsTitle,
            newArrivalsSubtitle,
            newArrivalsProductIds,
            bannerImages,
            showcaseImage
          }
        });
      if (error) throw error;
      triggerToast('Homepage curation settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save homepage settings: ' + (err as Error).message);
    } finally {
      setIsSavingHomepage(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const cdnUrl = await uploadToR2(file, 'homepage/banners');
      setBannerImages(prev => [...prev, cdnUrl]);
      triggerToast('Banner slide uploaded successfully!');
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + (err as Error).message);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleRemoveBanner = (index: number) => {
    setBannerImages(prev => prev.filter((_, idx) => idx !== index));
    triggerToast('Banner slide removed. Remember to save changes.');
  };

  const handleShowcaseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingShowcase(true);
    try {
      const cdnUrl = await uploadToR2(file, 'homepage/showcase');
      setShowcaseImage(cdnUrl);
      triggerToast('Showcase image uploaded successfully!');
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + (err as Error).message);
    } finally {
      setIsUploadingShowcase(false);
    }
  };

  const handleRemoveShowcase = () => {
    setShowcaseImage('');
    triggerToast('Showcase image cleared. Remember to save changes.');
  };

  // ---- Shop Banners: load, save, upload, remove handlers ----
  const loadShopBannersSettings = async () => {
    setIsLoadingShopBanners(true);
    try {
      const { data } = await supabase
        .from('website_settings')
        .select('value')
        .eq('key', 'shop_banners_settings')
        .single();
      if (data && data.value) {
        setShopMainBanners(data.value.mainBanners || []);
        setShopCategoryBanners(data.value.categoryBanners || {});
      }
    } catch (err) {
      console.error('Error loading shop banners:', err);
    } finally {
      setIsLoadingShopBanners(false);
    }
  };

  const handleSaveShopBanners = async () => {
    setIsSavingShopBanners(true);
    try {
      const { error } = await supabase
        .from('website_settings')
        .upsert({
          key: 'shop_banners_settings',
          value: {
            mainBanners: shopMainBanners,
            categoryBanners: shopCategoryBanners,
          }
        });
      if (error) throw error;
      triggerToast('Shop banners saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save shop banners: ' + (err as Error).message);
    } finally {
      setIsSavingShopBanners(false);
    }
  };

  const handleShopMainBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingShopMain(true);
    try {
      const cdnUrl = await uploadToR2(file, 'shop/main-banners');
      setShopMainBanners(prev => [...prev, cdnUrl]);
      triggerToast('Main shop banner uploaded successfully!');
    } catch (err) {
      alert('Upload failed: ' + (err as Error).message);
    } finally {
      setIsUploadingShopMain(false);
      e.target.value = '';
    }
  };

  const handleShopMainBannerRemove = (index: number) => {
    setShopMainBanners(prev => prev.filter((_, i) => i !== index));
    triggerToast('Main banner removed. Remember to save.');
  };

  const handleCategoryBannerUpload = async (category: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingShopCategory(prev => ({ ...prev, [category]: true }));
    try {
      const folderKey = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const cdnUrl = await uploadToR2(file, `shop/category-banners/${folderKey}`);
      setShopCategoryBanners(prev => ({
        ...prev,
        [category]: [...(prev[category] || []), cdnUrl]
      }));
      triggerToast(`${category} category banner uploaded!`);
    } catch (err) {
      alert('Upload failed: ' + (err as Error).message);
    } finally {
      setIsUploadingShopCategory(prev => ({ ...prev, [category]: false }));
      e.target.value = '';
    }
  };

  const handleCategoryBannerRemove = (category: string, index: number) => {
    setShopCategoryBanners(prev => ({
      ...prev,
      [category]: (prev[category] || []).filter((_, i) => i !== index)
    }));
    triggerToast(`${category} banner removed. Remember to save.`);
  };

  React.useEffect(() => {
    async function loadSettings() {
      setIsLoadingSettings(true);
      try {
        // 1. Fetch WhatsApp settings
        const { data: waData } = await supabase
          .from('website_settings')
          .select('value')
          .eq('key', 'whatsapp_settings')
          .single();
        
        if (waData && waData.value) {
          const val = waData.value as { endpoint?: string; token?: string };
          setWhatsappEndpoint(val.endpoint || '');
          if (val.token) {
            try {
              const decrypted = await decryptText(val.token, import.meta.env.ENCRYPTION_STRING_KEY || 'sg6XisTlL2QcXSuE');
              setWhatsappToken(decrypted);
            } catch (decErr) {
              console.error('Failed to decrypt WhatsApp token:', decErr);
              setWhatsappToken('');
            }
          }
        }

        // 2. Fetch Razorpay settings
        const { data: rzData } = await supabase
          .from('website_settings')
          .select('value')
          .eq('key', 'razorpay_settings')
          .single();
        
        if (rzData && rzData.value) {
          const val = rzData.value as { keyId?: string; keySecret?: string };
          setRazorpayKeyId(val.keyId || '');
          if (val.keySecret) {
            try {
              const decrypted = await decryptText(val.keySecret, import.meta.env.ENCRYPTION_STRING_KEY || 'sg6XisTlL2QcXSuE');
              setRazorpayKeySecret(decrypted);
            } catch (decErr) {
              console.error('Failed to decrypt Razorpay key secret:', decErr);
              setRazorpayKeySecret('');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setIsLoadingSettings(false);
      }
    }

    if (activeTab === 'settings') {
      loadSettings();
    }
  }, [activeTab]);

  const handleSaveWhatsappSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappEndpoint || !whatsappToken) {
      alert('Please fill out both Endpoint and Token.');
      return;
    }
    setIsSavingSettings(true);
    try {
      const encrypted = await encryptText(whatsappToken, import.meta.env.ENCRYPTION_STRING_KEY || 'sg6XisTlL2QcXSuE');
      const { error } = await supabase
        .from('website_settings')
        .upsert({
          key: 'whatsapp_settings',
          value: {
            endpoint: whatsappEndpoint,
            token: encrypted
          }
        });
      if (error) throw error;
      triggerToast('WhatsApp configurations stored & encrypted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings: ' + (err as Error).message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveRazorpaySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razorpayKeyId || !razorpayKeySecret) {
      alert('Please fill out both Razorpay Key ID and Key Secret.');
      return;
    }
    setIsSavingRazorpay(true);
    try {
      const encryptedSecret = await encryptText(razorpayKeySecret, import.meta.env.ENCRYPTION_STRING_KEY || 'sg6XisTlL2QcXSuE');
      const { error } = await supabase
        .from('website_settings')
        .upsert({
          key: 'razorpay_settings',
          value: {
            keyId: razorpayKeyId,
            keySecret: encryptedSecret
          }
        });
      if (error) throw error;
      triggerToast('Razorpay API credentials saved and encrypted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save Razorpay settings: ' + (err as Error).message);
    } finally {
      setIsSavingRazorpay(false);
    }
  };

  // Pooja Products State
  const [poojaProducts, setPoojaProducts] = React.useState<PoojaProduct[]>([]);
  const [isLoadingPooja, setIsLoadingPooja] = React.useState(false);
  const [editingPoojaProduct, setEditingPoojaProduct] = React.useState<Partial<PoojaProduct> | null>(null);
  const [isNewPoojaProduct, setIsNewPoojaProduct] = React.useState(false);
  const [isSavingPooja, setIsSavingPooja] = React.useState(false);
  const [showTemplatesDropdown, setShowTemplatesDropdown] = React.useState(false);
  const [selectedPoojaIds, setSelectedPoojaIds] = React.useState<Record<string, boolean>>({});
  const [isBulkPublishing, setIsBulkPublishing] = React.useState(false);

  const handleBulkPublishPooja = async () => {
    const idsToPublish = Object.keys(selectedPoojaIds).filter(id => selectedPoojaIds[id]);
    if (idsToPublish.length === 0) {
      alert('Please select at least one Pooja product draft to publish.');
      return;
    }

    if (window.confirm(`Are you sure you want to publish the ${idsToPublish.length} selected Pooja product drafts to the live website?`)) {
      setIsBulkPublishing(true);
      try {
        const { error } = await supabase
          .from('website_pooja_products')
          .update({ is_published: true, published_at: new Date().toISOString() })
          .in('id', idsToPublish);

        if (error) throw error;

        triggerToast(`Successfully published ${idsToPublish.length} Pooja products to live website!`);
        setSelectedPoojaIds({});
        loadPoojaProducts();
      } catch (err) {
        console.error(err);
        alert('Failed to publish: ' + (err as Error).message);
      } finally {
        setIsBulkPublishing(false);
      }
    }
  };

  const poojaTemplates: Array<Partial<PoojaProduct> & { id: string }> = [
    {
      id: 'template-mrityunjaya',
      name: 'Maha Mrityunjaya Havan',
      sanskritName: 'महामृत्युंजय हवन यज्ञ',
      shortName: 'Mrityunjaya Havan',
      slug: 'maha-mrityunjaya-havan',
      category: 'Siddh Range',
      subtitle: 'Divine protective chanting & sacred fire offerings',
      shortDescription: 'Sacred Vedic fire ritual for profound healing, longevity, and health alignment.',
      description: 'The Maha Mrityunjaya ritual is one of the most powerful Vedic ceremonies. Performed by elite Banaras Acharyas, it invokes Lord Shiva\'s rejuvenating energy to dissolve chronic obstacles, restore physical vitality, and secure a protective shield for the performer\'s entire family.',
      spiritualSignificance: 'According to ancient Upanishadic scriptures, the Maha Mrityunjaya mantra represents the conquering of cosmic fears and physical decay, restoring energetic flow to the performer.',
      bookingInstructions: '1. Enter the full name, Gotra, and Nakshatra of the performer.\n2. Sit facing East during the live stream session.\n3. Keep a copper plate and fresh flowers near you for Sankalpa.',
      duration: '3 Hours',
      templeAssociation: 'Mahamrityunjay Temple, Varanasi',
      whoShouldPerform: 'Individuals seeking health rejuvenation, chronic obstacle removal, and longevity.',
      ritualsIncluded: [
        { name: 'Ganesh Ambika Pujan', description: 'Initial invocation for obstacle removal.', duration: '20 mins' },
        { name: 'Shiva Linga Abhishek', description: 'Aromatic milk and honey offering to the Shiva Linga.', duration: '40 mins' },
        { name: 'Maha Mrityunjaya Mantra Jaap (11000 chants)', description: 'Chanting for positive cell healing.', duration: '90 mins' },
        { name: 'Purnahuti Havan', description: 'Sacred offerings into the holy fire.', duration: '30 mins' }
      ],
      samagriList: [
        { name: 'Ganga Jal (Purified Ganges Water)', quantity: '1 Bottle', description: 'Holy water for home purification.' },
        { name: 'Maha Mrityunjaya Herbs Blend', quantity: '250g', description: 'Sacred organic herbs for fire offerings.' },
        { name: 'Sacred Bilva Leaves', quantity: '108 Pcs', description: 'Offerings to Shiva Linga.' },
        { name: 'Premium Cow Ghee', quantity: '500ml', description: 'Pure clarified butter.' }
      ],
      priestDetails: {
        name: 'Acharya Somnath Shastri',
        experience: '18+ Years',
        bio: 'Specialist in Vedic Rigveda rituals, holding a Doctorate in Sanskrit Scriptures from Banaras Hindu University.',
        qualification: 'Veda Acharya'
      },
      idealOccasions: ['Maha Shivratri', 'Pradosham', 'Savan Mondays'],
      offers: ['Energized Shiva Protection Kavach', 'Blessed Bhasma (Sacred Ash)', 'Live Video Calling Link'],
      badges: ['100% Vedic', 'Banaras Certified'],
      faqs: [
        { question: 'Can I attend the puja remotely?', answer: 'Yes, a live secure video broadcast is provided, and the priest will take your Sankalpa by reciting your name and Nakshatra.' },
        { question: 'What do I get in the Prasad box?', answer: 'An energized Shiva Kavach pendant, pure Varanasi Bhasma, Dry fruits prasad, and sacred Kalava string.' }
      ],
      isFeatured: true,
      isTrending: true,
      inStock: true,
      isPublished: true,
      price: 351,
      originalPrice: 499,
      rating: 4.9,
      reviewsCount: 28,
      image: '🕉️',
      galleryImages: [],
      certificates: [
        { url: '📜', name: 'Vedic Purity & Authenticity Seal', issuer: 'Varanasi Sanskrit Parishad' }
      ]
    },
    {
      id: 'template-kanakdhara',
      name: 'Kanakdhara Lakshmi Havan',
      sanskritName: 'कनकधारा लक्ष्मी पूजन',
      shortName: 'Kanakdhara Havan',
      slug: 'kanakdhara-lakshmi-havan',
      category: 'Yantras',
      subtitle: 'Adi Shankaracharya\'s sacred hymns for luxury and fortune',
      shortDescription: 'Auspicious gold-showering ritual for financial prosperity, business growth, and abundance.',
      description: 'Kanakdhara is a celebrated Vedic worship designed to remove financial constraints. By chanting the 18 golden verses of Adi Shankaracharya and making honey-drenched offerings to Goddess Lakshmi, this puja unlocks stagnant fortunes, stabilizes business earnings, and fills the home with material abundance.',
      spiritualSignificance: 'Kanakdhara translates to \'shower of gold.\' It traces back to Adi Shankaracharya invoking Goddess Lakshmi to rain golden amlas for a poor household, aligning the home with wealth consciousness.',
      bookingInstructions: '1. Share your business name and family details.\n2. Keep your safe locker or ledger book open during worship.\n3. Recite Kanakdhara Stotram along with the priest if possible.',
      duration: '2.5 Hours',
      templeAssociation: 'Mahalakshmi Temple, Kolhapur',
      whoShouldPerform: 'Business owners, entrepreneurs, and families experiencing financial blockages.',
      ritualsIncluded: [
        { name: 'Gauri Ganesh Puja', description: 'Seeking blessings for initial auspiciousness.', duration: '15 mins' },
        { name: 'Kanakdhara Stotram Chanting (18 times)', description: 'Chanting Adi Shankaracharya\'s powerful wealth hymns.', duration: '60 mins' },
        { name: 'Lotus Seed Havan', description: 'Lotus seed and honey offerings to the sacrificial fire.', duration: '45 mins' },
        { name: 'Lakshmi Aarti & Archana', description: 'Devotional offering of camphor and deep.', duration: '30 mins' }
      ],
      samagriList: [
        { name: 'Premium Lotus Seeds (Kamalgatta)', quantity: '108 Pcs', description: 'Offerings to attract Lakshmi energy.' },
        { name: 'Organic Saffron & Honey', quantity: '50g', description: 'Sacred sweet offerings for Havan.' },
        { name: 'Energized Kanakdhara Yantra', quantity: '1 Unit', description: 'Copper yantra for wealth stability.' },
        { name: 'Yellow Mustard Seeds', quantity: '100g', description: 'For protection and prosperity.' }
      ],
      priestDetails: {
        name: 'Acharya Vidyadhar Dwivedi',
        experience: '14 Years',
        bio: 'Expert scholar from Shri Jagannath Sanskrit Vishvavidyalaya specializing in Lakshmi rituals.',
        qualification: 'Jyotish & Karma Kanda Shastri'
      },
      idealOccasions: ['Diwali', 'Dhanteras', 'Akshaya Tritiya', 'Fridays'],
      offers: ['Energized 24k Gold Plated Kanakdhara Yantra', 'Maha Prasad Box', 'Digital Puja Recording'],
      badges: ['Prosperity Special', 'Top-Rated'],
      faqs: [
        { question: 'Where should I keep the Kanakdhara Yantra?', answer: 'Keep it in your home temple, cash box, or office locker facing East.' },
        { question: 'Is business presence required?', answer: 'No, the priest will invoke your business name during the Sankalpa process.' }
      ],
      isFeatured: true,
      isTrending: false,
      inStock: true,
      isPublished: true,
      price: 251,
      originalPrice: 399,
      rating: 4.8,
      reviewsCount: 19,
      image: '💰',
      galleryImages: [],
      certificates: [
        { url: '📜', name: 'Sri Chakra Purity Guarantee', issuer: 'Shankaracharya Vedic Parishad' }
      ]
    },
    {
      id: 'template-satyanarayan',
      name: 'Satyanarayan Katha & Havan',
      sanskritName: 'सत्यनारायण व्रत कथा',
      shortName: 'Satyanarayan Katha',
      slug: 'satyanarayan-katha-havan',
      category: 'Frames',
      subtitle: 'Divine narrations and offering to Lord Vishnu',
      shortDescription: 'Sacred monthly worship for domestic peace, happy relationships, and general well-being.',
      description: 'Performing the Satyanarayan Puja invites peace, harmony, and positivity into your living space. The ceremony features the recitation of the five chapters of Sri Satyanarayan Vrat Katha, invoking Lord Vishnu to cleanse negative family energies, bless new ventures, and promote domestic stability.',
      spiritualSignificance: 'Mentioned in the Skanda Purana, this worship represents devotion to Satya (Truth) as the ultimate manifestation of Lord Vishnu, blessing the home with peaceful relations.',
      bookingInstructions: '1. Prepare a clean wooden platform (chowki) in your home.\n2. Arrange seasonal fruits, coconut, and fresh flowers.\n3. The Acharya will connect online to recite the holy Katha chapters.',
      duration: '2 Hours',
      templeAssociation: 'Badrinath Temple, Uttarakhand',
      whoShouldPerform: 'Families moving into new houses, newly married couples, or those seeking monthly peace.',
      ritualsIncluded: [
        { name: 'Panchadev Sthapana & Puja', description: 'Installing and invoking main deities.', duration: '30 mins' },
        { name: 'Satyanarayan Katha Recitation', description: 'Five chapters narrating Satyanarayan benefits.', duration: '60 mins' },
        { name: 'Vishnu Sahasranama Chanting', description: 'Reciting 1000 names of Lord Vishnu.', duration: '30 mins' },
        { name: 'Havan & Prasad Distribution', description: 'Offering wheat Panjiri and final fire arati.', duration: '20 mins' }
      ],
      samagriList: [
        { name: 'Sacred Tulsi Leaves', quantity: '51 Leaves', description: 'Deity\'s favorite herbal offering.' },
        { name: 'Chana Dal & Haldi Powder', quantity: '100g each', description: 'Auspicious yellow color elements.' },
        { name: 'Natural Sandalwood Paste', quantity: '50g', description: 'Fragrant paste for deity decoration.' },
        { name: 'Wheat Flour Prasad (Panjiri)', quantity: '250g', description: 'Traditional Satyanarayan roasted offering.' }
      ],
      priestDetails: {
        name: 'Pandit Ramakant Joshi',
        experience: '12 Years',
        bio: 'A traditional Uttarakhand Pandit specializing in Vishnu Stotras and monthly household vrat ceremonies.',
        qualification: 'Karma Kanda Acharya'
      },
      idealOccasions: ['Purnima (Full Moon Days)', 'Housewarming (Griha Pravesh)', 'Marriages'],
      offers: ['Blessed Satyanarayan Teakwood Frame', 'Pure Tulsi Mala', 'Holy Ganga Jal'],
      badges: ['Family Classic', 'Housewarming Ideal'],
      faqs: [
        { question: 'Can I perform this on any day?', answer: 'While Purnima is highly auspicious, it can be performed on any day to bring harmony.' }
      ],
      isFeatured: false,
      isTrending: true,
      inStock: true,
      isPublished: true,
      price: 151,
      originalPrice: 251,
      rating: 4.9,
      reviewsCount: 34,
      image: '🕉️',
      galleryImages: [],
      certificates: [
        { url: '📜', name: 'Badrinath Prasad Purity Seal', issuer: 'Himalayan Pujas Board' }
      ]
    }
  ];

  const initialPoojaProduct: Partial<PoojaProduct> = {
    name: 'Sacred Maha Pooja',
    sanskritName: 'महा पूजा विधि',
    shortName: 'Maha Pooja',
    slug: '',
    category: 'Rudraksha',
    subtitle: 'Energized Vedic worship for prosperity and health',
    shortDescription: 'Perform this premium blessed ritual to invoke positive cosmic vibrations.',
    description: 'This sacred ritual is performed by experienced Vedic priests under strict guidelines. It clears obstacles and brings divine harmony to your household.',
    spiritualSignificance: 'According to the ancient scriptures, performing this ritual alignment cleanses negative energies and invokes divine blessings.',
    bookingInstructions: '1. Enter the full name and Nakshatra of the performer.\n2. Keep a copper vessel with fresh water ready.\n3. The priest will call you at the scheduled time to take Sankalpa.',
    duration: '2 Hours',
    templeAssociation: 'Kashi Vishwanath Temple, Varanasi',
    whoShouldPerform: 'Families seeking spiritual growth and obstacle clearance',
    ritualsIncluded: [
      { name: 'Ganesh Sthapana & Puja', description: 'Invoking Lord Ganesha to remove obstacles.', duration: '15 Mins' },
      { name: 'Mantra Jaap & Archana', description: 'Chanting divine mantras with offerings of flowers.', duration: '45 Mins' }
    ],
    samagriList: [
      { name: 'Gangajal', quantity: '1 Bottle', description: 'Holy water for purification.' },
      { name: 'Vedic Herbs (Havan Samagri)', quantity: '100g', description: 'For sacred fire offerings.' }
    ],
    priestDetails: {
      name: 'Acharya Rajesh Shastri',
      experience: '15+ Years',
      bio: 'Highly trained scholar from Banaras Hindu University specializing in Rigveda rituals.',
      qualification: 'Vedic Acharya'
    },
    idealOccasions: ['Shivratri', 'Pradosham'],
    offers: ['Free energized Prasad box', 'Live stream access link'],
    badges: ['Vedic Blessed', 'Top-Rated'],
    faqs: [
      { question: 'Will I get the Prasad?', answer: 'Yes, the energized Prasad will be shipped directly to your delivery address.' },
      { question: 'Can I attend the puja online?', answer: 'Yes, a secure video calling link is provided for remote attendees.' }
    ],
    isFeatured: false,
    isTrending: false,
    inStock: true,
    isPublished: false,
    price: 151,
    originalPrice: 251,
    rating: 4.9,
    reviewsCount: 12,
    image: '🕉️',
    galleryImages: [],
    certificates: [
      { url: '📜', name: 'Devotional Purity Seal', issuer: 'Kashi Vedic Sansthan' }
    ]
  };

  const loadPoojaProducts = async () => {
    setIsLoadingPooja(true);
    try {
      const { data, error } = await supabase
        .from('website_pooja_products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        const mappedData: PoojaProduct[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          originalPrice: item.original_price,
          rating: item.rating,
          reviewsCount: item.reviews_count,
          image: item.image,
          category: item.category,
          inStock: item.in_stock,
          benefits: item.benefits || [],
          popularity: item.popularity || 80,
          spiritualType: item.spiritual_type || 'Rituals',
          sanskritName: item.sanskrit_name,
          shortName: item.short_name,
          slug: item.slug,
          subtitle: item.subtitle,
          shortDescription: item.short_description,
          spiritualSignificance: item.spiritual_significance,
          material: item.material,
          weight: item.weight,
          dimensions: item.dimensions,
          origin: item.origin,
          customIcons: item.custom_icons || {},
          ritualsIncluded: item.rituals_included,
          samagriList: item.samagri_list,
          priestDetails: item.priest_details,
          duration: item.duration,
          idealOccasions: item.ideal_occasions || [],
          templeAssociation: item.temple_association,
          whoShouldPerform: item.who_should_perform,
          offers: item.offers || [],
          badges: item.badges || [],
          testimonials: item.testimonials || [],
          faqs: item.faqs,
          bookingInstructions: item.booking_instructions,
          ctaLabels: item.cta_labels || { primary: '', secondary: '' },
          seoTitle: item.seo_title,
          seoDescription: item.seo_description,
          canonicalUrl: item.canonical_url,
          ogData: item.og_data || { title: '', description: '', image: '' },
          schemaMarkup: item.schema_markup || {},
          imageAlt: item.image_alt,
          imageCaption: item.image_caption,
          isFeatured: item.is_featured || false,
          isTrending: item.is_trending || false,
          recommendationLogic: item.recommendation_logic,
          relatedProducts: item.related_products,
          videoUrl: item.video_url,
          translations: item.translations || {},
          uiLabels: item.ui_labels || {},
          publishedAt: item.published_at,
          isPublished: item.is_published || false,
          bannerImage: item.banner_image,
          galleryImages: item.gallery_images || [],
          ritualImages: item.ritual_images || [],
          priestImage: item.priest_image,
          certificates: item.certificates,
          iconImage: item.icon_image,
          promoCreatives: item.promo_creatives || [],
        }));
        setPoojaProducts(mappedData);
      }
    } catch (err) {
      console.error('Error fetching pooja products:', err);
    } finally {
      setIsLoadingPooja(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'pooja_products') {
      loadPoojaProducts();
    }
  }, [activeTab]);

  const updatePoojaField = (field: keyof PoojaProduct, value: any) => {
    setEditingPoojaProduct(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const updatePoojaFields = (fields: Partial<PoojaProduct>) => {
    setEditingPoojaProduct(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...fields
      };
    });
  };


  const handleSavePoojaProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPoojaProduct) return;
    if (!editingPoojaProduct.name || !editingPoojaProduct.price) {
      alert('Name and Price are required fields.');
      return;
    }

    setIsSavingPooja(true);
    try {
      const slugVal = editingPoojaProduct.slug || editingPoojaProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const idVal = editingPoojaProduct.id || `pooja-${Date.now()}`;
      
      const dbPayload = {
        id: idVal,
        name: editingPoojaProduct.name,
        sanskrit_name: editingPoojaProduct.sanskritName || null,
        short_name: editingPoojaProduct.shortName || null,
        slug: slugVal,
        category: editingPoojaProduct.category || 'Rudraksha',
        subtitle: editingPoojaProduct.subtitle || null,
        short_description: editingPoojaProduct.shortDescription || null,
        description: editingPoojaProduct.description || '',
        spiritual_significance: editingPoojaProduct.spiritualSignificance || null,
        material: editingPoojaProduct.material || null,
        weight: editingPoojaProduct.weight || null,
        dimensions: editingPoojaProduct.dimensions || null,
        origin: editingPoojaProduct.origin || null,
        custom_icons: (editingPoojaProduct as any).customIcons || {},
        booking_instructions: editingPoojaProduct.bookingInstructions || null,
        duration: editingPoojaProduct.duration || null,
        temple_association: editingPoojaProduct.templeAssociation || null,
        who_should_perform: editingPoojaProduct.whoShouldPerform || null,
        
        rituals_included: editingPoojaProduct.ritualsIncluded,
        samagri_list: editingPoojaProduct.samagriList,
        priest_details: editingPoojaProduct.priestDetails,
        testimonials: editingPoojaProduct.testimonials || [],
        faqs: editingPoojaProduct.faqs,
        cta_labels: editingPoojaProduct.ctaLabels || { primary: 'Book Now', secondary: 'Learn More' },
        og_data: editingPoojaProduct.ogData || { title: '', description: '', image: '' },
        schema_markup: editingPoojaProduct.schemaMarkup || {},
        
        tags: editingPoojaProduct.idealOccasions || [],
        benefits: editingPoojaProduct.benefits || [],
        ideal_occasions: editingPoojaProduct.idealOccasions || [],
        offers: editingPoojaProduct.offers || [],
        badges: editingPoojaProduct.badges || [],
        
        image: editingPoojaProduct.image || '📿',
        banner_image: editingPoojaProduct.bannerImage || null,
        gallery_images: editingPoojaProduct.galleryImages || [],
        ritual_images: editingPoojaProduct.ritualImages || [],
        priest_image: editingPoojaProduct.priestImage || null,
        certificates: editingPoojaProduct.certificates,
        icon_image: editingPoojaProduct.iconImage || null,
        promo_creatives: editingPoojaProduct.promoCreatives || [],
        related_products: editingPoojaProduct.relatedProducts || null,
        
        price: parseFloat(editingPoojaProduct.price.toString()),
        original_price: editingPoojaProduct.originalPrice ? parseFloat(editingPoojaProduct.originalPrice.toString()) : null,
        rating: editingPoojaProduct.rating || 4.8,
        reviews_count: editingPoojaProduct.reviewsCount || 1,
        is_featured: editingPoojaProduct.isFeatured || false,
        is_trending: editingPoojaProduct.isTrending || false,
        in_stock: editingPoojaProduct.inStock ?? true,
        is_published: editingPoojaProduct.isPublished || false,
        published_at: editingPoojaProduct.publishedAt || null
      };

      if (isNewPoojaProduct) {
        const insertPayload = { ...dbPayload } as any;
        delete insertPayload.id; // Let database auto-generate a valid UUID
        const { error } = await supabase
          .from('website_pooja_products')
          .insert([insertPayload]);
        if (error) throw error;
        triggerToast('New Pooja product inserted successfully!');
      } else {
        const { error } = await supabase
          .from('website_pooja_products')
          .update(dbPayload)
          .eq('id', editingPoojaProduct.id);
        if (error) throw error;
        triggerToast('Pooja product details updated successfully!');
      }

      setEditingPoojaProduct(null);
      loadPoojaProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to save pooja product: ' + (err as Error).message);
    } finally {
      setIsSavingPooja(false);
    }
  };

  const handleDeletePoojaProduct = async (id: string, name: string) => {
    if (window.confirm(`Are you absolutely sure you want to delete the Pooja Product "${name}"?`)) {
      try {
        const { error } = await supabase
          .from('website_pooja_products')
          .delete()
          .eq('id', id);
        if (error) throw error;
        triggerToast('Pooja product deleted successfully.');
        loadPoojaProducts();
      } catch (err) {
        console.error(err);
        alert('Failed to delete: ' + (err as Error).message);
      }
    }
  };

  // Modals state
  const [showAddProductModal, setShowAddProductModal] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = React.useState<LocalOrder | null>(null);

  // Success Feedback Toast
  const [toastMsg, setToastMsg] = React.useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Product Form state
  const [productForm, setProductForm] = React.useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    image: '📿',
    category: 'Rudraksha',
    spiritualType: 'Rituals' as Product['spiritualType'],
    benefitsInput: '',
    inStock: true,
  });

  const categories = [
    'Rudraksha',
    'Bracelet',
    'Murti',
    'Yantras',
    'Anklet',
    'Frames',
    'Rashi',
    'Karungali',
    'Jadi',
    'Pyrite',
    'Kavach',
    'Siddh Range',
    'Gemstones',
    'Pyramid',
    'Necklaces/Mala',
    'Tower & Tumbles',
    'Crystal Dome Trees',
    'Women Bracelets',
    'Evil Eye',
    'Gifting'
  ];

  // 1. CALCULATE ANALYTICS METRICS
  const metrics = React.useMemo(() => {
    // Delivered + Shipped + Packing orders contribute to revenue
    const paidOrders = orders.filter(o => o.status !== 'Cancelled');
    const totalSales = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const activeFulfillments = orders.filter(o => o.status === 'Being Packed' || o.status === 'Shipped').length;
    const aov = paidOrders.length > 0 ? totalSales / paidOrders.length : 0;
    
    return {
      totalSales,
      activeFulfillments,
      aov,
      totalProducts: products.length
    };
  }, [orders, products]);

  // Sales by Category calculations for high-fidelity chart
  const categorySales = React.useMemo(() => {
    const breakdown: Record<string, number> = {};
    orders.filter(o => o.status !== 'Cancelled').forEach(order => {
      order.items.forEach(item => {
        const cat = item.product.category;
        breakdown[cat] = (breakdown[cat] || 0) + (item.product.price * item.quantity);
      });
    });
    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5
  }, [orders]);

  // Product actions handlers
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      alert('Please fill out Name and Price.');
      return;
    }

    const newProduct: Product = {
      id: `p-${Date.now()}`,
      name: productForm.name,
      description: productForm.description || 'Authentic ritual and meditation devotional item.',
      price: parseFloat(productForm.price),
      originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : undefined,
      rating: 4.8,
      reviewsCount: 1,
      image: productForm.image || '📿',
      category: productForm.category,
      spiritualType: productForm.spiritualType,
      inStock: productForm.inStock,
      popularity: 80,
      benefits: productForm.benefitsInput ? productForm.benefitsInput.split('\n').filter(Boolean) : [
        'Blessed with sacred Vedic mantras',
        'Directly sourced and quality tested'
      ]
    };

    setProducts(prev => [newProduct, ...prev]);
    setShowAddProductModal(false);
    setProductForm({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      image: '📿',
      category: 'Rudraksha',
      spiritualType: 'Rituals',
      benefitsInput: '',
      inStock: true,
    });
    triggerToast(`"${newProduct.name}" added to store successfully!`);
  };

  const handleEditProductClick = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice ? product.originalPrice.toString() : '',
      image: product.image,
      category: product.category,
      spiritualType: product.spiritualType,
      benefitsInput: product.benefits.join('\n'),
      inStock: product.inStock,
    });
  };

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setProducts(prev => prev.map(p => {
      if (p.id === editingProduct.id) {
        return {
          ...p,
          name: productForm.name,
          description: productForm.description,
          price: parseFloat(productForm.price),
          originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : undefined,
          image: productForm.image,
          category: productForm.category,
          spiritualType: productForm.spiritualType,
          inStock: productForm.inStock,
          benefits: productForm.benefitsInput ? productForm.benefitsInput.split('\n').filter(Boolean) : p.benefits
        };
      }
      return p;
    }));

    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      image: '📿',
      category: 'Rudraksha',
      spiritualType: 'Rituals',
      benefitsInput: '',
      inStock: true,
    });
    triggerToast('Product details updated successfully!');
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (window.confirm(`Are you absolutely sure you want to delete "${name}"?`)) {
      setProducts(prev => prev.filter(p => p.id !== id));
      triggerToast(`Product deleted successfully.`);
    }
  };

  // Order status changes
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('website_store_orders')
        .update({ status })
        .eq('order_id', orderId);
      if (error) throw error;
    } catch (err) {
      console.error('Failed to update order status in Supabase:', err);
    }

    setOrders(prev => prev.map(o => {
      if (o.orderId === orderId) {
        return { ...o, status };
      }
      return o;
    }));
    triggerToast(`Order #${orderId} marked as ${status}!`);
  };

  // Filter products by query
  const filteredProducts = React.useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Filter orders by query & status
  const filteredOrders = React.useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            o.orderId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Delivered':
        return { bg: '#dcfce7', text: '#15803d' };
      case 'Cancelled':
        return { bg: '#fee2e2', text: '#dc2626' };
      case 'Shipped':
        return { bg: '#dbeafe', text: '#1d4ed8' };
      default:
        return { bg: '#fff7ed', text: '#c2410c' }; // Being Packed
    }
  };

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Header Banner */}
      <section style={{
        background: 'linear-gradient(135deg, var(--primary-forest) 0%, #3e1b12 100%)',
        color: '#ffffff',
        padding: '36px 0',
        borderBottom: '4px solid var(--primary-lime)',
        textAlign: 'left'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={onNavigateToHome}
                style={{
                  color: 'rgba(255, 255, 255, 0.75)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ArrowLeft size={14} /> Shop Home
              </button>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
              <span style={{ color: 'var(--primary-lime)', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Admin Portal
              </span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', marginTop: '8px', letterSpacing: '-0.5px' }}>
              Mantra Puja Control Center
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.88rem', marginTop: '2px' }}>
              Manage your sacred inventory, fulfill temple orders, and inspect divine analytics metrics.
            </p>
            {adminSession && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                marginTop: '12px',
                fontSize: '0.82rem',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(4px)'
              }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'var(--primary-lime)', borderRadius: '50%', boxShadow: '0 0 8px var(--primary-lime)' }} />
                <span>Active Admin: <strong style={{ color: 'var(--primary-lime)' }}>{adminSession.username}</strong></span>
                <span style={{ opacity: 0.3 }}>|</span>
                <span>Session Started: {new Date(adminSession.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {onLogout && (
              <button
                onClick={onLogout}
                className="btn-outline"
                style={{
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  fontSize: '0.82rem',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  fontWeight: 700
                }}
              >
                Log Out
              </button>
            )}
            <button
              onClick={onNavigateToShop}
              className="btn-outline"
              style={{
                borderColor: '#ffffff',
                color: '#ffffff',
                fontSize: '0.82rem',
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)'
              }}
            >
              Browse Public Store
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowAddProductModal(true);
              }}
              className="btn-lime"
              style={{
                fontSize: '0.82rem',
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <Plus size={16} /> Add Product
            </button>
          </div>
        </div>
      </section>

      {/* Toast Feedback */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: 'var(--primary-forest)',
          color: '#ffffff',
          padding: '16px 24px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem',
          fontWeight: 700,
          border: '1.5px solid var(--primary-lime)',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <CheckCircle size={18} style={{ color: 'var(--primary-lime)' }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 2. Sub-Toolbar with Tab toggles */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-light)',
        padding: '16px 0',
        position: 'sticky',
        top: '68px',
        zIndex: 40,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Tab buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'analytics' as Tab, label: 'Analytics Dashboard', icon: <BarChart3 size={16} /> },
              { id: 'products' as Tab, label: 'Products Catalog', icon: <Package size={16} /> },
              { id: 'pooja_products' as Tab, label: 'Pooja Products Manager', icon: <Sparkles size={16} /> },
              { id: 'homepage_editor' as Tab, label: 'Homepage Customizer', icon: <Layout size={16} /> },
              { id: 'shop_banners' as Tab, label: 'Shop Banners', icon: <Upload size={16} /> },
              { id: 'orders' as Tab, label: 'Fulfillment Orders', icon: <ShoppingBag size={16} /> },
              { id: 'settings' as Tab, label: 'WhatsApp Gateway Settings', icon: <Settings size={16} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery('');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: activeTab === tab.id ? '1px solid var(--primary-lime)' : '1px solid var(--border-light)',
                  backgroundColor: activeTab === tab.id ? 'var(--primary-lime-light)' : '#ffffff',
                  color: activeTab === tab.id ? 'var(--primary-lime)' : 'var(--text-dark)',
                  transition: 'all 0.15s'
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab-specific actions (e.g. Search box) */}
          {activeTab !== 'analytics' && activeTab !== 'homepage_editor' && activeTab !== 'settings' && activeTab !== 'shop_banners' && (
            <div style={{ position: 'relative', width: '280px' }}>
              <input
                type="text"
                placeholder={activeTab === 'products' ? "Search products or categories..." : "Search Order ID or customer..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  outline: 'none',
                  fontSize: '0.85rem',
                  backgroundColor: '#f9fafb'
                }}
              />
              <Search size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
            </div>
          )}
        </div>
      </div>

      {/* 3. Main tab Content */}
      <div className="container" style={{ marginTop: '32px', paddingBottom: '100px', flexGrow: 1 }}>
        
        {/* =======================================================
            TAB: ANALYTICS DASHBOARD
            ======================================================= */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', textAlign: 'left' }}>
            
            {/* Metrics cards row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px'
            }}>
              
              {/* Sales */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: '#fff7ed', color: 'var(--primary-lime)' }}>
                  <DollarSign size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sales Revenue</span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)', marginTop: '2px' }}>₹{metrics.totalSales.toFixed(2)}</h3>
                </div>
              </div>

              {/* Active fulfillments */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                  <Truck size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Shipments</span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)', marginTop: '2px' }}>{metrics.activeFulfillments}</h3>
                </div>
              </div>

              {/* AOV */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: '#f0fdf4', color: '#166534' }}>
                  <TrendingUp size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Order Value</span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)', marginTop: '2px' }}>₹{metrics.aov.toFixed(2)}</h3>
                </div>
              </div>

              {/* Total Products */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
                  <Package size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Listed Items</span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)', marginTop: '2px' }}>{metrics.totalProducts}</h3>
                </div>
              </div>

            </div>

            {/* Split row for charts */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.3fr 1fr',
              gap: '30px'
            }} className="hero-grid-split">
              
              {/* Left Box: Monthly Sales Trend (High Fidelity Visual CSS/HTML Bar Chart) */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px' }}>Sales Trend (2026)</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '32px' }}>Store monthly revenue growth metrics.</p>

                {/* Bars Grid */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  height: '200px',
                  padding: '0 16px',
                  borderBottom: '2px solid var(--border-light)'
                }}>
                  {[
                    { month: 'Jan', revenue: 1450, height: '40%' },
                    { month: 'Feb', revenue: 1890, height: '55%' },
                    { month: 'Mar', revenue: 2320, height: '70%' },
                    { month: 'Apr', revenue: 2100, height: '62%' },
                    { month: 'May', revenue: 3108, height: '95%' }
                  ].map(item => (
                    <div key={item.month} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      flex: '1',
                      maxWidth: '50px'
                    }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-forest)' }}>₹{item.revenue}</span>
                      <div style={{
                        width: '32px',
                        height: '140px',
                        display: 'flex',
                        alignItems: 'flex-end',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px 4px 0 0',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: '100%',
                          height: item.height,
                          background: 'linear-gradient(to top, var(--primary-forest), var(--primary-lime))',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.3s ease'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Box: Sales by Category */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px' }}>Top Categories</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Top-performing spiritual categories.</p>

                {categorySales.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    No sales cataloged yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {categorySales.map(item => {
                      const pct = Math.round((item.value / metrics.totalSales) * 100);
                      return (
                        <div key={item.name}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                            <span>{item.name}</span>
                            <span style={{ color: 'var(--primary-lime)' }}>₹{item.value.toFixed(0)} ({pct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#f3f4f6', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                            <div style={{
                              width: `${pct}%`,
                              height: '100%',
                              backgroundColor: 'var(--primary-lime)',
                              borderRadius: 'var(--radius-full)'
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Recent Orders table */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '16px' }}>Recent Store Activity</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px' }}>Order ID</th>
                      <th style={{ padding: '12px 16px' }}>Customer</th>
                      <th style={{ padding: '12px 16px' }}>Date</th>
                      <th style={{ padding: '12px 16px' }}>Fulfillment</th>
                      <th style={{ padding: '12px 16px' }}>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 3).map(order => {
                      const statusBadge = getStatusStyle(order.status);
                      return (
                        <tr key={order.orderId} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '0.88rem' }}>
                          <td style={{ padding: '16px', fontWeight: 800 }}>#{order.orderId}</td>
                          <td style={{ padding: '16px', fontWeight: 700 }}>{order.fullName}</td>
                          <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                            {order.placedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{
                              backgroundColor: statusBadge.bg,
                              color: statusBadge.text,
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)'
                            }}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ padding: '16px', fontWeight: 900, color: 'var(--primary-forest)' }}>₹{order.total.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* =======================================================
            TAB: PRODUCTS CATALOG MANAGEMENT
            ======================================================= */}
        {activeTab === 'products' && (
          <div>
            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                <span style={{ fontSize: '3rem' }}>🛍️</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '16px', color: 'var(--text-dark)' }}>No products match query</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Try clearing the search input to list all items.</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px'
              }}>
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      textAlign: 'left'
                    }}
                  >
                    {/* Header Image Box */}
                    <div style={{
                      height: '140px',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3.6rem',
                      borderBottom: '1px solid var(--border-light)',
                      overflow: 'hidden'
                    }}>
                      {isImageUrl(product.image) ? (
                        <img src={getDisplayImageUrl(product.image)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        product.image || '📿'
                      )}
                    </div>

                    {/* Meta details */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--primary-lime)', fontWeight: 800, textTransform: 'uppercase' }}>
                          {product.spiritualType}
                        </span>
                        <span style={{
                          backgroundColor: product.inStock ? '#dcfce7' : '#fee2e2',
                          color: product.inStock ? '#166534' : '#991b1b',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)'
                        }}>
                          {product.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '6px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {product.name}
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Category: {product.category}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '10px' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary-forest)' }}>
                          ₹{product.price}
                        </span>
                        {product.originalPrice && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            ₹{product.originalPrice}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                        <button
                          onClick={() => handleEditProductClick(product)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            padding: '8px 12px',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: 'var(--text-dark)'
                          }}
                        >
                          <Edit size={12} /> Edit Details
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            padding: '8px 12px',
                            backgroundColor: '#fff5f5',
                            border: '1px solid #fed7d7',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#e53e3e'
                          }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =======================================================
            TAB: ORDERS FULFILLMENT MANAGEMENT
            ======================================================= */}
        {activeTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Status Tabs filters */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              {['All', 'Being Packed', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    backgroundColor: statusFilter === status ? 'var(--primary-lime-light)' : 'transparent',
                    border: statusFilter === status ? '1px solid var(--primary-lime)' : '1px solid transparent',
                    color: statusFilter === status ? 'var(--primary-lime)' : 'var(--text-muted)'
                  }}
                >
                  {status === 'Being Packed' ? 'Packing' : status}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                <span style={{ fontSize: '3rem' }}>📦</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '16px', color: 'var(--text-dark)' }}>No orders match filters</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Try broadening your search or selection filter.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredOrders.map(order => {
                  const badge = getStatusStyle(order.status);
                  return (
                    <div
                      key={order.orderId}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '20px 24px',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '24px',
                        flexWrap: 'wrap',
                        textAlign: 'left'
                      }}
                    >
                      {/* Left: Customer & Meta */}
                      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Order ID</span>
                          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-dark)' }}>#{order.orderId}</span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Placed At</span>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                            {order.placedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Customer</span>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-dark)' }}>{order.fullName}</span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Payment</span>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-dark)' }}>{order.paymentMethod}</span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Charged</span>
                          <span style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--primary-forest)' }}>₹{order.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Right: Status Fulfillers */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>FULFILLMENT STATUS</span>
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.orderId, e.target.value)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-md)',
                              border: '1.5px solid var(--border-light)',
                              outline: 'none',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              backgroundColor: badge.bg,
                              color: badge.text,
                              cursor: 'pointer'
                            }}
                          >
                            <option value="Being Packed">Preparing Package</option>
                            <option value="Shipped">Shipped / In Transit</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>

                        <button
                          onClick={() => setSelectedOrderDetails(order)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '8px 16px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: 'var(--text-dark)',
                            marginTop: '16px'
                          }}
                        >
                          <Eye size={14} /> View Details
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* =======================================================
            TAB: HOMEPAGE VISUAL CUSTOMIZER
            ======================================================= */}
        {activeTab === 'homepage_editor' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px', textAlign: 'left', minHeight: '80vh' }} className="homepage-editor-split">
            
            {/* LEFT COLUMN: Live Visual Preview */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
              alignSelf: 'start',
              position: 'sticky',
              top: '100px',
              maxHeight: 'calc(100vh - 140px)',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={18} style={{ color: 'var(--primary-lime)' }} /> Live Homepage Preview Simulation
                </h4>
                <span style={{ fontSize: '0.72rem', backgroundColor: 'var(--primary-lime-light)', color: 'var(--primary-lime)', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase' }}>
                  Realtime
                </span>
              </div>

              {/* Home Page Sections Simulation Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', fontSize: '0.85rem' }}>
                
                {/* 0. Banner Carousel Preview */}
                <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px', backgroundColor: '#ffffff' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Section 0: Homepage Banner Carousel</span>
                  <div style={{
                    position: 'relative',
                    height: '130px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    backgroundColor: '#1c1917',
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {bannerImages.length > 0 ? (
                      <>
                        <img
                          src={bannerImages[Math.min(activePreviewSlide, bannerImages.length - 1)]}
                          alt="Simulated Banner"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: '8px',
                          left: '8px',
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: '#ffffff',
                          fontSize: '0.65rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 700
                        }}>
                          Slide {Math.min(activePreviewSlide, bannerImages.length - 1) + 1} of {bannerImages.length}
                        </div>
                        {bannerImages.length > 1 && (
                          <div style={{ position: 'absolute', right: '8px', bottom: '8px', display: 'flex', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); setActivePreviewSlide(prev => (prev - 1 + bannerImages.length) % bannerImages.length); }}
                              style={{ border: 'none', background: 'rgba(255,255,255,0.3)', width: '20px', height: '20px', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900 }}
                            >
                              ‹
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); setActivePreviewSlide(prev => (prev + 1) % bannerImages.length); }}
                              style={{ border: 'none', background: 'rgba(255,255,255,0.3)', width: '20px', height: '20px', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900 }}
                            >
                              ›
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'rgba(255,255,255,0.3)', gap: '4px' }}>
                        <Upload size={20} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>No Banners Uploaded</span>
                        <span style={{ fontSize: '0.62rem' }}>Showing default Unsplash loop</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1. Featured Collection Preview */}
                <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px', backgroundColor: '#ffffff' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Section 1: Featured Collection</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '4px', color: 'var(--text-dark)' }}>{featuredTitle}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{featuredSubtitle}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '16px', marginTop: '16px' }}>
                    {/* Left dynamized showcase image */}
                    <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px', position: 'relative' }}>
                      {showcaseImage ? (
                        <img src={showcaseImage} alt="Showcase Preview" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>Default Altar Image</span>
                      )}
                    </div>
                    {/* 2x2 products grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {Array.from({ length: 4 }).map((_, i) => {
                        const pid = featuredProductIds[i];
                        const product = products.find(p => p.id === pid);
                        if (product) {
                          return (
                            <div key={product.id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '8px', position: 'relative', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', background: '#f8fafc', borderRadius: '4px', overflow: 'hidden' }}>
                                {isImageUrl(product.image) ? (
                                  <img src={getDisplayImageUrl(product.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  product.image || '📿'
                                )}
                              </div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{product.name}</span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary-forest)' }}>₹{product.price}</span>
                            </div>
                          );
                        }
                        return (
                          <div key={i} style={{ border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-sm)', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            + Select #{i + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. Flash Sale Section Preview */}
                <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px', backgroundColor: 'var(--primary-lime-light)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary-lime)', fontWeight: 800, textTransform: 'uppercase' }}>Section 2: Flash Sale</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '4px', color: 'var(--text-dark)' }}>{saleTitle}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{saleSubtitle}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '16px' }}>
                    {Array.from({ length: 3 }).map((_, i) => {
                      const pid = saleProductIds[i];
                      const product = products.find(p => p.id === pid);
                      if (product) {
                        return (
                          <div key={product.id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '8px', backgroundColor: '#ffffff', position: 'relative' }}>
                            <span style={{ position: 'absolute', top: '4px', left: '4px', backgroundColor: '#ef4444', color: '#ffffff', fontSize: '0.6rem', fontWeight: 800, padding: '1px 4px', borderRadius: '4px' }}>
                              -{saleDiscount}%
                            </span>
                            <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', background: '#f8fafc', borderRadius: '4px', overflow: 'hidden' }}>
                              {isImageUrl(product.image) ? (
                                <img src={getDisplayImageUrl(product.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                product.image || '📿'
                              )}
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{product.name}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-dark)' }}>₹{product.price}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={i} style={{ border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-sm)', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', backgroundColor: '#ffffff' }}>
                          + Select #{i + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. New Arrivals Section Preview */}
                <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px', backgroundColor: '#ffffff' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Section 3: New Arrivals</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '4px', color: 'var(--text-dark)' }}>{newArrivalsTitle}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Button: {newArrivalsSubtitle}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '16px' }}>
                    {Array.from({ length: 3 }).map((_, i) => {
                      const pid = newArrivalsProductIds[i];
                      const product = products.find(p => p.id === pid);
                      if (product) {
                        const isOverlay = i === 0;
                        return (
                          <div key={product.id} style={{
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-sm)',
                            padding: isOverlay ? '0' : '8px',
                            backgroundColor: isOverlay ? 'var(--primary-forest)' : '#ffffff',
                            color: isOverlay ? '#ffffff' : 'var(--text-dark)',
                            position: 'relative',
                            overflow: 'hidden',
                            height: '110px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}>
                            {isOverlay ? (
                              <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                                <div style={{ fontSize: '0.6rem', opacity: 0.8 }}>[Overlay Style]</div>
                                <div>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{product.name}</span>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 900 }}>₹{product.price}</span>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', background: '#f8fafc', borderRadius: '4px', overflow: 'hidden' }}>
                                  {isImageUrl(product.image) ? (
                                    <img src={getDisplayImageUrl(product.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    product.image || '📿'
                                  )}
                                </div>
                                <div>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 800, marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{product.name}</span>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary-forest)' }}>₹{product.price}</span>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div key={i} style={{ border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-sm)', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', backgroundColor: '#ffffff' }}>
                          + Select #{i + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Shop Page Banners Preview */}
                <div style={{ border: '2px solid var(--primary-lime)', borderRadius: 'var(--radius-md)', padding: '16px', backgroundColor: '#ffffff' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary-lime)', fontWeight: 800, textTransform: 'uppercase' }}>🛍️ Shop Page Banners</span>

                  {/* Main shop banner preview */}
                  <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>Main Shop Banner</div>
                    <div style={{ height: '60px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#1c1917', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {shopMainBanners.length > 0 ? (
                        <>
                          <img src={shopMainBanners[Math.min(shopBannerPreviewSlide, shopMainBanners.length - 1)]} alt="Shop main banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: '3px', left: '5px', fontSize: '0.5rem', color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', padding: '1px 4px', borderRadius: '2px', fontWeight: 700 }}>
                            Slide {Math.min(shopBannerPreviewSlide, shopMainBanners.length - 1) + 1}/{shopMainBanners.length}
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>No main banner — fallback shown</span>
                      )}
                    </div>
                  </div>

                  {/* Category banners row */}
                  {Object.keys(shopCategoryBanners).some(k => (shopCategoryBanners[k] || []).length > 0) && (
                    <div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>Category Banners Strip</div>
                      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                        {Object.entries(shopCategoryBanners)
                          .filter(([, imgs]) => imgs && imgs.length > 0)
                          .map(([cat, imgs]) => (
                            <div key={cat} style={{ position: 'relative', width: '80px', height: '44px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-light)' }}>
                              <img src={imgs[0]} alt={cat} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }} />
                              <div style={{ position: 'absolute', bottom: '2px', left: '3px', fontSize: '0.48rem', color: '#fff', fontWeight: 800 }}>{cat}</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* RIGHT COLUMN: Curation Controls Panel */}
            <form onSubmit={handleSaveHomepageSettings} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              
              {/* Header card with save */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-dark)' }}>Homepage Curation Manager</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dynamically curate sections and customize text labels.</p>
                </div>
                <button
                  type="submit"
                  disabled={isSavingHomepage}
                  className="btn-lime"
                  style={{
                    padding: '12px 24px',
                    fontSize: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    minWidth: '160px',
                    justifyContent: 'center',
                    cursor: isSavingHomepage ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSavingHomepage ? 'Saving layout...' : 'Save Settings'}
                </button>
              </div>

              {/* Loader overlay inside form */}
              {isLoadingHomepage ? (
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '60px 0', textAlign: 'center' }}>
                  <div style={{
                    width: '32px', height: '32px', border: '3px solid var(--border-light)',
                    borderTopColor: 'var(--primary-lime)', borderRadius: '50%',
                    animation: 'spin 1s linear infinite', margin: '0 auto 16px'
                  }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading active configurations...</p>
                </div>
              ) : (
                <>
                  {/* Search box filters everything below */}
                  <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search catalog products to filter selection lists below..."
                      value={homepageSearchQuery}
                  onChange={(e) => setHomepageSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 42px',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border-light)',
                        outline: 'none',
                        fontSize: '0.88rem',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>

                  {/* Section 0: Homepage Banner Carousel */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-dark)' }}>Section 0: Homepage Banner Carousel</h4>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--primary-lime-light)',
                        color: 'var(--primary-lime)'
                      }}>
                        {bannerImages.length} Slides
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Upload button wrapper */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Upload New Slide Image</label>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <label
                            htmlFor="banner-image-upload"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '10px 16px',
                              backgroundColor: '#ffffff',
                              border: '1px dashed var(--primary-lime)',
                              borderRadius: 'var(--radius-md)',
                              cursor: isUploadingBanner ? 'not-allowed' : 'pointer',
                              color: 'var(--primary-lime)',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              transition: 'all 0.2s',
                              userSelect: 'none',
                              width: 'fit-content'
                            }}
                          >
                            <Upload size={16} />
                            {isUploadingBanner ? 'Uploading slide to Cloudflare R2...' : 'Select slide file to upload'}
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            id="banner-image-upload"
                            disabled={isUploadingBanner}
                            onChange={handleBannerUpload}
                            style={{ display: 'none' }}
                          />
                        </div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                          <strong>Recommended dimensions:</strong> 1920px (Width) × 460px (Height) or standard aspect ratio (e.g. 16:9). The storefront hero banner renders inside a <strong>fixed 460px height</strong> container.
                        </p>
                      </div>

                      {/* Display of current slides */}
                      {bannerImages.length > 0 && (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Carousel Slides</label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                            {bannerImages.map((banner, index) => (
                              <div key={index} style={{ position: 'relative', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-light)', aspectRatio: '16/9', backgroundColor: '#e2e8f0' }}>
                                <img src={banner} alt={`Slide ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBanner(index)}
                                  style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.9)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: 'var(--shadow-sm)',
                                    padding: 0
                                  }}
                                  title="Remove Slide"
                                >
                                  <X size={12} />
                                </button>
                                <div style={{
                                  position: 'absolute',
                                  bottom: '2px',
                                  left: '4px',
                                  backgroundColor: 'rgba(0,0,0,0.6)',
                                  color: '#ffffff',
                                  fontSize: '0.55rem',
                                  padding: '1px 4px',
                                  borderRadius: '2px',
                                  fontWeight: 700
                                }}>
                                  #{index + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 1 Control Box */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-dark)' }}>Section 1: Featured Collections (Max 4)</h4>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: featuredProductIds.length === 4 ? '#dcfce7' : featuredProductIds.length > 4 ? '#fee2e2' : '#fef3c7',
                        color: featuredProductIds.length === 4 ? '#15803d' : featuredProductIds.length > 4 ? '#b91c1c' : '#b45309'
                      }}>
                        {featuredProductIds.length}/4 Selected
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Section Title</label>
                          <input type="text" value={featuredTitle} onChange={(e) => setFeaturedTitle(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)', fontSize: '0.85rem', outline: 'none' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Section Subtitle</label>
                          <input type="text" value={featuredSubtitle} onChange={(e) => setFeaturedSubtitle(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)', fontSize: '0.85rem', outline: 'none' }} />
                        </div>
                      </div>

                      {/* Section 1 Showcase Image Uploader */}
                      <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '14px', backgroundColor: '#f8fafc' }}>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Featured Section Showcase Image (Left Column)</label>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          {showcaseImage ? (
                            <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-light)', backgroundColor: '#fff', flexShrink: 0 }}>
                              <img src={showcaseImage} alt="Showcase Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button
                                type="button"
                                onClick={handleRemoveShowcase}
                                style={{
                                  position: 'absolute',
                                  top: '2px',
                                  right: '2px',
                                  backgroundColor: 'rgba(239, 68, 68, 0.9)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '18px',
                                  height: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  boxShadow: 'var(--shadow-sm)',
                                  padding: 0
                                }}
                                title="Remove Image"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ width: '80px', height: '80px', borderRadius: '6px', border: '1px dashed var(--border-light)', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700, textAlign: 'center', padding: '4px', flexShrink: 0 }}>
                              Default Altar Image
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label
                              htmlFor="showcase-image-upload"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                backgroundColor: '#ffffff',
                                border: '1px dashed var(--primary-lime)',
                                borderRadius: 'var(--radius-md)',
                                cursor: isUploadingShowcase ? 'not-allowed' : 'pointer',
                                color: 'var(--primary-lime)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                transition: 'all 0.2s',
                                userSelect: 'none',
                                width: 'fit-content'
                              }}
                            >
                              <Upload size={14} />
                              {isUploadingShowcase ? 'Uploading to R2...' : 'Upload showcase image'}
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              id="showcase-image-upload"
                              disabled={isUploadingShowcase}
                              onChange={handleShowcaseUpload}
                              style={{ display: 'none' }}
                            />
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              <strong>Recommended dimensions:</strong> 560px (Width) × 760px (Height) or aspect ratio 3:4. Constrained inside a <strong>fixed aspect-ratio</strong> relative frame matching the right products column (height: 100%, min-height: 380px) to prevent layout shifting.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Products scroll list */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Select featured items</label>
                        <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {products
                            .filter(p => !homepageSearchQuery || p.name.toLowerCase().includes(homepageSearchQuery.toLowerCase()))
                            .map((p) => {
                              const checked = featuredProductIds.includes(p.id);
                              return (
                                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', cursor: 'pointer', padding: '6px 8px', borderRadius: '4px', backgroundColor: checked ? '#f0fdf4' : 'transparent', transition: 'all 0.1s' }}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      setFeaturedProductIds(prev => {
                                        if (prev.includes(p.id)) return prev.filter(id => id !== p.id);
                                        return [...prev, p.id];
                                      });
                                    }}
                                  />
                                  <span style={{ fontSize: '1.2rem' }}>
                                    {isImageUrl(p.image) ? '🖼️' : p.image || '📿'}
                                  </span>
                                  <span style={{ fontWeight: checked ? 700 : 500, color: 'var(--text-dark)' }}>{p.name}</span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 'auto' }}>₹{p.price}</span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2 Control Box */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-dark)' }}>Section 2: Flash Sale (Max 3)</h4>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: saleProductIds.length === 3 ? '#dcfce7' : saleProductIds.length > 3 ? '#fee2e2' : '#fef3c7',
                        color: saleProductIds.length === 3 ? '#15803d' : saleProductIds.length > 3 ? '#b91c1c' : '#b45309'
                      }}>
                        {saleProductIds.length}/3 Selected
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.6fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Section Title</label>
                          <input type="text" value={saleTitle} onChange={(e) => setSaleTitle(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)', fontSize: '0.85rem', outline: 'none' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Section Subtitle</label>
                          <input type="text" value={saleSubtitle} onChange={(e) => setSaleSubtitle(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)', fontSize: '0.85rem', outline: 'none' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Discount %</label>
                          <input type="number" min="0" max="100" value={saleDiscount} onChange={(e) => setSaleDiscount(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)', fontSize: '0.85rem', outline: 'none' }} />
                        </div>
                      </div>

                      {/* Products scroll list */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Select flash sale items</label>
                        <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {products
                            .filter(p => !homepageSearchQuery || p.name.toLowerCase().includes(homepageSearchQuery.toLowerCase()))
                            .map((p) => {
                              const checked = saleProductIds.includes(p.id);
                              return (
                                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', cursor: 'pointer', padding: '6px 8px', borderRadius: '4px', backgroundColor: checked ? '#f0fdf4' : 'transparent', transition: 'all 0.1s' }}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      setSaleProductIds(prev => {
                                        if (prev.includes(p.id)) return prev.filter(id => id !== p.id);
                                        return [...prev, p.id];
                                      });
                                    }}
                                  />
                                  <span style={{ fontSize: '1.2rem' }}>
                                    {isImageUrl(p.image) ? '🖼️' : p.image || '📿'}
                                  </span>
                                  <span style={{ fontWeight: checked ? 700 : 500, color: 'var(--text-dark)' }}>{p.name}</span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 'auto' }}>₹{p.price}</span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3 Control Box */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-dark)' }}>Section 3: New Arrivals (Max 3)</h4>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: newArrivalsProductIds.length === 3 ? '#dcfce7' : newArrivalsProductIds.length > 3 ? '#fee2e2' : '#fef3c7',
                        color: newArrivalsProductIds.length === 3 ? '#15803d' : newArrivalsProductIds.length > 3 ? '#b91c1c' : '#b45309'
                      }}>
                        {newArrivalsProductIds.length}/3 Selected
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Section Title</label>
                          <input type="text" value={newArrivalsTitle} onChange={(e) => setNewArrivalsTitle(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)', fontSize: '0.85rem', outline: 'none' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Discover Button Text</label>
                          <input type="text" value={newArrivalsSubtitle} onChange={(e) => setNewArrivalsSubtitle(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)', fontSize: '0.85rem', outline: 'none' }} />
                        </div>
                      </div>

                      {/* Products scroll list */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Select new arrival items</label>
                        <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {products
                            .filter(p => !homepageSearchQuery || p.name.toLowerCase().includes(homepageSearchQuery.toLowerCase()))
                            .map((p) => {
                              const checked = newArrivalsProductIds.includes(p.id);
                              return (
                                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', cursor: 'pointer', padding: '6px 8px', borderRadius: '4px', backgroundColor: checked ? '#f0fdf4' : 'transparent', transition: 'all 0.1s' }}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      setNewArrivalsProductIds(prev => {
                                        if (prev.includes(p.id)) return prev.filter(id => id !== p.id);
                                        return [...prev, p.id];
                                      });
                                    }}
                                  />
                                  <span style={{ fontSize: '1.2rem' }}>
                                    {isImageUrl(p.image) ? '🖼️' : p.image || '📿'}
                                  </span>
                                  <span style={{ fontWeight: checked ? 700 : 500, color: 'var(--text-dark)' }}>{p.name}</span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 'auto' }}>₹{p.price}</span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* ============================================================
                      SECTION 4 (Shop Banners): Main Banner + Category Banners
                      ============================================================ */}
                  <div style={{ backgroundColor: '#ffffff', border: '2px solid var(--primary-lime)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                          🛍️ Shop Page Banners
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Upload a main shop banner carousel + per-category banners. These images are stored in Cloudflare R2.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isSavingShopBanners}
                        onClick={handleSaveShopBanners}
                        className="btn-lime"
                        style={{
                          padding: '10px 20px', fontSize: '0.82rem',
                          borderRadius: 'var(--radius-md)', minWidth: '140px',
                          justifyContent: 'center',
                          cursor: isSavingShopBanners ? 'not-allowed' : 'pointer',
                          flexShrink: 0
                        }}
                      >
                        {isSavingShopBanners ? 'Saving...' : 'Save Shop Banners'}
                      </button>
                    </div>

                    {isLoadingShopBanners ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <div style={{ width: '28px', height: '28px', border: '3px solid var(--border-light)', borderTopColor: 'var(--primary-lime)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                        <span style={{ fontSize: '0.82rem' }}>Loading shop banner configurations...</span>
                      </div>
                    ) : (
                      <>
                        {/* ---- Main Shop Banner (Carousel) ---- */}
                        <div style={{ marginBottom: '28px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-dark)', textTransform: 'uppercase' }}>
                              Main Shop Banner Carousel
                            </label>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                              {shopMainBanners.length} image{shopMainBanners.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Mini carousel preview */}
                          {shopMainBanners.length > 0 && (
                            <div style={{ position: 'relative', height: '100px', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#1c1917', marginBottom: '10px' }}>
                              <img
                                src={shopMainBanners[Math.min(shopBannerPreviewSlide, shopMainBanners.length - 1)]}
                                alt="Main banner preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              {shopMainBanners.length > 1 && (
                                <div style={{ position: 'absolute', bottom: '6px', right: '6px', display: 'flex', gap: '4px' }}>
                                  <button type="button" onClick={() => setShopBannerPreviewSlide(p => (p - 1 + shopMainBanners.length) % shopMainBanners.length)} style={{ border: 'none', background: 'rgba(255,255,255,0.3)', width: '18px', height: '18px', borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                                  <button type="button" onClick={() => setShopBannerPreviewSlide(p => (p + 1) % shopMainBanners.length)} style={{ border: 'none', background: 'rgba(255,255,255,0.3)', width: '18px', height: '18px', borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                                </div>
                              )}
                              <div style={{ position: 'absolute', bottom: '4px', left: '6px', fontSize: '0.58rem', color: '#fff', fontWeight: 700, backgroundColor: 'rgba(0,0,0,0.5)', padding: '1px 4px', borderRadius: '3px' }}>
                                {Math.min(shopBannerPreviewSlide, shopMainBanners.length - 1) + 1}/{shopMainBanners.length}
                              </div>
                            </div>
                          )}

                          {/* Thumbnails */}
                          {shopMainBanners.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                              {shopMainBanners.map((url, idx) => (
                                <div key={idx} style={{ position: 'relative', aspectRatio: '16/5', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-light)', backgroundColor: '#e2e8f0' }}>
                                  <img src={url} alt={`Main banner ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <button
                                    type="button"
                                    onClick={() => handleShopMainBannerRemove(idx)}
                                    style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                                    title="Remove"
                                  >
                                    <X size={10} />
                                  </button>
                                  <div style={{ position: 'absolute', bottom: '2px', left: '4px', fontSize: '0.5rem', color: '#fff', backgroundColor: 'rgba(0,0,0,0.55)', padding: '1px 3px', borderRadius: '2px', fontWeight: 700 }}>#{idx + 1}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          <label
                            htmlFor="shop-main-banner-upload"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              padding: '9px 14px', fontSize: '0.82rem', fontWeight: 700,
                              border: '1px dashed var(--primary-lime)', borderRadius: 'var(--radius-md)',
                              color: 'var(--primary-lime)', cursor: isUploadingShopMain ? 'not-allowed' : 'pointer',
                              backgroundColor: '#ffffff', userSelect: 'none', transition: 'all 0.2s'
                            }}
                          >
                            <Upload size={14} />
                            {isUploadingShopMain ? 'Uploading to Cloudflare R2...' : 'Add Main Banner Slide'}
                          </label>
                          <input
                            type="file" id="shop-main-banner-upload" accept="image/*"
                            disabled={isUploadingShopMain}
                            onChange={handleShopMainBannerUpload}
                            style={{ display: 'none' }}
                          />
                          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                            <strong>Recommended:</strong> 1920 × 320px (or 6:1 ratio). Displayed at fixed 320px height on the Shop page.
                          </p>
                        </div>

                        {/* ---- Category Banners Grid ---- */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-dark)', textTransform: 'uppercase', marginBottom: '12px' }}>
                            Category-Specific Banners
                          </label>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                            Upload one or multiple images per category. They appear as a scrollable row of animated cards on the Shop page. <strong>Recommended: 260 × 140px</strong> (or 13:7 ratio).
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                            {shopCategories.map(cat => {
                              const catBanners = shopCategoryBanners[cat] || [];
                              const isUploading = isUploadingShopCategory[cat] || false;
                              return (
                                <div key={cat} style={{
                                  border: '1px solid var(--border-light)',
                                  borderRadius: 'var(--radius-md)',
                                  padding: '14px',
                                  backgroundColor: catBanners.length > 0 ? '#f0fdf4' : '#f8fafc',
                                  position: 'relative'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-dark)' }}>{cat}</span>
                                    <span style={{
                                      fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: catBanners.length > 0 ? '#dcfce7' : '#f1f5f9',
                                      color: catBanners.length > 0 ? '#15803d' : 'var(--text-muted)'
                                    }}>
                                      {catBanners.length} img{catBanners.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>

                                  {/* Thumbnail strip */}
                                  {catBanners.length > 0 && (
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                      {catBanners.map((url, idx) => (
                                        <div key={idx} style={{ position: 'relative', width: '54px', height: '36px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-light)', backgroundColor: '#e2e8f0', flexShrink: 0 }}>
                                          <img src={url} alt={`${cat} ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                          <button
                                            type="button"
                                            onClick={() => handleCategoryBannerRemove(cat, idx)}
                                            style={{ position: 'absolute', top: '1px', right: '1px', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '14px', height: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                                            title="Remove"
                                          >
                                            <X size={8} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <label
                                    htmlFor={`cat-banner-upload-${cat.replace(/[^a-z0-9]/gi, '-')}`}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                                      padding: '6px 10px', fontSize: '0.75rem', fontWeight: 700,
                                      border: `1px dashed ${isUploading ? '#94a3b8' : 'var(--primary-lime)'}`,
                                      borderRadius: 'var(--radius-sm)',
                                      color: isUploading ? '#94a3b8' : 'var(--primary-lime)',
                                      cursor: isUploading ? 'not-allowed' : 'pointer',
                                      backgroundColor: '#ffffff', userSelect: 'none', transition: 'all 0.2s'
                                    }}
                                  >
                                    <Upload size={11} />
                                    {isUploading ? 'Uploading...' : catBanners.length > 0 ? '+ Add Another' : 'Upload Banner'}
                                  </label>
                                  <input
                                    type="file"
                                    id={`cat-banner-upload-${cat.replace(/[^a-z0-9]/gi, '-')}`}
                                    accept="image/*"
                                    disabled={isUploading}
                                    onChange={e => handleCategoryBannerUpload(cat, e)}
                                    style={{ display: 'none' }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

            </form>
          </div>
        )}


        {/* =======================================================
            TAB: SHOP BANNERS
            ======================================================= */}
        {activeTab === 'shop_banners' && (
          <div style={{ textAlign: 'left' }}>

            {/* Header */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              marginBottom: '24px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--primary-forest) 0%, var(--primary-lime) 100%)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-lime-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                  🛍️
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-dark)' }}>Shop Page Banner Manager</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Upload a main banner carousel for the Shop header + per-category banners. Images → Cloudflare R2 · URLs → Supabase.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingShopBanners}
                onClick={handleSaveShopBanners}
                className="btn-lime"
                style={{ padding: '12px 28px', fontSize: '0.88rem', borderRadius: 'var(--radius-md)', minWidth: '160px', justifyContent: 'center', cursor: isSavingShopBanners ? 'not-allowed' : 'pointer', flexShrink: 0 }}
              >
                {isSavingShopBanners ? 'Saving...' : '💾 Save All Banners'}
              </button>
            </div>

            {isLoadingShopBanners ? (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '80px 0', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '36px', height: '36px', border: '3px solid var(--border-light)', borderTopColor: 'var(--primary-lime)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Loading shop banner configurations...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* ===== MAIN SHOP BANNER CAROUSEL ===== */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Upload size={16} style={{ color: 'var(--primary-lime)' }} />
                        Main Shop Banner Carousel
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        These images appear as a full-width carousel at the top of the Shop page. <strong>Recommended: 1920 × 320px</strong> (6:1 ratio, fixed 320px height).
                      </p>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '4px 12px', borderRadius: '8px', backgroundColor: shopMainBanners.length > 0 ? '#dcfce7' : '#f1f5f9', color: shopMainBanners.length > 0 ? '#15803d' : 'var(--text-muted)', flexShrink: 0 }}>
                      {shopMainBanners.length} slide{shopMainBanners.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Preview */}
                  {shopMainBanners.length > 0 && (
                    <div style={{ position: 'relative', height: '160px', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#1c1917', marginBottom: '16px' }}>
                      <img
                        src={shopMainBanners[Math.min(shopBannerPreviewSlide, shopMainBanners.length - 1)]}
                        alt="Main banner preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.45) 0%, transparent 50%)' }} />
                      <div style={{ position: 'absolute', bottom: '12px', left: '16px', color: '#fff' }}>
                        <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>Preview</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800 }}>Slide {Math.min(shopBannerPreviewSlide, shopMainBanners.length - 1) + 1} of {shopMainBanners.length}</div>
                      </div>
                      {shopMainBanners.length > 1 && (
                        <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '6px' }}>
                          <button type="button" onClick={() => setShopBannerPreviewSlide(p => (p - 1 + shopMainBanners.length) % shopMainBanners.length)} style={{ border: 'none', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', width: '28px', height: '28px', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 900 }}>‹</button>
                          <button type="button" onClick={() => setShopBannerPreviewSlide(p => (p + 1) % shopMainBanners.length)} style={{ border: 'none', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', width: '28px', height: '28px', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 900 }}>›</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Thumbnail grid */}
                  {shopMainBanners.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                      {shopMainBanners.map((url, idx) => (
                        <div key={idx} style={{ position: 'relative', aspectRatio: '16/5', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: `2px solid ${idx === shopBannerPreviewSlide ? 'var(--primary-lime)' : 'var(--border-light)'}`, backgroundColor: '#e2e8f0', cursor: 'pointer', transition: 'border-color 0.2s' }} onClick={() => setShopBannerPreviewSlide(idx)}>
                          <img src={url} alt={`Slide ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleShopMainBannerRemove(idx); }}
                            style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                            title="Remove slide"
                          >
                            <X size={11} />
                          </button>
                          <div style={{ position: 'absolute', bottom: '3px', left: '5px', fontSize: '0.55rem', color: '#fff', backgroundColor: 'rgba(0,0,0,0.55)', padding: '1px 4px', borderRadius: '2px', fontWeight: 700 }}>
                            Slide {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <label
                      htmlFor="shop-main-banner-upload-tab"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '11px 20px', fontSize: '0.88rem', fontWeight: 700,
                        border: '1.5px dashed var(--primary-lime)', borderRadius: 'var(--radius-md)',
                        color: 'var(--primary-lime)', cursor: isUploadingShopMain ? 'not-allowed' : 'pointer',
                        backgroundColor: isUploadingShopMain ? '#f8fafc' : '#f0fdf4', userSelect: 'none', transition: 'all 0.2s'
                      }}
                    >
                      <Upload size={16} />
                      {isUploadingShopMain ? 'Uploading to Cloudflare R2...' : '+ Add Banner Slide'}
                    </label>
                    <input
                      type="file" id="shop-main-banner-upload-tab" accept="image/*"
                      disabled={isUploadingShopMain}
                      onChange={handleShopMainBannerUpload}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      You can add multiple slides. Each slide auto-advances every 4.5 seconds on the shop page.
                    </span>
                  </div>
                </div>

                {/* ===== CATEGORY BANNERS GRID ===== */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layout size={16} style={{ color: 'var(--primary-lime)' }} />
                      Category-Specific Banners
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Upload banners for specific categories. They appear as a scrollable strip of cards below the main banner on the Shop page.
                      <strong> Recommended: 260 × 140px</strong> (13:7 ratio). You can add multiple images per category — they auto-cycle.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {shopCategories.map(cat => {
                      const catBanners = shopCategoryBanners[cat] || [];
                      const isUploading = isUploadingShopCategory[cat] || false;
                      const inputId = `cat-tab-upload-${cat.replace(/[^a-z0-9]/gi, '-')}`;
                      return (
                        <div key={cat} style={{
                          border: `1.5px solid ${catBanners.length > 0 ? 'var(--primary-lime)' : 'var(--border-light)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '16px',
                          backgroundColor: catBanners.length > 0 ? '#f0fdf4' : '#f9fafb',
                          transition: 'all 0.2s'
                        }}>
                          {/* Category header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)' }}>{cat}</span>
                            <span style={{
                              fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                              backgroundColor: catBanners.length > 0 ? '#dcfce7' : '#f1f5f9',
                              color: catBanners.length > 0 ? '#15803d' : 'var(--text-muted)'
                            }}>
                              {catBanners.length} image{catBanners.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Previews */}
                          {catBanners.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                              {catBanners.map((url, idx) => (
                                <div key={idx} style={{ position: 'relative', width: '68px', height: '44px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-light)', backgroundColor: '#e2e8f0', flexShrink: 0 }}>
                                  <img src={url} alt={`${cat} ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <button
                                    type="button"
                                    onClick={() => handleCategoryBannerRemove(cat, idx)}
                                    style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                                    title="Remove"
                                  >
                                    <X size={9} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Upload */}
                          <label
                            htmlFor={inputId}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              padding: '7px 12px', fontSize: '0.78rem', fontWeight: 700,
                              border: `1px dashed ${isUploading ? '#94a3b8' : 'var(--primary-lime)'}`,
                              borderRadius: 'var(--radius-sm)',
                              color: isUploading ? '#94a3b8' : 'var(--primary-lime)',
                              cursor: isUploading ? 'not-allowed' : 'pointer',
                              backgroundColor: '#ffffff', userSelect: 'none', transition: 'all 0.2s'
                            }}
                          >
                            <Upload size={12} />
                            {isUploading ? 'Uploading...' : catBanners.length > 0 ? '+ Add More' : 'Upload Banner'}
                          </label>
                          <input
                            type="file"
                            id={inputId}
                            accept="image/*"
                            disabled={isUploading}
                            onChange={e => handleCategoryBannerUpload(cat, e)}
                            style={{ display: 'none' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom save */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '24px' }}>
                  <button
                    type="button"
                    disabled={isSavingShopBanners}
                    onClick={handleSaveShopBanners}
                    className="btn-lime"
                    style={{ padding: '14px 36px', fontSize: '0.9rem', borderRadius: 'var(--radius-md)', minWidth: '200px', justifyContent: 'center', cursor: isSavingShopBanners ? 'not-allowed' : 'pointer' }}
                  >
                    {isSavingShopBanners ? 'Saving to Supabase...' : '💾 Save All Banners'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =======================================================
            TAB: WHATSAPP GATEWAY SETTINGS
            ======================================================= */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              
              {/* Top Accent line */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, var(--primary-forest) 0%, var(--primary-lime) 100%)'
              }} />

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
                <div className="flex-center" style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-lime-light)',
                  color: 'var(--primary-lime)'
                }}>
                  <Settings size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                    WhatsApp API Gateway
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Configure credentials for secure phone-verification and login OTP dispatching.
                  </p>
                </div>
              </div>

              {/* Encryption Banner */}
              <div style={{
                backgroundColor: 'rgba(194, 65, 12, 0.06)',
                border: '1px solid rgba(194, 65, 12, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '28px',
                display: 'flex',
                gap: '12px'
              }}>
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>🔒</span>
                <div>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    End-to-End Client-Side Encryption Enabled
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#7c2d12', marginTop: '4px', lineHeight: '1.4' }}>
                    Your secret API tokens are encrypted client-side using the standard <strong>AES-GCM (128-bit)</strong> cryptosystem with the 16-character key from your environment configurations. Only encrypted data reaches the cloud database, securing your communications from third-party interception.
                  </p>
                </div>
              </div>

              {isLoadingSettings ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid var(--border-light)',
                    borderTopColor: 'var(--primary-lime)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px'
                  }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Retrieving secure server settings...</p>
                </div>
              ) : (
                <form onSubmit={handleSaveWhatsappSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Endpoint Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      API Gateway Endpoint URL *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://api.whatsapp-gateway.com/v1/send"
                      value={whatsappEndpoint}
                      onChange={(e) => setWhatsappEndpoint(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border-light)',
                        outline: 'none',
                        fontSize: '0.88rem',
                        transition: 'border-color 0.15s',
                        backgroundColor: '#f9fafb'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary-lime)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                    />
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px', lineHeight: '1.4' }}>
                      The endpoint URL used to trigger OTP messages.
                      <br />
                      <strong>For BhashSMS:</strong> Provide the gateway URL containing all template parameters except the password parameter, for example:
                      <code style={{ backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '4px', fontSize: '0.7rem', wordBreak: 'break-all', display: 'inline-block', marginTop: '4px' }}>
                        https://bhashsms.com/api/sendmsg.php?user=MisCRM&amp;sender=MisCRM&amp;text=service_rejected_hindi&amp;priority=wa&amp;stype=normal
                      </code>
                    </span>
                  </div>

                  {/* Token Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Secret Gateway API Key / Token *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter secret WhatsApp API key token..."
                      value={whatsappToken}
                      onChange={(e) => setWhatsappToken(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border-light)',
                        outline: 'none',
                        fontSize: '0.88rem',
                        transition: 'border-color 0.15s',
                        backgroundColor: '#f9fafb'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary-lime)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                    />
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px', lineHeight: '1.4' }}>
                      Your secret key or API token. This is encrypted on your device and sent to Supabase in ciphertext representation.
                      <br />
                      <strong>For BhashSMS:</strong> Enter your API password (it will be passed securely as the <code style={{ backgroundColor: '#f3f4f6', padding: '1px 3px', borderRadius: '3px' }}>pass</code> query parameter).
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="btn-lime"
                    style={{
                      padding: '14px 28px',
                      fontSize: '0.9rem',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      marginTop: '8px',
                      cursor: isSavingSettings ? 'not-allowed' : 'pointer',
                      opacity: isSavingSettings ? 0.75 : 1
                    }}
                  >
                    {isSavingSettings ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid #ffffff',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.6s linear infinite',
                          marginRight: '8px'
                        }} />
                        Encrypting & Saving Credentials...
                      </>
                    ) : (
                      'Save & Encrypt Gateway settings'
                    )}
                  </button>

                </form>
              )}

            </div>

            {/* Razorpay Integration Settings Card */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Top Accent line */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)'
              }} />

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
                <div className="flex-center" style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#fef3c7',
                  color: '#d97706'
                }}>
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                    Razorpay Payment Gateway API
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Configure your Razorpay Key ID and Secret Key to accept cards, UPI, and netbanking payments.
                  </p>
                </div>
              </div>

              {isLoadingSettings ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading Razorpay API status...</p>
                </div>
              ) : (
                <form onSubmit={handleSaveRazorpaySettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Key ID Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Razorpay Key ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="rzp_live_..."
                      value={razorpayKeyId}
                      onChange={(e) => setRazorpayKeyId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border-light)',
                        outline: 'none',
                        fontSize: '0.88rem',
                        transition: 'border-color 0.15s',
                        backgroundColor: '#f9fafb'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary-lime)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                    />
                  </div>

                  {/* Key Secret Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Razorpay Key Secret *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter secret key..."
                      value={razorpayKeySecret}
                      onChange={(e) => setRazorpayKeySecret(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border-light)',
                        outline: 'none',
                        fontSize: '0.88rem',
                        transition: 'border-color 0.15s',
                        backgroundColor: '#f9fafb'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary-lime)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                    />
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px', lineHeight: '1.4' }}>
                      Your secret Razorpay API key. This is encrypted on your client device and stored securely in the database.
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSavingRazorpay}
                    className="btn-lime"
                    style={{
                      padding: '14px 28px',
                      fontSize: '0.9rem',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      marginTop: '8px',
                      cursor: isSavingRazorpay ? 'not-allowed' : 'pointer',
                      opacity: isSavingRazorpay ? 0.75 : 1
                    }}
                  >
                    {isSavingRazorpay ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid #ffffff',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.6s linear infinite',
                          marginRight: '8px'
                        }} />
                        Encrypting & Saving Credentials...
                      </>
                    ) : (
                      'Save & Encrypt Razorpay Settings'
                    )}
                  </button>

                </form>
              )}
            </div>

          </div>
        )}

        {/* =======================================================
            TAB: POOJA PRODUCTS MANAGEMENT
            ======================================================= */}
        {activeTab === 'pooja_products' && (
          <div style={{ textAlign: 'left' }}>
            {!editingPoojaProduct ? (
              // List View of Pooja Products
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                      Pooja Products Catalog
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Manage advanced temple rituals, booking instructions, and Cloudflare R2 media.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {Object.values(selectedPoojaIds).filter(Boolean).length > 0 && (
                      <button
                        onClick={handleBulkPublishPooja}
                        disabled={isBulkPublishing}
                        className="btn-lime"
                        style={{
                          fontSize: '0.85rem',
                          padding: '10px 20px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--primary-forest, #15803d)',
                          borderColor: 'var(--primary-forest, #15803d)',
                          color: '#ffffff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 6px -1px rgba(21, 128, 61, 0.3)',
                          cursor: 'pointer'
                        }}
                      >
                        {isBulkPublishing ? (
                          <>
                            <div style={{
                              width: '12px', height: '12px', border: '2px solid #ffffff',
                              borderTopColor: 'transparent', borderRadius: '50%',
                              animation: 'spin 0.6s linear infinite'
                            }} />
                            Publishing Selected...
                          </>
                        ) : (
                          <>
                            🚀 Publish Selected ({Object.values(selectedPoojaIds).filter(Boolean).length})
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsNewPoojaProduct(true);
                        setEditingPoojaProduct({ ...initialPoojaProduct });
                      }}
                      className="btn-lime"
                      style={{ fontSize: '0.85rem', padding: '10px 20px', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                    >
                      <Plus size={16} /> Create Pooja Product
                    </button>
                  </div>
                </div>

                {isLoadingPooja ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{
                      width: '32px', height: '32px', border: '3px solid var(--border-light)',
                      borderTopColor: 'var(--primary-lime)', borderRadius: '50%',
                      animation: 'spin 1s linear infinite', margin: '0 auto 16px'
                    }} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading Pooja products...</p>
                  </div>
                ) : poojaProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)', backgroundColor: '#ffffff' }}>
                    <span style={{ fontSize: '3rem' }}>🕉️</span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '16px', color: 'var(--text-dark)' }}>No Pooja Products Found</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Click "Create Pooja Product" to start building your dynamic catalog.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'left', backgroundColor: '#f9fafb' }}>
                          <th style={{ padding: '16px', width: '48px' }}>
                            <input
                              type="checkbox"
                              checked={poojaProducts.length > 0 && poojaProducts.every(p => selectedPoojaIds[p.id])}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const newSel: Record<string, boolean> = {};
                                if (checked) {
                                  poojaProducts.forEach(p => {
                                    newSel[p.id] = true;
                                  });
                                }
                                setSelectedPoojaIds(newSel);
                              }}
                              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                          </th>
                          <th style={{ padding: '16px' }}>Product</th>
                          <th style={{ padding: '16px' }}>Category</th>
                          <th style={{ padding: '16px' }}>Price</th>
                          <th style={{ padding: '16px' }}>Status</th>
                          <th style={{ padding: '16px' }}>Featured</th>
                          <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {poojaProducts.map(product => {
                          const isEmoji = !isImageUrl(product.image);
                          return (
                            <tr key={product.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '0.88rem', backgroundColor: selectedPoojaIds[product.id] ? 'rgba(132, 204, 22, 0.04)' : 'transparent' }}>
                              <td style={{ padding: '16px', width: '48px' }}>
                                <input
                                  type="checkbox"
                                  checked={!!selectedPoojaIds[product.id]}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSelectedPoojaIds(prev => ({
                                      ...prev,
                                      [product.id]: checked
                                    }));
                                  }}
                                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                />
                              </td>
                              <td style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{
                                    width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid var(--border-light)', backgroundColor: '#f9fafb'
                                  }}>
                                    {isEmoji ? (
                                      <span style={{ fontSize: '1.5rem' }}>{product.image}</span>
                                    ) : (
                                      <img src={getDisplayImageUrl(product.image)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    )}
                                  </div>
                                  <div>
                                    <span style={{ fontWeight: 800, color: 'var(--text-dark)', display: 'block' }}>{product.name}</span>
                                    {product.sanskritName && (
                                      <span style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--primary-forest)' }}>{product.sanskritName}</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '16px', fontWeight: 600 }}>{product.category}</td>
                              <td style={{ padding: '16px', fontWeight: 700, color: 'var(--primary-forest)' }}>
                                ₹{product.price} {product.originalPrice && <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-muted)', marginLeft: '4px' }}>₹{product.originalPrice}</span>}
                              </td>
                              <td style={{ padding: '16px' }}>
                                <span style={{
                                  backgroundColor: product.isPublished ? '#dcfce7' : '#fff7ed',
                                  color: product.isPublished ? '#15803d' : '#c2410c',
                                  fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: 'var(--radius-full)'
                                }}>
                                  {product.isPublished ? 'Published' : 'Draft'}
                                </span>
                              </td>
                              <td style={{ padding: '16px' }}>
                                <span style={{ fontSize: '0.85rem' }}>{product.isFeatured ? '⭐ Yes' : 'No'}</span>
                              </td>
                              <td style={{ padding: '16px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '8px' }}>
                                  <button
                                    onClick={() => {
                                      setIsNewPoojaProduct(false);
                                      setEditingPoojaProduct(product);
                                    }}
                                    style={{
                                      padding: '6px 12px', border: '1px solid var(--border-light)',
                                      borderRadius: 'var(--radius-md)', fontSize: '0.78rem', fontWeight: 700,
                                      color: 'var(--text-dark)', display: 'inline-flex', alignItems: 'center', gap: '4px',
                                      backgroundColor: '#ffffff', cursor: 'pointer'
                                    }}
                                  >
                                    <Edit size={12} /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeletePoojaProduct(product.id, product.name)}
                                    style={{
                                      padding: '6px 12px', border: '1px solid #fed7d7',
                                      borderRadius: 'var(--radius-md)', fontSize: '0.78rem', fontWeight: 700,
                                      color: '#e53e3e', display: 'inline-flex', alignItems: 'center', gap: '4px',
                                      backgroundColor: '#fff5f5', cursor: 'pointer'
                                    }}
                                  >
                                    <Trash2 size={12} /> Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              // visual editor workspace
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Visual Editor Workspace Top Control Bar */}
                <div style={{
                  position: 'sticky',
                  top: '70px',
                  zIndex: 100,
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-lg, 12px)',
                  padding: '16px 24px',
                  boxShadow: 'var(--shadow-lg), 0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {/* First row: Back, Title, Save/Cancel */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setEditingPoojaProduct(null)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-md, 8px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#f3f4f6',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                      >
                        ← Catalog List
                      </button>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Sparkles size={20} style={{ color: 'var(--primary-lime, #84cc16)' }} /> 
                          {isNewPoojaProduct ? 'New Pooja Creator' : `Editing: ${editingPoojaProduct.name}`}
                        </h3>
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>Visual Builder Workspace • Click text to edit, click images to upload to R2</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', position: 'relative' }}>
                      {isNewPoojaProduct && (
                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)}
                            style={{
                              padding: '10px 16px',
                              borderRadius: 'var(--radius-md, 8px)',
                              border: '1.5px solid var(--primary-lime, #84cc16)',
                              backgroundColor: 'rgba(132, 204, 22, 0.1)',
                              color: 'var(--primary-lime, #84cc16)',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(132, 204, 22, 0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(132, 204, 22, 0.1)'}
                          >
                            <Sparkles size={14} /> Select Draft Template
                          </button>
                          
                          {showTemplatesDropdown && (
                            <div style={{
                              position: 'absolute',
                              right: 0,
                              top: 'calc(100% + 8px)',
                              width: '320px',
                              backgroundColor: '#1e293b',
                              borderRadius: 'var(--radius-lg, 12px)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                              zIndex: 1000,
                              overflow: 'hidden',
                              padding: '6px'
                            }}>
                              <div style={{ padding: '8px 12px', fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Pre-made Devotional Drafts
                              </div>
                              {poojaTemplates.map((t) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => {
                                    setEditingPoojaProduct(t);
                                    setShowTemplatesDropdown(false);
                                    triggerToast(`Loaded ${t.name} draft! You can now edit it visually.`);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: '#ffffff',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'background-color 0.15s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <span style={{ fontSize: '1.25rem' }}>{t.image}</span>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 700 }}>{t.name}</span>
                                    <span style={{ fontSize: '0.68rem', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                                      {t.subtitle}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setEditingPoojaProduct(null)}
                        style={{
                          padding: '10px 20px',
                          borderRadius: 'var(--radius-md, 8px)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          backgroundColor: 'transparent',
                          color: '#d1d5db',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleSavePoojaProduct(e)}
                        disabled={isSavingPooja}
                        style={{
                          padding: '10px 24px',
                          borderRadius: 'var(--radius-md, 8px)',
                          border: 'none',
                          backgroundColor: 'var(--primary-lime, #84cc16)',
                          color: '#0f172a',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 4px 6px -1px rgba(132, 204, 22, 0.4)',
                          opacity: isSavingPooja ? 0.75 : 1
                        }}
                      >
                        {isSavingPooja ? 'Saving to Database...' : 'Save Pooja Product'}
                      </button>
                    </div>
                  </div>

                  {/* Second row: Technical settings bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    flexWrap: 'wrap',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.82rem'
                  }}>
                    {/* URL Slug input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#9ca3af', fontWeight: 700 }}>Slug:</span>
                      <input
                        type="text"
                        value={editingPoojaProduct.slug || ''}
                        placeholder="e.g. maha-puja"
                        onChange={(e) => updatePoojaField('slug', e.target.value)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid rgba(255,255,255,0.2)',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: '#ffffff',
                          outline: '#84cc16',
                          fontSize: '0.82rem',
                          width: '180px'
                        }}
                      />
                    </div>

                    {/* Category Dropdown Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#9ca3af', fontWeight: 700 }}>Category:</span>
                      <select
                        value={editingPoojaProduct.category || 'Rudraksha'}
                        onChange={(e) => updatePoojaField('category', e.target.value)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid rgba(255,255,255,0.2)',
                          backgroundColor: '#1e293b',
                          color: '#ffffff',
                          outline: 'none',
                          fontSize: '0.82rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Rudraksha">Rudraksha</option>
                        <option value="Bracelet">Bracelet</option>
                        <option value="Murti">Murti</option>
                        <option value="Yantras">Yantras</option>
                        <option value="Anklet">Anklet</option>
                        <option value="Frames">Frames</option>
                        <option value="Rashi">Rashi</option>
                        <option value="Karungali">Karungali</option>
                        <option value="Jadi">Jadi</option>
                        <option value="Pyrite">Pyrite</option>
                        <option value="Kavach">Kavach</option>
                        <option value="Siddh Range">Siddh Range</option>
                        <option value="Gemstones">Gemstones</option>
                        <option value="Pyramid">Pyramid</option>
                        <option value="Necklaces/Mala">Necklaces/Mala</option>
                        <option value="Tower & Tumbles">Tower & Tumbles</option>
                        <option value="Crystal Dome Trees">Crystal Dome Trees</option>
                        <option value="Women Bracelets">Women Bracelets</option>
                        <option value="Evil Eye">Evil Eye</option>
                        <option value="Gifting">Gifting</option>
                      </select>
                    </div>

                    {/* Switches in a row */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
                      <input type="checkbox" checked={editingPoojaProduct.inStock ?? true} onChange={(e) => updatePoojaField('inStock', e.target.checked)} />
                      In Stock
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
                      <input type="checkbox" checked={editingPoojaProduct.isFeatured || false} onChange={(e) => updatePoojaField('isFeatured', e.target.checked)} />
                      Featured
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
                      <input type="checkbox" checked={editingPoojaProduct.isTrending || false} onChange={(e) => updatePoojaField('isTrending', e.target.checked)} />
                      Trending
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
                      <input type="checkbox" checked={editingPoojaProduct.isPublished || false} onChange={(e) => updatePoojaField('isPublished', e.target.checked)} />
                      Published
                    </label>

                    {/* Publish Scheduled Date Picker */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#9ca3af', fontWeight: 700 }}>Schedule:</span>
                      <input
                        type="datetime-local"
                        value={editingPoojaProduct.publishedAt ? editingPoojaProduct.publishedAt.substring(0, 16) : ''}
                        onChange={(e) => updatePoojaField('publishedAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid rgba(255,255,255,0.2)',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: '#ffffff',
                          outline: 'none',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Main WYSIWYG Workspace Area */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '320px 1fr',
                  gap: '24px',
                  alignItems: 'start'
                }}>
                  {/* Left Column: Product Card Frame */}
                  <div style={{
                    position: 'sticky',
                    top: '220px',
                    height: 'fit-content'
                  }}>
                    <div style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.05)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '24px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Storefront Card View</span>
                        <span style={{ fontSize: '0.72rem', backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>Live Preview</span>
                      </div>
                      <ProductCard
                        product={{
                          id: editingPoojaProduct.id || 'preview-id',
                          name: editingPoojaProduct.name || '',
                          description: editingPoojaProduct.shortDescription || editingPoojaProduct.description || '',
                          shortDescription: editingPoojaProduct.shortDescription || '',
                          price: parseFloat((editingPoojaProduct.price || 0).toString()),
                          originalPrice: editingPoojaProduct.originalPrice ? parseFloat(editingPoojaProduct.originalPrice.toString()) : undefined,
                          rating: editingPoojaProduct.rating || 4.8,
                          reviewsCount: editingPoojaProduct.reviewsCount || 1,
                          image: editingPoojaProduct.image || '📿',
                          category: editingPoojaProduct.category || 'Rudraksha',
                          spiritualType: editingPoojaProduct.spiritualType || 'Rituals',
                          inStock: editingPoojaProduct.inStock ?? true,
                          popularity: 85,
                          benefits: editingPoojaProduct.benefits || [],
                          badges: editingPoojaProduct.badges || [],
                          sanskritName: editingPoojaProduct.sanskritName || '',
                        } as any}
                        onAddToCart={() => {}}
                        onViewDetails={() => {}}
                        editable={false}
                      />
                    </div>
                  </div>

                  {/* Right Column: Product Detail Page Frame */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', borderBottom: '1px solid var(--border-light)', padding: '12px 24px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Pooja Detail Page Editor Workspace</span>
                      <span style={{ fontSize: '0.72rem', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>Editable Visual Mode</span>
                    </div>
                    <div style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                      <ProductDetailPage
                        product={{
                          id: editingPoojaProduct.id || 'preview-id',
                          name: editingPoojaProduct.name || '',
                          description: editingPoojaProduct.description || '',
                          price: parseFloat((editingPoojaProduct.price || 0).toString()),
                          originalPrice: editingPoojaProduct.originalPrice ? parseFloat(editingPoojaProduct.originalPrice.toString()) : undefined,
                          rating: editingPoojaProduct.rating || 4.8,
                          reviewsCount: editingPoojaProduct.reviewsCount || 1,
                          image: editingPoojaProduct.image || '📿',
                          category: editingPoojaProduct.category || 'Rudraksha',
                          spiritualType: editingPoojaProduct.spiritualType || 'Rituals',
                          inStock: editingPoojaProduct.inStock ?? true,
                          popularity: 85,
                          benefits: editingPoojaProduct.benefits || [],
                          badges: editingPoojaProduct.badges || [],
                          sanskritName: editingPoojaProduct.sanskritName || '',
                          subtitle: editingPoojaProduct.subtitle || '',
                          shortDescription: editingPoojaProduct.shortDescription || '',
                          spiritualSignificance: editingPoojaProduct.spiritualSignificance !== undefined ? editingPoojaProduct.spiritualSignificance : null,
                          bookingInstructions: editingPoojaProduct.bookingInstructions !== undefined ? editingPoojaProduct.bookingInstructions : null,
                          duration: editingPoojaProduct.duration !== undefined ? editingPoojaProduct.duration : null,
                          templeAssociation: editingPoojaProduct.templeAssociation !== undefined ? editingPoojaProduct.templeAssociation : null,
                          whoShouldPerform: editingPoojaProduct.whoShouldPerform !== undefined ? editingPoojaProduct.whoShouldPerform : null,
                          ritualsIncluded: editingPoojaProduct.ritualsIncluded !== undefined ? editingPoojaProduct.ritualsIncluded : null,
                          samagriList: editingPoojaProduct.samagriList !== undefined ? editingPoojaProduct.samagriList : null,
                          priestDetails: editingPoojaProduct.priestDetails,
                          priestImage: editingPoojaProduct.priestImage !== undefined ? editingPoojaProduct.priestImage : null,
                          certificates: editingPoojaProduct.certificates,
                          faqs: editingPoojaProduct.faqs,
                          galleryImages: editingPoojaProduct.galleryImages !== undefined ? editingPoojaProduct.galleryImages : null,
                          material: editingPoojaProduct.material,
                          weight: editingPoojaProduct.weight,
                          dimensions: editingPoojaProduct.dimensions,
                          origin: editingPoojaProduct.origin,
                          customIcons: (editingPoojaProduct as any).customIcons || {},
                          relatedProducts: editingPoojaProduct.relatedProducts || [],
                        } as any}
                        products={[...products, ...poojaProducts]}
                        wishlist={{}}
                        onAddToCart={() => {}}
                        onViewDetails={() => {}}
                        onToggleWishlist={() => {}}
                        onBackToShop={() => {}}
                        editable={true}
                        onUpdate={(fields) => updatePoojaFields(fields)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* =======================================================
          MODAL: ADD/EDIT PRODUCT
          ======================================================= */}
      {(showAddProductModal || editingProduct) && (
        <div style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0, left: 0,
          backgroundColor: 'rgba(45, 20, 14, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 500,
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            textAlign: 'left',
            animation: 'slideUp 0.25s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              backgroundColor: 'var(--primary-forest)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--primary-lime)' }} />
                {editingProduct ? 'Edit Store Product Details' : 'Add New Spiritual Product'}
              </h2>
              <button
                onClick={() => {
                  setShowAddProductModal(false);
                  setEditingProduct(null);
                }}
                style={{ color: '#ffffff' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={editingProduct ? handleSaveEditProduct : handleAddProduct} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Panchmukhi Himalaya Mala"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.88rem' }}
                  />
                </div>

                {/* Category */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.88rem', cursor: 'pointer' }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tell devotees about the spiritual origins, aura benefits, and quality tests..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.88rem', resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                {/* Price */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="25.00"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.88rem' }}
                  />
                </div>

                {/* Original Price */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Original Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="35.00"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.88rem' }}
                  />
                </div>

                {/* Image emoji */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Image (Emoji representation) *</label>
                  <input
                    type="text"
                    required
                    placeholder="📿 or 🌿 or 🪔"
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.88rem', textAlign: 'center' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                {/* Spiritual Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Spiritual Type *</label>
                  <select
                    value={productForm.spiritualType}
                    onChange={(e) => setProductForm({ ...productForm, spiritualType: e.target.value as Product['spiritualType'] })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.88rem', cursor: 'pointer' }}
                  >
                    <option value="Rituals">Rituals</option>
                    <option value="Meditation">Meditation</option>
                    <option value="Vastu">Vastu</option>
                    <option value="Wisdom">Wisdom</option>
                    <option value="Aromatherapy">Aromatherapy</option>
                  </select>
                </div>

                {/* Stock status */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Stock Availability</label>
                  <div style={{ display: 'flex', gap: '10px', height: '42px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, inStock: true })}
                      style={{
                        flex: '1',
                        padding: '8px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: productForm.inStock ? '2.5px solid var(--primary-lime)' : '1px solid var(--border-light)',
                        backgroundColor: productForm.inStock ? 'var(--primary-lime-light)' : '#ffffff',
                        color: productForm.inStock ? 'var(--primary-lime)' : 'var(--text-dark)'
                      }}
                    >
                      In Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, inStock: false })}
                      style={{
                        flex: '1',
                        padding: '8px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: !productForm.inStock ? '2.5px solid var(--primary-lime)' : '1px solid var(--border-light)',
                        backgroundColor: !productForm.inStock ? 'var(--primary-lime-light)' : '#ffffff',
                        color: !productForm.inStock ? 'var(--primary-lime)' : 'var(--text-dark)'
                      }}
                    >
                      Out of Stock
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Benefits (One per line)</label>
                <textarea
                  rows={3}
                  placeholder="Reduces stress & anxiety&#10;Certified Nepalese five-face seed&#10;Dipped in olive oil for protection"
                  value={productForm.benefitsInput}
                  onChange={(e) => setProductForm({ ...productForm, benefitsInput: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.88rem', resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                <button
                  type="submit"
                  className="btn-lime"
                  style={{ padding: '12px 24px', fontSize: '0.88rem', width: '100%' }}
                >
                  {editingProduct ? 'Save Product Details' : 'Add New Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProductModal(false);
                    setEditingProduct(null);
                  }}
                  className="btn-outline"
                  style={{ padding: '12px 24px', fontSize: '0.88rem', border: '1px solid var(--border-light)', width: '100%' }}
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: VIEW ORDER DETAILS
          ======================================================= */}
      {selectedOrderDetails && (
        <div style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0, left: 0,
          backgroundColor: 'rgba(45, 20, 14, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 500,
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%',
            maxWidth: '580px',
            maxHeight: '90vh',
            overflowY: 'auto',
            textAlign: 'left',
            animation: 'slideUp 0.25s ease-out'
          }}>
            
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              backgroundColor: 'var(--primary-forest)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} style={{ color: 'var(--primary-lime)' }} />
                Fulfillment Order Details #{selectedOrderDetails.orderId}
              </h2>
              <button onClick={() => setSelectedOrderDetails(null)} style={{ color: '#ffffff' }}>
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Address details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="form-grid-2col">
                
                {/* Delivery address */}
                <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '14px', backgroundColor: '#f9fafb' }}>
                  <h4 style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Fulfillment Destination
                  </h4>
                  <p style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)' }}>{selectedOrderDetails.fullName}</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {selectedOrderDetails.addressLine1}
                    {selectedOrderDetails.addressLine2 ? `, ${selectedOrderDetails.addressLine2}` : ''}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {selectedOrderDetails.deliveryCity}, {selectedOrderDetails.deliveryState} - {selectedOrderDetails.pincode}
                  </p>
                </div>

                {/* Customer Contact */}
                <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '14px', backgroundColor: '#f9fafb' }}>
                  <h4 style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Devotee Contacts
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-dark)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={12} /> {selectedOrderDetails.fullName}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Email: {selectedOrderDetails.email}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Phone: {selectedOrderDetails.phoneNumber}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Method: {selectedOrderDetails.paymentMethod}
                  </p>
                  {selectedOrderDetails.razorpayPaymentId && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Razorpay Txn: <code style={{ backgroundColor: '#e2e8f0', padding: '2px 4px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{selectedOrderDetails.razorpayPaymentId}</code>
                    </p>
                  )}
                </div>

              </div>

              {/* Items Table list */}
              <div>
                <h4 style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                  Order items list
                </h4>
                <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  {selectedOrderDetails.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: idx < selectedOrderDetails.items.length - 1 ? '1px solid var(--border-light)' : 'none',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {isImageUrl(item.product.image) ? (
                          <img src={getDisplayImageUrl(item.product.image)} alt={item.product.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                        ) : (
                          <span style={{ fontSize: '2rem' }}>{item.product.image || '📿'}</span>
                        )}
                        <div>
                          <p style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)' }}>{item.product.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Quantity: {item.quantity} • price: ₹{item.product.price} each
                          </p>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>
                        ₹{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing breakdown summary */}
              <div style={{
                borderTop: '1.5px solid var(--border-light)',
                paddingTop: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                  <span style={{ fontWeight: 700 }}>₹{selectedOrderDetails.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrderDetails.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#10b981' }}>
                    <span>Coupon Discount</span>
                    <span style={{ fontWeight: 700 }}>- ₹{selectedOrderDetails.discount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Sacred Shipping</span>
                  <span style={{ fontWeight: 700 }}>{selectedOrderDetails.shipping === 0 ? 'FREE' : `₹${selectedOrderDetails.shipping.toFixed(2)}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tax (8%)</span>
                  <span style={{ fontWeight: 700 }}>₹{selectedOrderDetails.tax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border-light)', paddingTop: '12px', marginTop: '4px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)' }}>Grand Total Charged</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary-forest)' }}>₹{selectedOrderDetails.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="btn-lime"
                style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
              >
                Close Order Invoice
              </button>

            </div>
          </div>
        </div>
      )}

      {/* CSS injection for animations and responsiveness */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .profile-sidebar-wrapper {
            margin-bottom: 24px;
          }
          .hero-grid-split {
            grid-template-columns: 1fr !important;
          }
          .form-grid-2col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
};
