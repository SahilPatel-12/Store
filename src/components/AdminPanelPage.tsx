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
  CheckCircle,
  Truck,
  X,
  User,
  Sparkles,
  Settings,
  Layout,
  Upload,
  CreditCard,
  LogOut,
  ExternalLink,
  RefreshCw,
  Layers,
  ArrowUp,
  ArrowDown,
  List,
  Ticket,
  Copy,
  EyeOff,
  Edit3,
  Save,
  QrCode,
  Lock,
  AlertTriangle
} from 'lucide-react';
import type { Product, PoojaProduct, LocalOrder } from '../types';
import { supabase } from '../lib/supabase';
import { encryptText, decryptText, hashPassword } from '../lib/crypto';
import { ProductCard } from './ProductCard';
import { ProductDetailPage } from './ProductDetailPage';
import { uploadToR2, deleteFromR2 } from '../lib/cloudflare/r2';
import { compressImage, compressVideo, CompressionStatusWidget } from '../lib/mediaCompressor';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';
import { getSpiritualTypeForProduct } from '../lib/spiritualTypeHelper';

const getLevelName = (levelNum: number | string) => {
  const num = typeof levelNum === 'string' ? parseInt(levelNum, 10) : levelNum;
  if (num === 1) return 'Affiliate';
  if (num === 2) return 'Distributor';
  if (num === 3) return 'Super Distributor';
  return `Level ${num}`;
};

interface AdminPanelPageProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: LocalOrder[];
  setOrders: React.Dispatch<React.SetStateAction<LocalOrder[]>>;
  onNavigateToHome: () => void;
  onNavigateToShop: () => void;
  onLogout?: () => void;
  adminSession?: { username: string; loginTime: string; token: string | null } | null;
  onRefreshOrders?: () => Promise<void>;
  categoriesOrder?: string[];
  categoriesList?: { name: string; hidden: boolean }[];
  onUpdateCategoriesOrder?: (newOrder: string[]) => void;
  onUpdateCategoriesList?: (newList: { name: string; hidden: boolean }[], newOrder: string[]) => void;
  productsOrder?: Record<string, string[]>;
  onUpdateProductsOrder?: (newOrders: Record<string, string[]>) => void;
  taxDeliverySettings?: {
    globalGstPercent: number;
    globalDeliveryCharge: number;
    freeDeliveryThreshold: number;
  };
  onUpdateTaxDeliverySettings?: (newSettings: {
    globalGstPercent: number;
    globalDeliveryCharge: number;
    freeDeliveryThreshold: number;
  }) => void;
}

type Tab = 'analytics' | 'products' | 'orders' | 'settings' | 'pooja_products' | 'homepage_editor' | 'shop_banners' | 'categories_editor' | 'products_sorter' | 'coupons' | 'affiliates' | 'upi_settings' | 'users';

