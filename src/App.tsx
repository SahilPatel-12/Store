import React from 'react';
import { Search, User, ShoppingBag, Heart, Menu, X, ChevronDown, ChevronLeft, ChevronRight, Star, Plus, Minus } from 'lucide-react';
import { ProductModal } from './components/ProductModal';
import type { OrderDetails } from './components/OrderSuccessPage';
import type { Product, CartItem, LocalOrder } from './types';
import { supabase } from './lib/supabase';
import { isImageUrl, getDisplayImageUrl } from './lib/imageHelper';
import logo from './assets/My_logo/Frame 16.png';


// Dynamically imported page components for optimal compilation and load performance
const ShopPage = React.lazy(() => import('./components/ShopPage').then(m => ({ default: m.ShopPage })));
const CategoryPage = React.lazy(() => import('./components/CategoryPage').then(m => ({ default: m.CategoryPage })));
const ProductDetailPage = React.lazy(() => import('./components/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const SearchPage = React.lazy(() => import('./components/SearchPage').then(m => ({ default: m.SearchPage })));
const CartPage = React.lazy(() => import('./components/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = React.lazy(() => import('./components/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderSuccessPage = React.lazy(() => import('./components/OrderSuccessPage').then(m => ({ default: m.OrderSuccessPage })));
const UserProfilePage = React.lazy(() => import('./components/UserProfilePage').then(m => ({ default: m.UserProfilePage })));
const OrdersPage = React.lazy(() => import('./components/OrdersPage').then(m => ({ default: m.OrdersPage })));
const WishlistPage = React.lazy(() => import('./components/WishlistPage').then(m => ({ default: m.WishlistPage })));
const AboutUsPage = React.lazy(() => import('./components/AboutUsPage').then(m => ({ default: m.AboutUsPage })));
const ContactUsPage = React.lazy(() => import('./components/ContactUsPage').then(m => ({ default: m.ContactUsPage })));
const PoliciesPage = React.lazy(() => import('./components/PoliciesPage').then(m => ({ default: m.PoliciesPage })));
const AdminPanelPage = React.lazy(() => import('./components/AdminPanelPage').then(m => ({ default: m.AdminPanelPage })));
const AdminLoginPage = React.lazy(() => import('./components/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const UserAuthPage = React.lazy(() => import('./components/UserAuthPage').then(m => ({ default: m.UserAuthPage })));

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

const initialOrders: LocalOrder[] = [
  {
    orderId: 'MANTRA-94812',
    placedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    total: 108.0,
    subtotal: 98.0,
    discount: 0,
    discountPercent: 0,
    shipping: 0,
    tax: 10.0,
    paymentMethod: 'UPI',
    deliveryCity: 'Varanasi',
    deliveryState: 'Uttar Pradesh',
    fullName: 'Sahil Patel',
    email: 'sahil.patel@devotion.com',
    phoneNumber: '+91 98765 43210',
    addressLine1: '12 Ganga Ghat Marg, Kedar Ghat',
    pincode: '221001',
    status: 'Delivered',
    items: [
      {
        product: {
          id: 'p1',
          name: 'Panchmukhi Himalayan Rudraksha Mala',
          price: 19.99,
          image: '📿',
          spiritualType: 'Meditation',
          description: 'Authentic 108+1 beads Panchmukhi (five-faced) Rudraksha Japa Mala sourced from Nepalese foothills.',
          category: 'Rudraksha',
          rating: 4.9,
          reviewsCount: 215,
          inStock: true,
          benefits: [],
          popularity: 95
        },
        quantity: 1
      },
      {
        product: {
          id: 'p14',
          name: 'Brass Incense & Dhoop Cup Holder',
          price: 15.99,
          image: '🏺',
          spiritualType: 'Aromatherapy',
          description: 'Artistic brass burner styled for holding agarbatti (sticks) and dhoop cups.',
          category: 'Incense Holders',
          rating: 4.7,
          reviewsCount: 95,
          inStock: true,
          benefits: [],
          popularity: 80
        },
        quantity: 2
      }
    ]
  },
  {
    orderId: 'MANTRA-92144',
    placedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    total: 11.99,
    subtotal: 11.99,
    discount: 0,
    discountPercent: 0,
    shipping: 0,
    tax: 0.0,
    paymentMethod: 'Cash on Delivery',
    deliveryCity: 'Noida',
    deliveryState: 'Uttar Pradesh',
    fullName: 'Sahil Patel',
    email: 'sahil.patel@devotion.com',
    phoneNumber: '+91 98765 43210',
    addressLine1: 'Sector 62, Dev Tower, Suite 404',
    pincode: '201301',
    status: 'Delivered',
    items: [
      {
        product: {
          id: 'p6',
          name: 'Pure Bhimseni Camphor Tablets',
          price: 11.99,
          image: '❄️',
          spiritualType: 'Aromatherapy',
          description: '100% organic, chemical-free Bhimseni camphor.',
          category: 'Camphor',
          rating: 4.9,
          reviewsCount: 140,
          inStock: true,
          benefits: [],
          popularity: 90
        },
        quantity: 1
      }
    ]
  }
];

function App() {
  const [currentPageState, setCurrentPageState] = React.useState<'home' | 'shop' | 'category' | 'detail' | 'search' | 'cart' | 'checkout' | 'success' | 'profile' | 'orders' | 'wishlist' | 'about' | 'contact' | 'policies' | 'admin' | 'admin-login' | 'user-auth'>('shop');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mobileCategoriesExpanded, setMobileCategoriesExpanded] = React.useState(false);
  
  const [loggedInUser, setLoggedInUser] = React.useState<{ id: string; fullName: string; email: string; phoneNumber: string } | null>(() => {
    try {
      const storedToken = localStorage.getItem('session_token');
      if (!storedToken || storedToken === '260529') {
        localStorage.removeItem('mantra_user_session');
        localStorage.removeItem('session_token');
        return null;
      }
      const stored = localStorage.getItem('mantra_user_session');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [profileInitialTab] = React.useState<'info' | 'orders' | 'addresses' | 'wishlist' | 'notifications' | 'logout' | 'affiliate'>('info');

  const [authRedirectPage, setAuthRedirectPage] = React.useState<'checkout' | 'wishlist' | 'orders' | 'profile' | null>(null);
  const [pendingBuyNow, setPendingBuyNow] = React.useState<{ product: Product; qty: number } | null>(null);
  const [pendingWishlistToggle, setPendingWishlistToggle] = React.useState<string | null>(null);

  const [currentAdmin, setCurrentAdmin] = React.useState<{ username: string; loginTime: string; token: string | null } | null>(() => {
    try {
      const stored = localStorage.getItem('ridae_admin_auth_session');
      if (stored) {
        const session = JSON.parse(stored);
        if (session && session.isAuthenticated && session.expireTime > Date.now()) {
          return { username: session.username, loginTime: session.loginTime, token: session.token || null };
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = React.useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('ridae_admin_auth_session');
      if (stored) {
        const session = JSON.parse(stored);
        if (session && session.isAuthenticated && session.expireTime > Date.now()) {
          return true;
        }
        localStorage.removeItem('ridae_admin_auth_session');
        localStorage.removeItem('ridae_admin_auth');
      }
      return localStorage.getItem('ridae_admin_auth') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Lifted stateful catalog products
  const [productsState, setProductsState] = React.useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem('ridae_products');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('ridae_products', JSON.stringify(productsState));
    } catch (e) {
      console.error(e);
    }
  }, [productsState]);

  React.useEffect(() => {
    const parseAndLogReferral = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        
        if (refCode && refCode.startsWith('MP')) {
          console.log('[Referral Engine] Detected referral code in URL:', refCode);
          
          // 1. Call validate_referral_code RPC
          const { data: valData, error: valError } = await supabase.rpc('validate_referral_code', {
            p_code: refCode
          });

          if (!valError && valData && valData.length > 0 && valData[0].is_valid) {
            console.log('[Referral Engine] Active referral code verified:', refCode, 'Referrer:', valData[0].referrer_name);
            
            // 2. Log click to DB
            const { error: clickError } = await supabase.rpc('log_referral_click', {
              p_referral_code: refCode,
              p_landing_page: window.location.pathname + window.location.search,
              p_device_id: 'browser_client',
              p_ip: '127.0.0.1', // DB resolved or fallback
              p_user_agent: navigator.userAgent
            });

            if (clickError) {
              console.warn('[Referral Engine] Click logging failed:', clickError.message);
            }

            // 3. Save to localStorage with current timestamp
            localStorage.setItem('mantra_referral_code', refCode);
            localStorage.setItem('mantra_referral_time', Date.now().toString());
          } else {
            console.warn('[Referral Engine] Referral code is invalid or suspended:', refCode);
          }
        }
      } catch (err) {
        console.error('[Referral Engine] Error processing referral parameter:', err);
      }
    };

    parseAndLogReferral();
  }, []);

  const [selectedCategoryName, setSelectedCategoryName] = React.useState<string>('Rudraksha');
  const [searchQueryTerm, setSearchQueryTerm] = React.useState<string>('');
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);

  const [floatingEffects, setFloatingEffects] = React.useState<{ id: number; x: number; y: number }[]>([]);
  const [isCartBouncing, setIsCartBouncing] = React.useState(false);
  const [flyingDots, setFlyingDots] = React.useState<{ id: number; startX: number; startY: number; targetX: string; targetY: string }[]>([]);

  // Periodically check admin session expiration (session management)
  React.useEffect(() => {
    if (!isAdminAuthenticated) return;

    const checkInterval = setInterval(() => {
      try {
        const stored = localStorage.getItem('ridae_admin_auth_session');
        if (stored) {
          const session = JSON.parse(stored);
          if (session && session.expireTime && Date.now() > session.expireTime) {
            alert('Your administrator session has expired. Please log in again.');
            localStorage.removeItem('ridae_admin_auth_session');
            localStorage.removeItem('ridae_admin_auth');
            setIsAdminAuthenticated(false);
            setCurrentAdmin(null);
            setCurrentPageState('admin-login');
          }
        }
      } catch (e) {}
    }, 15000);

    return () => clearInterval(checkInterval);
  }, [isAdminAuthenticated]);

  React.useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button');
      if (button && (
        button.innerText.toUpperCase().includes('ADD TO CART') ||
        button.innerText.toUpperCase().includes('MOVE TO CART') ||
        button.innerText.toUpperCase().includes('ADD TO BAG') ||
        button.innerText.toUpperCase().includes('BUY NOW') ||
        button.classList.contains('qty-plus-btn')
      )) {
        const effectId = Date.now() + Math.random();
        const newEffect = {
          id: effectId,
          x: e.clientX,
          y: e.clientY
        };
        setFloatingEffects(prev => [...prev, newEffect]);
        setTimeout(() => {
          setFloatingEffects(prev => prev.filter(eff => eff.id !== effectId));
        }, 800);

        // Fly-to-Cart Animation
        const cartBtn = document.querySelector('.navbar-cart-btn');
        const rect = cartBtn?.getBoundingClientRect();
        const endX = rect ? rect.left + rect.width / 2 : window.innerWidth - 100;
        const endY = rect ? rect.top + rect.height / 2 : 40;

        const dotId = Date.now() + Math.random();
        setFlyingDots(prev => [...prev, {
          id: dotId,
          startX: e.clientX,
          startY: e.clientY,
          targetX: `${endX - e.clientX}px`,
          targetY: `${endY - e.clientY}px`
        }]);
        setTimeout(() => {
          setFlyingDots(prev => prev.filter(d => d.id !== dotId));
        }, 650);

        setIsCartBouncing(true);
        setTimeout(() => {
          setIsCartBouncing(false);
        }, 500);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Dynamic Slugification Resolvers
  const getProductSlug = (product: Product): string => {
    if ('slug' in product && (product as any).slug) {
      return (product as any).slug;
    }
    return product.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[-\s]+/g, '-');
  };

  const getCategorySlug = (category: string): string => {
    return category
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[-\s]+/g, '-');
  };

  const getCategoryFromSlug = (slug: string): string => {
    return categories.find(cat => getCategorySlug(cat) === slug) || 'Rudraksha';
  };

  const setCurrentPage = (
    page: 'home' | 'shop' | 'category' | 'detail' | 'search' | 'cart' | 'checkout' | 'success' | 'profile' | 'orders' | 'wishlist' | 'about' | 'contact' | 'policies' | 'admin' | 'admin-login' | 'user-auth',
    options?: { categoryName?: string; product?: Product; searchQuery?: string }
  ) => {
    setMobileMenuOpen(false);
    setMobileCategoriesExpanded(false);
    // Intercept protected devotee page routing
    if (page === 'checkout' || page === 'wishlist' || page === 'orders' || page === 'profile') {
      if (!loggedInUser) {
        if (page !== 'profile') {
          alert(`Please log in or register to access ${page === 'checkout' ? 'checkout' : page}.`);
        }
        setAuthRedirectPage(page === 'profile' ? null : page);
        page = 'user-auth';
      }
    }

    let path = '/';

    // Determine target path based on page state
    switch (page) {
      case 'home':
        path = '/';
        break;
      case 'shop':
        path = '/product';
        break;
      case 'category':
        const catName = options?.categoryName || selectedCategoryName;
        path = `/category/${getCategorySlug(catName)}`;
        break;
      case 'detail':
        const prod = options?.product || selectedProduct;
        if (prod) {
          path = `/product/${getProductSlug(prod)}`;
        } else {
          path = '/product';
        }
        break;
      case 'search':
        const query = options?.searchQuery || searchQueryTerm;
        path = query ? `/search?q=${encodeURIComponent(query)}` : '/search';
        break;
      case 'cart':
        path = '/cart';
        break;
      case 'checkout':
        path = '/checkout';
        break;
      case 'success':
        path = '/success';
        break;
      case 'orders':
        path = '/orders';
        break;
      case 'profile':
        path = '/profile';
        break;
      case 'wishlist':
        path = '/wishlist';
        break;
      case 'about':
        path = '/about';
        break;
      case 'contact':
        path = '/contact';
        break;
      case 'policies':
        path = '/policies';
        break;
      case 'admin-login':
      case 'admin':
        path = '/admin';
        break;
      case 'user-auth':
        path = '/auth';
        break;
      default:
        path = '/';
    }

    // Set page states
    if (page === 'admin' || page === 'admin-login') {
      setCurrentPageState(isAdminAuthenticated ? 'admin' : 'admin-login');
    } else {
      if (currentPageState === 'admin' || currentPageState === 'admin-login') {
        try {
          localStorage.removeItem('ridae_admin_auth_session');
          localStorage.removeItem('ridae_admin_auth');
        } catch (e) {}
        setIsAdminAuthenticated(false);
        setCurrentAdmin(null);
      }
      setCurrentPageState(page);
    }

    // Sync options to react states
    if (options?.categoryName) {
      setSelectedCategoryName(options.categoryName);
    }
    if (options?.product) {
      setSelectedProduct(options.product);
    }
    if (options?.searchQuery !== undefined) {
      setSearchQueryTerm(options.searchQuery);
    }

    // Pushes browser state URL if it has changed
    if (window.location.pathname + window.location.search !== path) {
      window.history.pushState({}, '', path);
    }
  };

  const currentPage = currentPageState;

  // Reactive URL popstate and deep-linking router
  const handleUrlRouting = React.useCallback((path: string, search: string) => {
    if (path.startsWith('/admin')) {
      if (isAdminAuthenticated) {
        setCurrentPageState('admin');
      } else {
        setCurrentPageState('admin-login');
      }
    } else {
      if (isAdminAuthenticated) {
        try {
          localStorage.removeItem('ridae_admin_auth_session');
          localStorage.removeItem('ridae_admin_auth');
        } catch (e) {}
        setIsAdminAuthenticated(false);
        setCurrentAdmin(null);
      }

      if (path === '/' || path === '') {
        setCurrentPageState('home');
      } else if (path === '/product' || path === '/product/') {
        setCurrentPageState('shop');
      } else if (path.startsWith('/category/')) {
        const catSlug = path.substring(10).replace(/\/$/, '');
        const categoryName = getCategoryFromSlug(catSlug);
        setSelectedCategoryName(categoryName);
        setCurrentPageState('category');
      } else if (path.startsWith('/product/')) {
        const prodSlug = path.substring(9).replace(/\/$/, '');
        const foundProduct = productsState.find(p => getProductSlug(p) === prodSlug);
        if (foundProduct) {
          setSelectedProduct(foundProduct);
          setCurrentPageState('detail');
        } else {
          setCurrentPageState('shop');
        }
      } else if (path === '/search' || path === '/search/') {
        const params = new URLSearchParams(search);
        const q = params.get('q') || '';
        setSearchQueryTerm(q);
        setCurrentPageState('search');
      } else if (path === '/cart' || path === '/cart/') {
        setCurrentPageState('cart');
      } else if (path === '/checkout' || path === '/checkout/') {
        if (loggedInUser) {
          setCurrentPageState('checkout');
        } else {
          setAuthRedirectPage('checkout');
          setCurrentPageState('user-auth');
        }
      } else if (path === '/success' || path === '/success/') {
        setCurrentPageState('success');
      } else if (path === '/orders' || path === '/orders/') {
        if (loggedInUser) {
          setCurrentPageState('orders');
        } else {
          setAuthRedirectPage('orders');
          setCurrentPageState('user-auth');
        }
      } else if (path === '/profile' || path === '/profile/') {
        if (loggedInUser) {
          setCurrentPageState('profile');
        } else {
          setCurrentPageState('user-auth');
        }
      } else if (path === '/wishlist' || path === '/wishlist/') {
        if (loggedInUser) {
          setCurrentPageState('wishlist');
        } else {
          setAuthRedirectPage('wishlist');
          setCurrentPageState('user-auth');
        }
      } else if (path === '/about' || path === '/about/') {
        setCurrentPageState('about');
      } else if (path === '/contact' || path === '/contact/') {
        setCurrentPageState('contact');
      } else if (path === '/policies' || path === '/policies/') {
        setCurrentPageState('policies');
      } else if (path === '/auth' || path === '/auth/') {
        setCurrentPageState('user-auth');
      } else {
        setCurrentPageState('shop');
      }
    }
  }, [isAdminAuthenticated, productsState, loggedInUser]);

  // popstate browser navigation sync
  React.useEffect(() => {
    const handlePopState = () => {
      handleUrlRouting(window.location.pathname, window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleUrlRouting]);

  // Direct load deep-linking on mount (also runs when dynamic database products are loaded)
  React.useEffect(() => {
    handleUrlRouting(window.location.pathname, window.location.search);
  }, [productsState, handleUrlRouting]);



  // Load published pooja products from Supabase and merge with static mock products
  const loadPublishedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('website_pooja_products')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const mappedData: Product[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
          originalPrice: item.original_price ? (typeof item.original_price === 'string' ? parseFloat(item.original_price) : item.original_price) : undefined,
          rating: typeof item.rating === 'string' ? parseFloat(item.rating) : (item.rating || 5.0),
          reviewsCount: item.reviews_count || 0,
          image: item.image || '📿',
          category: item.category,
          inStock: item.in_stock ?? true,
          benefits: item.benefits || [],
          popularity: item.popularity || 80,
          spiritualType: item.spiritual_type || 'Rituals',
          // custom fields to keep compatibility with PoojaProduct:
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
          ritualsIncluded: item.rituals_included || [],
          samagriList: item.samagri_list || [],
          priestDetails: item.priest_details || { name: '', experience: '', bio: '', qualification: '' },
          duration: item.duration,
          idealOccasions: item.ideal_occasions || [],
          templeAssociation: item.temple_association,
          whoShouldPerform: item.who_should_perform,
          offers: item.offers || [],
          badges: item.badges || [],
          testimonials: item.testimonials || [],
          faqs: item.faqs || [],
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
          relatedProducts: item.related_products || [],
          videoUrl: item.video_url,
          translations: item.translations || {},
          uiLabels: item.ui_labels || {},
          publishedAt: item.published_at,
          isPublished: item.is_published || false,
          bannerImage: item.banner_image,
          galleryImages: item.gallery_images || [],
          ritualImages: item.ritual_images || [],
          priestImage: item.priest_image,
          certificates: item.certificates || [],
          iconImage: item.icon_image,
          promoCreatives: item.promo_creatives || [],
        }));

        // Merge Supabase products with local products from localStorage to ensure locally added custom items persist and show up
        let localProducts: Product[] = [];
        try {
          const stored = localStorage.getItem('ridae_products');
          if (stored) {
            localProducts = JSON.parse(stored);
          }
        } catch (e) {
          console.error('Error loading local products for merge:', e);
        }

        const dbIds = new Set(mappedData.map(p => p.id));
        const uniqueLocalProducts = localProducts.filter(p => !dbIds.has(p.id));
        
        setProductsState([...mappedData, ...uniqueLocalProducts]);
      }
    } catch (err) {
      console.error('Error loading published pooja products in storefront:', err);
    }
  };

  const [homepageConfig, setHomepageConfig] = React.useState<{
    featuredProductIds?: string[];
    saleProductIds?: string[];
    newArrivalsProductIds?: string[];
    featuredTitle?: string;
    featuredSubtitle?: string;
    saleTitle?: string;
    saleSubtitle?: string;
    saleDiscount?: number;
    newArrivalsTitle?: string;
    newArrivalsSubtitle?: string;
    bannerImages?: string[];
    showcaseImage?: string;
  } | null>(null);

  const [hasLoadedInitial, setHasLoadedInitial] = React.useState(false);

  // Shop Banners: main banner carousel + category banners
  const [shopBannersConfig, setShopBannersConfig] = React.useState<{
    mainBanners?: string[];  // main shop header carousel images
    categoryBanners?: Record<string, string[]>; // category name -> array of image URLs
  } | null>(null);

  // Custom categories ordering configurations
  const [categoriesOrder, setCategoriesOrder] = React.useState<string[]>([]);

  // Custom products ordering configurations within categories
  const [productsOrder, setProductsOrder] = React.useState<Record<string, string[]>>({});

  const loadShopBannersSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('value')
        .eq('key', 'shop_banners_settings')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data && data.value) {
        setShopBannersConfig(data.value);
      }
    } catch (err) {
      console.error('Error loading shop banners settings:', err);
    }
  };

  const loadCategoriesOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('value')
        .eq('key', 'shop_categories_settings')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data && data.value && Array.isArray(data.value.order)) {
        setCategoriesOrder(data.value.order);
      }
    } catch (err) {
      console.error('Error loading shop categories order settings:', err);
    }
  };

  const loadProductsOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('value')
        .eq('key', 'category_products_settings')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data && data.value && typeof data.value.orders === 'object') {
        setProductsOrder(data.value.orders);
      }
    } catch (err) {
      console.error('Error loading category products order settings:', err);
    }
  };

  const loadHomepageSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('value')
        .eq('key', 'homepage_settings')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data && data.value) {
        setHomepageConfig(data.value);
      }
    } catch (err) {
      console.error('Error loading homepage settings:', err);
    }
  };

  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);

  const bannerSlides = React.useMemo(() => {
    if (homepageConfig && homepageConfig.bannerImages && homepageConfig.bannerImages.length > 0) {
      return homepageConfig.bannerImages;
    }
    return [
      'https://images.unsplash.com/photo-1609137144814-8742ca716b67?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1608976328321-df6ff1a27944?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80'
    ];
  }, [homepageConfig]);

  React.useEffect(() => {
    setCurrentSlideIndex(0);
  }, [bannerSlides]);

  React.useEffect(() => {
    if (bannerSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bannerSlides]);

  const getFeaturedProducts = () => {
    if (homepageConfig && homepageConfig.featuredProductIds && homepageConfig.featuredProductIds.length > 0) {
      return productsState.filter(p => homepageConfig.featuredProductIds!.includes(p.id))
        .sort((a, b) => homepageConfig.featuredProductIds!.indexOf(a.id) - homepageConfig.featuredProductIds!.indexOf(b.id));
    }
    return productsState.slice(0, 4);
  };

  const getSaleProducts = () => {
    if (homepageConfig && homepageConfig.saleProductIds && homepageConfig.saleProductIds.length > 0) {
      return productsState.filter(p => homepageConfig.saleProductIds!.includes(p.id))
        .sort((a, b) => homepageConfig.saleProductIds!.indexOf(a.id) - homepageConfig.saleProductIds!.indexOf(b.id))
        .slice(0, 4);
    }
    return productsState.slice(4, 8);
  };

  const getNewArrivalsProducts = () => {
    if (homepageConfig && homepageConfig.newArrivalsProductIds && homepageConfig.newArrivalsProductIds.length > 0) {
      return productsState.filter(p => homepageConfig.newArrivalsProductIds!.includes(p.id))
        .sort((a, b) => homepageConfig.newArrivalsProductIds!.indexOf(a.id) - homepageConfig.newArrivalsProductIds!.indexOf(b.id))
        .slice(0, 4);
    }
    return productsState.slice(7, 11);
  };

  // Fetch published products on mount and page transition
  React.useEffect(() => {
    const initializeAppData = async () => {
      try {
        await Promise.all([
          loadPublishedProducts(),
          loadHomepageSettings(),
          loadShopBannersSettings(),
          loadCategoriesOrder(),
          loadProductsOrder()
        ]);
      } catch (err) {
        console.error('Error loading initial app config:', err);
      } finally {
        setHasLoadedInitial(true);
      }
    };
    initializeAppData();
  }, [currentPageState]);  // Lifted stateful orders
  const [ordersState, setOrdersState] = React.useState<LocalOrder[]>(() => {
    try {
      const stored = localStorage.getItem('ridae_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((o: any) => ({
          ...o,
          placedAt: new Date(o.placedAt)
        }));
      }
      return initialOrders;
    } catch (e) {
      return initialOrders;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('ridae_orders', JSON.stringify(ordersState));
    } catch (e) {
      console.error(e);
    }
  }, [ordersState]);

  const fetchOrdersFromSupabase = React.useCallback(async () => {
    try {
      let query = supabase.from('website_store_orders').select('*');
      
      if (isAdminAuthenticated) {
        query = query.order('created_at', { ascending: false });
      } else if (loggedInUser) {
        query = query.eq('user_id', loggedInUser.id).order('created_at', { ascending: false });
      } else {
        return;
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (data) {
        const mappedOrders: LocalOrder[] = data.map((o: any) => ({
          orderId: o.order_id,
          userId: o.user_id,
          placedAt: new Date(o.created_at),
          total: typeof o.total === 'string' ? parseFloat(o.total) : o.total,
          subtotal: typeof o.subtotal === 'string' ? parseFloat(o.subtotal) : o.subtotal,
          discount: typeof o.discount === 'string' ? parseFloat(o.discount) : o.discount,
          discountPercent: o.discount_percent,
          shipping: typeof o.shipping === 'string' ? parseFloat(o.shipping) : o.shipping,
          tax: typeof o.tax === 'string' ? parseFloat(o.tax) : o.tax,
          paymentMethod: o.payment_method,
          deliveryCity: o.delivery_city,
          deliveryState: o.delivery_state,
          fullName: o.full_name,
          email: o.email,
          phoneNumber: o.phone_number,
          addressLine1: o.address_line1,
          addressLine2: o.address_line2 || undefined,
          pincode: o.pincode,
          status: o.status,
          items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
          razorpayPaymentId: o.razorpay_payment_id || undefined
        }));
        setOrdersState(mappedOrders);
      }
    } catch (err) {
      console.error('Error fetching orders from Supabase:', err);
    }
  }, [loggedInUser, isAdminAuthenticated]);

  React.useEffect(() => {
    if (loggedInUser || isAdminAuthenticated) {
      fetchOrdersFromSupabase();
    } else {
      try {
        const stored = localStorage.getItem('ridae_orders');
        if (stored) {
          const parsed = JSON.parse(stored);
          setOrdersState(parsed.map((o: any) => ({
            ...o,
            placedAt: new Date(o.placedAt)
          })));
        } else {
          setOrdersState(initialOrders);
        }
      } catch (e) {
        setOrdersState(initialOrders);
      }
    }
  }, [loggedInUser, isAdminAuthenticated, fetchOrdersFromSupabase]);

  const [orderDetails, setOrderDetails] = React.useState<OrderDetails | null>(null);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = React.useState(false);

  const handleViewDetails = (product: Product) => {
    setCurrentPage('detail', { product });
  };
  const [wishlist, setWishlist] = React.useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('ridae_wishlist');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('ridae_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  const wishlistCount = React.useMemo(() => {
    return productsState.filter(p => wishlist[p.id]).length;
  }, [productsState, wishlist]);

  // State for visual interactions
  const [cart, setCart] = React.useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('ridae_cart');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('ridae_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Lifted coupon state
  const [appliedCouponCode, setAppliedCouponCode] = React.useState('');
  const [discountPercent, setDiscountPercent] = React.useState(0);
  const [appliedCouponProductId, setAppliedCouponProductId] = React.useState<string | null>(null);

  // Auto-invalidate coupon if the restricted product is removed from cart
  React.useEffect(() => {
    if (appliedCouponProductId) {
      const hasProduct = cart.some(item => item.product.id === appliedCouponProductId);
      if (!hasProduct) {
        setAppliedCouponCode('');
        setDiscountPercent(0);
        setAppliedCouponProductId(null);
      }
    }
  }, [cart, appliedCouponProductId]);
  
  // Countdown Timer state
  const [timeLeft, setTimeLeft] = React.useState({
    days: 34,
    hours: 5,
    minutes: 21,
    seconds: 10
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddToCartWithQty = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      if (existingIdx > -1) {
        const nextCart = [...prev];
        nextCart[existingIdx] = {
          ...nextCart[existingIdx],
          quantity: nextCart[existingIdx].quantity + quantity
        };
        return nextCart;
      }
      return [...prev, { product, quantity }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setAppliedCouponCode('');
    setDiscountPercent(0);
    setAppliedCouponProductId(null);
  };

  const handleBuyNow = (product: Product, qty: number) => {
    if (!loggedInUser) {
      alert("Please log in or register to buy this item.");
      setPendingBuyNow({ product, qty });
      setAuthRedirectPage('checkout');
      setCurrentPage('user-auth');
    } else {
      handleAddToCartWithQty(product, qty);
      setCurrentPage('checkout');
    }
  };

  const handleToggleWishlist = (id: string) => {
    if (!loggedInUser) {
      alert("Please log in or register to manage your wishlist.");
      setPendingWishlistToggle(id);
      setAuthRedirectPage('wishlist');
      setCurrentPage('user-auth');
      return;
    }
    setWishlist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Navbar Section */}
      {currentPage !== 'admin' && currentPage !== 'admin-login' && (
        <nav style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-light)',
          padding: '16px 0',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Logo & Brand Name (Left side) */}
          <div
            onClick={() => setCurrentPage('home')}
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <img 
              src={logo} 
              alt="Mantra Puja Logo" 
              style={{ 
                height: '65px', 
                objectFit: 'contain'
              }} 
            />
          </div>

          {/* Nav Links & Search bar (Center) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="nav-links-wrapper">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }} className="nav-menu">
              <a
                href="#hero"
                onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}
                style={{ fontWeight: currentPage === 'home' ? 800 : 500, color: currentPage === 'home' ? 'var(--text-dark)' : 'var(--text-muted)' }}
              >
                Home
              </a>
              <a
                href="#shop"
                onClick={(e) => { e.preventDefault(); setCurrentPage('shop'); }}
                style={{ fontWeight: currentPage === 'shop' ? 800 : 500, color: currentPage === 'shop' ? 'var(--text-dark)' : 'var(--text-muted)' }}
              >
                Shop
              </a>

              <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => setCategoriesDropdownOpen(true)}
                onMouseLeave={() => setCategoriesDropdownOpen(false)}
              >
                <button
                  onClick={(e) => { e.preventDefault(); setCategoriesDropdownOpen(prev => !prev); }}
                  style={{
                    fontWeight: currentPage === 'category' ? 800 : 500,
                    color: currentPage === 'category' ? 'var(--text-dark)' : 'var(--text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    padding: '8px 0'
                  }}
                >
                  Categories <ChevronDown size={14} style={{ transform: categoriesDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {categoriesDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '16px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 160px)',
                    gap: '8px',
                    zIndex: 200,
                    marginTop: '4px'
                  }}>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setCurrentPage('category', { categoryName: cat });
                          setCategoriesDropdownOpen(false);
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '6px 12px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          color: selectedCategoryName === cat && currentPage === 'category' ? 'var(--primary-lime)' : 'var(--text-dark)',
                          fontWeight: selectedCategoryName === cat && currentPage === 'category' ? '700' : '500',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Search Input Box */}
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQueryTerm}
                onChange={(e) => setSearchQueryTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setCurrentPage('search');
                  }
                }}
                style={{
                  padding: '8px 16px 8px 36px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-light)',
                  backgroundColor: '#f9fafb',
                  fontSize: '0.85rem',
                  width: '220px',
                  outline: 'none'
                }}
              />
              <Search 
                size={16} 
                style={{
                  position: 'absolute',
                  left: '12px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
                onClick={() => setCurrentPage('search')}
              />
            </div>
          </div>

          {/* Profile & Cart actions (Right side) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

            <button
              onClick={() => loggedInUser ? setCurrentPage('profile') : setCurrentPage('user-auth')}
              style={{
                padding: '8px',
                color: loggedInUser ? 'var(--primary-gold, #d97706)' : (currentPage === 'profile' || currentPage === 'user-auth' ? 'var(--primary-lime)' : 'var(--text-dark)'),
                transition: 'color 0.2s'
              }}
              title={loggedInUser ? `Logged in as ${loggedInUser.fullName}` : "Spiritual Dashboard"}
            >
              <User size={20} style={{ fill: loggedInUser ? 'var(--primary-gold, #d97706)' : 'none' }} />
            </button>
            <button
              onClick={() => setCurrentPage('wishlist')}
              style={{
                position: 'relative',
                padding: '8px',
                color: currentPage === 'wishlist' ? 'var(--primary-lime)' : 'var(--text-dark)',
                transition: 'color 0.2s'
              }}
              title="Sacred Wishlist"
            >
              <Heart size={20} fill={currentPage === 'wishlist' ? 'var(--primary-lime)' : 'none'} />
              {wishlistCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  backgroundColor: 'var(--primary-lime)',
                  color: 'var(--text-dark)',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {wishlistCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentPage('cart')}
              className={`navbar-cart-btn ${isCartBouncing ? "cart-bounce-animation" : ""}`}
              style={{
                position: 'relative',
                padding: '8px',
                color: 'var(--text-dark)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  backgroundColor: 'var(--primary-lime)',
                  color: 'var(--text-dark)',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              style={{ display: 'none', padding: '8px', color: 'var(--text-dark)' }}
              className="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* ── Interactive Mobile Navigation Dropdown Menu ── */}
        {mobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 150,
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 24px',
            gap: '12px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <a
              href="#home"
              onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}
              style={{ padding: '8px 0', fontWeight: currentPage === 'home' ? 800 : 500, color: currentPage === 'home' ? 'var(--primary-lime)' : 'var(--text-dark)', borderBottom: '1px solid #f3f4f6' }}
            >
              🏠 Home
            </a>
            <a
              href="#shop"
              onClick={(e) => { e.preventDefault(); setCurrentPage('shop'); }}
              style={{ padding: '8px 0', fontWeight: currentPage === 'shop' ? 800 : 500, color: currentPage === 'shop' ? 'var(--primary-lime)' : 'var(--text-dark)', borderBottom: '1px solid #f3f4f6' }}
            >
              🛍️ Shop Sacred Items
            </a>


            {/* Mobile Categories Accordion Grid */}
            <div style={{ padding: '4px 0' }}>
              <div 
                onClick={() => setMobileCategoriesExpanded(prev => !prev)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  paddingBottom: '8px',
                  marginBottom: '8px',
                  borderBottom: '1px solid #f3f4f6'
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                  Browse Categories
                </span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--primary-gold, #d97706)',
                  backgroundColor: 'rgba(217, 119, 6, 0.08)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  transition: 'all 0.2s ease'
                }}>
                  <span>{mobileCategoriesExpanded ? 'Show Less' : 'Show All'}</span>
                  <ChevronDown 
                    size={14} 
                    style={{ 
                      transform: mobileCategoriesExpanded ? 'rotate(180deg)' : 'none', 
                      transition: 'transform 0.2s ease' 
                    }} 
                  />
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                maxHeight: mobileCategoriesExpanded ? '1000px' : '340px',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease-in-out'
              }}>
                {(mobileCategoriesExpanded ? categories : categories.slice(0, 12)).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCurrentPage('category', { categoryName: cat })}
                    style={{
                      textAlign: 'left',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      backgroundColor: '#f9fafb',
                      color: selectedCategoryName === cat && currentPage === 'category' ? 'var(--primary-lime)' : 'var(--text-dark)',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>🕉️</span>
                    <span style={{
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}>{cat}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>
      )}

      <React.Suspense fallback={
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '16px',
          color: 'var(--primary-forest)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid var(--border-light)',
            borderTopColor: 'var(--primary-lime)',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.8 }}>Invoking sacred items...</span>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      }>
        {!hasLoadedInitial ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: '16px',
            color: 'var(--primary-forest)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '3px solid var(--border-light)',
              borderTopColor: 'var(--primary-lime)',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.8 }}>Invoking sacred items...</span>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : currentPage === 'home' ? (
        <>
          {/* 2. Hero Section - Carousel Slider */}
          <section id="hero" style={{ padding: '24px 0 32px 0' }}>
            <div className="container">
              <div style={{
                position: 'relative',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                border: '1px solid var(--border-light)',
                backgroundColor: '#1c1917'
              }} className="hero-slider-container">
                {/* Slides */}
                {bannerSlides.map((slide, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: idx === currentSlideIndex ? 1 : 0,
                      transition: 'opacity 0.8s ease-in-out',
                      zIndex: idx === currentSlideIndex ? 1 : 0,
                    }}
                  >
                    <img
                      src={slide}
                      alt={`Banner slide ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                ))}

                {/* Circular dots/indicators */}
                {bannerSlides.length > 1 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '8px',
                    zIndex: 10
                  }}>
                    {bannerSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlideIndex(idx)}
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: idx === currentSlideIndex ? 'var(--primary-lime)' : 'rgba(255,255,255,0.4)',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          transition: 'background-color 0.2s',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Chevron Left Arrow */}
                {bannerSlides.length > 1 && (
                  <button
                    onClick={() => setCurrentSlideIndex(prev => (prev - 1 + bannerSlides.length) % bannerSlides.length)}
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      cursor: 'pointer',
                      zIndex: 10,
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)'}
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}

                {/* Chevron Right Arrow */}
                {bannerSlides.length > 1 && (
                  <button
                    onClick={() => setCurrentSlideIndex(prev => (prev + 1) % bannerSlides.length)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      cursor: 'pointer',
                      zIndex: 10,
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)'}
                  >
                    <ChevronRight size={24} />
                  </button>
                )}
              </div>
            </div>
          </section>
           {/* 3. Section 1: Featured Collections */}
      <section id="featured" style={{ padding: '48px 0' }}>
        <div className="container">
          {/* Header */}
          <h2 className="section-title">{homepageConfig?.featuredTitle || "Our Featured Collection"}</h2>
          <p className="section-subtitle">{homepageConfig?.featuredSubtitle || "Get 30% off when you purchase our featured bundle"}</p>

          {/* Grid Layout split */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.3fr',
            gap: '24px'
          }} className="featured-grid-wrap hero-grid-split">
            
            {/* Left Column: Dynamized Showcase Image */}
            <div style={{
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              height: '100%',
              minHeight: '380px',
              backgroundColor: '#f3f4f6',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative'
            }}>
              {homepageConfig?.showcaseImage ? (
                <img 
                  src={homepageConfig.showcaseImage} 
                  alt="Featured Collection Showcase" 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <img 
                  src="https://images.unsplash.com/photo-1609137144814-8742ca716b67?auto=format&fit=crop&w=1000&q=80" 
                  alt="Featured Altar" 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              )}
            </div>

            {/* Right Column: 2x2 Product cards and lime green checkout strip */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }} className="sub-grid-2x2">
                
                {getFeaturedProducts().map((product) => {
                  const hasDiscount = !!product.originalPrice && product.originalPrice > product.price;
                  const discountPercent = hasDiscount 
                    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
                    : 0;
                  const isLiked = wishlist[product.id];
                  return (
                    <div 
                      key={product.id}
                      onClick={() => handleViewDetails(product)}
                      style={{
                        borderRadius: '16px',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        backgroundColor: '#ffffff',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        padding: '10px',
                        cursor: 'pointer',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-6px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                        const img = e.currentTarget.querySelector('.card-image') as HTMLElement;
                        if (img) img.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        const img = e.currentTarget.querySelector('.card-image') as HTMLElement;
                        if (img) img.style.transform = 'scale(1)';
                      }}
                    >
                      {/* Image Box */}
                      <div
                        style={{
                          width: '100%',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f9fafb'
                        }}
                        className="featured-card-img-box"
                      >
                        {isImageUrl(product.image) ? (
                          <img 
                            src={getDisplayImageUrl(product.image)} 
                            alt={product.name} 
                            className="card-image"
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              transition: 'transform 0.3s ease'
                            }} 
                          />
                        ) : (
                          <span style={{ fontSize: '4rem' }}>{product.image || '📿'}</span>
                        )}

                        {/* Ribbon Badge */}
                        {discountPercent > 0 && product.inStock && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: '12px',
                            width: '40px',
                            padding: '8px 2px 10px 2px',
                            background: 'linear-gradient(135deg, var(--primary-accent), var(--primary-lime))',
                            color: '#ffffff',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            lineHeight: 1.15,
                            textAlign: 'center',
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 6px), 0 100%)',
                            zIndex: 10,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                          }}>
                            {discountPercent}%<br/>OFF
                          </div>
                        )}

                        {/* Heart Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWishlist(product.id);
                          }}
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            backgroundColor: '#ffffff',
                            border: '1px solid var(--border-light)',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            color: isLiked ? '#ef4444' : 'var(--text-muted)',
                            zIndex: 10,
                            boxShadow: 'var(--shadow-sm)',
                            cursor: 'pointer'
                          }}
                          className="flex-center"
                        >
                          <Heart size={15} fill={isLiked ? '#ef4444' : 'none'} />
                        </button>

                        {/* Rating Badge */}
                        <div style={{
                          position: 'absolute',
                          bottom: '12px',
                          right: '12px',
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--border-light)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          boxShadow: 'var(--shadow-sm)',
                          zIndex: 10
                        }}>
                          <Star size={12} fill="#fbbf24" color="#fbbf24" />
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)' }}>{product.rating}</span>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div style={{ 
                        padding: '4px 8px 8px 8px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        flexGrow: 1,
                        textAlign: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}>
                        <div>
                          <h3
                            style={{
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              color: 'var(--text-dark)',
                              marginBottom: '6px',
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: '1.2'
                            }}
                            title={product.name}
                          >
                            {product.name}
                          </h3>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            marginBottom: '4px'
                          }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                              ₹{product.price}
                            </span>
                            {product.originalPrice && (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                ₹{product.originalPrice}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Add to Cart Button */}
                        <div style={{ marginTop: 'auto' }}>
                          {product.inStock ? (
                            (() => {
                              const cartItem = cart.find(item => item.product.id === product.id);
                              const qty = cartItem ? cartItem.quantity : 0;
                              if (qty > 0) {
                                return (
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: 'var(--primary-deep)',
                                    borderRadius: '8px',
                                    padding: '4px',
                                    width: '100%',
                                    height: '40px',
                                    boxSizing: 'border-box'
                                  }}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateQuantity(product.id, qty - 1);
                                      }}
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '6px',
                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        border: 'none',
                                        transition: 'background-color 0.15s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                                    >
                                      <Minus size={14} strokeWidth={2.5} />
                                    </button>
                                    <span style={{
                                      color: '#ffffff',
                                      fontWeight: '800',
                                      fontSize: '0.85rem',
                                      userSelect: 'none'
                                    }}>
                                      {qty} in Cart
                                    </span>
                                    <button
                                      className="qty-plus-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateQuantity(product.id, qty + 1);
                                      }}
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '6px',
                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        border: 'none',
                                        transition: 'background-color 0.15s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                                    >
                                      <Plus size={14} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                );
                              }
                              return (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCartWithQty(product, 1);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    backgroundColor: 'var(--primary-deep)',
                                    color: '#ffffff',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    letterSpacing: '0.05em'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-lime)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-deep)'}
                                >
                                  Add To Cart
                                </button>
                              );
                            })()
                          ) : (
                            <button
                              disabled
                              style={{
                                width: '100%',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--border-light)',
                                color: 'var(--text-muted)',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                border: 'none',
                                cursor: 'not-allowed'
                              }}
                            >
                              Out of Stock
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>

              {/* Bottom lime green checkout banner */}
              <div style={{
                marginTop: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                textAlign: 'center'
              }}>
                <button
                  onClick={() => {
                    getFeaturedProducts().forEach(p => handleAddToCartWithQty(p, 1));
                  }}
                  className="btn-lime"
                  style={{ width: '100%', padding: '16px' }}
                >
                  Add Bundle to Cart
                </button>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                  Total: ₹{Math.round(getFeaturedProducts().reduce((sum, p) => sum + p.price, 0))}
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Section 2: Flash Sale (Orange background Section) */}
      <section id="sale" style={{
        backgroundColor: 'var(--primary-lime)', /* Orange Theme Primary */
        padding: '60px 0',
        borderTop: '1px solid var(--border-light)',
        borderBottom: '1px solid var(--border-light)'
      }}>
        <div className="container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }}>
          {/* Header Tag */}
          <span style={{
            backgroundColor: '#ef4444',
            color: '#ffffff',
            fontSize: '0.78rem',
            fontWeight: 800,
            padding: '4px 16px',
            borderRadius: 'var(--radius-full)'
          }}>
            {homepageConfig?.saleSubtitle || "EXCLUSIVE OFFERS WEEK"}
          </span>

          {/* Heading */}
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 950,
            color: 'var(--text-dark)',
            textAlign: 'center'
          }}>
            {homepageConfig?.saleTitle || "Exceptional Discounts up to 30%"}
          </h2>

          {/* Timer Countdown Grid */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            margin: '8px 0'
          }}>
            <div className="flex-center" style={{ flexDirection: 'column' }}>
              <div className="countdown-box">{timeLeft.days}</div>
              <span className="countdown-label" style={{ backgroundColor: '#000000', color: '#ffffff' }}>Days</span>
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)' }}>:</span>
            <div className="flex-center" style={{ flexDirection: 'column' }}>
              <div className="countdown-box">{timeLeft.hours}</div>
              <span className="countdown-label" style={{ backgroundColor: '#000000', color: '#ffffff' }}>Hours</span>
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)' }}>:</span>
            <div className="flex-center" style={{ flexDirection: 'column' }}>
              <div className="countdown-box">{timeLeft.minutes}</div>
              <span className="countdown-label" style={{ backgroundColor: '#000000', color: '#ffffff' }}>Mins</span>
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)' }}>:</span>
            <div className="flex-center" style={{ flexDirection: 'column' }}>
              <div className="countdown-box">{timeLeft.seconds}</div>
              <span className="countdown-label" style={{ backgroundColor: '#000000', color: '#ffffff' }}>Secs</span>
            </div>
          </div>

          {/* CTA Pill button */}
          <button 
            onClick={() => handleUrlRouting('/shop', '')}
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.92rem',
              padding: '12px 36px',
              borderRadius: 'var(--radius-full)',
              boxShadow: 'var(--shadow-md)',
              cursor: 'pointer'
            }}
          >
            Shop Now
          </button>

          {/* Cards Row (3 Cards) */}
          <div style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginTop: '24px'
          }} className="sale-row-grid">
            
            {getSaleProducts().map((product) => {
              const hasDiscount = !!product.originalPrice && product.originalPrice > product.price;
              const discountPercent = hasDiscount 
                ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
                : (homepageConfig?.saleDiscount || 30);
              const isLiked = wishlist[product.id];
              return (
                <div 
                  key={product.id}
                  onClick={() => handleViewDetails(product)}
                  style={{
                    borderRadius: '16px',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    backgroundColor: '#ffffff',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    padding: '12px',
                    cursor: 'pointer',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    const img = e.currentTarget.querySelector('.card-image') as HTMLElement;
                    if (img) img.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    const img = e.currentTarget.querySelector('.card-image') as HTMLElement;
                    if (img) img.style.transform = 'scale(1)';
                  }}
                >
                  {/* Image Box */}
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f9fafb'
                    }}
                  >
                    {isImageUrl(product.image) ? (
                      <img 
                        src={getDisplayImageUrl(product.image)} 
                        alt={product.name} 
                        className="card-image"
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }} 
                      />
                    ) : (
                      <span style={{ fontSize: '4rem' }}>{product.image || '📿'}</span>
                    )}

                    {/* Ribbon Badge */}
                    {discountPercent > 0 && product.inStock && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '12px',
                        width: '40px',
                        padding: '8px 2px 10px 2px',
                        background: 'linear-gradient(135deg, var(--primary-accent), var(--primary-lime))',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        lineHeight: 1.15,
                        textAlign: 'center',
                        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 6px), 0 100%)',
                        zIndex: 10,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                      }}>
                        {discountPercent}%<br/>OFF
                      </div>
                    )}

                    {/* Heart Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWishlist(product.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-light)',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        color: isLiked ? '#ef4444' : 'var(--text-muted)',
                        zIndex: 10,
                        boxShadow: 'var(--shadow-sm)',
                        cursor: 'pointer'
                      }}
                      className="flex-center"
                    >
                      <Heart size={15} fill={isLiked ? '#ef4444' : 'none'} />
                    </button>

                    {/* Rating Badge */}
                    <div style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border-light)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      boxShadow: 'var(--shadow-sm)',
                      zIndex: 10
                    }}>
                      <Star size={12} fill="#fbbf24" color="#fbbf24" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)' }}>{product.rating}</span>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div style={{ 
                    padding: '4px 8px 8px 8px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    flexGrow: 1,
                    textAlign: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}>
                    <div>
                      <h3
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: 'var(--text-dark)',
                          marginBottom: '6px',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: '1.2'
                        }}
                        title={product.name}
                      >
                        {product.name}
                      </h3>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                          ₹{product.price}
                        </span>
                        {product.originalPrice && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            ₹{product.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <div style={{ marginTop: 'auto' }}>
                      {product.inStock ? (
                        (() => {
                          const cartItem = cart.find(item => item.product.id === product.id);
                          const qty = cartItem ? cartItem.quantity : 0;
                          if (qty > 0) {
                            return (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: 'var(--primary-deep)',
                                borderRadius: '8px',
                                padding: '4px',
                                width: '100%',
                                height: '40px',
                                boxSizing: 'border-box'
                              }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateQuantity(product.id, qty - 1);
                                  }}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    border: 'none',
                                    transition: 'background-color 0.15s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                                >
                                  <Minus size={14} strokeWidth={2.5} />
                                </button>
                                <span style={{
                                  color: '#ffffff',
                                  fontWeight: '800',
                                  fontSize: '0.85rem',
                                  userSelect: 'none'
                                }}>
                                  {qty} in Cart
                                </span>
                                <button
                                  className="qty-plus-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateQuantity(product.id, qty + 1);
                                  }}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    border: 'none',
                                    transition: 'background-color 0.15s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                                >
                                  <Plus size={14} strokeWidth={2.5} />
                                </button>
                              </div>
                            );
                          }
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCartWithQty(product, 1);
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--primary-deep)',
                                color: '#ffffff',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                letterSpacing: '0.05em'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-lime)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-deep)'}
                            >
                              Add To Cart
                            </button>
                          );
                        })()
                      ) : (
                        <button
                          disabled
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--border-light)',
                            color: 'var(--text-muted)',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            border: 'none',
                            cursor: 'not-allowed'
                          }}
                        >
                          Out of Stock
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          </div>

          {/* View All Button */}
          <button 
            onClick={() => handleUrlRouting('/shop', '')}
            className="btn-outline" 
            style={{ marginTop: '24px', cursor: 'pointer' }}
          >
            View All Products
          </button>
        </div>
      </section>

      {/* 5. Section 3: New Arrivals */}
      <section id="new-arrivals" style={{ padding: '60px 0' }}>
        <div className="container">
          
          {/* Header Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px'
          }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)' }}>
              {homepageConfig?.newArrivalsTitle || "Discover Our New Arrivals"}
            </h2>
            <button 
              onClick={() => handleUrlRouting('/shop', '')}
              className="btn-outline"
              style={{ cursor: 'pointer' }}
            >
              {homepageConfig?.newArrivalsSubtitle || "Discover More"}
            </button>
          </div>

          {/* Cards Row (4 Cards) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }} className="new-arrivals-grid">
            
            {getNewArrivalsProducts().map((product) => {
              const hasDiscount = !!product.originalPrice && product.originalPrice > product.price;
              const discountPercent = hasDiscount 
                ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
                : 0;
              const isLiked = wishlist[product.id];
              return (
                <div 
                  key={product.id}
                  onClick={() => handleViewDetails(product)}
                  style={{
                    borderRadius: '16px',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    backgroundColor: '#ffffff',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    padding: '12px',
                    cursor: 'pointer',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    const img = e.currentTarget.querySelector('.card-image') as HTMLElement;
                    if (img) img.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    const img = e.currentTarget.querySelector('.card-image') as HTMLElement;
                    if (img) img.style.transform = 'scale(1)';
                  }}
                >
                  {/* Image Box */}
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f9fafb'
                    }}
                  >
                    {isImageUrl(product.image) ? (
                      <img 
                        src={getDisplayImageUrl(product.image)} 
                        alt={product.name} 
                        className="card-image"
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }} 
                      />
                    ) : (
                      <span style={{ fontSize: '4rem' }}>{product.image || '📿'}</span>
                    )}

                    {/* Ribbon Badge */}
                    {discountPercent > 0 && product.inStock && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '12px',
                        width: '40px',
                        padding: '8px 2px 10px 2px',
                        background: 'linear-gradient(135deg, var(--primary-accent), var(--primary-lime))',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        lineHeight: 1.15,
                        textAlign: 'center',
                        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 6px), 0 100%)',
                        zIndex: 10,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                      }}>
                        {discountPercent}%<br/>OFF
                      </div>
                    )}

                    {/* Heart Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWishlist(product.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-light)',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        color: isLiked ? '#ef4444' : 'var(--text-muted)',
                        zIndex: 10,
                        boxShadow: 'var(--shadow-sm)',
                        cursor: 'pointer'
                      }}
                      className="flex-center"
                    >
                      <Heart size={15} fill={isLiked ? '#ef4444' : 'none'} />
                    </button>

                    {/* Rating Badge */}
                    <div style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border-light)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      boxShadow: 'var(--shadow-sm)',
                      zIndex: 10
                    }}>
                      <Star size={12} fill="#fbbf24" color="#fbbf24" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)' }}>{product.rating}</span>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div style={{ 
                    padding: '4px 8px 8px 8px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    flexGrow: 1,
                    textAlign: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}>
                    <div>
                      <h3
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: 'var(--text-dark)',
                          marginBottom: '6px',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: '1.2'
                        }}
                        title={product.name}
                      >
                        {product.name}
                      </h3>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                          ₹{product.price}
                        </span>
                        {product.originalPrice && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            ₹{product.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <div style={{ marginTop: 'auto' }}>
                      {product.inStock ? (
                        (() => {
                          const cartItem = cart.find(item => item.product.id === product.id);
                          const qty = cartItem ? cartItem.quantity : 0;
                          if (qty > 0) {
                            return (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: 'var(--primary-deep)',
                                borderRadius: '8px',
                                padding: '4px',
                                width: '100%',
                                height: '40px',
                                boxSizing: 'border-box'
                              }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateQuantity(product.id, qty - 1);
                                  }}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    border: 'none',
                                    transition: 'background-color 0.15s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                                >
                                  <Minus size={14} strokeWidth={2.5} />
                                </button>
                                <span style={{
                                  color: '#ffffff',
                                  fontWeight: '800',
                                  fontSize: '0.85rem',
                                  userSelect: 'none'
                                }}>
                                  {qty} in Cart
                                </span>
                                <button
                                  className="qty-plus-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateQuantity(product.id, qty + 1);
                                  }}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    border: 'none',
                                    transition: 'background-color 0.15s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                                >
                                  <Plus size={14} strokeWidth={2.5} />
                                </button>
                              </div>
                            );
                          }
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCartWithQty(product, 1);
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--primary-deep)',
                                color: '#ffffff',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                letterSpacing: '0.05em'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-lime)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-deep)'}
                            >
                              Add To Cart
                            </button>
                          );
                        })()
                      ) : (
                        <button
                          disabled
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--border-light)',
                            color: 'var(--text-muted)',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            border: 'none',
                            cursor: 'not-allowed'
                          }}
                        >
                          Out of Stock
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>
        </>
      ) : currentPage === 'shop' ? (
        <ShopPage
          products={productsState}
          onAddToCart={handleAddToCartWithQty}
          onViewDetails={handleViewDetails}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
          shopBanners={shopBannersConfig || undefined}
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          categoriesOrder={categoriesOrder}
          productsOrder={productsOrder}
        />
      ) : currentPage === 'category' ? (
        <CategoryPage
          products={productsState}
          categoryName={selectedCategoryName}
          onAddToCart={handleAddToCartWithQty}
          onViewDetails={handleViewDetails}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
          onBackToShop={() => setCurrentPage('shop')}
          categoryBannerImages={shopBannersConfig?.categoryBanners?.[selectedCategoryName] || []}
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
        />
      ) : currentPage === 'search' ? (
        <SearchPage
          products={productsState}
          initialQuery={searchQueryTerm}
          onAddToCart={handleAddToCartWithQty}
          onViewDetails={handleViewDetails}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
        />
      ) : currentPage === 'cart' ? (
        <CartPage
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onBackToShop={() => setCurrentPage('shop')}
          onClearCart={handleClearCart}
          onCheckout={() => setCurrentPage('checkout')}
          loggedInUser={loggedInUser}
          appliedCouponCode={appliedCouponCode}
          onApplyCoupon={(code, percent, productId) => {
            setAppliedCouponCode(code);
            setDiscountPercent(percent);
            setAppliedCouponProductId(productId);
          }}
          discountPercent={discountPercent}
        />
      ) : currentPage === 'checkout' ? (
        <CheckoutPage
          cart={cart}
          onBackToCart={() => setCurrentPage('cart')}
          onBackToShop={() => setCurrentPage('shop')}
          onOrderComplete={handleClearCart}
          loggedInUser={loggedInUser}
          appliedCouponCode={appliedCouponCode}
          onApplyCoupon={(code, percent, productId) => {
            setAppliedCouponCode(code);
            setDiscountPercent(percent);
            setAppliedCouponProductId(productId);
          }}
          discountPercent={discountPercent}
          onOrderSuccess={async (details) => {
            const newOrder: LocalOrder = {
              ...details,
              userId: loggedInUser?.id,
              status: 'Being Packed'
            };
            
            try {
              const orderPayload: any = {
                order_id: newOrder.orderId,
                user_id: newOrder.userId || null,
                items: newOrder.items,
                subtotal: newOrder.subtotal,
                discount: newOrder.discount,
                discount_percent: newOrder.discountPercent,
                shipping: newOrder.shipping,
                tax: newOrder.tax,
                total: newOrder.total,
                payment_method: newOrder.paymentMethod,
                delivery_city: newOrder.deliveryCity,
                delivery_state: newOrder.deliveryState,
                full_name: newOrder.fullName,
                email: newOrder.email,
                address_line1: newOrder.addressLine1,
                address_line2: newOrder.addressLine2 || null,
                pincode: newOrder.pincode,
                phone_number: newOrder.phoneNumber,
                status: newOrder.status,
                razorpay_payment_id: newOrder.razorpayPaymentId || null
              };

              let { error } = await supabase.from('website_store_orders').insert(orderPayload);
              
              if (error) {
                // Check if error is due to missing razorpay_payment_id column in database
                if (error.code === 'PGRST204' || (error.message && error.message.includes('razorpay_payment_id'))) {
                  console.warn('razorpay_payment_id column is missing in remote database. Retrying insert without it...');
                  const { razorpay_payment_id, ...fallbackPayload } = orderPayload;
                  const retryResult = await supabase.from('website_store_orders').insert(fallbackPayload);
                  error = retryResult.error;
                }
              }

              if (error) throw error;

              // Record coupon redemption if one was applied
              if (details.appliedCouponCode && loggedInUser) {
                try {
                  const { data: couponData, error: couponFetchError } = await supabase
                    .from('website_store_coupons')
                    .select('id, redemptions_count')
                    .eq('code', details.appliedCouponCode)
                    .single();

                  if (!couponFetchError && couponData) {
                    await supabase
                      .from('website_store_coupon_redemptions')
                      .insert({
                        coupon_id: couponData.id,
                        user_id: loggedInUser.id,
                        order_id: newOrder.orderId
                      });

                    await supabase
                      .from('website_store_coupons')
                      .update({ redemptions_count: (couponData.redemptions_count || 0) + 1 })
                      .eq('id', couponData.id);
                  }
                } catch (couponErr) {
                  console.error('Error logging coupon redemption:', couponErr);
                }
              }

              // Proactively sync shipping details to user saved addresses if logged in
              if (loggedInUser) {
                try {
                  const { data: existing, error: findError } = await supabase
                    .from('website_store_addresses')
                    .select('id')
                    .eq('user_id', loggedInUser.id)
                    .eq('street', details.addressLine1)
                    .eq('city', details.deliveryCity)
                    .eq('state', details.deliveryState)
                    .eq('zip', details.pincode);

                  if (!findError && (!existing || existing.length === 0)) {
                    // Check count to see if we should set default
                    const { count, error: countError } = await supabase
                      .from('website_store_addresses')
                      .select('*', { count: 'exact', head: true })
                      .eq('user_id', loggedInUser.id);
                    
                    const isDefault = !countError && (count === 0);

                    await supabase
                      .from('website_store_addresses')
                      .insert({
                        user_id: loggedInUser.id,
                        type: 'Checkout Address',
                        name: details.fullName,
                        phone: details.phoneNumber,
                        street: details.addressLine1,
                        city: details.deliveryCity,
                        state: details.deliveryState,
                        zip: details.pincode,
                        is_default: isDefault
                      });
                  }
                } catch (syncErr) {
                  console.error('Failed to sync shipping address during checkout:', syncErr);
                }
              }
            } catch (err) {
              console.error('Failed to save order to Supabase:', err);
            }

            setOrdersState(prev => [newOrder, ...prev]);
            setOrderDetails(details);
            setCurrentPage('success');
          }}
        />
      ) : currentPage === 'success' && orderDetails ? (
        <OrderSuccessPage
          order={orderDetails}
          onContinueShopping={() => setCurrentPage('shop')}
          onGoHome={() => setCurrentPage('home')}
          onViewOrders={() => setCurrentPage('orders')}
        />
      ) : currentPage === 'orders' ? (
        <OrdersPage
          orders={ordersState}
          setOrders={setOrdersState}
          onAddToCart={handleAddToCartWithQty}
          onNavigateToShop={() => setCurrentPage('shop')}
          onNavigateToHome={() => setCurrentPage('home')}
          onNavigateToCart={() => setCurrentPage('cart')}
        />
      ) : currentPage === 'profile' ? (
        <UserProfilePage
          orders={ordersState}
          products={productsState}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
          onAddToCart={handleAddToCartWithQty}
          onNavigateToShop={() => setCurrentPage('shop')}
          onNavigateToHome={() => setCurrentPage('home')}
          onNavigateToOrders={() => setCurrentPage('orders')}
          loggedInUser={loggedInUser}
          initialTab={profileInitialTab}
          onLogout={() => {
            try {
              localStorage.removeItem('mantra_user_session');
              localStorage.removeItem('session_token');
            } catch (e) {}
            setLoggedInUser(null);
            setCurrentPage('shop');
          }}
        />
      ) : currentPage === 'user-auth' ? (
        <UserAuthPage
          onNavigateToHome={() => setCurrentPage('home')}
          onNavigateToShop={() => setCurrentPage('shop')}
          onLoginSuccess={(userSession, token) => {
            try {
              localStorage.setItem('mantra_user_session', JSON.stringify(userSession));
              localStorage.setItem('session_token', token);
            } catch (e) {}
            setLoggedInUser(userSession);
            
            if (pendingWishlistToggle) {
              const toggleId = pendingWishlistToggle;
              setWishlist(prev => ({ ...prev, [toggleId]: !prev[toggleId] }));
              setPendingWishlistToggle(null);
            }
            
            if (pendingBuyNow) {
              handleAddToCartWithQty(pendingBuyNow.product, pendingBuyNow.qty);
              setPendingBuyNow(null);
              setCurrentPage('checkout');
            } else if (authRedirectPage) {
              setCurrentPage(authRedirectPage);
              setAuthRedirectPage(null);
            } else {
              setCurrentPage('profile');
            }
          }}
        />
      ) : currentPage === 'wishlist' ? (
        <WishlistPage
          products={productsState}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
          onAddToCart={handleAddToCartWithQty}
          onViewDetails={handleViewDetails}
          onNavigateToShop={() => setCurrentPage('shop')}
        />
      ) : currentPage === 'about' ? (
        <AboutUsPage />
      ) : currentPage === 'contact' ? (
        <ContactUsPage />
      ) : currentPage === 'policies' ? (
        <PoliciesPage />
      ) : currentPage === 'admin-login' ? (
        <AdminLoginPage
          onLoginSuccess={(username, token) => {
            try {
              const expireTime = Date.now() + 2 * 60 * 60 * 1000; // 2 hour session validity
              const session = {
                isAuthenticated: true,
                username: username,
                loginTime: new Date().toISOString(),
                expireTime: expireTime,
                token: token
              };
              localStorage.setItem('ridae_admin_auth_session', JSON.stringify(session));
              localStorage.setItem('ridae_admin_auth', 'true');
            } catch (e) {}
            setCurrentAdmin({ username, loginTime: new Date().toISOString(), token });
            setIsAdminAuthenticated(true);
            setCurrentPage('admin');
          }}
          onNavigateToHome={() => setCurrentPage('home')}
        />
      ) : currentPage === 'admin' ? (
        <AdminPanelPage
          products={productsState}
          setProducts={setProductsState}
          orders={ordersState}
          setOrders={setOrdersState}
          onNavigateToHome={() => setCurrentPage('home')}
          onNavigateToShop={() => setCurrentPage('shop')}
          onLogout={() => {
            try {
              localStorage.removeItem('ridae_admin_auth_session');
              localStorage.removeItem('ridae_admin_auth');
            } catch (e) {}
            setIsAdminAuthenticated(false);
            setCurrentAdmin(null);
            setCurrentPage('admin-login');
          }}
          adminSession={currentAdmin}
          onRefreshOrders={fetchOrdersFromSupabase}
          categoriesOrder={categoriesOrder}
          onUpdateCategoriesOrder={setCategoriesOrder}
          productsOrder={productsOrder}
          onUpdateProductsOrder={setProductsOrder}
        />
      ) : (
        selectedProduct && (
          <ProductDetailPage
            products={productsState}
            product={selectedProduct}
            onAddToCart={handleAddToCartWithQty}
            onViewDetails={handleViewDetails}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onBackToShop={() => setCurrentPage('shop')}
            onBuyNow={handleBuyNow}
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
          />
        )
      )}
      </React.Suspense>

      {/* upgraded Premium Devotional Footer */}
      <footer style={{
        backgroundColor: 'var(--primary-forest)',
        color: '#ffffff',
        padding: '60px 0 30px 0',
        marginTop: 'auto',
        borderTop: '4px solid var(--primary-lime)',
        textAlign: 'left'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr',
            gap: '40px',
            marginBottom: '40px'
          }} className="hero-grid-split">
            
            {/* Column 1: Brand Essence */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <img 
                  src={logo} 
                  alt="Mantra Puja Logo" 
                  style={{ 
                    height: '55px', 
                    objectFit: 'contain'
                  }} 
                />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                Curating authentic, lab-certified Himalayan Rudrakshas, pure organic camphor, and deity brass idols. Energized at the legendary ghats of Varanasi to bring healing vibrations home.
              </p>
            </div>

            {/* Column 2: Alt Navigation */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary-lime)', marginBottom: '16px', letterSpacing: '0.5px' }}>
                Sacred Navigation
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', padding: 0 }}>
                <li>
                  <button onClick={() => setCurrentPage('home')} style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    Home Altar
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentPage('shop')} style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    Spiritual Shop
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentPage('search')} style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    Search Catalog
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentPage('cart')} style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    Shopping Cart
                  </button>
                </li>

              </ul>
            </div>

            {/* Column 3: Support */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary-lime)', marginBottom: '16px', letterSpacing: '0.5px' }}>
                Our Essence
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', padding: 0 }}>
                <li>
                  <button onClick={() => setCurrentPage('about')} style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    Brand Story
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentPage('contact')} style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    Contact Support
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentPage('wishlist')} style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    My Wishlist
                  </button>
                </li>
                <li>
                  <button onClick={() => loggedInUser ? setCurrentPage('profile') : setCurrentPage('user-auth')} style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    Devotee Dashboard
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal Guidelines */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary-lime)', marginBottom: '16px', letterSpacing: '0.5px' }}>
                Divine Policies
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', padding: 0 }}>
                <li>
                  <button onClick={() => setCurrentPage('policies')} style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    Privacy & Data Guidelines
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentPage('policies')} style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    Refunds & Exchanges
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentPage('policies')} style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    Sacred Dispatches Shipping
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentPage('policies')} style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    Terms of Devotion
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Footer Copyright */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '20px',
            textAlign: 'center',
            fontSize: '0.78rem',
            color: 'rgba(255,255,255,0.5)'
          }}>
            <span>© {new Date().getFullYear()} Mantra Puja. All Sacred Rights Reserved.</span>
          </div>

        </div>
      </footer>

      {currentPage !== 'detail' && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(p, q) => {
            handleAddToCartWithQty(p, q);
            setSelectedProduct(null);
          }}
        />
      )}

      {floatingEffects.map(effect => (
        <span
          key={effect.id}
          className="floating-plus-one"
          style={{
            left: effect.x,
            top: effect.y
          }}
        >
          +1
        </span>
      ))}

      {flyingDots.map(dot => (
        <div
          key={dot.id}
          className="flying-cart-dot"
          style={{
            left: dot.startX,
            top: dot.startY,
            '--target-x': dot.targetX,
            '--target-y': dot.targetY
          } as React.CSSProperties}
        />
      ))}

      {/* CSS Injections for Mobile Responsiveness */}
      <style>{`
        @media (max-width: 768px) {
          /* Enforce wrapping on the navbar container */
          nav > .container {
            flex-wrap: wrap !important;
            justify-content: space-between !important;
            gap: 12px 0 !important;
            padding: 0 16px !important;
          }
          
          /* Force search wrapper to its own full-width row at the bottom */
          .nav-links-wrapper {
            order: 3 !important;
            width: 100% !important;
            flex: 0 0 100% !important;
            gap: 0 !important;
          }

          /* Hide desktop menus */
          .nav-menu {
            display: none !important;
          }

          /* Show mobile menu hamburger toggle */
          .mobile-menu-btn {
            display: block !important;
          }

          /* Make search input container stretch fully */
          .nav-links-wrapper > div {
            width: 100% !important;
          }

          .nav-links-wrapper input {
            width: 100% !important;
            font-size: 0.9rem !important;
            padding: 10px 16px 10px 38px !important;
          }

          /* Logo and Actions containers occupy top row */
          nav > .container > div:first-child {
            order: 1 !important;
          }
          nav > .container > div:last-child {
            order: 2 !important;
          }
          
          /* Scale hero banner down on mobile viewports */
          #hero .container > div {
            height: 240px !important;
          }
        }

        @media (max-width: 900px) {
          .hero-grid-split {
            grid-template-columns: 1fr !important;
          }
          .hero-grid-split > div:last-child {
            min-height: 250px !important;
            height: 250px !important;
          }
          .hero-grid-split > div:first-child {
            padding: 30px 24px !important;
            text-align: center !important;
          }
          .hero-grid-split h1 {
            font-size: 2.4rem !important;
          }
          .featured-grid-wrap {
            grid-template-columns: 1fr !important;
          }
          .featured-grid-wrap > div:first-child {
            height: 380px !important;
          }
        }
        @media (max-width: 600px) {
          .sub-grid-2x2 {
            grid-template-columns: 1fr !important;
          }
          .desktop-search {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}

export default App;
