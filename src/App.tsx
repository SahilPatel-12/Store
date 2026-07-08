import React from 'react';
import { Search, User, ShoppingBag, Heart, Menu, X, ChevronDown, ChevronLeft, ChevronRight, Star, Plus, Minus, Bell, AlertTriangle } from 'lucide-react';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { SeamlessCheckoutModal } from './components/SeamlessCheckoutModal';
import type { OrderDetails } from './components/OrderSuccessPage';
import type { Product, CartItem, LocalOrder } from './types';
import { supabase } from './lib/supabase';
import { isImageUrl, getDisplayImageUrl } from './lib/imageHelper';
import logo from './assets/My_logo/Frame 16.png';
import { getSpiritualTypeForProduct } from './lib/spiritualTypeHelper';
import { useSEO } from './seo/seo-manager';
import { uploadToR2 } from './lib/cloudflare/r2';


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
const NotificationsPage = React.lazy(() => import('./components/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const PoliciesPage = React.lazy(() => import('./components/PoliciesPage').then(m => ({ default: m.PoliciesPage })));
const AdminPanelPage = React.lazy(() => import('./components/AdminPanelPage').then(m => ({ default: m.AdminPanelPage })));
const AdminLoginPage = React.lazy(() => import('./components/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const UserAuthPage = React.lazy(() => import('./components/UserAuthPage').then(m => ({ default: m.UserAuthPage })));
const AffiliationPromoPage = React.lazy(() => import('./components/AffiliationPromoPage').then(m => ({ default: m.AffiliationPromoPage })));
const PunditLoginPage = React.lazy(() => import('./components/PunditLoginPage').then(m => ({ default: m.PunditLoginPage })));
const PunditDashboardPage = React.lazy(() => import('./components/PunditDashboardPage').then(m => ({ default: m.PunditDashboardPage })));
const SitemapPage = React.lazy(() => import('./components/SitemapPage').then(m => ({ default: m.SitemapPage })));
const AstrologerLoginPage = React.lazy(() => import('./components/AstrologerLoginPage').then(m => ({ default: m.AstrologerLoginPage })));
const AstrologerDashboardPage = React.lazy(() => import('./components/AstrologerDashboardPage').then(m => ({ default: m.AstrologerDashboardPage })));


// Default shop categories list
const DEFAULT_CATEGORIES = [
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

const visualMockProducts: Product[] = [
  {
    id: 'gift-pyrite-bracelet',
    name: 'Golden Pyrite Bracelet',
    description: 'Beautiful Golden Pyrite Bracelet for wealth, luck, and positive energy.',
    price: 0,
    originalPrice: 1400,
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&q=80',
    category: 'Bracelet',
    rating: 4.9,
    reviewsCount: 312,
    inStock: true,
    benefits: ['Attracts money', 'Brings luck'],
    popularity: 99,
    spiritualType: 'Meditation'
  },
  {
    id: 'shani-shanti-bracelet',
    name: 'Shani Shanti Kavach Bracelet',
    description: 'Handcrafted crystal bracelet to pacify Shani Dev and bring protection.',
    price: 1998,
    originalPrice: 4002,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80',
    category: 'Bracelet',
    rating: 4.8,
    reviewsCount: 154,
    inStock: true,
    benefits: ['Saturn protection', 'Mental peace'],
    popularity: 95,
    spiritualType: 'Meditation'
  },
  {
    id: 'maha-dhanyog-bracelet',
    name: 'Maha Dhanyog Bracelet',
    description: 'Vedic-energized bracelet for financial growth and business success.',
    price: 999,
    originalPrice: 2001,
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&q=80',
    category: 'Bracelet',
    rating: 4.9,
    reviewsCount: 220,
    inStock: true,
    benefits: ['Attracts prosperity', 'Business success'],
    popularity: 97,
    spiritualType: 'Meditation'
  },
  {
    id: 'meen-rashi-bracelet',
    name: 'Meen (Pisces) Rashi Crystal Bracelet',
    description: 'Customized crystal bracelet designed for Pisces rashi natives.',
    price: 999,
    originalPrice: 1999,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&q=80',
    category: 'Bracelet',
    rating: 4.7,
    reviewsCount: 98,
    inStock: true,
    benefits: ['Rashi balance', 'Emotional healing'],
    popularity: 90,
    spiritualType: 'Meditation'
  },
  {
    id: 'karungali-mala',
    name: 'Karungali Mala',
    description: 'Pure ebony wood beads mala for positive vibration and focus.',
    price: 799,
    originalPrice: 2099,
    image: 'https://images.unsplash.com/photo-1596567130084-07d13f742943?w=400&q=80',
    category: 'Necklaces/Mala',
    rating: 4.8,
    reviewsCount: 180,
    inStock: true,
    benefits: ['Negative energy removal', 'Enhances focus'],
    popularity: 96,
    spiritualType: 'Meditation'
  }
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
  const [currentPageState, setCurrentPageState] = React.useState<'home' | 'shop' | 'category' | 'detail' | 'search' | 'cart' | 'checkout' | 'success' | 'profile' | 'orders' | 'wishlist' | 'about' | 'contact' | 'policies' | 'admin' | 'admin-login' | 'user-auth' | 'affiliation' | 'notifications' | 'pundit-login' | 'pundit-dashboard' | 'astrologer-login' | 'astrologer-dashboard' | 'sitemap'>('shop');
  
  // Dynamic client-side pundit migration runner
  const [migrationStatus, setMigrationStatus] = React.useState<string | null>(null);
  const [migrationProgress, setMigrationProgress] = React.useState(0);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('run_pundit_migration') === 'true') {
      const runMigration = async () => {
        setMigrationStatus('Initializing Pundit Migration & Cloudflare R2 image upload...');
        try {
          const pundits = [
            {
              name: 'Acharya Raghav Sharma',
              phone: '+919000000001',
              title: 'Acharya',
              gotra: 'Bharadwaj',
              experience: 18,
              languages: ['Hindi', 'Sanskrit'],
              specialties: ['🕉 Rudrabhishek', '🔥 Havan', '🕉 Shanti Path'],
              bio: 'Acharya Raghav Sharma has performed thousands of authentic Vedic Rudraksha energization rituals following traditional Shiva Agama and Rudra Vidhi procedures.',
              city: 'Varanasi',
              state: 'Uttar Pradesh',
              lat: 25.3176,
              lng: 82.9739,
              modes: ['Temple', 'Home Visits'],
              temple: 'Kashi Vishwanath Temple'
            },
            {
              name: 'Acharya Devendra Shastri',
              phone: '+919000000002',
              title: 'Shastri',
              gotra: 'Vashishtha',
              experience: 15,
              languages: ['Hindi', 'Sanskrit', 'English'],
              specialties: ['🪔 Satyanarayan Katha', '🏡 Griha Pravesh', '🔥 Havan'],
              bio: 'Acharya Devendra Shastri specializes in Vedic mantra siddhi, Saraswati worship rituals, and traditional Rudraksha energization ceremonies.',
              city: 'Varanasi',
              state: 'Uttar Pradesh',
              lat: 25.3180,
              lng: 82.9745,
              modes: ['Home Visits', 'Online'],
              temple: ''
            },
            {
              name: 'Acharya Subramanya Iyer',
              phone: '+919000000003',
              title: 'Acharya',
              gotra: 'Kashyap',
              experience: 20,
              languages: ['Tamil', 'Sanskrit', 'English'],
              specialties: ['🕉 Rudrabhishek', '💍 Vivah Sanskar', '💰 Lakshmi Puja'],
              bio: 'Acharya Subramanya Iyer specializes in Murugan worship rituals, sacred mantra recitations, and spiritual energization ceremonies.',
              city: 'Chennai',
              state: 'Tamil Nadu',
              lat: 13.0827,
              lng: 80.2707,
              modes: ['Temple', 'Home Visits', 'Online'],
              temple: 'Kapaleeshwarar Temple'
            },
            {
              name: 'Acharya Bhavesh Shukla',
              phone: '+919000000004',
              title: 'Acharya',
              gotra: 'Gautam',
              experience: 12,
              languages: ['Hindi', 'Sanskrit'],
              specialties: ['🌞 Navgraha Puja', '🏡 Griha Pravesh', '🏠 Vastu Shanti'],
              bio: 'Acharya Bhavesh Shukla specializes in family harmony rituals, Ganesh Sadhana, and authentic Vedic Rudraksha energization ceremonies.',
              city: 'Ujjain',
              state: 'Madhya Pradesh',
              lat: 23.1760,
              lng: 75.7885,
              modes: ['Temple', 'Home Visits'],
              temple: 'Mahakaleshwar Jyotirlinga Temple'
            },
            {
              name: 'Acharya Gaurang Bhatt',
              phone: '+919000000005',
              title: 'Acharya',
              gotra: 'Atri',
              experience: 16,
              languages: ['Gujarati', 'Hindi', 'Sanskrit'],
              specialties: ['💰 Lakshmi Puja', '🔥 Havan', '🌞 Navgraha Puja'],
              bio: 'Acharya Gaurang Bhatt has extensive expertise in Mahalakshmi worship, prosperity rituals, and authentic Vedic Rudraksha energization ceremonies.',
              city: 'Ahmedabad',
              state: 'Gujarat',
              lat: 23.0225,
              lng: 72.5714,
              modes: ['Home Visits', 'Online'],
              temple: ''
            },
            {
              name: 'Acharya Kuberanand Mishra',
              phone: '+919000000006',
              title: 'Acharya',
              gotra: 'Agastya',
              experience: 14,
              languages: ['Hindi', 'Sanskrit'],
              specialties: ['💰 Lakshmi Puja', '🔥 Havan', '🏠 Vastu Shanti'],
              bio: 'Acharya Kuberanand Mishra specializes in crystal energization, prosperity rituals, and sacred wealth-attraction ceremonies.',
              city: 'Haridwar',
              state: 'Uttarakhand',
              lat: 29.9457,
              lng: 78.1642,
              modes: ['Temple', 'Home Visits'],
              temple: 'Har Ki Pauri Temple'
            },
            {
              name: 'Acharya Lakshmikant Dwivedi',
              phone: '+919000000007',
              title: 'Acharya',
              gotra: 'Vatsa',
              experience: 17,
              languages: ['Hindi', 'Sanskrit', 'English'],
              specialties: ['💰 Lakshmi Puja', '🌞 Navgraha Puja', '🪔 Satyanarayan Katha'],
              bio: 'Acharya Lakshmikant Dwivedi specializes in Lakshmi-Kuber rituals and spiritual energization ceremonies focused on prosperity and abundance.',
              city: 'Varanasi',
              state: 'Uttar Pradesh',
              lat: 25.3210,
              lng: 82.9780,
              modes: ['Temple', 'Home Visits', 'Online'],
              temple: 'Sankat Mochan Hanuman Temple'
            },
            {
              name: 'Acharya Narayan Shukla',
              phone: '+919000000008',
              title: 'Acharya',
              gotra: 'Angirasa',
              experience: 22,
              languages: ['Hindi', 'Sanskrit'],
              specialties: ['🕉 Rudrabhishek', '🔥 Havan', '🕉 Shanti Path'],
              bio: 'Acharya Narayan Shukla is renowned for performing Vishnu Sadhana, Vedic protection rituals, and authentic Rudraksha energization ceremonies according to ancient scriptures.',
              city: 'Prayagraj',
              state: 'Uttar Pradesh',
              lat: 25.4358,
              lng: 81.8463,
              modes: ['Home Visits', 'Online'],
              temple: ''
            },
            {
              name: 'Acharya Venkatesh Trivedi',
              phone: '+919000000009',
              title: 'Acharya',
              gotra: 'Vishwamitra',
              experience: 15,
              languages: ['Hindi', 'Sanskrit', 'Gujarati'],
              specialties: ['🕉 Rudrabhishek', '🔥 Havan', '🏠 Vastu Shanti'],
              bio: 'Acharya Venkatesh Trivedi specializes in traditional Rudraksha energization and sacred Shiva-Parvati worship rituals performed according to authentic Vedic scriptures.',
              city: 'Somnath',
              state: 'Gujarat',
              lat: 20.8880,
              lng: 70.4012,
              modes: ['Temple', 'Home Visits'],
              temple: 'Somnath Jyotirlinga Temple'
            },
            {
              name: 'Acharya Adwait Raman',
              phone: '+919000000010',
              title: 'Acharya',
              gotra: 'Bharadwaj',
              experience: 19,
              languages: ['Hindi', 'Sanskrit', 'English'],
              specialties: ['🕉 Rudrabhishek', '🔥 Havan', '🕉 Shanti Path'],
              bio: 'Acharya Adwait Raman specializes in advanced Vedic rituals, Rudraksha energization, and sacred spiritual ceremonies rooted in traditional practices.',
              city: 'Rishikesh',
              state: 'Uttarakhand',
              lat: 30.0869,
              lng: 78.2676,
              modes: ['Temple', 'Home Visits', 'Online'],
              temple: 'Parmarth Niketan Temple'
            },
            {
              name: 'Acharya Arvind Pathak',
              phone: '+919000000011',
              title: 'Acharya',
              gotra: 'Kashyap',
              experience: 13,
              languages: ['Hindi', 'Sanskrit'],
              specialties: ['🔥 Havan', '💰 Lakshmi Puja', '🏠 Vastu Shanti'],
              bio: 'Acharya Arvind Pathak specializes in crystal activation rituals and prosperity-focused Vedic energization ceremonies.',
              city: 'Varanasi',
              state: 'Uttar Pradesh',
              lat: 25.3195,
              lng: 82.9710,
              modes: ['Home Visits', 'Online'],
              temple: ''
            },
            {
              name: 'Acharya Rudransh Pathak',
              phone: '+919000000012',
              title: 'Acharya',
              gotra: 'Vashishtha',
              experience: 11,
              languages: ['Hindi', 'Sanskrit'],
              specialties: ['🔥 Havan', '🕉 Shanti Path', '🌞 Navgraha Puja'],
              bio: 'Acharya Rudransh Pathak is highly experienced in Durga worship, Navarna mantra rituals, and authentic Vedic Rudraksha energization ceremonies.',
              city: 'Varanasi',
              state: 'Uttar Pradesh',
              lat: 25.3205,
              lng: 82.9725,
              modes: ['Temple', 'Home Visits'],
              temple: 'Durga Kund Mandir'
            },
            {
              name: 'Acharya Veerendra Joshi',
              phone: '+919000000013',
              title: 'Acharya',
              gotra: 'Gautam',
              experience: 21,
              languages: ['Hindi', 'Sanskrit', 'Marathi'],
              specialties: ['🔥 Havan', '🕉 Shanti Path', '🕉 Rudrabhishek'],
              bio: 'Acharya Veerendra Joshi specializes in Hanuman worship, Rudra rituals, and powerful Vedic energization ceremonies performed according to sacred traditions.',
              city: 'Nashik',
              state: 'Maharashtra',
              lat: 19.9975,
              lng: 73.7898,
              modes: ['Temple', 'Home Visits', 'Online'],
              temple: 'Trimbakeshwar Shiva Temple'
            },
            {
              name: 'Acharya Suryakant Vyas',
              phone: '+919000000014',
              title: 'Acharya',
              gotra: 'Atri',
              experience: 25,
              languages: ['Hindi', 'Sanskrit', 'Gujarati'],
              specialties: ['🔥 Havan', '🌞 Navgraha Puja', '🪔 Satyanarayan Katha'],
              bio: 'Acharya Suryakant Vyas specializes in Surya worship, Aditya Hridayam recitations, and authentic Vedic Rudraksha energization ceremonies.',
              city: 'Dwarka',
              state: 'Gujarat',
              lat: 22.2442,
              lng: 68.9685,
              modes: ['Temple', 'Home Visits'],
              temple: 'Dwarkadhish Temple'
            },
            {
              name: 'Acharya Shubhendra Sharma',
              phone: '+919000000015',
              title: 'Acharya',
              gotra: 'Agastya',
              experience: 14,
              languages: ['Hindi', 'Sanskrit', 'English'],
              specialties: ['🏠 Vastu Shanti', '🏡 Griha Pravesh', '🔥 Havan'],
              bio: 'Acharya Shubhendra Sharma specializes in prosperity rituals, Vastu remedies, and sacred energy activation ceremonies for homes and businesses.',
              city: 'Delhi',
              state: 'Delhi',
              lat: 28.6139,
              lng: 77.2090,
              modes: ['Home Visits', 'Online'],
              temple: ''
            },
            {
              name: 'Acharya Vishwajeet Dwivedi',
              phone: '+919000000016',
              title: 'Acharya',
              gotra: 'Vatsa',
              experience: 15,
              languages: ['Hindi', 'Sanskrit'],
              specialties: ['🔥 Havan', '🌞 Navgraha Puja', '🕉 Rudrabhishek'],
              bio: 'Acharya Vishwajeet Dwivedi specializes in Ganapati rituals, Vedic mantra siddhi, and authentic Rudraksha energization ceremonies performed according to traditional scriptures.',
              city: 'Varanasi',
              state: 'Uttar Pradesh',
              lat: 25.3225,
              lng: 82.9799,
              modes: ['Temple', 'Home Visits'],
              temple: 'Vishalakshi Temple'
            },
            {
              name: 'Acharya Somnath Shastri',
              phone: '+919000000017',
              title: 'Acharya',
              gotra: 'Angirasa',
              experience: 20,
              languages: ['Hindi', 'Sanskrit', 'English'],
              specialties: ['🕉 Rudrabhishek', '🔥 Havan', '🕉 Shanti Path'],
              bio: 'Highly revered scholar from Varanasi conducting sacred Mahamrityunjaya and planetary homas.',
              city: 'Varanasi',
              state: 'Uttar Pradesh',
              lat: 25.3170,
              lng: 82.9730,
              modes: ['Temple', 'Home Visits', 'Online'],
              temple: 'Kashi Vishwanath Temple'
            },
            {
              name: 'Acharya Vidyadhar Dwivedi',
              phone: '+919000000018',
              title: 'Acharya',
              gotra: 'Vishwamitra',
              experience: 14,
              languages: ['Hindi', 'Sanskrit'],
              specialties: ['💰 Lakshmi Puja', '🔥 Havan', '🪔 Satyanarayan Katha'],
              bio: 'Expert scholar from Shri Jagannath Sanskrit Vishvavidyalaya specializing in Lakshmi rituals.',
              city: 'Varanasi',
              state: 'Uttar Pradesh',
              lat: 25.3185,
              lng: 82.9750,
              modes: ['Home Visits', 'Online'],
              temple: ''
            },
            {
              name: 'Pandit Ramakant Joshi',
              phone: '+919000000019',
              title: 'Pandit Ji',
              gotra: 'Bharadwaj',
              experience: 12,
              languages: ['Hindi', 'Sanskrit'],
              specialties: ['🪔 Satyanarayan Katha', '🏡 Griha Pravesh', '🔥 Havan'],
              bio: 'A traditional Uttarakhand Pandit specializing in Vishnu Stotras and monthly household vrat ceremonies.',
              city: 'Rishikesh',
              state: 'Uttarakhand',
              lat: 30.0880,
              lng: 78.2690,
              modes: ['Home Visits', 'Online'],
              temple: ''
            },
            {
              name: 'Acharya Rajesh Shastri',
              phone: '+919000000020',
              title: 'Acharya',
              gotra: 'Kashyap',
              experience: 15,
              languages: ['Hindi', 'Sanskrit', 'English'],
              specialties: ['🕉 Rudrabhishek', '🔥 Havan', '🏡 Griha Pravesh'],
              bio: 'Highly trained scholar from Banaras Hindu University specializing in Rigveda rituals.',
              city: 'Varanasi',
              state: 'Uttar Pradesh',
              lat: 25.3190,
              lng: 82.9760,
              modes: ['Temple', 'Home Visits', 'Online'],
              temple: 'Kashi Vishwanath Temple'
            }
          ];

          const runSql = async (sql: string) => {
            const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
            if (error) throw error;
            return data;
          };

          // 1. Create table structure if not exists
          setMigrationStatus('Step 1/3: Setting up database table website_store_pundits and bookings...');
          await runSql(`
            CREATE TABLE IF NOT EXISTS public.website_store_pundits (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID REFERENCES public.website_store_users(id) ON DELETE CASCADE,
              full_name TEXT NOT NULL,
              spiritual_title TEXT NOT NULL,
              languages TEXT[] NOT NULL,
              gotra TEXT NOT NULL,
              experience_years INT NOT NULL,
              city TEXT NOT NULL,
              state TEXT NOT NULL,
              latitude NUMERIC(10, 6),
              longitude NUMERIC(10, 6),
              service_modes TEXT[] NOT NULL,
              temple_name TEXT,
              service_area TEXT,
              specialties TEXT[] NOT NULL,
              profile_photo TEXT,
              bio TEXT,
              verified_badge TEXT DEFAULT 'Registered Partner',
              verification_uploaded BOOLEAN DEFAULT false,
              aadhaar_url TEXT,
              certificate_url TEXT,
              temple_auth_url TEXT,
              status TEXT NOT NULL DEFAULT 'pending',
              onboarded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
              CONSTRAINT website_store_pundits_user_id_key UNIQUE (user_id)
            );

            -- Alter table if columns don't exist yet (for existing installs)
            ALTER TABLE public.website_store_pundits ADD COLUMN IF NOT EXISTS aadhaar_url TEXT;
            ALTER TABLE public.website_store_pundits ADD COLUMN IF NOT EXISTS certificate_url TEXT;
            ALTER TABLE public.website_store_pundits ADD COLUMN IF NOT EXISTS temple_auth_url TEXT;
            ALTER TABLE public.website_store_pundits ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

            -- Enable RLS
            ALTER TABLE public.website_store_pundits ENABLE ROW LEVEL SECURITY;

            -- Drop policies if exist
            DROP POLICY IF EXISTS "Allow public read access to website_store_pundits" ON public.website_store_pundits;
            DROP POLICY IF EXISTS "Allow public insert access to website_store_pundits" ON public.website_store_pundits;
            DROP POLICY IF EXISTS "Allow public update access to website_store_pundits" ON public.website_store_pundits;

            -- Create policies
            CREATE POLICY "Allow public read access to website_store_pundits"
            ON public.website_store_pundits
            FOR SELECT
            TO anon, authenticated
            USING (true);

            CREATE POLICY "Allow public insert access to website_store_pundits"
            ON public.website_store_pundits
            FOR INSERT
            TO anon, authenticated
            WITH CHECK (true);

            CREATE POLICY "Allow public update access to website_store_pundits"
            ON public.website_store_pundits
            FOR UPDATE
            TO anon, authenticated
            USING (true)
            WITH CHECK (true);

            -- Create bookings table
            CREATE TABLE IF NOT EXISTS public.website_store_pundit_bookings (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              pundit_id UUID REFERENCES public.website_store_users(id) ON DELETE CASCADE,
              user_id UUID,
              puja_name TEXT NOT NULL DEFAULT 'Sacred Ritual',
              devotee_name TEXT NOT NULL,
              gotra TEXT,
              devotee_phone TEXT NOT NULL,
              booking_date DATE NOT NULL,
              booking_time TEXT NOT NULL,
              venue_type TEXT NOT NULL,
              venue_address TEXT,
              special_request TEXT,
              dakshina NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
              status TEXT NOT NULL DEFAULT 'Pending Confirmation',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
            );

            -- Alter table if columns don't exist yet (for existing installs)
            ALTER TABLE public.website_store_pundit_bookings ADD COLUMN IF NOT EXISTS user_id UUID;
            ALTER TABLE public.website_store_pundit_bookings ADD COLUMN IF NOT EXISTS puja_name TEXT NOT NULL DEFAULT 'Sacred Ritual';

            -- Alter push_notifications table to add user_id for targeted notifications
            ALTER TABLE public.push_notifications ADD COLUMN IF NOT EXISTS user_id UUID;

            -- Enable RLS for bookings
            ALTER TABLE public.website_store_pundit_bookings ENABLE ROW LEVEL SECURITY;

            -- Drop bookings policies if exist
            DROP POLICY IF EXISTS "Allow public read access to website_store_pundit_bookings" ON public.website_store_pundit_bookings;
            DROP POLICY IF EXISTS "Allow public insert access to website_store_pundit_bookings" ON public.website_store_pundit_bookings;
            DROP POLICY IF EXISTS "Allow public update access to website_store_pundit_bookings" ON public.website_store_pundit_bookings;
            DROP POLICY IF EXISTS "Allow public delete access to website_store_pundit_bookings" ON public.website_store_pundit_bookings;

            -- Create bookings policies
            CREATE POLICY "Allow public read access to website_store_pundit_bookings"
            ON public.website_store_pundit_bookings
            FOR SELECT
            TO anon, authenticated
            USING (true);

            CREATE POLICY "Allow public insert access to website_store_pundit_bookings"
            ON public.website_store_pundit_bookings
            FOR INSERT
            TO anon, authenticated
            WITH CHECK (true);

            CREATE POLICY "Allow public update access to website_store_pundit_bookings"
            ON public.website_store_pundit_bookings
            FOR UPDATE
            TO anon, authenticated
            USING (true)
            WITH CHECK (true);

            CREATE POLICY "Allow public delete access to website_store_pundit_bookings"
            ON public.website_store_pundit_bookings
            FOR DELETE
            TO anon, authenticated
            USING (true);
          `);

          // 2. Upload images to R2 and seed
          setMigrationStatus('Step 2/3: Fetching avatars and uploading to Cloudflare R2...');
          
          const passwordHash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'; // SHA256 for 'pundit123'
          
          for (let i = 0; i < pundits.length; i++) {
            const p = pundits[i];
            setMigrationProgress(Math.round((i / pundits.length) * 100));
            setMigrationStatus(`Uploading and seeding [${i + 1}/20]: ${p.name}...`);

            let r2Url = '';
            try {
              const dicebearUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(p.name)}`;
              const response = await fetch(dicebearUrl);
              const blob = await response.blob();
              const nameSlug = p.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
              const file = new File([blob], `${nameSlug}_${Math.random().toString(36).substring(2, 6)}.png`, { type: 'image/png' });
              
              // Upload to R2 using app's uploadToR2 helper
              r2Url = await uploadToR2(file, 'products/pundits', true);
            } catch (err) {
              console.error('R2 upload failed for', p.name, err);
              r2Url = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(p.name)}`;
            }

            const code = 'MP' + Math.random().toString(36).substring(2, 8).toUpperCase();
            const email = `${p.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@mantrapuja.com`;
            
            // Build onboarding profile payload
            const profilePayload = {
              fullName: p.name,
              spiritualTitle: p.title,
              languages: p.languages,
              gotra: p.gotra,
              experience: p.experience,
              location: {
                city: p.city,
                state: p.state,
                latitude: p.lat,
                longitude: p.lng
              },
              serviceModes: p.modes,
              templeName: p.temple,
              serviceArea: p.city,
              ritualExpertise: p.specialties,
              profilePhoto: r2Url,
              bio: p.bio,
              verificationUploaded: true,
              verifiedBadge: 'Verified Pundit',
              onboardedAt: new Date().toISOString()
            };

            const payloadStr = JSON.stringify(profilePayload).replace(/'/g, "''");
            const nameEscaped = p.name.replace(/'/g, "''");
            const bioEscaped = p.bio.replace(/'/g, "''");
            const titleEscaped = p.title.replace(/'/g, "''");
            const gotraEscaped = p.gotra.replace(/'/g, "''");
            const cityEscaped = p.city.replace(/'/g, "''");
            const stateEscaped = p.state.replace(/'/g, "''");
            const templeEscaped = p.temple ? p.temple.replace(/'/g, "''") : '';

            // Execute SQL to register user and pundit record
            await runSql(`
              DO $$
              DECLARE
                v_user_id UUID;
                v_phone_exists BOOLEAN;
              BEGIN
                SELECT EXISTS(SELECT 1 FROM public.website_store_users WHERE phone_number = '${p.phone}') INTO v_phone_exists;
                
                IF NOT v_phone_exists THEN
                  INSERT INTO public.website_store_users (
                    id,
                    full_name,
                    email,
                    phone_number,
                    password_hash,
                    is_pundit,
                    affiliate_code,
                    affiliate_status,
                    affiliate_joined_at,
                    pundit_profile
                  ) VALUES (
                    gen_random_uuid(),
                    '${nameEscaped}',
                    '${email}',
                    '${p.phone}',
                    '${passwordHash}',
                    true,
                    '${code}',
                    'active',
                    now(),
                    '${payloadStr}'::JSONB
                  ) RETURNING id INTO v_user_id;

                  -- Add wallet
                  INSERT INTO public.affiliate_wallets (user_id, total_earned, pending_earnings, approved_earnings, withdrawn_amount)
                  VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00)
                  ON CONFLICT (user_id) DO NOTHING;
                ELSE
                  SELECT id INTO v_user_id FROM public.website_store_users WHERE phone_number = '${p.phone}';
                  UPDATE public.website_store_users
                  SET 
                    is_pundit = true,
                    pundit_profile = '${payloadStr}'::JSONB,
                    full_name = '${nameEscaped}'
                  WHERE id = v_user_id;
                END IF;

                -- Insert into pundits table
                INSERT INTO public.website_store_pundits (
                  user_id,
                  full_name,
                  spiritual_title,
                  languages,
                  gotra,
                  experience_years,
                  city,
                  state,
                  latitude,
                  longitude,
                  service_modes,
                  temple_name,
                  service_area,
                  specialties,
                  profile_photo,
                  bio,
                  verified_badge,
                  verification_uploaded,
                  onboarded_at
                ) VALUES (
                  v_user_id,
                  '${nameEscaped}',
                  '${titleEscaped}',
                  ARRAY[${p.languages.map(x => `'${x}'`).join(', ')}],
                  '${gotraEscaped}',
                  ${p.experience},
                  '${cityEscaped}',
                  '${stateEscaped}',
                  ${p.lat},
                  ${p.lng},
                  ARRAY[${p.modes.map(x => `'${x}'`).join(', ')}],
                  ${templeEscaped ? `'${templeEscaped}'` : 'NULL'},
                  '${cityEscaped}',
                  ARRAY[${p.specialties.map(x => `'${x}'`).join(', ')}],
                  '${r2Url}',
                  '${bioEscaped}',
                  'Verified Pandit',
                  true,
                  now()
                ) ON CONFLICT (user_id) DO UPDATE SET
                  full_name = EXCLUDED.full_name,
                  spiritual_title = EXCLUDED.spiritual_title,
                  languages = EXCLUDED.languages,
                  gotra = EXCLUDED.gotra,
                  experience_years = EXCLUDED.experience_years,
                  city = EXCLUDED.city,
                  state = EXCLUDED.state,
                  latitude = EXCLUDED.latitude,
                  longitude = EXCLUDED.longitude,
                  service_modes = EXCLUDED.service_modes,
                  temple_name = EXCLUDED.temple_name,
                  service_area = EXCLUDED.service_area,
                  specialties = EXCLUDED.specialties,
                  profile_photo = EXCLUDED.profile_photo,
                  bio = EXCLUDED.bio,
                  verified_badge = EXCLUDED.verified_badge,
                  verification_uploaded = EXCLUDED.verification_uploaded,
                  updated_at = now();
              END;
              $$;
            `);
          }

          setMigrationProgress(100);
          setMigrationStatus('Migration successfully completed! 20 Vedic Acharyas seeded.');
        } catch (error) {
          console.error('Migration failed:', error);
          setMigrationStatus('Migration failed: ' + (error as Error).message);
        }
      };
      runMigration();
    }
  }, []);
  
  const [activeSEO, setActiveSEO] = React.useState<{ title: string; description: string; ogImage?: string; canonical?: string } | null>({
    title: "Mantra Puja Store | Authentic Vedic Items & Deity Idols",
    description: "Mantra Puja Store offers authentic, priest-energized Vedic puja kits, brass deity idols, organic incense, and sacred texts direct from Varanasi."
  });
  useSEO(activeSEO);

  const [readNotificationIds, setReadNotificationIds] = React.useState<string[]>(() => {
    try {
      const val = localStorage.getItem('read_notifications');
      return val ? JSON.parse(val) : [];
    } catch (e) {
      return [];
    }
  });

  const [dismissedPopupIds, setDismissedPopupIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      localStorage.setItem('read_notifications', JSON.stringify(readNotificationIds));
    } catch (e) {}
  }, [readNotificationIds]);

  const [clearedNotificationIds, setClearedNotificationIds] = React.useState<string[]>(() => {
    try {
      const val = localStorage.getItem('cleared_notifications');
      return val ? JSON.parse(val) : [];
    } catch (e) {
      return [];
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('cleared_notifications', JSON.stringify(clearedNotificationIds));
    } catch (e) {}
  }, [clearedNotificationIds]);

  const [taxDeliverySettings, setTaxDeliverySettings] = React.useState({
    globalGstPercent: 8,
    globalDeliveryCharge: 49,
    freeDeliveryThreshold: 999
  });

  const [globalAlert, setGlobalAlert] = React.useState<{
    message: string;
    title?: string;
  } | null>(null);

  React.useEffect(() => {
    window.alert = (msg) => {
      setGlobalAlert({
        message: String(msg),
        title: "Mantra Puja Store"
      });
    };
  }, []);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mobileCategoriesExpanded, setMobileCategoriesExpanded] = React.useState(false);
  
  const [loggedInUser, setLoggedInUser] = React.useState<{ id: string; fullName: string; email: string; phoneNumber: string; isPundit?: boolean } | null>(() => {
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

  const [profileInitialTab, setProfileInitialTab] = React.useState<'info' | 'orders' | 'addresses' | 'wishlist' | 'notifications' | 'logout' | 'affiliate' | undefined>(undefined);

  const [isSeamlessCheckoutOpen, setIsSeamlessCheckoutOpen] = React.useState(false);
  const [authRedirectPage, setAuthRedirectPage] = React.useState<'checkout' | 'wishlist' | 'orders' | 'profile' | 'cart' | 'notifications' | null>(null);
  const [pendingBuyNow, setPendingBuyNow] = React.useState<{ product: Product; qty: number } | null>(null);
  const [pendingWishlistToggle, setPendingWishlistToggle] = React.useState<string | null>(null);
  const [pendingAddToCart, setPendingAddToCart] = React.useState<{ product: Product; qty: number } | null>(null);

  const [currentAdmin, setCurrentAdmin] = React.useState<{ username: string; loginTime: string; token: string | null } | null>(() => {
    try {
      const stored = localStorage.getItem('ridae_admin_auth_session');
      if (stored) {
        const session = JSON.parse(stored);
        if (session && session.isAuthenticated && session.token && session.expireTime > Date.now()) {
          return { username: session.username, loginTime: session.loginTime, token: session.token };
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
        if (session && session.isAuthenticated && session.token && session.expireTime > Date.now()) {
          return true;
        }
        localStorage.removeItem('ridae_admin_auth_session');
        localStorage.removeItem('ridae_admin_auth');
      }
      return false;
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

  // Reset window scroll position to top whenever page navigation or main filters change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPageState, selectedCategoryName, selectedProduct?.id, searchQueryTerm]);

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


  const setCurrentPage = (
    page: 'home' | 'shop' | 'category' | 'detail' | 'search' | 'cart' | 'checkout' | 'success' | 'profile' | 'orders' | 'wishlist' | 'about' | 'contact' | 'policies' | 'admin' | 'admin-login' | 'user-auth' | 'affiliation' | 'notifications' | 'pundit-login' | 'pundit-dashboard' | 'sitemap' | 'astrologer-login' | 'astrologer-dashboard',
    options?: { categoryName?: string; product?: Product; searchQuery?: string; bypassAuthCheck?: boolean; profileTab?: 'info' | 'orders' | 'addresses' | 'wishlist' | 'notifications' | 'logout' | 'affiliate' }
  ) => {
    setMobileMenuOpen(false);
    setMobileCategoriesExpanded(false);

    if (page === 'profile') {
      setProfileInitialTab(options?.profileTab);
    }

    if (page === 'checkout') {
      setIsSeamlessCheckoutOpen(true);
      return;
    }

    // Intercept protected devotee page routing
    if (page === 'wishlist' || page === 'orders' || page === 'profile' || page === 'notifications') {
      if (!loggedInUser && !options?.bypassAuthCheck) {
        if (page !== 'profile') {
          alert(`Please log in or register to access ${page}.`);
        }
        setAuthRedirectPage(
          page === 'profile'
            ? 'profile'
            : page
        );
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
      case 'notifications':
        path = '/notifications';
        break;
      case 'admin-login':
      case 'admin':
        path = '/admin';
        break;
      case 'user-auth':
        path = '/auth';
        break;
      case 'affiliation':
        path = '/affiliation';
        break;
      case 'pundit-login':
        path = '/pundit-login';
        break;
      case 'pundit-dashboard':
        path = '/pundit-dashboard';
        break;
      case 'sitemap':
        path = '/sitemap';
        break;
      case 'astrologer-login':
        path = '/astrologer-login';
        break;
      case 'astrologer-dashboard':
        path = '/astrologer-dashboard';
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
      } else if (path === '/product' || path === '/product/' || path === '/shop' || path === '/shop/') {
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
        setCurrentPageState('shop');
        setIsCartDrawerOpen(true);
      } else if (path === '/checkout' || path === '/checkout/') {
        setCurrentPageState('shop');
        setIsSeamlessCheckoutOpen(true);
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
      } else if (path === '/notifications' || path === '/notifications/') {
        if (loggedInUser) {
          setCurrentPageState('notifications');
        } else {
          setAuthRedirectPage('notifications');
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
      } else if (path === '/affiliation' || path === '/affiliation/' || path === '/affiliation-program' || path === '/affiliation-program/') {
        setCurrentPageState('affiliation');
      } else if (path === '/pundit-login' || path === '/pundit-login/') {
        setCurrentPageState('pundit-login');
      } else if (path === '/pundit-dashboard' || path === '/pundit-dashboard/') {
        setCurrentPageState('pundit-dashboard');
      } else if (path === '/sitemap' || path === '/sitemap/' || path === '/site-map' || path === '/site-map/') {
        setCurrentPageState('sitemap');
      } else if (path === '/astrologer-login' || path === '/astrologer-login/') {
        setCurrentPageState('astrologer-login');
      } else if (path === '/astrologer-dashboard' || path === '/astrologer-dashboard/') {
        setCurrentPageState('astrologer-dashboard');
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

  // Synchronize SEO meta details dynamically on page route state shifts
  React.useEffect(() => {
    let title = "Mantra Puja Store | Authentic Vedic Items & Deity Idols";
    let description = "Mantra Puja Store offers authentic, priest-energized Vedic puja kits, brass deity idols, organic incense, and sacred texts direct from Varanasi.";
    let ogImage = "/logo.png";
    let canonical = undefined;

    switch (currentPageState) {
      case 'home':
        title = "Mantra Puja Store | Authentic Vedic Items & Deity Idols";
        description = "Mantra Puja Store offers authentic, priest-energized Vedic puja kits, brass deity idols, organic incense, and sacred texts direct from Varanasi.";
        break;
      case 'shop':
        title = "Spiritual Shop Catalog | Mantra Puja Store";
        description = "Browse all collections of sacred Vedic idols, organic dhoop cups, certified Himalayan Rudrakshas, and pure camphor blessings.";
        break;
      case 'category':
        title = `${selectedCategoryName} Collection | Mantra Puja Store`;
        description = `Find high-quality, priest-energized ${selectedCategoryName} items to invite auspiciousness, luck, and positive energy home.`;
        break;
      case 'detail':
        if (selectedProduct) {
          title = (selectedProduct as any).seoTitle || `${selectedProduct.name} | Mantra Puja Store`;
          description = (selectedProduct as any).seoDescription || selectedProduct.shortDescription || selectedProduct.description;
          ogImage = selectedProduct.image;
        }
        break;
      case 'search':
        title = searchQueryTerm ? `Search results for "${searchQueryTerm}" | Mantra Puja Store` : "Search Sacred Catalog | Mantra Puja Store";
        description = "Find custom Vedic pujas, brass deity idols, pure incense dhoop, and Himalayan malas in our catalog.";
        break;
      case 'about':
        title = "Brand Story & Pillars | Mantra Puja";
        description = "Our mission is to bridge generational artisans and spiritual seekers with certified, Ganga-energized deity idols and items.";
        break;
      case 'contact':
        title = "Contact Sacred Support | Mantra Puja";
        description = "Get in touch with our Varanasi temple dispatch managers for shipping status, custom deity orders, and certifications.";
        break;
      case 'policies':
        title = "Divine Policies & Sacred Dispatches | Mantra Puja";
        description = "Review our Privacy Guidelines, terms of devotion, refunds and exchanges, and sacred shipping info.";
        break;
      case 'affiliation':
        title = "Affiliate Partner Program | Mantra Puja";
        description = "Become a partner and share the blessings of Vedic pujas and deity idols, earning spiritual commissions.";
        break;
      case 'sitemap':
        title = "Sitemap Directory | Mantra Puja Store";
        description = "Browse our full dynamic index of products, category landing pages, help guides, and devotee accounts.";
        break;
      case 'profile':
      case 'orders':
      case 'wishlist':
      case 'notifications':
        title = "Devotee Dashboard | Mantra Puja Store";
        description = "Manage your shipping addresses, track order packing statuses, and view items in your wishlist.";
        break;
      case 'pundit-login':
      case 'pundit-dashboard':
        title = "Pundit Portal | Mantra Puja Store";
        description = "Priest authentication gateway and dashboard for booking scheduling and payouts.";
        break;
      case 'admin':
      case 'admin-login':
        title = "Administrator Gateway | Mantra Puja Store";
        description = "Secured backend access for managing orders, catalog products, and configurations.";
        break;
    }

    setActiveSEO({ title, description, ogImage, canonical });
  }, [currentPageState, selectedCategoryName, selectedProduct?.id, searchQueryTerm]);

  // Direct load deep-linking on mount (also runs when dynamic database products are loaded)
  React.useEffect(() => {
    handleUrlRouting(window.location.pathname, window.location.search);
  }, [productsState, handleUrlRouting]);

  // Pundit session checker and redirect routing
  React.useEffect(() => {
    const checkPunditStatus = async () => {
      if (loggedInUser && loggedInUser.id && loggedInUser.isPundit === undefined) {
        try {
          const { data, error } = await supabase
            .from('website_store_users')
            .select('is_pundit')
            .eq('id', loggedInUser.id)
            .maybeSingle();
          if (!error && data) {
            const isPundit = !!data.is_pundit;
            const updatedUser = { ...loggedInUser, isPundit };
            localStorage.setItem('mantra_user_session', JSON.stringify(updatedUser));
            setLoggedInUser(updatedUser);
          }
        } catch (e) {
          console.error('Error checking pundit status:', e);
        }
      }
    };
    checkPunditStatus();
  }, [loggedInUser]);

  // Astrologer session checker and redirect routing
  React.useEffect(() => {
    const checkAstrologerStatus = async () => {
      if (loggedInUser && loggedInUser.id && (loggedInUser as any).isAstrologer === undefined) {
        try {
          const { data, error } = await supabase
            .from('website_store_users')
            .select('is_astrologer')
            .eq('id', loggedInUser.id)
            .maybeSingle();
          if (!error && data) {
            const isAstrologer = !!data.is_astrologer;
            const updatedUser = { ...loggedInUser, isAstrologer };
            localStorage.setItem('mantra_user_session', JSON.stringify(updatedUser));
            setLoggedInUser(updatedUser);
          }
        } catch (e) {
          console.error('Error checking astrologer status:', e);
        }
      }
    };
    checkAstrologerStatus();
  }, [loggedInUser]);

  React.useEffect(() => {
    if (loggedInUser?.isPundit) {
      if (currentPageState === 'profile' || currentPageState === 'user-auth' || currentPageState === 'pundit-login') {
        setCurrentPage('pundit-dashboard');
      }
    } else if (currentPageState === 'pundit-dashboard') {
      if (!loggedInUser) {
        setCurrentPage('pundit-login');
      } else if (loggedInUser.isPundit === false) {
        setCurrentPage('shop');
      }
    }
  }, [loggedInUser, currentPageState]);

  React.useEffect(() => {
    if ((loggedInUser as any)?.isAstrologer) {
      if (currentPageState === 'profile' || currentPageState === 'user-auth' || currentPageState === 'astrologer-login') {
        setCurrentPage('astrologer-dashboard');
      }
    } else if (currentPageState === 'astrologer-dashboard') {
      if (!loggedInUser) {
        setCurrentPage('astrologer-login');
      } else if ((loggedInUser as any).isAstrologer === false) {
        setCurrentPage('shop');
      }
    }
  }, [loggedInUser, currentPageState]);

  // Check user suspension status on load and periodically
  React.useEffect(() => {
    let active = true;
    const checkUserSuspension = async () => {
      if (loggedInUser && loggedInUser.id) {
        try {
          const { data, error } = await supabase
            .from('website_store_users')
            .select('is_suspended')
            .eq('id', loggedInUser.id)
            .maybeSingle();
          if (active && !error && data && data.is_suspended) {
            alert('Your account has been suspended by the administrator.');
            try {
              localStorage.removeItem('mantra_user_session');
              localStorage.removeItem('session_token');
            } catch (e) {}
            setLoggedInUser(null);
            setCurrentPage('shop');
          }
        } catch (e) {
          console.error('Error checking suspension status:', e);
        }
      }
    };
    checkUserSuspension();
    const interval = setInterval(checkUserSuspension, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [loggedInUser]);

  const handleBannerRedirect = React.useCallback((url?: string) => {
    if (!url) return;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank');
      return;
    }
    
    try {
      const parts = url.split('?');
      const pathname = parts[0];
      const search = parts[1] ? '?' + parts[1] : '';
      window.history.pushState({}, '', url);
      handleUrlRouting(pathname, search);
    } catch (e) {
      console.error('Failed banner redirect routing:', e);
    }
  }, [handleUrlRouting]);



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
          spiritualType: getSpiritualTypeForProduct(item.name, item.category, item.tags, item.spiritual_type),
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
          purchaseLimit: item.purchase_limit ? Number(item.purchase_limit) : undefined,
          gstOverrideEnabled: item.gst_override_enabled || false,
          customGst: item.custom_gst !== undefined && item.custom_gst !== null ? parseFloat(item.custom_gst.toString()) : undefined,
          deliveryOverrideEnabled: item.delivery_override_enabled || false,
          customDelivery: item.custom_delivery !== undefined && item.custom_delivery !== null ? parseFloat(item.custom_delivery.toString()) : undefined,
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
        const combinedList = [...mappedData, ...uniqueLocalProducts];
        
        // Only show fallback/mock products if no products are loaded from DB or local storage
        if (combinedList.length > 0) {
          setProductsState(combinedList);
        } else {
          setProductsState(visualMockProducts);
        }
      }
    } catch (err) {
      console.error('Error loading published pooja products in storefront:', err);
    }
  };

  const [homepageConfig, setHomepageConfig] = React.useState<{
    featuredProductIds?: string[];
    saleProductIds?: string[];
    newArrivalsProductIds?: string[];
    cartExploreMoreProductIds?: string[];
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
  // Dynamic categories list with visibility statuses
  const [categoriesList, setCategoriesList] = React.useState<{ name: string; hidden: boolean }[]>([]);
  // Custom products ordering configurations within categories
  const [productsOrder, setProductsOrder] = React.useState<Record<string, string[]>>({});

  const getCategoryFromSlug = (slug: string): string => {
    const list = categoriesList.length > 0 ? categoriesList.map(c => c.name) : DEFAULT_CATEGORIES;
    return list.find(cat => getCategorySlug(cat) === slug) || 'Rudraksha';
  };

  const visibleCategories = React.useMemo(() => {
    const activeList = categoriesList.length > 0 ? categoriesList : DEFAULT_CATEGORIES.map(c => ({ name: c, hidden: false }));
    const active = activeList.filter(c => !c.hidden && c.name.toLowerCase() !== 'all').map(c => c.name);
    if (categoriesOrder && categoriesOrder.length > 0) {
      return [...active].sort((a, b) => {
        const idxA = categoriesOrder.indexOf(a);
        const idxB = categoriesOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b, 'en', { sensitivity: 'base' });
      });
    }
    return active;
  }, [categoriesList, categoriesOrder]);

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

      let finalCats: { name: string; hidden: boolean }[] = [];
      let finalOrder: string[] = [];

      if (data && data.value) {
        if (Array.isArray(data.value.categories)) {
          finalCats = data.value.categories;
        } else if (Array.isArray(data.value.order)) {
          finalCats = data.value.order.map((name: string) => ({ name, hidden: false }));
        }

        if (Array.isArray(data.value.order)) {
          finalOrder = data.value.order;
        }
      }

      if (finalCats.length === 0) {
        finalCats = DEFAULT_CATEGORIES.map(name => ({ name, hidden: false }));
      }
      if (finalOrder.length === 0) {
        finalOrder = finalCats.map(c => c.name);
      }

      // Ensure all items in finalOrder are present in finalCats
      finalCats = [
        ...finalCats,
        ...finalOrder
          .filter(name => !finalCats.some(c => c.name === name))
          .map(name => ({ name, hidden: false }))
      ];

      setCategoriesList(finalCats);
      setCategoriesOrder(finalOrder);
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

  const loadTaxDeliverySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('value')
        .eq('key', 'tax_delivery_settings')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data && data.value) {
        setTaxDeliverySettings({
          globalGstPercent: Number(data.value.global_gst_percent) ?? 8,
          globalDeliveryCharge: Number(data.value.global_delivery_charge) ?? 49,
          freeDeliveryThreshold: Number(data.value.free_delivery_threshold) ?? 999
        });
      }
    } catch (err) {
      console.error('Error loading tax and delivery settings:', err);
    }
  };

  const loadPaymentActivationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('value')
        .eq('key', 'payment_activation_settings')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data && data.value) {
        setPaymentActivation(data.value);
      }
    } catch (err) {
      console.error('Error loading payment activation settings:', err);
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
    if (shopBannersConfig && (shopBannersConfig as any).mainBanners && (shopBannersConfig as any).mainBanners.length > 0) {
      return (shopBannersConfig as any).mainBanners as (string | { imageUrl: string; redirectUrl: string })[];
    }
    if (homepageConfig && homepageConfig.bannerImages && homepageConfig.bannerImages.length > 0) {
      return homepageConfig.bannerImages as (string | { imageUrl: string; redirectUrl: string })[];
    }
    return [
      'https://images.unsplash.com/photo-1609137144814-8742ca716b67?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1608976328321-df6ff1a27944?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80'
    ] as (string | { imageUrl: string; redirectUrl: string })[];
  }, [shopBannersConfig, homepageConfig]);

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
          loadProductsOrder(),
          loadTaxDeliverySettings(),
          loadPaymentActivationSettings()
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

  const notifications = React.useMemo(() => {
    if (isAdminAuthenticated) return [];

    const list: {
      id: string;
      orderId: string;
      type: 
        | 'order_placed'
        | 'payment_pending'
        | 'payment_verification_pending'
        | 'payment_confirmed'
        | 'payment_declined'
        | 'order_prepared'
        | 'order_shipped'
        | 'order_delivered'
        | 'order_cancelled';
      message: string;
      timestamp: Date;
      read: boolean;
      attemptCount?: number;
    }[] = [];
    
    ordersState.forEach(order => {
      // 1. Order Placed (Always shown)
      list.push({
        id: `${order.orderId}_placed`,
        orderId: order.orderId,
        type: 'order_placed',
        message: `Your order #${order.orderId} has been successfully placed! Total amount: ₹${order.total.toFixed(2)}.`,
        timestamp: order.placedAt,
        read: readNotificationIds.includes(`${order.orderId}_placed`)
      });

      // 2. Payment Pending / Verification Pending (Only for UPI orders)
      if (order.paymentMethod === 'Scan & Pay (UPI)') {
        if (order.paymentStatus === 'Pending') {
          if (order.paymentScreenshot) {
            list.push({
              id: `${order.orderId}_verification_pending`,
              orderId: order.orderId,
              type: 'payment_verification_pending',
              message: `Payment screenshot for Order #${order.orderId} has been uploaded successfully. Admin verification is pending.`,
              timestamp: order.placedAt,
              read: readNotificationIds.includes(`${order.orderId}_verification_pending`)
            });
          } else {
            list.push({
              id: `${order.orderId}_payment_pending`,
              orderId: order.orderId,
              type: 'payment_pending',
              message: `Please scan the QR code and upload your transaction confirmation screenshot for Order #${order.orderId} to begin verification.`,
              timestamp: order.placedAt,
              read: readNotificationIds.includes(`${order.orderId}_payment_pending`)
            });
          }
        }
      }

      // 3. Payment Confirmed
      if (order.paymentStatus === 'Confirmed') {
        list.push({
          id: `${order.orderId}_confirmed`,
          orderId: order.orderId,
          type: 'payment_confirmed',
          message: `Your payment for Order #${order.orderId} has been successfully verified and confirmed by the admin!`,
          timestamp: order.placedAt,
          read: readNotificationIds.includes(`${order.orderId}_confirmed`)
        });
      }

      // 4. Payment Declined
      if (order.paymentStatus === 'Declined') {
        list.push({
          id: `${order.orderId}_declined_${order.paymentDeclineCount || 0}`,
          orderId: order.orderId,
          type: 'payment_declined',
          message: `Payment proof for Order #${order.orderId} was declined by the admin. (Attempt ${order.paymentDeclineCount || 1}/3). Please re-upload a valid transaction screenshot.`,
          timestamp: order.placedAt,
          read: readNotificationIds.includes(`${order.orderId}_declined_${order.paymentDeclineCount || 0}`),
          attemptCount: order.paymentDeclineCount || 1
        });
      }

      // 5. Preparing Package (When payment confirmed and status is Being Packed)
      if (order.status === 'Being Packed' && order.paymentStatus === 'Confirmed') {
        list.push({
          id: `${order.orderId}_prepared`,
          orderId: order.orderId,
          type: 'order_prepared',
          message: `Your order #${order.orderId} is being prepared and packed for shipment.`,
          timestamp: order.placedAt,
          read: readNotificationIds.includes(`${order.orderId}_prepared`)
        });
      }

      // 6. Shipped Alert
      if (order.status === 'Shipped') {
        list.push({
          id: `${order.orderId}_shipped`,
          orderId: order.orderId,
          type: 'order_shipped',
          message: `Order #${order.orderId} has been shipped and is now in transit.`,
          timestamp: order.placedAt,
          read: readNotificationIds.includes(`${order.orderId}_shipped`)
        });
      }

      // 7. Delivered Alert
      if (order.status === 'Delivered') {
        list.push({
          id: `${order.orderId}_delivered`,
          orderId: order.orderId,
          type: 'order_delivered',
          message: `Order #${order.orderId} has been delivered. We hope it brings peace and positive energy!`,
          timestamp: order.placedAt,
          read: readNotificationIds.includes(`${order.orderId}_delivered`)
        });
      }

      // 8. Cancelled Alert
      if (order.status === 'Cancelled') {
        list.push({
          id: `${order.orderId}_cancelled`,
          orderId: order.orderId,
          type: 'order_cancelled',
          message: `Order #${order.orderId} was cancelled.`,
          timestamp: order.placedAt,
          read: readNotificationIds.includes(`${order.orderId}_cancelled`)
        });
      }
    });

    const NOTIFICATION_PRIORITY: Record<string, number> = {
      order_placed: 1,
      payment_pending: 2,
      payment_verification_pending: 3,
      payment_declined: 4,
      payment_confirmed: 5,
      order_prepared: 6,
      order_shipped: 7,
      order_delivered: 8,
      order_cancelled: 9
    };

    return list
      .filter(n => !clearedNotificationIds.includes(n.id))
      .sort((a, b) => {
        const timeDiff = b.timestamp.getTime() - a.timestamp.getTime();
        if (timeDiff !== 0) return timeDiff;
        const prioA = NOTIFICATION_PRIORITY[a.type] || 0;
        const prioB = NOTIFICATION_PRIORITY[b.type] || 0;
        return prioB - prioA;
      });
  }, [ordersState, readNotificationIds, clearedNotificationIds, isAdminAuthenticated]);

  const unreadNotificationsCount = React.useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const activePopupNotification = React.useMemo(() => {
    if (isAdminAuthenticated) return null;
    return notifications.find(n => n.type === 'payment_declined' && !n.read && !dismissedPopupIds.includes(n.id)) || null;
  }, [notifications, dismissedPopupIds, isAdminAuthenticated]);

  const fetchOrdersFromSupabase = React.useCallback(async () => {
    try {
      let data: any[] = [];
      if (isAdminAuthenticated) {
        const adminSession = JSON.parse(localStorage.getItem('ridae_admin_auth_session') || '{}');
        const adminToken = adminSession.token || '';
        const res = await fetch(`/api/admin/orders/list?adminToken=${adminToken}`);
        if (!res.ok) throw new Error('Failed to fetch admin orders');
        data = await res.json();
      } else if (loggedInUser) {
        const sessionToken = localStorage.getItem('session_token') || '';
        const res = await fetch(`/api/customer/orders?sessionToken=${sessionToken}`);
        if (!res.ok) throw new Error('Failed to fetch devotee orders');
        data = await res.json();
      } else {
        return;
      }
      
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
          razorpayPaymentId: o.razorpay_payment_id || undefined,
          paymentScreenshot: o.payment_screenshot || undefined,
          paymentStatus: o.payment_status || 'Pending',
          paymentDeclineCount: o.payment_decline_count || 0
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
  const [isCartDrawerOpen, setIsCartDrawerOpen] = React.useState(false);
  const [cart, setCart] = React.useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('ridae_cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((item: any) => item && item.product && typeof item.product === 'object' && item.product.id);
        }
      }
      return [];
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

  // Lifted payment activation settings
  const [paymentActivation, setPaymentActivation] = React.useState<{
    activePaymentProvider: 'manual_upi' | 'razorpay';
    razorpayMode: 'test' | 'live';
    legacyManualUpiEnabled: boolean;
  }>({
    activePaymentProvider: 'manual_upi',
    razorpayMode: 'test',
    legacyManualUpiEnabled: true
  });

  // Auto-invalidate coupon if the restricted product is removed from cart
  React.useEffect(() => {
    if (appliedCouponProductId) {
      const hasProduct = cart.some(item => item?.product?.id === appliedCouponProductId);
      if (!hasProduct) {
        setAppliedCouponCode('');
        setDiscountPercent(0);
        setAppliedCouponProductId(null);
      }
    }
  }, [cart, appliedCouponProductId]);
  
  // Countdown Timer state (24-hour clock that resets daily at midnight)
  const [timeLeft, setTimeLeft] = React.useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0); // Next midnight
      const diffMs = midnight.getTime() - now.getTime();
      const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
      
      const hours = Math.floor(totalSecs / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;
      
      return { hours, minutes, seconds };
    };

    // Set initial time
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddToCartWithQty = (product: Product, quantity = 1, force = false) => {
    if (!product || !product.id) return;
    if (force) {
      // guest bypass
    }
    if (!loggedInUser) {
      setPendingAddToCart({ product, qty: quantity });
    }

    const limit = product.purchaseLimit;
    let allowedQty = quantity;
    let limitReached = false;

    setCart(prev => {
      const arr = Array.isArray(prev) ? prev.filter(Boolean) : [];
      const existingIdx = arr.findIndex(item => item?.product?.id === product.id);
      const currentQty = existingIdx > -1 ? (arr[existingIdx]?.quantity || 0) : 0;

      if (limit !== undefined && limit !== null && limit > 0) {
        if (currentQty + quantity > limit) {
          allowedQty = Math.max(0, limit - currentQty);
          limitReached = true;
        }
      }

      if (allowedQty <= 0) {
        if (limitReached) {
          setTimeout(() => {
            alert(`You can only purchase a maximum of ${limit} units of "${product.name}" per order.`);
          }, 0);
        }
        return arr;
      }

      if (existingIdx > -1) {
        const nextCart = [...arr];
        nextCart[existingIdx] = {
          ...nextCart[existingIdx],
          quantity: currentQty + allowedQty
        };
        if (limitReached) {
          setTimeout(() => {
            alert(`You can only purchase a maximum of ${limit} units of "${product.name}" per order.`);
          }, 0);
        }
        return nextCart;
      }

      if (limitReached) {
        setTimeout(() => {
          alert(`You can only purchase a maximum of ${limit} units of "${product.name}" per order.`);
        }, 0);
      }
      return [...arr, { product, quantity: allowedQty }];
    });

    // Open the right-side cart drawer
    setIsCartDrawerOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (!productId) return;
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    const product = productsState.find(p => p.id === productId);
    const limit = product?.purchaseLimit;
    let targetQty = quantity;

    if (limit !== undefined && limit !== null && limit > 0 && quantity > limit) {
      targetQty = limit;
      alert(`You can only purchase a maximum of ${limit} units of "${product?.name || 'this item'}" per order.`);
    }

    setCart(prev => {
      const arr = Array.isArray(prev) ? prev.filter(Boolean) : [];
      return arr.map(item =>
        item?.product?.id === productId ? { ...item, quantity: targetQty } : item
      );
    });
  };

  const handleRemoveItem = (productId: string) => {
    if (!productId) return;
    setCart(prev => {
      const arr = Array.isArray(prev) ? prev.filter(Boolean) : [];
      return arr.filter(item => item?.product?.id !== productId);
    });
  };

  const handleClearCart = () => {
    setCart([]);
    setAppliedCouponCode('');
    setDiscountPercent(0);
    setAppliedCouponProductId(null);
  };

  const handleBuyNow = (product: Product, qty: number) => {
    handleAddToCartWithQty(product, qty);
    setIsCartDrawerOpen(true);
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
      {migrationStatus && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          fontFamily: 'system-ui, sans-serif',
          color: '#374151'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '32px',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🕉️</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1f2937', marginBottom: '8px' }}>
              Vedic Acharya Seeding & Cloudflare Sync
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '24px', minHeight: '40px' }}>
              {migrationStatus}
            </p>
            <div style={{
              height: '8px',
              backgroundColor: '#e5e7eb',
              borderRadius: '9999px',
              overflow: 'hidden',
              marginBottom: '16px'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#10b981',
                width: `${migrationProgress}%`,
                borderRadius: '9999px',
                transition: 'width 0.3s ease-out'
              }} />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>
              {migrationProgress}% Complete
            </div>
          </div>
        </div>
      )}
      
      {/* 1. Navbar Section */}
      {currentPage !== 'admin' && currentPage !== 'admin-login' && currentPage !== 'pundit-login' && currentPage !== 'pundit-dashboard' && currentPage !== 'astrologer-login' && currentPage !== 'astrologer-dashboard' && (
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
              className="nav-logo"
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
                    top: 'calc(100% - 2px)',
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
                    marginTop: '0'
                  }}>
                    {visibleCategories.map(cat => (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="nav-actions">

            {!isAdminAuthenticated && (
              <button
                onClick={() => setCurrentPage('notifications')}
                style={{
                  position: 'relative',
                  padding: '8px',
                  color: currentPageState === 'notifications' ? 'var(--primary-lime)' : 'var(--text-dark)',
                  transition: 'color 0.2s'
                }}
                title="Sacred Alerts"
              >
                <Bell size={20} fill={currentPageState === 'notifications' ? 'var(--primary-lime)' : 'none'} />
                {unreadNotificationsCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
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
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setCurrentPage('profile')}
              style={{
                padding: '8px',
                color: loggedInUser ? 'var(--primary-gold, #d97706)' : (currentPageState === 'profile' || currentPageState === 'user-auth' ? 'var(--primary-lime)' : 'var(--text-dark)'),
                transition: 'color 0.2s'
              }}
              title={loggedInUser ? `Logged in as ${loggedInUser.fullName || loggedInUser.phoneNumber || 'Devotee'}` : "Spiritual Dashboard"}
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
              onClick={() => setIsCartDrawerOpen(true)}
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
                {(mobileCategoriesExpanded ? visibleCategories : visibleCategories.slice(0, 12)).map(cat => (
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
                {bannerSlides.map((slide, idx) => {
                  const imageUrl = typeof slide === 'string' ? slide : (slide as any).imageUrl;
                  const redirectUrl = typeof slide === 'string' ? undefined : (slide as any).redirectUrl;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (redirectUrl) {
                          handleBannerRedirect(redirectUrl);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: idx === currentSlideIndex ? 1 : 0,
                        transition: 'opacity 0.8s ease-in-out',
                        zIndex: idx === currentSlideIndex ? 1 : 0,
                        cursor: redirectUrl ? 'pointer' : 'default'
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt={`Banner slide ${idx + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  );
                })}

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
          }} className="featured-grid-wrap">
            
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
                      className="featured-product-card"
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
                              const cartItem = cart.find(item => item?.product?.id === product.id);
                              const qty = cartItem ? cartItem.quantity : 0;
                              if (qty > 0) {
                                return (
                                  <div className="qty-selector-wrap" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: 'var(--primary-deep)',
                                    borderRadius: '8px',
                                    padding: '2px',
                                    width: '100%',
                                    height: '36px',
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
                                  className="add-to-cart-btn"
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

              {/* Bottom checkout banner */}
              <div className="bundle-checkout-bar" style={{
                marginTop: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: '16px',
                backgroundColor: 'var(--primary-lime-light, #fff7ed)',
                border: '1px solid rgba(249, 115, 22, 0.15)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 650, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bundle Total</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                    ₹{Math.round(getFeaturedProducts().reduce((sum, p) => sum + p.price, 0))}
                  </span>
                </div>
                <button
                  onClick={() => {
                    getFeaturedProducts().forEach(p => handleAddToCartWithQty(p, 1));
                  }}
                  className="btn-primary"
                  style={{ 
                    padding: '12px 24px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    margin: 0,
                    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)'
                  }}
                >
                  Add Bundle to Cart
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Section 2: Flash Sale (Vibrant Orange Section) */}
      <section id="sale" style={{
        background: 'radial-gradient(circle at top, #ff7e29 0%, #ea580c 60%, #b43c08 100%)',
        padding: '48px 0',
        borderTop: '1px solid var(--border-light)',
        borderBottom: '1px solid var(--border-light)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Faint Sacred Mandala/Geometry pattern vector overlay */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23ffffff' fill-opacity='0.035'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm1-61c3.148 0 5.7-2.552 5.7-5.7s-2.552-5.7-5.7-5.7-5.7 2.552-5.7 5.7 2.552 5.7 5.7 5.7zm44 9c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm-60 21c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM25 5c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm47 87c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-47-37c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm7 30c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM91 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-28-15c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2zm-25-17c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2zm-14 50c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2z'%3E%3C/path%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.5,
          pointerEvents: 'none',
          zIndex: 0
        }} />
        <div className="container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Header Tag */}
          <span 
            className="flash-sale-badge"
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '4px 14px',
              borderRadius: 'var(--radius-full)',
              boxShadow: '0 2px 10px rgba(239, 68, 68, 0.3)'
            }}
          >
            {homepageConfig?.saleSubtitle || "EXCLUSIVE OFFERS WEEK"}
          </span>

          {/* Heading */}
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 950,
            color: '#ffffff',
            textAlign: 'center',
            margin: 0,
            letterSpacing: '-0.01em'
          }} className="sale-heading">
            {homepageConfig?.saleTitle || "Exceptional Discounts up to 30%"}
          </h2>

          {(() => {
            const totalSecs = (timeLeft.hours * 3600) + (timeLeft.minutes * 60) + timeLeft.seconds;
            const progressPercent = (totalSecs / 86400) * 100;
            
            return (
              <>
                <style>{`
                  @keyframes shimmer {
                    0% { transform: translateX(-150%) skewX(-20deg); }
                    50% { transform: translateX(150%) skewX(-20deg); }
                    100% { transform: translateX(150%) skewX(-20deg); }
                  }
                  @keyframes smoothBlink {
                    0% { opacity: 0.25; }
                    50% { opacity: 1; text-shadow: 0 0 8px rgba(255,255,255,0.6); }
                    100% { opacity: 0.25; }
                  }
                  .countdown-box-interactive {
                    width: 52px;
                    height: 52px;
                    background-color: #ffffff;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.45rem;
                    font-weight: 900;
                    color: var(--primary-forest);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    transition: all 0.2s ease;
                  }
                  .countdown-box-interactive:hover {
                    transform: translateY(-2px) scale(1.05);
                    box-shadow: 0 6px 16px rgba(249, 115, 22, 0.2);
                    color: var(--primary-accent);
                  }
                  .countdown-colon {
                    font-size: 1.8rem;
                    font-weight: 900;
                    color: var(--text-dark);
                    align-self: flex-start;
                    line-height: 52px;
                    height: 52px;
                    animation: smoothBlink 1.5s infinite ease-in-out;
                  }
                  .flash-sale-badge {
                    animation: pulseBadge 2s infinite;
                  }
                  @keyframes pulseBadge {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.04); }
                    100% { transform: scale(1); }
                  }
                  @media (max-width: 480px) {
                    .countdown-box-interactive {
                      width: 44px !important;
                      height: 44px !important;
                      font-size: 1.15rem !important;
                      border-radius: 8px !important;
                    }
                    .countdown-colon {
                      font-size: 1.4rem !important;
                      line-height: 44px !important;
                      height: 44px !important;
                    }
                  }
                `}</style>

                {/* Highlight Capsule wrapping Timer and Progress Bar */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.22)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.45)',
                  borderRadius: '20px',
                  padding: '20px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '14px',
                  width: '100%',
                  maxWidth: '360px',
                  boxShadow: '0 8px 32px rgba(45, 20, 14, 0.08), inset 0 1px 0 rgba(255,255,255,0.4)',
                  boxSizing: 'border-box'
                }}>
                  {/* Timer Countdown Grid */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }} className="sale-countdown-container">
                    <div className="flex-center" style={{ flexDirection: 'column' }}>
                      <div className="countdown-box-interactive">{String(timeLeft.hours).padStart(2, '0')}</div>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: 'var(--text-dark)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginTop: '6px',
                        opacity: 0.85
                      }}>Hours</span>
                    </div>
                    <span className="countdown-colon">:</span>
                    <div className="flex-center" style={{ flexDirection: 'column' }}>
                      <div className="countdown-box-interactive">{String(timeLeft.minutes).padStart(2, '0')}</div>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: 'var(--text-dark)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginTop: '6px',
                        opacity: 0.85
                      }}>Mins</span>
                    </div>
                    <span className="countdown-colon">:</span>
                    <div className="flex-center" style={{ flexDirection: 'column' }}>
                      <div className="countdown-box-interactive">{String(timeLeft.seconds).padStart(2, '0')}</div>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: 'var(--text-dark)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginTop: '6px',
                        opacity: 0.85
                      }}>Secs</span>
                    </div>
                  </div>

                  {/* Progress Bar showing remaining time */}
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: 'rgba(45, 20, 14, 0.15)',
                      borderRadius: '999px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        width: `${progressPercent}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #ef4444 0%, #facc15 100%)',
                        borderRadius: '999px',
                        transition: 'width 1s linear',
                        boxShadow: '0 0 6px rgba(239, 68, 68, 0.4)',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                          animation: 'shimmer 2.5s infinite',
                          transform: 'skewX(-20deg)'
                        }} />
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: 'var(--text-dark)',
                      opacity: 0.85
                    }}>
                      <span>🔥 DEAL OF THE DAY</span>
                      <span>⏳ REFRESHES DAILY</span>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

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
                    border: 'none',
                    borderTop: '3px solid transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 8px 30px rgba(45, 20, 14, 0.12)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    padding: '12px',
                    cursor: 'pointer',
                    gap: '12px'
                  }}
                  className="sale-product-card"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(45, 20, 14, 0.22)';
                    e.currentTarget.style.borderTopColor = 'var(--primary-lime)';
                    const img = e.currentTarget.querySelector('.card-image') as HTMLElement;
                    if (img) img.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(45, 20, 14, 0.12)';
                    e.currentTarget.style.borderTopColor = 'transparent';
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
                          const cartItem = cart.find(item => item?.product?.id === product.id);
                          const qty = cartItem ? cartItem.quantity : 0;
                          if (qty > 0) {
                            return (
                              <div className="qty-selector-wrap" style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifySelf: 'stretch',
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
                              className="add-to-cart-btn"
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

          <button 
            onClick={() => setCurrentPage('shop')}
            style={{
              marginTop: '28px',
              cursor: 'pointer',
              backgroundColor: 'var(--primary-deep)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              padding: '12px 36px',
              borderRadius: 'var(--radius-full)',
              boxShadow: '0 4px 12px rgba(45, 20, 14, 0.15)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(45, 20, 14, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(45, 20, 14, 0.15)';
            }}
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
              onClick={() => setCurrentPage('shop')}
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
                          const cartItem = cart.find(item => item?.product?.id === product.id);
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
          categoriesList={categoriesList}
          productsOrder={productsOrder}
          onBannerClick={handleBannerRedirect}
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
          onBannerClick={handleBannerRedirect}
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
          taxDeliverySettings={taxDeliverySettings}
        />
      ) : currentPage === 'checkout' ? (
        <CheckoutPage
          cart={cart}
          onBackToCart={() => { setCurrentPage('shop'); setIsCartDrawerOpen(true); }}
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
          taxDeliverySettings={taxDeliverySettings}
          paymentActivation={paymentActivation}
          onOrderSuccess={async (details) => {
            const checkoutAttemptId = details.orderId;
            const sessionToken = localStorage.getItem('session_token') || '';

            try {
              const res = await fetch('/api/orders/create', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  items: details.items.map((i: any) => ({
                    productId: i.product.id,
                    quantity: i.quantity
                  })),
                  shippingAddress: {
                    fullName: details.fullName,
                    phoneNumber: details.phoneNumber,
                    email: details.email || '',
                    addressLine1: details.addressLine1,
                    addressLine2: details.addressLine2 || '',
                    city: details.deliveryCity,
                    state: details.deliveryState,
                    pincode: details.pincode
                  },
                  paymentMethod: details.paymentMethod,
                  couponCode: details.appliedCouponCode || '',
                  checkoutAttemptId,
                  sessionToken,
                  paymentScreenshot: details.paymentScreenshot || null
                })
              });

              if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Server responded with status ${res.status}`);
              }

              const result = await res.json();
              console.log('[Checkout App] Secure order created:', result.orderId);

              const newOrder: LocalOrder = {
                ...details,
                orderId: result.orderId,
                userId: loggedInUser?.id,
                status: 'Payment Pending',
                paymentStatus: 'Pending',
                subtotal: result.subtotal,
                discount: result.discount,
                shipping: result.shipping,
                tax: result.tax,
                total: result.total
              };

              if (loggedInUser) {
                // Sync user email if it was entered during checkout
                if (details.email && details.email.trim() !== '') {
                  try {
                    const cleanedEmail = details.email.trim();
                    const isPlaceholder = loggedInUser.email && loggedInUser.email.startsWith('devotee_') && loggedInUser.email.endsWith('@spiritual.com');
                    if (!loggedInUser.email || isPlaceholder || loggedInUser.email !== cleanedEmail) {
                      const { error: userUpdateErr } = await supabase
                        .from('website_store_users')
                        .update({ email: cleanedEmail })
                        .eq('id', loggedInUser.id);
                      
                      if (!userUpdateErr) {
                        const updatedUser = {
                          ...loggedInUser,
                          email: cleanedEmail
                        };
                        localStorage.setItem('mantra_user_session', JSON.stringify(updatedUser));
                        setLoggedInUser(updatedUser);
                      }
                    }
                  } catch (emailErr) {
                    console.error('Failed to sync user email from order:', emailErr);
                  }
                }

                try {
                  const token = localStorage.getItem('session_token') || '';
                  const existingResponse = await fetch(`/api/customer/addresses?sessionToken=${token}`);
                  if (existingResponse.ok) {
                    const existingData = await existingResponse.json();
                    const alreadyExists = existingData.some((addr: any) =>
                      addr.street === details.addressLine1 &&
                      addr.city === details.deliveryCity &&
                      addr.state === details.deliveryState &&
                      addr.zip === details.pincode
                    );

                    if (!alreadyExists) {
                      const isDefault = existingData.length === 0;
                      await fetch('/api/customer/addresses', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          sessionToken: token,
                          type: 'Checkout Address',
                          name: details.fullName,
                          phone: details.phoneNumber,
                          street: details.addressLine1,
                          city: details.deliveryCity,
                          state: details.deliveryState,
                          zip: details.pincode,
                          is_default: isDefault
                        })
                      });
                    }
                  }
                } catch (syncErr) {
                  console.error('Failed to sync shipping address during checkout:', syncErr);
                }
              }

              setOrdersState(prev => {
                if (prev.some(o => o.orderId === newOrder.orderId)) {
                  return prev;
                }
                return [newOrder, ...prev];
              });
              setOrderDetails(newOrder);
              setCurrentPage('success');
            } catch (err) {
              console.error('Failed to save order to Supabase:', err);
              alert('Checkout Failed: ' + (err as Error).message);
            }
          }}
        />
      ) : currentPage === 'success' && orderDetails ? (
        <OrderSuccessPage
          order={orderDetails}
          products={productsState}
          onViewProductDetails={handleViewDetails}
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
          onNavigateToCart={() => setIsCartDrawerOpen(true)}
        />
      ) : currentPage === 'profile' ? (
        <UserProfilePage
          orders={ordersState}
          setOrders={setOrdersState}
          products={productsState}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
          onAddToCart={handleAddToCartWithQty}
          onNavigateToShop={() => setCurrentPage('shop')}
          onNavigateToHome={() => setCurrentPage('home')}
          onNavigateToOrders={() => setCurrentPage('orders')}
          loggedInUser={loggedInUser}
          initialTab={profileInitialTab}
          onNavigateToAffiliation={() => setCurrentPage('affiliation')}
          onLogout={() => {
            try {
              localStorage.removeItem('mantra_user_session');
              localStorage.removeItem('session_token');
            } catch (e) {}
            setLoggedInUser(null);
            setCurrentPage('shop');
          }}
          onProfileUpdate={(updatedUser) => {
            try {
              localStorage.setItem('mantra_user_session', JSON.stringify(updatedUser));
            } catch (e) {}
            setLoggedInUser(updatedUser);
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
            
            if (pendingAddToCart) {
              handleAddToCartWithQty(pendingAddToCart.product, pendingAddToCart.qty, true);
              setIsCartDrawerOpen(true);
            } else if (pendingBuyNow) {
              handleAddToCartWithQty(pendingBuyNow.product, pendingBuyNow.qty, true);
              setPendingBuyNow(null);
              setIsCartDrawerOpen(true);
            } else if (authRedirectPage) {
              setCurrentPage(authRedirectPage, { bypassAuthCheck: true });
              setAuthRedirectPage(null);
            } else {
              setCurrentPage('profile', { bypassAuthCheck: true });
            }
          }}
        />
      ) : currentPage === 'notifications' ? (
        <NotificationsPage
          orders={ordersState}
          readNotificationIds={readNotificationIds}
          clearedNotificationIds={clearedNotificationIds}
          onMarkAsRead={(id) => {
            if (!readNotificationIds.includes(id)) {
              setReadNotificationIds(prev => [...prev, id]);
            }
          }}
          onMarkAllAsRead={() => {
            const allIds = notifications.map(n => n.id);
            setReadNotificationIds(allIds);
          }}
          onClearNotification={(id) => {
            if (!clearedNotificationIds.includes(id)) {
              setClearedNotificationIds(prev => [...prev, id]);
            }
          }}
          onClearAllNotifications={(ids) => {
            setClearedNotificationIds(prev => [...prev, ...ids.filter(id => !prev.includes(id))]);
          }}
          onNavigateToHome={() => setCurrentPage('home')}
          onNavigateToShop={() => setCurrentPage('shop')}
          onNavigateToOrders={() => {
            setCurrentPage('orders');
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
      ) : currentPage === 'affiliation' ? (
        <AffiliationPromoPage
          loggedInUser={loggedInUser}
          onLoginSuccess={(userSession, token) => {
            try {
              localStorage.setItem('mantra_user_session', JSON.stringify(userSession));
              localStorage.setItem('session_token', token);
            } catch (e) {}
            setLoggedInUser(userSession);
          }}
          onNavigateToProfile={(tab) => setCurrentPage('profile', { profileTab: tab })}
        />
      ) : currentPage === 'sitemap' ? (
        <SitemapPage
          products={productsState}
          onNavigate={(page, options) => setCurrentPage(page, options)}
        />
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
          categoriesList={categoriesList}
          onUpdateCategoriesList={(newList, newOrder) => {
            setCategoriesList(newList);
            setCategoriesOrder(newOrder);
          }}
          productsOrder={productsOrder}
          onUpdateProductsOrder={setProductsOrder}
          taxDeliverySettings={taxDeliverySettings}
          onUpdateTaxDeliverySettings={setTaxDeliverySettings}
        />
      ) : currentPage === 'pundit-login' ? (
        <PunditLoginPage
          onLoginSuccess={(userSession, token) => {
            try {
              localStorage.setItem('mantra_user_session', JSON.stringify(userSession));
              localStorage.setItem('session_token', token);
            } catch (e) {}
            setLoggedInUser(userSession);
            setCurrentPage('pundit-dashboard');
          }}
          onNavigateToHome={() => setCurrentPage('home')}
        />
      ) : currentPage === 'pundit-dashboard' && loggedInUser ? (
        <PunditDashboardPage
          loggedInUser={loggedInUser}
          onLogout={() => {
            try {
              localStorage.removeItem('mantra_user_session');
              localStorage.removeItem('session_token');
            } catch (e) {}
            setLoggedInUser(null);
            setCurrentPage('pundit-login');
          }}
          products={productsState}
        />
      ) : currentPage === 'astrologer-login' ? (
        <AstrologerLoginPage
          onLoginSuccess={(userSession, token) => {
            try {
              const updatedSession = { ...userSession, isAstrologer: true };
              localStorage.setItem('mantra_user_session', JSON.stringify(updatedSession));
              localStorage.setItem('session_token', token);
              setLoggedInUser(updatedSession);
            } catch (e) {}
            setCurrentPage('astrologer-dashboard');
          }}
          onNavigateToHome={() => setCurrentPage('home')}
        />
      ) : currentPage === 'astrologer-dashboard' && loggedInUser ? (
        <AstrologerDashboardPage
          loggedInUser={loggedInUser}
          onLogout={() => {
            try {
              localStorage.removeItem('mantra_user_session');
              localStorage.removeItem('session_token');
            } catch (e) {}
            setLoggedInUser(null);
            setCurrentPage('astrologer-login');
          }}
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
      {currentPage !== 'admin' && currentPage !== 'admin-login' && currentPage !== 'pundit-login' && currentPage !== 'pundit-dashboard' && currentPage !== 'astrologer-login' && currentPage !== 'astrologer-dashboard' && (
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
                  <button onClick={() => setIsCartDrawerOpen(true)} style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    Shopping Cart
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentPage('sitemap')} style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    Altar Site Map
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentPage('pundit-login')} style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    Pandit Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentPage('astrologer-login')} style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    Astrologer Portal
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
                  <button onClick={() => setCurrentPage('profile')} style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
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
      )}

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

      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onCheckout={() => {
          setIsCartDrawerOpen(false);
          setIsSeamlessCheckoutOpen(true);
        }}
        loggedInUser={loggedInUser}
        appliedCouponCode={appliedCouponCode}
        discountPercent={discountPercent}
        onApplyCoupon={(code, percent, productId) => {
          setAppliedCouponCode(code);
          setDiscountPercent(percent);
          setAppliedCouponProductId(productId);
        }}
        products={productsState}
        exploreMoreProductIds={Array.isArray(homepageConfig?.cartExploreMoreProductIds) ? homepageConfig.cartExploreMoreProductIds : []}
        onAddToCart={handleAddToCartWithQty}
        taxDeliverySettings={taxDeliverySettings}
      />

      <SeamlessCheckoutModal
        isOpen={isSeamlessCheckoutOpen}
        onClose={() => setIsSeamlessCheckoutOpen(false)}
        cart={cart}
        loggedInUser={loggedInUser}
        onLoginSuccess={(userSession, token) => {
          try {
            localStorage.setItem('mantra_user_session', JSON.stringify(userSession));
            localStorage.setItem('session_token', token);
          } catch (e) {}
          setLoggedInUser(userSession);
        }}
        appliedCouponCode={appliedCouponCode}
        onApplyCoupon={(code, percent, productId) => {
          setAppliedCouponCode(code);
          setDiscountPercent(percent);
          setAppliedCouponProductId(productId);
        }}
        discountPercent={discountPercent}
        taxDeliverySettings={taxDeliverySettings}
        paymentActivation={paymentActivation}
        onOrderSuccess={async (details) => {
          const checkoutAttemptId = details.orderId;
          const sessionToken = localStorage.getItem('session_token') || '';

          try {
            const res = await fetch('/api/orders/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                items: details.items.map((i: any) => ({
                  productId: i.product.id,
                  quantity: i.quantity
                })),
                shippingAddress: {
                  fullName: details.fullName,
                  phoneNumber: details.phoneNumber,
                  email: details.email || '',
                  addressLine1: details.addressLine1,
                  addressLine2: details.addressLine2 || '',
                  city: details.deliveryCity,
                  state: details.deliveryState,
                  pincode: details.pincode
                },
                paymentMethod: details.paymentMethod,
                couponCode: details.appliedCouponCode || '',
                checkoutAttemptId,
                sessionToken,
                paymentScreenshot: details.paymentScreenshot || null
              })
            });

            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.error || `Server responded with status ${res.status}`);
            }

            const result = await res.json();
            console.log('[Checkout App] Secure order created (Seamless):', result.orderId);

            const newOrder: LocalOrder = {
              ...details,
              orderId: result.orderId,
              userId: loggedInUser?.id,
              status: 'Payment Pending',
              paymentStatus: 'Pending',
              subtotal: result.subtotal,
              discount: result.discount,
              shipping: result.shipping,
              tax: result.tax,
              total: result.total
            };

            if (loggedInUser) {
              // Sync user email if it was entered during checkout
              if (details.email && details.email.trim() !== '') {
                try {
                  const cleanedEmail = details.email.trim();
                  const isPlaceholder = loggedInUser.email && loggedInUser.email.startsWith('devotee_') && loggedInUser.email.endsWith('@spiritual.com');
                  if (!loggedInUser.email || isPlaceholder || loggedInUser.email !== cleanedEmail) {
                    const { error: userUpdateErr } = await supabase
                      .from('website_store_users')
                      .update({ email: cleanedEmail })
                      .eq('id', loggedInUser.id);
                    
                    if (!userUpdateErr) {
                      const updatedUser = {
                        ...loggedInUser,
                        email: cleanedEmail
                      };
                      localStorage.setItem('mantra_user_session', JSON.stringify(updatedUser));
                      setLoggedInUser(updatedUser);
                    }
                  }
                } catch (emailErr) {
                  console.error('Failed to sync user email from order:', emailErr);
                }
              }

              try {
                const token = localStorage.getItem('session_token') || '';
                const existingResponse = await fetch(`/api/customer/addresses?sessionToken=${token}`);
                if (existingResponse.ok) {
                  const existingData = await existingResponse.json();
                  const alreadyExists = existingData.some((addr: any) =>
                    addr.street === details.addressLine1 &&
                    addr.city === details.deliveryCity &&
                    addr.state === details.deliveryState &&
                    addr.zip === details.pincode
                  );

                  if (!alreadyExists) {
                    const isDefault = existingData.length === 0;
                    await fetch('/api/customer/addresses', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        sessionToken: token,
                        type: 'Checkout Address',
                        name: details.fullName,
                        phone: details.phoneNumber,
                        street: details.addressLine1,
                        city: details.deliveryCity,
                        state: details.deliveryState,
                        zip: details.pincode,
                        is_default: isDefault
                      })
                    });
                  }
                }
              } catch (syncErr) {
                console.error('Failed to sync shipping address during checkout:', syncErr);
              }
            }

            setOrdersState(prev => {
              if (prev.some(o => o.orderId === newOrder.orderId)) {
                return prev;
              }
              return [newOrder, ...prev];
            });
            setOrderDetails(newOrder);
            setCurrentPage('success');
          } catch (err) {
            console.error('Failed to save order to Supabase:', err);
            alert('Checkout Failed: ' + (err as Error).message);
          }
        }}
        onOrderComplete={handleClearCart}
      />

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
          
          /* Hide search wrapper on mobile views to prevent double search bars */
          .nav-links-wrapper {
            display: none !important;
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
            height: auto !important;
          }
        }

        @media (max-width: 900px) {
          .featured-grid-wrap {
            grid-template-columns: 1fr !important;
          }
          .featured-grid-wrap > div:first-child {
            height: 380px !important;
          }
        }
        @media (max-width: 600px) {
          .sub-grid-2x2 {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .featured-grid-wrap > div:first-child {
            height: 280px !important;
          }
          .featured-product-card {
            padding: 8px !important;
            border-radius: 12px !important;
            gap: 6px !important;
          }
          .featured-product-card h3 {
            font-size: 0.82rem !important;
            margin-bottom: 2px !important;
          }
          .featured-product-card span {
            font-size: 0.95rem !important;
          }
          .featured-product-card .qty-selector-wrap {
            height: 34px !important;
            padding: 2px !important;
          }
          .featured-product-card .qty-selector-wrap span {
            font-size: 0.75rem !important;
          }
          .featured-product-card .qty-selector-wrap button {
            width: 26px !important;
            height: 26px !important;
          }
          .featured-product-card .add-to-cart-btn {
            padding: 8px 12px !important;
            font-size: 0.75rem !important;
            border-radius: 6px !important;
          }
          .bundle-checkout-bar {
            padding: 12px 14px !important;
            margin-top: 16px !important;
          }
          .bundle-checkout-bar button {
            padding: 10px 16px !important;
            font-size: 0.82rem !important;
            border-radius: 10px !important;
          }
          .bundle-checkout-bar span:last-child {
            font-size: 1.1rem !important;
          }
          .desktop-search {
            display: none !important;
          }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Declined Payment Alert Pop-up Modal */}
      {activePopupNotification && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={() => {
          setDismissedPopupIds(prev => [...prev, activePopupNotification.id]);
          if (!readNotificationIds.includes(activePopupNotification.id)) {
            setReadNotificationIds(prev => [...prev, activePopupNotification.id]);
          }
        }}
        >
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '2px solid #ef4444',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px',
            animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444'
            }}>
              <AlertTriangle size={28} />
            </div>

            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                color: '#1e293b',
                margin: 0
              }}>
                Payment Verification Failed
              </h3>
              <p style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#ef4444',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginTop: '4px',
                margin: 0
              }}>
                Order #{activePopupNotification.orderId} • Attempt {activePopupNotification.attemptCount || 1}/3
              </p>
            </div>

            <p style={{
              fontSize: '0.88rem',
              color: '#64748b',
              lineHeight: '1.5',
              margin: 0
            }}>
              Devotee, the admin has declined your uploaded payment verification screenshot. 
              Please re-upload a valid transaction confirmation screenshot immediately to prevent your order from being automatically cancelled.
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              width: '100%',
              marginTop: '8px'
            }}>
              <button
                onClick={() => {
                  setDismissedPopupIds(prev => [...prev, activePopupNotification.id]);
                  if (!readNotificationIds.includes(activePopupNotification.id)) {
                    setReadNotificationIds(prev => [...prev, activePopupNotification.id]);
                  }
                  setCurrentPage('orders');
                }}
                className="btn-lime"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                Re-upload Payment Proof Now
              </button>

              <button
                onClick={() => {
                  setDismissedPopupIds(prev => [...prev, activePopupNotification.id]);
                  if (!readNotificationIds.includes(activePopupNotification.id)) {
                    setReadNotificationIds(prev => [...prev, activePopupNotification.id]);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  backgroundColor: 'transparent',
                  border: '1.5px solid var(--border-light)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Acknowledge & Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Custom Alert Modal */}
      {globalAlert && (
        <div className="alert-overlay" onClick={() => setGlobalAlert(null)}>
          <div className="alert-container" onClick={(e) => e.stopPropagation()}>
            <div className="alert-icon-box">
              <img src={logo} alt="Mantra Puja Logo" style={{ height: '32px', objectFit: 'contain' }} />
            </div>
            <h3 className="alert-title">{globalAlert.title || "Notification"}</h3>
            <p className="alert-message">{globalAlert.message}</p>
            <button className="alert-btn" onClick={() => setGlobalAlert(null)}>
              OK
            </button>
          </div>
        </div>
      )}


    </div>
  );
}

export default App;