export const AdminPanelPage: React.FC<AdminPanelPageProps> = ({
  products,
  setProducts,
  orders,
  setOrders,
  onNavigateToHome,
  onNavigateToShop,
  onLogout,
  adminSession,
  onRefreshOrders,
  categoriesOrder,
  onUpdateCategoriesOrder,
  categoriesList,
  onUpdateCategoriesList,
  productsOrder,
  onUpdateProductsOrder,
  taxDeliverySettings,
  onUpdateTaxDeliverySettings,
}) => {
  const safeCategoriesList = categoriesList || [];
  const [activeTab, setActiveTab] = React.useState<Tab>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/admin/analytics')) return 'analytics';
    if (path.startsWith('/admin/products')) return 'products';
    if (path.startsWith('/admin/pooja-products')) return 'pooja_products';
    if (path.startsWith('/admin/homepage-customizer')) return 'homepage_editor';
    if (path.startsWith('/admin/shop-banners')) return 'shop_banners';
    if (path.startsWith('/admin/whatsapp-settings')) return 'settings';
    if (path.startsWith('/admin/upi-settings')) return 'upi_settings';
    if (path.startsWith('/admin/categories-sorter')) return 'categories_editor';
    if (path.startsWith('/admin/products-sorter')) return 'products_sorter';
    if (path.startsWith('/admin/coupons')) return 'coupons';
    return 'analytics';
  });
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All');

  // Staging media compressor queue
  const [mediaQueue, setMediaQueue] = React.useState<Record<string, {
    file: File;
    pathPrefix: string;
    progress: number;
    status: 'selected' | 'compressing' | 'ready' | 'uploading' | 'uploaded' | 'failed';
    originalSize: number;
    compressedSize: number;
    percentSaved: number;
    compressedFile?: File;
    blobUrl: string;
    cdnUrl?: string;
    type: 'image' | 'video';
  }>>({});

  const mediaQueueRef = React.useRef<Record<string, any>>({});
  React.useEffect(() => {
    mediaQueueRef.current = mediaQueue;
  }, [mediaQueue]);

  const resolveMediaUrl = React.useCallback((url: string) => {
    if (url && url.startsWith('temp-media-')) {
      return mediaQueue[url]?.blobUrl || '';
    }
    return url;
  }, [mediaQueue]);

  const addToMediaQueue = async (
    file: File,
    pathPrefix: string,
    onUpdateUrl: (url: string) => void
  ): Promise<string> => {
    const tempId = `temp-media-${crypto.randomUUID()}`;
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    const blobUrl = URL.createObjectURL(file);

    setMediaQueue(prev => ({
      ...prev,
      [tempId]: {
        file,
        pathPrefix,
        progress: 0,
        status: 'selected',
        originalSize: file.size,
        compressedSize: file.size,
        percentSaved: 0,
        blobUrl,
        type
      }
    }));

    onUpdateUrl(tempId);

    // Run compression asynchronously
    if (type === 'image') {
      setMediaQueue(prev => {
        if (!prev[tempId]) return prev;
        return {
          ...prev,
          [tempId]: { ...prev[tempId], status: 'compressing', progress: 20 }
        };
      });
      try {
        const result = await compressImage(file);
        const compBlobUrl = URL.createObjectURL(result.compressedFile);
        setMediaQueue(prev => {
          if (!prev[tempId]) return prev;
          return {
            ...prev,
            [tempId]: {
              ...prev[tempId],
              status: 'ready',
              progress: 100,
              compressedFile: result.compressedFile,
              compressedSize: result.compressedSize,
              percentSaved: result.percentSaved,
              blobUrl: compBlobUrl
            }
          };
        });
      } catch (err) {
        console.error('Image compression failed:', err);
        setMediaQueue(prev => {
          if (!prev[tempId]) return prev;
          return {
            ...prev,
            [tempId]: { ...prev[tempId], status: 'failed' }
          };
        });
      }
    } else {
      setMediaQueue(prev => {
        if (!prev[tempId]) return prev;
        return {
          ...prev,
          [tempId]: { ...prev[tempId], status: 'compressing', progress: 5 }
        };
      });
      try {
        const result = await compressVideo(file, (prog) => {
          setMediaQueue(prev => {
            if (!prev[tempId]) return prev;
            return {
              ...prev,
              [tempId]: { ...prev[tempId], progress: prog }
            };
          });
        });
        setMediaQueue(prev => {
          if (!prev[tempId]) return prev;
          return {
            ...prev,
            [tempId]: {
              ...prev[tempId],
              status: 'ready',
              progress: 100,
              compressedFile: result.compressedFile,
              compressedSize: result.compressedSize,
              percentSaved: result.percentSaved
            }
          };
        });
      } catch (err) {
        console.error('Video compression failed:', err);
        setMediaQueue(prev => {
          if (!prev[tempId]) return prev;
          return {
            ...prev,
            [tempId]: { ...prev[tempId], status: 'failed' }
          };
        });
      }
    }

    return tempId;
  };

  const processPendingUploads = async (payload: any): Promise<any> => {
    if (!payload) return payload;

    const uploadItem = async (tempId: string): Promise<string> => {
      let item = mediaQueueRef.current[tempId];
      if (!item) return tempId;

      while (item.status === 'compressing' || item.status === 'selected') {
        await new Promise(resolve => setTimeout(resolve, 200));
        item = mediaQueueRef.current[tempId];
        if (!item) return tempId;
      }

      if (item.status === 'failed') {
        throw new Error('Compression failed for staged file.');
      }

      if (item.status === 'uploaded' && item.cdnUrl) {
        return item.cdnUrl;
      }

      setMediaQueue(prev => {
        if (!prev[tempId]) return prev;
        return {
          ...prev,
          [tempId]: { ...prev[tempId], status: 'uploading', progress: 0 }
        };
      });

      let uploadProgress = 0;
      const progressInterval = setInterval(() => {
        if (uploadProgress < 75) {
          uploadProgress += Math.floor(Math.random() * 10) + 5;
        } else if (uploadProgress < 96) {
          uploadProgress += Math.floor(Math.random() * 3) + 1;
        }
        setMediaQueue(prev => {
          if (!prev[tempId] || prev[tempId].status !== 'uploading') return prev;
          return {
            ...prev,
            [tempId]: { ...prev[tempId], progress: Math.min(uploadProgress, 96) }
          };
        });
      }, 150);

      try {
        const fileToUpload = item.compressedFile || item.file;
        const cdnUrl = await uploadToR2(fileToUpload, item.pathPrefix, true);

        clearInterval(progressInterval);

        setMediaQueue(prev => {
          if (!prev[tempId]) return prev;
          return {
            ...prev,
            [tempId]: { ...prev[tempId], status: 'uploaded', progress: 100, cdnUrl }
          };
        });

        return cdnUrl;
      } catch (err) {
        clearInterval(progressInterval);
        setMediaQueue(prev => {
          if (!prev[tempId]) return prev;
          return {
            ...prev,
            [tempId]: { ...prev[tempId], status: 'failed', progress: 0 }
          };
        });
        throw err;
      }
    };

    const traverseAndReplace = async (obj: any): Promise<any> => {
      if (typeof obj === 'string') {
        if (obj.startsWith('temp-media-')) {
          return await uploadItem(obj);
        }
        return obj;
      }

      if (Array.isArray(obj)) {
        const result = [];
        for (const element of obj) {
          result.push(await traverseAndReplace(element));
        }
        return result;
      }

      if (obj !== null && typeof obj === 'object') {
        if (obj.constructor && obj.constructor.name === 'File') {
          return obj;
        }
        const result: Record<string, any> = {};
        for (const key of Object.keys(obj)) {
          result[key] = await traverseAndReplace(obj[key]);
        }
        return result;
      }

      return obj;
    };

    return await traverseAndReplace(payload);
  };

  // Affiliates directory state
  const [affiliates, setAffiliates] = React.useState<any[]>([]);
  const [isLoadingAffiliates, setIsLoadingAffiliates] = React.useState(false);
  const [isUpdatingAffiliateStatus, setIsUpdatingAffiliateStatus] = React.useState<string | null>(null);

  // New Affiliate management states
  const [affiliateSubTab, setAffiliateSubTab] = React.useState<'directory' | 'tiers' | 'withdrawals' | 'pundits'>('directory');

  // Pundit management states
  const [pundits, setPundits] = React.useState<any[]>([]);
  const [isLoadingPundits, setIsLoadingPundits] = React.useState(false);
  const [newPunditName, setNewPunditName] = React.useState('');
  const [newPunditPhone, setNewPunditPhone] = React.useState('');
  const [newPunditPassword, setNewPunditPassword] = React.useState('');
  const [isCreatingPundit, setIsCreatingPundit] = React.useState(false);
  const [punditCreationResult, setPunditCreationResult] = React.useState<any | null>(null);
  const [punditError, setPunditError] = React.useState('');
  const [resetPunditId, setResetPunditId] = React.useState<string | null>(null);
  const [resetPunditPassword, setResetPunditPassword] = React.useState('');
  const [isResettingPassword, setIsResettingPassword] = React.useState(false);
  
  // User directory states
  const [usersState, setUsersState] = React.useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);
  const [searchUserQuery, setSearchUserQuery] = React.useState('');
  const [isDeletingUser, setIsDeletingUser] = React.useState<string | null>(null);
  const [isSuspendingUser, setIsSuspendingUser] = React.useState<string | null>(null);
  const [affiliateLevels, setAffiliateLevels] = React.useState<any[]>([]);
  const [isLoadingLevels, setIsLoadingLevels] = React.useState(false);
  const [affiliateSettings, setAffiliateSettings] = React.useState<Record<string, any>>({
    affiliate_max_depth: 5,
    affiliate_enabled: true,
    affiliate_commission_model: 'last_touch',
    affiliate_min_withdrawal: 1000
  });
  const [isLoadingAffiliateSettings, setIsLoadingAffiliateSettings] = React.useState(false);
  const [isSavingAffiliateSettings, setIsSavingAffiliateSettings] = React.useState(false);
  const [withdrawals, setWithdrawals] = React.useState<any[]>([]);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = React.useState(false);
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = React.useState<string | null>(null);

  // New level editing state
  const [editingLevel, setEditingLevel] = React.useState<any>(null); // { level_number: number, commission_percentage: number, enabled: boolean }
  const [isSavingLevel, setIsSavingLevel] = React.useState(false);
  const [isDeletingLevel, setIsDeletingLevel] = React.useState<number | null>(null);

  // Reject withdrawal modal state
  const [rejectingWithdrawalId, setRejectingWithdrawalId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [txnInputId, setTxnInputId] = React.useState<string | null>(null);
  const [txnRefNumber, setTxnRefNumber] = React.useState('');

  React.useEffect(() => {
    const syncTabFromUrl = () => {
      const path = window.location.pathname;
      if (path.startsWith('/admin/analytics')) setActiveTab('analytics');
      else if (path.startsWith('/admin/products')) setActiveTab('products');
      else if (path.startsWith('/admin/pooja-products')) setActiveTab('pooja_products');
      else if (path.startsWith('/admin/homepage-customizer')) setActiveTab('homepage_editor');
      else if (path.startsWith('/admin/shop-banners')) setActiveTab('shop_banners');
      else if (path.startsWith('/admin/fulfillment-orders')) setActiveTab('orders');
      else if (path.startsWith('/admin/whatsapp-settings')) setActiveTab('settings');
      else if (path.startsWith('/admin/upi-settings')) setActiveTab('upi_settings');
      else if (path.startsWith('/admin/categories-sorter')) setActiveTab('categories_editor');
      else if (path.startsWith('/admin/products-sorter')) setActiveTab('products_sorter');
      else if (path.startsWith('/admin/coupons')) setActiveTab('coupons');
      else if (path.startsWith('/admin/affiliates')) setActiveTab('affiliates');
    };
    window.addEventListener('popstate', syncTabFromUrl);
    return () => window.removeEventListener('popstate', syncTabFromUrl);
  }, []);

  const handleTabChange = (tabId: Tab) => {
    setActiveTab(tabId);
    setSearchQuery('');
    let slug = '/admin/analytics';
    switch (tabId) {
      case 'analytics':
        slug = '/admin/analytics';
        break;
      case 'products':
        slug = '/admin/products';
        break;
      case 'pooja_products':
        slug = '/admin/pooja-products';
        break;
      case 'homepage_editor':
        slug = '/admin/homepage-customizer';
        break;
      case 'shop_banners':
        slug = '/admin/shop-banners';
        break;
      case 'orders':
        slug = '/admin/fulfillment-orders';
        break;
      case 'settings':
        slug = '/admin/whatsapp-settings';
        break;
      case 'upi_settings':
        slug = '/admin/upi-settings';
        break;
      case 'categories_editor':
        slug = '/admin/categories-sorter';
        break;
      case 'products_sorter':
        slug = '/admin/products-sorter';
        break;
      case 'coupons':
        slug = '/admin/coupons';
        break;
      case 'affiliates':
        slug = '/admin/affiliates';
        break;
    }
    if (window.location.pathname !== slug) {
      window.history.pushState({}, '', slug);
    }
  };

  // WhatsApp settings state
  const [whatsappEndpoint, setWhatsappEndpoint] = React.useState('');
  const [whatsappToken, setWhatsappToken] = React.useState('');
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(false);
  const [isSavingSettings, setIsSavingSettings] = React.useState(false);

  // Razorpay settings state
  const [razorpayKeyId, setRazorpayKeyId] = React.useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = React.useState('');
  const [isSavingRazorpay, setIsSavingRazorpay] = React.useState(false);
  const [isRefreshingOrders, setIsRefreshingOrders] = React.useState(false);

  // Barcode / UPI QR settings state
  const [adminUpiId, setAdminUpiId] = React.useState('7974478098@paytm');
  const [adminBarcodeUrl, setAdminBarcodeUrl] = React.useState('');
  const [isSavingBarcode, setIsSavingBarcode] = React.useState(false);
  const [previewAmount, setPreviewAmount] = React.useState('500');
  const [previewOrderId, setPreviewOrderId] = React.useState('123456');

  // Tax & Delivery settings state
  const [globalGstPercent, setGlobalGstPercent] = React.useState('8');
  const [globalDeliveryCharge, setGlobalDeliveryCharge] = React.useState('49');
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = React.useState('999');
  const [isSavingTaxDelivery, setIsSavingTaxDelivery] = React.useState(false);
  // Homepage Customizer settings state
  const [featuredTitle, setFeaturedTitle] = React.useState('Our Featured Collection');
  const [featuredSubtitle, setFeaturedSubtitle] = React.useState('Get 30% off when you purchase our featured bundle');
  const [featuredProductIds, setFeaturedProductIds] = React.useState<string[]>([]);
  const [cartExploreMoreProductIds, setCartExploreMoreProductIds] = React.useState<string[]>([]);

  const [saleTitle, setSaleTitle] = React.useState('Exceptional Discounts up to 30%');
  const [saleSubtitle, setSaleSubtitle] = React.useState('EXCLUSIVE OFFERS WEEK');
  const [saleDiscount, setSaleDiscount] = React.useState(30);
  const [saleProductIds, setSaleProductIds] = React.useState<string[]>([]);

  const [newArrivalsTitle, setNewArrivalsTitle] = React.useState('Discover Our New Arrivals');
  const [newArrivalsSubtitle, setNewArrivalsSubtitle] = React.useState('Discover More');
  const [newArrivalsProductIds, setNewArrivalsProductIds] = React.useState<string[]>([]);

  const [bannerImages, setBannerImages] = React.useState<string[]>([]);
  const [showcaseImage, setShowcaseImage] = React.useState<string>('');
  const [activePreviewSlide, setActivePreviewSlide] = React.useState(0);

  const [isLoadingHomepage, setIsLoadingHomepage] = React.useState(false);
  const [isSavingHomepage, setIsSavingHomepage] = React.useState(false);
  const [homepageSearchQuery, setHomepageSearchQuery] = React.useState('');

  // Coupons manager state
  const [coupons, setCoupons] = React.useState<any[]>([]);
  const [redemptions, setRedemptions] = React.useState<any[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = React.useState(false);
  const [isCreatingCoupon, setIsCreatingCoupon] = React.useState(false);
  const [newCouponCode, setNewCouponCode] = React.useState('');
  const [newDiscountPercent, setNewDiscountPercent] = React.useState<number>(10);
  const [newUserLimit, setNewUserLimit] = React.useState<string>('');
  const [newProductId, setNewProductId] = React.useState<string>('');

  // Shop Banners state
  const shopCategories = [
    'Rudraksha', 'Bracelet', 'Murti', 'Yantras', 'Anklet', 'Frames', 'Rashi',
    'Karungali', 'Jadi', 'Pyrite', 'Kavach', 'Siddh Range', 'Gemstones',
    'Pyramid', 'Necklaces/Mala', 'Tower & Tumbles', 'Crystal Dome Trees',
    'Women Bracelets', 'Evil Eye', 'Gifting'
  ];
  const [shopMainBanners, setShopMainBanners] = React.useState<string[]>([]);
  const [shopCategoryBanners, setShopCategoryBanners] = React.useState<Record<string, string[]>>({});
  const [bannerRedirects, setBannerRedirects] = React.useState<Record<string, string>>({});
  const [shopMainBannerRedirects, setShopMainBannerRedirects] = React.useState<Record<string, string>>({});
  const [shopCategoryBannerRedirects, setShopCategoryBannerRedirects] = React.useState<Record<string, string>>({});
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
          setCartExploreMoreProductIds(val.cartExploreMoreProductIds || []);

          setSaleTitle(val.saleTitle || 'Exceptional Discounts up to 30%');
          setSaleSubtitle(val.saleSubtitle || 'EXCLUSIVE OFFERS WEEK');
          setSaleDiscount(val.saleDiscount ?? 30);
          setSaleProductIds(val.saleProductIds || []);

          setNewArrivalsTitle(val.newArrivalsTitle || 'Discover Our New Arrivals');
          setNewArrivalsSubtitle(val.newArrivalsSubtitle || 'Discover More');
          setNewArrivalsProductIds(val.newArrivalsProductIds || []);

          const rawBanners = val.bannerImages || [];
          const normalizedBanners = rawBanners.map((b: any) => typeof b === 'string' ? b : b.imageUrl);
          setBannerImages(normalizedBanners);

          const redirectsMap: Record<string, string> = {};
          rawBanners.forEach((b: any) => {
            const url = typeof b === 'string' ? b : b.imageUrl;
            const redirect = typeof b === 'string' ? '' : (b.redirectUrl || '');
            if (url) {
              redirectsMap[url] = redirect;
            }
          });
          setBannerRedirects(redirectsMap);

          setShowcaseImage(val.showcaseImage || '');
        } else {
          if (products && products.length > 0) {
            setFeaturedProductIds(products.slice(0, 4).map(p => p.id));
            setSaleProductIds(products.slice(4, 8).map(p => p.id));
            setNewArrivalsProductIds(products.slice(8, 12).map(p => p.id));
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
      const finalBanners = await processPendingUploads(bannerImages);
      const finalShowcase = await processPendingUploads(showcaseImage);

      setBannerImages(finalBanners);
      setShowcaseImage(finalShowcase);

      const { error } = await supabase
        .from('website_settings')
        .upsert({
          key: 'homepage_settings',
          value: {
            featuredTitle,
            featuredSubtitle,
            featuredProductIds: activeFeaturedIds,
            saleTitle,
            saleSubtitle,
            saleDiscount,
            saleProductIds: activeSaleIds,
            newArrivalsTitle,
            newArrivalsSubtitle,
            newArrivalsProductIds: activeNewArrivalsIds,
            cartExploreMoreProductIds: activeCartExploreMoreIds,
            bannerImages: finalBanners.map((url: string) => ({
              imageUrl: url,
              redirectUrl: bannerRedirects[url] || ''
            })),
            showcaseImage: finalShowcase
          }
        });
      if (error) throw error;
      setFeaturedProductIds(activeFeaturedIds);
      setSaleProductIds(activeSaleIds);
      setNewArrivalsProductIds(activeNewArrivalsIds);
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
    try {
      await addToMediaQueue(file, 'homepage/banners', (tempId) => {
        setBannerImages(prev => [...prev, tempId]);
      });
      triggerToast('Banner slide queued for compression!');
    } catch (err) {
      console.error(err);
      alert('Failed to queue banner: ' + (err as Error).message);
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveBanner = async (index: number) => {
    const bannerUrl = bannerImages[index];
    setBannerImages(prev => prev.filter((_, idx) => idx !== index));
    triggerToast('Banner slide removed. Remember to save changes.');
    if (bannerUrl && !bannerUrl.startsWith('temp-media-')) {
      try {
        await deleteFromR2(bannerUrl);
      } catch (err) {
        console.error('Failed to delete banner from R2:', err);
      }
    }
  };

  const handleMoveBanner = (index: number, direction: 'left' | 'right') => {
    setBannerImages(prev => {
      const newImages = [...prev];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newImages.length) return prev;
      const temp = newImages[index];
      newImages[index] = newImages[targetIndex];
      newImages[targetIndex] = temp;
      return newImages;
    });
    setActivePreviewSlide(prev => {
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (prev === index) return targetIndex;
      if (prev === targetIndex) return index;
      return prev;
    });
    triggerToast('Slide order updated. Remember to save.');
  };

  const handleShowcaseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await addToMediaQueue(file, 'homepage/showcase', (tempId) => {
        setShowcaseImage(tempId);
      });
      triggerToast('Showcase image queued for compression!');
    } catch (err) {
      console.error(err);
      alert('Failed to queue showcase: ' + (err as Error).message);
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveShowcase = async () => {
    const showcaseUrl = showcaseImage;
    setShowcaseImage('');
    triggerToast('Showcase image cleared. Remember to save changes.');
    if (showcaseUrl && !showcaseUrl.startsWith('temp-media-')) {
      try {
        await deleteFromR2(showcaseUrl);
      } catch (err) {
        console.error('Failed to delete showcase from R2:', err);
      }
    }
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
        const rawMain = data.value.mainBanners || [];
        const normalizedMain = rawMain.map((b: any) => typeof b === 'string' ? b : b.imageUrl);
        setShopMainBanners(normalizedMain);

        const mainRedirectsMap: Record<string, string> = {};
        rawMain.forEach((b: any) => {
          const url = typeof b === 'string' ? b : b.imageUrl;
          const redirect = typeof b === 'string' ? '' : (b.redirectUrl || '');
          if (url) {
            mainRedirectsMap[url] = redirect;
          }
        });
        setShopMainBannerRedirects(mainRedirectsMap);

        const rawCat = data.value.categoryBanners || {};
        const normalizedCat: Record<string, string[]> = {};
        const catRedirectsMap: Record<string, string> = {};

        for (const [cat, list] of Object.entries(rawCat)) {
          if (Array.isArray(list)) {
            normalizedCat[cat] = list.map((b: any) => typeof b === 'string' ? b : b.imageUrl);
            list.forEach((b: any) => {
              const url = typeof b === 'string' ? b : b.imageUrl;
              const redirect = typeof b === 'string' ? '' : (b.redirectUrl || '');
              if (url) {
                catRedirectsMap[url] = redirect;
              }
            });
          }
        }
        setShopCategoryBanners(normalizedCat);
        setShopCategoryBannerRedirects(catRedirectsMap);
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
      const finalMain = await processPendingUploads(shopMainBanners);
      const finalCat = await processPendingUploads(shopCategoryBanners);

      setShopMainBanners(finalMain);
      setShopCategoryBanners(finalCat);

      const mainBannersWithRedirects = finalMain.map((url: string) => ({
        imageUrl: url,
        redirectUrl: shopMainBannerRedirects[url] || ''
      }));

      const categoryBannersWithRedirects: Record<string, { imageUrl: string; redirectUrl: string }[]> = {};
      for (const [cat, list] of Object.entries(finalCat)) {
        if (Array.isArray(list)) {
          categoryBannersWithRedirects[cat] = list.map((url: string) => ({
            imageUrl: url,
            redirectUrl: shopCategoryBannerRedirects[url] || ''
          }));
        }
      }

      const { error } = await supabase
        .from('website_settings')
        .upsert({
          key: 'shop_banners_settings',
          value: {
            mainBanners: mainBannersWithRedirects,
            categoryBanners: categoryBannersWithRedirects,
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
    try {
      await addToMediaQueue(file, 'shop/main-banners', (tempId) => {
        setShopMainBanners(prev => [...prev, tempId]);
      });
      triggerToast('Main shop banner queued for compression!');
    } catch (err) {
      alert('Failed to stage banner: ' + (err as Error).message);
    } finally {
      e.target.value = '';
    }
  };

  const handleShopMainBannerRemove = async (index: number) => {
    const bannerUrl = shopMainBanners[index];
    setShopMainBanners(prev => prev.filter((_, i) => i !== index));
    triggerToast('Main banner removed. Remember to save.');
    if (bannerUrl && !bannerUrl.startsWith('temp-media-')) {
      try {
        await deleteFromR2(bannerUrl);
      } catch (err) {
        console.error('Failed to delete shop main banner from R2:', err);
      }
    }
  };

  const handleMoveShopBanner = (index: number, direction: 'left' | 'right') => {
    setShopMainBanners(prev => {
      const newImages = [...prev];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newImages.length) return prev;
      const temp = newImages[index];
      newImages[index] = newImages[targetIndex];
      newImages[targetIndex] = temp;
      return newImages;
    });
    setShopBannerPreviewSlide(prev => {
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (prev === index) return targetIndex;
      if (prev === targetIndex) return index;
      return prev;
    });
    triggerToast('Shop banner slide order updated. Remember to save.');
  };

  const handleCategoryBannerUpload = async (category: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const folderKey = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await addToMediaQueue(file, `shop/category-banners/${folderKey}`, (tempId) => {
        setShopCategoryBanners(prev => ({
          ...prev,
          [category]: [...(prev[category] || []), tempId]
        }));
      });
      triggerToast(`${category} category banner queued for compression!`);
    } catch (err) {
      alert('Failed to stage category banner: ' + (err as Error).message);
    } finally {
      e.target.value = '';
    }
  };

  const handleCategoryBannerRemove = async (category: string, index: number) => {
    const bannerUrl = (shopCategoryBanners[category] || [])[index];
    setShopCategoryBanners(prev => ({
      ...prev,
      [category]: (prev[category] || []).filter((_, i) => i !== index)
    }));
    triggerToast(`${category} banner removed. Remember to save.`);
    if (bannerUrl && !bannerUrl.startsWith('temp-media-')) {
      try {
        await deleteFromR2(bannerUrl);
      } catch (err) {
        console.error('Failed to delete category banner from R2:', err);
      }
    }
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

        // 3. Fetch Tax & Delivery settings
        if (taxDeliverySettings) {
          setGlobalGstPercent(String(taxDeliverySettings.globalGstPercent));
          setGlobalDeliveryCharge(String(taxDeliverySettings.globalDeliveryCharge));
          setFreeDeliveryThreshold(String(taxDeliverySettings.freeDeliveryThreshold));
        } else {
          const { data: taxData } = await supabase
            .from('website_settings')
            .select('value')
            .eq('key', 'tax_delivery_settings')
            .single();
          
          if (taxData && taxData.value) {
            const val = taxData.value as { global_gst_percent?: number; global_delivery_charge?: number; free_delivery_threshold?: number };
            setGlobalGstPercent(String(val.global_gst_percent ?? 8));
            setGlobalDeliveryCharge(String(val.global_delivery_charge ?? 49));
            setFreeDeliveryThreshold(String(val.free_delivery_threshold ?? 999));
          }
        }

        // 4. Fetch Direct Barcode / UPI QR settings
        const { data: barcodeData } = await supabase
          .from('website_settings')
          .select('value')
          .eq('key', 'payment_barcode_settings')
          .single();
        if (barcodeData && barcodeData.value) {
          const val = barcodeData.value as { upi_id?: string; barcode_url?: string };
          setAdminUpiId(val.upi_id || '7974478098@paytm');
          setAdminBarcodeUrl(val.barcode_url || '');
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setIsLoadingSettings(false);
      }
    }

    if (activeTab === 'settings' || activeTab === 'upi_settings') {
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

  const handleSaveTaxDeliverySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTaxDelivery(true);
    try {
      const gstVal = parseFloat(globalGstPercent.toString());
      const deliveryVal = parseFloat(globalDeliveryCharge.toString());
      const thresholdVal = parseFloat(freeDeliveryThreshold.toString());

      if (isNaN(gstVal) || isNaN(deliveryVal) || isNaN(thresholdVal)) {
        alert('Please enter valid numeric values.');
        return;
      }

      const { error } = await supabase
        .from('website_settings')
        .upsert({
          key: 'tax_delivery_settings',
          value: {
            global_gst_percent: gstVal,
            global_delivery_charge: deliveryVal,
            free_delivery_threshold: thresholdVal
          }
        });

      if (error) throw error;
      
      if (onUpdateTaxDeliverySettings) {
        onUpdateTaxDeliverySettings({
          globalGstPercent: gstVal,
          globalDeliveryCharge: deliveryVal,
          freeDeliveryThreshold: thresholdVal
        });
      }
      triggerToast('Tax & Delivery Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings: ' + (err as Error).message);
    } finally {
      setIsSavingTaxDelivery(false);
    }
  };

  const handleSaveBarcodeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUpiId.trim() || !adminUpiId.includes('@')) {
      alert('Please enter a valid UPI ID / VPA (e.g. name@upi).');
      return;
    }

    setIsSavingBarcode(true);
    try {
      const { error } = await supabase
        .from('website_settings')
        .upsert({
          key: 'payment_barcode_settings',
          value: {
            upi_id: adminUpiId,
            barcode_url: adminBarcodeUrl
          }
        });

      if (error) throw error;
      triggerToast('Direct Barcode Payment Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save barcode settings: ' + (err as Error).message);
    } finally {
      setIsSavingBarcode(false);
    }
  };



  const handleRefreshOrders = async () => {
    if (!onRefreshOrders) return;
    setIsRefreshingOrders(true);
    try {
      await onRefreshOrders();
      triggerToast('Fulfillment orders synchronized successfully!');
    } catch (err) {
      console.error('Failed to sync orders:', err);
      alert('Failed to sync orders: ' + (err as Error).message);
    } finally {
      setIsRefreshingOrders(false);
    }
  };

  // Categories Sorter State
  const [sortedCategoriesList, setSortedCategoriesList] = React.useState<string[]>([]);
  const [isSavingCategoriesOrder, setIsSavingCategoriesOrder] = React.useState(false);

  React.useEffect(() => {
    // Generate unique category list from active products, static categories list, and default 'all'
    const uniqueCats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    const staticCats = safeCategoriesList.length > 0
      ? safeCategoriesList.map(c => c.name)
      : [
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
    // Merge all unique categories
    const allUniqueCats = Array.from(new Set(['all', ...uniqueCats, ...staticCats]));

    // Sort according to categoriesOrder prop if set
    if (categoriesOrder && categoriesOrder.length > 0) {
      allUniqueCats.sort((a, b) => {
        const idxA = categoriesOrder.indexOf(a);
        const idxB = categoriesOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b, 'en', { sensitivity: 'base' });
      });
    }
    setSortedCategoriesList(allUniqueCats);
  }, [products, categoriesOrder, safeCategoriesList, activeTab]);

  const moveCategoryUp = (index: number) => {
    if (index <= 0) return;
    setSortedCategoriesList(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const moveCategoryDown = (index: number) => {
    if (index >= sortedCategoriesList.length - 1) return;
    setSortedCategoriesList(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  const moveCategoryToPosition = (index: number, targetPos: number) => {
    const targetIdx = Math.max(0, Math.min(sortedCategoriesList.length - 1, targetPos - 1));
    if (index === targetIdx) return;
    setSortedCategoriesList(prev => {
      const copy = [...prev];
      const [movedItem] = copy.splice(index, 1);
      copy.splice(targetIdx, 0, movedItem);
      return copy;
    });
  };

  const handleSaveCategoriesOrder = async () => {
    setIsSavingCategoriesOrder(true);
    try {
      const { error } = await supabase
        .from('website_settings')
        .upsert({
          key: 'shop_categories_settings',
          value: {
            categories: safeCategoriesList,
            order: sortedCategoriesList
          }
        });
      if (error) throw error;
      if (onUpdateCategoriesOrder) {
        onUpdateCategoriesOrder(sortedCategoriesList);
      }
      if (onUpdateCategoriesList) {
        onUpdateCategoriesList(safeCategoriesList, sortedCategoriesList);
      }
      triggerToast('Category order saved successfully!');
    } catch (err) {
      console.error('Failed to save category order:', err);
      alert('Failed to save category order: ' + (err as Error).message);
    } finally {
      setIsSavingCategoriesOrder(false);
    }
  };

  // Category Actions State
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [editingCategoryName, setEditingCategoryName] = React.useState<string | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = React.useState('');

  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return;
    if (trimmedName.toLowerCase() === 'all') {
      alert('Invalid category name.');
      return;
    }
    
    // Check duplicate
    const exists = safeCategoriesList.some(
      c => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      alert(`Category "${trimmedName}" already exists.`);
      return;
    }

    try {
      const updatedList = [...safeCategoriesList, { name: trimmedName, hidden: false }];
      const updatedOrder = [...sortedCategoriesList.filter(n => n !== 'all'), trimmedName];

      const { error } = await supabase
        .from('website_settings')
        .upsert({
          key: 'shop_categories_settings',
          value: {
            categories: updatedList,
            order: ['all', ...updatedOrder]
          }
        });
      if (error) throw error;

      setNewCategoryName('');
      setSortedCategoriesList(['all', ...updatedOrder]);
      if (onUpdateCategoriesList) {
        onUpdateCategoriesList(updatedList, ['all', ...updatedOrder]);
      }
      triggerToast(`Category "${trimmedName}" added successfully!`);
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Failed to add category: ' + (err as Error).message);
    }
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    const trimmedNew = newName.trim();
    if (!trimmedNew) return;
    if (trimmedNew === oldName) {
      setEditingCategoryName(null);
      return;
    }
    if (trimmedNew.toLowerCase() === 'all') {
      alert('Invalid category name.');
      return;
    }

    // Check duplicate
    const exists = safeCategoriesList.some(
      c => c.name.toLowerCase() === trimmedNew.toLowerCase() && c.name !== oldName
    );
    if (exists) {
      alert(`Category "${trimmedNew}" already exists.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to rename "${oldName}" to "${trimmedNew}"? All existing products in this category will be updated.`)) {
      return;
    }

    try {
      // 1. Update categories settings config
      const updatedList = safeCategoriesList.map(c => c.name === oldName ? { ...c, name: trimmedNew } : c);
      const updatedOrder = sortedCategoriesList.map(name => name === oldName ? trimmedNew : name);

      const { error: settingsError } = await supabase
        .from('website_settings')
        .upsert({
          key: 'shop_categories_settings',
          value: {
            categories: updatedList,
            order: updatedOrder
          }
        });
      if (settingsError) throw settingsError;

      // 2. Update products category values in Supabase website_pooja_products
      const { error: productsError } = await supabase
        .from('website_pooja_products')
        .update({ category: trimmedNew })
        .eq('category', oldName);
      if (productsError) throw productsError;

      // 3. Update local products list state
      setProducts(prev => prev.map(p => p.category === oldName ? { ...p, category: trimmedNew } : p));
      
      // 4. Update local settings states
      setSortedCategoriesList(updatedOrder);
      setEditingCategoryName(null);
      if (onUpdateCategoriesList) {
        onUpdateCategoriesList(updatedList, updatedOrder);
      }
      triggerToast(`Category renamed to "${trimmedNew}" and associated products updated successfully!`);
    } catch (err) {
      console.error('Error renaming category:', err);
      alert('Failed to rename category: ' + (err as Error).message);
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (categoryName === 'all') return;
    if (!window.confirm(`Are you sure you want to delete category "${categoryName}"? All products in this category will be changed to "Uncategorized".`)) {
      return;
    }

    try {
      // 1. Update categories settings config
      const updatedList = safeCategoriesList.filter(c => c.name !== categoryName);
      const updatedOrder = sortedCategoriesList.filter(name => name !== categoryName);

      const { error: settingsError } = await supabase
        .from('website_settings')
        .upsert({
          key: 'shop_categories_settings',
          value: {
            categories: updatedList,
            order: updatedOrder
          }
        });
      if (settingsError) throw settingsError;

      // 2. Update products category values in Supabase website_pooja_products
      const { error: productsError } = await supabase
        .from('website_pooja_products')
        .update({ category: 'Uncategorized' })
        .eq('category', categoryName);
      if (productsError) throw productsError;

      // 3. Update local products list state
      setProducts(prev => prev.map(p => p.category === categoryName ? { ...p, category: 'Uncategorized' } : p));

      // 4. Update local settings states
      setSortedCategoriesList(updatedOrder);
      if (onUpdateCategoriesList) {
        onUpdateCategoriesList(updatedList, updatedOrder);
      }
      triggerToast(`Category "${categoryName}" deleted, and associated products changed to "Uncategorized".`);
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category: ' + (err as Error).message);
    }
  };

  const handleToggleHideCategory = async (categoryName: string) => {
    if (categoryName === 'all') return;

    try {
      const updatedList = safeCategoriesList.map(c => c.name === categoryName ? { ...c, hidden: !c.hidden } : c);

      const { error } = await supabase
        .from('website_settings')
        .upsert({
          key: 'shop_categories_settings',
          value: {
            categories: updatedList,
            order: sortedCategoriesList
          }
        });
      if (error) throw error;

      if (onUpdateCategoriesList) {
        onUpdateCategoriesList(updatedList, sortedCategoriesList);
      }
      triggerToast(`Category "${categoryName}" is now ${updatedList.find(c => c.name === categoryName)?.hidden ? 'hidden' : 'visible'}.`);
    } catch (err) {
      console.error('Error toggling category visibility:', err);
      alert('Failed to toggle visibility: ' + (err as Error).message);
    }
  };

  // Products Sorter State
  const [selectedSorterCategory, setSelectedSorterCategory] = React.useState<string>('all');
  const [sortedProductsList, setSortedProductsList] = React.useState<Product[]>([]);
  const [isSavingProductsOrder, setIsSavingProductsOrder] = React.useState(false);
  const [draggedProductIndex, setDraggedProductIndex] = React.useState<number | null>(null);

  // Available categories list for dropdown selection
  const sorterCategories = React.useMemo(() => {
    const uniqueCats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    const staticCats = safeCategoriesList.length > 0
      ? safeCategoriesList.map(c => c.name)
      : [
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
    const merged = Array.from(new Set(['all', ...uniqueCats, ...staticCats]));
    if (categoriesOrder && categoriesOrder.length > 0) {
      merged.sort((a, b) => {
        const idxA = categoriesOrder.indexOf(a);
        const idxB = categoriesOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b, 'en', { sensitivity: 'base' });
      });
    }
    return merged;
  }, [products, categoriesOrder, safeCategoriesList]);

  // Sync/load products for selected category and sort them by productsOrder prop
  React.useEffect(() => {
    const filtered = products.filter(p => selectedSorterCategory === 'all' || p.category === selectedSorterCategory);
    
    const customOrderList = productsOrder?.[selectedSorterCategory];
    if (customOrderList && customOrderList.length > 0) {
      filtered.sort((a, b) => {
        const idxA = customOrderList.indexOf(a.id);
        const idxB = customOrderList.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return b.popularity - a.popularity;
      });
    } else {
      filtered.sort((a, b) => b.popularity - a.popularity);
    }
    setSortedProductsList(filtered);
  }, [products, selectedSorterCategory, productsOrder, activeTab]);

  const moveProductUp = (index: number) => {
    if (index <= 0) return;
    setSortedProductsList(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const moveProductDown = (index: number) => {
    if (index >= sortedProductsList.length - 1) return;
    setSortedProductsList(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  const moveProductToPosition = (index: number, targetPos: number) => {
    const targetIdx = Math.max(0, Math.min(sortedProductsList.length - 1, targetPos - 1));
    if (index === targetIdx) return;
    setSortedProductsList(prev => {
      const copy = [...prev];
      const [movedItem] = copy.splice(index, 1);
      copy.splice(targetIdx, 0, movedItem);
      return copy;
    });
  };

  // Drag and Drop handlers
  const handleProductDragStart = (e: React.DragEvent, index: number) => {
    setDraggedProductIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleProductDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleProductDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedProductIndex === null || draggedProductIndex === index) return;
    setSortedProductsList(prev => {
      const copy = [...prev];
      const [movedItem] = copy.splice(draggedProductIndex, 1);
      copy.splice(index, 0, movedItem);
      return copy;
    });
    setDraggedProductIndex(null);
  };

  const handleSaveProductsOrder = async () => {
    setIsSavingProductsOrder(true);
    try {
      const updatedOrders = { ...(productsOrder || {}) };
      updatedOrders[selectedSorterCategory] = sortedProductsList.map(p => p.id);

      const { error } = await supabase
        .from('website_settings')
        .upsert({
          key: 'category_products_settings',
          value: {
            orders: updatedOrders
          }
        });
      if (error) throw error;
      if (onUpdateProductsOrder) {
        onUpdateProductsOrder(updatedOrders);
      }
      triggerToast('Product sequence saved successfully!');
    } catch (err) {
      console.error('Failed to save product order:', err);
      alert('Failed to save products order: ' + (err as Error).message);
    } finally {
      setIsSavingProductsOrder(false);
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
  const [isBulkGSTApplying, setIsBulkGSTApplying] = React.useState(false);
  const [isBulkDeliveryApplying, setIsBulkDeliveryApplying] = React.useState(false);

  const handleBulkGSTApply = async () => {
    const selectedIds = Object.keys(selectedPoojaIds).filter(id => selectedPoojaIds[id]);
    if (selectedIds.length === 0) return;
    
    const input = prompt("Enter the GST override percentage (0-100) to apply to selected products:");
    if (input === null) return; // Cancelled
    const pct = parseFloat(input);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      alert("Invalid percentage entered.");
      return;
    }
    
    setIsBulkGSTApplying(true);
    try {
      const { error } = await supabase
        .from('website_pooja_products')
        .update({
          gst_override_enabled: true,
          custom_gst: pct
        })
        .in('id', selectedIds);
      if (error) throw error;
      triggerToast(`Successfully applied ${pct}% GST override to ${selectedIds.length} products!`);
      setSelectedPoojaIds({});
      loadPoojaProducts();
    } catch (err) {
      alert("Bulk application failed: " + (err as Error).message);
    } finally {
      setIsBulkGSTApplying(false);
    }
  };

  const handleBulkDeliveryApply = async () => {
    const selectedIds = Object.keys(selectedPoojaIds).filter(id => selectedPoojaIds[id]);
    if (selectedIds.length === 0) return;
    
    const input = prompt("Enter the custom delivery charge (₹) to apply to selected products:");
    if (input === null) return;
    const cost = parseFloat(input);
    if (isNaN(cost) || cost < 0) {
      alert("Invalid delivery cost entered.");
      return;
    }
    
    setIsBulkDeliveryApplying(true);
    try {
      const { error } = await supabase
        .from('website_pooja_products')
        .update({
          delivery_override_enabled: true,
          custom_delivery: cost
        })
        .in('id', selectedIds);
      if (error) throw error;
      triggerToast(`Successfully applied ₹${cost} delivery override to ${selectedIds.length} products!`);
      setSelectedPoojaIds({});
      loadPoojaProducts();
    } catch (err) {
      alert("Bulk application failed: " + (err as Error).message);
    } finally {
      setIsBulkDeliveryApplying(false);
    }
  };

  const allAvailableProducts = React.useMemo(() => {
    const combined = [...poojaProducts];
    const poojaIds = new Set(combined.map(p => p.id));
    for (const p of products) {
      if (!poojaIds.has(p.id)) {
        combined.push(p as any);
      }
    }
    return combined;
  }, [poojaProducts, products]);

  const activeFeaturedIds = React.useMemo(() => {
    return featuredProductIds.filter(id => allAvailableProducts.some(p => p.id === id)).slice(0, 4);
  }, [featuredProductIds, allAvailableProducts]);

  const activeSaleIds = React.useMemo(() => {
    return saleProductIds.filter(id => allAvailableProducts.some(p => p.id === id)).slice(0, 4);
  }, [saleProductIds, allAvailableProducts]);

  const activeNewArrivalsIds = React.useMemo(() => {
    return newArrivalsProductIds.filter(id => allAvailableProducts.some(p => p.id === id)).slice(0, 4);
  }, [newArrivalsProductIds, allAvailableProducts]);

  const activeCartExploreMoreIds = React.useMemo(() => {
    return cartExploreMoreProductIds.filter(id => allAvailableProducts.some(p => p.id === id));
  }, [cartExploreMoreProductIds, allAvailableProducts]);

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
    ],
    testimonials: [],
    uiLabels: { reviewsHidden: 'false' }
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
          spiritualType: getSpiritualTypeForProduct(item.name, item.category, item.tags, item.spiritual_type),
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
          gstOverrideEnabled: item.gst_override_enabled || false,
          customGst: item.custom_gst !== undefined && item.custom_gst !== null ? parseFloat(item.custom_gst.toString()) : undefined,
          deliveryOverrideEnabled: item.delivery_override_enabled || false,
          customDelivery: item.custom_delivery !== undefined && item.custom_delivery !== null ? parseFloat(item.custom_delivery.toString()) : undefined,
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
    if (activeTab === 'pooja_products' || activeTab === 'homepage_editor' || activeTab === 'coupons') {
      loadPoojaProducts();
    }
  }, [activeTab]);

  const loadCoupons = async () => {
    setIsLoadingCoupons(true);
    try {
      const { data, error } = await supabase
        .from('website_store_coupons')
        .select(`
          *,
          product:product_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setCoupons(data);
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setIsLoadingCoupons(false);
    }
  };

  const loadRedemptions = async () => {
    try {
      const { data, error } = await supabase
        .from('website_store_coupon_redemptions')
        .select(`
          id,
          order_id,
          created_at,
          coupon:coupon_id (code, discount_percent),
          user:user_id (full_name, email, phone_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setRedemptions(data);
    } catch (err) {
      console.error('Error fetching coupon redemptions:', err);
    }
  };

  const loadAffiliates = async () => {
    setIsLoadingAffiliates(true);
    try {
      const { data, error } = await supabase
        .from('website_store_users')
        .select('id, full_name, email, phone_number, affiliate_code, affiliate_status, affiliate_joined_at')
        .neq('affiliate_status', 'inactive')
        .order('affiliate_joined_at', { ascending: false });

      if (error) throw error;
      if (data) setAffiliates(data);
    } catch (err) {
      console.error('Error fetching affiliates:', err);
    } finally {
      setIsLoadingAffiliates(false);
    }
  };

  const loadPundits = async () => {
    setIsLoadingPundits(true);
    try {
      const { data, error } = await supabase
        .from('website_store_users')
        .select('id, full_name, email, phone_number, affiliate_code, affiliate_status, affiliate_joined_at, is_pundit')
        .eq('is_pundit', true)
        .order('affiliate_joined_at', { ascending: false });

      if (error) throw error;
      if (data) setPundits(data);
    } catch (err) {
      console.error('Error fetching pundits:', err);
    } finally {
      setIsLoadingPundits(false);
    }
  };

  const handleCreatePundit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPunditError('');
    setPunditCreationResult(null);

    if (!newPunditName.trim() || !newPunditPhone.trim() || !newPunditPassword.trim()) {
      setPunditError('Please fill out all Shastri details.');
      return;
    }

    setIsCreatingPundit(true);
    try {
      let cleanedPhone = newPunditPhone.replace(/[^\d]/g, '');
      if (cleanedPhone.startsWith('966')) {
        cleanedPhone = cleanedPhone.substring(3);
      }
      if (cleanedPhone.startsWith('05') && cleanedPhone.length === 10) {
        cleanedPhone = '+966' + cleanedPhone.substring(1);
      } else if (cleanedPhone.startsWith('5') && cleanedPhone.length === 9) {
        cleanedPhone = '+966' + cleanedPhone;
      } else if (cleanedPhone.length >= 10) {
        cleanedPhone = cleanedPhone.slice(-10);
      }

      if (cleanedPhone.length < 9) {
        throw new Error('Please enter a valid phone number.');
      }

      const hashedPw = await hashPassword(newPunditPassword);
      const adminToken = adminSession?.token || localStorage.getItem('session_token') || '260529';
      
      const { data, error } = await supabase.rpc('admin_create_pundit', {
        p_admin_token: adminToken,
        p_full_name: newPunditName.trim(),
        p_phone_number: cleanedPhone,
        p_password_hash: hashedPw
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setPunditCreationResult({
          name: newPunditName.trim(),
          phone: cleanedPhone,
          password: newPunditPassword,
          code: data[0].affiliate_code,
          url: `${window.location.origin}/pundit-login`
        });
        setNewPunditName('');
        setNewPunditPhone('');
        setNewPunditPassword('');
        loadPundits();
      }
    } catch (err) {
      console.error(err);
      setPunditError((err as Error).message);
    } finally {
      setIsCreatingPundit(false);
    }
  };

  const handleResetPunditPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPunditId || !resetPunditPassword.trim()) return;

    setIsResettingPassword(true);
    try {
      const hashedPw = await hashPassword(resetPunditPassword);
      const adminToken = adminSession?.token || localStorage.getItem('session_token') || '260529';

      const { error } = await supabase.rpc('admin_update_pundit_password', {
        p_admin_token: adminToken,
        p_target_user_id: resetPunditId,
        p_new_password_hash: hashedPw
      });

      if (error) throw error;
      alert('Shastri security password updated successfully!');
      setResetPunditId(null);
      setResetPunditPassword('');
    } catch (err) {
      console.error(err);
      alert('Password reset failed: ' + (err as Error).message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleUpdateAffiliateStatus = async (targetUserId: string, newStatus: string) => {
    const adminToken = adminSession?.token || localStorage.getItem('session_token') || '260529'; // session token fallback
    
    setIsUpdatingAffiliateStatus(targetUserId);
    try {
      const { data, error } = await supabase.rpc('admin_set_affiliate_status', {
        p_admin_token: adminToken,
        p_target_user_id: targetUserId,
        p_new_status: newStatus
      });

      if (error) throw error;
      
      if (data) {
        triggerToast(`Devotee status updated to ${newStatus} successfully!`);
        // Refresh local state list
        setAffiliates(prev => prev.map(aff => {
          if (aff.id === targetUserId) {
            return { ...aff, affiliate_status: newStatus };
          }
          return aff;
        }));
      }
    } catch (err) {
      console.error('Failed to update affiliate status:', err);
      alert('Error updating affiliate status: ' + (err as Error).message);
    } finally {
      setIsUpdatingAffiliateStatus(null);
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('website_store_users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setUsersState(data);
    } catch (err) {
      console.error('Error loading users:', err);
      alert('Failed to load devotee directory: ' + (err as Error).message);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleToggleSuspendUser = async (userId: string, currentSuspended: boolean) => {
    setIsSuspendingUser(userId);
    try {
      const newSuspended = !currentSuspended;
      const { error } = await supabase
        .from('website_store_users')
        .update({ is_suspended: newSuspended })
        .eq('id', userId);
      if (error) throw error;
      
      // Update local state
      setUsersState(prev => prev.map(user => user.id === userId ? { ...user, is_suspended: newSuspended } : user));
      triggerToast(`Devotee account ${newSuspended ? 'suspended' : 'activated'} successfully!`);
    } catch (err) {
      console.error('Error updating user status:', err);
      alert('Failed to update suspension status: ' + (err as Error).message);
    } finally {
      setIsSuspendingUser(null);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    const confirm = window.confirm(`Are you absolutely sure you want to delete devotee "${name}"? This action will permanently remove their profile, all their orders, session tokens, address books, and affiliate data. This cannot be undone.`);
    if (!confirm) return;

    setIsDeletingUser(userId);
    try {
      const adminToken = adminSession?.token || localStorage.getItem('session_token') || '260529';
      const { data, error } = await supabase.rpc('admin_delete_user_cascade', {
        p_admin_token: adminToken,
        p_target_user_id: userId
      });
      
      if (error) throw error;

      if (data) {
        setUsersState(prev => prev.filter(user => user.id !== userId));
        triggerToast(`Devotee account "${name}" and all associated data deleted successfully!`);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete devotee account: ' + (err as Error).message);
    } finally {
      setIsDeletingUser(null);
    }
  };

  const loadAffiliateLevels = async () => {
    setIsLoadingLevels(true);
    const adminToken = adminSession?.token || localStorage.getItem('session_token') || '260529';
    try {
      const { data, error } = await supabase.rpc('admin_get_all_affiliate_levels', {
        p_admin_token: adminToken
      });
      if (error) throw error;
      if (data) setAffiliateLevels(data);
    } catch (err) {
      console.error('Error fetching affiliate levels:', err);
    } finally {
      setIsLoadingLevels(false);
    }
  };

  const loadAffiliateSettings = async () => {
    setIsLoadingAffiliateSettings(true);
    const adminToken = adminSession?.token || localStorage.getItem('session_token') || '260529';
    try {
      const { data, error } = await supabase.rpc('admin_get_all_affiliate_settings', {
        p_admin_token: adminToken
      });
      if (error) throw error;
      if (data) {
        const settingsMap: Record<string, any> = {};
        data.forEach((item: any) => {
          settingsMap[item.key] = item.value;
        });

        // Extract min_withdrawal_amount from payout_rules
        let minWithdrawal = 1000;
        if (settingsMap.payout_rules && settingsMap.payout_rules.min_withdrawal_amount !== undefined) {
          minWithdrawal = parseFloat(settingsMap.payout_rules.min_withdrawal_amount);
        }

        setAffiliateSettings(prev => ({ 
          ...prev, 
          ...settingsMap,
          affiliate_min_withdrawal: minWithdrawal
        }));
      }
    } catch (err) {
      console.error('Error fetching affiliate settings:', err);
    } finally {
      setIsLoadingAffiliateSettings(false);
    }
  };

  const loadWithdrawals = async () => {
    setIsLoadingWithdrawals(true);
    const adminToken = adminSession?.token || localStorage.getItem('session_token') || '260529';
    try {
      const { data, error } = await supabase.rpc('admin_get_all_withdrawals', {
        p_admin_token: adminToken
      });
      if (error) throw error;
      if (data) setWithdrawals(data);
    } catch (err) {
      console.error('Error fetching withdrawals queue:', err);
    } finally {
      setIsLoadingWithdrawals(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAffiliateSettings(true);
    const adminToken = adminSession?.token || localStorage.getItem('session_token') || '260529';
    try {
      const maxDepth = parseInt(affiliateSettings.affiliate_max_depth, 10);
      if (isNaN(maxDepth) || maxDepth < 1 || maxDepth > 10) {
        alert('Maximum payout depth must be a number between 1 and 10.');
        setIsSavingAffiliateSettings(false);
        return;
      }

      const minWithdrawal = parseFloat(affiliateSettings.affiliate_min_withdrawal);
      if (isNaN(minWithdrawal) || minWithdrawal <= 0) {
        alert('Minimum withdrawal amount must be a positive number.');
        setIsSavingAffiliateSettings(false);
        return;
      }
      
      const { data, error } = await supabase.rpc('admin_save_affiliate_settings', {
        p_admin_token: adminToken,
        p_max_depth: maxDepth,
        p_enabled: affiliateSettings.affiliate_enabled,
        p_commission_model: affiliateSettings.affiliate_commission_model,
        p_min_withdrawal: minWithdrawal
      });
      if (error) throw error;
      if (data) {
        triggerToast('Global settings updated successfully!');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Error: ' + (err as Error).message);
    } finally {
      setIsSavingAffiliateSettings(false);
    }
  };

  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLevel) return;
    setIsSavingLevel(true);
    const adminToken = adminSession?.token || localStorage.getItem('session_token') || '260529';
    try {
      const levelNum = parseInt(editingLevel.level_number, 10);
      const rate = parseFloat(editingLevel.commission_percentage);
      if (isNaN(levelNum) || levelNum < 1 || levelNum > 20) {
        alert('Level number must be between 1 and 20.');
        setIsSavingLevel(false);
        return;
      }
      if (isNaN(rate) || rate < 0 || rate > 100) {
        alert('Commission rate must be between 0% and 100%.');
        setIsSavingLevel(false);
        return;
      }

      const { data, error } = await supabase.rpc('admin_save_affiliate_level', {
        p_admin_token: adminToken,
        p_level_number: levelNum,
        p_commission_percentage: rate,
        p_enabled: editingLevel.enabled
      });
      if (error) throw error;
      if (data) {
        triggerToast(`Tier "${getLevelName(levelNum)}" saved successfully!`);
        setEditingLevel(null);
        loadAffiliateLevels();
      }
    } catch (err) {
      console.error('Failed to save tier level:', err);
      alert('Error: ' + (err as Error).message);
    } finally {
      setIsSavingLevel(false);
    }
  };

  const handleDeleteLevel = async (levelNumber: number) => {
    if (!confirm(`Are you sure you want to delete Tier "${getLevelName(levelNumber)}"?`)) return;
    setIsDeletingLevel(levelNumber);
    const adminToken = adminSession?.token || localStorage.getItem('session_token') || '260529';
    try {
      const { data, error } = await supabase.rpc('admin_delete_affiliate_level', {
        p_admin_token: adminToken,
        p_level_number: levelNumber
      });
      if (error) throw error;
      if (data) {
        triggerToast(`Tier "${getLevelName(levelNumber)}" deleted.`);
        loadAffiliateLevels();
      }
    } catch (err) {
      console.error('Failed to delete tier:', err);
      alert('Error: ' + (err as Error).message);
    } finally {
      setIsDeletingLevel(null);
    }
  };

  const handleApproveWithdrawal = async (requestId: string) => {
    if (!confirm('Are you sure you want to approve this withdrawal request?')) return;
    setIsProcessingWithdrawal(requestId);
    const adminToken = adminSession?.token || localStorage.getItem('session_token') || '260529';
    try {
      const { data, error } = await supabase.rpc('admin_approve_withdrawal', {
        p_admin_token: adminToken,
        p_request_id: requestId
      });
      if (error) throw error;
      if (data) {
        triggerToast('Withdrawal request approved successfully!');
        loadWithdrawals();
      }
    } catch (err) {
      console.error('Failed to approve withdrawal:', err);
      alert('Error: ' + (err as Error).message);
    } finally {
      setIsProcessingWithdrawal(null);
    }
  };

  const handleRejectWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingWithdrawalId || !rejectReason.trim()) return;
    setIsProcessingWithdrawal(rejectingWithdrawalId);
    const adminToken = adminSession?.token || localStorage.getItem('session_token') || '260529';
    try {
      const { data, error } = await supabase.rpc('admin_reject_withdrawal', {
        p_admin_token: adminToken,
        p_request_id: rejectingWithdrawalId,
        p_reason: rejectReason.trim()
      });
      if (error) throw error;
      if (data) {
        triggerToast('Withdrawal request rejected and balance returned.');
        setRejectingWithdrawalId(null);
        setRejectReason('');
        loadWithdrawals();
      }
    } catch (err) {
      console.error('Failed to reject withdrawal:', err);
      alert('Error: ' + (err as Error).message);
    } finally {
      setIsProcessingWithdrawal(null);
    }
  };

  const handleMarkWithdrawalPaidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnInputId || !txnRefNumber.trim()) return;
    setIsProcessingWithdrawal(txnInputId);
    const adminToken = adminSession?.token || localStorage.getItem('session_token') || '260529';
    try {
      const { data, error } = await supabase.rpc('admin_mark_withdrawal_paid', {
        p_admin_token: adminToken,
        p_request_id: txnInputId,
        p_txn_id: txnRefNumber.trim()
      });
      if (error) throw error;
      if (data) {
        triggerToast('Withdrawal marked as paid successfully!');
        setTxnInputId(null);
        setTxnRefNumber('');
        loadWithdrawals();
      }
    } catch (err) {
      console.error('Failed to mark withdrawal as paid:', err);
      alert('Error: ' + (err as Error).message);
    } finally {
      setIsProcessingWithdrawal(null);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newCouponCode.trim().toUpperCase();
    if (!code) {
      alert('Please enter a coupon code.');
      return;
    }
    if (newDiscountPercent < 1 || newDiscountPercent > 100) {
      alert('Discount must be between 1% and 100%.');
      return;
    }

    setIsCreatingCoupon(true);
    try {
      const limitVal = newUserLimit.trim() === '' ? null : parseInt(newUserLimit.trim(), 10);
      const productVal = newProductId.trim() === '' ? null : newProductId.trim();

      const { error } = await supabase
        .from('website_store_coupons')
        .insert({
          code,
          discount_percent: newDiscountPercent,
          user_limit: limitVal,
          product_id: productVal,
          redemptions_count: 0
        });

      if (error) {
        if (error.code === '23505') {
          alert(`Coupon code "${code}" already exists.`);
        } else {
          throw error;
        }
        return;
      }

      triggerToast(`Successfully created coupon code: ${code}`);
      setNewCouponCode('');
      setNewUserLimit('');
      setNewProductId('');
      loadCoupons();
    } catch (err) {
      console.error('Error creating coupon:', err);
      alert('Failed to create coupon: ' + (err as Error).message);
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (window.confirm(`Are you sure you want to delete coupon code "${code}"?`)) {
      try {
        const { error } = await supabase
          .from('website_store_coupons')
          .delete()
          .eq('id', id);

        if (error) throw error;

        triggerToast(`Successfully deleted coupon code: ${code}`);
        loadCoupons();
        loadRedemptions();
      } catch (err) {
        console.error('Error deleting coupon:', err);
        alert('Failed to delete coupon: ' + (err as Error).message);
      }
    }
  };

  React.useEffect(() => {
    if (activeTab === 'coupons') {
      loadCoupons();
      loadRedemptions();
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab === 'affiliates') {
      loadAffiliates();
      loadAffiliateLevels();
      loadAffiliateSettings();
      loadWithdrawals();
      loadPundits();
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
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
      const finalProduct = await processPendingUploads(editingPoojaProduct);
      
      const slugVal = finalProduct.slug || finalProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const idVal = finalProduct.id || `pooja-${Date.now()}`;
      
      const dbPayload = {
        id: idVal,
        name: finalProduct.name,
        sanskrit_name: finalProduct.sanskritName || null,
        short_name: finalProduct.shortName || null,
        slug: slugVal,
        category: finalProduct.category || 'Rudraksha',
        subtitle: finalProduct.subtitle || null,
        short_description: finalProduct.shortDescription || null,
        description: finalProduct.description || '',
        spiritual_significance: finalProduct.spiritualSignificance || null,
        material: finalProduct.material || null,
        weight: finalProduct.weight || null,
        dimensions: finalProduct.dimensions || null,
        origin: finalProduct.origin || null,
        custom_icons: finalProduct.customIcons || {},
        booking_instructions: finalProduct.bookingInstructions || null,
        duration: finalProduct.duration || null,
        temple_association: finalProduct.templeAssociation || null,
        who_should_perform: finalProduct.whoShouldPerform || null,
        
        rituals_included: finalProduct.ritualsIncluded,
        samagri_list: finalProduct.samagriList,
        priest_details: finalProduct.priestDetails,
        testimonials: finalProduct.testimonials || [],
        faqs: finalProduct.faqs,
        cta_labels: finalProduct.ctaLabels || { primary: 'Book Now', secondary: 'Learn More' },
        og_data: finalProduct.ogData || { title: '', description: '', image: '' },
        schema_markup: finalProduct.schemaMarkup || {},
        
        tags: finalProduct.idealOccasions || [],
        benefits: finalProduct.benefits || [],
        ideal_occasions: finalProduct.idealOccasions || [],
        offers: finalProduct.offers || [],
        badges: finalProduct.badges || [],
        
        image: (finalProduct.galleryImages && finalProduct.galleryImages.length > 0)
          ? finalProduct.galleryImages[0].url
          : (finalProduct.image || '📿'),
        banner_image: finalProduct.bannerImage || null,
        gallery_images: finalProduct.galleryImages || [],
        ritual_images: finalProduct.ritualImages || [],
        priest_image: finalProduct.priestImage || null,
        certificates: finalProduct.certificates,
        icon_image: finalProduct.iconImage || null,
        promo_creatives: finalProduct.promoCreatives || [],
        related_products: finalProduct.relatedProducts || null,
        
        price: parseFloat(finalProduct.price.toString()),
        original_price: finalProduct.originalPrice ? parseFloat(finalProduct.originalPrice.toString()) : null,
        rating: finalProduct.rating || 4.8,
        reviews_count: finalProduct.testimonials ? finalProduct.testimonials.length : (finalProduct.reviewsCount || 0),
        is_featured: finalProduct.isFeatured || false,
        is_trending: finalProduct.isTrending || false,
        in_stock: finalProduct.inStock ?? true,
        is_published: finalProduct.isPublished || false,
        published_at: finalProduct.publishedAt || null,
        ui_labels: finalProduct.uiLabels || {},
        translations: finalProduct.translations || {},
        video_url: finalProduct.videoUrl || null,
        purchase_limit: finalProduct.purchaseLimit ? parseInt(finalProduct.purchaseLimit.toString(), 10) : null,
        gst_override_enabled: finalProduct.gstOverrideEnabled || false,
        custom_gst: finalProduct.gstOverrideEnabled ? (finalProduct.customGst !== undefined && finalProduct.customGst !== null ? parseFloat(finalProduct.customGst.toString()) : null) : null,
        delivery_override_enabled: finalProduct.deliveryOverrideEnabled || false,
        custom_delivery: finalProduct.deliveryOverrideEnabled ? (finalProduct.customDelivery !== undefined && finalProduct.customDelivery !== null ? parseFloat(finalProduct.customDelivery.toString()) : null) : null
      };

      if (isNewPoojaProduct) {
        const insertPayload = { ...dbPayload } as any;
        delete insertPayload.id;
        const { error } = await supabase
          .from('website_pooja_products')
          .insert([insertPayload]);
        if (error) throw error;
        triggerToast('New Pooja product inserted successfully!');
      } else {
        const { error } = await supabase
          .from('website_pooja_products')
          .update(dbPayload)
          .eq('id', finalProduct.id);
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
        const targetProd = poojaProducts.find(p => p.id === id);
        if (targetProd) {
          const urlsToDelete: string[] = [];
          if (targetProd.image) urlsToDelete.push(targetProd.image);
          if (targetProd.bannerImage) urlsToDelete.push(targetProd.bannerImage);
          if (targetProd.videoUrl) urlsToDelete.push(targetProd.videoUrl);
          if (targetProd.priestImage) urlsToDelete.push(targetProd.priestImage);
          if (targetProd.iconImage) urlsToDelete.push(targetProd.iconImage);
          
          if (Array.isArray(targetProd.galleryImages)) {
            targetProd.galleryImages.forEach((img: any) => {
              if (img && img.url) urlsToDelete.push(img.url);
            });
          }
          if (Array.isArray(targetProd.ritualImages)) {
            targetProd.ritualImages.forEach((img: any) => {
              if (img && img.url) urlsToDelete.push(img.url);
            });
          }
          if (targetProd.customIcons) {
            Object.values(targetProd.customIcons).forEach((url: any) => {
              if (typeof url === 'string') urlsToDelete.push(url);
            });
          }
          
          if (Array.isArray(targetProd.testimonials)) {
            targetProd.testimonials.forEach((testi: any) => {
              if (Array.isArray(testi.imageUrls)) {
                testi.imageUrls.forEach((url: string) => urlsToDelete.push(url));
              } else if (testi.imageUrl) {
                urlsToDelete.push(testi.imageUrl);
              }
              if (Array.isArray(testi.videoUrls)) {
                testi.videoUrls.forEach((url: string) => urlsToDelete.push(url));
              } else if (testi.videoUrl) {
                urlsToDelete.push(testi.videoUrl);
              }
            });
          }

          console.log(`[Delete Flow] Deleting ${urlsToDelete.length} assets from R2 for product ${name}`);
          await Promise.all(urlsToDelete.map(url => deleteFromR2(url).catch(e => console.error(e))));
        }

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

  const handleDuplicatePoojaProduct = async (product: PoojaProduct) => {
    try {
      const clone = { ...product };
      clone.name = `${product.name} (Copy)`;
      clone.slug = `${product.slug}-copy-${Math.floor(Math.random() * 1000)}`;
      clone.isPublished = false; // Start as draft (hidden)
      
      const dbPayload = {
        name: clone.name,
        sanskrit_name: clone.sanskritName || null,
        short_name: clone.shortName || null,
        slug: clone.slug,
        category: clone.category || 'Rudraksha',
        subtitle: clone.subtitle || null,
        short_description: clone.shortDescription || null,
        description: clone.description || '',
        spiritual_significance: clone.spiritualSignificance || null,
        material: clone.material || null,
        weight: clone.weight || null,
        dimensions: clone.dimensions || null,
        origin: clone.origin || null,
        custom_icons: (clone as any).customIcons || {},
        booking_instructions: clone.bookingInstructions || null,
        duration: clone.duration || null,
        temple_association: clone.templeAssociation || null,
        who_should_perform: clone.whoShouldPerform || null,
        
        rituals_included: clone.ritualsIncluded || [],
        samagri_list: clone.samagriList || [],
        priest_details: clone.priestDetails || { name: '', experience: '', bio: '', qualification: '' },
        testimonials: clone.testimonials || [],
        faqs: clone.faqs || [],
        cta_labels: clone.ctaLabels || { primary: 'Book Now', secondary: 'Learn More' },
        og_data: {
          title: clone.ogData?.title || '',
          description: clone.ogData?.description || '',
          image: ''
        },
        schema_markup: clone.schemaMarkup || {},
        
        tags: clone.idealOccasions || [],
        benefits: clone.benefits || [],
        ideal_occasions: clone.idealOccasions || [],
        offers: clone.offers || [],
        badges: clone.badges || [],
        
        image: '📿',
        banner_image: null,
        gallery_images: [],
        ritual_images: [],
        priest_image: null,
        certificates: [],
        icon_image: null,
        promo_creatives: [],
        related_products: clone.relatedProducts || null,
        
        price: parseFloat(clone.price.toString()),
        original_price: clone.originalPrice ? parseFloat(clone.originalPrice.toString()) : null,
        rating: clone.rating || 4.8,
        reviews_count: clone.reviewsCount || 0,
        is_featured: clone.isFeatured || false,
        is_trending: clone.isTrending || false,
        in_stock: clone.inStock ?? true,
        is_published: false,
        published_at: null,
        ui_labels: clone.uiLabels || {},
        translations: clone.translations || {},
        video_url: null,
        purchase_limit: clone.purchaseLimit || null,
        gst_override_enabled: clone.gstOverrideEnabled || false,
        custom_gst: clone.customGst !== undefined && clone.customGst !== null ? parseFloat(clone.customGst.toString()) : null,
        delivery_override_enabled: clone.deliveryOverrideEnabled || false,
        custom_delivery: clone.customDelivery !== undefined && clone.customDelivery !== null ? parseFloat(clone.customDelivery.toString()) : null
      };

      const { error } = await supabase
        .from('website_pooja_products')
        .insert([dbPayload]);

      if (error) throw error;
      triggerToast(`Product "${product.name}" duplicated successfully as draft!`);
      loadPoojaProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to duplicate product: ' + (err as Error).message);
    }
  };

  const handleTogglePublishPoojaProduct = async (id: string, currentPublished: boolean, name: string) => {
    try {
      const newPublished = !currentPublished;
      const { error } = await supabase
        .from('website_pooja_products')
        .update({ 
          is_published: newPublished,
          published_at: newPublished ? new Date().toISOString() : null
        })
        .eq('id', id);
      
      if (error) throw error;
      triggerToast(`Product "${name}" is now ${newPublished ? 'Published (visible)' : 'Draft (hidden)'}.`);
      loadPoojaProducts();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${currentPublished ? 'hide' : 'unhide'} product: ` + (err as Error).message);
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
    purchaseLimit: '',
  });

  const categories = React.useMemo(() => {
    if (safeCategoriesList.length === 0) {
      return [
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
    }
    return safeCategoriesList.map(c => c.name);
  }, [safeCategoriesList]);

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
      purchaseLimit: productForm.purchaseLimit ? parseInt(productForm.purchaseLimit, 10) : undefined,
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
      purchaseLimit: '',
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
      purchaseLimit: product.purchaseLimit ? product.purchaseLimit.toString() : '',
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
          benefits: productForm.benefitsInput ? productForm.benefitsInput.split('\n').filter(Boolean) : p.benefits,
          purchaseLimit: productForm.purchaseLimit ? parseInt(productForm.purchaseLimit, 10) : undefined,
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
      purchaseLimit: '',
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

  // Order payment status changes
  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('website_store_orders')
        .update({ payment_status: paymentStatus })
        .eq('order_id', orderId);
      if (error) throw error;
    } catch (err) {
      console.error('Failed to update payment status in Supabase:', err);
    }

    setOrders(prev => prev.map(o => {
      if (o.orderId === orderId) {
        return { ...o, paymentStatus };
      }
      return o;
    }));

    setSelectedOrderDetails(prev => {
      if (prev && prev.orderId === orderId) {
        return { ...prev, paymentStatus };
      }
      return prev;
    });

    triggerToast(`Order #${orderId} payment marked as ${paymentStatus}!`);
  };

  const handleDeclinePayment = async (orderId: string) => {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    const currentCount = order.paymentDeclineCount || 0;
    const newCount = currentCount + 1;
    const isCancelled = newCount >= 3;

    try {
      const updateData: any = {
        payment_status: 'Declined',
        payment_decline_count: newCount
      };
      if (isCancelled) {
        updateData.status = 'Cancelled';
      }

      const { error } = await supabase
        .from('website_store_orders')
        .update(updateData)
        .eq('order_id', orderId);

      if (error) throw error;

      triggerToast(
        isCancelled 
          ? `Order #${orderId} payment declined (Attempt ${newCount}/3). Order has been automatically cancelled!`
          : `Order #${orderId} payment declined (Attempt ${newCount}/3). User notified to re-upload.`
      );
    } catch (err) {
      console.error('Failed to decline payment in Supabase:', err);
      triggerToast('Failed to decline payment. Please try again.');
      return;
    }

    setOrders(prev => prev.map(o => {
      if (o.orderId === orderId) {
        return { 
          ...o, 
          paymentStatus: 'Declined', 
          paymentDeclineCount: newCount,
          status: isCancelled ? 'Cancelled' : o.status
        };
      }
      return o;
    }));

    setSelectedOrderDetails(prev => {
      if (prev && prev.orderId === orderId) {
        return { 
          ...prev, 
          paymentStatus: 'Declined', 
          paymentDeclineCount: newCount,
          status: isCancelled ? 'Cancelled' : prev.status
        };
      }
      return prev;
    });
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
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex' }}>
      
      {/* 1. Left Sidebar Navigation */}
      <aside style={{
        width: '280px',
        backgroundColor: '#1e293b',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.08)',
        zIndex: 50,
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        {/* Brand Header */}
        <div style={{
          padding: '24px 24px 20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={onNavigateToHome}
            title="Navigate to Shop Home"
          >
            <span style={{ fontSize: '1.8rem' }}>🕉️</span>
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.2px', margin: 0, lineHeight: 1.2 }}>
                MANTRA PUJA
              </h1>
              <span style={{ color: 'var(--primary-lime)', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Control Center
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Links */}
        <div style={{
          flexGrow: 1,
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflowY: 'auto'
        }}>
          {[
            { id: 'analytics' as Tab, label: 'Analytics Dashboard', icon: <BarChart3 size={18} /> },
            { id: 'products' as Tab, label: 'Products Catalog', icon: <Package size={18} /> },
            { id: 'pooja_products' as Tab, label: 'Puja Products Manager', icon: <Sparkles size={18} /> },
            { id: 'homepage_editor' as Tab, label: 'Homepage Customizer', icon: <Layout size={18} /> },
            { id: 'shop_banners' as Tab, label: 'Shop Banners', icon: <Upload size={18} /> },
            { id: 'orders' as Tab, label: 'Fulfillment Orders', icon: <ShoppingBag size={18} /> },
            { id: 'settings' as Tab, label: 'Gateway & Store Settings', icon: <Settings size={18} /> },
            { id: 'upi_settings' as Tab, label: 'UPI QR Settings', icon: <QrCode size={18} /> },
            { id: 'categories_editor' as Tab, label: 'Category Manager', icon: <Layers size={18} /> },
            { id: 'products_sorter' as Tab, label: 'Products Sorter', icon: <List size={18} /> },
            { id: 'coupons' as Tab, label: 'Devotional Coupons', icon: <Ticket size={18} /> },
            { id: 'affiliates' as Tab, label: 'Affiliate Partnerships', icon: <User size={18} /> },
            { id: 'users' as Tab, label: 'Devotee Directory', icon: <User size={18} /> }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  border: 'none',
                  backgroundColor: isActive ? 'rgba(132, 204, 22, 0.15)' : 'transparent',
                  color: isActive ? 'var(--primary-lime)' : '#cbd5e1',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '25%',
                    bottom: '25%',
                    width: '4px',
                    borderRadius: '0 4px 4px 0',
                    backgroundColor: 'var(--primary-lime)'
                  }} />
                )}
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer (Session & Log Out) */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          backgroundColor: '#0f172a'
        }}>
          {adminSession && (
            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: 'var(--primary-lime)', borderRadius: '50%', boxShadow: '0 0 6px var(--primary-lime)' }} />
                <span>Admin: <strong style={{ color: '#ffffff' }}>{adminSession.username}</strong></span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '3px' }}>
                Active since {new Date(adminSession.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <LogOut size={14} /> Log Out
            </button>
          )}
        </div>
      </aside>

      {/* 2. Right Workspace Content Area */}
      <main style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        overflowX: 'hidden'
      }}>
        {/* Top Header Navbar */}
        <header style={{
          height: '70px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-light)',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
          {/* Active section title */}
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', textTransform: 'capitalize' }}>
              {activeTab.replace('_', ' ')}
            </h2>
          </div>

          {/* Quick actions (Search & Buttons) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Search filter in top navbar (if relevant) */}
            {activeTab !== 'analytics' && activeTab !== 'homepage_editor' && activeTab !== 'settings' && activeTab !== 'shop_banners' && (
              <div style={{ position: 'relative', width: '260px' }}>
                <input
                  type="text"
                  placeholder={activeTab === 'products' ? "Search products..." : "Search Order ID..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    outline: 'none',
                    fontSize: '0.82rem',
                    backgroundColor: '#f8fafc'
                  }}
                />
                <Search size={14} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
              </div>
            )}

            <button
              onClick={onNavigateToShop}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                backgroundColor: '#ffffff',
                color: 'var(--text-dark)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <ExternalLink size={14} /> Shop Home
            </button>

            {(activeTab === 'products' || activeTab === 'pooja_products') && (
              <button
                onClick={() => {
                  if (activeTab === 'pooja_products') {
                    // Open Pooja Product editor modal in creation mode
                    setEditingPoojaProduct({
                      id: `pooja-${Date.now()}`,
                      name: '',
                      description: '',
                      price: 0,
                      image: '📿',
                      category: 'Rudraksha',
                      benefits: [],
                      inStock: true,
                      isPublished: false,
                      spiritualType: 'Rituals',
                    });
                    setIsNewPoojaProduct(true);
                  } else {
                    setEditingProduct(null);
                    setShowAddProductModal(true);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--primary-forest)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Plus size={14} /> Add Product
              </button>
            )}
          </div>
        </header>

        {/* Content Box */}
        <div style={{ padding: '32px', flexGrow: 1, overflowY: 'auto' }}>
        
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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

              {onRefreshOrders && (
                <button
                  onClick={handleRefreshOrders}
                  disabled={isRefreshingOrders}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: 'var(--primary-lime-light)',
                    border: '1.5px solid var(--primary-lime)',
                    color: 'var(--primary-lime)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: isRefreshingOrders ? 'not-allowed' : 'pointer',
                    opacity: isRefreshingOrders ? 0.75 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <RefreshCw
                    size={14}
                    style={{
                      animation: isRefreshingOrders ? 'spin 1s linear infinite' : 'none'
                    }}
                  />
                  <span>{isRefreshingOrders ? 'Syncing...' : 'Sync Orders'}</span>
                </button>
              )}
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
                          <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Payment Status</span>
                          <span style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            backgroundColor: order.paymentStatus === 'Confirmed' ? '#dcfce7' : '#fee2e2',
                            color: order.paymentStatus === 'Confirmed' ? '#15803d' : '#dc2626',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            textTransform: 'uppercase',
                            display: 'inline-block',
                            marginTop: '2px'
                          }}>
                            {order.paymentStatus || 'Pending'}
                          </span>
                        </div>
                        {order.paymentScreenshot && (
                          <div>
                            <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Payment Proof</span>
                            <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center' }}>
                              <img
                                src={order.paymentScreenshot}
                                alt="Proof screenshot thumbnail"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(order.paymentScreenshot, '_blank');
                                }}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  objectFit: 'cover',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-light)',
                                  cursor: 'pointer',
                                  boxShadow: 'var(--shadow-sm)',
                                  transition: 'transform 0.2s'
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                title="Click to view full screen"
                              />
                            </div>
                          </div>
                        )}
                        <div>
                          <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Charged</span>
                          <span style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--primary-forest)' }}>₹{order.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Right: Status Fulfillers */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>FULFILLMENT STATUS</span>
                            {order.paymentMethod === 'Scan & Pay (UPI)' && order.paymentStatus !== 'Confirmed' && (
                              <span style={{ fontSize: '0.62rem', color: '#c2410c', fontWeight: 800, textTransform: 'uppercase' }}>(Locked - Awaiting Payment)</span>
                            )}
                          </div>
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.orderId, e.target.value)}
                            disabled={order.paymentMethod === 'Scan & Pay (UPI)' && order.paymentStatus !== 'Confirmed'}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-md)',
                              border: '1.5px solid var(--border-light)',
                              outline: 'none',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              backgroundColor: order.paymentMethod === 'Scan & Pay (UPI)' && order.paymentStatus !== 'Confirmed' ? '#f3f4f6' : badge.bg,
                              color: order.paymentMethod === 'Scan & Pay (UPI)' && order.paymentStatus !== 'Confirmed' ? '#9ca3af' : badge.text,
                              cursor: order.paymentMethod === 'Scan & Pay (UPI)' && order.paymentStatus !== 'Confirmed' ? 'not-allowed' : 'pointer',
                              opacity: order.paymentMethod === 'Scan & Pay (UPI)' && order.paymentStatus !== 'Confirmed' ? 0.6 : 1
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
                          src={resolveMediaUrl(bannerImages[Math.min(activePreviewSlide, bannerImages.length - 1)])}
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
                    <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '140px', position: 'relative' }}>
                      {showcaseImage ? (
                        <img src={showcaseImage} alt="Showcase Preview" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>Default Altar Image</span>
                      )}
                    </div>
                    {/* 2x2 products grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {Array.from({ length: 4 }).map((_, i) => {
                        const pid = activeFeaturedIds[i];
                        const product = allAvailableProducts.find(p => p.id === pid);
                        if (product) {
                          return (
                            <div key={product.id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '8px', position: 'relative', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '96px', boxSizing: 'border-box', minWidth: 0, overflow: 'hidden' }}>
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
                          <div key={i} style={{ border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-sm)', height: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', boxSizing: 'border-box', minWidth: 0 }}>
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

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '16px' }}>
                    {Array.from({ length: 4 }).map((_, i) => {
                      const pid = activeSaleIds[i];
                      const product = allAvailableProducts.find(p => p.id === pid);
                      if (product) {
                        return (
                          <div key={product.id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '8px', backgroundColor: '#ffffff', position: 'relative', height: '102px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', minWidth: 0, overflow: 'hidden' }}>
                            <span style={{ position: 'absolute', top: '4px', left: '4px', backgroundColor: '#ef4444', color: '#ffffff', fontSize: '0.6rem', fontWeight: 800, padding: '1px 4px', borderRadius: '4px', zIndex: 1 }}>
                              -{saleDiscount}%
                            </span>
                            <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', background: '#f8fafc', borderRadius: '4px', overflow: 'hidden' }}>
                              {isImageUrl(product.image) ? (
                                <img src={getDisplayImageUrl(product.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                product.image || '📿'
                              )}
                            </div>
                            <div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{product.name}</span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-dark)' }}>₹{product.price}</span>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={i} style={{ border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-sm)', height: '102px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', backgroundColor: '#ffffff', boxSizing: 'border-box', minWidth: 0 }}>
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

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '16px' }}>
                    {Array.from({ length: 4 }).map((_, i) => {
                      const pid = activeNewArrivalsIds[i];
                      const product = allAvailableProducts.find(p => p.id === pid);
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
                            justifyContent: 'space-between',
                            minWidth: 0
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
                        <div key={i} style={{ border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-sm)', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', backgroundColor: '#ffffff', minWidth: 0 }}>
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
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                              cursor: 'pointer',
                              color: 'var(--primary-lime)',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              transition: 'all 0.2s',
                              userSelect: 'none',
                              width: 'fit-content'
                            }}
                          >
                            <Upload size={16} />
                            Select slide file to upload
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            id="banner-image-upload"
                            onChange={handleBannerUpload}
                            style={{ display: 'none' }}
                          />
                        </div>
                        {bannerImages.some(img => img.startsWith('temp-media-')) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px', width: '100%', maxWidth: '450px' }}>
                            {bannerImages.filter(img => img.startsWith('temp-media-')).map(tempId => (
                              <CompressionStatusWidget key={tempId} tempId={tempId} mediaQueue={mediaQueue} />
                            ))}
                          </div>
                        )}
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                          <strong>Recommended dimensions:</strong> 1920px (Width) × 460px (Height) or standard aspect ratio (e.g. 16:9). The storefront hero banner renders inside a <strong>fixed 460px height</strong> container.
                        </p>
                      </div>

                      {/* Display of current slides */}
                      {bannerImages.length > 0 && (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Carousel Slides</label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                            {bannerImages.map((banner, index) => (
                              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div
                                  onClick={() => setActivePreviewSlide(index)}
                                  style={{
                                    position: 'relative',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    border: `2px solid ${index === activePreviewSlide ? 'var(--primary-lime)' : 'var(--border-light)'}`,
                                    aspectRatio: '16/9',
                                    backgroundColor: '#e2e8f0',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: index === activePreviewSlide ? '0 0 0 2px rgba(132, 204, 22, 0.2)' : 'none'
                                  }}
                                >
                                  <img src={resolveMediaUrl(banner)} alt={`Slide ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveBanner(index); }}
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
                                      padding: 0,
                                      zIndex: 6
                                    }}
                                    title="Remove Slide"
                                  >
                                    <X size={12} />
                                  </button>
                                  
                                  {/* Reorder Controls */}
                                  <div style={{ position: 'absolute', bottom: '4px', right: '4px', display: 'flex', gap: '3px', zIndex: 6 }}>
                                    {index > 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleMoveBanner(index, 'left'); }}
                                        style={{ border: 'none', background: 'rgba(0,0,0,0.6)', width: '18px', height: '18px', borderRadius: '4px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}
                                        title="Move Slide Left"
                                      >
                                        ◀
                                      </button>
                                    )}
                                    {index < bannerImages.length - 1 && (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleMoveBanner(index, 'right'); }}
                                        style={{ border: 'none', background: 'rgba(0,0,0,0.6)', width: '18px', height: '18px', borderRadius: '4px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}
                                        title="Move Slide Right"
                                      >
                                        ▶
                                      </button>
                                    )}
                                  </div>

                                  <div style={{
                                    position: 'absolute',
                                    bottom: '4px',
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
                                <input
                                  type="text"
                                  placeholder="Redirect URL (e.g. /product)"
                                  value={bannerRedirects[banner] || ''}
                                  onChange={(e) => setBannerRedirects(prev => ({ ...prev, [banner]: e.target.value }))}
                                  style={{
                                    padding: '5px 8px',
                                    fontSize: '0.72rem',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border-light)',
                                    outline: 'none',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                  }}
                                />
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
                              <img src={resolveMediaUrl(showcaseImage)} alt="Showcase Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                                cursor: 'pointer',
                                color: 'var(--primary-lime)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                transition: 'all 0.2s',
                                userSelect: 'none',
                                width: 'fit-content'
                              }}
                            >
                              <Upload size={14} />
                              Upload showcase image
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              id="showcase-image-upload"
                              onChange={handleShowcaseUpload}
                              style={{ display: 'none' }}
                            />
                            {showcaseImage && showcaseImage.startsWith('temp-media-') && (
                              <div style={{ width: '100%', minWidth: '220px', marginTop: '4px' }}>
                                <CompressionStatusWidget tempId={showcaseImage} mediaQueue={mediaQueue} />
                              </div>
                            )}
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
                          {allAvailableProducts
                            .filter(p => !homepageSearchQuery || p.name.toLowerCase().includes(homepageSearchQuery.toLowerCase()))
                            .map((p) => {
                              const checked = activeFeaturedIds.includes(p.id);
                              const isLimitReached = activeFeaturedIds.length >= 4;
                              const isDisabled = !checked && isLimitReached;
                              return (
                                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', cursor: isDisabled ? 'not-allowed' : 'pointer', padding: '6px 8px', borderRadius: '4px', backgroundColor: checked ? '#f0fdf4' : 'transparent', opacity: isDisabled ? 0.5 : 1, transition: 'all 0.1s' }}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={isDisabled}
                                    onChange={() => {
                                      setFeaturedProductIds(prev => {
                                        const cleanPrev = prev.filter(id => allAvailableProducts.some(ap => ap.id === id)).slice(0, 4);
                                        if (cleanPrev.includes(p.id)) return cleanPrev.filter(id => id !== p.id);
                                        if (cleanPrev.length >= 4) return cleanPrev;
                                        return [...cleanPrev, p.id];
                                      });
                                    }}
                                  />
                                  <div style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {isImageUrl(p.image) ? (
                                      <img src={getDisplayImageUrl(p.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <span style={{ fontSize: '1rem' }}>{p.image || '📿'}</span>
                                    )}
                                  </div>
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
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-dark)' }}>Section 2: Flash Sale (Max 4)</h4>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: activeSaleIds.length === 4 ? '#dcfce7' : activeSaleIds.length > 4 ? '#fee2e2' : '#fef3c7',
                        color: activeSaleIds.length === 4 ? '#15803d' : activeSaleIds.length > 4 ? '#b91c1c' : '#b45309'
                      }}>
                        {activeSaleIds.length}/4 Selected
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
                          {allAvailableProducts
                            .filter(p => !homepageSearchQuery || p.name.toLowerCase().includes(homepageSearchQuery.toLowerCase()))
                            .map((p) => {
                              const checked = activeSaleIds.includes(p.id);
                              const isLimitReached = activeSaleIds.length >= 4;
                              const isDisabled = !checked && isLimitReached;
                              return (
                                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', cursor: isDisabled ? 'not-allowed' : 'pointer', padding: '6px 8px', borderRadius: '4px', backgroundColor: checked ? '#f0fdf4' : 'transparent', opacity: isDisabled ? 0.5 : 1, transition: 'all 0.1s' }}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={isDisabled}
                                    onChange={() => {
                                      setSaleProductIds(prev => {
                                        const cleanPrev = prev.filter(id => allAvailableProducts.some(ap => ap.id === id)).slice(0, 4);
                                        if (cleanPrev.includes(p.id)) return cleanPrev.filter(id => id !== p.id);
                                        if (cleanPrev.length >= 4) return cleanPrev;
                                        return [...cleanPrev, p.id];
                                      });
                                    }}
                                  />
                                  <div style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {isImageUrl(p.image) ? (
                                      <img src={getDisplayImageUrl(p.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <span style={{ fontSize: '1rem' }}>{p.image || '📿'}</span>
                                    )}
                                  </div>
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
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-dark)' }}>Section 3: New Arrivals (Max 4)</h4>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: activeNewArrivalsIds.length === 4 ? '#dcfce7' : activeNewArrivalsIds.length > 4 ? '#fee2e2' : '#fef3c7',
                        color: activeNewArrivalsIds.length === 4 ? '#15803d' : activeNewArrivalsIds.length > 4 ? '#b91c1c' : '#b45309'
                      }}>
                        {activeNewArrivalsIds.length}/4 Selected
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
                          {allAvailableProducts
                            .filter(p => !homepageSearchQuery || p.name.toLowerCase().includes(homepageSearchQuery.toLowerCase()))
                            .map((p) => {
                              const checked = activeNewArrivalsIds.includes(p.id);
                              const isLimitReached = activeNewArrivalsIds.length >= 4;
                              const isDisabled = !checked && isLimitReached;
                              return (
                                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', cursor: isDisabled ? 'not-allowed' : 'pointer', padding: '6px 8px', borderRadius: '4px', backgroundColor: checked ? '#f0fdf4' : 'transparent', opacity: isDisabled ? 0.5 : 1, transition: 'all 0.1s' }}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={isDisabled}
                                    onChange={() => {
                                      setNewArrivalsProductIds(prev => {
                                        const cleanPrev = prev.filter(id => allAvailableProducts.some(ap => ap.id === id)).slice(0, 4);
                                        if (cleanPrev.includes(p.id)) return cleanPrev.filter(id => id !== p.id);
                                        if (cleanPrev.length >= 4) return cleanPrev;
                                        return [...cleanPrev, p.id];
                                      });
                                    }}
                                  />
                                  <div style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {isImageUrl(p.image) ? (
                                      <img src={getDisplayImageUrl(p.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <span style={{ fontSize: '1rem' }}>{p.image || '📿'}</span>
                                    )}
                                  </div>
                                  <span style={{ fontWeight: checked ? 700 : 500, color: 'var(--text-dark)' }}>{p.name}</span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 'auto' }}>₹{p.price}</span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cart Drawer Explore More Upselling Section */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-dark)' }}>Cart Drawer: Explore More Upselling Products</h4>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1'
                      }}>
                        {activeCartExploreMoreIds.length} Selected
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Select the products you want to display in the "Explore More" upselling section of the slide-over cart drawer. These items will be shown to users to encourage cross-selling.
                      </p>
                      {/* Products scroll list */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Select items to display in Explore More</label>
                        <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {allAvailableProducts
                            .filter(p => !homepageSearchQuery || p.name.toLowerCase().includes(homepageSearchQuery.toLowerCase()))
                            .map((p) => {
                              const checked = activeCartExploreMoreIds.includes(p.id);
                              return (
                                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', cursor: 'pointer', padding: '6px 8px', borderRadius: '4px', backgroundColor: checked ? '#f0fdf4' : 'transparent', transition: 'all 0.1s' }}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      setCartExploreMoreProductIds(prev => {
                                        const cleanPrev = prev.filter(id => allAvailableProducts.some(ap => ap.id === id));
                                        if (cleanPrev.includes(p.id)) return cleanPrev.filter(id => id !== p.id);
                                        return [...cleanPrev, p.id];
                                      });
                                    }}
                                  />
                                  <div style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {isImageUrl(p.image) ? (
                                      <img src={getDisplayImageUrl(p.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <span style={{ fontSize: '1rem' }}>{p.image || '📿'}</span>
                                    )}
                                  </div>
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
                                <div
                                  key={idx}
                                  onClick={() => setShopBannerPreviewSlide(idx)}
                                  style={{
                                    position: 'relative',
                                    aspectRatio: '16/5',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    border: `2px solid ${idx === shopBannerPreviewSlide ? 'var(--primary-lime)' : 'var(--border-light)'}`,
                                    backgroundColor: '#e2e8f0',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: idx === shopBannerPreviewSlide ? '0 0 0 2px rgba(132, 204, 22, 0.2)' : 'none'
                                  }}
                                >
                                  <img src={resolveMediaUrl(url)} alt={`Main banner ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleShopMainBannerRemove(idx); }}
                                    style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, zIndex: 6 }}
                                    title="Remove"
                                  >
                                    <X size={10} />
                                  </button>
                                  
                                  {/* Reorder Controls */}
                                  <div style={{ position: 'absolute', bottom: '3px', right: '3px', display: 'flex', gap: '2px', zIndex: 6 }}>
                                    {idx > 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleMoveShopBanner(idx, 'left'); }}
                                        style={{ border: 'none', background: 'rgba(0,0,0,0.6)', width: '14px', height: '14px', borderRadius: '3px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem' }}
                                        title="Move slide left"
                                      >
                                        ◀
                                      </button>
                                    )}
                                    {idx < shopMainBanners.length - 1 && (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleMoveShopBanner(idx, 'right'); }}
                                        style={{ border: 'none', background: 'rgba(0,0,0,0.6)', width: '14px', height: '14px', borderRadius: '3px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem' }}
                                        title="Move slide right"
                                      >
                                        ▶
                                      </button>
                                    )}
                                  </div>

                                  <div style={{ position: 'absolute', bottom: '2px', left: '4px', fontSize: '0.5rem', color: '#fff', backgroundColor: 'rgba(0,0,0,0.55)', padding: '1px 3px', borderRadius: '2px', fontWeight: 700 }}>#{idx + 1}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <label
                              htmlFor="shop-main-banner-upload"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '9px 14px', fontSize: '0.82rem', fontWeight: 700,
                                border: '1px dashed var(--primary-lime)', borderRadius: 'var(--radius-md)',
                                color: 'var(--primary-lime)', cursor: 'pointer',
                                backgroundColor: '#ffffff', userSelect: 'none', transition: 'all 0.2s'
                              }}
                            >
                              <Upload size={14} />
                              Add Main Banner Slide
                            </label>
                            <input
                              type="file" id="shop-main-banner-upload" accept="image/*"
                              onChange={handleShopMainBannerUpload}
                              style={{ display: 'none' }}
                            />
                          </div>
                          {shopMainBanners.some(img => img.startsWith('temp-media-')) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px', width: '100%', maxWidth: '450px' }}>
                              {shopMainBanners.filter(img => img.startsWith('temp-media-')).map(tempId => (
                                <CompressionStatusWidget key={tempId} tempId={tempId} mediaQueue={mediaQueue} />
                              ))}
                            </div>
                          )}
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
                                          <img src={resolveMediaUrl(url)} alt={`${cat} ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                                      border: '1px dashed var(--primary-lime)',
                                      borderRadius: 'var(--radius-sm)',
                                      color: 'var(--primary-lime)',
                                      cursor: 'pointer',
                                      backgroundColor: '#ffffff', userSelect: 'none', transition: 'all 0.2s'
                                    }}
                                  >
                                    <Upload size={11} />
                                    {catBanners.length > 0 ? '+ Add Another' : 'Upload Banner'}
                                  </label>
                                  <input
                                    type="file"
                                    id={`cat-banner-upload-${cat.replace(/[^a-z0-9]/gi, '-')}`}
                                    accept="image/*"
                                    onChange={e => handleCategoryBannerUpload(cat, e)}
                                    style={{ display: 'none' }}
                                  />
                                  {catBanners.some(img => img.startsWith('temp-media-')) && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', width: '100%' }}>
                                      {catBanners.filter(img => img.startsWith('temp-media-')).map(tempId => (
                                        <CompressionStatusWidget key={tempId} tempId={tempId} mediaQueue={mediaQueue} />
                                      ))}
                                    </div>
                                  )}
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                      {shopMainBanners.map((url, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div
                            onClick={() => setShopBannerPreviewSlide(idx)}
                            style={{
                              position: 'relative',
                              aspectRatio: '16/5',
                              borderRadius: 'var(--radius-sm)',
                              overflow: 'hidden',
                              border: `2px solid ${idx === shopBannerPreviewSlide ? 'var(--primary-lime)' : 'var(--border-light)'}`,
                              backgroundColor: '#e2e8f0',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: idx === shopBannerPreviewSlide ? '0 0 0 2px rgba(132, 204, 22, 0.2)' : 'none'
                            }}
                          >
                            <img src={resolveMediaUrl(url)} alt={`Slide ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleShopMainBannerRemove(idx); }}
                              style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, zIndex: 6 }}
                              title="Remove slide"
                            >
                              <X size={11} />
                            </button>
                            
                            {/* Reorder Controls */}
                            <div style={{ position: 'absolute', bottom: '4px', right: '4px', display: 'flex', gap: '3px', zIndex: 6 }}>
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleMoveShopBanner(idx, 'left'); }}
                                  style={{ border: 'none', background: 'rgba(0,0,0,0.6)', width: '18px', height: '18px', borderRadius: '4px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}
                                  title="Move Slide Left"
                                >
                                  ◀
                                </button>
                              )}
                              {idx < shopMainBanners.length - 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleMoveShopBanner(idx, 'right'); }}
                                  style={{ border: 'none', background: 'rgba(0,0,0,0.6)', width: '18px', height: '18px', borderRadius: '4px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}
                                  title="Move Slide Right"
                                >
                                  ▶
                                </button>
                              )}
                            </div>

                            <div style={{ position: 'absolute', bottom: '3px', left: '5px', fontSize: '0.55rem', color: '#fff', backgroundColor: 'rgba(0,0,0,0.55)', padding: '1px 4px', borderRadius: '2px', fontWeight: 700 }}>
                              Slide {idx + 1}
                            </div>
                          </div>
                          <input
                            type="text"
                            placeholder="Redirect URL (e.g. /product)"
                            value={shopMainBannerRedirects[url] || ''}
                            onChange={(e) => setShopMainBannerRedirects(prev => ({ ...prev, [url]: e.target.value }))}
                            style={{
                              padding: '5px 8px',
                              fontSize: '0.72rem',
                              borderRadius: '4px',
                              border: '1px solid var(--border-light)',
                              outline: 'none',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}
                          />
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
                        color: 'var(--primary-lime)', cursor: 'pointer',
                        backgroundColor: '#f0fdf4', userSelect: 'none', transition: 'all 0.2s'
                      }}
                    >
                      <Upload size={16} />
                      + Add Banner Slide
                    </label>
                    <input
                      type="file" id="shop-main-banner-upload-tab" accept="image/*"
                      onChange={handleShopMainBannerUpload}
                      style={{ display: 'none' }}
                    />
                    {shopMainBanners.some(img => img.startsWith('temp-media-')) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px', width: '100%', maxWidth: '450px' }}>
                        {shopMainBanners.filter(img => img.startsWith('temp-media-')).map(tempId => (
                          <CompressionStatusWidget key={tempId} tempId={tempId} mediaQueue={mediaQueue} />
                        ))}
                      </div>
                    )}
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                              {catBanners.map((url, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', padding: '6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                                  <div style={{ position: 'relative', width: '50px', height: '32px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#e2e8f0', flexShrink: 0 }}>
                                    <img src={resolveMediaUrl(url)} alt={`${cat} ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Redirect URL (e.g. /product)"
                                    value={shopCategoryBannerRedirects[url] || ''}
                                    onChange={(e) => setShopCategoryBannerRedirects(prev => ({ ...prev, [url]: e.target.value }))}
                                    style={{
                                      flexGrow: 1,
                                      padding: '4px 8px',
                                      fontSize: '0.72rem',
                                      borderRadius: '4px',
                                      border: '1px solid var(--border-light)',
                                      outline: 'none',
                                      minWidth: 0
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleCategoryBannerRemove(cat, idx)}
                                    style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                                    title="Remove"
                                  >
                                    <X size={12} />
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
                              border: '1px dashed var(--primary-lime)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--primary-lime)',
                              cursor: 'pointer',
                              backgroundColor: '#ffffff', userSelect: 'none', transition: 'all 0.2s'
                            }}
                          >
                            <Upload size={12} />
                            {catBanners.length > 0 ? '+ Add More' : 'Upload Banner'}
                          </label>
                          <input
                            type="file"
                            id={inputId}
                            accept="image/*"
                            onChange={e => handleCategoryBannerUpload(cat, e)}
                            style={{ display: 'none' }}
                          />
                          {catBanners.some(img => img.startsWith('temp-media-')) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', width: '100%' }}>
                              {catBanners.filter(img => img.startsWith('temp-media-')).map(tempId => (
                                <CompressionStatusWidget key={tempId} tempId={tempId} mediaQueue={mediaQueue} />
                              ))}
                            </div>
                          )}
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

            {/* Tax & Delivery Settings Card */}
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
                background: 'linear-gradient(90deg, #10b981 0%, var(--primary-lime) 100%)'
              }} />

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
                <div className="flex-center" style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#d1fae5',
                  color: '#10b981'
                }}>
                  <Settings size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                    Tax & Delivery Settings
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Manage global GST rates, default shipping fees, and free-delivery subtotal thresholds.
                  </p>
                </div>
              </div>

              {isLoadingSettings ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading Tax settings...</p>
                </div>
              ) : (
                <form onSubmit={handleSaveTaxDeliverySettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* GST percentage */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Global GST Percent (%) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      placeholder="e.g. 18"
                      value={globalGstPercent}
                      onChange={(e) => setGlobalGstPercent(e.target.value)}
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

                  {/* Shipping Fee */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Default Delivery Charge (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 49"
                      value={globalDeliveryCharge}
                      onChange={(e) => setGlobalDeliveryCharge(e.target.value)}
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

                  {/* Free Delivery Threshold */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Free Delivery Threshold Subtotal (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 999"
                      value={freeDeliveryThreshold}
                      onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
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
                      If the cart subtotal reaches or exceeds this threshold, the delivery charge automatically drops to ₹0.
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSavingTaxDelivery}
                    className="btn-lime"
                    style={{
                      padding: '14px 28px',
                      fontSize: '0.9rem',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      marginTop: '8px',
                      cursor: isSavingTaxDelivery ? 'not-allowed' : 'pointer',
                      opacity: isSavingTaxDelivery ? 0.75 : 1
                    }}
                  >
                    {isSavingTaxDelivery ? 'Saving Settings...' : 'Save Tax & Delivery Settings'}
                  </button>

                </form>
              )}
            </div>

            {/* Bulk Apply Override settings Card */}
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
                background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)'
              }} />

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
                <div className="flex-center" style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#dbeafe',
                  color: '#2563eb'
                }}>
                  <Package size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                    Bulk Product Modifier Tools
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Quickly overwrite GST percentages or delivery charges for all products in the catalog at once.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Bulk GST Apply */}
                <div style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', backgroundColor: '#f9fafb' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-dark)' }}>Bulk Override GST %</h4>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Enter GST % (e.g. 18)"
                      id="bulk-gst-percent-input"
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border-light)',
                        outline: 'none',
                        fontSize: '0.88rem',
                        width: '180px',
                        backgroundColor: '#ffffff',
                        color: 'var(--text-dark)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const input = document.getElementById('bulk-gst-percent-input') as HTMLInputElement;
                        if (!input || input.value === '') {
                          alert('Please enter a percentage value first.');
                          return;
                        }
                        const pct = parseFloat(input.value);
                        if (isNaN(pct) || pct < 0 || pct > 100) {
                          alert('Please enter a valid percentage between 0 and 100.');
                          return;
                        }
                        if (confirm(`Are you sure you want to set custom GST override to ${pct}% for ALL pooja products? This will update all items in the database.`)) {
                          try {
                            const { error } = await supabase
                              .from('website_pooja_products')
                              .update({
                                gst_override_enabled: true,
                                custom_gst: pct
                              })
                              .neq('id', 'placeholder-non-existent-id');
                            
                            if (error) throw error;
                            triggerToast(`Successfully applied ${pct}% GST override to all products!`);
                            loadPoojaProducts();
                          } catch (err) {
                            alert('Bulk update failed: ' + (err as Error).message);
                          }
                        }
                      }}
                      className="btn-lime"
                      style={{ padding: '10px 20px', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      Apply to All Products
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Are you sure you want to REMOVE GST overrides for ALL pooja products? They will revert to inheriting the global GST settings.`)) {
                          try {
                            const { error } = await supabase
                              .from('website_pooja_products')
                              .update({
                                gst_override_enabled: false,
                                custom_gst: null
                              })
                              .neq('id', 'placeholder-non-existent-id');
                            
                            if (error) throw error;
                            triggerToast(`Successfully removed GST overrides from all products!`);
                            loadPoojaProducts();
                          } catch (err) {
                            alert('Reset failed: ' + (err as Error).message);
                          }
                        }
                      }}
                      style={{ padding: '10px 14px', fontSize: '0.85rem', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                    >
                      Clear All Overrides
                    </button>
                  </div>
                </div>

                {/* Bulk Delivery Apply */}
                <div style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', backgroundColor: '#f9fafb' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-dark)' }}>Bulk Override Shipping Fee</h4>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      placeholder="Enter Delivery (e.g. 80)"
                      id="bulk-delivery-charge-input"
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border-light)',
                        outline: 'none',
                        fontSize: '0.88rem',
                        width: '180px',
                        backgroundColor: '#ffffff',
                        color: 'var(--text-dark)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const input = document.getElementById('bulk-delivery-charge-input') as HTMLInputElement;
                        if (!input || input.value === '') {
                          alert('Please enter a delivery charge value first.');
                          return;
                        }
                        const cost = parseFloat(input.value);
                        if (isNaN(cost) || cost < 0) {
                          alert('Please enter a valid positive delivery charge.');
                          return;
                        }
                        if (confirm(`Are you sure you want to set custom delivery override to ₹${cost} for ALL pooja products? This will update all items in the database.`)) {
                          try {
                            const { error } = await supabase
                              .from('website_pooja_products')
                              .update({
                                delivery_override_enabled: true,
                                custom_delivery: cost
                              })
                              .neq('id', 'placeholder-non-existent-id');
                            
                            if (error) throw error;
                            triggerToast(`Successfully applied ₹${cost} delivery override to all products!`);
                            loadPoojaProducts();
                          } catch (err) {
                            alert('Bulk update failed: ' + (err as Error).message);
                          }
                        }
                      }}
                      className="btn-lime"
                      style={{ padding: '10px 20px', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      Apply to All Products
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Are you sure you want to REMOVE delivery overrides for ALL pooja products? They will revert to inheriting the global delivery settings.`)) {
                          try {
                            const { error } = await supabase
                              .from('website_pooja_products')
                              .update({
                                delivery_override_enabled: false,
                                custom_delivery: null
                              })
                              .neq('id', 'placeholder-non-existent-id');
                            
                            if (error) throw error;
                            triggerToast(`Successfully removed delivery overrides from all products!`);
                            loadPoojaProducts();
                          } catch (err) {
                            alert('Reset failed: ' + (err as Error).message);
                          }
                        }
                      }}
                      style={{ padding: '10px 14px', fontSize: '0.85rem', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                    >
                      Clear All Overrides
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* =======================================================
            TAB: DYNAMIC UPI QR SETTINGS
            ======================================================= */}
        {activeTab === 'upi_settings' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '30px',
            alignItems: 'start',
            maxWidth: '1200px',
            margin: '0 auto',
            textAlign: 'left'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '30px'
            }}>
              {/* Left Column: Configurations */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '32px',
                boxShadow: 'var(--shadow-md)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                {/* Top Accent line */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #10b981 0%, var(--primary-lime) 100%)'
                }} />

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div className="flex-center" style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--primary-lime-light)',
                    color: 'var(--primary-lime)'
                  }}>
                    <QrCode size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0 }}>
                      Dynamic UPI Payment Gateway
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Configure the shop's UPI address to dynamically generate payment barcodes for checkout.
                    </p>
                  </div>
                </div>

                {/* Information Callout */}
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>✨</span>
                  <div>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                      Dynamic UPI Integration
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: '#065f46', marginTop: '4px', lineHeight: '1.4' }}>
                      Instead of a static image, the system generates an interactive UPI deep-link encoded into a QR code. When scanned, it automatically pre-fills the exact cart amount and order number in apps like GPay, PhonePe, and Paytm.
                    </p>
                  </div>
                </div>

                {isLoadingSettings ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div className="spinner" style={{
                      width: '32px',
                      height: '32px',
                      border: '3px solid var(--border-light)',
                      borderTopColor: 'var(--primary-lime)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 16px'
                    }} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading Settings...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveBarcodeSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* UPI ID VPA Input */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Receiver UPI ID (VPA) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. name@upi or 7974478098@paytm"
                        value={adminUpiId}
                        onChange={(e) => setAdminUpiId(e.target.value)}
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
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                        Your UPI Virtual Payment Address (e.g. UPI ID from PhonePe, Google Pay, or Paytm) where customer payments will go.
                      </span>
                    </div>

                    <div style={{ borderTop: '1px dashed var(--border-light)', margin: '10px 0' }} />

                    <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>
                      Live Preview Simulator controls
                    </h4>

                    {/* Simulator Inputs */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '140px' }}>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-muted)' }}>
                          Simulated Cart Total (₹)
                        </label>
                        <input
                          type="number"
                          value={previewAmount}
                          onChange={(e) => setPreviewAmount(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            outline: 'none',
                            fontSize: '0.85rem',
                            backgroundColor: '#ffffff'
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: '140px' }}>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-muted)' }}>
                          Simulated Order ID
                        </label>
                        <input
                          type="text"
                          value={previewOrderId}
                          onChange={(e) => setPreviewOrderId(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            outline: 'none',
                            fontSize: '0.85rem',
                            backgroundColor: '#ffffff'
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingBarcode}
                      className="btn-lime"
                      style={{
                        padding: '14px 28px',
                        fontSize: '0.9rem',
                        justifyContent: 'center',
                        borderRadius: 'var(--radius-md)',
                        width: '100%',
                        marginTop: '12px',
                        cursor: isSavingBarcode ? 'not-allowed' : 'pointer',
                        opacity: isSavingBarcode ? 0.75 : 1
                      }}
                    >
                      {isSavingBarcode ? 'Saving UPI Configurations...' : 'Save UPI Configurations'}
                    </button>
                  </form>
                )}
              </div>

              {/* Right Column: Customer Checkout Preview Mockup */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Live Customer Checkout Screen Preview
                </span>

                {/* Mobile Device Container wrapper */}
                <div style={{
                  width: '340px',
                  height: '640px',
                  border: '12px solid #1e293b',
                  borderRadius: '36px',
                  backgroundColor: '#ffffff',
                  boxShadow: 'var(--shadow-xl)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Status Bar */}
                  <div style={{
                    height: '24px',
                    backgroundColor: '#1e293b',
                    padding: '0 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 700
                  }}>
                    <span>10:30 AM</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span>📶</span>
                      <span>🔋</span>
                    </div>
                  </div>

                  {/* Speaker Notch */}
                  <div style={{
                    position: 'absolute',
                    top: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '110px',
                    height: '14px',
                    backgroundColor: '#1e293b',
                    borderRadius: '0 0 10px 10px',
                    zIndex: 10
                  }} />

                  {/* App Screen Content */}
                  <div style={{
                    flexGrow: 1,
                    padding: '24px 16px 16px',
                    backgroundColor: '#f9fafb',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    textAlign: 'left'
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1.2rem' }}>🕉️</span>
                      <div>
                        <h4 style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0 }}>
                          Mantra Puja Shop
                        </h4>
                        <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Secure Checkout</span>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #e5e7eb' }} />

                    {/* Step Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={12} style={{ color: 'var(--primary-lime)' }} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#1f2937' }}>
                        Direct Payment Details (UPI)
                      </span>
                    </div>

                    {/* Amount Card */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--primary-lime-light)',
                      border: '1px solid var(--primary-lime)',
                      textAlign: 'center'
                    }}>
                      <span style={{ fontSize: '0.62rem', color: '#4b5563', fontWeight: 650 }}>Amount to Pay</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary-lime)' }}>
                        ₹{parseFloat(previewAmount || '0').toFixed(2)}
                      </span>
                    </div>

                    {/* QR Code container */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      backgroundColor: '#ffffff',
                      padding: '16px 12px',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      {adminUpiId.trim() && adminUpiId.includes('@') ? (
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`upi://pay?pa=${adminUpiId}&pn=Mantra%20Puja&am=${parseFloat(previewAmount || '0').toFixed(2)}&cu=INR&tn=Order%20${previewOrderId}`)}`} 
                          alt="Dynamic QR Code" 
                          style={{
                            width: '130px',
                            height: '130px',
                            objectFit: 'contain',
                            borderRadius: '4px',
                            border: '1px solid #f3f4f6',
                            padding: '4px',
                            marginBottom: '10px'
                          }}
                        />
                      ) : (
                        <div style={{ width: '130px', height: '130px', backgroundColor: '#fee2e2', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.68rem', color: '#ef4444', textAlign: 'center', fontWeight: 800, padding: '10px' }}>Invalid UPI VPA Configured</span>
                        </div>
                      )}

                      <span style={{
                        fontSize: '0.58rem',
                        fontWeight: 800,
                        color: 'var(--primary-lime)',
                        backgroundColor: 'var(--primary-lime-light)',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '8px'
                      }}>
                        Scan to Pay
                      </span>

                      {/* VPA Display & copy */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#f9fafb',
                        padding: '5px 8px',
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb',
                        width: '100%',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.5rem', color: '#9ca3af', fontWeight: 700 }}>UPI ID</span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#374151', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                            {adminUpiId}
                          </span>
                        </div>
                        <button type="button" style={{
                          backgroundColor: 'var(--primary-lime)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '4px 6px',
                          borderRadius: '3px',
                          fontSize: '0.55rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}>
                          Copy
                        </button>
                      </div>
                    </div>

                    {/* Screenshot uploader container */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#374151' }}>
                        Upload Screenshot proof *
                      </span>
                      <div style={{
                        border: '1.5px dashed #d1d5db',
                        borderRadius: '6px',
                        padding: '12px',
                        textAlign: 'center',
                        backgroundColor: '#fafafa',
                        fontSize: '0.62rem',
                        color: '#6b7280'
                      }}>
                        📁 Select image proof
                      </div>
                    </div>

                    {/* Place Order button */}
                    <button type="button" style={{
                      backgroundColor: 'var(--primary-lime)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textAlign: 'center',
                      marginTop: 'auto'
                    }}>
                      Submit Order Verification
                    </button>
                  </div>
                </div>

                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '340px' }}>
                  This mobile screen is a simulated representation of what the customer sees when checking out on their device.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB: CATEGORIES CUSTOM SEQUENCER (Category Manager)
            ======================================================= */}
        {activeTab === 'categories_editor' && (
          <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header Card */}
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
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--primary-forest) 0%, var(--primary-lime) 100%)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-lime-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                  🗂️
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-dark)' }}>Category Manager</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Add, edit, delete, hide/unhide, and rearrange the display sequence of product categories.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingCategoriesOrder}
                onClick={handleSaveCategoriesOrder}
                className="btn-lime"
                style={{ padding: '12px 28px', fontSize: '0.88rem', borderRadius: 'var(--radius-md)', minWidth: '160px', justifyContent: 'center', cursor: isSavingCategoriesOrder ? 'not-allowed' : 'pointer', flexShrink: 0 }}
              >
                {isSavingCategoriesOrder ? 'Saving...' : '💾 Save Sequence'}
              </button>
            </div>

            {/* Add Category Card */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px 32px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)' }}>➕ Add New Category</h4>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="e.g. Incense Sticks, Copper Pots..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    outline: 'none',
                    fontSize: '0.88rem'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCategory();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="btn-lime"
                  style={{
                    padding: '10px 20px',
                    fontSize: '0.88rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={16} /> Add Category
                </button>
              </div>
            </div>

            {/* Sorter List Card */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)' }}>Manage Category List & Sequence</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Toggle category visibility (hidden categories won't show in the devotee shop), rename, delete, or change order.
                </p>
              </div>

              {/* Scrollable list of categories */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sortedCategoriesList.map((category, index) => {
                  const isFirst = index === 0;
                  const isLast = index === sortedCategoriesList.length - 1;
                  const categoryInfo = safeCategoriesList.find(c => c.name === category);
                  const isHidden = categoryInfo ? categoryInfo.hidden : false;
                  const isAll = category === 'all';
                  const displayName = isAll ? '✨ All Items' : category;

                  return (
                    <div
                      key={category}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 20px',
                        backgroundColor: isHidden ? '#f3f4f6' : '#f9fafb',
                        border: '1.5px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        opacity: isHidden ? 0.75 : 1,
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: isHidden ? 'var(--text-muted)' : 'var(--primary-forest)',
                          color: '#ffffff',
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}>
                          {index + 1}
                        </span>

                        {editingCategoryName === category ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '300px' }}>
                            <input
                              type="text"
                              value={editingCategoryValue}
                              onChange={(e) => setEditingCategoryValue(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                fontSize: '0.88rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1.5px solid var(--primary-lime)',
                                outline: 'none'
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleRenameCategory(category, editingCategoryValue);
                                } else if (e.key === 'Escape') {
                                  setEditingCategoryName(null);
                                }
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleRenameCategory(category, editingCategoryValue)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '30px',
                                height: '30px',
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                backgroundColor: 'var(--primary-lime)',
                                color: '#ffffff',
                                cursor: 'pointer'
                              }}
                              title="Save Name"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCategoryName(null)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '30px',
                                height: '30px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-light)',
                                backgroundColor: '#ffffff',
                                color: 'var(--text-dark)',
                                cursor: 'pointer'
                              }}
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontSize: '0.92rem',
                              fontWeight: 700,
                              color: isHidden ? 'var(--text-muted)' : 'var(--text-dark)',
                              textDecoration: isHidden ? 'line-through' : 'none'
                            }}>
                              {displayName}
                            </span>
                            {isHidden && (
                              <span style={{
                                fontSize: '0.7rem',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: '#e5e7eb',
                                color: '#4b5563',
                                fontWeight: 700
                              }}>
                                Hidden
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Edit, Delete, Hide Actions */}
                        {!isAll && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {/* Hide/Unhide Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleHideCategory(category)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-light)',
                                backgroundColor: isHidden ? '#e5e7eb' : '#ffffff',
                                color: isHidden ? '#4b5563' : 'var(--primary-forest)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title={isHidden ? 'Unhide (Show in Store)' : 'Hide (Hide from Store)'}
                            >
                              {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>

                            {/* Rename Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategoryName(category);
                                setEditingCategoryValue(category);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-light)',
                                backgroundColor: '#ffffff',
                                color: 'var(--text-dark)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title="Rename Category"
                            >
                              <Edit3 size={16} />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(category)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-light)',
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title="Delete Category"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}

                        {/* Position input selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pos:</span>
                          <input
                            type="number"
                            min="1"
                            max={sortedCategoriesList.length}
                            value={index + 1}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) {
                                moveCategoryToPosition(index, val);
                              }
                            }}
                            style={{
                              width: '54px',
                              padding: '6px 8px',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              textAlign: 'center',
                              borderRadius: 'var(--radius-sm)',
                              border: '1.5px solid var(--border-light)',
                              outline: 'none',
                              backgroundColor: '#ffffff'
                            }}
                          />
                        </div>

                        {/* Arrow Shift Controls */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => moveCategoryUp(index)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-light)',
                              backgroundColor: isFirst ? '#f3f4f6' : '#ffffff',
                              color: isFirst ? 'var(--text-muted)' : 'var(--text-dark)',
                              cursor: isFirst ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => moveCategoryDown(index)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-light)',
                              backgroundColor: isLast ? '#f3f4f6' : '#ffffff',
                              color: isLast ? 'var(--text-muted)' : 'var(--text-dark)',
                              cursor: isLast ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions Row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '8px' }}>
                <button
                  type="button"
                  disabled={isSavingCategoriesOrder}
                  onClick={handleSaveCategoriesOrder}
                  className="btn-lime"
                  style={{ padding: '14px 36px', fontSize: '0.9rem', borderRadius: 'var(--radius-md)', minWidth: '200px', justifyContent: 'center', cursor: isSavingCategoriesOrder ? 'not-allowed' : 'pointer' }}
                >
                  {isSavingCategoriesOrder ? 'Saving sequence...' : '💾 Save Category Sequence'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB: PRODUCTS CARD SEQUENCER
            ======================================================= */}
        {activeTab === 'products_sorter' && (
          <div style={{ textAlign: 'left', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header Card */}
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
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--primary-forest) 0%, var(--primary-lime) 100%)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-lime-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                  📦
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-dark)' }}>Products Card Sorter</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Select a category and arrange how product cards are numbered/ordered on the shop storefront.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingProductsOrder || sortedProductsList.length === 0}
                onClick={handleSaveProductsOrder}
                className="btn-lime"
                style={{ padding: '12px 28px', fontSize: '0.88rem', borderRadius: 'var(--radius-md)', minWidth: '160px', justifyContent: 'center', cursor: isSavingProductsOrder ? 'not-allowed' : 'pointer', flexShrink: 0 }}
              >
                {isSavingProductsOrder ? 'Saving...' : '💾 Save Sequence'}
              </button>
            </div>

            {/* Sorter Body Card */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              {/* Category Pills Scroll Bar */}
              <div style={{
                display: 'flex',
                overflowX: 'auto',
                gap: '8px',
                padding: '4px 0',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '20px'
              }} className="shop-categories-scroll">
                {sorterCategories.map((cat) => {
                  const isActive = selectedSorterCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedSorterCategory(cat)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                        border: '1.5px solid var(--border-light)',
                        backgroundColor: isActive ? 'var(--primary-forest)' : '#ffffff',
                        color: isActive ? '#ffffff' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {cat === 'all' ? '✨ All Items' : cat}
                    </button>
                  );
                })}
              </div>

              {/* Sorter Description */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)' }}>Drag & Drop or Swap Products</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Drag cards by holding them, or use the position inputs / arrow buttons to arrange their display order.
                </p>
              </div>

              {/* Scrollable grid of products */}
              {sortedProductsList.length === 0 ? (
                <div style={{
                  padding: '48px',
                  textAlign: 'center',
                  backgroundColor: '#f9fafb',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px dashed var(--border-light)'
                }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No products found in this category.</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '24px',
                  marginTop: '16px'
                }} className="shop-product-grid">
                  {sortedProductsList.map((product, index) => {
                    const isFirst = index === 0;
                    const isLast = index === sortedProductsList.length - 1;
                    const hasImage = isImageUrl(product.image);
                    const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

                    return (
                      <div
                        key={product.id}
                        draggable
                        onDragStart={(e) => handleProductDragStart(e, index)}
                        onDragOver={handleProductDragOver}
                        onDrop={(e) => handleProductDrop(e, index)}
                        style={{
                          borderRadius: '16px',
                          border: draggedProductIndex === index ? '2px dashed var(--primary-lime)' : '1px solid var(--border-light)',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          backgroundColor: draggedProductIndex === index ? '#f3f4f6' : '#ffffff',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          padding: '12px',
                          gap: '12px',
                          cursor: 'grab',
                          opacity: draggedProductIndex === index ? 0.6 : 1,
                          overflow: 'visible'
                        }}
                        onMouseEnter={(e) => {
                          if (draggedProductIndex !== index) {
                            e.currentTarget.style.transform = 'translateY(-6px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                            e.currentTarget.style.borderColor = 'var(--primary-lime)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (draggedProductIndex !== index) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                            e.currentTarget.style.borderColor = 'var(--border-light)';
                          }
                        }}
                      >
                        {/* Rank Badge */}
                        <div style={{
                          position: 'absolute',
                          top: '-8px',
                          left: '-8px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-forest)',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                          fontWeight: 900,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid #ffffff',
                          boxShadow: 'var(--shadow-sm)',
                          zIndex: 20
                        }}>
                          {index + 1}
                        </div>

                        {/* Image Box */}
                        <div
                          style={{
                            width: '100%',
                            aspectRatio: '1 / 1',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f9fafb',
                            border: '1px solid var(--border-light)'
                          }}
                        >
                          {hasImage ? (
                            <img
                              src={getDisplayImageUrl(product.image)}
                              alt={product.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ fontSize: '3.5rem' }}>{product.image}</span>
                          )}

                          {/* Ribbon Badge */}
                          {discount > 0 && product.inStock && (
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: '12px',
                              width: '36px',
                              padding: '6px 2px 8px 2px',
                              background: 'linear-gradient(135deg, var(--primary-accent), var(--primary-lime))',
                              color: '#ffffff',
                              fontSize: '0.62rem',
                              fontWeight: 900,
                              lineHeight: 1.15,
                              textAlign: 'center',
                              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 5px), 0 100%)',
                              zIndex: 10,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                              {discount}%<br/>OFF
                            </div>
                          )}

                          {/* Out of Stock overlay */}
                          {!product.inStock && (
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: '12px',
                              width: '36px',
                              padding: '6px 2px 8px 2px',
                              background: '#9ca3af',
                              color: '#ffffff',
                              fontSize: '0.55rem',
                              fontWeight: 900,
                              lineHeight: 1.15,
                              textAlign: 'center',
                              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 5px), 0 100%)',
                              zIndex: 10
                            }}>
                              SOLD<br/>OUT
                            </div>
                          )}
                        </div>

                        {/* Title and Price */}
                        <div style={{
                          padding: '0 4px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          textAlign: 'center',
                          flexGrow: 1,
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <h4 style={{
                              fontSize: '0.88rem',
                              fontWeight: 700,
                              color: 'var(--text-dark)',
                              margin: 0,
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              height: '2.6em'
                            }}>
                              {product.name}
                            </h4>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                              <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--primary-forest)' }}>
                                ₹{product.price}
                              </span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span style={{ fontSize: '0.78rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                                  ₹{product.originalPrice}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Position overrides overlay */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px',
                              borderTop: '1px solid var(--border-light)',
                              paddingTop: '8px',
                              marginTop: '8px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="number"
                              min="1"
                              max={sortedProductsList.length}
                              value={index + 1}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) {
                                  moveProductToPosition(index, val);
                                }
                              }}
                              style={{
                                width: '48px',
                                padding: '4px 6px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                textAlign: 'center',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-light)',
                                outline: 'none',
                                backgroundColor: '#ffffff'
                              }}
                            />
                            
                            <div style={{ display: 'flex', gap: '2px' }}>
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={() => moveProductUp(index)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border-light)',
                                  backgroundColor: isFirst ? '#f3f4f6' : '#ffffff',
                                  color: isFirst ? 'var(--text-muted)' : 'var(--text-dark)',
                                  cursor: isFirst ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={() => moveProductDown(index)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border-light)',
                                  backgroundColor: isLast ? '#f3f4f6' : '#ffffff',
                                  color: isLast ? 'var(--text-muted)' : 'var(--text-dark)',
                                  cursor: isLast ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <ArrowDown size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Actions Row */}
              {sortedProductsList.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '8px' }}>
                  <button
                    type="button"
                    disabled={isSavingProductsOrder}
                    onClick={handleSaveProductsOrder}
                    className="btn-lime"
                    style={{ padding: '14px 36px', fontSize: '0.9rem', borderRadius: 'var(--radius-md)', minWidth: '200px', justifyContent: 'center', cursor: isSavingProductsOrder ? 'not-allowed' : 'pointer' }}
                  >
                    {isSavingProductsOrder ? 'Saving sequence...' : '💾 Save Product Sequence'}
                  </button>
                </div>
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
                      <>
                        <button
                          onClick={handleBulkGSTApply}
                          disabled={isBulkGSTApplying}
                          className="btn-lime"
                          style={{
                            fontSize: '0.85rem',
                            padding: '10px 20px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: '#2563eb',
                            borderColor: '#2563eb',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          {isBulkGSTApplying ? 'Applying GST...' : 'Apply Bulk GST'}
                        </button>
                        <button
                          onClick={handleBulkDeliveryApply}
                          disabled={isBulkDeliveryApplying}
                          className="btn-lime"
                          style={{
                            fontSize: '0.85rem',
                            padding: '10px 20px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: '#7c3aed',
                            borderColor: '#7c3aed',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          {isBulkDeliveryApplying ? 'Applying Delivery...' : 'Apply Bulk Delivery'}
                        </button>
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
                      </>
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
                                    onClick={() => handleTogglePublishPoojaProduct(product.id, product.isPublished, product.name)}
                                    style={{
                                      padding: '6px 12px', border: product.isPublished ? '1px solid #ffe2e2' : '1px solid #dcfce7',
                                      borderRadius: 'var(--radius-md)', fontSize: '0.78rem', fontWeight: 700,
                                      color: product.isPublished ? '#c2410c' : '#15803d', display: 'inline-flex', alignItems: 'center', gap: '4px',
                                      backgroundColor: product.isPublished ? '#fffaf8' : '#f0fdf4', cursor: 'pointer'
                                    }}
                                  >
                                    {product.isPublished ? <EyeOff size={12} /> : <Eye size={12} />}
                                    {product.isPublished ? 'Hide' : 'Unhide'}
                                  </button>
                                  <button
                                    onClick={() => handleDuplicatePoojaProduct(product)}
                                    style={{
                                      padding: '6px 12px', border: '1px solid #e2e8f0',
                                      borderRadius: 'var(--radius-md)', fontSize: '0.78rem', fontWeight: 700,
                                      color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '4px',
                                      backgroundColor: '#f8fafc', cursor: 'pointer'
                                    }}
                                  >
                                    <Copy size={12} /> Duplicate
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

                    {/* Video URL Input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#9ca3af', fontWeight: 700 }}>Video URL:</span>
                      <input
                        type="text"
                        value={editingPoojaProduct.videoUrl || ''}
                        placeholder="Cloudflare video CDN URL"
                        onChange={(e) => updatePoojaField('videoUrl', e.target.value)}
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

                    {/* Video Upload Input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#9ca3af', fontWeight: 700 }}>Upload Video:</span>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px dashed rgba(255, 255, 255, 0.3)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#ffffff'
                      }}>
                        <Upload size={14} />
                        Choose Video
                        <input
                          type="file"
                          accept="video/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              await addToMediaQueue(file, 'products/videos', (tempId) => {
                                updatePoojaField('videoUrl', tempId);
                              });
                              triggerToast('Video queued for compression!');
                            } catch (err) {
                              console.error(err);
                              alert('Failed to stage video: ' + (err as Error).message);
                            } finally {
                              e.target.value = '';
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                    {editingPoojaProduct.videoUrl && editingPoojaProduct.videoUrl.startsWith('temp-media-') && (
                      <div style={{ width: '100%', maxWidth: '300px', marginTop: '4px' }}>
                        <CompressionStatusWidget tempId={editingPoojaProduct.videoUrl} mediaQueue={mediaQueue} />
                      </div>
                    )}

                    {/* Video Thumbnail Input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#9ca3af', fontWeight: 700 }}>Thumbnail URL:</span>
                      <input
                        type="text"
                        value={editingPoojaProduct.uiLabels?.videoThumbnail || ''}
                        placeholder="Video thumbnail URL"
                        onChange={(e) => {
                          const existingLabels = editingPoojaProduct.uiLabels || {};
                          updatePoojaField('uiLabels', {
                            ...existingLabels,
                            videoThumbnail: e.target.value
                          });
                        }}
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

                    {/* Purchase Limit Field */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#9ca3af', fontWeight: 700 }}>Limit:</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="No limit"
                        value={editingPoojaProduct.purchaseLimit || ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value, 10) : null;
                          updatePoojaField('purchaseLimit', val);
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid rgba(255,255,255,0.2)',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: '#ffffff',
                          outline: 'none',
                          fontSize: '0.8rem',
                          width: '90px'
                        }}
                      />
                    </div>

                    {/* GST Override Settings */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={editingPoojaProduct.gstOverrideEnabled || false}
                          onChange={(e) => {
                            updatePoojaField('gstOverrideEnabled', e.target.checked);
                            if (!e.target.checked) {
                              updatePoojaField('customGst', null);
                            }
                          }}
                        />
                        Custom GST
                      </label>
                      {editingPoojaProduct.gstOverrideEnabled && (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="GST %"
                          value={editingPoojaProduct.customGst !== undefined && editingPoojaProduct.customGst !== null ? editingPoojaProduct.customGst : ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseFloat(e.target.value) : null;
                            updatePoojaField('customGst', val);
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: '#ffffff',
                            outline: 'none',
                            fontSize: '0.8rem',
                            width: '70px'
                          }}
                        />
                      )}
                    </div>

                    {/* Delivery Override Settings */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={editingPoojaProduct.deliveryOverrideEnabled || false}
                          onChange={(e) => {
                            updatePoojaField('deliveryOverrideEnabled', e.target.checked);
                            if (!e.target.checked) {
                              updatePoojaField('customDelivery', null);
                            }
                          }}
                        />
                        Custom Delivery
                      </label>
                      {editingPoojaProduct.deliveryOverrideEnabled && (
                        <input
                          type="number"
                          min="0"
                          placeholder="Delivery ₹"
                          value={editingPoojaProduct.customDelivery !== undefined && editingPoojaProduct.customDelivery !== null ? editingPoojaProduct.customDelivery : ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseFloat(e.target.value) : null;
                            updatePoojaField('customDelivery', val);
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: '#ffffff',
                            outline: 'none',
                            fontSize: '0.8rem',
                            width: '85px'
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Main WYSIWYG Workspace Area */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '320px 1fr',
                  gap: '24px',
                  alignItems: 'start'
                }} className="admin-workspace-grid">
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
                          videoUrl: editingPoojaProduct.videoUrl,
                          material: editingPoojaProduct.material,
                          weight: editingPoojaProduct.weight,
                          dimensions: editingPoojaProduct.dimensions,
                          origin: editingPoojaProduct.origin,
                          customIcons: (editingPoojaProduct as any).customIcons || {},
                          relatedProducts: editingPoojaProduct.relatedProducts || [],
                          testimonials: editingPoojaProduct.testimonials || [],
                          uiLabels: editingPoojaProduct.uiLabels || {},
                          translations: editingPoojaProduct.translations || {}
                        } as any}
                        products={[...products, ...poojaProducts]}
                        wishlist={{}}
                        onAddToCart={() => {}}
                        onViewDetails={() => {}}
                        onToggleWishlist={() => {}}
                        onBackToShop={() => {}}
                        editable={true}
                        onUpdate={(fields) => updatePoojaFields(fields)}
                        cart={[]}
                        onUpdateQuantity={() => {}}
                        onFileSelect={async (file, prefix) => {
                          return await addToMediaQueue(file, prefix, () => {});
                        }}
                        mediaQueue={mediaQueue}
                        resolveMediaUrl={resolveMediaUrl}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =======================================================
            TAB: DEVOTIONAL COUPONS MANAGER
            ======================================================= */}
        {activeTab === 'coupons' && (
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Header section with Stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                  Devotional Coupons Manager
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Generate and track coupon codes with user usage limits, per-user limits, and product scope restrictions.
                </p>
              </div>
            </div>

            {/* Stats Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-lime-light)', color: 'var(--primary-lime)' }}>
                  <Ticket size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Coupons</span>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-dark)', marginTop: '2px' }}>{coupons.length}</h4>
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: '#fff7ed', color: '#f97316' }}>
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Redemptions</span>
                  <h4 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-dark)', marginTop: '2px' }}>{redemptions.length}</h4>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px' }} className="hero-grid-split">
              
              {/* Form column: Generate coupon */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                boxShadow: 'var(--shadow-md)',
                height: 'fit-content',
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

                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={18} style={{ color: 'var(--primary-lime)' }} />
                  Generate New Coupon
                </h3>

                <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SHIVA20"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-light)', outline: 'none', fontSize: '0.88rem', backgroundColor: '#f9fafb' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Discount Percentage *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        required
                        min={1}
                        max={100}
                        placeholder="e.g. 15"
                        value={newDiscountPercent}
                        onChange={(e) => setNewDiscountPercent(parseInt(e.target.value, 10) || 0)}
                        style={{ width: '100%', padding: '10px 30px 10px 14px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-light)', outline: 'none', fontSize: '0.88rem', backgroundColor: '#f9fafb' }}
                      />
                      <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>%</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Usage User Limit
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="Unlimited if empty (e.g. 100)"
                      value={newUserLimit}
                      onChange={(e) => setNewUserLimit(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-light)', outline: 'none', fontSize: '0.88rem', backgroundColor: '#f9fafb' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      Total number of people allowed to redeem this coupon.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Product Applicability
                    </label>
                    <select
                      value={newProductId}
                      onChange={(e) => setNewProductId(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-light)', outline: 'none', fontSize: '0.88rem', backgroundColor: '#f9fafb', cursor: 'pointer' }}
                    >
                      <option value="">All Products</option>
                      {poojaProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      Restrict this coupon code to a specific Pooja product.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="btn-lime"
                    disabled={isCreatingCoupon}
                    style={{ width: '100%', padding: '12px', justifyContent: 'center', marginTop: '8px', fontSize: '0.88rem' }}
                  >
                    {isCreatingCoupon ? 'Creating...' : 'Create Coupon Code'}
                  </button>
                </form>
              </div>

              {/* Lists column: Active coupons & redemptions logs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* Active Coupons List */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Ticket size={16} style={{ color: 'var(--primary-lime)' }} />
                    Active Coupon Codes ({coupons.length})
                  </h3>

                  {isLoadingCoupons ? (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                      <div style={{ width: '24px', height: '24px', border: '2px solid var(--border-light)', borderTopColor: 'var(--primary-lime)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Retrieving active coupons...</p>
                    </div>
                  ) : coupons.length === 0 ? (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '16px 0', textAlign: 'center' }}>No active coupons. Generate one using the form on the left.</p>
                  ) : (
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--border-light)' }}>
                            <th style={{ padding: '10px 14px', fontWeight: 700 }}>Code</th>
                            <th style={{ padding: '10px 14px', fontWeight: 700 }}>Discount</th>
                            <th style={{ padding: '10px 14px', fontWeight: 700 }}>Applicability</th>
                            <th style={{ padding: '10px 14px', fontWeight: 700 }}>Usage Status</th>
                            <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coupons.map((coupon) => (
                            <tr key={coupon.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '10px 14px', fontWeight: 'bold', color: 'var(--primary-forest)' }}>{coupon.code}</td>
                              <td style={{ padding: '10px 14px', fontWeight: 700 }}>{coupon.discount_percent}% off</td>
                              <td style={{ padding: '10px 14px', color: coupon.product ? 'var(--text-dark)' : 'var(--text-muted)' }}>
                                {coupon.product ? `Only: ${coupon.product.name}` : 'All Products'}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  backgroundColor: coupon.user_limit && coupon.redemptions_count >= coupon.user_limit ? '#fee2e2' : '#f0fdf4',
                                  color: coupon.user_limit && coupon.redemptions_count >= coupon.user_limit ? '#991b1b' : '#166534'
                                }}>
                                  {coupon.redemptions_count} / {coupon.user_limit === null ? 'Unlimited' : coupon.user_limit}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                <button
                                  onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                                  style={{ color: 'var(--text-muted)', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '4px' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Coupon Redemptions Logs */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShoppingBag size={16} style={{ color: 'var(--primary-lime)' }} />
                    Coupon Redemption Logs ({redemptions.length})
                  </h3>

                  {redemptions.length === 0 ? (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '16px 0', textAlign: 'center' }}>No coupon redemptions recorded yet.</p>
                  ) : (
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--border-light)' }}>
                            <th style={{ padding: '10px 14px', fontWeight: 700 }}>User Name</th>
                            <th style={{ padding: '10px 14px', fontWeight: 700 }}>User Contacts</th>
                            <th style={{ padding: '10px 14px', fontWeight: 700 }}>Coupon Used</th>
                            <th style={{ padding: '10px 14px', fontWeight: 700 }}>Order ID</th>
                            <th style={{ padding: '10px 14px', fontWeight: 700 }}>Date Redeemed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {redemptions.map((log) => (
                            <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-dark)' }}>{log.user?.full_name || 'N/A'}</td>
                              <td style={{ padding: '10px 14px' }}>
                                <p style={{ margin: 0, fontWeight: 500 }}>{log.user?.email || 'N/A'}</p>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.user?.phone_number || 'N/A'}</p>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary-forest)' }}>{log.coupon?.code || 'DELETED'}</span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>({log.coupon?.discount_percent || 0}% discount)</span>
                              </td>
                              <td style={{ padding: '10px 14px', fontWeight: 'bold' }}>#{log.order_id}</td>
                              <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                                {new Date(log.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

        {/* =======================================================
            TAB: AFFILIATE PARTNERSHIPS
            ======================================================= */}
        {activeTab === 'affiliates' && (
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Header section */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                Affiliate Partnerships Directory & Settings
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                View devotee affiliate codes, monitor active/suspended statuses, configure commission tier levels, and review payout/withdrawal queues.
              </p>
            </div>

            {/* Sub-tab Navigation */}
            <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setAffiliateSubTab('directory')}
                style={{
                  background: affiliateSubTab === 'directory' ? 'var(--primary-lime-light)' : 'transparent',
                  border: affiliateSubTab === 'directory' ? '1px solid var(--primary-lime)' : '1px solid transparent',
                  color: affiliateSubTab === 'directory' ? 'var(--primary-lime)' : 'var(--text-muted)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                👥 Partnerships Directory
              </button>
              <button
                onClick={() => setAffiliateSubTab('tiers')}
                style={{
                  background: affiliateSubTab === 'tiers' ? 'var(--primary-lime-light)' : 'transparent',
                  border: affiliateSubTab === 'tiers' ? '1px solid var(--primary-lime)' : '1px solid transparent',
                  color: affiliateSubTab === 'tiers' ? 'var(--primary-lime)' : 'var(--text-muted)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                ⚙️ Tiers & Settings
              </button>
              <button
                onClick={() => setAffiliateSubTab('withdrawals')}
                style={{
                  background: affiliateSubTab === 'withdrawals' ? 'var(--primary-lime-light)' : 'transparent',
                  border: affiliateSubTab === 'withdrawals' ? '1px solid var(--primary-lime)' : '1px solid transparent',
                  color: affiliateSubTab === 'withdrawals' ? 'var(--primary-lime)' : 'var(--text-muted)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                💸 Payouts Queue ({withdrawals.filter(w => w.status === 'pending').length} Pending)
              </button>
              <button
                onClick={() => setAffiliateSubTab('pundits')}
                style={{
                  background: affiliateSubTab === 'pundits' ? 'var(--primary-lime-light)' : 'transparent',
                  border: affiliateSubTab === 'pundits' ? '1px solid var(--primary-lime)' : '1px solid transparent',
                  color: affiliateSubTab === 'pundits' ? 'var(--primary-lime)' : 'var(--text-muted)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                🕉️ Pandit Manager
              </button>
            </div>

            {/* SUBTAB CONTENT: DIRECTORY */}
            {affiliateSubTab === 'directory' && (
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} style={{ color: 'var(--primary-lime)' }} />
                  Enrolled Affiliate Partners ({affiliates.length})
                </h3>

                {isLoadingAffiliates ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ width: '28px', height: '28px', border: '2px solid var(--border-light)', borderTopColor: 'var(--primary-lime)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Loading affiliates directory...</p>
                  </div>
                ) : affiliates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '2.5rem' }}>👥</span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '12px' }}>No devotee affiliates enrolled yet.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--border-light)' }}>
                          <th style={{ padding: '12px 16px', fontWeight: 700 }}>Devotee Name</th>
                          <th style={{ padding: '12px 16px', fontWeight: 700 }}>Email & Phone</th>
                          <th style={{ padding: '12px 16px', fontWeight: 700 }}>Referral Code</th>
                          <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                          <th style={{ padding: '12px 16px', fontWeight: 700 }}>Date Joined</th>
                          <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {affiliates.map((aff) => (
                          <tr key={aff.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 'bold', color: 'var(--text-dark)' }}>{aff.full_name}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <p style={{ margin: 0, fontWeight: 500 }}>{aff.email}</p>
                              <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{aff.phone_number || 'N/A'}</p>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <code style={{
                                backgroundColor: 'var(--primary-lime-light)',
                                color: 'var(--primary-lime)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                fontFamily: 'monospace'
                              }}>{aff.affiliate_code}</code>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{
                                padding: '3px 10px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                backgroundColor: 
                                  aff.affiliate_status === 'active' ? '#dcfce7' : 
                                  aff.affiliate_status === 'pending' ? '#fef3c7' : '#fee2e2',
                                color: 
                                  aff.affiliate_status === 'active' ? '#15803d' : 
                                  aff.affiliate_status === 'pending' ? '#b45309' : '#991b1b',
                                border: '1px solid ' + (
                                  aff.affiliate_status === 'active' ? '#bbf7d0' : 
                                  aff.affiliate_status === 'pending' ? '#fde68a' : '#fecaca'
                                )
                              }}>
                                {aff.affiliate_status.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                              {aff.affiliate_joined_at ? new Date(aff.affiliate_joined_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }) : 'N/A'}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <select
                                value={aff.affiliate_status}
                                onChange={(e) => handleUpdateAffiliateStatus(aff.id, e.target.value)}
                                disabled={isUpdatingAffiliateStatus === aff.id}
                                style={{
                                  border: '1px solid var(--border-light)',
                                  padding: '6px 12px',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  outline: 'none',
                                  backgroundColor: 
                                    aff.affiliate_status === 'active' ? '#dcfce7' : 
                                    aff.affiliate_status === 'pending' ? '#fef3c7' :
                                    aff.affiliate_status === 'suspended' ? '#fee2e2' : '#f3f4f6',
                                  color: 
                                    aff.affiliate_status === 'active' ? '#15803d' : 
                                    aff.affiliate_status === 'pending' ? '#b45309' :
                                    aff.affiliate_status === 'suspended' ? '#dc2626' : '#4b5563'
                                }}
                              >
                                <option value="pending">Pending</option>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB CONTENT: TIERS & SETTINGS */}
            {affiliateSubTab === 'tiers' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '30px' }} className="hero-grid-split">
                {/* Left: Tiers List */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layers size={16} style={{ color: 'var(--primary-lime)' }} />
                      Affiliate Commission Levels / Tiers
                    </h3>
                    <button
                      onClick={() => setEditingLevel({ level_number: '', commission_percentage: '', enabled: true })}
                      style={{
                        backgroundColor: 'var(--primary-lime)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Plus size={14} /> Add Tier
                    </button>
                  </div>

                  {isLoadingLevels ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                      Loading tier rates...
                    </div>
                  ) : affiliateLevels.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '35px 20px', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                      No tiers defined yet. Add a level to start.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--border-light)' }}>
                            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Affiliate Tier / Level</th>
                            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Commission Percentage (%)</th>
                            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                            <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {affiliateLevels.map((lvl) => (
                            <tr key={lvl.level_number} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{getLevelName(lvl.level_number)}</td>
                              <td style={{ padding: '12px 16px', color: 'var(--primary-lime)', fontWeight: 800 }}>{lvl.commission_percentage}%</td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: 'var(--radius-full)',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  backgroundColor: lvl.enabled ? '#dcfce7' : '#fee2e2',
                                  color: lvl.enabled ? '#15803d' : '#991b1b',
                                  border: '1px solid ' + (lvl.enabled ? '#bbf7d0' : '#fecaca')
                                }}>
                                  {lvl.enabled ? 'ENABLED' : 'DISABLED'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                  onClick={() => setEditingLevel({ level_number: lvl.level_number, commission_percentage: lvl.commission_percentage, enabled: lvl.enabled })}
                                  style={{
                                    border: '1px solid var(--border-light)',
                                    background: '#ffffff',
                                    color: 'var(--text-dark)',
                                    padding: '4px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteLevel(lvl.level_number)}
                                  disabled={isDeletingLevel === lvl.level_number}
                                  style={{
                                    border: 'none',
                                    backgroundColor: '#fee2e2',
                                    color: '#991b1b',
                                    padding: '4px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {isDeletingLevel === lvl.level_number ? 'Deleting...' : 'Delete'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Level Add/Edit Inline Form panel */}
                  {editingLevel && (
                    <div style={{
                      backgroundColor: '#f9fafb',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px',
                      marginTop: '20px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                          {affiliateLevels.some(l => l.level_number === editingLevel.level_number) ? `Edit Rate for ${getLevelName(editingLevel.level_number)}` : 'Add New Tier Rate'}
                        </h4>
                        <button
                          onClick={() => setEditingLevel(null)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <form onSubmit={handleSaveLevel} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Level Number (1=Affiliate, 2=Distributor, 3=Super Dist.)</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            required
                            disabled={affiliateLevels.some(l => l.level_number === editingLevel.level_number)}
                            value={editingLevel.level_number}
                            onChange={(e) => setEditingLevel({ ...editingLevel, level_number: e.target.value })}
                            style={{
                              border: '1px solid var(--border-light)',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8rem',
                              width: '100px',
                              outline: 'none',
                              backgroundColor: affiliateLevels.some(l => l.level_number === editingLevel.level_number) ? '#e5e7eb' : '#ffffff'
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Commission Rate (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            required
                            value={editingLevel.commission_percentage}
                            onChange={(e) => setEditingLevel({ ...editingLevel, commission_percentage: e.target.value })}
                            style={{
                              border: '1px solid var(--border-light)',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8rem',
                              width: '150px',
                              outline: 'none'
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '36px' }}>
                          <input
                            type="checkbox"
                            id="levelEnabled"
                            checked={editingLevel.enabled}
                            onChange={(e) => setEditingLevel({ ...editingLevel, enabled: e.target.checked })}
                          />
                          <label htmlFor="levelEnabled" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dark)', cursor: 'pointer' }}>Enabled</label>
                        </div>
                        <button
                          type="submit"
                          disabled={isSavingLevel}
                          style={{
                            backgroundColor: 'var(--primary-lime)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '9px 18px',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          {isSavingLevel ? 'Saving...' : 'Save Tier'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Right: Global Settings Panel */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  boxShadow: 'var(--shadow-sm)',
                  height: 'fit-content'
                }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={16} style={{ color: 'var(--primary-lime)' }} />
                    Global Settings
                  </h3>

                  {isLoadingAffiliateSettings ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Loading settings...
                    </div>
                  ) : (
                    <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Program Status</label>
                        <select
                          value={affiliateSettings.affiliate_enabled ? 'true' : 'false'}
                          onChange={(e) => setAffiliateSettings({ ...affiliateSettings, affiliate_enabled: e.target.value === 'true' })}
                          style={{
                            border: '1px solid var(--border-light)',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            outline: 'none',
                            fontWeight: 600
                          }}
                        >
                          <option value="true">🟢 Active & Enabled</option>
                          <option value="false">🔴 Suspended & Disabled</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Max Search/Payout Depth</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={affiliateSettings.affiliate_max_depth || 5}
                          onChange={(e) => setAffiliateSettings({ ...affiliateSettings, affiliate_max_depth: e.target.value })}
                          style={{
                            border: '1px solid var(--border-light)',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Minimum Withdrawal Limit (₹)</label>
                        <select
                          value={affiliateSettings.affiliate_min_withdrawal || '1000'}
                          onChange={(e) => setAffiliateSettings({ ...affiliateSettings, affiliate_min_withdrawal: e.target.value })}
                          style={{
                            border: '1px solid var(--border-light)',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            outline: 'none',
                            fontWeight: 600
                          }}
                        >
                          <option value="100">₹100.00</option>
                          <option value="500">₹500.00</option>
                          <option value="1000">₹1,000.00</option>
                          <option value="2000">₹2,000.00</option>
                          <option value="5000">₹5,000.00</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Attribution Rule</label>
                        <select
                          value={affiliateSettings.affiliate_commission_model || 'last_touch'}
                          onChange={(e) => setAffiliateSettings({ ...affiliateSettings, affiliate_commission_model: e.target.value })}
                          style={{
                            border: '1px solid var(--border-light)',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            outline: 'none'
                          }}
                        >
                          <option value="last_touch">Last Touch (Recommended)</option>
                          <option value="first_touch">First Touch</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingAffiliateSettings}
                        style={{
                          backgroundColor: 'var(--primary-lime)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px 16px',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          marginTop: '8px'
                        }}
                      >
                        {isSavingAffiliateSettings ? 'Saving...' : 'Save Configuration'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* SUBTAB CONTENT: WITHDRAWAL PAYOUTS QUEUE */}
            {affiliateSubTab === 'withdrawals' && (
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={16} style={{ color: 'var(--primary-lime)' }} />
                  Withdrawals Review Queue
                </h3>

                {isLoadingWithdrawals ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    Loading withdrawal requests...
                  </div>
                ) : withdrawals.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                    No withdrawal requests have been submitted.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--border-light)' }}>
                          <th style={{ padding: '12px 16px', fontWeight: 700 }}>Devotee Details</th>
                          <th style={{ padding: '12px 16px', fontWeight: 700 }}>Requested Amount</th>
                          <th style={{ padding: '12px 16px', fontWeight: 700 }}>Payment Method</th>
                          <th style={{ padding: '12px 16px', fontWeight: 700 }}>Account Info / Details</th>
                          <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                          <th style={{ padding: '12px 16px', fontWeight: 700 }}>Date Requested</th>
                          <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.map((w) => (
                          <tr key={w.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-dark)' }}>{w.devotee_name || 'N/A'}</p>
                              <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{w.devotee_phone || w.devotee_email || 'N/A'}</p>
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: 800, fontSize: '0.88rem', color: 'var(--primary-lime)' }}>
                              ₹{parseFloat(w.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                              <span style={{ textTransform: 'uppercase', backgroundColor: '#eef2f6', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem' }}>
                                {w.payment_method}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', maxWidth: '250px', whiteSpace: 'normal', wordBreak: 'break-all' }}>
                              {w.payment_method === 'upi' ? (
                                <div>
                                  <p style={{ margin: 0 }}><strong>UPI ID:</strong> {w.payment_details?.upi_id}</p>
                                  <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Name: {w.payment_details?.account_holder_name}</p>
                                </div>
                              ) : (
                                <div>
                                  <p style={{ margin: 0 }}><strong>Bank:</strong> {w.payment_details?.bank_name}</p>
                                  <p style={{ margin: '2px 0 0 0' }}><strong>A/C:</strong> {w.payment_details?.account_number}</p>
                                  <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Holder: {w.payment_details?.account_name} | IFSC: {w.payment_details?.ifsc_code}</p>
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{
                                padding: '3px 10px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                backgroundColor:
                                  w.status === 'paid' ? '#dcfce7' :
                                  w.status === 'approved' ? '#dbeafe' :
                                  w.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                color:
                                  w.status === 'paid' ? '#15803d' :
                                  w.status === 'approved' ? '#1d4ed8' :
                                  w.status === 'rejected' ? '#991b1b' : '#b45309',
                                border: '1px solid ' + (
                                  w.status === 'paid' ? '#bbf7d0' :
                                  w.status === 'approved' ? '#bfdbfe' :
                                  w.status === 'rejected' ? '#fecaca' : '#fde68a'
                                )
                              }}>
                                {w.status.toUpperCase()}
                              </span>
                              {w.status === 'rejected' && w.admin_notes && (
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#dc2626' }}>Reason: {w.admin_notes}</p>
                              )}
                              {w.status === 'paid' && w.txn_id && (
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#16a34a', fontFamily: 'monospace' }}>Txn Ref: {w.txn_id}</p>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                              {new Date(w.created_at).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                                {w.status === 'pending' && (
                                  <button
                                    onClick={() => handleApproveWithdrawal(w.id)}
                                    disabled={isProcessingWithdrawal === w.id}
                                    style={{
                                      backgroundColor: '#dbeafe',
                                      color: '#1d4ed8',
                                      border: 'none',
                                      padding: '5px 10px',
                                      borderRadius: 'var(--radius-sm)',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Approve
                                  </button>
                                )}
                                {(w.status === 'pending' || w.status === 'approved') && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setTxnInputId(w.id);
                                        setTxnRefNumber('');
                                      }}
                                      disabled={isProcessingWithdrawal === w.id}
                                      style={{
                                        backgroundColor: 'var(--primary-lime)',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '5px 10px',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Mark Paid
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRejectingWithdrawalId(w.id);
                                        setRejectReason('');
                                      }}
                                      disabled={isProcessingWithdrawal === w.id}
                                      style={{
                                        backgroundColor: '#fee2e2',
                                        color: '#991b1b',
                                        border: 'none',
                                        padding: '5px 10px',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Inline Rejection Panel */}
                {rejectingWithdrawalId && (
                  <div style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    marginTop: '20px',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#991b1b' }}>Reject Payout Request</h4>
                      <button
                        onClick={() => setRejectingWithdrawalId(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <form onSubmit={handleRejectWithdrawalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b' }}>Reason for Rejection</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Invalid UPI ID details, incorrect account holder name matching..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          style={{
                            border: '1px solid #fecaca',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            outline: 'none',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isProcessingWithdrawal === rejectingWithdrawalId}
                        style={{
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          width: 'fit-content'
                        }}
                      >
                        Confirm Rejection
                      </button>
                    </form>
                  </div>
                )}

                {/* Inline Mark Paid Panel */}
                {txnInputId && (
                  <div style={{
                    backgroundColor: 'var(--primary-lime-light)',
                    border: '1px solid var(--primary-lime)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    marginTop: '20px',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--primary-lime)' }}>Enter Transaction Reference Details</h4>
                      <button
                        onClick={() => setTxnInputId(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-lime)' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <form onSubmit={handleMarkWithdrawalPaidSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-lime)' }}>Transaction ID / Reference Number</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. UPI Ref txn hash or Bank IMPS number..."
                          value={txnRefNumber}
                          onChange={(e) => setTxnRefNumber(e.target.value)}
                          style={{
                            border: '1px solid var(--primary-lime)',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            outline: 'none',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isProcessingWithdrawal === txnInputId}
                        style={{
                          backgroundColor: 'var(--primary-lime)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          width: 'fit-content'
                        }}
                      >
                        Finalize Payout
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB CONTENT: PUNDIT MANAGER */}
            {affiliateSubTab === 'pundits' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* 1. Create Pundit Form & Success Panel */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🕉️</span> Create New Pandit Account
                  </h3>
                  
                  {punditError && (
                    <div style={{
                      backgroundColor: '#fee2e2',
                      border: '1px solid #fecaca',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      color: '#b91c1c',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      marginBottom: '16px'
                    }}>
                      {punditError}
                    </div>
                  )}

                  {punditCreationResult ? (
                    <div style={{
                      backgroundColor: 'rgba(132, 204, 22, 0.1)',
                      border: '1px solid var(--primary-lime)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px',
                      marginBottom: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, color: 'var(--primary-forest)', fontWeight: 800 }}>🎉 Pandit Profile Created Successfully!</h4>
                        <button
                          onClick={() => setPunditCreationResult(null)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--primary-forest)',
                            fontWeight: 'bold',
                            fontSize: '0.85rem'
                          }}
                        >
                          Dismiss
                        </button>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>
                        Provide these credentials to <strong>{punditCreationResult.name}</strong> to log in:
                      </p>
                      <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px 16px',
                        fontSize: '0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        fontFamily: 'monospace'
                      }}>
                        <div><strong>Phone Number:</strong> {punditCreationResult.phone}</div>
                        <div><strong>Custom Password:</strong> {punditCreationResult.password}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                          <strong>Login URL:</strong>
                          <span style={{ color: 'var(--text-muted)' }}>{punditCreationResult.url}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(punditCreationResult.url);
                              alert('Login link copied to clipboard!');
                            }}
                            style={{
                              backgroundColor: 'var(--primary-lime-light)',
                              color: 'var(--primary-lime)',
                              border: '1px solid var(--primary-lime)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Copy URL
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCreatePundit} style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px',
                      alignItems: 'end'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dark)' }}>FULL NAME *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Shastri Shastri Ji"
                          value={newPunditName}
                          onChange={(e) => setNewPunditName(e.target.value)}
                          style={{
                            border: '1.5px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 12px',
                            fontSize: '0.85rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dark)' }}>WHATSAPP NUMBER *</label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +91 98765 43210"
                          value={newPunditPhone}
                          onChange={(e) => setNewPunditPhone(e.target.value)}
                          style={{
                            border: '1.5px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 12px',
                            fontSize: '0.85rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-dark)' }}>SECURITY PASSWORD *</label>
                        <input
                          type="text"
                          required
                          placeholder="Set custom password"
                          value={newPunditPassword}
                          onChange={(e) => setNewPunditPassword(e.target.value)}
                          style={{
                            border: '1.5px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 12px',
                            fontSize: '0.85rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isCreatingPundit}
                        style={{
                          backgroundColor: 'var(--primary-forest)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          padding: '12px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: isCreatingPundit ? 'not-allowed' : 'pointer',
                          opacity: isCreatingPundit ? 0.8 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          height: '42px'
                        }}
                      >
                        {isCreatingPundit ? 'Creating...' : 'Create Pandit Profile'}
                      </button>
                    </form>
                  )}
                </div>

                {/* 2. Pundits Directory Table */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🕉️</span> Pandit Directory & Controls
                  </h3>

                  {isLoadingPundits ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      Loading pandits database...
                    </div>
                  ) : pundits.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                      No pandits registered. Add a pandit above to get started.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--border-light)' }}>
                            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Shastri Details</th>
                            <th style={{ padding: '12px 16px', fontWeight: 700 }}>WhatsApp Phone</th>
                            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Affiliate Code</th>
                            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Joined Date</th>
                            <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pundits.map((p) => (
                            <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '12px 16px', fontWeight: 'bold', color: 'var(--text-dark)' }}>
                                {p.full_name}
                              </td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                                {p.phone_number}
                              </td>
                              <td style={{ padding: '12px 16px', fontWeight: 'bold', color: 'var(--primary-forest)' }}>
                                <code>{p.affiliate_code}</code>
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{
                                  padding: '3px 10px',
                                  borderRadius: 'var(--radius-full)',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  backgroundColor:
                                    p.affiliate_status === 'active' ? '#dcfce7' :
                                    p.affiliate_status === 'pending' ? '#fef3c7' : '#fee2e2',
                                  color:
                                    p.affiliate_status === 'active' ? '#15803d' :
                                    p.affiliate_status === 'pending' ? '#b45309' : '#991b1b',
                                  border: '1px solid ' + (
                                    p.affiliate_status === 'active' ? '#bbf7d0' :
                                    p.affiliate_status === 'pending' ? '#fde68a' : '#fecaca'
                                  )
                                }}>
                                  {p.affiliate_status.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                                {new Date(p.affiliate_joined_at || p.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                                  <button
                                    onClick={() => {
                                      const loginUrl = `${window.location.origin}/pundit-login`;
                                      navigator.clipboard.writeText(loginUrl);
                                      alert('Shastri custom login URL copied!');
                                    }}
                                    style={{
                                      backgroundColor: '#f1f5f9',
                                      color: '#334155',
                                      border: '1px solid #cbd5e1',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Copy Link
                                  </button>
                                  <button
                                    onClick={() => {
                                      const nextStatus = p.affiliate_status === 'active' ? 'suspended' : 'active';
                                      handleUpdateAffiliateStatus(p.id, nextStatus).then(() => {
                                        // Update pundit list local state too
                                        setPundits(prev => prev.map(x => x.id === p.id ? { ...x, affiliate_status: nextStatus } : x));
                                      });
                                    }}
                                    style={{
                                      backgroundColor: p.affiliate_status === 'active' ? '#fee2e2' : '#dcfce7',
                                      color: p.affiliate_status === 'active' ? '#dc2626' : '#16a34a',
                                      border: 'none',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {p.affiliate_status === 'active' ? 'Suspend' : 'Activate'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setResetPunditId(p.id);
                                      setResetPunditPassword('');
                                    }}
                                    style={{
                                      backgroundColor: 'var(--primary-forest)',
                                      color: '#ffffff',
                                      border: 'none',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Reset Password
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Password Reset Section */}
                  {resetPunditId && (
                    <div style={{
                      backgroundColor: 'rgba(45, 20, 14, 0.03)',
                      border: '1.5px dashed var(--primary-forest)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px',
                      marginTop: '20px',
                      textAlign: 'left'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--primary-forest)', margin: 0 }}>
                          Reset Shastri Password
                        </h4>
                        <button
                          onClick={() => setResetPunditId(null)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 'bold' }}
                        >
                          Cancel
                        </button>
                      </div>
                      <form onSubmit={handleResetPunditPassword} style={{ display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '220px', flex: 1 }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dark)' }}>NEW CUSTOM SECURITY PASSWORD</label>
                          <input
                            type="text"
                            required
                            placeholder="Enter new custom password"
                            value={resetPunditPassword}
                            onChange={(e) => setResetPunditPassword(e.target.value)}
                            style={{
                              border: '1.5px solid var(--border-light)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '8px 12px',
                              fontSize: '0.8rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isResettingPassword}
                          style={{
                            backgroundColor: 'var(--primary-lime)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '9px 16px',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: isResettingPassword ? 'not-allowed' : 'pointer',
                            opacity: isResettingPassword ? 0.7 : 1,
                            height: '35px'
                          }}
                        >
                          {isResettingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* =======================================================
            TAB: DEVOTEE DIRECTORY
            ======================================================= */}
        {activeTab === 'users' && (
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Header section */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                Devotee Directory
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                View all registered devotee profiles, verify their accounts, monitor status, temporarily suspend, or permanently cascade delete devotee information.
              </p>
            </div>

            {/* Directory controls */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
                  <input
                    type="text"
                    placeholder="Search devotees by name, phone, or email..."
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-light)',
                      outline: 'none',
                      fontSize: '0.85rem'
                    }}
                  />
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                    <Search size={16} />
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Total Devotees: {usersState.length}
                </div>
              </div>

              {isLoadingUsers ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <div style={{ width: '28px', height: '28px', border: '3px solid #e5e7eb', borderTopColor: 'var(--primary-lime)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                  <span>Loading devotee registry database...</span>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--border-light)' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 700 }}>Devotee Name</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700 }}>WhatsApp Number</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700 }}>Email Address</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700 }}>Registration Date</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700 }}>Account Status</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Controls</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersState.filter(user => {
                        const q = searchUserQuery.toLowerCase();
                        return (user.full_name || '').toLowerCase().includes(q) ||
                               (user.phone_number || '').toLowerCase().includes(q) ||
                               (user.email || '').toLowerCase().includes(q);
                      }).length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No devotee profiles match your search criteria.
                          </td>
                        </tr>
                      ) : (
                        usersState
                          .filter(user => {
                            const q = searchUserQuery.toLowerCase();
                            return (user.full_name || '').toLowerCase().includes(q) ||
                                   (user.phone_number || '').toLowerCase().includes(q) ||
                                   (user.email || '').toLowerCase().includes(q);
                          })
                          .map((user) => (
                            <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '12px 16px', fontWeight: 'bold', color: 'var(--text-dark)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '1.25rem' }}>{user.is_pundit ? '🕉️' : '👤'}</span>
                                  <div>
                                    <span>{user.full_name}</span>
                                    {user.is_pundit && (
                                      <span style={{
                                        marginLeft: '6px',
                                        fontSize: '0.62rem',
                                        backgroundColor: 'var(--primary-lime-light)',
                                        color: 'var(--primary-lime)',
                                        padding: '1.5px 5px',
                                        borderRadius: '4px',
                                        fontWeight: 800
                                      }}>
                                        PUNDIT
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                                {user.phone_number}
                              </td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                                {user.email || 'N/A'}
                              </td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                                {new Date(user.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{
                                  padding: '3px 10px',
                                  borderRadius: 'var(--radius-full)',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  backgroundColor: user.is_suspended ? '#fee2e2' : '#dcfce7',
                                  color: user.is_suspended ? '#991b1b' : '#15803d',
                                  border: '1px solid ' + (user.is_suspended ? '#fecaca' : '#bbf7d0')
                                }}>
                                  {user.is_suspended ? 'SUSPENDED' : 'ACTIVE'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                  <button
                                    onClick={() => handleToggleSuspendUser(user.id, !!user.is_suspended)}
                                    disabled={isSuspendingUser === user.id}
                                    style={{
                                      backgroundColor: user.is_suspended ? '#dcfce7' : '#fee2e2',
                                      color: user.is_suspended ? '#15803d' : '#dc2626',
                                      border: 'none',
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      cursor: isSuspendingUser === user.id ? 'not-allowed' : 'pointer',
                                      opacity: isSuspendingUser === user.id ? 0.7 : 1,
                                      width: '80px',
                                      textAlign: 'center'
                                    }}
                                  >
                                    {isSuspendingUser === user.id ? '...' : (user.is_suspended ? 'Activate' : 'Suspend')}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id, user.full_name)}
                                    disabled={isDeletingUser === user.id}
                                    style={{
                                      backgroundColor: '#dc2626',
                                      color: '#ffffff',
                                      border: 'none',
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      cursor: isDeletingUser === user.id ? 'not-allowed' : 'pointer',
                                      opacity: isDeletingUser === user.id ? 0.7 : 1
                                    }}
                                  >
                                    {isDeletingUser === user.id ? 'Deleting...' : 'Delete'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        </div>
      </main>

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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
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

                {/* Purchase Limit */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Purchase Limit</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="No limit"
                    value={productForm.purchaseLimit || ''}
                    onChange={(e) => setProductForm({ ...productForm, purchaseLimit: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.88rem' }}
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
                    User ID: <code style={{ backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '4.5px', fontSize: '0.75rem', fontWeight: 'bold' }}>{selectedOrderDetails.userId || 'Guest'}</code>
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

              {/* Payment Screenshot Proof */}
              {selectedOrderDetails.paymentScreenshot && (
                <div style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Eye size={14} style={{ color: 'var(--primary-forest)' }} />
                      Payment Proof Screenshot
                    </h4>

                    {/* Payment Status Badge */}
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      backgroundColor: selectedOrderDetails.paymentStatus === 'Confirmed' ? '#dcfce7' : '#fee2e2',
                      color: selectedOrderDetails.paymentStatus === 'Confirmed' ? '#15803d' : '#dc2626',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      textTransform: 'uppercase'
                    }}>
                      {selectedOrderDetails.paymentStatus || 'Pending'}
                    </span>
                  </div>

                  {/* Decline warning alert */}
                  {selectedOrderDetails.paymentDeclineCount !== undefined && selectedOrderDetails.paymentDeclineCount > 0 && (
                    <div style={{
                      padding: '10px 12px',
                      backgroundColor: '#fffbeb',
                      border: '1.5px solid #fef3c7',
                      borderRadius: '6px',
                      color: '#b45309',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
                      <span>
                        Payment declined {selectedOrderDetails.paymentDeclineCount} time(s). (Attempt {selectedOrderDetails.paymentDeclineCount}/3)
                      </span>
                    </div>
                  )}

                  {/* Approve/Confirm & Decline Buttons */}
                  {selectedOrderDetails.status === 'Cancelled' ? (
                    <div style={{
                      padding: '10px',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      border: '1px solid #fca5a5'
                    }}>
                      Order has been Cancelled. No payment actions available.
                    </div>
                  ) : selectedOrderDetails.paymentStatus === 'Confirmed' ? (
                    <button
                      onClick={() => handleUpdatePaymentStatus(selectedOrderDetails.orderId, 'Pending')}
                      style={{
                        padding: '10px',
                        justifyContent: 'center',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        width: '100%',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      Revert Payment to Pending
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <button
                        onClick={() => handleUpdatePaymentStatus(selectedOrderDetails.orderId, 'Confirmed')}
                        className="btn-lime"
                        style={{
                          flex: 1,
                          padding: '10px',
                          justifyContent: 'center',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          border: 'none',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        Approve & Confirm
                      </button>
                      <button
                        onClick={() => handleDeclinePayment(selectedOrderDetails.orderId)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          justifyContent: 'center',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        Decline Payment
                      </button>
                    </div>
                  )}
                  <div style={{ 
                    position: 'relative', 
                    overflow: 'hidden', 
                    borderRadius: 'var(--radius-sm)', 
                    border: '1px solid var(--border-light)', 
                    backgroundColor: '#ffffff', 
                    textAlign: 'center', 
                    padding: '8px' 
                  }}>
                    <img 
                      src={selectedOrderDetails.paymentScreenshot} 
                      alt="Payment Screenshot Proof" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '220px', 
                        objectFit: 'contain', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease-in-out'
                      }}
                      onClick={() => window.open(selectedOrderDetails.paymentScreenshot, '_blank')}
                      onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                      onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                    <div style={{ marginTop: '8px', fontSize: '0.78rem' }}>
                      <a 
                        href={selectedOrderDetails.paymentScreenshot} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ 
                          color: 'var(--primary-forest)', 
                          fontWeight: 700, 
                          textDecoration: 'underline',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        View Full Screen
                      </a>
                    </div>
                  </div>
                </div>
              )}

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

      {/* Premium Media Uploading & Saving Overlay Modal */}
      {(isSavingPooja || isSavingHomepage || isSavingShopBanners) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
                animation: 'pulse 2s infinite'
              }}>
                <Upload size={32} />
              </div>
            </div>
            
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
                Uploading & Saving Assets
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#6b7280', margin: 0 }}>
                Please wait while we compress and upload your media assets to Cloudflare R2 CDN, and update the database records.
              </p>
            </div>

            {/* List of files in queue being processed */}
            <div style={{
              maxHeight: '240px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '4px',
              textAlign: 'left'
            }}>
              {Object.keys(mediaQueue).length > 0 ? (
                Object.entries(mediaQueue)
                  .filter(([_, item]) => item.status !== 'uploaded' && item.status !== 'failed')
                  .map(([tempId, _]) => (
                    <CompressionStatusWidget key={tempId} tempId={tempId} mediaQueue={mediaQueue} />
                  ))
              ) : (
                <div style={{ textAlign: 'center', padding: '16px', color: '#9ca3af', fontSize: '0.85rem' }}>
                  Updating database records...
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.82rem', color: '#4b5563' }}>
              <span style={{
                width: '16px',
                height: '16px',
                border: '2px solid #e5e7eb',
                borderTopColor: 'var(--primary-lime, #84cc16)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span>Finalizing updates, do not close this window...</span>
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
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.85; }
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
