
import React from 'react';
import { Heart, ShoppingBag, Star, Share2, ShieldCheck, Check, Clock, ChevronRight, MessageSquare, Info, User, Award, Calendar, ChevronDown, BookOpen, Upload, Plus, Minus, Trash2, Eye, EyeOff, X, ChevronLeft, ZoomIn, Play, Pencil, Users, Package, MapPin, Landmark, Volume2, VolumeX, Tv, ChevronsRight } from 'lucide-react';
import type { Product, PoojaProduct } from '../types';
import { InlineEdit } from './InlineEdit';
import { uploadToR2 } from '../lib/cloudflare/r2';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';
import { CompressionStatusWidget } from '../lib/mediaCompressor';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/i18n';

interface ProductDetailPageProps {
  product: Product;
  onAddToCart: (product: Product, quantity?: number) => void;
  onViewDetails: (product: Product) => void;
  wishlist: Record<string, boolean>;
  onToggleWishlist: (productId: string) => void;
  onBackToShop: () => void;
  products?: Product[];
  editable?: boolean;
  onUpdate?: (updatedFields: Partial<PoojaProduct>) => void;
  onBuyNow?: (product: Product, quantity: number) => void;
  cart: { product: Product; quantity: number }[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onFileSelect?: (file: File, pathPrefix: string) => Promise<string>;
  mediaQueue?: Record<string, any>;
  resolveMediaUrl?: (url: string) => string;
}

// Initial mock reviews database to supply rich devotee reviews
const initialReviews: Record<string, Array<{ id: string; author: string; rating: number; date: string; content: string; verified: boolean }>> = {
  'p1': [
    { id: 'r1', author: 'Aarav Sharma', rating: 5, date: 'May 12, 2026', content: 'Incredible energy from these beads. The moment I held it during my morning mantras, I felt a deep sense of calm.', verified: true },
    { id: 'r2', author: 'Priya Patel', rating: 5, date: 'May 08, 2026', content: 'Authentic Nepalese beads. Nicely oiled and spaced. Chanting is highly focused now.', verified: true }
  ],
  'p2': [
    { id: 'r1', author: 'Raman Das', rating: 5, date: 'May 15, 2026', content: 'Beautiful Vrindavan Tulsi. The subtle natural scent of holy basil wood is very calming.', verified: true }
  ],
  'p9': [
    { id: 'r1', author: 'Rohan Mehta', rating: 5, date: 'April 20, 2026', content: 'A masterpiece! The Nataraja details are exquisite. Heavy solid brass of extremely high quality.', verified: true }
  ]
};

// Specifications and storytelling descriptions per product category
const productSpecs: Record<string, { material: string; weight: string; dimensions: string; origin: string }> = {
  'Rudraksha': { material: 'Natural Himalayan Rudraksha Seeds', weight: '45 grams', dimensions: '108+1 beads (8mm bead diameter)', origin: 'Nepal foothills' },
  'Bracelet': { material: 'Red Sandalwood & Rudraksha Seeds', weight: '15 grams', dimensions: 'Elastic stretchable (fits 7-8 inch wrists)', origin: 'Mysore, India' },
  'Murti': { material: 'Solid Temple-grade Brass casting', weight: '1.2 kg', dimensions: '6.5 inches height', origin: 'Moradabad, India' },
  'Yantras': { material: '24k Gold Plated Copper Sheet', weight: '80 grams', dimensions: '6 x 6 inches', origin: 'Siddhpur, India' },
  'Anklet': { material: 'Pure 925 Sterling Silver', weight: '35 grams', dimensions: '10.5 inches length with adjustable clasp', origin: 'Jaipur, India' },
  'Frames': { material: 'Premium Teakwood & Gold Foil', weight: '480 grams', dimensions: '8 x 10 inches', origin: 'Varanasi, India' },
  'Rashi': { material: 'Natural planetary alignment materials', weight: '30 grams', dimensions: 'Zodiac specific dimensions', origin: 'Ujjain, India' },
  'Karungali': { material: 'Genuine Ebony Wood (Karungali)', weight: '25 grams', dimensions: '108 beads / stretchable wrist size', origin: 'Madurai, India' },
  'Jadi': { material: 'Naturally harvested organic roots', weight: '40 grams bag', dimensions: 'Varies by root structure', origin: 'Western Ghats, India' },
  'Pyrite': { material: 'Natural Golden Pyrite Cluster', weight: '180 grams', dimensions: '3.5 x 2.5 x 2 inches', origin: 'Peru' },
  'Kavach': { material: 'Pure 925 Sterling Silver pendant', weight: '12 grams (including silver chain)', dimensions: '1.2 inch pendant height', origin: 'Ujjain, India' },
  'Siddh Range': { material: 'Sacred energized copper and silver elements', weight: '150 grams', dimensions: 'Various dimensions', origin: 'Rishikesh, India' },
  'Gemstones': { material: 'Natural Yellow Sapphire (Pushparag)', weight: '4.25 Carats (approx. 5 Ratti)', dimensions: 'Oval-cut gemstone', origin: 'Ceylon, Sri Lanka' },
  'Pyramid': { material: 'Cast copper and natural crystal base', weight: '220 grams', dimensions: '3.5 x 3.5 x 4 inches', origin: 'Pune, India' },
  'Necklaces/Mala': { material: 'Genuine Sacred Basil (Tulsi) & Sphatik Crystal', weight: '20 grams', dimensions: '108+1 beads (6mm bead diameter)', origin: 'Vrindavan, India' },
  'Tower & Tumbles': { material: 'Aromatic high-grade crystal structures', weight: '240 grams', dimensions: '4-5 inches height', origin: 'Madagascar' },
  'Crystal Dome Trees': { material: 'Natural Quartz & Gemstone wire wrap', weight: '350 grams', dimensions: '7 inches height', origin: 'Moradabad, India' },
  'Women Bracelets': { material: 'Natural Rose Quartz & Amethyst Crystals', weight: '12 grams', dimensions: 'Elastic stretchable (fits 6-7 inch wrists)', origin: 'Jaipur, India' },
  'Evil Eye': { material: 'Premium Turkish Glass & Sterling Silver', weight: '8 grams', dimensions: '7.5 inches length', origin: 'Istanbul, Turkey' },
  'Gifting': { material: 'Heavy-gauge Solid Brass & organic incense blend', weight: '450 grams package', dimensions: 'Gift boxed', origin: 'Moradabad, India' }
};

interface VidyaReviewsSectionProps {
  reviews: any[];
  editable: boolean;
  handleWriteReviewClick: () => void;
  handleDeleteReview?: (id: string) => void;
  isVidyaRudraksh?: boolean;
}

const VidyaReviewsSection: React.FC<VidyaReviewsSectionProps> = ({
  reviews,
  editable,
  handleWriteReviewClick,
  handleDeleteReview,
  isVidyaRudraksh = false
}) => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  if (false) console.log(handleWriteReviewClick);
  const [activeDetailReview, setActiveDetailReview] = React.useState<any | null>(null);
  const [activeModalImageIndex, setActiveModalImageIndex] = React.useState<number>(0);
  const [activePage, setActivePage] = React.useState<number>(1);
  const [helpfulCounts, setHelpfulCounts] = React.useState<Record<string, number>>({});
  const [votedHelpful, setVotedHelpful] = React.useState<Record<string, boolean>>({});

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let direction = 1;
    const interval = setInterval(() => {
      if (el.matches(':hover')) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      let nextScroll = el.scrollLeft + direction;

      if (nextScroll >= maxScroll) {
        direction = -1;
        nextScroll = maxScroll;
      } else if (nextScroll <= 0) {
        direction = 1;
        nextScroll = 0;
      }

      el.scrollLeft = nextScroll;
    }, 35);

    return () => clearInterval(interval);
  }, []);

  const customerPhotos = [
    "/review_user_rud1.png",
    "/review_user_rud2.png",
    "/review_user_rud3.png",
    "/review_user_rud4.png",
    "/review_user_rud5.png",
    "/review_user_rud6.png",
    "/review_user_rud7.png",
    "/review_user_rud8.png",
    "/review_user_rud9.png",
    "/review_user_rud10.png"
  ];

  const mockReviews = [
    {
      id: 'vr1',
      author: 'Eric',
      rating: 5,
      date: '1 week ago',
      title: 'Super cute, loving it',
      content: 'The Sandipani Ashram Vidya Rudraksh is really cute. Perfect size too. I also love the positive vibration it brings to the study room. My son’s concentration has really improved since he started wearing it daily.',
      verified: true,
      defaultHelpful: 14,
      imageUrls: [
        "/review_user_rud1.png",
        "/review_user_rud2.png"
      ]
    },
    {
      id: 'vr2',
      author: 'Savanna Swiger',
      rating: 5,
      date: '1 week ago',
      title: 'Perfect for the study loving toddler/child',
      content: 'I bought this cutie for my 8 year old nephew who loves the spiritual energization feel. This rudraksh pendant is adorable and I wanted to see if he’d take to a more positive study habit. Well, mark one in the win column because he was STOKED! This adorable bead now sits in his study table, bringing pure focus.',
      verified: true,
      defaultHelpful: 25,
      imageUrls: [
        "/review_user_rud3.png"
      ]
    },
    {
      id: 'vr3',
      author: 'Andrea Love',
      rating: 5,
      date: '2 weeks ago',
      title: 'Focus & Wisdom blessing',
      content: 'He’s perfect! Great quality and super energized. He’s a great addition to my child’s study altar. Very peaceful vibration, helpful for recall and positive concentration.',
      verified: true,
      defaultHelpful: 9,
      imageUrls: [
        "/review_user_rud4.png"
      ]
    },
    {
      id: 'vr4',
      author: 'Priyanshu Verma',
      rating: 5,
      date: '3 weeks ago',
      title: 'Excellent results in exams',
      content: 'My son wore this during his board exams. His anxiety level was much lower, and his recall capacity was amazing. Truly an authentic holy blessing from Ujjain Sandipani Ashram.',
      verified: true,
      defaultHelpful: 20,
      imageUrls: [
        "/review_user_rud5.png"
      ]
    },
    {
      id: 'vr5',
      author: 'Meera Nair',
      rating: 5,
      date: '1 month ago',
      title: 'Very peaceful vibration',
      content: 'Highly recommend it for students who find it difficult to sit in one place for long. It helps calm the mind and builds a strong attention span.',
      verified: true,
      defaultHelpful: 6,
      imageUrls: [
        "/review_user_rud2.png",
        "/review_user_rud4.png"
      ]
    },
    {
      id: 'vr6',
      author: 'Rahul Sharma',
      rating: 4,
      date: '1 month ago',
      title: 'Great quality product',
      content: 'The quality of the rudraksh bead and the thread is excellent. It came with the Sandipani Ashram prasad and certification card. Highly satisfied with the purchase.',
      verified: true,
      defaultHelpful: 11,
      imageUrls: [
        "/review_user_rud6.png",
        "/review_user_rud9.png"
      ]
    },
    {
      id: 'vr7',
      author: 'Rajesh Patel',
      rating: 5,
      date: '1 month ago',
      title: 'A blessed spiritual guide',
      content: 'We visited Ujjain earlier but couldn\'t get the abhimantrit rudraksh then. Very glad to receive this directly from the Sandipani Ashram Pooja. Authentic and powerful.',
      verified: true,
      defaultHelpful: 4,
      imageUrls: [
        "/review_user_rud7.png",
        "/review_user_rud10.png"
      ]
    },
    {
      id: 'vr8',
      author: 'Sunita Rao',
      rating: 5,
      date: '2 months ago',
      title: 'Divine and peaceful',
      content: 'The concentration levels of my grandchildren have grown. It creates a calm study aura. Fully recommend it to all parents.',
      verified: true,
      defaultHelpful: 9,
      imageUrls: [
        "/review_user_rud8.png"
      ]
    }
  ];

  const combinedReviews = [...reviews, ...mockReviews];
  const itemsPerPage = 3;
  const totalPages = Math.ceil(combinedReviews.length / itemsPerPage);
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedReviews = combinedReviews.slice(startIndex, startIndex + itemsPerPage);

  const handleHelpfulClick = (id: string) => {
    if (votedHelpful[id]) return;
    setHelpfulCounts(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
    setVotedHelpful(prev => ({
      ...prev,
      [id]: true
    }));
  };

  return (
    <div style={{
      textAlign: 'left',
      marginTop: isVidyaRudraksh ? '0px' : '48px',
      borderTop: isVidyaRudraksh ? 'none' : '1px solid var(--border-light)',
      paddingTop: isVidyaRudraksh ? '0px' : '40px'
    }}>
      <h2 className="vidya-reviews-title">
        {isHindi ? "रेटिंग्स और समीक्षाएं" : "Ratings and reviews"}
      </h2>

      <div className="vidya-reviews-grid">
        <style>{`
          .vidya-reviews-title {
            font-size: 2.2rem;
            font-weight: 900;
            color: #111827;
            text-align: center;
            font-family: var(--font-sans);
            margin-bottom: 32px;
            letter-spacing: -0.5px;
          }
          .vidya-reviews-grid {
            display: grid;
            grid-template-columns: 340px 1fr;
            gap: 48px;
            text-align: left;
            font-family: var(--font-sans);
          }
          .ratings-summary-col {
            display: flex;
            flex-direction: column;
            gap: 20px;
            min-width: 0;
          }
          .histogram-row {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 0.88rem;
            font-weight: 700;
            color: #111827;
          }
          .histogram-bar-bg {
            flex-grow: 1;
            height: 6px;
            background-color: #f3f4f6;
            border-radius: 3px;
            overflow: hidden;
            position: relative;
          }
          .histogram-bar-fill {
            height: 100%;
            background-color: #111827;
            border-radius: 3px;
          }
          .recommendation-col {
            display: flex;
            flex-direction: column;
            gap: 24px;
            min-width: 0;
          }
          .photos-scroll-container {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding-bottom: 8px;
            scrollbar-width: none;
            width: 100%;
            max-width: 100%;
          }
          .photos-scroll-container::-webkit-scrollbar {
            display: none;
          }
          .customer-photo-card {
            width: 100px;
            height: 100px;
            border-radius: 12px;
            object-fit: cover;
            flex-shrink: 0;
            box-shadow: var(--shadow-sm);
            border: 1px solid rgba(0, 0, 0, 0.05);
            cursor: pointer;
            transition: transform 0.2s;
            overflow: hidden;
          }
          .customer-photo-card:hover {
            transform: scale(1.04);
          }
          .review-action-buttons {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 32px;
            margin-bottom: 24px;
            flex-wrap: wrap;
            gap: 16px;
          }
          .review-action-btn-group {
            display: flex;
            gap: 12px;
          }
          .outline-action-btn {
            background-color: #ffffff;
            border: 1.5px solid #111827;
            color: #111827;
            padding: 8px 16px;
            border-radius: 9999px;
            font-weight: 800;
            font-size: 0.88rem;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
          }
          .outline-action-btn:hover {
            background-color: #f9fafb;
            transform: translateY(-1px);
          }
          .reviews-count-text {
            font-size: 0.88rem;
            color: #6b7280;
            font-weight: 700;
          }
          .reviews-sort-trigger {
            font-size: 0.88rem;
            font-weight: 800;
            color: #111827;
            background: none;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }
          .vidya-review-card {
            padding: 24px 20px;
            border-bottom: 1.5px solid #f3f4f6;
            display: flex;
            flex-direction: column;
            gap: 12px;
            border-radius: 12px;
            transition: background-color 0.2s;
          }
          .vidya-review-card:hover {
            background-color: #fafafa;
          }
          .review-header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .review-author-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
            text-align: left;
          }
          .review-author-name {
            font-weight: 800;
            font-size: 0.95rem;
            color: #111827;
          }
          .verified-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 0.78rem;
            color: #4b5563;
            font-weight: 700;
          }
          .verified-badge svg {
            color: #111827;
          }
          .review-date {
            font-size: 0.88rem;
            color: #6b7280;
            font-weight: 700;
          }
          .review-stars-row {
            display: flex;
            align-items: center;
            gap: 2px;
            color: #fbbf24;
          }
          .review-title {
            font-weight: 800;
            font-size: 1.05rem;
            color: #111827;
            margin: 0;
            text-align: left;
          }
          .review-body {
            font-size: 0.92rem;
            color: #4b5563;
            line-height: 1.6;
            margin: 0;
            text-align: left;
          }
          .helpful-row {
            display: flex;
            align-items: center;
            gap: 16px;
            font-size: 0.8rem;
            color: #6b7280;
            font-weight: 700;
            margin-top: 4px;
          }
          .helpful-btn {
            background: none;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: #6b7280;
            transition: color 0.2s;
          }
          .helpful-btn:hover {
            color: #111827;
          }
          .vidya-pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            margin-top: 32px;
          }
          .pagination-number {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.88rem;
            font-weight: 800;
            color: #4b5563;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.2s;
          }
          .pagination-number:hover {
            background-color: #f3f4f6;
            color: #111827;
          }
          .pagination-number.active {
            background-color: #111827;
            color: #ffffff;
          }

          /* Modal Styling */
          .review-detail-modal-body {
            position: relative;
            background-color: #ffffff;
            width: 100%;
            max-width: 820px;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
            display: grid;
            grid-template-columns: 1.1fr 1fr;
            height: 480px;
            animation: modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes modalFadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .modal-images-pane {
            position: relative;
            background-color: #f3f4f6;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
            overflow: hidden;
          }
          .modal-images-pane.placeholder {
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          }
          .spiritual-placeholder-content {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .modal-carousel-viewport {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .modal-active-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .carousel-nav-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.85);
            color: #111827;
            border: none;
            font-size: 1.5rem;
            font-weight: 800;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            transition: all 0.2s;
            z-index: 5;
          }
          .carousel-nav-btn:hover {
            background-color: #ffffff;
            transform: translateY(-50%) scale(1.08);
          }
          .carousel-nav-btn.prev {
            left: 16px;
          }
          .carousel-nav-btn.next {
            right: 16px;
          }
          .modal-carousel-dots {
            position: absolute;
            bottom: 16px;
            display: flex;
            gap: 6px;
            z-index: 5;
          }
          .carousel-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            transition: background-color 0.2s;
          }
          .carousel-dot.active {
            background-color: #ffffff;
            transform: scale(1.2);
          }
          .modal-text-pane {
            padding: 32px;
            display: flex;
            flex-direction: column;
            height: 100%;
            overflow-y: auto;
            text-align: left;
          }
          
          @media (max-width: 768px) {
            .vidya-reviews-title {
              font-size: 1.6rem;
              margin-bottom: 24px;
            }
            .vidya-reviews-grid {
              grid-template-columns: 1fr;
              gap: 24px;
            }
            .customer-photo-card {
              width: 90px;
              height: 90px;
            }
            .review-detail-modal-body {
              grid-template-columns: 1fr;
              grid-template-rows: 240px 1fr;
              height: auto;
              max-height: 90vh;
              border-radius: 16px;
            }
            .modal-text-pane {
              padding: 20px;
            }
            .carousel-nav-btn {
              width: 32px;
              height: 32px;
              font-size: 1.2rem;
            }
          }
          @media (max-width: 480px) {
            .vidya-reviews-title {
              font-size: 1.4rem;
              margin-bottom: 20px;
            }
            .ratings-summary-col {
              gap: 12px;
            }
            .ratings-score-value {
              font-size: 2.2rem !important;
            }
            .histogram-row {
              gap: 8px;
              font-size: 0.8rem;
            }
            .histogram-bar-bg {
              height: 5px;
            }
            .review-action-buttons {
              flex-direction: column;
              align-items: flex-start !important;
              gap: 12px;
            }
            .review-action-btn-group {
              width: 100%;
              justify-content: space-between;
              gap: 8px;
            }
            .outline-action-btn {
              flex: 1;
              justify-content: center;
              font-size: 0.8rem;
              padding: 6px 10px;
            }
          }
        `}</style>

        {/* Left Column (Histogram & Score) */}
        <div className="ratings-summary-col">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span className="ratings-score-value" style={{ fontSize: '3rem', fontWeight: 900, color: '#111827', lineHeight: 1 }}>4.8</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '2px', color: '#111827' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={16} fill="#111827" color="#111827" />
                ))}
              </div>
              <span style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 700 }}>{isHindi ? "(145 समीक्षाएं)" : "(145 reviews)"}</span>
            </div>
          </div>

          {/* Histogram Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            <div className="histogram-row">
              <span style={{ minWidth: '32px' }}>5 ★</span>
              <div className="histogram-bar-bg">
                <div className="histogram-bar-fill" style={{ width: '86%' }}></div>
              </div>
              <span style={{ minWidth: '24px', textAlign: 'right', color: '#9ca3af' }}>134</span>
            </div>
            <div className="histogram-row">
              <span style={{ minWidth: '32px' }}>4 ★</span>
              <div className="histogram-bar-bg">
                <div className="histogram-bar-fill" style={{ width: '12%' }}></div>
              </div>
              <span style={{ minWidth: '24px', textAlign: 'right', color: '#9ca3af' }}>18</span>
            </div>
            <div className="histogram-row">
              <span style={{ minWidth: '32px' }}>3 ★</span>
              <div className="histogram-bar-bg">
                <div className="histogram-bar-fill" style={{ width: '0%' }}></div>
              </div>
              <span style={{ minWidth: '24px', textAlign: 'right', color: '#9ca3af' }}>0</span>
            </div>
            <div className="histogram-row">
              <span style={{ minWidth: '32px' }}>2 ★</span>
              <div className="histogram-bar-bg">
                <div className="histogram-bar-fill" style={{ width: '2.5%' }}></div>
              </div>
              <span style={{ minWidth: '24px', textAlign: 'right', color: '#9ca3af' }}>1</span>
            </div>
            <div className="histogram-row">
              <span style={{ minWidth: '32px' }}>1 ★</span>
              <div className="histogram-bar-bg">
                <div className="histogram-bar-fill" style={{ width: '3%' }}></div>
              </div>
              <span style={{ minWidth: '24px', textAlign: 'right', color: '#9ca3af' }}>2</span>
            </div>
          </div>
        </div>

        {/* Right Column (Photos & Recommend) */}
        <div className="recommendation-col">
          <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#111827' }}>
            98% <span style={{ color: '#4b5563', fontWeight: 500 }}>{isHindi ? "मित्रों को इस उत्पाद की अनुशंसा करेंगे" : "Would recommend this product to a friend"}</span>
          </span>

          {/* Customer Scrollable Photos */}
          <div ref={scrollRef} className="photos-scroll-container">
            {customerPhotos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt="Devotee"
                className="customer-photo-card"
                onClick={() => {
                  const reviewIdMap = ['vr1', 'vr5', 'vr2', 'vr3', 'vr4', 'vr6', 'vr7', 'vr8', 'vr6', 'vr7'];
                  const matchedRev = combinedReviews.find(r => r.id === reviewIdMap[i]);
                  if (matchedRev) {
                    setActiveDetailReview(matchedRev);
                    setActiveModalImageIndex(0);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>



      {/* Review List items */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {paginatedReviews.map((rev) => {
          const currentHelpful = (rev.defaultHelpful || 0) + (helpfulCounts[rev.id] || 0);
          return (
            <div 
              key={rev.id} 
              className="vidya-review-card"
              onClick={() => {
                setActiveDetailReview(rev);
                setActiveModalImageIndex(0);
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="review-header-row">
                <div className="review-author-info">
                  <span className="review-author-name">{rev.author}</span>
                  {rev.verified !== false && (
                    <span className="verified-badge">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      {isHindi ? "सत्यापित खरीदार" : "Verified buyer"}
                    </span>
                  )}
                </div>
                <span className="review-date">{rev.date}</span>
              </div>

              <div className="review-stars-row" style={{ display: 'flex', margin: '4px 0 8px' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={14} fill={s <= rev.rating ? "#fbbf24" : "none"} color="#fbbf24" />
                ))}
              </div>

              <h4 className="review-title">{rev.title || 'Excellent spiritual guidance'}</h4>
              <p className="review-body">"{rev.content}"</p>

              {/* Review Media: Images if any */}
              {rev.imageUrls && rev.imageUrls.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {rev.imageUrls.map((url: string, i: number) => (
                    <div
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDetailReview(rev);
                        setActiveModalImageIndex(i);
                      }}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1.5px solid #e5e7eb',
                        cursor: 'pointer'
                      }}
                    >
                      <img src={url} alt="devotee upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}

              <div className="helpful-row">
                <span>{isHindi ? "क्या यह मददगार था?" : "Was this helpful?"}</span>
                <button
                  className="helpful-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHelpfulClick(rev.id);
                  }}
                  style={{ fontWeight: votedHelpful[rev.id] ? 800 : 500 }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'translateY(-1px)' }}>
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                  {currentHelpful}
                </button>
                <button 
                  className="helpful-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(isHindi ? "आपकी प्रतिक्रिया के लिए धन्यवाद।" : "Thank you for your feedback.");
                  }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'translateY(1px)' }}>
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm12-5v9a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" />
                  </svg>
                </button>

                {editable && handleDeleteReview && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteReview(rev.id);
                    }}
                    style={{
                      marginLeft: 'auto',
                      backgroundColor: '#fee2e2',
                      color: '#ef4444',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {isHindi ? "हटाएं (एडमिन)" : "Delete (Admin)"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="vidya-pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <span
              key={page}
              className={`pagination-number ${activePage === page ? 'active' : ''}`}
              onClick={() => setActivePage(page)}
            >
              {page}
            </span>
          ))}
          {activePage < totalPages && (
            <span className="pagination-number" onClick={() => setActivePage(prev => prev + 1)}>
              &gt;
            </span>
          )}
        </div>
      )}

      {/* Full Detail Review Modal */}
      {activeDetailReview && (
        <div
          onClick={() => setActiveDetailReview(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="review-detail-modal-body"
          >
            {/* Close button */}
            <button
              onClick={() => setActiveDetailReview(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: '#111827',
                fontSize: '1.5rem',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              ✕
            </button>

            {/* Left side: Images */}
            {activeDetailReview.imageUrls && activeDetailReview.imageUrls.length > 0 ? (
              <div className="modal-images-pane">
                <div className="modal-carousel-viewport">
                  <img
                    src={activeDetailReview.imageUrls[activeModalImageIndex]}
                    alt="Devotee upload enlarged"
                    className="modal-active-image"
                  />
                  {activeDetailReview.imageUrls.length > 1 && (
                    <>
                      <button
                        className="carousel-nav-btn prev"
                        onClick={() => setActiveModalImageIndex(prev => (prev === 0 ? activeDetailReview.imageUrls.length - 1 : prev - 1))}
                      >
                        ‹
                      </button>
                      <button
                        className="carousel-nav-btn next"
                        onClick={() => setActiveModalImageIndex(prev => (prev === activeDetailReview.imageUrls.length - 1 ? 0 : prev + 1))}
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
                {activeDetailReview.imageUrls.length > 1 && (
                  <div className="modal-carousel-dots">
                    {activeDetailReview.imageUrls.map((_: any, idx: number) => (
                      <span
                        key={idx}
                        className={`carousel-dot ${activeModalImageIndex === idx ? 'active' : ''}`}
                        onClick={() => setActiveModalImageIndex(idx)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="modal-images-pane placeholder">
                <div className="spiritual-placeholder-content">
                  <span style={{ fontSize: '3rem' }}>📿</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-forest)', marginTop: '8px' }}>
                    {isHindi ? "सांदीपनी आश्रम का आशीर्वाद" : "Sandipani Ashram Blessing"}
                  </span>
                </div>
              </div>
            )}

            {/* Right side: Review text detail */}
            <div className="modal-text-pane">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#111827', margin: 0 }}>{activeDetailReview.author}</h3>
                  {activeDetailReview.verified !== false && (
                    <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                      ✓ {isHindi ? "सत्यापित खरीदार" : "Verified buyer"}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 700 }}>{activeDetailReview.date}</span>
              </div>

              <div style={{ display: 'flex', gap: '2px', color: '#fbbf24', marginBottom: '16px' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={16} fill={s <= activeDetailReview.rating ? "#fbbf24" : "none"} color="#fbbf24" />
                ))}
              </div>

              <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#111827', marginBottom: '8px', textAlign: 'left' }}>
                {activeDetailReview.title || 'Excellent spiritual guidance'}
              </h4>

              <p style={{ fontSize: '0.95rem', color: '#374151', lineHeight: '1.6', margin: 0, textAlign: 'left', overflowY: 'auto', maxHeight: '180px', paddingRight: '8px' }}>
                "{activeDetailReview.content}"
              </p>

              <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 700 }}>{isHindi ? "क्या यह समीक्षा मददगार थी?" : "Was this helpful?"}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      handleHelpfulClick(activeDetailReview.id);
                    }}
                    style={{
                      backgroundColor: votedHelpful[activeDetailReview.id] ? '#dcfce7' : '#ffffff',
                      border: `1px solid ${votedHelpful[activeDetailReview.id] ? '#15803d' : '#d1d5db'}`,
                      borderRadius: '9999px',
                      padding: '6px 16px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: votedHelpful[activeDetailReview.id] ? '#15803d' : '#111827',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: 'translateY(-1px)' }}>
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                    {isHindi ? "हाँ" : "Yes"} ({ (activeDetailReview.defaultHelpful || 0) + (helpfulCounts[activeDetailReview.id] || 0) })
                  </button>
                  <button
                    onClick={() => alert("Thank you for your feedback.")}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '9999px',
                      padding: '6px 16px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: '#111827',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: 'translateY(1px)' }}>
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm12-5v9a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" />
                    </svg>
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VidyaEmotionalHookSection: React.FC = () => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';

  return (
    <section className="vidya-emotional-section" style={{
      padding: '36px 0',
      backgroundColor: '#fffcf6',
      borderTop: '1px solid #fce8cc',
      borderBottom: '1px solid #fce8cc',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        .vidya-emotional-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .vidya-emotional-grid {
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: 36px;
          align-items: center;
        }
        .emotional-left-col {
          position: relative;
        }
        .emotional-right-col {
          text-align: left;
        }
        .dream-image-wrapper {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 12px 24px rgba(249, 115, 22, 0.08);
          border: 3px solid #ffffff;
          aspect-ratio: 1 / 1;
          width: 100%;
        }
        .dream-image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .dream-image-wrapper:hover img {
          transform: scale(1.03);
        }
        .floating-blessing-tag {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1.2px solid #fdba74;
          border-radius: 10px;
          padding: 6px 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.06);
          animation: tagFloat 4s infinite ease-in-out;
        }
        @keyframes tagFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .dream-header-accent {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.82rem;
          font-weight: 800;
          color: #ea580c;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }
        .dream-title-main {
          font-size: 1.7rem;
          font-weight: 900;
          color: #1f2937;
          line-height: 1.25;
          margin: 0 0 16px;
          letter-spacing: -0.3px;
        }
        .dream-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .dream-card-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #ffffff;
          border: 1.5px solid #f3f4f6;
          border-radius: 12px;
          padding: 10px 12px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .dream-card-item:hover {
          transform: translateX(3px) scale(1.01);
          border-color: #fdba74;
          background: linear-gradient(90deg, #ffffff 0%, #fffbeb 100%);
          box-shadow: 0 8px 16px rgba(249, 115, 22, 0.04);
        }
        .dream-card-item.span-2 {
          grid-column: span 2;
        }
        .dream-card-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background-color: #fff7ed;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.15rem;
          flex-shrink: 0;
          transition: transform 0.3s;
        }
        .dream-card-item:hover .dream-card-icon {
          transform: rotate(6deg) scale(1.08);
        }
        .dream-card-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: left;
        }
        .dream-card-title {
          font-size: 0.88rem;
          font-weight: 800;
          color: #1f2937;
        }
        .dream-card-desc {
          font-size: 0.74rem;
          color: #6b7280;
          line-height: 1.3;
        }
        .lekin-pivot-banner-row {
          background: linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%);
          border: 1.5px solid #fecdd3;
          border-radius: 12px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          text-align: left;
          grid-column: span 2;
          margin-top: 4px;
        }
        .lekin-heading {
          font-size: 1.1rem;
          font-weight: 900;
          color: #991b1b;
          margin: 0;
          white-space: nowrap;
        }
        .lekin-desc {
          font-size: 0.82rem;
          color: #7f1d1d;
          line-height: 1.4;
          margin: 0;
          font-weight: 600;
        }
        
        @media (max-width: 991px) {
          .vidya-emotional-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .dream-image-wrapper {
            width: 100%;
            max-width: 340px;
            margin: 0 auto;
            aspect-ratio: 1 / 1;
          }
        }
        @media (max-width: 480px) {
          .vidya-emotional-section {
            padding: 24px 0;
          }
          .dream-title-main {
            font-size: 1.35rem;
            margin-bottom: 12px;
          }
          .dream-cards-grid {
            grid-template-columns: 1fr;
          }
          .dream-card-item.span-2 {
            grid-column: span 1;
          }
          .lekin-pivot-banner-row {
            grid-column: span 1;
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      `}</style>

      <div className="vidya-emotional-container">
        <div className="vidya-emotional-grid">
          {/* Left Column: Related Image with Floating Tag */}
          <div className="emotional-left-col">
            <div className="dream-image-wrapper">
              <img 
                src="/student_study_focus.jpg" 
                alt="Child concentrating on studies happily"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80";
                }}
              />
              <div className="floating-blessing-tag">
                <span style={{ fontSize: '1.1rem' }}>🕉️</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
                    {isHindi ? "अभिमंत्रित वातावरण" : "Blessed Environment"}
                  </span>
                  <span style={{ fontSize: '0.66rem', color: '#ea580c', fontWeight: 700 }}>
                    {isHindi ? "सांदीपनी आश्रम" : "Sandipani Ashram"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Title and interactive dream cards */}
          <div className="emotional-right-col">
            <div className="dream-header-accent">
              {isHindi ? "❤️ माता-पिता के सपने" : "❤️ Family Dreams"}
            </div>
            <h2 className="dream-title-main">
              {isHindi ? "हर माता-पिता का सपना होता है..." : "Har Maa-Baap Ka Sapna Hota Hai..."}
            </h2>
            
            <div className="dream-cards-grid">
              {/* Card 1 */}
              <div className="dream-card-item">
                <div className="dream-card-icon">📚</div>
                <div className="dream-card-info">
                  <span className="dream-card-title">
                    {isHindi ? "पढ़ाई में अच्छा करे" : "Padhai Mein Accha Kare"}
                  </span>
                  <span className="dream-card-desc">
                    {isHindi 
                      ? "विषय आसानी से समझ में आएं और पढ़ाई में स्वाभाविक रुचि विकसित हो।" 
                      : "Subject parameters easily understand ho aur padhai mein natural interest develop ho."}
                  </span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="dream-card-item">
                <div className="dream-card-icon">🎯</div>
                <div className="dream-card-info">
                  <span className="dream-card-title">
                    {isHindi ? "फोकस रहे" : "Focus Rahe"}
                  </span>
                  <span className="dream-card-desc">
                    {isHindi 
                      ? "बिना किसी भटकाव के एकाग्रचित्त होकर पढ़ने की लगन बनी रहे।" 
                      : "Bina kisi distraction ke concentrated study karne ki lagan bani rahe."}
                  </span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="dream-card-item">
                <div className="dream-card-icon">🧠</div>
                <div className="dream-card-info">
                  <span className="dream-card-title">
                    {isHindi ? "जल्दी याद रखे" : "Jaldi Yaad Rakhe"}
                  </span>
                  <span className="dream-card-desc">
                    {isHindi 
                      ? "पाठ्यक्रम जल्दी दिमाग में बैठ जाए और रिवीज़न का समय बचे।" 
                      : "Syllabus jaldi brain retention mein fit ho jaye aur revision time save ho."}
                  </span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="dream-card-item">
                <div className="dream-card-icon">🏆</div>
                <div className="dream-card-info">
                  <span className="dream-card-title">
                    {isHindi ? "अच्छे मार्क्स लाए" : "Achhe Marks Laye"}
                  </span>
                  <span className="dream-card-desc">
                    {isHindi 
                      ? "वैदिक एकाग्रता आभामंडल परीक्षाओं के तनाव को कम करे ताकि टॉप स्कोर प्राप्त हो।" 
                      : "Vedic concentration aura exams time anxiety reduce kare taaki top score achieve ho."}
                  </span>
                </div>
              </div>

              {/* Card 5 - Centered/Spanned */}
              <div className="dream-card-item span-2">
                <div className="dream-card-icon">😊</div>
                <div className="dream-card-info">
                  <span className="dream-card-title">
                    {isHindi ? "आत्मविश्वास से भरा रहे" : "Atmavishwas Se Bhara Rahe"}
                  </span>
                  <span className="dream-card-desc">
                    {isHindi 
                      ? "नकारात्मक विचारों और असफलता के तनाव से मुक्त रहकर शांत दिमाग और दृढ़ आत्मविश्वास विकसित हो।" 
                      : "Negative feelings aur failure stress se calm brain and high self-belief develop ho."}
                  </span>
                </div>
              </div>

              {/* Lekin Pivot Banner Row */}
              <div className="lekin-pivot-banner-row">
                <h4 className="lekin-heading">
                  {isHindi ? "⚠️ लेकिन..." : "⚠️ Lekin..."}
                </h4>
                <p className="lekin-desc">
                  {isHindi 
                    ? "हर बच्चे का सफर आसान नहीं होता। स्क्रीन का भटकाव और पढ़ाई का भारी दबाव उनके सपनों पर मानसिक तनाव बन चुका है।" 
                    : "Har bachche ka safar aasaan nahi hota. Screens distraction and high pressure study life unke sapno par heavy mental stress ban chuke hain."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface VidyaParentPainSectionProps {
  onBuyNow: () => void;
}

const VidyaParentPainSection: React.FC<VidyaParentPainSectionProps> = ({ onBuyNow }) => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  const painPoints = isHindi ? [
    "होमवर्क करने से बचता है",
    "शिक्षक शिकायत करते हैं कि ध्यान नहीं देता",
    "हर समय मोबाइल ही चलाता रहता है",
    "परीक्षा के समय घबरा जाता है",
    "बार-बार याद करने पर भी भूल जाता है",
    "मार्क्स में सुधार नहीं हो रहा है",
    "पढ़ाई में कोई रुचि नहीं है",
    "आत्मविश्वास की कमी है"
  ] : [
    "Homework se bachta hai",
    "Teacher bolte hain dhyan nahi deta",
    "Mobile hi chalata rehta hai",
    "Exam mein ghabra jata hai",
    "Baar baar yaad karke bhool jata hai",
    "Marks improve nahi ho rahe",
    "Padhai mein interest nahi",
    "Confidence kam"
  ];

  const [selectedPains, setSelectedPains] = React.useState<Record<number, boolean>>({});

  const togglePain = (idx: number) => {
    setSelectedPains(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const selectedCount = Object.values(selectedPains).filter(Boolean).length;

  return (
    <section className="vidya-pain-section">
      <style>{`
        .vidya-pain-section {
          padding: 56px 0;
          background-color: #fdfaf7;
          border-bottom: 1.5px dashed #fbd5b5;
          font-family: var(--font-sans);
          text-align: center;
        }
        @media (max-width: 768px) {
          .vidya-pain-section {
            padding: 36px 0;
          }
        }
        .vidya-pain-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .vidya-pain-header {
          margin-bottom: 32px;
        }
        .vidya-pain-tag {
          display: inline-block;
          font-size: 0.78rem;
          font-weight: 800;
          color: #ef4444;
          background: #ffe4e6;
          padding: 6px 12px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .vidya-pain-title {
          font-size: 1.9rem;
          font-weight: 900;
          color: #2d140e;
          line-height: 1.3;
          margin: 0 auto;
          max-width: 700px;
        }
        .vidya-pain-subtitle {
          font-size: 0.88rem;
          color: #6b7280;
          margin-top: 10px;
        }
        .vidya-pain-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 36px;
        }
        .vidya-pain-card {
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 20px;
          padding: 20px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
          position: relative;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .vidya-pain-card.active {
          border-color: #ef4444;
          background: #fff5f5;
          transform: scale(1.03);
          box-shadow: 0 10px 20px rgba(239, 68, 68, 0.08);
          animation: card-shake 0.3s ease;
        }
        .vidya-pain-card:not(.active):hover {
          border-color: #fca5a5;
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.02);
        }
        @keyframes card-shake {
          0%, 100% { transform: scale(1.03) rotate(0deg); }
          25% { transform: scale(1.03) rotate(-1.5deg); }
          75% { transform: scale(1.03) rotate(1.5deg); }
        }
        .vidya-pain-checkbox {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 1.5px solid #d1d5db;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          color: transparent;
          transition: all 0.2s;
        }
        .vidya-pain-card.active .vidya-pain-checkbox {
          border-color: #ef4444;
          background: #ef4444;
          color: #ffffff;
        }
        .vidya-pain-text {
          font-size: 0.95rem;
          font-weight: 800;
          color: #374151;
          line-height: 1.35;
        }
        .vidya-pain-card.active .vidya-pain-text {
          color: #991b1b;
        }
        
        .vidya-pain-callout-wrap {
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .vidya-pain-callout-wrap.visible {
          max-height: 260px;
          opacity: 1;
        }
        .vidya-pain-callout {
          background: linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%);
          border: 1.5px solid #fecdd3;
          border-radius: 20px;
          padding: 20px 24px;
          display: inline-flex;
          align-items: flex-start;
          gap: 16px;
          margin-top: 10px;
          box-shadow: 0 10px 25px rgba(220, 38, 38, 0.06);
          max-width: 800px;
          text-align: left;
        }
        .vidya-pain-callout-icon {
          font-size: 1.5rem;
          animation: finger-bounce 1s infinite ease-in-out;
          margin-top: 2px;
        }
        @keyframes finger-bounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(6px); }
        }
        
        .vidya-pain-callout-content {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
        }
        .vidya-pain-callout-text {
          font-size: 0.95rem;
          font-weight: 800;
          color: #991b1b;
          line-height: 1.4;
        }
        .vidya-pain-cta-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          background: #ffffff;
          border: 1px solid rgba(239, 68, 68, 0.15);
          padding: 10px 16px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }
        .vidya-pain-cta-text {
          font-size: 0.88rem;
          font-weight: 700;
          color: #374151;
          line-height: 1.4;
        }
        .vidya-pain-buy-btn {
          background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
          color: #ffffff;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 900;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2);
          transition: all 0.2s;
        }
        .vidya-pain-buy-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(234, 88, 12, 0.3);
          background: linear-gradient(135deg, #dd5209 0%, #ea580c 100%);
        }
        
        @media (max-width: 991px) {
          .vidya-pain-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .vidya-pain-title {
            font-size: 1.5rem;
          }
        }
        @media (max-width: 768px) {
          .vidya-pain-callout {
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 16px;
          }
          .vidya-pain-cta-box {
            flex-direction: column;
            gap: 12px;
            text-align: center;
            padding: 12px;
            width: 100%;
          }
          .vidya-pain-buy-btn {
            width: 100%;
            justify-content: center;
          }
          .vidya-pain-callout-icon {
            display: none;
          }
        }
        @media (max-width: 480px) {
          .vidya-pain-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .vidya-pain-card {
            padding: 14px 10px;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            text-align: center;
          }
          .vidya-pain-text {
            font-size: 0.8rem;
          }
          .vidya-pain-checkbox {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
          }
          .vidya-pain-callout {
            padding: 14px;
            gap: 6px;
          }
          .vidya-pain-callout-text {
            text-align: center;
            font-size: 0.9rem;
          }
        }
      `}</style>
      <div className="vidya-pain-container">
        <div className="vidya-pain-header">
          <span className="vidya-pain-tag">{isHindi ? "स्व-मूल्यांकन प्रश्नोत्तरी" : "Self-Assessment Quiz"}</span>
          <h2 className="vidya-pain-title">
            {isHindi ? "क्या आप भी इनमें से किसी परेशानी का सामना कर रहे हैं?" : "Kya Aap Bhi Inmein Se Kisi Pareshani Ka Samna Kar Rahe Hain?"}
          </h2>
          <p className="vidya-pain-subtitle">{isHindi ? "अपने बच्चे में दिखने वाले लक्षणों पर टैप करें (जो लागू हों उन्हें चुनें):" : "Apne bachche mein dikhne wale lakshano par tap karein (Select all that apply):"}</p>
        </div>
        <div className="vidya-pain-grid">
          {painPoints.map((point, index) => {
            const isActive = !!selectedPains[index];
            return (
              <div
                className={`vidya-pain-card ${isActive ? 'active' : ''}`}
                key={index}
                onClick={() => togglePain(index)}
              >
                <div className="vidya-pain-checkbox">✓</div>
                <span className="vidya-pain-text">{point}</span>
              </div>
            );
          })}
        </div>
        
        <div className={`vidya-pain-callout-wrap ${selectedCount > 0 ? 'visible' : ''}`}>
          <div className="vidya-pain-callout">
            <span className="vidya-pain-callout-icon">👉</span>
            <div className="vidya-pain-callout-content">
              <div className="vidya-pain-callout-text">
                {isHindi ? <>यदि आपने इनमें से <strong>एक भी</strong> परेशानी चुनी है... तो नीचे दी गई जानकारी को ध्यान से पढ़ें।</> : <>Agar aapne inmein se <strong>ek bhi</strong> pareshani select ki hai... to niche di gayi jankari ko dhyan se padhiye.</>}
              </div>
              <div className="vidya-pain-cta-box">
                <span className="vidya-pain-cta-text">
                  {isHindi ? <>अपने बच्चे की इन परेशानियों को दूर करने के लिए <strong>विद्या रुद्राक्ष</strong> आज ही ऑर्डर करें!</> : <>Apne bachche ki in pareshaniyon ko door karne ke liye <strong>Vidya Rudraksh</strong> aaj hi order karein!</>}
                </span>
                <button className="vidya-pain-buy-btn" onClick={onBuyNow}>
                  <span>{isHindi ? "अभी खरीदें (₹1)" : "Buy Now (₹1)"}</span>
                  <ShoppingBag size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const VidyaEmotionalStorySection: React.FC = () => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  const messages = isHindi ? [
    { sender: "माता", text: "मैंने स्कूल बदला...", time: "8:01 PM", color: "#fef3c7", textColor: "#92400e" },
    { sender: "पिता", text: "मैंने ट्यूशन लगवाई...", time: "8:02 PM", color: "#e0f2fe", textColor: "#075985" },
    { sender: "माता", text: "मैंने कोचिंग भी करवाई...", time: "8:03 PM", color: "#fef3c7", textColor: "#92400e" },
    { sender: "पिता", text: "लेकिन... फिर भी पढ़ाई में मन नहीं लगता! 😔", time: "8:04 PM", color: "#fee2e2", textColor: "#991b1b", isCritical: true }
  ] : [
    { sender: "Mother", text: "Maine School Badla...", time: "8:01 PM", color: "#fef3c7", textColor: "#92400e" },
    { sender: "Father", text: "Maine Tuition Lagwayi...", time: "8:02 PM", color: "#e0f2fe", textColor: "#075985" },
    { sender: "Mother", text: "Maine Coaching Bhi Karwayi...", time: "8:03 PM", color: "#fef3c7", textColor: "#92400e" },
    { sender: "Father", text: "Lekin... Fir Bhi Padhai Mein Man Nahi Lagta! 😔", time: "8:04 PM", color: "#fee2e2", textColor: "#991b1b", isCritical: true }
  ];

  const [visibleCount, setVisibleCount] = React.useState(1);
  const [isTyping, setIsTyping] = React.useState(false);

  const handleNextMessage = () => {
    if (visibleCount < messages.length && !isTyping) {
      setIsTyping(true);
      setTimeout(() => {
        setVisibleCount(prev => prev + 1);
        setIsTyping(false);
      }, 700);
    }
  };

  return (
    <section className="vidya-chat-section">
      <style>{`
        .vidya-chat-section {
          padding: 56px 0;
          background-color: #f6f9fb;
          border-bottom: 1.5px dashed #bcd3e3;
          font-family: var(--font-sans);
        }
        @media (max-width: 768px) {
          .vidya-chat-section {
            padding: 36px 0;
          }
        }
        .vidya-chat-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .vidya-chat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: start;
        }
        @media (max-width: 991px) {
          .vidya-chat-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
        .vidya-chat-image-col {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 12px 24px rgba(45, 20, 14, 0.08);
          border: 3px solid #ffffff;
          aspect-ratio: 1 / 1;
          width: 100%;
          max-width: 460px;
          margin: 0 auto;
        }
        .vidya-chat-image-col img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .vidya-chat-content-col {
          width: 100%;
          max-width: 520px;
          margin: 0 auto;
        }
        .vidya-chat-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .vidya-chat-tag {
          font-size: 0.78rem;
          font-weight: 800;
          color: #ea580c;
          background: #ffedd5;
          padding: 6px 12px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .vidya-chat-title {
          font-size: 1.6rem;
          font-weight: 900;
          color: #2d140e;
          margin: 12px 0 6px;
        }
        .vidya-chat-desc {
          font-size: 0.84rem;
          color: #6b7280;
          line-height: 1.4;
        }
        .vidya-chat-window {
          background: #efeae2; /* Classic chat bg color */
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08);
          border: 4px solid #ffffff;
        }
        .vidya-chat-topbar {
          background: #075e54;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #ffffff;
        }
        .vidya-chat-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #128c7e;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          font-weight: 800;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .vidya-chat-status-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.2;
        }
        .vidya-chat-group-name {
          font-size: 0.95rem;
          font-weight: 800;
        }
        .vidya-chat-status {
          font-size: 0.74rem;
          opacity: 0.85;
        }
        .vidya-chat-body {
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-height: 240px;
          background-image: radial-gradient(#dfdcd6 1.5px, transparent 1.5px);
          background-size: 16px 16px;
        }
        .vidya-chat-bubble-wrap {
          display: flex;
          flex-direction: column;
          max-width: 85%;
          animation: slide-in-bubble 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .vidya-chat-bubble-wrap.mother {
          align-self: flex-start;
        }
        .vidya-chat-bubble-wrap.father {
          align-self: flex-end;
        }
        @keyframes slide-in-bubble {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .vidya-chat-bubble-sender {
          font-size: 0.7rem;
          font-weight: 800;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        .vidya-chat-bubble-wrap.mother .vidya-chat-bubble-sender { color: #b45309; text-align: left; }
        .vidya-chat-bubble-wrap.father .vidya-chat-bubble-sender { color: #0369a1; text-align: right; }
        
        .vidya-chat-bubble {
          border-radius: 14px;
          padding: 10px 14px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          position: relative;
          text-align: left;
        }
        .vidya-chat-bubble-wrap.mother .vidya-chat-bubble {
          background: #ffffff;
          border-top-left-radius: 2px;
          color: #374151;
        }
        .vidya-chat-bubble-wrap.father .vidya-chat-bubble {
          background: #e1ffc7;
          border-top-right-radius: 2px;
          color: #374151;
        }
        .vidya-chat-bubble-wrap.critical .vidya-chat-bubble {
          background: #fee2e2;
          border: 1.5px solid #fca5a5;
          color: #991b1b;
        }
        .vidya-chat-bubble-text {
          font-size: 0.95rem;
          font-weight: 700;
          line-height: 1.4;
        }
        .vidya-chat-bubble-time {
          font-size: 0.65rem;
          color: #8c8c8c;
          text-align: right;
          margin-top: 4px;
          display: block;
        }
        
        .vidya-chat-typing-bubble {
          background: #ffffff;
          border-radius: 12px;
          border-top-left-radius: 2px;
          padding: 8px 14px;
          align-self: flex-start;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          background: #9ca3af;
          border-radius: 50%;
          animation: dot-jump 1.4s infinite ease-in-out;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dot-jump {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        
        .vidya-chat-action-btn {
          margin: 16px 0;
          background: #128c7e;
          color: #ffffff;
          font-weight: 800;
          font-size: 0.9rem;
          padding: 12px 24px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          box-shadow: 0 6px 16px rgba(18, 140, 126, 0.25);
          transition: all 0.2s;
        }
        .vidya-chat-action-btn:hover {
          background: #075e54;
          transform: translateY(-1px);
        }
        .vidya-chat-pivot-banner {
          background: linear-gradient(135deg, #2d140e 0%, #451a03 100%);
          border-radius: 20px;
          padding: 24px 20px;
          margin-top: 24px;
          box-shadow: 0 10px 24px rgba(45, 20, 14, 0.15);
          color: #ffffff;
          text-align: center;
          animation: slide-in-bubble 0.5s ease forwards;
        }
        .vidya-chat-pivot-text {
          font-size: 0.8rem;
          font-weight: 700;
          color: #fed7aa;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 6px;
          display: block;
        }
        .vidya-chat-pivot-headline {
          font-size: 1.3rem;
          font-weight: 800;
          line-height: 1.35;
          margin: 0;
        }
      `}</style>
      <div className="vidya-chat-container">
        <div className="vidya-chat-header">
          <span className="vidya-chat-tag">{isHindi ? "माता-पिता की कहानी" : "Parent Story"}</span>
          <h2 className="vidya-chat-title">{isHindi ? "हर माता-पिता यही सोचते हैं..." : "Har Parent Yehi Sochta Hai..."}</h2>
          <p className="vidya-chat-desc">{isHindi ? "स्कूल बदलने से लेकर कोचिंग तक, माता-पिता सब करके थक चुके हैं।" : "School badalne se lekar coaching tak, maa-baap sab karke thak chuke hain."}</p>
        </div>

        <div className="vidya-chat-grid">
          {/* Left Column: Stressed Parents Image */}
          <div className="vidya-chat-image-col">
            <img 
              src="/parent_story_stress.jpg" 
              alt="Parents concerned or strict while child is studying" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=800&q=80";
              }}
            />
          </div>

          {/* Right Column: Chat Window and Action Button */}
          <div className="vidya-chat-content-col">
            <div className="vidya-chat-window">
              <div className="vidya-chat-topbar">
                <div className="vidya-chat-avatar">🏡</div>
                <div className="vidya-chat-status-info">
                  <span className="vidya-chat-group-name">{isHindi ? "माता-पिता की चर्चा" : "Parents Discussion"}</span>
                  <span className="vidya-chat-status">
                    {isTyping ? (isHindi ? "टाइपिंग..." : "typing...") : (isHindi ? "ऑनलाइन" : "online")}
                  </span>
                </div>
              </div>
              
              <div className="vidya-chat-body">
                {messages.slice(0, visibleCount).map((msg, idx) => {
                  const isMother = msg.sender === (isHindi ? "माता" : "Mother");
                  return (
                    <div key={idx} className={`vidya-chat-bubble-wrap ${isMother ? 'mother' : 'father'} ${msg.isCritical ? 'critical' : ''}`}>
                      <span className="vidya-chat-bubble-sender">{msg.sender}</span>
                      <div className="vidya-chat-bubble">
                        <span className="vidya-chat-bubble-text">{msg.text}</span>
                        <span className="vidya-chat-bubble-time">{msg.time}</span>
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="vidya-chat-typing-bubble">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              {visibleCount < messages.length ? (
                <button className="vidya-chat-action-btn" onClick={handleNextMessage} disabled={isTyping}>
                  {isTyping ? (isHindi ? "आगे पढ़ रहे हैं..." : "Aage Padh rahe hain...") : (isHindi ? "आगे क्या हुआ? पढ़ें 👉" : "Aage Kya Hua? Padhye 👉")}
                </button>
              ) : (
                <div className="vidya-chat-pivot-banner">
                  <span className="vidya-chat-pivot-text">{isHindi ? "समाधान" : "The Solution"}</span>
                  <h3 className="vidya-chat-pivot-headline">
                    {isHindi ? <>यही सोच <span style={{ color: '#fbbf24', fontWeight: 900 }}>विद्या रुद्राक्ष</span> की प्रेरणा बनी।</> : <>Yahi soch <span style={{ color: '#fbbf24', fontWeight: 900 }}>Vidya Rudraksh</span> ki prerna bani.</>}
                  </h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface VidyaVideoSectionProps {
  videoUrl?: string;
  thumbnailUrl?: string;
}

export const VidyaVideoSection: React.FC<VidyaVideoSectionProps> = ({ videoUrl, thumbnailUrl }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const defaultVideo = videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-spiritual-meditation-session-in-nature-41584-large.mp4";
  const defaultPoster = thumbnailUrl || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80";

  const handlePlayClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.error("Video play failed:", err);
          setIsPlaying(true);
        });
      }
    }
  };

  return (
    <section className="vidya-video-section">
      <style>{`
        .vidya-video-section {
          padding: 60px 0;
          background-color: #fffbeb;
          border-top: 1.5px solid #fce8cc;
          border-bottom: 1.5px solid #fce8cc;
          font-family: var(--font-sans);
          text-align: center;
        }
        @media (max-width: 768px) {
          .vidya-video-section {
            padding: 36px 0;
          }
        }
        .vidya-video-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .vidya-video-tag {
          display: inline-block;
          font-size: 0.78rem;
          font-weight: 800;
          color: #ea580c;
          background: #ffedd5;
          padding: 6px 12px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .vidya-video-title {
          font-size: 1.8rem;
          font-weight: 900;
          color: #2d140e;
          margin-bottom: 28px;
          line-height: 1.35;
        }
        .vidya-video-wrapper {
          position: relative;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(45, 20, 14, 0.2);
          border: 5px solid #ffffff;
          aspect-ratio: 16/9;
          background: #000;
          cursor: pointer;
        }
        .vidya-video-element {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .vidya-video-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(45, 20, 14, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.3s ease;
          z-index: 10;
        }
        .vidya-video-overlay.hidden {
          opacity: 0;
          pointer-events: none;
        }
        
        /* Animated Play Ripple */
        .vidya-ripple-btn {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 12;
        }
        .vidya-play-btn-circle {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: #f97316;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          position: relative;
          z-index: 15;
          box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .vidya-ripple-ring {
          position: absolute;
          border: 2px solid #fdba74;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          animation: ripple-out 2.5s infinite ease-out;
          opacity: 0;
          z-index: 10;
          pointer-events: none;
        }
        .vidya-ripple-ring:nth-child(2) { animation-delay: 0.8s; }
        .vidya-ripple-ring:nth-child(3) { animation-delay: 1.6s; }
        
        .vidya-video-wrapper:hover .vidya-play-btn-circle {
          transform: scale(1.1);
          background: #ea580c;
        }
        
        @keyframes ripple-out {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        
        .vidya-video-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.65);
          color: #ffffff;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 700;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 11;
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .vidya-video-badge-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #ef4444;
          animation: live-blink 1s infinite;
        }
        @keyframes live-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (max-width: 768px) {
          .vidya-video-title {
            font-size: 1.5rem;
          }
          .vidya-play-btn-circle {
            width: 60px;
            height: 60px;
          }
          .vidya-play-btn-circle svg {
            width: 24px;
            height: 24px;
          }
          .vidya-ripple-btn {
            width: 64px;
            height: 64px;
          }
        }
      `}</style>
      <div className="vidya-video-container">
        <span className="vidya-video-tag">Intro Video</span>
        <h2 className="vidya-video-title">Sirf 2 Minute Mein Samajhiye Vidya Rudraksh Kya Hai?</h2>
        
        <div className="vidya-video-wrapper" onClick={handlePlayClick}>
          <video
            ref={videoRef}
            className="vidya-video-element"
            src={defaultVideo}
            poster={defaultPoster}
            playsInline
            controls={isPlaying}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          <div className={`vidya-video-overlay ${isPlaying ? 'hidden' : ''}`}>
            <div className="vidya-ripple-btn">
              <div className="vidya-ripple-ring" />
              <div className="vidya-ripple-ring" />
              <div className="vidya-ripple-ring" />
              <div className="vidya-play-btn-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '4px' }}>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="vidya-video-badge">
            <span className="vidya-video-badge-dot" />
            2:00 Min Intro
          </div>
        </div>
      </div>
    </section>
  );
};

const VidyaSandipaniAshramSection: React.FC = () => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  const steps = isHindi ? [
    { title: "श्री कृष्ण", subtitle: "भगवान श्री कृष्ण", desc: "भगवान श्री कृष्ण ने इसी सांदीपनी आश्रम में गुरु सांदीपनि से 64 विद्याओं और 16 कलाओं का ज्ञान प्राप्त किया था।", icon: "🪈", bg: "#fef3c7" },
    { title: "गुरु सांदीपनि", subtitle: "गुरु शिक्षा स्थली", desc: "महर्षि सांदीपनि ने यहाँ श्री कृष्ण और सुदामा को शिक्षा दी। उनकी तपस्या से यह भूमि अत्यंत पवित्र हुई।", icon: "🧘", bg: "#ffedd5" },
    { title: "आश्रम", subtitle: "ऐतिहासिक आश्रम स्थली", desc: "उज्जैन का ऐतिहासिक सांदीपनी आश्रम जहाँ आज भी शिक्षा-सिद्धि और पवित्रता का वास है।", icon: "🛕", bg: "#ffe4e6" },
    { title: "पंडित", subtitle: "वैदिक पंडित जी", desc: "आश्रम के परंपरा-शुद्ध वैदिक पंडित जी की देख-रेख में पूजन का आयोजन किया जाता है।", icon: "📿", bg: "#dcfce7" },
    { title: "अनुष्ठान", subtitle: "विद्या सिद्धि अनुष्ठान", desc: "पवित्र मंत्रों और शास्त्रोक्त विधि से अनुष्ठान करके प्रत्येक विद्या रुद्राक्ष को अभिमंत्रित किया जाता है।", icon: "🔥", bg: "#dbeafe" }
  ] : [
    { title: "Krishna", subtitle: "Bhagwan Shri Krishna", desc: "Bhagwan Shri Krishna ne isi Sandipani Ashram mein Guru Sandipani se 64 vidyaon aur 16 kalaon ka gyan prapt kiya tha.", icon: "🪈", bg: "#fef3c7" },
    { title: "Guru Sandipani", subtitle: "Guru Shiksha Sthali", desc: "Maharishi Sandipani ne yahan Shri Krishna aur Sudama ko shiksha di. Unki tapasya se bhoomi pavitra hui.", icon: "🧘", bg: "#ffedd5" },
    { title: "Ashram", subtitle: "Aitihasik Ashram Sthali", desc: "Ujjain ka aitihasik Sandipani Ashram jahan aaj bhi shiksha-siddhi aur pavitrata ka vaas hai.", icon: "🛕", bg: "#ffe4e6" },
    { title: "Pandit", subtitle: "Vedic Pandit Ji", desc: "Ashram ke parampara-shuddh vedic pandit ji ki dekh-rekh mein pujan ka aayojan kiya jata hai.", icon: "📿", bg: "#dcfce7" },
    { title: "Anushthan", subtitle: "Vidya Siddhi Anushthan", desc: "Sacred mantras aur shastrokt vidhi se anushthan karake har ek Vidya Rudraksh ko abhimantrit kiya jata hai.", icon: "🔥", bg: "#dbeafe" }
  ];

  const [activeStep, setActiveStep] = React.useState(0);

  return (
    <section className="vidya-ashram-section">
      <style>{`
        .vidya-ashram-section {
          padding: 60px 0;
          background-color: #ffffff;
          border-bottom: 1px solid #f3f4f6;
          font-family: var(--font-sans);
          text-align: center;
        }
        @media (max-width: 768px) {
          .vidya-ashram-section {
            padding: 36px 0;
          }
        }
        .vidya-ashram-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .vidya-ashram-tag {
          display: inline-block;
          font-size: 0.78rem;
          font-weight: 800;
          color: #ea580c;
          background: #ffedd5;
          padding: 6px 12px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .vidya-ashram-title {
          font-size: 1.8rem;
          font-weight: 900;
          color: #2d140e;
          margin-bottom: 36px;
          line-height: 1.3;
        }
        
        /* Interactive Step Grid */
        .vidya-ashram-tabs {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          margin-bottom: 40px;
          padding: 0 10px;
        }
        .vidya-ashram-progress-bg {
          position: absolute;
          top: 36px;
          left: 10px;
          right: 10px;
          height: 4px;
          background: #f3f4f6;
          z-index: 1;
          transform: translateY(-50%);
          border-radius: 2px;
        }
        .vidya-ashram-progress-bar {
          position: absolute;
          top: 36px;
          left: 10px;
          height: 4px;
          background: linear-gradient(90deg, #f97316 0%, #ea580c 100%);
          z-index: 2;
          transform: translateY(-50%);
          transition: width 0.4s ease;
          border-radius: 2px;
        }
        .vidya-ashram-tab-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 5;
          cursor: pointer;
          flex: 1;
        }
        .vidya-ashram-tab-btn {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }
        .vidya-ashram-tab-item.active .vidya-ashram-tab-btn {
          border-color: #ea580c;
          background: #ea580c;
          color: #ffffff;
          transform: scale(1.15);
          box-shadow: 0 8px 20px rgba(234, 88, 12, 0.25);
        }
        .vidya-ashram-tab-label {
          margin-top: 8px;
          font-size: 0.82rem;
          font-weight: 800;
          color: #6b7280;
          transition: color 0.3s;
        }
        .vidya-ashram-tab-item.active .vidya-ashram-tab-label {
          color: #ea580c;
        }
        
        /* Dynamic Description Card */
        .vidya-ashram-detail-card {
          background: #ffffff;
          border: 1.5px solid #fed7aa;
          border-radius: 24px;
          padding: 28px 24px;
          box-shadow: 0 16px 36px rgba(249, 115, 22, 0.05);
          text-align: left;
          position: relative;
          overflow: hidden;
          animation: fade-up-detail 0.4s ease;
        }
        @keyframes fade-up-detail {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .vidya-ashram-detail-badge {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 800;
          color: #ea580c;
          background: #ffedd5;
          padding: 4px 10px;
          border-radius: 8px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .vidya-ashram-detail-title {
          font-size: 1.4rem;
          font-weight: 900;
          color: #2d140e;
          margin-bottom: 8px;
        }
        .vidya-ashram-detail-desc {
          font-size: 0.92rem;
          color: #4b5563;
          line-height: 1.55;
          margin: 0;
        }
        
        .vidya-ashram-bottom-card {
          background: linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%);
          border: 1.5px solid #fed7aa;
          border-radius: 20px;
          padding: 24px;
          margin-top: 36px;
          box-shadow: 0 10px 25px rgba(249, 115, 22, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        .vidya-ashram-bottom-text {
          font-size: 1.05rem;
          font-weight: 800;
          color: #2d140e;
          line-height: 1.45;
          margin: 0;
          text-align: left;
        }
        
        @media (max-width: 600px) {
          .vidya-ashram-tab-btn {
            width: 44px;
            height: 44px;
            font-size: 1.2rem;
          }
          .vidya-ashram-progress-bg,
          .vidya-ashram-progress-bar {
            top: 32px;
          }
          .vidya-ashram-tab-label {
            font-size: 0.72rem;
          }
          .vidya-ashram-detail-title {
            font-size: 1.2rem;
          }
          .vidya-ashram-detail-desc {
            font-size: 0.84rem;
          }
          .vidya-ashram-bottom-card {
            flex-direction: column;
            text-align: center;
          }
          .vidya-ashram-bottom-text {
            text-align: center;
            font-size: 0.9rem;
          }
        }
      `}</style>
      <div className="vidya-ashram-container">
        <span className="vidya-ashram-tag">{isHindi ? "सांदीपनी आश्रम" : "Sandipani Ashram"}</span>
        <h2 className="vidya-ashram-title">{isHindi ? "भगवान श्री कृष्ण की शिक्षा स्थली से..." : "Bhagwan Shri Krishna Ki Shiksha Sthali Se..."}</h2>
        
        {/* Interactive Timeline Tabs */}
        <div className="vidya-ashram-tabs">
          <div className="vidya-ashram-progress-bg" />
          <div 
            className="vidya-ashram-progress-bar" 
            style={{ width: `calc(100% * (${activeStep} / 4))` }}
          />
          {steps.map((step, idx) => (
            <div 
              key={idx} 
              className={`vidya-ashram-tab-item ${idx === activeStep ? 'active' : ''}`}
              onClick={() => setActiveStep(idx)}
            >
              <button 
                className="vidya-ashram-tab-btn"
                style={{ 
                  backgroundColor: idx === activeStep ? '#ea580c' : '#ffffff',
                  color: idx === activeStep ? '#ffffff' : 'inherit'
                }}
              >
                {step.icon}
              </button>
              <span className="vidya-ashram-tab-label">{step.title}</span>
            </div>
          ))}
        </div>

        {/* Detailed description panel for active step */}
        <div className="vidya-ashram-detail-card" key={activeStep}>
          <span className="vidya-ashram-detail-badge" style={{ backgroundColor: `${steps[activeStep].bg}bb`, color: '#2d140e' }}>
            {isHindi ? `चरण ${activeStep + 1} (कुल 5 में से)` : `Step ${activeStep + 1} of 5`}
          </span>
          <h3 className="vidya-ashram-detail-title">{steps[activeStep].subtitle}</h3>
          <p className="vidya-ashram-detail-desc">{steps[activeStep].desc}</p>
        </div>

        {/* Static Vedic Summary Card */}
        <div className="vidya-ashram-bottom-card">
          <span style={{ fontSize: '2rem', flexShrink: 0 }}>✨</span>
          <p className="vidya-ashram-bottom-text">
            {isHindi 
              ? <>इसी पवित्र भूमि पर <strong>विद्या सिद्धि अनुष्ठान</strong> के बाद <strong>विद्या रुद्राक्ष</strong> अभिमंत्रित किया जाता है।</> 
              : <>Isi pavitra bhoomi par <strong>Vidya Siddhi Anushthan</strong> ke baad <strong>Vidya Rudraksh</strong> abhimantrit kiya jata hai.</>}
          </p>
        </div>
      </div>
    </section>
  );
};

const VidyaWhyParentsTrustSection: React.FC = () => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  const trustPoints = isHindi ? [
    { 
      title: "पढ़ाई में मन लगाने में सहायक", 
      desc: "चंचल मन शांत होता है, जिससे पढ़ाई में रुचि बढ़ती है।", 
      howItWorks: "रुद्राक्ष की इलेक्ट्रोमैग्नेटिक तरंगें मस्तिष्क कोशिकाओं के रिसेप्टर्स को सक्रिय करती हैं, जिससे पढ़ाई पर ध्यान केंद्रित करना आसान हो जाता है।",
      icon: (color: string) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
          <path d="M13 14h3" />
        </svg>
      ), 
      color: "#f59e0b" 
    },
    { 
      title: "एकाग्रता को मजबूत बनाने में सहायक", 
      desc: "कंसंट्रेशन स्पैन बढ़ता है, जिससे ध्यान इधर-उधर नहीं भटकता।", 
      howItWorks: "यह अल्फा ब्रेन वेव्स की आवृत्ति को सहायता देकर ध्यान की अवधि और निरंतरता को स्थिर रखने में मदद करता है।",
      icon: (color: string) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ), 
      color: "#3b82f6" 
    },
    { 
      title: "सकारात्मक अध्ययन आदत विकसित करने में मददगार", 
      desc: "बैठकर पढ़ने की आदत और लगातार सीखने की प्रक्रिया आसान होती है।", 
      howItWorks: "शरीर और मन की स्थिरता बढ़ने से भटकाव की थकान कम होती है, जिससे पढ़ाई के उत्पादक सत्र लंबे समय तक चलते हैं।",
      icon: (color: string) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
          <path d="M17 14h-6" />
          <path d="M13 18H7" />
          <path d="M7 14h.01" />
          <path d="M17 18h.01" />
        </svg>
      ), 
      color: "#10b981" 
    },
    { 
      title: "आत्मविश्वास बढ़ाने में सहायक", 
      desc: "परीक्षा के डर और तनाव से मुक्ति मिलती है, जिससे आत्मविश्वास मजबूत होता है।", 
      howItWorks: "एड्रिनेलिन के अत्यधिक स्राव को नियंत्रित करके यह घबराहट को कम करता है और सार्वजनिक प्रदर्शन के आत्मविश्वास को बढ़ाता है।",
      icon: (color: string) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
          <path d="M12 2a5 5 0 0 0-5 5v5h10V7a5 5 0 0 0-5-5z" />
        </svg>
      ), 
      color: "#ec4899" 
    },
    { 
      title: "सकारात्मक सीखने का वातावरण", 
      desc: "आभामंडल (Aura) सकारात्मक होता है, जिससे घर में पढ़ाई का अनुकूल वातावरण बनता है।", 
      howItWorks: "उज्जैन के सिद्ध आश्रम द्वारा प्राप्त ऊर्जावान आवृत्ति घर के नकारात्मक प्रभाव और तनाव कारकों को समाप्त करती है।",
      icon: (color: string) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M9 22V12h6v10" />
        </svg>
      ), 
      color: "#ef4444" 
    },
    { 
      title: "विद्या के प्रति दृढ़ संकल्प", 
      desc: "ज्ञान और शिक्षा के प्रति आदर और लगन का संकल्प जाग्रत होता है।", 
      howItWorks: "वैदिक अनुष्ठान से प्राप्त प्रेरणा से बच्चा पढ़ाई को बोझ नहीं, बल्कि एक सिद्धि और ज्ञान का मार्ग समझने लगता है।",
      icon: (color: string) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M12 6v6l4 2" />
        </svg>
      ), 
      color: "#8b5cf6" 
    }
  ] : [
    { 
      title: "Padhai Mein Man Lagane Mein Sahayak", 
      desc: "Chanchal mann shant hota hai, jisse padhai mein ruchi badhti hai.", 
      howItWorks: "Rudraksh ki electromagnetic vibrations brain cell receptors ko active karti hain, jisse dhyan lagana aasan ho jata hai.",
      icon: (color: string) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
          <path d="M13 14h3" />
        </svg>
      ), 
      color: "#f59e0b" 
    },
    { 
      title: "Ekagrata Ko Majboot Banane Mein Sahayak", 
      desc: "Concentration span badhta hai, jisse dhyan idhar-udhar nahi bhatakta.", 
      howItWorks: "Alpha brain waves frequency ko support karke attention span aur consistency ko stabilize karne mein help karta hai.",
      icon: (color: string) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ), 
      color: "#3b82f6" 
    },
    { 
      title: "Positive Study Habit Banane Mein Sahayak", 
      desc: "Baithne ki aadat aur continuous learning process smooth hoti hai.", 
      howItWorks: "Body and mind stability increase hone se distraction fatigue reduce hota hai, jisse productive study sessions lambe chalte hain.",
      icon: (color: string) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
          <path d="M17 14h-6" />
          <path d="M13 18H7" />
          <path d="M7 14h.01" />
          <path d="M17 18h.01" />
        </svg>
      ), 
      color: "#10b981" 
    },
    { 
      title: "Atmavishwas Badhane Mein Sahayak", 
      desc: "Exams ke darr aur anxiety se mukti milti hai, self-confidence majboot hota hai.", 
      howItWorks: "Adrenaline ke hyper-secretion ko control karke nervousness ko control karta hai aur public performance confidence badhata hai.",
      icon: (color: string) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
          <path d="M12 2a5 5 0 0 0-5 5v5h10V7a5 5 0 0 0-5-5z" />
        </svg>
      ), 
      color: "#ec4899" 
    },
    { 
      title: "Positive Learning Environment", 
      desc: "Aura positive hota hai, jisse ghar mein padhai ka anukul vatavaran banta hai.", 
      howItWorks: "Ujjain ke Siddh Ashram dwara prapt energetic frequency ghar ke negative aura aur stress factors ko eliminate karti hai.",
      icon: (color: string) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M9 22V12h6v10" />
        </svg>
      ), 
      color: "#ef4444" 
    },
    { 
      title: "Vidya Ke Prati Sankalp", 
      desc: "Gyan aur shiksha ke prati adar aur lagan ka sankalp jagrit hota hai.", 
      howItWorks: "Anya vedic anushthan se prapt prerna se bachcha padhai ko bojh nahi, balki ek siddhi aur gyan ka marg samajhne lagta hai.",
      icon: (color: string) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M12 6v6l4 2" />
        </svg>
      ), 
      color: "#8b5cf6" 
    }
  ];

  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);
  const [showAll, setShowAll] = React.useState<boolean>(false);
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const visiblePoints = isMobile && !showAll ? trustPoints.slice(0, 2) : trustPoints;

  return (
    <section className="vidya-trust-section">
      <style>{`
        .vidya-trust-section {
          padding: 64px 0;
          background-color: #fffcf6;
          border-top: 1.5px solid #fce8cc;
          border-bottom: 1.5px solid #fce8cc;
          font-family: var(--font-sans);
          text-align: center;
        }
        @media (max-width: 768px) {
          .vidya-trust-section {
            padding: 36px 0;
          }
        }
        .vidya-trust-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .vidya-trust-tag {
          display: inline-block;
          font-size: 0.78rem;
          font-weight: 800;
          color: #ea580c;
          background: #ffedd5;
          padding: 6px 12px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .vidya-trust-heading {
          font-size: 2rem;
          font-weight: 900;
          color: #2d140e;
          margin-bottom: 16px;
          line-height: 1.35;
        }
        .vidya-trust-subtext {
          font-size: 0.88rem;
          color: #6b7280;
          margin-bottom: 40px;
        }
        .vidya-trust-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .vidya-trust-card {
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 24px;
          padding: 24px;
          text-align: left;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .vidya-trust-card:hover {
          transform: translateY(-4px);
          border-color: #fed7aa;
          box-shadow: 0 16px 30px rgba(249, 115, 22, 0.05);
        }
        .vidya-trust-card.expanded {
          border-color: #ea580c;
          box-shadow: 0 16px 30px rgba(234, 88, 12, 0.08);
          background: #fffdfb;
        }
        .vidya-trust-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          transition: all 0.3s;
        }
        .vidya-trust-card:hover .vidya-trust-card-icon {
          transform: scale(1.1) rotate(4deg);
        }
        .vidya-trust-card-title {
          font-size: 1.05rem;
          font-weight: 850;
          color: #1f2937;
          margin: 0 0 8px 0;
          line-height: 1.4;
        }
        .vidya-trust-card-desc {
          font-size: 0.84rem;
          color: #6b7280;
          line-height: 1.5;
          margin: 0 0 12px 0;
        }
        
        .vidya-trust-expand-trigger {
          font-size: 0.74rem;
          font-weight: 800;
          color: #ea580c;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: auto;
        }
        .vidya-trust-details-drawer {
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transition: all 0.3s ease;
          border-top: 0px solid transparent;
          margin-top: 0;
          padding-top: 0;
        }
        .vidya-trust-card.expanded .vidya-trust-details-drawer {
          max-height: 120px;
          opacity: 1;
          border-top: 1.5px dashed #fed7aa;
          margin-top: 12px;
          padding-top: 12px;
        }
        .vidya-trust-details-desc {
          font-size: 0.78rem;
          color: #7c2d12;
          background: #fff8f1;
          padding: 8px 12px;
          border-radius: 10px;
          line-height: 1.45;
          margin: 0;
        }
        
        .vidya-trust-show-more-btn {
          display: none;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin: 28px auto 0 auto;
          padding: 12px 24px;
          background: #ffffff;
          border: 2px solid #ea580c;
          color: #ea580c;
          font-size: 0.9rem;
          font-weight: 800;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.08);
          outline: none;
        }
        .vidya-trust-show-more-btn:hover {
          background: #ea580c;
          color: #ffffff;
          box-shadow: 0 6px 16px rgba(234, 88, 12, 0.16);
          transform: translateY(-1px);
        }
        
        @media (max-width: 991px) {
          .vidya-trust-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .vidya-trust-heading {
            font-size: 1.6rem;
          }
        }
        @media (max-width: 768px) {
          .vidya-trust-show-more-btn {
            display: inline-flex;
          }
        }
        @media (max-width: 600px) {
          .vidya-trust-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .vidya-trust-card {
            padding: 20px;
          }
        }
      `}</style>
      <div className="vidya-trust-container">
        <span className="vidya-trust-tag">{isHindi ? "श्रद्धालुओं का विश्वास" : "Devotee Trust"}</span>
        <h2 className="vidya-trust-heading">
          {isHindi ? "माता-पिता विद्या रुद्राक्ष पर विश्वास क्यों करते हैं?" : "Mata-Pita Vidya Rudraksh Par Vishwas Kyon Karte Hain?"}
        </h2>
        <p className="vidya-trust-subtext">{isHindi ? "आध्यात्मिक और वैज्ञानिक कारण जानने के लिए कार्ड पर क्लिक करें:" : "Click card to reveal spiritual & scientific reason:"}</p>
        
        <div className="vidya-trust-grid">
          {visiblePoints.map((item) => {
            const originalIdx = trustPoints.indexOf(item);
            const isExpanded = expandedIndex === originalIdx;
            return (
              <div 
                className={`vidya-trust-card ${isExpanded ? 'expanded' : ''}`} 
                key={originalIdx}
                onClick={() => setExpandedIndex(isExpanded ? null : originalIdx)}
              >
                <div className="vidya-trust-card-icon" style={{ backgroundColor: `${item.color}15` }}>
                  {item.icon(item.color)}
                </div>
                <h3 className="vidya-trust-card-title">{item.title}</h3>
                <p className="vidya-trust-card-desc">{item.desc}</p>
                
                <span className="vidya-trust-expand-trigger">
                  {isExpanded ? (isHindi ? "विवरण छुपाएं ✕" : "Hide Details ✕") : (isHindi ? "यह कैसे काम करता है? +" : "How it works? +")}
                </span>

                <div className="vidya-trust-details-drawer">
                  <p className="vidya-trust-details-desc">
                    {item.howItWorks}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {isMobile && (
          <button 
            className="vidya-trust-show-more-btn"
            onClick={() => setShowAll(!showAll)}
          >
            <span>{showAll ? (isHindi ? "कम कारण दिखाएं" : "Show Less Reasons") : (isHindi ? "सभी कारण दिखाएं" : "Show All Reasons")}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }}>
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
        )}
      </div>
    </section>
  );
};

const VidyaWhyOneRupeeSection: React.FC = () => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  const chargesBreakdown = isHindi ? [
    { title: "अनुष्ठान शुल्क (Ritual Charges)", desc: "आश्रम के वैदिक पंडितों की सिद्धि पूजन सामग्री और अनुष्ठान क्रिया की मूल लागत।", icon: "🕉️", color: "#f59e0b" },
    { title: "पैकिंग शुल्क (Packing Charges)", desc: "रुद्राक्ष को सुरक्षित रखने के लिए गंगाजल से धोए गए बॉक्स और पवित्र धागे की पैकेजिंग लागत।", icon: "📦", color: "#3b82f6" },
    { title: "शिपिंग शुल्क (Shipping Charges)", desc: "उज्जैन से सीधे आपके घर तक सुरक्षित पहुँचाने के लॉजिस्टिक्स और डिलीवरी पार्टनर शुल्क।", icon: "🚚", color: "#10b981" }
  ] : [
    { title: "Ritual Charges", desc: "Ashram ke vedic panditon ki siddhi pujan samagri aur anushthan kriya ki mool cost.", icon: "🕉️", color: "#f59e0b" },
    { title: "Packing Charges", desc: "Rudraksh ko surakshit rakhne ke liye gangajal se dhule box aur sacred thread ki packaging.", icon: "📦", color: "#3b82f6" },
    { title: "Shipping Charges", desc: "Ujjain se seedhe aapke ghar tak surakshit pahunchane ke logistics aur delivery partner charges.", icon: "🚚", color: "#10b981" }
  ];

  const [activeCharge, setActiveCharge] = React.useState<number | null>(null);

  return (
    <section className="vidya-onerupee-section">
      <style>{`
        .vidya-onerupee-section {
          padding: 60px 0 36px 0;
          background-color: #fffdf6;
          border-top: 1.5px dashed #fed7aa;
          border-bottom: 1.5px dashed #fed7aa;
          font-family: var(--font-sans);
          text-align: center;
        }
        @media (max-width: 768px) {
          .vidya-onerupee-section {
            padding: 36px 0 20px 0;
          }
        }
        .vidya-onerupee-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .vidya-onerupee-tag {
          display: inline-block;
          font-size: 0.78rem;
          font-weight: 800;
          color: #ea580c;
          background: #ffedd5;
          padding: 6px 12px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
        }
        .vidya-onerupee-heading {
          font-size: 2.1rem;
          font-weight: 900;
          color: #2d140e;
          margin-bottom: 24px;
          line-height: 1.3;
        }
        
        /* Interactive Coin Illustration */
        .vidya-onerupee-coin-wrap {
          margin: 28px auto;
          width: 110px;
          height: 110px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        .vidya-onerupee-coin {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
          border: 4px solid #ffffff;
          box-shadow: 0 10px 25px rgba(217, 119, 6, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 2.5rem;
          font-weight: 900;
          position: relative;
          z-index: 12;
          animation: coin-wobble 4s infinite ease-in-out;
        }
        @keyframes coin-wobble {
          0%, 100% { transform: rotateY(0deg) rotate(0deg); }
          50% { transform: rotateY(180deg) rotate(5deg); }
        }
        .vidya-onerupee-coin-ripple {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid #fed7aa;
          animation: coin-ripple-out 3s infinite ease-out;
          opacity: 0;
          z-index: 8;
        }
        .vidya-onerupee-coin-ripple:nth-child(2) { animation-delay: 1.5s; }
        @keyframes coin-ripple-out {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .vidya-onerupee-story {
          font-size: 1.2rem;
          line-height: 1.6;
          color: #4b5563;
          font-weight: 700;
          margin-bottom: 32px;
        }
        .vidya-onerupee-highlight {
          color: #b45309;
          font-size: 1.4rem;
          font-weight: 900;
          display: block;
          margin: 12px 0;
        }
        
        /* Interactive charges list */
        .vidya-onerupee-charges-label {
          font-size: 0.86rem;
          font-weight: 800;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 12px;
          letter-spacing: 1px;
        }
        .vidya-onerupee-charges-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .vidya-onerupee-charge-card {
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 18px;
          padding: 16px 12px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.01);
        }
        .vidya-onerupee-charge-card.active {
          border-color: #ea580c;
          background: #fffdfa;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(234, 88, 12, 0.08);
        }
        .vidya-onerupee-charge-check {
          font-size: 0.95rem;
          font-weight: 800;
          color: #10b981;
        }
        .vidya-onerupee-charge-title {
          font-size: 0.95rem;
          font-weight: 850;
          color: #1f2937;
        }
        
        /* Popup explanation drawer */
        .vidya-onerupee-explanation-wrap {
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .vidya-onerupee-explanation-wrap.visible {
          max-height: 120px;
          opacity: 1;
          margin-bottom: 20px;
        }
        .vidya-onerupee-explanation {
          background: linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%);
          border: 1.5px solid #fed7aa;
          border-radius: 16px;
          padding: 14px 20px;
          font-size: 0.86rem;
          font-weight: 700;
          color: #7c2d12;
          display: inline-block;
          max-width: 100%;
          line-height: 1.45;
          text-align: left;
        }
        
        @media (max-width: 768px) {
          .vidya-onerupee-heading {
            font-size: 1.7rem;
          }
          .vidya-onerupee-story {
            font-size: 1.05rem;
          }
          .vidya-onerupee-highlight {
            font-size: 1.25rem;
          }
        }
        @media (max-width: 500px) {
          .vidya-onerupee-charges-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .vidya-onerupee-charge-card {
            flex-direction: row;
            padding: 12px 16px;
            justify-content: flex-start;
            gap: 12px;
          }
          .vidya-onerupee-explanation {
            font-size: 0.8rem;
            padding: 12px;
            text-align: center;
          }
        }
      `}</style>
      <div className="vidya-onerupee-container">
        <span className="vidya-onerupee-tag">{isHindi ? "₹1 भावना" : "₹1 Spirit"}</span>
        <h2 className="vidya-onerupee-heading">{isHindi ? "हम सिर्फ ₹1 में क्यों दे रहे हैं?" : "Hum Sirf ₹1 Mein Kyu De Rahe Hain?"}</h2>
        
        {/* Glowing floating coin */}
        <div className="vidya-onerupee-coin-wrap">
          <div className="vidya-onerupee-coin-ripple" />
          <div className="vidya-onerupee-coin-ripple" />
          <div className="vidya-onerupee-coin">₹1</div>
        </div>

        <p className="vidya-onerupee-story">
          {isHindi 
            ? <>हर बच्चा <span style={{ color: '#ea580c', fontWeight: 900 }}>विद्या का अधिकारी</span> है।<br />इसलिए रुद्राक्ष का मूल्य <span className="vidya-onerupee-highlight">मात्र ₹1 रखा गया है।</span></>
            : <>Har Bachcha <span style={{ color: '#ea580c', fontWeight: 900 }}>Vidya Ka Adhikari</span> Hai.<br />Isliye Rudraksh Ka Moolya <span className="vidya-onerupee-highlight">Matra ₹1 Rakha Gaya Hai.</span></>}
        </p>

        <span className="vidya-onerupee-charges-label">{isHindi ? "आप केवल नीचे दिए गए शुल्क देते हैं (विवरण के लिए टैप करें):" : "Aap Sirf Niche Diye Charges Dete Hain (Tap for details):"}</span>
        
        <div className="vidya-onerupee-charges-grid">
          {chargesBreakdown.map((item, idx) => {
            const isActive = activeCharge === idx;
            return (
              <div 
                key={idx} 
                className={`vidya-onerupee-charge-card ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCharge(isActive ? null : idx)}
              >
                <span className="vidya-onerupee-charge-check">✔</span>
                <span className="vidya-onerupee-charge-title">{item.title}</span>
              </div>
            );
          })}
        </div>

        <div className={`vidya-onerupee-explanation-wrap ${activeCharge !== null ? 'visible' : ''}`}>
          {activeCharge !== null && (
            <div className="vidya-onerupee-explanation">
              <span style={{ fontSize: '1.2rem', marginRight: '6px' }}>
                {chargesBreakdown[activeCharge].icon}
              </span>
              <strong>{chargesBreakdown[activeCharge].title}: </strong>
              {chargesBreakdown[activeCharge].desc}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

interface LazyVideoProps {
  src: string;
  className?: string;
  muted: boolean;
  isActive?: boolean;
  onClick?: (e: React.MouseEvent<HTMLVideoElement>) => void;
  onEnded?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  poster?: string;
}

const LazyVideo: React.FC<LazyVideoProps> = ({ src, className, muted, isActive = false, onClick, onEnded, poster }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const isCfStream = src.includes('cloudflarestream.com');

  // Play if active in viewport (scroll-centered) or hovered
  React.useEffect(() => {
    setIsPlaying(isActive || isHovered);
  }, [isActive, isHovered]);

  React.useEffect(() => {
    if (isPlaying) {
      setHasLoaded(true);
    }
  }, [isPlaying]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || isCfStream || !hasLoaded) return;

    if (isPlaying) {
      video.play().catch((err) => {
        console.log("LazyVideo play issue:", err.message);
      });
    } else {
      video.pause();
    }
  }, [isPlaying, isCfStream, hasLoaded]);

  // Sync muted state when prop updates
  React.useEffect(() => {
    if (!isCfStream && videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted, isCfStream]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (!isPlaying) {
      setIsPlaying(true);
    }
    if (onClick) {
      onClick(e);
    }
  };

  if (isCfStream) {
    if (!isPlaying) {
      return (
        <div
          className={className}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => {
            e.stopPropagation();
            setIsHovered(true);
          }}
          style={{
            backgroundImage: poster ? `url(${poster})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#000000',
            width: '100%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <Play size={26} style={{ marginLeft: '4px' }} />
          </div>
        </div>
      );
    }

    const embedUrl = `${src}${src.includes('?') ? '&' : '?'}autoplay=true&loop=true&muted=${muted ? 'true' : 'false'}`;

    return (
      <div
        className={className}
        onMouseLeave={handleMouseLeave}
        style={{ width: '100%', height: '100%' }}
      >
        <iframe
          id={`cf-stream-${src}`}
          src={embedUrl}
          style={{ border: 'none', backgroundColor: '#000000', width: '100%', height: '100%' }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#000000' }}
    >
      <video
        ref={videoRef}
        src={hasLoaded ? src : undefined}
        poster={poster}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        loop={!onEnded}
        muted={muted}
        playsInline
        preload="none"
        onClick={handleVideoClick}
        onEnded={onEnded}
      />
      {!isPlaying && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(true);
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <Play size={26} style={{ marginLeft: '4px' }} />
          </div>
        </div>
      )}
    </div>
  );
};

interface VidyaCustomerStoriesSectionProps {
  activeProducts: any[];
  onViewDetails: (product: any) => void;
}

const VidyaCustomerStoriesSection: React.FC<VidyaCustomerStoriesSectionProps> = ({
  activeProducts,
  onViewDetails
}) => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  const [videoReviews, setVideoReviews] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [unmutedId, setUnmutedId] = React.useState<string | null>(null);
  const [activeCardId, setActiveCardId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const cards = container.querySelectorAll('.vidya-story-card');
    if (cards.length === 0) return;

    // Set first card active initially
    const firstCardId = cards[0].getAttribute('data-card-id');
    if (firstCardId) {
      setActiveCardId(firstCardId);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardId = entry.target.getAttribute('data-card-id');
            if (cardId) {
              setActiveCardId(cardId);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6, // must be 60% in view inside the carousel wrapper to active-play
        rootMargin: '0px'
      }
    );

    cards.forEach((card) => observer.observe(card));
    return () => {
      cards.forEach((card) => observer.unobserve(card));
    };
  }, [videoReviews, activeProducts, loading]);

  const toggleMute = (cardId: string, videoEl: HTMLVideoElement | null) => {
    if (!videoEl) return;
    const willBeMuted = unmutedId === cardId;
    videoEl.muted = willBeMuted;
    if (willBeMuted) {
      setUnmutedId(null);
    } else {
      setUnmutedId(cardId);
      // Mute all other videos in the carousel
      if (scrollRef.current) {
        const allVideos = scrollRef.current.querySelectorAll('video');
        allVideos.forEach((v) => {
          if (v !== videoEl) {
            v.muted = true;
          }
        });
      }
    }
  };

  const handleVideoEnded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;

    // Safety checks to prevent scrolling on load stutters, pauses, or initial interruptions
    if (video.currentTime < 1.5) {
      return;
    }
    if (video.duration && Math.abs(video.currentTime - video.duration) > 1.0) {
      return;
    }

    const currentCard = video.closest('.vidya-story-card');
    if (!currentCard) return;

    let nextCard = currentCard.nextElementSibling as HTMLElement;
    if (!nextCard) {
      nextCard = currentCard.parentElement?.firstElementChild as HTMLElement;
    }

    if (nextCard) {
      nextCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

      const nextVideo = nextCard.querySelector('video');
      const nextCardId = nextCard.getAttribute('data-card-id');
      const currentCardId = currentCard.getAttribute('data-card-id');

      if (nextVideo && nextCardId && currentCardId) {
        const wasUnmuted = unmutedId === currentCardId;
        setTimeout(() => {
          if (wasUnmuted) {
            toggleMute(nextCardId, nextVideo);
          }
        }, 500);
      }
    }
  };

  React.useEffect(() => {
    const fetchVideoReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('video_reviews')
          .select('*')
          .order('sort_order', { ascending: true })
          .limit(10);

        if (error) {
          console.error("Error fetching video reviews from Supabase:", error);
        } else if (data && data.length > 0) {
          setVideoReviews(data);
        }
      } catch (err) {
        console.error("Supabase fetch failed for video_reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoReviews();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = window.innerWidth <= 768 ? 245 + 16 : 270 + 20;
      const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Use DB reviews if present, otherwise fall back to first 5 activeProducts
  const hasDbReviews = !loading && videoReviews.length > 0;
  const displayCount = hasDbReviews ? videoReviews.length : Math.min(activeProducts.length, 5);

  if (displayCount === 0) return null;

  return (
    <section className="vidya-stories-section">
      <style>{`
        .vidya-stories-section {
          padding: 56px 0;
          background-color: #ffffff;
          font-family: var(--font-sans);
          text-align: center;
          border-top: 1px solid var(--border-light);
          position: relative;
        }
        @media (max-width: 768px) {
          .vidya-stories-section {
            padding: 36px 0 24px 0;
          }
        }
        .vidya-stories-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          position: relative;
        }
        .vidya-stories-heading {
          font-size: 1.8rem;
          font-weight: 900;
          color: #111827;
          margin-bottom: 32px;
          letter-spacing: -0.5px;
        }
        @media (max-width: 768px) {
          .vidya-stories-heading {
            font-size: 1.4rem;
            margin-bottom: 20px;
          }
        }
        
        .vidya-stories-carousel-wrapper {
          position: relative;
          width: 100%;
        }

        .vidya-stories-grid {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          padding: 8px 4px 16px 4px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        .vidya-stories-grid::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 768px) {
          .vidya-stories-grid {
            gap: 16px;
            padding-bottom: 12px;
          }
        }
        
        .vidya-story-card {
          position: relative;
          width: 270px;
          height: 480px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          border: 1.5px solid rgba(0, 0, 0, 0.04);
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s;
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .vidya-story-card {
            width: 245px;
            height: 435px;
          }
        }
        .vidya-story-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.14);
        }
        
        .vidya-story-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        
        /* Floating product overlay */
        .vidya-story-product-overlay {
          position: absolute;
          bottom: 16px;
          left: 12px;
          right: 12px;
          background: #ffffff;
          border-radius: 16px;
          padding: 8px 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 10;
          transition: transform 0.2s;
        }
        .vidya-story-card:hover .vidya-story-product-overlay {
          transform: scale(1.02);
        }
        .vidya-story-prod-img {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid rgba(0, 0, 0, 0.06);
          flex-shrink: 0;
        }
        .vidya-story-prod-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          min-width: 0;
          width: 100%;
        }
        .vidya-story-prod-name {
          font-size: 0.72rem;
          font-weight: 800;
          color: #1f2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          text-align: left;
        }
        .vidya-story-price-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .vidya-story-sale-price {
          font-size: 0.8rem;
          font-weight: 900;
          color: #ea580c;
        }
        .vidya-story-orig-price {
          font-size: 0.68rem;
          text-decoration: line-through;
          color: #9ca3af;
          font-weight: 700;
        }
        .vidya-story-discount {
          font-size: 0.64rem;
          color: #10b981;
          font-weight: 850;
        }

        .vidya-carousel-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid var(--border-light);
          box-shadow: var(--shadow-md);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 20;
          transition: all 0.2s;
          color: var(--text-dark);
        }
        .vidya-carousel-btn:hover {
          background: var(--bg-light);
          transform: translateY(-50%) scale(1.05);
          color: var(--primary-orange);
        }
        .vidya-carousel-btn.left {
          left: -22px;
        }
        .vidya-carousel-btn.right {
          right: -22px;
        }
        @media (max-width: 1024px) {
          .vidya-carousel-btn {
            display: none;
          }
        }

        .vidya-story-mute-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1.5px solid rgba(255, 255, 255, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          z-index: 15;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .vidya-story-mute-btn:hover {
          background: rgba(0, 0, 0, 0.7);
          transform: scale(1.1);
          border-color: rgba(255, 255, 255, 0.45);
        }
        .vidya-story-mute-btn svg {
          transition: transform 0.2s ease;
        }
        .vidya-story-mute-btn:active svg {
          transform: scale(0.9);
        }
      `}</style>
      <div className="vidya-stories-container">
        <h2 className="vidya-stories-heading">{isHindi ? "हमारे श्रद्धालुओं के सबसे प्रिय आशीर्वाद" : "Our Devotees' Most Loved Blessings"}</h2>
        
        <div className="vidya-stories-carousel-wrapper">
          {/* Navigation Buttons for Desktop */}
          <button 
            className="vidya-carousel-btn left" 
            onClick={() => scroll('left')}
            aria-label="Previous"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="vidya-stories-grid" ref={scrollRef}>
            {hasDbReviews ? (
              videoReviews.map((rev) => {
                // Try to find matching catalog product by name matching the puja_name
                const p = activeProducts.find(prod => 
                  prod.name?.toLowerCase().includes(rev.puja_name?.toLowerCase()) ||
                  rev.puja_name?.toLowerCase().includes(prod.name?.toLowerCase())
                ) || activeProducts[0];

                if (!p) return null;

                const displayImg = p.images?.[0] || p.image || rev.thumbnail_url || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=250&h=250&q=80";
                const discountPercent = p.originalPrice && p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
                const cardId = `rev-${rev.id}`;

                return (
                  <div 
                    key={rev.id} 
                    className="vidya-story-card"
                    data-card-id={cardId}
                    onClick={() => {
                      onViewDetails(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <LazyVideo 
                      className="vidya-story-video"
                      src={rev.video_url}
                      muted={unmutedId !== cardId}
                      isActive={activeCardId === cardId}
                      poster={rev.thumbnail_url}
                      onEnded={handleVideoEnded}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMute(cardId, e.currentTarget);
                      }}
                    />
                    <button 
                      className="vidya-story-mute-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        const card = e.currentTarget.closest('.vidya-story-card');
                        const videoEl = card?.querySelector('video');
                        toggleMute(cardId, videoEl || null);
                      }}
                      aria-label={unmutedId === cardId ? "Mute video" : "Unmute video"}
                    >
                      {unmutedId === cardId ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                    <div className="vidya-story-product-overlay">
                      <img src={displayImg} alt={p.name} className="vidya-story-prod-img" />
                      <div className="vidya-story-prod-info">
                        <span className="vidya-story-prod-name">{p.name}</span>
                        <div className="vidya-story-price-row">
                          <span className="vidya-story-sale-price">₹{p.price}</span>
                          {p.originalPrice && (
                            <span className="vidya-story-orig-price">₹{p.originalPrice}</span>
                          )}
                          {discountPercent > 0 && (
                            <span className="vidya-story-discount">-{discountPercent}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              activeProducts.slice(0, 5).map((p, idx) => {
                const fallbackVideos = [
                  "https://assets.mixkit.co/videos/preview/mixkit-holding-sacred-beads-during-meditation-41585-large.mp4",
                  "https://assets.mixkit.co/videos/preview/mixkit-young-man-worshipping-outdoors-41586-large.mp4",
                  "https://assets.mixkit.co/videos/preview/mixkit-guru-explaining-spiritual-teachings-41587-large.mp4",
                  "https://assets.mixkit.co/videos/preview/mixkit-meditating-bell-chime-in-temple-41588-large.mp4",
                  "https://assets.mixkit.co/videos/preview/mixkit-holding-sacred-beads-during-meditation-41585-large.mp4"
                ];
                const videoSrc = p.videoUrl || fallbackVideos[idx % fallbackVideos.length];
                const displayImg = p.images?.[0] || p.image || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=250&h=250&q=80";
                const discountPercent = p.originalPrice && p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
                const cardId = `prod-${p.id}`;

                return (
                  <div 
                    key={p.id} 
                    className="vidya-story-card"
                    data-card-id={cardId}
                    onClick={() => {
                      onViewDetails(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <LazyVideo 
                      className="vidya-story-video"
                      src={videoSrc}
                      muted={unmutedId !== cardId}
                      isActive={activeCardId === cardId}
                      poster={displayImg}
                      onEnded={handleVideoEnded}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMute(cardId, e.currentTarget);
                      }}
                    />
                    <button 
                      className="vidya-story-mute-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        const card = e.currentTarget.closest('.vidya-story-card');
                        const videoEl = card?.querySelector('video');
                        toggleMute(cardId, videoEl || null);
                      }}
                      aria-label={unmutedId === cardId ? "Mute video" : "Unmute video"}
                    >
                      {unmutedId === cardId ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                    <div className="vidya-story-product-overlay">
                      <img src={displayImg} alt={p.name} className="vidya-story-prod-img" />
                      <div className="vidya-story-prod-info">
                        <span className="vidya-story-prod-name">{p.name}</span>
                        <div className="vidya-story-price-row">
                          <span className="vidya-story-sale-price">₹{p.price}</span>
                          {p.originalPrice && (
                            <span className="vidya-story-orig-price">₹{p.originalPrice}</span>
                          )}
                          {discountPercent > 0 && (
                            <span className="vidya-story-discount">-{discountPercent}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <button 
            className="vidya-carousel-btn right" 
            onClick={() => scroll('right')}
            aria-label="Next"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
};

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  wishlist,
  onToggleWishlist,
  onBackToShop,
  products: productsProp,
  editable = false,
  onUpdate,
  onBuyNow,
  cart,
  onUpdateQuantity,
  onFileSelect,
  mediaQueue = {},
  resolveMediaUrl,
}) => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';

  const tDetail = (text: string | undefined | null): string => {
    if (!text) return '';
    if (!isHindi) return text;
    const dictionary: Record<string, string> = {
      // Maha Mrityunjaya
      'Maha Mrityunjaya Havan': 'महामृत्युंजय हवन यज्ञ',
      'Divine protective chanting & sacred fire offerings': 'दैवीय सुरक्षात्मक मंत्रोच्चार और पवित्र अग्नि आहुति',
      'Sacred Vedic fire ritual for profound healing, longevity, and health alignment.': 'गहन उपचार, दीर्घायु और उत्तम स्वास्थ्य के लिए पवित्र वैदिक अग्नि अनुष्ठान।',
      "The Maha Mrityunjaya ritual is one of the most powerful Vedic ceremonies. Performed by elite Banaras Acharyas, it invokes Lord Shiva's rejuvenating energy to dissolve chronic obstacles, restore physical vitality, and secure a protective shield for the performer's entire family.": "महामृत्युंजय अनुष्ठान सबसे शक्तिशाली वैदिक अनुष्ठानों में से एक है। बनारस के विशिष्ट आचार्यों द्वारा संपन्न यह अनुष्ठान पुराने रोगों और बाधाओं को दूर करने, शारीरिक ऊर्जा को पुनः जाग्रत करने और साधक के पूरे परिवार के लिए सुरक्षा कवच प्रदान करने हेतु भगवान शिव की कायाकल्प ऊर्जा का आह्वान करता है।",
      'According to ancient Upanishadic scriptures, the Maha Mrityunjaya mantra represents the conquering of cosmic fears and physical decay, restoring energetic flow to the performer.': 'प्राचीन उपनिषद ग्रंथों के अनुसार, महामृत्युंजय मंत्र ब्रह्मांडीय भय और शारीरिक क्षय पर विजय का प्रतिनिधित्व करता है, जिससे साधक के भीतर सकारात्मक ऊर्जा का प्रवाह पुनः स्थापित होता है।',
      '1. Enter the full name, Gotra, and Nakshatra of the performer.\n2. Sit facing East during the live stream session.\n3. Keep a copper plate and fresh flowers near you for Sankalpa.': '1. साधक का पूरा नाम, गोत्र और नक्षत्र दर्ज करें।\n2. लाइव स्ट्रीम सत्र के दौरान पूर्व दिशा की ओर मुख करके बैठें।\n3. संकल्प के लिए अपने पास तांबे की थाली और ताजे फूल रखें।',
      'Ganesh Ambika Pujan': 'गणेश अंबिका पूजन',
      'Initial invocation for obstacle removal.': 'बाधाओं को दूर करने के लिए प्रारंभिक आह्वान।',
      'Shiva Linga Abhishek': 'शिवलिंग अभिषेक',
      'Aromatic milk and honey offering to the Shiva Linga.': 'शिवलिंग पर सुगंधित दूध और शहद की आहुति।',
      'Maha Mrityunjaya Mantra Jaap (11000 chants)': 'महामृत्युंजय मंत्र जाप (11000 जप)',
      'Chanting for positive cell healing.': 'सकारात्मक कोशिकीय उपचार के लिए मंत्र जाप।',
      'Purnahuti Havan': 'पूर्णाहुति हवन',
      'Sacred offerings into the holy fire.': 'पवित्र अग्नि में अंतिम आहुतियां।',
      'Ganga Jal (Purified Ganges Water)': 'गंगा जल (पवित्र गंगाजल)',
      '1 Bottle': '1 बोतल',
      'Holy water for home purification.': 'घर की शुद्धि के लिए पवित्र जल।',
      'Maha Mrityunjaya Herbs Blend': 'महामृत्युंजय जड़ी-बूटी मिश्रण',
      '250g': '250 ग्राम',
      'Sacred organic herbs for Havan.': 'हवन के लिए पवित्र जैविक जड़ी-बूटियाँ।',
      'Sacred Bilva Leaves': 'पवित्र बिल्व पत्र',
      '108 Pcs': '108 नग',
      'Offerings to Shiva Linga.': 'शिवलिंग पर अर्पित करने के लिए।',
      'Premium Cow Ghee': 'प्रीमियम गाय का घी',
      '500ml': '500 मिलीलीटर',
      'Pure clarified butter.': 'शुद्ध स्पष्ट मक्खन (घी)।',
      'Acharya Somnath Shastri': 'आचार्य सोमनाथ शास्त्री',
      '18+ Years': '18+ वर्ष',
      'Specialist in Vedic Rigveda rituals, holding a Doctorate in Sanskrit Scriptures from Banaras Hindu University.': 'बनारस हिंदू विश्वविद्यालय से संस्कृत शास्त्रों में डॉक्टरेट की उपाधि प्राप्त, वैदिक ऋग्वेद अनुष्ठानों के विशेषज्ञ।',
      'Veda Acharya': 'वेदाचार्य',
      'Can I attend the puja remotely?': 'क्या मैं दूर से पूजा में भाग ले सकता हूँ?',
      'Yes, a live secure video broadcast is provided, and the priest will take your Sankalpa by reciting your name and Nakshatra.': 'हाँ, एक सुरक्षित लाइव वीडियो प्रसारण प्रदान किया जाता, और पंडित जी आपका नाम और नक्षत्र बोलकर आपका संकल्प लेंगे।',
      'What do I get in the Prasad box?': 'प्रसाद बॉक्स में मुझे क्या मिलेगा?',
      'An energized Shiva Kavach pendant, pure Varanasi Bhasma, Dry fruits prasad, and sacred Kalava string.': 'एक सिद्ध शिव कवच पेंडेंट, शुद्ध वाराणसी भस्म, सूखे मेवों का प्रसाद और पवित्र कलावा धागा।',
      'Vedic Purity & Authenticity Seal': 'वैदिक शुद्धता और प्रामाणिकता की मुहर',
      'Varanasi Sanskrit Parishad': 'वाराणसी संस्कृत परिषद',
      // Kanakdhara
      'Kanakdhara Lakshmi Havan': 'कनकधारा लक्ष्मी हवन यज्ञ',
      "Adi Shankaracharya's sacred hymns for luxury and fortune": 'ऐश्वर्य और सौभाग्य के लिए आदि शंकराचार्य के पवित्र स्तोत्र',
      'Auspicious gold-showering ritual for financial prosperity, business growth, and abundance.': 'वित्तीय समृद्धि, व्यावसायिक वृद्धि और बहुतायत के लिए शुभ स्वर्ण-वर्षा अनुष्ठान।',
      'Kanakdhara is a celebrated Vedic worship designed to remove financial constraints. By chanting the 18 golden verses of Adi Shankaracharya and making honey-drenched offerings to Goddess Lakshmi, this puja unlocks stagnant fortunes, stabilizes business earnings, and fills the home with material abundance.': 'कनकधारा वित्तीय बाधाओं को दूर करने के लिए एक प्रसिद्ध वैदिक पूजा है। आदि शंकराचार्य के 18 स्वर्ण श्लोकों का पाठ करके और देवी लक्ष्मी को शहद से लथपथ आहुति देकर, यह पूजा रुकी हुई संपत्ति को सुचारू करती है, व्यावसायिक आय को स्थिर करती है और घर को भौतिक समृद्धि से भर देती है।',
      "Kanakdhara translates to 'shower of gold.' It traces back to Adi Shankaracharya invoking Goddess Lakshmi to rain golden amlas for a poor household, aligning the home with wealth consciousness.": "कनकधारा का अनुवाद 'सोने की वर्षा' है। यह आदि शंकराचार्य द्वारा एक गरीब परिवार के लिए सोने के आंवलों की वर्षा करने हेतु देवी लक्ष्मी का आह्वान करने से जुड़ा है, जो घर को धन चेतना के साथ संरेखित करता है।",
      '1. Share your business name and family details.\n2. Keep your safe locker or ledger book open during worship.\n3. Recite Kanakdhara Stotram along with the priest if possible.': '1. अपने व्यवसाय का नाम और परिवार का विवरण साझा करें।\n2. पूजा के दौरान अपनी तिजोरी या बहीखाता खुला रखें।\n3. यदि संभव हो तो पंडित जी के साथ कनकधारा स्तोत्र का पाठ करें।',
      'Gauri Ganesh Puja': 'गौरी गणेश पूजा',
      'Seeking blessings for initial auspiciousness.': 'प्रारंभिक शुभता के लिए आशीर्वाद मांगना।',
      "Kanakdhara Stotram Chanting (18 times)": 'कनकधारा स्तोत्र पाठ (18 बार)',
      "Chanting Adi Shankaracharya's powerful wealth hymns.": 'आदि शंकराचार्य के शक्तिशाली धन स्तोत्रों का पाठ।',
      'Lotus Seed Havan': 'कमलगट्टा हवन',
      'Lotus seed and honey offerings to the sacrificial fire.': 'यज्ञ की अग्नि में कमलगट्टा और शहद की आहुति।',
      'Lakshmi Aarti & Archana': 'लक्ष्मी आरती और अर्चना',
      'Devotional offering of camphor and deep.': 'कपूर और दीप की भक्तिमय आहुति।',
      'Premium Lotus Seeds (Kamalgatta)': 'प्रीमियम कमलगट्टा',
      'Organic Saffron & Honey': 'ऑर्गेनिक केसर और शहद',
      '50g': '50 ग्राम',
      'Sacred sweet offerings for Havan.': 'हवन के लिए पवित्र मीठी आहुति।',
      'Energized Kanakdhara Yantra': 'सिद्ध कनकधारा यंत्र',
      'Copper yantra for wealth stability.': 'धन की स्थिरता के लिए तांबे का यंत्र।',
      'Yellow Mustard Seeds': 'पीली सरसों के बीज',
      '100g': '100 ग्राम',
      'For protection and prosperity.': 'सुरक्षा और समृद्धि के लिए।',
      'Acharya Vidyadhar Dwivedi': 'आचार्य विद्याधर द्विवेदी',
      '14 Years': '14 वर्ष',
      'Expert scholar from Shri Jagannath Sanskrit Vishvavidyalaya specializing in Lakshmi rituals.': 'श्री जगन्नाथ संस्कृत विश्वविद्यालय के विशेषज्ञ विद्वान, जो लक्ष्मी अनुष्ठानों में विशेषज्ञता रखते हैं।',
      'Jyotish & Karma Kanda Shastri': 'ज्योतिष एवं कर्मकांड शास्त्री',
      'Where should I keep the Kanakdhara Yantra?': 'मुझे कनकधारा यंत्र कहाँ रखना चाहिए?',
      'Keep it in your home temple, cash box, or office locker facing East.': 'इसे अपने घर के मंदिर, कैश बॉक्स या कार्यालय की तिजोरी में पूर्व दिशा की ओर रखें।',
      'Is business presence required?': 'क्या व्यवसाय की भौतिक उपस्थिति आवश्यक है?',
      'No, the priest will invoke your business name during the Sankalpa process.': 'नहीं, पंडित जी संकल्प प्रक्रिया के दौरान आपके व्यवसाय के नाम का आह्वान करेंगे।',
      'Sri Chakra Purity Guarantee': 'श्री चक्र शुद्धता गारंटी',
      'Shankaracharya Vedic Parishad': 'शंकराचार्य वैदिक परिषद',
      // Satyanarayan
      'Satyanarayan Katha & Havan': 'सत्यनारायण कथा और हवन यज्ञ',
      'Divine narrations and offering to Lord Vishnu': 'भगवान विष्णु को दिव्य आख्यान और आहुति',
      'Sacred monthly worship for domestic peace, happy relationships, and general well-being.': 'घरेलू शांति, सुखद संबंधों और सामान्य कल्याण के लिए पवित्र मासिक पूजा।',
      'Performing the Satyanarayan Puja invites peace, harmony, and positivity into your living space. The ceremony features the recitation of the five chapters of Sri Satyanarayan Vrat Katha, invoking Lord Vishnu to cleanse negative family energies, bless new ventures, and promote domestic stability.': 'सत्यनारायण पूजा करने से आपके रहने के स्थान में शांति, सद्भाव और सकारात्मकता आती है। इस समारोह में श्री सत्यनारायण व्रत कथा के पांच अध्यायों का पाठ शामिल है, जिसमें भगवान विष्णु से परिवार की नकारात्मक ऊर्जाओं को शुद्ध करने, नए उपक्रमों को आशीर्वाद देने और घरेलू स्थिरता को बढ़ावा देने का आह्वान किया जाता है।',
      'Mentioned in the Skanda Purana, this worship represents devotion to Satya (Truth) as the ultimate manifestation of Lord Vishnu, blessing the home with peaceful relations.': 'स्कंद पुराण में उल्लिखित, यह पूजा सत्य (सत्यता) के प्रति भक्ति का प्रतिनिधित्व करती है जो भगवान विष्णु का अंतिम रूप है, जिससे घर में शांतिपूर्ण संबंध बनते हैं।',
      '1. Prepare a clean wooden platform (chowki) in your home.\n2. Arrange seasonal fruits, coconut, and fresh flowers.\n3. The Acharya will connect online to recite the holy Katha chapters.': '1. अपने घर में एक साफ लकड़ी की चौकी तैयार करें।\n2. मौसमी फल, नारियल और ताजे फूलों की व्यवस्था करें।\n3. आचार्य जी पवित्र कथा अध्यायों का पाठ करने के लिए ऑनलाइन जुड़ेंगे।',
      'Panchadev Sthapana & Puja': 'पंचदेव स्थापना और पूजा',
      'Installing and invoking main deities.': 'मुख्य देवताओं की स्थापना और आह्वान।',
      'Satyanarayan Katha Recitation': 'सत्यनारायण कथा वाचन',
      'Five chapters narrating Satyanarayan benefits.': 'सत्यनारायण पूजा के लाभों का वर्णन करने वाले पांच अध्याय।',
      'Vishnu Sahasranama Chanting': 'विष्णु सहस्रनाम पाठ',
      'Reciting 1000 names of Lord Vishnu.': 'भगवान विष्णु के 1000 नामों का पाठ।',
      'Havan & Prasad Distribution': 'हवन और प्रसाद वितरण',
      'Offering wheat Panjiri and final fire arati.': 'गेहूं की पंजीरी और अंतिम अग्नि आरती की पेशकश।',
      'Sacred Tulsi Leaves': 'पवित्र तुलसी पत्र',
      '51 Leaves': '51 पत्ते',
      "Deity's favorite herbal offering.": 'देवताओं का पसंदीदा हर्बल प्रसाद।',
      'Chana Dal & Haldi Powder': 'चना दाल और हल्दी पाउडर',
      '100g each': '100 ग्राम प्रत्येक',
      'Auspicious yellow color elements.': 'शुभ पीले रंग के तत्व।',
      'Natural Sandalwood Paste': 'प्राकृतिक चंदन का पेस्ट',
      'Fragrant paste for deity decoration.': 'देवता श्रृंगार के लिए सुगंधित पेस्ट।',
      'Wheat Flour Prasad (Panjiri)': 'गेहूं के आटे का प्रसाद (पंजीरी)',
      'Traditional Satyanarayan roasted offering.': 'पारंपरिक सत्यनारायण भुना हुआ प्रसाद।',
      'Pandit Ramakant Joshi': 'पंडित रमाकांत जोशी',
      '12 Years': '12 वर्ष',
      'A traditional Uttarakhand Pandit specializing in Vishnu Stotras and monthly household vrat ceremonies.': 'एक पारंपरिक उत्तराखंड के पंडित जो विष्णु स्तोत्र और मासिक घरेलू व्रत समारोहों में विशेषज्ञता रखते हैं।',
      'Karma Kanda Acharya': 'कर्मकांड आचार्य',
      'Can I perform this on any day?': 'क्या मैं इसे किसी भी दिन कर सकता हूँ?',
      'While Purnima is highly auspicious, it can be performed on any day to bring harmony.': 'हालांकि पूर्णिमा अत्यधिक शुभ होती है, लेकिन सद्भाव लाने के लिए इसे किसी भी दिन किया जा सकता है।',
      'Badrinath Prasad Purity Seal': 'बद्रीनाथ प्रसाद शुद्धता मुहर',
      'Himalayan Pujas Board': 'हिमालयन पूजा बोर्ड',
      // General / Maha Pooja
      'Sacred Maha Pooja': 'पवित्र महा पूजा',
      'Maha Pooja': 'महा पूजा',
      'Energized Vedic worship for prosperity and health': 'समृद्धि और स्वास्थ्य के लिए अभिमंत्रित वैदिक पूजा',
      'Perform this premium blessed ritual to invoke positive cosmic vibrations.': 'सकारात्मक ब्रह्मांडीय तरंगों का आह्वान करने के लिए इस प्रीमियम अभिमंत्रित अनुष्ठान को करें।',
      'This sacred ritual is performed by experienced Vedic priests under strict guidelines. It clears obstacles and brings divine harmony to your household.': 'यह पवित्र अनुष्ठान अनुभवी वैदिक पंडितों द्वारा सख्त नियमों के तहत किया जाता है। यह बाधाओं को दूर करता है और आपके परिवार में दिव्य सद्भाव लाता है।',
      'According to the ancient scriptures, performing this ritual alignment cleanses negative energies and invokes divine blessings.': 'प्राचीन शास्त्रों के अनुसार, इस अनुष्ठान को करने से नकारात्मक ऊर्जाएं शुद्ध होती हैं और दिव्य आशीर्वाद प्राप्त होता है।',
      '1. Enter the full name and Nakshatra of the performer.\n2. Keep a copper vessel with fresh water ready.\n3. The priest will call you at the scheduled time to take Sankalpa.': '1. साधक का पूरा नाम और नक्षत्र दर्ज करें।\n2. ताजे पानी से भरा तांबे का पात्र तैयार रखें।\n3. संकल्प के लिए निर्धारित समय पर पंडित जी आपसे संपर्क करेंगे।',
      'Ganesh Sthapana & Puja': 'गणेश स्थापना और पूजा',
      'Invoking Lord Ganesha to remove obstacles.': 'बाधाओं को दूर करने के लिए भगवान गणेश का आह्वान।',
      'Mantra Jaap & Archana': 'मंत्र जाप और अर्चना',
      'Chanting divine mantras with offerings of flowers.': 'फूलों के चढ़ावे के साथ दिव्य मंत्रों का जाप।',
      '15 Mins': '15 मिनट',
      '45 Mins': '45 मिनट',
      'Gangajal': 'गंगाजल',
      'Vedic Herbs (Havan Samagri)': 'वैदिक जड़ी-बूटियाँ (हवन सामग्री)',
      'Acharya Rajesh Shastri': 'आचार्य राजेश शास्त्री',
      '15+ Years': '15+ वर्ष',
      'Highly trained scholar from Banaras Hindu University specializing in Rigveda rituals.': 'बनारस हिंदू विश्वविद्यालय से उच्च प्रशिक्षित विद्वान, जो ऋग्वेद अनुष्ठानों में विशेषज्ञ हैं।',
      'Vedic Acharya': 'वैदिक आचार्य',
      'Will I get the Prasad?': 'क्या मुझे प्रसाद मिलेगा?',
      'Yes, the energized Prasad will be shipped directly to your delivery address.': 'हाँ, सिद्ध प्रसाद सीधे आपके वितरण पते पर भेज दिया जाएगा।',
      'Can I attend the puja online?': 'हाँ, दूरस्थ उपस्थित लोगों के लिए एक सुरक्षित वीडियो कॉलिंग लिंक प्रदान किया जाता है।',
      'Vedic Blessed': 'वैदिक आशीर्वाद प्राप्त',
      // Additional
      'This sacred ritual possesses deep Vedic significance. Recitation of its mantras brings deep peace, spiritual elevation, and divine blessings to the home.': 'इस पवित्र अनुष्ठान का गहरा वैदिक महत्व है। इसके मंत्रों का पाठ घर में गहरी शांति, आध्यात्मिक उन्नति और दैवीय आशीर्वाद लाता है।',
      'Describe the activities performed in this Vedic ritual step...': 'इस वैदिक अनुष्ठान चरण में की जाने वाली गतिविधियों का वर्णन करें...',
      'Explain significance/origin...': 'महत्व/उत्पत्ति स्पष्ट करें...',
      'Provide devotee booking and performance instructions...': 'श्रद्धालु बुकिंग और अनुष्ठान निर्देश प्रदान करें...',
      'Write a short spiritual bio of the priest...': 'पंडित जी का एक संक्षिप्त आध्यात्मिक जीवन परिचय लिखें...',
      'FAQ Question': 'FAQ प्रश्न',
      'FAQ Answer': 'FAQ उत्तर',
      '1 Unit': '1 नग',
      'Sacred material blessed during the pooja.': 'पूजा के दौरान अभिमंत्रित पवित्र सामग्री।'
    };
    return dictionary[text.trim()] || text;
  };

  const resolveMediaUrlLocal = (url?: string) => {
    if (resolveMediaUrl && url) {
      return resolveMediaUrl(url);
    }
    return url || '';
  };
  const activeProducts = productsProp || [];
  const isVidyaRudraksh = (product.name?.toLowerCase().includes('vidya') || product.name?.includes('विद्या')) && (product.name?.toLowerCase().includes('rudraksh') || product.name?.includes('रुद्राक्ष') || product.category?.toLowerCase() === 'rudraksha' || product.category === 'रुद्राक्ष');
  const isOneRupeeProd = product.price === 1 || isVidyaRudraksh;
  const [activeTab, setActiveTab] = React.useState<'specs' | 'shipping'>('specs');
  const [quantity, setQuantity] = React.useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = React.useState<number>(0);
  const [showShareToast, setShowShareToast] = React.useState<boolean>(false);
  const [activeToastMsg, setActiveToastMsg] = React.useState<string>('');
  const [expandedFaqIndex, setExpandedFaqIndex] = React.useState<number | null>(null);
  const [isCapturingThumbnail, setIsCapturingThumbnail] = React.useState<boolean>(false);

  const [zoomLevel, setZoomLevel] = React.useState<number>(1);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = React.useState<number>(0);
  const [duration, setDuration] = React.useState<number>(0);
  const [_isPlaying, setIsPlaying] = React.useState<boolean>(true);

  React.useEffect(() => {
    setZoomLevel(1);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
  }, [activeImageIndex]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handlePipOrFullscreen = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else if (videoRef.current.requestPictureInPicture) {
          await videoRef.current.requestPictureInPicture();
        } else if ((videoRef.current as any).webkitEnterFullscreen) {
          (videoRef.current as any).webkitEnterFullscreen();
        } else {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
          } else {
            await videoRef.current.parentElement?.requestFullscreen();
          }
        }
      } catch (err) {
        console.error("Error handling PiP or fullscreen:", err);
      }
    }
  };

  const formatVideoTime = (seconds: number) => {
    if (isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Dynamic live viewers and countdown timer state hooks
  const [viewersCount, setViewersCount] = React.useState(47);
  const [timeLeft, setTimeLeft] = React.useState('');

  React.useEffect(() => {
    // Viewer fluctuation interval
    const viewerInterval = setInterval(() => {
      setViewersCount(prev => {
        const delta = Math.floor(Math.random() * 7) - 3;
        const newCount = prev + delta;
        return Math.max(32, Math.min(78, newCount));
      });
    }, 4000);

    // Countdown to midnight timer update
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(23, 59, 59, 999);
      const diff = midnight.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      const pad = (num: number) => String(num).padStart(2, '0');
      setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);

    return () => {
      clearInterval(viewerInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  // States for related products admin editor
  const [relatedSearch, setRelatedSearch] = React.useState('');
  const [relatedCategoryFilter, setRelatedCategoryFilter] = React.useState('All');

  // Lightbox overlay state
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  // Interactive review system states
  const [reviews, setReviews] = React.useState<Array<{ id: string; author: string; name?: string; rating: number; date: string; content: string; comment?: string; location?: string; verified: boolean; imageUrls?: string[]; videoUrls?: string[] }>>(() => {
    const pooja = product as PoojaProduct;
    if (pooja.testimonials && pooja.testimonials.length > 0) {
      return pooja.testimonials.map((t: any, idx: number) => {
        const stableId = t.id || `r-db-${idx}-${(t.author || t.name || 'anon').replace(/\s+/g, '-')}`;
        const authorVal = t.author || t.name || 'Anonymous Devotee';
        const contentVal = t.content || t.comment || '';
        const ratingVal = t.rating !== undefined ? Number(t.rating) : 5;
        const locationVal = t.location || (t.date && t.date.includes(' – ') ? t.date.split(' – ')[1] : t.date) || '';
        const dateVal = t.date || (t.location ? `May 10, 2026 – ${t.location}` : 'May 10, 2026');
        return {
          id: stableId,
          author: authorVal,
          name: authorVal,
          rating: ratingVal,
          date: dateVal,
          location: locationVal,
          content: contentVal,
          comment: contentVal,
          verified: t.verified !== undefined ? t.verified : true,
          imageUrls: Array.isArray(t.imageUrls) ? t.imageUrls : (t.imageUrl ? [t.imageUrl] : []),
          videoUrls: Array.isArray(t.videoUrls) ? t.videoUrls : (t.videoUrl ? [t.videoUrl] : [])
        };
      });
    }
    try {
      const stored = localStorage.getItem(`ridae_product_reviews_${product.id}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return initialReviews[product.id] || [];
  });
  const [reviewName, setReviewName] = React.useState('');
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewComment, setReviewComment] = React.useState('');
  const [reviewLocation, setReviewLocation] = React.useState('');
  const [editingReviewId, setEditingReviewId] = React.useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  // Media upload states for reviews (Cloudflare R2 integration)
  const [tempImageUrls, setTempImageUrls] = React.useState<string[]>([]);
  const [tempVideoUrls, setTempVideoUrls] = React.useState<string[]>([]);
  const [uploadingReviewImage, setUploadingReviewImage] = React.useState(false);
  const [uploadingReviewVideo, setUploadingReviewVideo] = React.useState(false);

  const [reviewsHidden, setReviewsHidden] = React.useState<boolean>(() => {
    const pooja = product as PoojaProduct;
    if (pooja.uiLabels && pooja.uiLabels.reviewsHidden !== undefined) {
      return pooja.uiLabels.reviewsHidden === 'true';
    }
    return localStorage.getItem(`ridae_reviews_hidden_${product.id}`) === 'true';
  });

  const handleToggleReviewsHidden = () => {
    const newState = !reviewsHidden;
    setReviewsHidden(newState);
    localStorage.setItem(`ridae_reviews_hidden_${product.id}`, String(newState));
    triggerToast(newState ? "Reviews section is now hidden from customers." : "Reviews section is now visible to customers.");
    
    if (onUpdate) {
      const existingLabels = pooja.uiLabels || {};
      onUpdate({
        uiLabels: {
          ...existingLabels,
          reviewsHidden: newState ? 'true' : 'false'
        }
      });
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    const updated = reviews.filter(r => r.id !== reviewId);
    setReviews(updated);
    triggerToast("Review deleted successfully.");
    if (onUpdate) {
      onUpdate({ testimonials: updated });
    }
  };

  React.useEffect(() => {
    localStorage.setItem(`ridae_product_reviews_${product.id}`, JSON.stringify(reviews));
  }, [reviews, product.id]);

  React.useEffect(() => {
    const pooja = product as PoojaProduct;
    let initialRevs: any[] = [];
    if (pooja.testimonials && pooja.testimonials.length > 0) {
      initialRevs = pooja.testimonials.map((t: any, idx: number) => {
        const stableId = t.id || `r-db-${idx}-${(t.author || t.name || 'anon').replace(/\s+/g, '-')}`;
        const authorVal = t.author || t.name || 'Anonymous Devotee';
        const contentVal = t.content || t.comment || '';
        const ratingVal = t.rating !== undefined ? Number(t.rating) : 5;
        const locationVal = t.location || (t.date && t.date.includes(' – ') ? t.date.split(' – ')[1] : t.date) || '';
        const dateVal = t.date || (t.location ? `May 10, 2026 – ${t.location}` : 'May 10, 2026');
        return {
          id: stableId,
          author: authorVal,
          name: authorVal,
          rating: ratingVal,
          date: dateVal,
          location: locationVal,
          content: contentVal,
          comment: contentVal,
          verified: t.verified !== undefined ? t.verified : true,
          imageUrls: Array.isArray(t.imageUrls) ? t.imageUrls : (t.imageUrl ? [t.imageUrl] : []),
          videoUrls: Array.isArray(t.videoUrls) ? t.videoUrls : (t.videoUrl ? [t.videoUrl] : [])
        };
      });
    } else {
      try {
        const stored = localStorage.getItem(`ridae_product_reviews_${product.id}`);
        if (stored) {
          initialRevs = JSON.parse(stored);
        } else {
          initialRevs = initialReviews[product.id] || [];
        }
      } catch (e) {
        console.error(e);
        initialRevs = initialReviews[product.id] || [];
      }
    }
    setReviews(initialRevs);

    let isHidden = false;
    if (pooja.uiLabels && pooja.uiLabels.reviewsHidden !== undefined) {
      isHidden = pooja.uiLabels.reviewsHidden === 'true';
    } else {
      isHidden = localStorage.getItem(`ridae_reviews_hidden_${product.id}`) === 'true';
    }
    setReviewsHidden(isHidden);

    setReviewName('');
    setReviewRating(5);
    setReviewComment('');
    setReviewLocation('');
    setTempImageUrls([]);
    setTempVideoUrls([]);
    setEditingReviewId(null);
  }, [product.id, (product as PoojaProduct).testimonials, (product as PoojaProduct).uiLabels]);

  // Dynamic Pricing Updates
  const singleItemPrice = product.price;
  const totalPrice = singleItemPrice * quantity;
  const originalItemPrice = product.originalPrice || null;
  const discountPct = originalItemPrice ? Math.round(((originalItemPrice - singleItemPrice) / originalItemPrice) * 100) : 0;

  const pooja = product as PoojaProduct;
  const isRealUrl = (url?: string) => isImageUrl(url);

  // Gallery images mock
  const categoryGradients: Record<string, string> = {
    'rudraksha': 'linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 100%)',
    'tulsi mala': 'linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 100%)',
    'crystal mala': 'linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 100%)',
    'shiva murti': 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    'ganesh murti': 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    'hanuman murti': 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    'lakshmi murti': 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    'default': 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
  };

  const selectedGradient = categoryGradients[product.category.toLowerCase()] || categoryGradients['default'];

  // Gallery images resolver
  const resolvedGallery = React.useMemo(() => {
    let list: Array<{ url: string; alt: string; isEmoji: boolean; gradient: string; isVideo?: boolean; thumbnail?: string }> = [];
    if (pooja.galleryImages && pooja.galleryImages.length > 0) {
      list = pooja.galleryImages.map(img => {
        let thumb = (img as any).thumbnail;
        if (!thumb && img.url && img.url.includes('cloudflarestream.com')) {
          const match = img.url.match(/https:\/\/customer-([a-f0-9]+)\.cloudflarestream\.com\/([a-f0-9]+)\/iframe/);
          if (match) {
            const [, accountId, videoId] = match;
            thumb = `https://customer-${accountId}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg?height=120`;
          }
        }
        return {
          url: resolveMediaUrlLocal(img.url),
          alt: img.alt || pooja.name,
          isEmoji: false,
          gradient: 'none',
          isVideo: (img as any).isVideo || false,
          thumbnail: thumb ? resolveMediaUrlLocal(thumb) : undefined
        };
      });
    } else {
      list = [
        { url: resolveMediaUrlLocal(product.image), alt: product.name, isEmoji: !isRealUrl(product.image), gradient: selectedGradient, isVideo: false },
        { url: resolveMediaUrlLocal(product.image), alt: product.name, isEmoji: !isRealUrl(product.image), gradient: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', isVideo: false },
        { url: '🕉️', alt: 'Om', isEmoji: true, gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', isVideo: false }
      ];
    }

    // Auto-append legacy video if present
    const poojaProd = product as PoojaProduct;
    if (poojaProd.videoUrl) {
      let legacyThumb = poojaProd.uiLabels?.videoThumbnail;
      if (!legacyThumb && poojaProd.videoUrl.includes('cloudflarestream.com')) {
        const match = poojaProd.videoUrl.match(/https:\/\/customer-([a-f0-9]+)\.cloudflarestream\.com\/([a-f0-9]+)\/iframe/);
        if (match) {
          const [, accountId, videoId] = match;
          legacyThumb = `https://customer-${accountId}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg?height=120`;
        }
      }
      list.push({
        url: resolveMediaUrlLocal(poojaProd.videoUrl),
        alt: 'Product Video',
        isEmoji: false,
        gradient: 'none',
        isVideo: true,
        thumbnail: legacyThumb ? resolveMediaUrlLocal(legacyThumb) : undefined
      });
    }
    return list;
  }, [product, pooja, selectedGradient, resolveMediaUrl]);

  // Keyboard navigation for Lightbox
  React.useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex(prev => (prev !== null ? (prev - 1 + resolvedGallery.length) % resolvedGallery.length : null));
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex(prev => (prev !== null ? (prev + 1) % resolvedGallery.length : null));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, resolvedGallery.length]);

  // Swipe Handlers for mobile gallery finger scroll
  const touchStartX = React.useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) {
      setActiveImageIndex((prev) => (prev + 1) % resolvedGallery.length);
    } else if (diff < -50) {
      setActiveImageIndex((prev) => (prev - 1 + resolvedGallery.length) % resolvedGallery.length);
    }
    touchStartX.current = null;
  };

  // Auto-scroll images every 7 seconds, resetting timer on active index transition
  React.useEffect(() => {
    if (resolvedGallery.length <= 1) return;
    
    // Do not auto-scroll if the current active item is a video
    const currentItem = resolvedGallery[activeImageIndex];
    if (currentItem?.isVideo) return;

    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % resolvedGallery.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [activeImageIndex, resolvedGallery.length, resolvedGallery]);

  // Resolve explicit related products first, then fallback to automatic ones
  const resolvedRelated = React.useMemo(() => {
    if (pooja.relatedProducts && pooja.relatedProducts.length > 0) {
      return activeProducts.filter(p => pooja.relatedProducts!.includes(p.id));
    }
    // Fallback: automatic matching
    const categoryRelated = activeProducts.filter(p => p.id !== product.id && p.category === product.category);
    if (categoryRelated.length > 0) {
      return categoryRelated.slice(0, 3);
    }
    return activeProducts.filter(p => p.id !== product.id && p.spiritualType === product.spiritualType).slice(0, 3);
  }, [pooja.relatedProducts, activeProducts, product.id, product.category, product.spiritualType]);

  const handleAddToCartClick = () => {
    // Add quantity items
    const customProduct = {
      ...product,
      price: singleItemPrice,
      originalPrice: originalItemPrice || undefined
    };
    onAddToCart(customProduct, quantity);
    triggerToast(`Added ${quantity} item(s) to cart successfully!`);
  };

  const handleBuyNowClick = () => {
    const customProduct = {
      ...product,
      price: singleItemPrice,
      originalPrice: originalItemPrice || undefined
    };
    if (onBuyNow) {
      onBuyNow(customProduct, quantity);
    } else {
      onAddToCart(customProduct, quantity);
      onBackToShop(); // Navigate to shop or prompt checkout
      triggerToast("Redirecting you to cart...");
    }
  };

  const handleShareClick = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      triggerToast("Product link copied to clipboard!");
    }).catch(() => {
      triggerToast("Sharing enabled! Copy the browser URL to share.");
    });
  };

  const triggerToast = (msg: string) => {
    setActiveToastMsg(msg);
    setShowShareToast(true);
    setTimeout(() => {
      setShowShareToast(false);
    }, 3000);
  };

  const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingReviewImage(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadToR2(file, 'reviews/images');
        urls.push(url);
      }
      setTempImageUrls(prev => [...prev, ...urls]);
      triggerToast("Review images uploaded successfully to Cloudflare R2!");
    } catch (err) {
      console.error(err);
      alert("Image upload failed: " + (err as Error).message);
    } finally {
      setUploadingReviewImage(false);
    }
  };

  const handleReviewVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingReviewVideo(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('video/') && file.size > 5 * 1024 * 1024) {
          alert(`Warning: The video "${file.name}" is large (${(file.size / (1024 * 1024)).toFixed(1)} MB). For a smooth experience for devotees on slower internet connections, please compress it to under 3-5 MB before uploading.`);
        }
        const url = await uploadToR2(file, 'reviews/videos');
        urls.push(url);
      }
      setTempVideoUrls(prev => [...prev, ...urls]);
      triggerToast("Review videos uploaded successfully to Cloudflare R2!");
    } catch (err) {
      console.error(err);
      alert("Video upload failed: " + (err as Error).message);
    } finally {
      setUploadingReviewVideo(false);
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;

    const locationText = reviewLocation.trim() ? ` – ${reviewLocation.trim()}` : '';
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });

    let updated = [];
    if (editingReviewId) {
      updated = reviews.map(rev => {
        if (rev.id === editingReviewId) {
          const originalDateStr = rev.date.split(' – ')[0] || dateStr;
          const authorVal = reviewName.trim();
          const contentVal = reviewComment.trim();
          const locationVal = reviewLocation.trim();
          const dateVal = `${originalDateStr}${locationText}`;
          return {
            ...rev,
            author: authorVal,
            name: authorVal,
            rating: reviewRating,
            date: dateVal,
            location: locationVal || originalDateStr,
            content: contentVal,
            comment: contentVal,
            imageUrls: [...tempImageUrls],
            videoUrls: [...tempVideoUrls]
          };
        }
        return rev;
      });
      setEditingReviewId(null);
      triggerToast("Review updated successfully.");
    } else {
      const authorVal = reviewName.trim();
      const contentVal = reviewComment.trim();
      const locationVal = reviewLocation.trim();
      const dateVal = `${dateStr}${locationText}`;
      const newRev = {
        id: 'r-user-' + Date.now(),
        author: authorVal,
        name: authorVal,
        rating: reviewRating,
        date: dateVal,
        location: locationVal || dateStr,
        content: contentVal,
        comment: contentVal,
        verified: true,
        imageUrls: [...tempImageUrls],
        videoUrls: [...tempVideoUrls]
      };
      updated = [newRev, ...reviews];
      triggerToast("Thank you! Review submitted successfully.");
    }

    setReviews(updated);
    setReviewName('');
    setReviewComment('');
    setReviewLocation('');
    setTempImageUrls([]);
    setTempVideoUrls([]);

    if (onUpdate) {
      onUpdate({ testimonials: updated });
    }
  };

  // Drag and Drop reordering for gallery images
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!editable || !pooja.galleryImages || index >= pooja.galleryImages.length) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!editable || !pooja.galleryImages || index >= pooja.galleryImages.length) return;
    if (draggedIndex === null || draggedIndex === index) return;
    e.preventDefault(); // Required to drop!
  };

  const handleDrop = (targetIndex: number) => {
    if (!editable || !pooja.galleryImages || targetIndex >= pooja.galleryImages.length) return;
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const list = [...pooja.galleryImages];
    const draggedItem = list[draggedIndex];
    list.splice(draggedIndex, 1);
    list.splice(targetIndex, 0, draggedItem);

    const updates: Partial<PoojaProduct> = { galleryImages: list };
    if (list.length > 0) {
      updates.image = list[0].url;
    }
    onUpdate && onUpdate(updates);
    setActiveImageIndex(targetIndex);
    setDraggedIndex(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedIndex(null);
    e.currentTarget.classList.remove('dragging');
  };

  const specs = {
    material: pooja.material || productSpecs[product.category]?.material || 'Premium Sacred Material',
    weight: pooja.weight || productSpecs[product.category]?.weight || 'Weight varies by variant selection',
    dimensions: pooja.dimensions || productSpecs[product.category]?.dimensions || 'Standard Devotional Size',
    origin: pooja.origin || productSpecs[product.category]?.origin || 'Himalayan Foothills, India'
  };

  const renderSectionHeaderIcon = (section: keyof NonNullable<PoojaProduct['customIcons']>, defaultIcon: React.ReactNode) => {
    const customIconUrl = pooja.customIcons?.[section];
    const iconId = `upload-section-icon-${section}`;

    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px' }}>
        {customIconUrl ? (
          <img
            src={getDisplayImageUrl(customIconUrl)}
            alt={`${section} icon`}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--primary-lime, #84cc16)',
              boxShadow: 'var(--shadow-sm)'
            }}
          />
        ) : (
          defaultIcon
        )}

        {editable && (
          <>
            <label
              htmlFor={iconId}
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: 'rgba(249, 115, 22, 0.95)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                zIndex: 10,
                transition: 'all 0.2s',
              }}
              title="Change Section Icon"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              📷
            </label>
            <input
              id={iconId}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file && onUpdate) {
                  try {
                    const cdnUrl = onFileSelect ? await onFileSelect(file, `section-icons-${section}`) : await uploadToR2(file, `section-icons-${section}`);
                    const existingIcons = pooja.customIcons || {};
                    onUpdate({
                      customIcons: {
                        ...existingIcons,
                        [section]: cdnUrl
                      }
                    });
                  } catch (err) {
                    alert('Upload failed: ' + (err as Error).message);
                  }
                }
              }}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="product-detail-wrapper-spacing" style={{ paddingBottom: '80px', backgroundColor: isVidyaRudraksh ? '#ffffff' : '#fafafa', background: isVidyaRudraksh ? '#ffffff' : '#fafafa', position: 'relative' }}>

      {/* Embedded badge keyframe styles & marquee styles */}
      <style>{`
        /* Custom input range styling */
        .zoom-slider-range, .video-progress-range {
          -webkit-appearance: none;
          appearance: none;
          background: rgba(0, 0, 0, 0.15);
          border-radius: 2px;
          outline: none;
        }
        .zoom-slider-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: 1px solid rgba(0,0,0,0.15);
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .zoom-slider-range::-moz-range-thumb {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: 1px solid rgba(0,0,0,0.15);
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .video-progress-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          border: none;
        }
        .video-progress-range::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          border: none;
        }

        /* Marquee scrolling animation */
        .announcement-marquee-wrapper {
          display: flex;
          width: max-content;
          animation: marquee-scroll 22s linear infinite;
        }
        .announcement-marquee {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: space-around;
          min-width: 100%;
          gap: 40px;
        }
        @keyframes marquee-scroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes pulse-red {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.4; }
        }
        .animate-pulse-red {
          animation: pulse-red 1.5s infinite ease-in-out;
        }
        .product-price-container {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        @media (max-width: 480px) {
          .product-price-container {
            padding: 10px 12px !important;
            gap: 8px !important;
            flex-wrap: nowrap !important;
          }
          .product-price-container .highlight-price-flash {
            font-size: 1.8rem !important;
          }
        }
        .highlight-price-flash {
          font-weight: 900;
          color: #b91c1c !important;
          animation: price-pulse 1.5s infinite ease-in-out;
          display: inline-block;
        }
        @keyframes price-pulse {
          0%, 100% { transform: scale(1); text-shadow: 0 0 4px rgba(185, 28, 28, 0.2); }
          50% { transform: scale(1.06); text-shadow: 0 0 12px rgba(185, 28, 28, 0.5); color: #dc2626 !important; }
        }
        .btn-buy-now-saffron-glass {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
          color: #ffffff !important;
          position: relative !important;
          overflow: hidden !important;
          box-shadow: 0 4px 14px rgba(234, 88, 12, 0.45) !important;
          border: none !important;
          transition: transform 0.2s, box-shadow 0.2s !important;
        }
        .btn-buy-now-saffron-glass:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(234, 88, 12, 0.65) !important;
        }
        .btn-buy-now-saffron-glass::after {
          content: '' !important;
          position: absolute !important;
          top: -50% !important;
          left: -60% !important;
          width: 30% !important;
          height: 200% !important;
          background: rgba(255, 255, 255, 0.45) !important;
          transform: rotate(30deg) !important;
          animation: glass-shimmer 2.2s infinite linear !important;
          pointer-events: none !important;
        }
        @keyframes glass-shimmer {
          0% { left: -60%; }
          30% { left: 140%; }
          100% { left: 140%; }
        }
        .limited-offer-badge {
          background-color: #ef4444;
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 2.5px 8px;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
          animation: pulse-limited-offer 1.2s infinite ease-in-out;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        @keyframes pulse-limited-offer {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.05); opacity: 1; filter: brightness(1.15); }
        }
        @keyframes clock-vibrate {
          0%, 85%, 100% { transform: translate(0, 0) rotate(0deg); }
          88% { transform: translate(-2px, -1px) rotate(-8deg); }
          91% { transform: translate(2px, 1px) rotate(8deg); }
          94% { transform: translate(-2px, 1px) rotate(-8deg); }
          97% { transform: translate(2px, -1px) rotate(8deg); }
        }
        .product-detail-title {
          font-size: 2rem;
        }
        @media (max-width: 768px) {
          .product-detail-title {
            font-size: 1.7rem;
          }
        }
        @media (max-width: 480px) {
          .product-detail-title {
            font-size: 1.45rem;
          }
        }
        .vidya-live-badges-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 14px;
        }
        .location-badge-container {
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: rgba(239, 68, 68, 0.05);
          border: 1.5px solid rgba(239, 68, 68, 0.25);
          border-radius: 12px;
          padding: 10px 16px;
          margin-bottom: 16px;
          text-align: left;
        }
        .location-badge-text {
          font-size: 0.88rem;
          font-weight: 700;
          color: #b91c1c;
          line-height: 1.4;
        }
        .badge-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background-color: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: var(--radius-full);
          padding: 6px 16px 6px 8px;
          font-size: 0.85rem;
          font-weight: 800;
          color: #059669;
          box-shadow: var(--shadow-sm);
          white-space: nowrap;
        }
        .badge-live-pill-orange {
          background-color: rgba(245, 158, 11, 0.06);
          border: 1px solid rgba(245, 158, 11, 0.25);
          color: #d97706;
        }
        @media (max-width: 480px) {
          .vidya-live-badges-row {
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          .location-badge-container {
            padding: 8px 12px !important;
            margin-bottom: 12px !important;
            gap: 8px !important;
          }
          .location-badge-text {
            font-size: 0.76rem !important;
          }
          .badge-icon-pin-container {
            width: 22px !important;
            height: 22px !important;
          }
          .badge-icon-pin-container svg {
            width: 12px !important;
            height: 12px !important;
          }
          .badge-live-pill {
            flex: 1;
            justify-content: center;
            padding: 4px 6px !important;
            font-size: 0.68rem !important;
            gap: 4px !important;
          }
          .badge-icon-live-container, .badge-icon-clock-container {
            width: 20px !important;
            height: 20px !important;
          }
          .badge-icon-live-container svg, .badge-icon-clock-container svg {
            width: 10px !important;
            height: 10px !important;
          }
        }
        @keyframes radar-ping-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes pin-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .badge-icon-pin-container {
          animation: radar-ping-red 2s infinite ease-in-out;
          background-color: rgba(239, 68, 68, 0.15);
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .badge-icon-pin-container svg {
          animation: pin-bounce 1.5s infinite ease-in-out;
          transform-origin: center;
        }
        @keyframes radar-ping-green {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes radar-ping-orange {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.5); }
          70% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
        @keyframes eye-blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.2); }
        }
        .badge-icon-live-container {
          animation: radar-ping-green 2s infinite ease-in-out;
          background-color: rgba(16, 185, 129, 0.15);
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .badge-icon-live-container svg {
          animation: eye-blink 3s infinite ease-in-out;
          transform-origin: center;
        }
        .badge-icon-clock-container {
          animation: radar-ping-orange 2s infinite ease-in-out;
          background-color: rgba(245, 158, 11, 0.15);
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .badge-icon-clock-container svg {
          animation: clock-vibrate 3s infinite ease-in-out;
          transform-origin: center;
        }
      `}</style>

      {/* Marquee Announcement Bar */}
      <div style={{
        backgroundColor: '#ea580c',
        color: '#ffffff',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        padding: '10px 0',
        fontSize: '0.88rem',
        fontWeight: 800,
        boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
        marginBottom: '16px'
      }}>
        <div className="announcement-marquee-wrapper">
          <div className="announcement-marquee">
            <span>{isHindi ? '⚡ माता-पिता के लिए विशेष ₹1 ऑफर, अभी ₹1 में ऑर्डर करें ⚡' : '⚡ Special ₹1 offer for parents, Order Now at ₹1 ⚡'}</span>
            <span>{isHindi ? '⚡ माता-पिता के लिए विशेष ₹1 ऑफर, अभी ₹1 में ऑर्डर करें ⚡' : '⚡ Special ₹1 offer for parents, Order Now at ₹1 ⚡'}</span>
            <span>{isHindi ? '⚡ माता-पिता के लिए विशेष ₹1 ऑफर, अभी ₹1 में ऑर्डर करें ⚡' : '⚡ Special ₹1 offer for parents, Order Now at ₹1 ⚡'}</span>
            <span>{isHindi ? '⚡ माता-पिता के लिए विशेष ₹1 ऑफर, अभी ₹1 में ऑर्डर करें ⚡' : '⚡ Special ₹1 offer for parents, Order Now at ₹1 ⚡'}</span>
          </div>
          <div className="announcement-marquee">
            <span>{isHindi ? '⚡ माता-पिता के लिए विशेष ₹1 ऑफर, अभी ₹1 में ऑर्डर करें ⚡' : '⚡ Special ₹1 offer for parents, Order Now at ₹1 ⚡'}</span>
            <span>{isHindi ? '⚡ माता-पिता के लिए विशेष ₹1 ऑफर, अभी ₹1 में ऑर्डर करें ⚡' : '⚡ Special ₹1 offer for parents, Order Now at ₹1 ⚡'}</span>
            <span>{isHindi ? '⚡ माता-पिता के लिए विशेष ₹1 ऑफर, अभी ₹1 में ऑर्डर करें ⚡' : '⚡ Special ₹1 offer for parents, Order Now at ₹1 ⚡'}</span>
            <span>{isHindi ? '⚡ माता-पिता के लिए विशेष ₹1 ऑफर, अभी ₹1 में ऑर्डर करें ⚡' : '⚡ Special ₹1 offer for parents, Order Now at ₹1 ⚡'}</span>
          </div>
        </div>
      </div>

      {/* Product Title & Info Header Block (Positioned above visual showcase) */}
      <header className="container" style={{ paddingTop: '24px', paddingBottom: '8px', textAlign: 'left' }}>
        {/* Category Tag */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            backgroundColor: 'var(--primary-lime-light)',
            color: 'var(--primary-lime)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)'
          }}>
            {isVidyaRudraksh ? (isHindi ? 'पढ़ाई और ध्यान' : 'Study & Focus') : product.spiritualType}
          </span>
        </div>

        {/* Title */}
        <h1 className="product-detail-title" style={{
          fontWeight: 900,
          color: 'var(--text-dark)',
          lineHeight: '1.2',
          marginBottom: '4px'
        }}>
          {isVidyaRudraksh ? (
            "Sandipani Ashram Se Siddh Vidya Rudraksh"
          ) : editable ? (
            <InlineEdit
              value={product.name}
              onChange={(val) => onUpdate && onUpdate({ name: val })}
              placeholder="Product Name"
            />
          ) : (
            product.name
          )}
        </h1>
      </header>

      {/* Devotional Sections Visibility Toolbar */}
      {editable && (
        <div className="container" style={{ marginBottom: '24px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(249, 115, 22, 0.18)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            boxShadow: '0 8px 32px 0 rgba(249, 115, 22, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>⚙️</span>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary-forest)' }}>
                Devotional Sections Visibility Control
              </span>
              <span style={{ fontSize: '0.72rem', color: '#f97316', fontWeight: 600, border: '1px solid rgba(249, 115, 22, 0.3)', padding: '1px 6px', borderRadius: '4px', marginLeft: 'auto' }}>
                Editor Mode
              </span>
            </div>

            {/* Classification & Category Selector Section */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '16px',
              borderBottom: '1px dashed rgba(249, 115, 22, 0.25)',
              paddingBottom: '12px',
              marginBottom: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem' }}>🗂️</span>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--primary-forest)' }}>Product Classification:</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Category:</span>
                <select
                  value={product.category}
                  onChange={(e) => onUpdate && onUpdate({ category: e.target.value })}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm, 4px)',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-dark)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    outline: 'none'
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Spiritual Type:</span>
                <select
                  value={product.spiritualType}
                  onChange={(e) => onUpdate && onUpdate({ spiritualType: e.target.value as any })}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm, 4px)',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-dark)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="Rituals">Rituals</option>
                  <option value="Meditation">Meditation</option>
                  <option value="Vastu">Vastu</option>
                  <option value="Wisdom">Wisdom</option>
                  <option value="Aromatherapy">Aromatherapy</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)' }}>
              {/* 1. Spiritual Significance */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!pooja.spiritualSignificance}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    onUpdate && onUpdate({
                      spiritualSignificance: checked ? "This sacred ritual possesses deep Vedic significance. Recitation of its mantras brings deep peace, spiritual elevation, and divine blessings to the home." : undefined
                    });
                  }}
                  style={{ accentColor: '#f97316' }}
                />
                Spiritual Significance
              </label>

              {/* 2. Rituals & Vedic Steps */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Array.isArray(pooja.ritualsIncluded) && pooja.ritualsIncluded.length > 0}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    onUpdate && onUpdate({
                      ritualsIncluded: checked ? [
                        { name: "Sankalpa (Sacred Vow)", description: "Expressing the devotee's name, lineage (gotra), and specific prayer intent before the deity.", duration: "10 mins" },
                        { name: "Mantra Recitation", description: "Recitation of sacred Vedic slokas and mantras for purifying the surroundings.", duration: "30 mins" }
                      ] : undefined
                    });
                  }}
                  style={{ accentColor: '#f97316' }}
                />
                Rituals & Vedic Steps
              </label>

              {/* 3. Sacred Samagri */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Array.isArray(pooja.samagriList) && pooja.samagriList.length > 0}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    onUpdate && onUpdate({
                      samagriList: checked ? [
                        { name: "Ganga Jal (Holy Water)", quantity: "1 Bottle", description: "Sacred purifying water sourced directly from Gangotri." },
                        { name: "Akshata (Sacred Rice)", quantity: "50 grams", description: "Unbroken rice grains mixed with pure turmeric powder." }
                      ] : undefined
                    });
                  }}
                  style={{ accentColor: '#f97316' }}
                />
                Sacred Samagri
              </label>

              {/* 4. Booking Guidelines */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!pooja.bookingInstructions}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    onUpdate && onUpdate({
                      bookingInstructions: checked ? "Please provide your Gotra, Nakshatra, and full names of family members at the time of booking. It is recommended to perform this ritual in clean traditional attire." : undefined
                    });
                  }}
                  style={{ accentColor: '#f97316' }}
                />
                Booking Guidelines
              </label>

              {/* 5. Assigned Priest */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!pooja.priestDetails && typeof pooja.priestDetails === 'object' && Object.keys(pooja.priestDetails).length > 0 && !!(pooja.priestDetails as any).name}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    onUpdate && onUpdate({
                      priestDetails: checked ? {
                        name: "Acharya Shastri",
                        experience: "15+ Years",
                        bio: "Vedic Scholar from Varanasi trained in Shukla Yajurveda rituals.",
                        qualification: "Acharya in Sanskrit & Vedic Liturgy"
                      } : undefined
                    });
                  }}
                  style={{ accentColor: '#f97316' }}
                />
                Assigned Priest
              </label>

              {/* 6. Authenticity & Certification */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Array.isArray(pooja.certificates) && pooja.certificates.length > 0}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    onUpdate && onUpdate({
                      certificates: checked ? [
                        { name: "Purity Seal & Energized Certification", issuer: "Vedic Purity Board", url: "" }
                      ] : undefined
                    });
                  }}
                  style={{ accentColor: '#f97316' }}
                />
                Authenticity & Certifications
              </label>

              {/* 7. FAQs */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Array.isArray(pooja.faqs) && pooja.faqs.length > 0}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    onUpdate && onUpdate({
                      faqs: checked ? [
                        { question: "How will I receive the blessings?", answer: "Sacred prasada (energized elements, threads, and sweets) will be shipped securely to your registered delivery address." }
                      ] : undefined
                    });
                  }}
                  style={{ accentColor: '#f97316' }}
                />
                FAQs
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Main Column Split */}
      <section className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: '40px',
          alignItems: 'start'
        }} className="hero-grid-split">

          {/* Left Column: Visual Showcase & Authenticity Badges */}
          <div className="product-image-sticky-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

            {/* Primary Image View */}
            <div 
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={() => {
                if (!editable && !resolvedGallery[activeImageIndex]?.isEmoji) {
                  setLightboxIndex(activeImageIndex);
                }
              }}
              style={{
                borderRadius: 'var(--radius-lg)',
                background: resolvedGallery[activeImageIndex] && resolvedGallery[activeImageIndex].gradient !== 'none' ? resolvedGallery[activeImageIndex].gradient : '#ffffff',
                width: '100%',
                aspectRatio: '1 / 1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border-light)',
                overflow: 'hidden',
                cursor: resolvedGallery[activeImageIndex]?.isEmoji ? 'default' : 'zoom-in',
              }}
            >
              {/* Floating Share Button on Image */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareClick();
                }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  zIndex: 25,
                  color: 'var(--text-dark)',
                  transition: 'all 0.2s',
                }}
                title="Share product"
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Share2 size={18} />
              </button>
              {!resolvedGallery[activeImageIndex]?.isEmoji && (
                <div
                  onClick={(e) => e.stopPropagation()} // Prevent trigger light-box toggle on track clicks
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '20px',
                    padding: '4px 8px 4px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: 'var(--shadow-sm)',
                    zIndex: 25,
                    color: 'var(--text-dark)',
                  }}
                >
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                    className="zoom-slider-range"
                    style={{
                      width: '80px',
                      height: '4px',
                      cursor: 'pointer',
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex(activeImageIndex);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      color: 'var(--text-dark)',
                      transition: 'background-color 0.2s',
                    }}
                    title="View full screen"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>
              )}
              {resolvedGallery[activeImageIndex] ? (
                resolvedGallery[activeImageIndex].isVideo ? (
                  resolvedGallery[activeImageIndex].url.includes('cloudflarestream.com') ? (
                    <iframe
                      src={`${resolvedGallery[activeImageIndex].url}?autoplay=true&loop=true&muted=true`}
                      style={{ border: 'none', backgroundColor: '#000000', width: '100%', height: '100%', transform: `scale(${zoomLevel})`, transition: 'transform 0.1s ease-out' }}
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      id="pooja-product-video-player"
                      src={resolvedGallery[activeImageIndex].url}
                      poster={resolvedGallery[activeImageIndex].thumbnail || undefined}
                      autoPlay
                      muted
                      loop={false}
                      playsInline
                      crossOrigin="anonymous"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoomLevel})`, transition: 'transform 0.1s ease-out', cursor: 'pointer' }}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onClick={togglePlay}
                      onEnded={() => {
                        setActiveImageIndex((prev) => (prev + 1) % resolvedGallery.length);
                      }}
                    />
                  )
                ) : resolvedGallery[activeImageIndex].isEmoji ? (
                  <span style={{ fontSize: '8rem', userSelect: 'none', filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.15))', transform: `scale(${zoomLevel})`, transition: 'transform 0.1s ease-out', display: 'inline-block' }}>
                    {resolvedGallery[activeImageIndex].url}
                  </span>
                ) : (
                  <img
                    src={getDisplayImageUrl(resolvedGallery[activeImageIndex].url)}
                    alt={resolvedGallery[activeImageIndex].alt}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${zoomLevel})`, transition: 'transform 0.1s ease-out' }}
                  />
                )
              ) : (
                <span style={{ fontSize: '1rem', color: '#9ca3af' }}>No image loaded</span>
              )}



              {/* Cloudflare R2 Upload Overlay when Editable */}
              {editable && !resolvedGallery[activeImageIndex]?.isVideo && (
                <>
                  <label
                    htmlFor={`detail-image-upload-${product.id}`}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      color: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      zIndex: 20
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                  >
                    <Upload size={24} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>Upload Image to R2</span>
                  </label>
                  <input
                    id={`detail-image-upload-${product.id}`}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && onUpdate) {
                        try {
                          const cdnUrl = onFileSelect ? await onFileSelect(file, 'products/gallery') : await uploadToR2(file, 'products/gallery');
                          if (pooja.galleryImages && pooja.galleryImages.length > 0) {
                            const updatedGallery = [...pooja.galleryImages];
                            updatedGallery[activeImageIndex] = { url: cdnUrl, alt: pooja.name };
                            const updates: any = { galleryImages: updatedGallery };
                            if (activeImageIndex === 0) {
                              updates.image = cdnUrl;
                            }
                            onUpdate(updates);
                          } else {
                            onUpdate({ image: cdnUrl, galleryImages: [{ url: cdnUrl, alt: pooja.name }] });
                          }
                        } catch (err) {
                          alert('Upload failed: ' + (err as Error).message);
                        }
                      }
                    }}
                  />
                </>
              )}

              {/* Authenticity Badge or Custom Video Controls */}
              {resolvedGallery[activeImageIndex]?.isVideo ? (
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '30px',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  zIndex: 25,
                }}>
                  {/* Embedded Authenticity Badge */}
                  <div style={{
                    backgroundColor: 'rgba(45, 20, 14, 0.95)',
                    color: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    flexShrink: 0,
                  }}>
                    <ShieldCheck size={14} style={{ color: 'var(--primary-lime)' }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                      {isHindi ? "100% मंदिर द्वारा अभिमंत्रित एवं सिद्ध" : "100% Temple Blessed & Energized"}
                    </span>
                  </div>

                  {/* Video Timeline / Progress Scrubber */}
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSliderChange}
                    className="video-progress-range"
                    style={{
                      flexGrow: 1,
                      height: '4px',
                      cursor: 'pointer',
                      background: `linear-gradient(to right, #ffffff ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) ${duration ? (currentTime / duration) * 100 : 0}%)`,
                    }}
                  />

                  {/* Time Display */}
                  <span style={{
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {duration ? `${formatVideoTime(currentTime)} / ${formatVideoTime(duration)}` : '--:--'}
                  </span>

                  {/* Action Buttons: Fullscreen & Next */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePipOrFullscreen();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        borderRadius: '50%',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="Toggle Fullscreen / PiP"
                    >
                      <Tv size={16} />
                    </button>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) => (prev + 1) % resolvedGallery.length);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        borderRadius: '50%',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="Next slide"
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  backgroundColor: 'rgba(45, 20, 14, 0.95)',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  zIndex: 10
                }}>
                  <ShieldCheck size={16} style={{ color: 'var(--primary-lime)' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px' }}>{isHindi ? "100% मंदिर द्वारा अभिमंत्रित एवं सिद्ध" : "100% Temple Blessed & Energized"}</span>
                </div>
              )}
            </div>

            {/* Global Compressor Widget for active gallery item */}
            {editable && resolvedGallery[activeImageIndex] && (pooja.galleryImages?.[activeImageIndex]?.url?.startsWith('temp-media-') || pooja.videoUrl?.startsWith('temp-media-') || (pooja as any).image?.startsWith('temp-media-')) && (
              (() => {
                let tempId = '';
                if (pooja.galleryImages?.[activeImageIndex]?.url?.startsWith('temp-media-')) {
                  tempId = pooja.galleryImages[activeImageIndex].url;
                } else if (pooja.videoUrl?.startsWith('temp-media-')) {
                  tempId = pooja.videoUrl;
                } else if ((pooja as any).image?.startsWith('temp-media-')) {
                  tempId = (pooja as any).image;
                }
                return tempId ? (
                  <div style={{ marginTop: '12px', width: '100%' }}>
                    <CompressionStatusWidget tempId={tempId} mediaQueue={mediaQueue} />
                  </div>
                ) : null;
              })()
            )}

            {/* Video Thumbnail Control Panel when active item is video and in editable mode */}
            {editable && resolvedGallery[activeImageIndex]?.isVideo && (
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'left',
                marginTop: '12px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '4px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid var(--border-light)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    {((pooja.galleryImages && activeImageIndex < pooja.galleryImages.length && (pooja.galleryImages[activeImageIndex] as any)?.thumbnail) ||
                     (activeImageIndex >= (pooja.galleryImages?.length || 0) && pooja.uiLabels?.videoThumbnail)) ? (
                      <img
                        src={getDisplayImageUrl(
                          (pooja.galleryImages && activeImageIndex < pooja.galleryImages.length)
                            ? (pooja.galleryImages[activeImageIndex] as any)?.thumbnail
                            : pooja.uiLabels?.videoThumbnail
                        )}
                        alt="Thumbnail preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '0.62rem', color: '#9ca3af', textAlign: 'center', padding: '4px' }}>No Thumbnail</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-dark)' }}>Video Cover Frame</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Scrub video, then capture frame as cover.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={isCapturingThumbnail}
                    onClick={async () => {
                      const video = document.getElementById('pooja-product-video-player') as HTMLVideoElement;
                      if (!video) return;

                      setIsCapturingThumbnail(true);
                      const canvas = document.createElement('canvas');
                      canvas.width = video.videoWidth || 640;
                      canvas.height = video.videoHeight || 360;
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        canvas.toBlob(async (blob) => {
                          if (!blob) {
                            setIsCapturingThumbnail(false);
                            return;
                          }
                          const file = new File([blob], `thumb-${Date.now()}.jpg`, { type: 'image/jpeg' });
                          try {
                            const cdnUrl = onFileSelect ? await onFileSelect(file, 'products/thumbnails') : await uploadToR2(file, 'products/thumbnails');
                            
                            // Check if the current video is in galleryImages
                            if (pooja.galleryImages && activeImageIndex < pooja.galleryImages.length) {
                              const updatedGallery = [...pooja.galleryImages];
                              updatedGallery[activeImageIndex] = {
                                ...updatedGallery[activeImageIndex],
                                thumbnail: cdnUrl
                              } as any;
                              onUpdate && onUpdate({ galleryImages: updatedGallery });
                            } else {
                              // Legacy videoUrl fallback
                              const existingLabels = pooja.uiLabels || {};
                              onUpdate && onUpdate({
                                uiLabels: {
                                  ...existingLabels,
                                  videoThumbnail: cdnUrl
                                }
                              });
                            }
                            triggerToast('Captured frame as thumbnail!');
                          } catch (err) {
                            alert('Failed to upload thumbnail: ' + (err as Error).message);
                          } finally {
                            setIsCapturingThumbnail(false);
                          }
                        }, 'image/jpeg', 0.85);
                      } else {
                        setIsCapturingThumbnail(false);
                      }
                    }}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: isCapturingThumbnail ? '#94a3b8' : 'var(--primary-lime)',
                      color: '#0f172a',
                      border: 'none',
                      borderRadius: 'var(--radius-md, 6px)',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: isCapturingThumbnail ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {isCapturingThumbnail ? 'Uploading...' : '📸 Capture Frame'}
                  </button>
                  {((pooja.galleryImages && activeImageIndex < pooja.galleryImages.length && (pooja.galleryImages[activeImageIndex] as any)?.thumbnail) ||
                    (activeImageIndex >= (pooja.galleryImages?.length || 0) && pooja.uiLabels?.videoThumbnail)) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (pooja.galleryImages && activeImageIndex < pooja.galleryImages.length) {
                          const updatedGallery = [...pooja.galleryImages];
                          const itemCopy = { ...updatedGallery[activeImageIndex] };
                          delete (itemCopy as any).thumbnail;
                          updatedGallery[activeImageIndex] = itemCopy;
                          onUpdate && onUpdate({ galleryImages: updatedGallery });
                        } else {
                          const existingLabels = pooja.uiLabels || {};
                          const updated = { ...existingLabels };
                          delete updated.videoThumbnail;
                          onUpdate && onUpdate({ uiLabels: updated });
                        }
                        triggerToast('Video thumbnail cleared.');
                      }}
                      style={{
                        padding: '8px',
                        backgroundColor: '#fee2e2',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: 'var(--radius-md, 6px)',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                      title="Clear custom thumbnail"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Gallery Thumbnails */}
            <div className="no-scrollbar" style={{
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              flexWrap: 'nowrap',
              alignItems: 'center',
              padding: '6px 0 12px 0',
              width: '100%',
              WebkitOverflowScrolling: 'touch'
            }}>
              {resolvedGallery.map((img, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    opacity: draggedIndex === idx ? 0.4 : 1,
                    transition: 'opacity 0.2s',
                    flexShrink: 0
                  }}
                  draggable={editable && idx < (pooja.galleryImages?.length || 0)}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={handleDragEnd}
                  title={editable && idx < (pooja.galleryImages?.length || 0) ? "Drag to reorder" : undefined}
                >
                  <button
                    onClick={() => {
                      if (activeImageIndex === idx) {
                        if (!img.isEmoji) {
                          setLightboxIndex(idx);
                        }
                      } else {
                        setActiveImageIndex(idx);
                      }
                    }}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: 'var(--radius-md)',
                      background: img.gradient !== 'none' ? img.gradient : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: activeImageIndex === idx ? '2px solid var(--primary-lime)' : '1px solid var(--border-light)',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.15s',
                      overflow: 'hidden',
                      padding: 0,
                      cursor: editable && idx < (pooja.galleryImages?.length || 0) ? 'grab' : 'pointer'
                    }}
                  >
                    {img.isVideo ? (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        backgroundColor: '#4b5563',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff'
                      }}>
                        {img.thumbnail ? (
                          <img
                            src={getDisplayImageUrl(img.thumbnail)}
                            alt="Video Thumbnail"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              opacity: 0.7
                            }}
                          />
                        ) : (
                          <img
                            src={getDisplayImageUrl(product.image)}
                            alt="Video Placeholder"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              opacity: 0.5
                            }}
                          />
                        )}
                        <Play size={20} fill="currentColor" style={{ zIndex: 2 }} />
                      </div>
                    ) : img.isEmoji ? (
                      <span style={{ fontSize: '1.8rem' }}>{img.url}</span>
                    ) : (
                      <img src={getDisplayImageUrl(img.url)} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </button>
                  {editable && (img.isVideo || resolvedGallery.length > 1) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (pooja.galleryImages && idx < pooja.galleryImages.length) {
                          const updated = pooja.galleryImages.filter((_, i) => i !== idx);
                          const updates: Partial<PoojaProduct> = { galleryImages: updated };
                          if (updated.length > 0) {
                            updates.image = updated[0].url;
                          }
                          onUpdate && onUpdate(updates);
                          setActiveImageIndex(0);
                        } else {
                          onUpdate && onUpdate({ videoUrl: undefined });
                          setActiveImageIndex(0);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        fontSize: '0.65rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        zIndex: 25
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {editable && (
                <>
                  <label
                    htmlFor={`detail-gallery-add-${product.id}`}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--primary-lime)',
                      backgroundColor: 'rgba(132, 204, 22, 0.05)',
                      color: 'var(--primary-lime)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      gap: '4px',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(132, 204, 22, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(132, 204, 22, 0.05)'}
                  >
                    <Upload size={16} />
                    <span>Add Photo</span>
                  </label>
                  <input
                    id={`detail-gallery-add-${product.id}`}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && onUpdate) {
                        try {
                          const cdnUrl = onFileSelect ? await onFileSelect(file, 'products/gallery') : await uploadToR2(file, 'products/gallery');
                          const currentGallery = pooja.galleryImages && pooja.galleryImages.length > 0
                            ? pooja.galleryImages
                            : [];
                          const updatedGallery = [...currentGallery, { url: cdnUrl, alt: pooja.name }];
                          const updates: Partial<PoojaProduct> = { galleryImages: updatedGallery };
                          if (updatedGallery.length === 1 || !product.image || !isImageUrl(product.image)) {
                            updates.image = cdnUrl;
                          }
                          onUpdate(updates);
                        } catch (err) {
                          alert('Upload failed: ' + (err as Error).message);
                        }
                      }
                    }}
                  />
                  {/* Add Video Button */}
                  <label
                    htmlFor={`detail-video-add-${product.id}`}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed #3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      color: '#3b82f6',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      gap: '4px',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)'}
                  >
                    <Play size={16} />
                    <span>Add Video</span>
                  </label>
                  <input
                    id={`detail-video-add-${product.id}`}
                    type="file"
                    accept="video/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert(`Warning: This video is large (${(file.size / (1024 * 1024)).toFixed(1)} MB). For a smooth experience for devotees on slower internet connections, please compress it to under 3-5 MB before uploading.`);
                        }
                        if (onUpdate) {
                          try {
                            const cdnUrl = onFileSelect ? await onFileSelect(file, 'products/videos') : await uploadToR2(file, 'products/videos');
                            const currentGallery = pooja.galleryImages || [{ url: product.image, alt: product.name }];
                            onUpdate({
                              galleryImages: [...currentGallery, { url: cdnUrl, alt: 'Product Video', isVideo: true } as any]
                            });
                          } catch (err) {
                            alert('Upload failed: ' + (err as Error).message);
                          }
                        }
                      }
                    }}
                  />
                </>
              )}
            </div>

            {/* Accordion Tabs Info Blocks */}
            {!isVidyaRudraksh && (
              <div style={{
                marginTop: '16px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)'
              }}>
              {/* Tabs Headers */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', backgroundColor: '#f9fafb' }}>
                <button
                  onClick={() => setActiveTab('specs')}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    fontSize: '0.88rem',
                    fontWeight: activeTab === 'specs' ? 800 : 600,
                    color: activeTab === 'specs' ? 'var(--primary-lime)' : 'var(--text-muted)',
                    borderBottom: activeTab === 'specs' ? '3px solid var(--primary-lime)' : 'none',
                    textAlign: 'center'
                  }}
                >
                  {isHindi ? "सामग्री एवं विवरण" : "Material & Dimensions"}
                </button>
                <button
                  onClick={() => setActiveTab('shipping')}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    fontSize: '0.88rem',
                    fontWeight: activeTab === 'shipping' ? 800 : 600,
                    color: activeTab === 'shipping' ? 'var(--primary-lime)' : 'var(--text-muted)',
                    borderBottom: activeTab === 'shipping' ? '3px solid var(--primary-lime)' : 'none',
                    textAlign: 'center'
                  }}
                >
                  {isHindi ? "शिपिंग एवं वापसी" : "Shipping & Returns"}
                </button>
              </div>

              {/* Tab Contents */}
              <div style={{ padding: '24px', textAlign: 'left' }}>
                {activeTab === 'specs' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', fontSize: '0.88rem', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{isHindi ? "सामग्री" : "Material"}</span>
                      <span style={{ color: 'var(--text-dark)', fontWeight: 700 }}>
                        {editable ? (
                          <InlineEdit
                            value={specs.material}
                            onChange={(val) => onUpdate && onUpdate({ material: val })}
                            placeholder="Material"
                          />
                        ) : (
                          specs.material
                        )}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', fontSize: '0.88rem', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{isHindi ? "वजन" : "Weight"}</span>
                      <span style={{ color: 'var(--text-dark)', fontWeight: 700 }}>
                        {editable ? (
                          <InlineEdit
                            value={specs.weight}
                            onChange={(val) => onUpdate && onUpdate({ weight: val })}
                            placeholder="Weight"
                          />
                        ) : (
                          specs.weight
                        )}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', fontSize: '0.88rem', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{isHindi ? "माप (डाइमेंशन्स)" : "Dimensions"}</span>
                      <span style={{ color: 'var(--text-dark)', fontWeight: 700 }}>
                        {editable ? (
                          <InlineEdit
                            value={specs.dimensions}
                            onChange={(val) => onUpdate && onUpdate({ dimensions: val })}
                            placeholder="Dimensions"
                          />
                        ) : (
                          specs.dimensions
                        )}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', fontSize: '0.88rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{isHindi ? "उत्पत्ति" : "Origin"}</span>
                      <span style={{ color: 'var(--text-dark)', fontWeight: 700 }}>
                        {editable ? (
                          <InlineEdit
                            value={specs.origin}
                            onChange={(val) => onUpdate && onUpdate({ origin: val })}
                            placeholder="Origin"
                          />
                        ) : (
                          specs.origin
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)', fontWeight: 600 }}>
                      <Clock size={16} style={{ color: 'var(--primary-lime)' }} />
                      {isHindi ? "त्वरित वितरण: 24-48 घंटों के भीतर प्रेषित। 3-5 कार्य दिवसों में वितरित।" : "Fast Delivery: Shipped within 24-48 hours. Delivered in 3-5 business days."}
                    </p>
                    <p>
                      {isHindi ? "पवित्रता बनाए रखने और परिवहन के दौरान होने वाले नुकसान से बचाने के लिए प्रत्येक आध्यात्मिक सामग्री को कीटाणुरहित गद्देदार पैकिंग में सावधानीपूर्वक पैक किया जाता है।" : "Every spiritual item is packed carefully in sanitized cushions to maintain sacred purity and avoid transit damages."}
                    </p>
                    <p style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                      {isHindi ? "वापसी नीति: यदि पैकेज खुला न हो और मूल स्थिति में हो, तो मानक उत्पादों पर 7 दिनों की आसान और परेशानी मुक्त वापसी।" : "Return Policy: Easy 7-day hassle-free returns on standard items if package is unopened and pristine."}
                    </p>
                  </div>
                )}
              </div>

            </div>
            )}

          </div>

          {/* Right Column: Title, Specs, Variant, Quantity, and Main Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left', minWidth: 0 }}>

            {/* Reviews, Subtitle & Live Badges Block (Moved below image/right column start) */}
            <div>
              {/* Sanskrit Name */}
              {!isVidyaRudraksh && (editable || pooja.sanskritName) && (
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'var(--primary-forest)',
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  marginBottom: '8px'
                }}>
                  {editable ? (
                    <InlineEdit
                      value={pooja.sanskritName || ''}
                      onChange={(val) => onUpdate && onUpdate({ sanskritName: val })}
                      placeholder="Sanskrit Name"
                    />
                  ) : (
                    pooja.sanskritName
                  )}
                </div>
              )}

              {/* Devotional Subtitle */}
              {(editable || pooja.subtitle || isVidyaRudraksh) && (
                <p style={{
                  fontSize: '0.92rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  marginBottom: '12px',
                  lineHeight: '1.4'
                }}>
                  {isVidyaRudraksh ? (
                    "Padhai Mein Man Lagane, Ekagrata, Yaad Rakhne Ki Kshamata Aur Positive Study Habit Ke Liye Ek Pavitra Adhyatmik Sahayak"
                  ) : editable ? (
                    <InlineEdit
                      value={pooja.subtitle || ''}
                      onChange={(val) => onUpdate && onUpdate({ subtitle: val })}
                      placeholder="Devotional Subtitle"
                    />
                  ) : (
                    pooja.subtitle
                  )}
                </p>
              )}

              {/* Location Badge (Only for Vidya Rudraksh) */}
              {isVidyaRudraksh && (
                <div className="location-badge-container" style={{ marginBottom: '12px' }}>
                  <span 
                    className="badge-icon-pin-container" 
                    style={{ 
                      color: '#ef4444',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      borderRadius: '50%',
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <MapPin size={15} strokeWidth={2.5} />
                  </span>
                  <span className="location-badge-text">
                    Ujjain Ke Pavitra Sandipani Ashram Mein Vidya Siddh Anushthan Ke Baad Abhimantrit
                  </span>
                </div>
              )}

              {/* Live viewers & Countdown deal badges (Only for Vidya Rudraksh) */}
              {isVidyaRudraksh && (
                <div 
                  className="vidya-live-badges-row"
                  style={{
                    marginBottom: '12px',
                    fontFamily: 'var(--font-sans)',
                    textAlign: 'left'
                  }}
                >
                  {/* Viewer Count Badge */}
                  <div className="badge-live-pill">
                    <span className="badge-icon-live-container" style={{ color: '#10b981' }}>
                      <Eye size={15} strokeWidth={2.5} />
                    </span>
                    <span>{isHindi ? `अभी ${viewersCount} लोग देख रहे हैं` : `${viewersCount} people viewing now`}</span>
                  </div>

                  {/* Countdown Deal Badge */}
                  <div className="badge-live-pill badge-live-pill-orange">
                    <span className="badge-icon-clock-container" style={{ color: '#f59e0b' }}>
                      <Clock size={15} strokeWidth={2.5} />
                    </span>
                    <span>{isHindi ? `ऑफर समाप्त होने में: ${timeLeft || '09:45:45'}` : `Sale ends in ${timeLeft || '09:45:45'}`}</span>
                  </div>
                </div>
              )}

              {/* Star Rating summary */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      fill={s <= (isVidyaRudraksh ? 4 : Math.round(product.rating)) ? '#fbbf24' : 'none'}
                      color="#fbbf24"
                    />
                  ))}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                  {isVidyaRudraksh ? '4.5' : product.rating}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  ({isVidyaRudraksh ? '21' : reviews.length} {isHindi ? 'ग्राहक समीक्षाएं' : 'customer reviews'})
                </span>
              </div>
            </div>

            {/* Trust Badges (Only for Vidya Rudraksh) */}
              {isVidyaRudraksh && (
                <div 
                  className="vidya-trust-grid"
                  style={{
                    marginTop: '8px',
                    display: 'grid',
                    padding: '4px 0'
                  }}
                >
                  {/* Embedded Animation Styles & Grid Query */}
                  <style>{`
                    .vidya-trust-grid {
                      grid-template-columns: repeat(2, 1fr) !important;
                      gap: 14px 20px !important;
                    }
                    .vidya-trust-item {
                      display: flex;
                      align-items: center;
                      gap: 8px;
                      white-space: nowrap;
                    }
                    .vidya-trust-text {
                      font-size: 0.88rem;
                    }
                    .vidya-trust-icon-wrap {
                      width: 34px;
                      height: 34px;
                    }
                    @media (max-width: 480px) {
                      .vidya-trust-grid {
                        gap: 10px 8px !important;
                      }
                      .vidya-trust-item {
                        white-space: normal !important;
                      }
                      .vidya-trust-text {
                        font-size: 0.74rem;
                      }
                      .vidya-trust-icon-wrap {
                        width: 28px;
                        height: 28px;
                      }
                    }
                    @media (max-width: 380px) {
                      .vidya-trust-grid {
                        grid-template-columns: 1fr !important;
                        gap: 8px !important;
                      }
                      .vidya-trust-item {
                        white-space: normal !important;
                      }
                    }
                    @keyframes badge-heartbeat {
                      0% { transform: scale(1); }
                      25% { transform: scale(1.08); }
                      40% { transform: scale(1); }
                      55% { transform: scale(1.08); }
                      70% { transform: scale(1); }
                      100% { transform: scale(1); }
                    }
                    @keyframes badge-spin {
                      0% { transform: rotate(0deg) scale(1); }
                      50% { transform: rotate(180deg) scale(1.1); }
                      100% { transform: rotate(360deg) scale(1); }
                    }
                    @keyframes badge-bounce {
                      0%, 100% { transform: translateY(0); }
                      50% { transform: translateY(-4px); }
                    }
                    @keyframes badge-glow {
                      0%, 100% { transform: scale(1); box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3); }
                      50% { transform: scale(1.06); box-shadow: 0 4px 14px rgba(16, 185, 129, 0.6); }
                    }
                    .animate-badge-heart {
                      animation: badge-heartbeat 2.5s infinite ease-in-out;
                    }
                    .animate-badge-spin {
                      animation: badge-spin 4s infinite linear;
                    }
                    .animate-badge-bounce {
                      animation: badge-bounce 3s infinite ease-in-out;
                    }
                    .animate-badge-glow {
                      animation: badge-glow 2.5s infinite ease-in-out;
                    }
                  `}</style>

                  {/* Item 1: Parents Ka Vishwas */}
                  <div className="vidya-trust-item">
                    <div 
                      className="animate-badge-heart vidya-trust-icon-wrap"
                      style={{
                        background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                        color: '#ffffff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 10px rgba(244, 63, 94, 0.3)'
                      }}
                    >
                      <Users size={15} />
                    </div>
                    <span className="vidya-trust-text" style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                      {isHindi ? '10,000+ माता-पिता का विश्वास' : '10,000+ Parents Ka Vishwas'}
                    </span>
                  </div>

                  {/* Item 2: Sandipani Ashram Siddh */}
                  <div className="vidya-trust-item">
                    <div 
                      className="animate-badge-spin vidya-trust-icon-wrap"
                      style={{
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        color: '#ffffff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 10px rgba(251, 191, 36, 0.3)'
                      }}
                    >
                      <Landmark size={15} />
                    </div>
                    <span className="vidya-trust-text" style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                      {isHindi ? 'सांदीपनि आश्रम सिद्ध' : 'Sandipani Ashram Siddh'}
                    </span>
                  </div>

                  {/* Item 3: Orders Delivered */}
                  <div className="vidya-trust-item">
                    <div 
                      className="animate-badge-bounce vidya-trust-icon-wrap"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        color: '#ffffff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      <Package size={15} />
                    </div>
                    <span className="vidya-trust-text" style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                      {isHindi ? '18,000+ ऑर्डर डिलीवर' : '18,000+ Orders Delivered'}
                    </span>
                  </div>

                  {/* Item 4: Certified Dharmic Product */}
                  <div className="vidya-trust-item">
                    <div 
                      className="animate-badge-glow vidya-trust-icon-wrap"
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <ShieldCheck size={15} />
                    </div>
                    <span className="vidya-trust-text" style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                      {isHindi ? 'प्रमाणित धार्मिक उत्पाद' : 'Certified Dharmic Product'}
                    </span>
                  </div>
                </div>
              )}

            {/* Pricing Section with Dynamic Modifier */}
            <div className="product-price-container" style={{
              padding: '16px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <span 
                className={singleItemPrice === 1 ? "highlight-price-flash" : ""} 
                style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary-forest)' }}
              >
                {editable ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    ₹
                    <InlineEdit
                      value={product.price.toString()}
                      onChange={(val) => {
                        const numeric = parseFloat(val);
                        if (!isNaN(numeric)) {
                          onUpdate && onUpdate({ price: numeric });
                        }
                      }}
                      placeholder="Price"
                    />
                  </span>
                ) : (
                  `₹${singleItemPrice.toFixed(2)}`
                )}
              </span>
              {(editable || originalItemPrice) && (
                <>
                  <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    {editable ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        ₹
                        <InlineEdit
                          value={(product.originalPrice || 0).toString()}
                          onChange={(val) => {
                            const numeric = parseFloat(val);
                            if (!isNaN(numeric)) {
                              onUpdate && onUpdate({ originalPrice: numeric });
                            }
                          }}
                          placeholder="Original Price"
                        />
                      </span>
                    ) : (
                      originalItemPrice && `₹${originalItemPrice.toFixed(2)}`
                    )}
                  </span>
                  {discountPct > 0 && (
                    discountPct === 100 || singleItemPrice === 1 ? (
                      <span className="limited-offer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} style={{ animation: 'clock-vibrate 3s infinite ease-in-out' }} />
                        {isHindi ? "सीमित समय का ऑफर" : "Limited Offer"}
                      </span>
                    ) : (
                      <span style={{
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)'
                      }}>
                        {discountPct}% OFF
                      </span>
                    )
                  )}
                </>
              )}
            </div>

            {/* Items Left Alert (Directly below price card) */}
            {isVidyaRudraksh && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#dc2626',
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                marginTop: '-8px',
                boxShadow: 'var(--shadow-xs)',
                width: 'fit-content'
              }}>
                <span className="animate-pulse-red" style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#dc2626'
                }}></span>
                <span>{isHindi ? "केवल 309/500 उत्पाद बचे हैं!" : "Only 309/500 items left!"}</span>
              </div>
            )}

            {/* Quantity Selector & Wishlist */}
            {!isVidyaRudraksh && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-dark)' }}>{isHindi ? "मात्रा" : "Quantity"}</span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    backgroundColor: '#ffffff'
                  }}>
                    <button
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      style={{ padding: '8px 16px', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-muted)' }}
                    >
                      -
                    </button>
                    <span style={{ padding: '0 8px', fontSize: '0.92rem', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(prev => {
                        const limit = product?.purchaseLimit;
                        if (limit !== undefined && limit !== null && limit > 0 && prev >= limit) {
                          alert(isHindi ? `आप इस उत्पाद की अधिकतम ${limit} इकाइयाँ ही प्रति ऑर्डर खरीद सकते हैं।` : `You can only purchase a maximum of ${limit} units of this product per order.`);
                          return prev;
                        }
                        return prev + 1;
                      })}
                      style={{ padding: '8px 16px', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-muted)' }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Dynamic total feedback */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{isHindi ? "कुल लागत" : "Total Cost"}</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                    ₹{totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Main Action Buttons */}
            <div className="product-actions-grid">
              {(() => {
                const cartItem = cart.find(item => item.product.id === product.id);
                const qty = cartItem ? cartItem.quantity : 0;
                if (qty > 0) {
                  if (isOneRupeeProd) {
                    return (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px',
                        height: '54px',
                        boxSizing: 'border-box',
                        color: 'var(--text-muted)',
                        width: '100%',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        gap: '8px'
                      }}>
                        <span>{isHindi ? "कार्ट में 1 उत्पाद (सीमा 1)" : "1 Item in Cart (Limit 1)"}</span>
                      </div>
                    );
                  }
                  return (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#fbbf24',
                      borderRadius: 'var(--radius-md)',
                      padding: '5px',
                      height: '54px',
                      boxSizing: 'border-box',
                      boxShadow: '0 4px 12px rgba(251, 191, 36, 0.15)'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateQuantity(product.id, qty - 1);
                        }}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(0, 0, 0, 0.06)',
                          color: '#111827',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          border: 'none',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.12)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.06)'}
                      >
                        <Minus size={16} strokeWidth={2.5} />
                      </button>
                      <span style={{
                        color: '#111827',
                        fontWeight: '800',
                        fontSize: '0.95rem',
                        userSelect: 'none'
                      }}>
                        {isHindi ? `कार्ट में ${qty}` : `${qty} in Cart`}
                      </span>
                      <button
                        className="qty-plus-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateQuantity(product.id, qty + 1);
                        }}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(0, 0, 0, 0.06)',
                          color: '#111827',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          border: 'none',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.12)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.06)'}
                      >
                        <Plus size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  );
                }

                return (
                  <button
                    onClick={handleAddToCartClick}
                    className="btn-lime"
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: 'var(--shadow-sm)',
                      height: '54px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <ShoppingBag size={18} /> {isHindi ? "कार्ट में जोड़ें" : "Add to Cart"}
                  </button>
                );
              })()}

              <button
                onClick={handleBuyNowClick}
                className="btn-buy-now-saffron-glass"
                style={{
                  fontWeight: 800,
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  textAlign: 'center',
                  transition: 'opacity 0.15s'
                }}
              >
                {isHindi ? "अभी खरीदें" : "Buy Now"}
              </button>

              <button
                onClick={() => onToggleWishlist(product.id)}
                style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ffffff',
                  color: wishlist[product.id] ? '#ef4444' : 'var(--text-muted)',
                  boxShadow: 'var(--shadow-sm)'
                }}
                className="flex-center"
              >
                <Heart size={20} fill={wishlist[product.id] ? '#ef4444' : 'none'} />
              </button>
            </div>

            {/* Temple Blessing & Process Steps (Only for Vidya Rudraksh) */}
            {isVidyaRudraksh && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
                {/* {isHindi ? "मंदिर द्वारा अभिमंत्रित" : "Temple Blessed"} Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fff7ed 50%, #ffedd5 100%)',
                  border: '1.5px solid #fed7aa',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                  overflow: 'hidden',
                  textAlign: 'left'
                }}>
                  {/* Floating light rays style */}
                  <style>{`
                    @keyframes ray-glow {
                      0%, 100% { opacity: 0.15; transform: scale(1) rotate(0deg); }
                      50% { opacity: 0.3; transform: scale(1.1) rotate(180deg); }
                    }
                    .blessing-glow-effect {
                      position: absolute;
                      top: -50%;
                      right: -10%;
                      width: 250px;
                      height: 250px;
                      background: radial-gradient(circle, rgba(249, 115, 22, 0.2) 0%, rgba(249, 115, 22, 0) 70%);
                      animation: ray-glow 8s infinite ease-in-out;
                      pointer-events: none;
                      z-index: 1;
                    }
                    @keyframes priest-float {
                      0%, 100% { transform: translateY(0) rotate(0deg); }
                      50% { transform: translateY(-6px) rotate(1deg); }
                    }
                    .priest-image-container {
                      animation: priest-float 4s infinite ease-in-out;
                      position: relative;
                      z-index: 2;
                      flex-shrink: 0;
                    }
                  `}</style>

                  <div className="blessing-glow-effect" />

                  {/* Guru Ji Avatar */}
                  <div className="priest-image-container" style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    border: '3px solid #f97316',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <img 
                      src="/siddh_pandit_ji.png" 
                      alt="Pandit Ji" 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = document.createElement('span');
                          fallback.style.fontSize = '1.8rem';
                          fallback.innerText = '🙏';
                          parent.appendChild(fallback);
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>

                  {/* Text Content */}
                  <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: '1.25rem',
                      fontWeight: 900,
                      color: '#7c2d12',
                      fontFamily: 'var(--font-sans)',
                      letterSpacing: '-0.3px'
                    }}>
                      {isHindi ? "मंदिर द्वारा अभिमंत्रित" : "Temple Blessed"}
                    </span>
                    <span style={{
                      fontSize: '0.94rem',
                      fontWeight: 700,
                      color: '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {isHindi ? "सांदीपनी आश्रम उज्जैन" : "Sandipani Ashram Ujjain"}
                    </span>
                  </div>
                </div>

                {/* How a Product Becomes Siddh Section */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #eaeaea',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {/* Decorative flower design */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div style={{ height: '1.5px', width: '40px', background: 'linear-gradient(to left, #f97316, transparent)' }}></div>
                    <span style={{ color: '#f97316', fontSize: '1rem' }}>🔱</span>
                    <div style={{ height: '1.5px', width: '40px', background: 'linear-gradient(to right, #f97316, transparent)' }}></div>
                  </div>

                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: 'var(--text-dark)',
                    margin: 0,
                    letterSpacing: '-0.3px'
                  }}>
                    {isHindi ? "उत्पाद सिद्ध कैसे बनता है?" : "How a product becomes siddh"}
                  </h3>

                  {/* Steps row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '6px',
                    padding: '8px 0',
                    position: 'relative',
                    overflowX: 'auto',
                    scrollbarWidth: 'none'
                  }}>
                    {/* Embedded Step hover/bounce styles */}
                    <style>{`
                      .siddh-step-card {
                        flex: 1;
                        min-width: 70px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 8px;
                        transition: transform 0.2s;
                      }
                      .siddh-step-card:hover {
                        transform: translateY(-4px);
                      }
                      @keyframes package-bounce {
                        0%, 100% { transform: translateY(0) scale(1); }
                        50% { transform: translateY(-4px) scale(1.08); }
                      }
                      @keyframes flag-wave {
                        0%, 100% { transform: rotate(0deg); }
                        50% { transform: rotate(8deg); }
                      }
                      @keyframes fire-flicker {
                        0%, 100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 2px 4px rgba(239, 68, 68, 0.2)); }
                        50% { transform: scale(1.08) rotate(-2deg); filter: drop-shadow(0 4px 10px rgba(239, 68, 68, 0.4)); }
                      }
                      @keyframes home-heartbeat {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.08); }
                      }
                      .step-icon-pkg {
                        animation: package-bounce 3s infinite ease-in-out;
                      }
                      .step-icon-temple {
                        animation: flag-wave 2.5s infinite ease-in-out;
                        transform-origin: bottom center;
                      }
                      .step-icon-fire {
                        animation: fire-flicker 1.8s infinite ease-in-out;
                        transform-origin: bottom center;
                      }
                      .step-icon-home {
                        animation: home-heartbeat 3s infinite ease-in-out;
                      }
                      .siddh-step-icon {
                        width: 48px;
                        height: 48px;
                      }
                      .siddh-step-text {
                        font-size: 0.74rem;
                        max-width: 64px;
                      }
                      .siddh-separator {
                        align-self: center;
                        color: #fdba74;
                        font-weight: 900;
                        letter-spacing: 2px;
                        font-size: 0.8rem;
                        padding-bottom: 16px;
                      }
                      @media (max-width: 480px) {
                        .siddh-separator {
                          display: none !important;
                        }
                        .siddh-step-card {
                          min-width: 58px !important;
                          gap: 6px !important;
                        }
                        .siddh-step-icon {
                          width: 38px !important;
                          height: 38px !important;
                        }
                        .siddh-step-icon svg {
                          width: 20px !important;
                          height: 20px !important;
                        }
                        .siddh-step-text {
                          font-size: 0.64rem !important;
                          max-width: 58px !important;
                        }
                      }
                    `}</style>

                    {/* Step 1 */}
                    <div className="siddh-step-card">
                      <div className="step-icon-pkg siddh-step-icon" style={{
                        borderRadius: '50%',
                        backgroundColor: '#fff7ed',
                        border: '2px solid #fdba74',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-sm)',
                        color: '#f97316'
                      }}>
                        <Package size={22} strokeWidth={2.5} />
                      </div>
                      <span className="siddh-step-text" style={{ fontWeight: 800, color: 'var(--text-dark)', lineHeight: '1.2', textAlign: 'center' }}>
                        {isHindi ? "उत्पाद का चयन" : "Product is Selected"}
                      </span>
                    </div>

                    {/* Dotted separator */}
                    <div className="siddh-separator">••••</div>

                    {/* Step 2 */}
                    <div className="siddh-step-card">
                      <div className="step-icon-temple siddh-step-icon" style={{
                        borderRadius: '50%',
                        backgroundColor: '#fff7ed',
                        border: '2px solid #fdba74',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-sm)',
                        color: '#ea580c'
                      }}>
                        {/* Custom temple/shrine SVG */}
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 2L3 9h18L12 2z" fill="#ffedd5" stroke="#ea580c" />
                          <path d="M5 9v11h14V9" stroke="#ea580c" />
                          <path d="M9 20v-6a3 3 0 0 1 6 0v6" stroke="#ea580c" />
                          <path d="M12 2v3" stroke="#f97316" strokeWidth="3" />
                          <path d="M12 2l5 1" stroke="#f97316" strokeWidth="3" />
                        </svg>
                      </div>
                      <span className="siddh-step-text" style={{ fontWeight: 800, color: 'var(--text-dark)', lineHeight: '1.2', textAlign: 'center' }}>
                        {isHindi ? "मंदिर ले जाना" : "Taken to Temple"}
                      </span>
                    </div>

                    {/* Dotted separator */}
                    <div className="siddh-separator">••••</div>

                    {/* Step 3 */}
                    <div className="siddh-step-card">
                      <div className="step-icon-fire siddh-step-icon" style={{
                        borderRadius: '50%',
                        backgroundColor: '#fff7ed',
                        border: '2px solid #fdba74',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-sm)',
                        color: '#ef4444'
                      }}>
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z" fill="#ffedd5" stroke="#ef4444" />
                        </svg>
                      </div>
                      <span className="siddh-step-text" style={{ fontWeight: 800, color: 'var(--text-dark)', lineHeight: '1.2', textAlign: 'center' }}>
                        {isHindi ? "पूजा एवं संकल्प" : "Puja & Sankalp"}
                      </span>
                    </div>

                    {/* Dotted separator */}
                    <div className="siddh-separator">••••</div>

                    {/* Step 4 */}
                    <div className="siddh-step-card">
                      <div className="step-icon-home siddh-step-icon" style={{
                        borderRadius: '50%',
                        backgroundColor: '#ecfdf5',
                        border: '2px solid #a7f3d0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-sm)',
                        color: '#10b981'
                      }}>
                        {/* Custom House SVG */}
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#d1fae5" stroke="#10b981" />
                          <polyline points="9 22 9 12 15 12 15 22" stroke="#10b981" />
                        </svg>
                      </div>
                      <span className="siddh-step-text" style={{ fontWeight: 800, color: 'var(--text-dark)', lineHeight: '1.2', textAlign: 'center' }}>
                        {isHindi ? "आपको डिलीवरी" : "Delivered to You"}
                      </span>
                    </div>
                  </div>

                  {/* Buy Now CTA inside Siddh Section */}
                  <button 
                    onClick={handleBuyNowClick}
                    style={{
                      backgroundColor: '#ea580c',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      marginTop: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#c2410c';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ea580c';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {isHindi ? "अभी खरीदें" : "Buy Now"}
                  </button>
                </div>
              </div>
            )}

            {/* Description */}
            {!isVidyaRudraksh && (
              <div style={{
                fontSize: '0.95rem',
                color: 'var(--text-muted)',
                lineHeight: '1.6',
                marginBottom: '10px'
              }}>
                {editable ? (
                  <InlineEdit
                    type="textarea"
                    value={product.description || ''}
                    onChange={(val) => onUpdate && onUpdate({ description: val, shortDescription: val })}
                    placeholder="Detailed product story and description..."
                  />
                ) : (
                  product.description
                )}
              </div>
            )}

            {/* Spiritual Benefits Bullet Points */}
            {!isVidyaRudraksh && (
              <div style={{
                backgroundColor: 'var(--primary-lime-light)',
                padding: '20px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(249, 115, 22, 0.15)'
              }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={16} /> {isHindi ? "आद्यात्मिक लाभ एवं आशीर्वाद" : "Spiritual Benefits & Blessings"}
              </h3>
              <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(product.benefits || []).map((b, idx) => (
                  <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-dark)', display: 'flex', gap: '8px', alignItems: 'start' }}>
                    <Check size={14} style={{ color: 'var(--primary-lime)', flexShrink: 0, marginTop: '3px' }} />
                    {editable ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                        <InlineEdit
                          value={b}
                          onChange={(val) => {
                            const updated = [...product.benefits];
                            updated[idx] = val;
                            onUpdate && onUpdate({ benefits: updated });
                          }}
                          placeholder="Enter blessing/benefit..."
                          style={{ flexGrow: 1 }}
                        />
                        <button
                          onClick={() => {
                            const updated = product.benefits.filter((_, i) => i !== idx);
                            onUpdate && onUpdate({ benefits: updated });
                          }}
                          style={{ color: '#ef4444', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '2px 4px' }}
                          title="Delete benefit"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span>{b}</span>
                    )}
                  </li>
                ))}
              </ul>
              {editable && (
                <button
                  onClick={() => {
                    const current = product.benefits || [];
                    onUpdate && onUpdate({ benefits: [...current, 'New Spiritual Blessing & Benefit'] });
                  }}
                  style={{
                    marginTop: '12px',
                    color: 'var(--primary-lime)',
                    border: '1px dashed var(--primary-lime)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm, 4px)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  + Add Benefit
                </button>
              )}
            </div>
            )}

          </div>
        </div>
      </section>

      {/* Section 2 — Emotional Hook (Only for Vidya Rudraksh) */}
      {isVidyaRudraksh && (
        <>
          <VidyaEmotionalHookSection />
          <VidyaParentPainSection onBuyNow={handleBuyNowClick} />
          <VidyaEmotionalStorySection />
          {/* <VidyaVideoSection videoUrl={pooja.videoUrl} thumbnailUrl={pooja.uiLabels?.videoThumbnail} /> */}
          <VidyaSandipaniAshramSection />
          <VidyaWhyParentsTrustSection />
          <VidyaWhyOneRupeeSection />
        </>
      )}

      {/* Detailed Pooja Description & Spiritual Elements */}
      {!isVidyaRudraksh && ((pooja.spiritualSignificance && pooja.spiritualSignificance !== '') ||
        (Array.isArray(pooja.ritualsIncluded) && pooja.ritualsIncluded.length > 0) ||
        (Array.isArray(pooja.samagriList) && pooja.samagriList.length > 0) ||
        (pooja.bookingInstructions && pooja.bookingInstructions !== '') ||
        (pooja.priestDetails && typeof pooja.priestDetails === 'object' && Object.keys(pooja.priestDetails).length > 0 && (pooja.priestDetails as any).name) ||
        (Array.isArray(pooja.certificates) && pooja.certificates.length > 0) ||
        (Array.isArray(pooja.faqs) && pooja.faqs.length > 0)) && (
          <section style={{ marginTop: '56px', borderTop: '1px solid var(--border-light)', paddingTop: '40px' }}>
            <div className="container" style={{ textAlign: 'left' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px' }} className="hero-grid-split">

                {/* Left Column: Rituals, Samagri, Significance, Booking */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                  {/* Spiritual Significance */}
                  {!!pooja.spiritualSignificance && (
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                        {renderSectionHeaderIcon('significance', <BookOpen size={22} />)} {isHindi ? "आध्यात्मिक महत्व" : "Spiritual Significance"}
                      </h2>
                      <div style={{
                        backgroundColor: '#ffffff',
                        padding: '24px',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-light)',
                        boxShadow: 'var(--shadow-sm)',
                        lineHeight: '1.7',
                        color: 'var(--text-muted)',
                        fontSize: '0.95rem',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {editable ? (
                          <InlineEdit
                            type="textarea"
                            value={pooja.spiritualSignificance || ''}
                            onChange={(val) => onUpdate && onUpdate({ spiritualSignificance: val })}
                            placeholder="Describe the deep spiritual significance of this pooja/ritual..."
                            style={{ width: '100%' }}
                          />
                        ) : (
                          tDetail(pooja.spiritualSignificance)
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rituals Included (Timeline) */}
                  {(Array.isArray(pooja.ritualsIncluded) && pooja.ritualsIncluded.length > 0) && (
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                        {renderSectionHeaderIcon('rituals', <Calendar size={22} />)} {isHindi ? `शामिल अनुष्ठान एवं वैदिक चरण (${pooja.ritualsIncluded?.length || 0})` : `Rituals & Vedic Steps Included (${pooja.ritualsIncluded?.length || 0})`}
                      </h2>
                      <div style={{
                        backgroundColor: '#ffffff',
                        padding: '28px',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-light)',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px',
                        position: 'relative'
                      }}>
                        {/* Timeline Line */}
                        {pooja.ritualsIncluded && pooja.ritualsIncluded.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            left: '42px',
                            top: '40px',
                            bottom: '40px',
                            width: '2px',
                            backgroundColor: 'var(--border-light)',
                            zIndex: 1
                          }}></div>
                        )}

                        {(pooja.ritualsIncluded || []).map((ritual, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '20px', zIndex: 2, position: 'relative' }}>
                            {/* Step Number Circle */}
                            <div style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary-lime)',
                              color: 'var(--text-dark)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.88rem',
                              boxShadow: 'var(--shadow-sm)',
                              flexShrink: 0
                            }}>
                              {idx + 1}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '8px' }}>
                                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                                    {editable ? (
                                      <InlineEdit
                                        value={ritual.name}
                                        onChange={(val) => {
                                          const updated = [...(pooja.ritualsIncluded || [])];
                                          updated[idx] = { ...updated[idx], name: val };
                                          onUpdate && onUpdate({ ritualsIncluded: updated });
                                        }}
                                        placeholder="Ritual step name"
                                      />
                                    ) : (
                                      tDetail(ritual.name)
                                    )}
                                  </h3>
                                  <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    color: 'var(--primary-forest)',
                                    backgroundColor: 'var(--primary-lime-light)',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-full)'
                                  }}>
                                    {editable ? (
                                      <InlineEdit
                                        value={ritual.duration || ''}
                                        onChange={(val) => {
                                          const updated = [...(pooja.ritualsIncluded || [])];
                                          updated[idx] = { ...updated[idx], duration: val };
                                          onUpdate && onUpdate({ ritualsIncluded: updated });
                                        }}
                                        placeholder="e.g. 15m"
                                      />
                                    ) : (
                                      ritual.duration
                                    )}
                                  </span>
                                </div>
                                {editable && (
                                  <button
                                    onClick={() => {
                                      const updated = pooja.ritualsIncluded!.filter((_, i) => i !== idx);
                                      onUpdate && onUpdate({ ritualsIncluded: updated });
                                    }}
                                    style={{
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      color: '#ef4444',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px'
                                    }}
                                  >
                                    ✕ Delete Step
                                  </button>
                                )}
                              </div>
                              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: '4px 0 0 0' }}>
                                {editable ? (
                                  <InlineEdit
                                    type="textarea"
                                    value={ritual.description}
                                    onChange={(val) => {
                                      const updated = [...(pooja.ritualsIncluded || [])];
                                      updated[idx] = { ...updated[idx], description: val };
                                      onUpdate && onUpdate({ ritualsIncluded: updated });
                                    }}
                                    placeholder="Describe the activities performed in this Vedic ritual step..."
                                  />
                                ) : (
                                  tDetail(ritual.description)
                                )}
                              </p>
                            </div>
                          </div>
                        ))}

                        {editable && (
                          <button
                            onClick={() => {
                              const current = pooja.ritualsIncluded || [];
                              onUpdate && onUpdate({
                                ritualsIncluded: [...current, { name: 'New Vedic Step', description: 'Description of the mantra recitation and offerings.', duration: '15 mins' }]
                              });
                            }}
                            style={{
                              alignSelf: 'flex-start',
                              color: 'var(--primary-lime)',
                              border: '1px dashed var(--primary-lime)',
                              backgroundColor: 'transparent',
                              padding: '8px 16px',
                              borderRadius: 'var(--radius-md)',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                          >
                            + Add Ritual Step
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Samagri List (Grid Showcase) */}
                  {(Array.isArray(pooja.samagriList) && pooja.samagriList.length > 0) && (
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                        {renderSectionHeaderIcon('samagri', <Award size={22} />)} {isHindi ? "पवित्र पूजन सामग्री (शामिल सामग्रियां)" : "Sacred Samagri (Included Ingredients)"}
                      </h2>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '16px'
                      }}>
                        {(pooja.samagriList || []).map((samagri, idx) => (
                          <div key={idx} style={{
                            backgroundColor: '#ffffff',
                            padding: '16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            boxShadow: 'var(--shadow-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            position: 'relative'
                          }}>
                            {editable && (
                              <button
                                onClick={() => {
                                  const updated = pooja.samagriList!.filter((_, i) => i !== idx);
                                  onUpdate && onUpdate({ samagriList: updated });
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                  color: '#ef4444',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  padding: '2px'
                                }}
                                title="Delete item"
                              >
                                ✕
                              </button>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', paddingRight: editable ? '16px' : '0' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-dark)' }}>
                                {editable ? (
                                  <InlineEdit
                                    value={samagri.name}
                                    onChange={(val) => {
                                      const updated = [...(pooja.samagriList || [])];
                                      updated[idx] = { ...updated[idx], name: val };
                                      onUpdate && onUpdate({ samagriList: updated });
                                    }}
                                    placeholder="Ingredient"
                                  />
                                ) : (
                                  tDetail(samagri.name)
                                )}
                              </span>
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'var(--primary-forest)',
                                backgroundColor: '#f3f4f6',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-sm)'
                              }}>
                                {editable ? (
                                  <InlineEdit
                                    value={samagri.quantity}
                                    onChange={(val) => {
                                      const updated = [...(pooja.samagriList || [])];
                                      updated[idx] = { ...updated[idx], quantity: val };
                                      onUpdate && onUpdate({ samagriList: updated });
                                    }}
                                    placeholder="e.g. 1 unit"
                                  />
                                ) : (
                                  tDetail(samagri.quantity)
                                )}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                              {editable ? (
                                <InlineEdit
                                  type="textarea"
                                  value={samagri.description || ''}
                                  onChange={(val) => {
                                    const updated = [...(pooja.samagriList || [])];
                                    updated[idx] = { ...updated[idx], description: val };
                                    onUpdate && onUpdate({ samagriList: updated });
                                  }}
                                  placeholder="Explain significance/origin..."
                                />
                              ) : (
                                tDetail(samagri.description)
                              )}
                            </div>
                          </div>
                        ))}

                        {editable && (
                          <button
                            onClick={() => {
                              const current = pooja.samagriList || [];
                              onUpdate && onUpdate({
                                samagriList: [...current, { name: 'New Ingredient', quantity: '1 Unit', description: 'Sacred material blessed during the pooja.' }]
                              });
                            }}
                            style={{
                              border: '1px dashed var(--primary-lime)',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'rgba(132, 204, 22, 0.05)',
                              color: 'var(--primary-lime)',
                              padding: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.88rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              height: '100%',
                              minHeight: '80px'
                            }}
                          >
                            + Add Samagri Item
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Booking Instructions */}
                  {!!pooja.bookingInstructions && (
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                        {renderSectionHeaderIcon('guidelines', <Info size={22} />)} {isHindi ? "बुकिंग एवं अनुष्ठान दिशानिर्देश" : "Booking & Performance Guidelines"}
                      </h2>
                      <div style={{
                        backgroundColor: 'var(--primary-lime-light)',
                        padding: '24px',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgba(249, 115, 22, 0.15)',
                        boxShadow: 'var(--shadow-sm)',
                        lineHeight: '1.6',
                        color: 'var(--text-dark)',
                        fontSize: '0.92rem',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {editable ? (
                          <InlineEdit
                            type="textarea"
                            value={pooja.bookingInstructions || ''}
                            onChange={(val) => onUpdate && onUpdate({ bookingInstructions: val })}
                            placeholder="Provide devotee booking and performance instructions..."
                            style={{ width: '100%' }}
                          />
                        ) : (
                          tDetail(pooja.bookingInstructions)
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* Right Column: Priest Details, FAQs, Certificates */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                  {/* Priest Details */}
                  {(pooja.priestDetails && typeof pooja.priestDetails === 'object' && Object.keys(pooja.priestDetails).length > 0 && (pooja.priestDetails as any).name) && (
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                        {renderSectionHeaderIcon('priest', <User size={22} />)} {isHindi ? "नियुक्त पंडित जी का विवरण" : "Assigned Priest Details"}
                      </h2>
                      <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-light)',
                        boxShadow: 'var(--shadow-sm)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        {/* Priest Header Background */}
                        <div style={{
                          height: '100px',
                          background: 'linear-gradient(135deg, var(--primary-forest) 0%, rgba(26, 46, 5, 0.9) 100%)',
                          position: 'relative'
                        }}></div>

                        {/* Profile Photo and Details */}
                        <div style={{ padding: '24px', position: 'relative', marginTop: '-50px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                          <div style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '50%', border: '4px solid #ffffff', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
                            {isRealUrl(pooja.priestImage) ? (
                              <img
                                src={getDisplayImageUrl(pooja.priestImage)}
                                alt={pooja.priestDetails?.name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  backgroundColor: '#ffffff'
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'var(--primary-lime-light)',
                                color: 'var(--primary-lime)',
                                fontSize: '2.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                🙏
                              </div>
                            )}

                            {editable && (
                              <>
                                <label
                                  htmlFor={`priest-image-upload-${product.id}`}
                                  style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                    zIndex: 10
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                                >
                                  <Upload size={16} />
                                </label>
                                <input
                                  id={`priest-image-upload-${product.id}`}
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file && onUpdate) {
                                      try {
                                        const cdnUrl = onFileSelect ? await onFileSelect(file, 'priests') : await uploadToR2(file, 'priests');
                                        onUpdate({ priestImage: cdnUrl });
                                      } catch (err) {
                                        alert('Upload failed: ' + (err as Error).message);
                                      }
                                    }
                                  }}
                                />
                              </>
                            )}
                          </div>
                          
                          {/* Chief Priest Compressor status indicator */}
                          {editable && pooja.priestImage && pooja.priestImage.startsWith('temp-media-') && (
                            <div style={{ marginTop: '12px', width: '100%', maxWidth: '280px' }}>
                              <CompressionStatusWidget tempId={pooja.priestImage} mediaQueue={mediaQueue} />
                            </div>
                          )}

                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '12px', marginBottom: '2px' }}>
                            {editable ? (
                              <InlineEdit
                                value={pooja.priestDetails?.name || ''}
                                onChange={(val) => {
                                  const details = pooja.priestDetails || { name: 'Priest Name' };
                                  onUpdate && onUpdate({ priestDetails: { ...details, name: val } });
                                }}
                                placeholder="Priest Name"
                              />
                            ) : (
                              tDetail(pooja.priestDetails?.name || '')
                            )}
                          </h3>

                          {(editable || pooja.priestDetails?.qualification) && (
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-forest)', backgroundColor: 'var(--primary-lime-light)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                              {editable ? (
                                <InlineEdit
                                  value={pooja.priestDetails?.qualification || ''}
                                  onChange={(val) => {
                                    const details = pooja.priestDetails || { name: 'Priest Name' };
                                    onUpdate && onUpdate({ priestDetails: { ...details, qualification: val } });
                                  }}
                                  placeholder="Qualification"
                                />
                              ) : (
                                tDetail(pooja.priestDetails?.qualification || '')
                              )}
                            </span>
                          )}

                          {(editable || pooja.priestDetails?.experience) && (
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Award size={14} />
                              {editable ? (
                                <InlineEdit
                                  value={pooja.priestDetails?.experience || ''}
                                  onChange={(val) => {
                                    const details = pooja.priestDetails || { name: 'Priest Name' };
                                    onUpdate && onUpdate({ priestDetails: { ...details, experience: val } });
                                  }}
                                  placeholder="e.g. 15 Years"
                                />
                              ) : (
                                tDetail(pooja.priestDetails?.experience || '')
                              )}{isHindi ? " का वैदिक अनुष्ठानों का अनुभव" : " of Vedic Rituals"}
                            </span>
                          )}

                          {(editable || pooja.priestDetails?.bio) && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                              {editable ? (
                                <InlineEdit
                                  type="textarea"
                                  value={pooja.priestDetails?.bio || ''}
                                  onChange={(val) => {
                                    const details = pooja.priestDetails || { name: 'Priest Name' };
                                    onUpdate && onUpdate({ priestDetails: { ...details, bio: val } });
                                  }}
                                  placeholder="Write a short spiritual bio of the priest..."
                                />
                              ) : (
                                tDetail(pooja.priestDetails?.bio || '')
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Frequently Asked Questions */}
                  {(Array.isArray(pooja.faqs) && pooja.faqs.length > 0) && (
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isHindi ? "🕉️ सामान्यतः पूछे जाने वाले प्रश्न (FAQ)" : "🕉️ Frequently Asked Questions"}
                      </h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(pooja.faqs || []).map((faq, idx) => {
                          const isExpanded = expandedFaqIndex === idx;
                          return (
                            <div key={idx} style={{
                              backgroundColor: '#ffffff',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-light)',
                              overflow: 'hidden',
                              boxShadow: 'var(--shadow-sm)'
                            }}>
                              <div
                                style={{
                                  width: '100%',
                                  padding: '16px 20px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  border: 'none',
                                  background: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer'
                                }}
                                onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                              >
                                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)', paddingRight: '12px', flexGrow: 1 }}>
                                  {editable ? (
                                    <InlineEdit
                                      value={faq.question}
                                      onChange={(val) => {
                                        const updated = [...(pooja.faqs || [])];
                                        updated[idx] = { ...updated[idx], question: val };
                                        onUpdate && onUpdate({ faqs: updated });
                                      }}
                                      placeholder="FAQ Question"
                                    />
                                  ) : (
                                    tDetail(faq.question)
                                  )}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {editable && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const updated = pooja.faqs!.filter((_, i) => i !== idx);
                                        onUpdate && onUpdate({ faqs: updated });
                                      }}
                                      style={{
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        color: '#ef4444',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        zIndex: 10
                                      }}
                                    >
                                      ✕
                                    </button>
                                  )}
                                  <ChevronDown size={16} style={{
                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s',
                                    color: 'var(--text-muted)',
                                    flexShrink: 0
                                  }} />
                                </div>
                              </div>
                              {isExpanded && (
                                <div style={{
                                  padding: '0 20px 20px 20px',
                                  fontSize: '0.85rem',
                                  color: 'var(--text-muted)',
                                  lineHeight: '1.6',
                                  borderTop: '1px dashed var(--border-light)',
                                  paddingTop: '12px'
                                }}>
                                  {editable ? (
                                    <InlineEdit
                                      type="textarea"
                                      value={faq.answer}
                                      onChange={(val) => {
                                        const updated = [...(pooja.faqs || [])];
                                        updated[idx] = { ...updated[idx], answer: val };
                                        onUpdate && onUpdate({ faqs: updated });
                                      }}
                                      placeholder="FAQ Answer"
                                    />
                                  ) : (
                                    tDetail(faq.answer)
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {editable && (
                          <button
                            onClick={() => {
                              const current = pooja.faqs || [];
                              onUpdate && onUpdate({
                                faqs: [...current, { question: 'New Question?', answer: 'New Answer description here.' }]
                              });
                            }}
                            style={{
                              alignSelf: 'flex-start',
                              color: 'var(--primary-lime)',
                              border: '1px dashed var(--primary-lime)',
                              backgroundColor: 'transparent',
                              padding: '8px 16px',
                              borderRadius: 'var(--radius-md)',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            + Add FAQ
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Trust Certificates */}
                  {(editable || (Array.isArray(pooja.certificates) && pooja.certificates.length > 0)) && (
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                        {renderSectionHeaderIcon('cert', <ShieldCheck size={22} style={{ color: 'var(--primary-lime)' }} />)} {isHindi ? "प्रामाणिकता एवं प्रमाणन" : "Authenticity & Certification"}
                      </h2>
                      <div style={{
                        backgroundColor: '#ffffff',
                        padding: '24px',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-light)',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                      }}>
                        {editable ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {(pooja.certificates || []).map((cert, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                  fontSize: '0.82rem',
                                  fontWeight: 800,
                                  color: 'var(--text-muted)',
                                  minWidth: '55px',
                                  flexShrink: 0
                                }}>
                                  Step {idx + 1}
                                </div>
                                <input
                                  type="text"
                                  value={cert.name || ''}
                                  onChange={(e) => {
                                    const updated = [...(pooja.certificates || [])];
                                    updated[idx] = { ...updated[idx], name: e.target.value };
                                    onUpdate && onUpdate({ certificates: updated });
                                  }}
                                  placeholder={`Enter step ${idx + 1} details...`}
                                  style={{
                                    flexGrow: 1,
                                    padding: '8px 12px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-light)',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = pooja.certificates!.filter((_, i) => i !== idx);
                                    onUpdate && onUpdate({ certificates: updated });
                                  }}
                                  style={{
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: '#ef4444',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="Delete Step"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const current = pooja.certificates || [];
                                onUpdate && onUpdate({
                                  certificates: [...current, { name: '', issuer: '', url: '' }]
                                });
                              }}
                              style={{
                                alignSelf: 'flex-start',
                                color: 'var(--primary-lime)',
                                border: '1px dashed var(--primary-lime)',
                                backgroundColor: 'transparent',
                                padding: '8px 16px',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                marginTop: '8px'
                              }}
                            >
                              + Add Step
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {(pooja.certificates || [])
                              .filter(c => c.name && c.name.trim() !== '')
                              .map((cert, idx, arr) => (
                                <div key={idx} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                                  {/* Timeline connector line */}
                                  {idx < arr.length - 1 && (
                                    <div style={{
                                      position: 'absolute',
                                      left: '15px',
                                      top: '30px',
                                      bottom: '-22px',
                                      width: '2px',
                                      background: 'linear-gradient(to bottom, var(--primary-lime) 0%, #e5e7eb 100%)'
                                    }} />
                                  )}
                                  
                                  {/* Step Badge */}
                                  <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--primary-lime-light)',
                                    color: 'var(--primary-forest)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.85rem',
                                    fontWeight: 800,
                                    border: '2px solid var(--primary-lime)',
                                    flexShrink: 0,
                                    zIndex: 1
                                  }}>
                                    {idx + 1}
                                  </div>

                                  {/* Step Content */}
                                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1 }}>
                                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', lineHeight: '1.4' }}>
                                      {tDetail(cert.name)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </div>
          </section>
        )}

      {/* Customer Reels Stories Showcase Carousel */}
      <VidyaCustomerStoriesSection
        activeProducts={activeProducts}
        onViewDetails={onViewDetails}
      />

      {/* Reviews Section */}
      {(!reviewsHidden || editable) && (
        <section style={{
          marginTop: isVidyaRudraksh ? '32px' : '56px',
          borderTop: isVidyaRudraksh ? 'none' : '1px solid var(--border-light)',
          paddingTop: isVidyaRudraksh ? '0px' : '40px'
        }}>
          <div className="container">
            {editable && (
              <div style={{
                backgroundColor: reviewsHidden ? '#fffbeb' : '#f0fdf4',
                border: `1.5px solid ${reviewsHidden ? 'rgba(217, 119, 6, 0.25)' : 'rgba(22, 163, 74, 0.25)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '16px 24px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                textAlign: 'left'
              }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: reviewsHidden ? '#b45309' : '#15803d', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    {reviewsHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                    Reviews Section Visibility (Admin Control)
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', margin: '4px 0 0' }}>
                    {reviewsHidden 
                      ? "Currently HIDDEN from customers on the live website. The page layout automatically collapses to fit other sections."
                      : "Currently VISIBLE to customers on the live website."
                    }
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleReviewsHidden}
                  className="btn-lime"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: reviewsHidden ? 'var(--primary-lime)' : '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {reviewsHidden ? 'Show Reviews Section' : 'Hide Reviews Section'}
                </button>
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: editable ? '1.2fr 0.8fr' : '1fr',
              gap: '40px',
              alignItems: 'start',
              opacity: reviewsHidden ? 0.6 : 1,
              transition: 'opacity 0.25s ease'
            }} className={editable ? "hero-grid-split" : ""}>

              {/* Reviews list */}
              {isVidyaRudraksh ? (
                <VidyaReviewsSection
                  reviews={reviews}
                  editable={editable}
                  handleWriteReviewClick={() => {
                    if (editable) {
                      const formElement = document.getElementById('admin-review-form');
                      if (formElement) {
                        formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    } else {
                      alert("Blessing reviews are submitted by verified devotees post-delivery. Thank you for your support!");
                    }
                  }}
                  handleDeleteReview={handleDeleteReview}
                  isVidyaRudraksh={isVidyaRudraksh}
                />
              ) : (
                <div style={{ textAlign: 'left' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={20} style={{ color: 'var(--primary-lime)' }} /> {isHindi ? "सत्यापित भक्तों की समीक्षाएं" : "Verified Devotee Reviews"}
                  </h2>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: editable ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '24px'
                  }}>
                    {reviews.length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)', backgroundColor: '#fafafa', gridColumn: '1 / -1' }}>
                        <p style={{ fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>{isHindi ? "इस उत्पाद के लिए अभी तक कोई समीक्षा नहीं है।" : "No reviews yet for this product."}</p>
                        {editable && <p style={{ fontSize: '0.78rem', marginTop: '4px', margin: '4px 0 0' }}>{isHindi ? "दाहिनी ओर पहला आशीर्वाद समीक्षा साझा करने वाले बनें!" : "Be the first to share a blessing review on the right!"}</p>}
                      </div>
                    ) : (
                      reviews.map((rev) => (
                        <div
                          key={rev.id}
                          style={{
                            padding: '24px',
                            backgroundColor: '#ffffff',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-light)',
                            boxShadow: 'var(--shadow-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            position: 'relative'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {/* Initials Avatar */}
                              <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #f97316 0%, #d97706 100%)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                boxShadow: '0 2px 4px rgba(249, 115, 22, 0.25)',
                                flexShrink: 0
                              }}>
                                {rev.author.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-dark)' }}>{rev.author}</span>
                                  {rev.verified !== false && (
                                    <span
                                      style={{
                                        fontSize: '0.68rem',
                                        backgroundColor: '#dcfce7',
                                        color: '#15803d',
                                        fontWeight: 800,
                                        padding: '2px 6px',
                                        borderRadius: '12px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '2px'
                                      }}
                                      title="Verified Devotee Purchase"
                                    >
                                      {isHindi ? "✓ सत्यापित" : "✓ Verified"}
                                    </span>
                                  )}
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{rev.date}</span>
                              </div>
                            </div>

                            {editable && (
                              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingReviewId(rev.id);
                                    setReviewName(rev.author);
                                    setReviewRating(rev.rating);
                                    setReviewComment(rev.content);
                                    const parts = rev.date.split(' – ');
                                    setReviewLocation(parts[1] || '');
                                    setTempImageUrls(rev.imageUrls || []);
                                    setTempVideoUrls(rev.videoUrls || []);
                                    const formElement = document.getElementById('admin-review-form');
                                    if (formElement) {
                                      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary-forest)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--primary-lime-light)',
                                    transition: 'background-color 0.2s'
                                  }}
                                  title="Edit Review (Admin)"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReview(rev.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    backgroundColor: '#fef2f2',
                                    transition: 'background-color 0.2s'
                                  }}
                                  title="Delete Review (Admin)"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={14}
                                fill={s <= rev.rating ? '#fbbf24' : 'none'}
                                color="#fbbf24"
                              />
                            ))}
                          </div>

                          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0, fontStyle: 'italic', textAlign: 'left' }}>
                            "{rev.content}"
                          </p>

                          {/* Review Media: Images & Videos */}
                          {((rev.imageUrls && rev.imageUrls.length > 0) || (rev.videoUrls && rev.videoUrls.length > 0)) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                              {/* Images Gallery */}
                              {rev.imageUrls && rev.imageUrls.length > 0 && (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {rev.imageUrls.map((url, i) => (
                                    <a
                                      key={i}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: 'var(--radius-sm)',
                                        overflow: 'hidden',
                                        border: '1px solid var(--border-light)',
                                        boxShadow: 'var(--shadow-sm)',
                                        display: 'block'
                                      }}
                                    >
                                      <img
                                        src={url}
                                        alt={`Review file ${i + 1}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                    </a>
                                  ))}
                                </div>
                              )}

                              {/* Videos */}
                              {rev.videoUrls && rev.videoUrls.length > 0 && (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {rev.videoUrls.map((url, i) => (
                                    <video
                                      key={i}
                                      src={url}
                                      controls
                                      preload="metadata"
                                      style={{
                                        maxWidth: '100%',
                                        height: '80px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border-light)',
                                        boxShadow: 'var(--shadow-sm)'
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Write a review form */}
              {editable && (
                <div
                  id="admin-review-form"
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '30px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-light)',
                    boxShadow: 'var(--shadow-sm)',
                    textAlign: 'left',
                    alignSelf: 'start'
                  }}
                >
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '16px' }}>
                    {editingReviewId ? 'Edit Devotee Review (Admin Panel)' : 'Add Devotee Review (Admin Panel)'}
                  </h3>
                  <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800 }}>Devotee Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Priyanshu Verma"
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                          outline: 'none',
                          fontSize: '0.88rem'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800 }}>Location (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Delhi, Mumbai"
                        value={reviewLocation}
                        onChange={(e) => setReviewLocation(e.target.value)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                          outline: 'none',
                          fontSize: '0.88rem'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800 }}>Star Rating</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setReviewRating(s)}
                            style={{ padding: '4px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                          >
                            <Star
                              size={24}
                              fill={s <= reviewRating ? '#fbbf24' : 'none'}
                              color="#fbbf24"
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800 }}>Review Comment</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Share devotee feedback about this item..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                          outline: 'none',
                          fontSize: '0.88rem',
                          fontFamily: 'inherit',
                          resize: 'none'
                        }}
                      />
                    </div>

                    {/* Media Upload: Images */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800 }}>Add Images</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleReviewImageUpload}
                          disabled={uploadingReviewImage}
                          style={{ fontSize: '0.8rem', width: '100%' }}
                        />
                        {uploadingReviewImage && <span style={{ fontSize: '0.75rem', color: 'var(--primary-lime)' }}>Uploading...</span>}
                      </div>
                      
                      {/* Uploaded Images Previews */}
                      {tempImageUrls.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                          {tempImageUrls.map((url, idx) => (
                            <div key={idx} style={{ position: 'relative', width: '50px', height: '50px', border: '1px solid var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                              <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button
                                type="button"
                                onClick={() => setTempImageUrls(prev => prev.filter((_, i) => i !== idx))}
                                style={{
                                  position: 'absolute',
                                  top: 0, right: 0,
                                  backgroundColor: 'rgba(239, 68, 68, 0.8)',
                                  color: '#ffffff',
                                  border: 'none',
                                  fontSize: '0.6rem',
                                  padding: '2px 4px',
                                  cursor: 'pointer'
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Media Upload: Videos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800 }}>Add Videos</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={handleReviewVideoUpload}
                          disabled={uploadingReviewVideo}
                          style={{ fontSize: '0.8rem', width: '100%' }}
                        />
                        {uploadingReviewVideo && <span style={{ fontSize: '0.75rem', color: 'var(--primary-lime)' }}>Uploading...</span>}
                      </div>

                      {/* Uploaded Videos Previews */}
                      {tempVideoUrls.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                          {tempVideoUrls.map((url, idx) => (
                            <div key={idx} style={{ position: 'relative', width: '80px', height: '50px', border: '1px solid var(--border-light)', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
                              <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button
                                type="button"
                                onClick={() => setTempVideoUrls(prev => prev.filter((_, i) => i !== idx))}
                                style={{
                                  position: 'absolute',
                                  top: 0, right: 0,
                                  backgroundColor: 'rgba(239, 68, 68, 0.8)',
                                  color: '#ffffff',
                                  border: 'none',
                                  fontSize: '0.6rem',
                                  padding: '2px 4px',
                                  cursor: 'pointer'
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                      <button
                        type="submit"
                        className="btn-lime"
                        style={{
                          flexGrow: 1,
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          justifyContent: 'center',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {editingReviewId ? 'Update Devotee Review' : 'Submit Blessing Review'}
                      </button>
                      {editingReviewId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReviewId(null);
                            setReviewName('');
                            setReviewComment('');
                            setReviewLocation('');
                            setTempImageUrls([]);
                            setTempVideoUrls([]);
                          }}
                          style={{
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            backgroundColor: '#f3f4f6',
                            color: 'var(--text-dark)',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Related Products Grid */}
      <section style={{ marginTop: '56px', borderTop: '1px solid var(--border-light)', paddingTop: '40px' }}>
        <div className="container">
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '24px', textAlign: 'left' }}>
            {isHindi ? "संबंधित अनुशंसित उत्पाद" : "Recommended Related Items"}
          </h2>

          {editable && (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid rgba(249, 115, 22, 0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              marginBottom: '32px',
              boxShadow: 'var(--shadow-md)',
              textAlign: 'left'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🕉️ Curate Recommended Related Items
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
                Search, filter, and choose from your active catalog to display as recommended related products on this Puja page.
              </p>

              {/* Search & Category Filter Controls */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '20px',
                alignItems: 'center'
              }}>
                {/* Search Box */}
                <div style={{ position: 'relative', flexGrow: 1, minWidth: '240px' }}>
                  <input
                    type="text"
                    placeholder="Search by product title..."
                    value={relatedSearch}
                    onChange={(e) => setRelatedSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                      transition: 'all 0.15s'
                    }}
                  />
                  <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}>
                    🔍
                  </span>
                </div>

                {/* Category Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Filter Category:</span>
                  <select
                    value={relatedCategoryFilter}
                    onChange={(e) => setRelatedCategoryFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      backgroundColor: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="All">All Categories</option>
                    {Array.from(new Set(activeProducts.map(p => p.category))).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rich Selection Grid */}
              <div style={{
                maxHeight: '260px',
                overflowY: 'auto',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '12px',
                backgroundColor: '#fafafa'
              }}>
                {activeProducts
                  .filter(p => p.id !== product.id)
                  .filter(p => {
                    const matchesSearch = p.name.toLowerCase().includes(relatedSearch.toLowerCase());
                    const matchesCategory = relatedCategoryFilter === 'All' || p.category === relatedCategoryFilter;
                    return matchesSearch && matchesCategory;
                  })
                  .map(p => {
                    const isChecked = pooja.relatedProducts?.includes(p.id) || false;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          const currentList = pooja.relatedProducts || [];
                          const updatedList = isChecked
                            ? currentList.filter(id => id !== p.id)
                            : [...currentList, p.id];
                          onUpdate && onUpdate({ relatedProducts: updatedList });
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: isChecked ? 'rgba(132, 204, 22, 0.08)' : '#ffffff',
                          border: `1.5px solid ${isChecked ? 'var(--primary-lime)' : 'var(--border-light)'}`,
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: isChecked ? '0 2px 8px rgba(132, 204, 22, 0.15)' : 'var(--shadow-sm)',
                          transition: 'all 0.2s',
                          userSelect: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          if (!isChecked) e.currentTarget.style.borderColor = 'var(--primary-gold)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          if (!isChecked) e.currentTarget.style.borderColor = 'var(--border-light)';
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          style={{ accentColor: '#84cc16', cursor: 'pointer', pointerEvents: 'none' }}
                        />
                        <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>
                          {isImageUrl(p.image) ? '📿' : p.image}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flexGrow: 1 }}>
                          <span style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-dark)' }}>
                            {p.name}
                          </span>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {p.category}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-accent)' }}>
                              ₹{p.price}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '30px'
          }} className="category-product-grid">
            {resolvedRelated.map((p) => {
              const isLiked = wishlist[p.id];
              const discount = p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;

              return (
                <div
                  key={p.id}
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
                    height: '100%',
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
                      background: categoryGradients[p.category.toLowerCase()] || categoryGradients['default'],
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f9fafb'
                    }}
                  >
                    {p.image && isImageUrl(p.image) ? (
                      <img 
                        src={getDisplayImageUrl(p.image)} 
                        alt={p.name} 
                        className="card-image"
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }} 
                      />
                    ) : (
                      <span style={{ fontSize: '4rem' }}>{p.image}</span>
                    )}

                    {/* Ribbon Badge */}
                    {discount > 0 && p.inStock && (
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
                        {discount}%<br/>OFF
                      </div>
                    )}

                    {/* Heart Button */}
                    <button
                      onClick={() => onToggleWishlist(p.id)}
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
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)' }}>{p.rating}</span>
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
                        onClick={() => {
                          onViewDetails(p);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: 'var(--text-dark)',
                          marginBottom: '6px',
                          cursor: 'pointer',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: '1.2'
                        }}
                      >
                        {p.name}
                      </h3>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                          ₹{p.price}
                        </span>
                        {p.originalPrice && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            ₹{p.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <div style={{ marginTop: 'auto' }}>
                      {p.inStock ? (
                        (() => {
                          const cartItem = cart.find(item => item.product.id === p.id);
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
                                    onUpdateQuantity(p.id, qty - 1);
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
                                  {isHindi ? `कार्ट में ${qty}` : `${qty} in Cart`}
                                </span>
                                <button
                                  className="qty-plus-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateQuantity(p.id, qty + 1);
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
                                onAddToCart(p, 1);
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
                              {isHindi ? "कार्ट में जोड़ें" : "Add To Cart"}
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
                          {isHindi ? "आउट ऑफ स्टॉक" : "Out of Stock"}
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



      {/* Visual Toast Notification Overlay */}
      {showShareToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--primary-forest)',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-lg)',
          fontSize: '0.88rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1000
        }}>
          <Check size={16} style={{ color: 'var(--primary-lime)' }} />
          <span>{activeToastMsg}</span>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && resolvedGallery[lightboxIndex] && (
        <div
          onClick={() => setLightboxIndex(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              zIndex: 10000
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
          >
            <X size={24} />
          </button>

          {/* Left Arrow */}
          {resolvedGallery.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev !== null ? (prev - 1 + resolvedGallery.length) % resolvedGallery.length : null));
              }}
              style={{
                position: 'absolute',
                left: '24px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                zIndex: 10000
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Right Arrow */}
          {resolvedGallery.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev !== null ? (prev + 1) % resolvedGallery.length : null));
              }}
              style={{
                position: 'absolute',
                right: '24px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                zIndex: 10000
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Center Image Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {resolvedGallery[lightboxIndex].isVideo ? (
              <video
                src={resolvedGallery[lightboxIndex].url}
                poster={pooja.uiLabels?.videoThumbnail || undefined}
                controls
                autoPlay
                playsInline
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              />
            ) : (
              <img
                src={getDisplayImageUrl(resolvedGallery[lightboxIndex].url)}
                alt={resolvedGallery[lightboxIndex].alt}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              />
            )}
          </div>

          {/* Image Info / Sliders Count */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 600,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              backdropFilter: 'blur(4px)'
            }}
          >
            {resolvedGallery[lightboxIndex].alt || product.name} ({lightboxIndex + 1} of {resolvedGallery.length})
          </div>
        </div>
      )}

      {/* Mobile Floating Bottom Bar */}
      <div className="mobile-floating-bar" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--border-light)',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
        padding: '10px 16px 14px 16px',
        zIndex: 40,
        display: 'none',
        flexDirection: 'column',
        gap: '8px',
        textAlign: 'left'
      }}>
        {/* Price Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          <span 
            className={singleItemPrice === 1 ? "highlight-price-flash" : ""} 
            style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--primary-forest)' }}
          >
            ₹{singleItemPrice.toFixed(2)}
          </span>
          {originalItemPrice && (
            <>
              <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.85rem' }}>₹{originalItemPrice.toFixed(2)}</span>
              {discountPct === 100 || singleItemPrice === 1 ? (
                <span className="limited-offer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} style={{ animation: 'clock-vibrate 3s infinite ease-in-out' }} />
                  {isHindi ? "सीमित समय का ऑफर" : "Limited Offer"}
                </span>
              ) : (
                <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.78rem' }}>{discountPct}% OFF</span>
              )}
            </>
          )}
        </div>
        
        {/* Action Buttons Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            onClick={handleAddToCartClick}
            style={{
              backgroundColor: '#fbbf24',
              color: '#111827',
              fontWeight: 800,
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              fontSize: '0.88rem',
              textTransform: 'uppercase',
              boxShadow: '0 2px 4px rgba(251, 191, 36, 0.15)'
            }}
          >
            {isHindi ? "कार्ट में जोड़ें" : "Add to Cart"}
          </button>
          <button
            onClick={handleBuyNowClick}
            className="btn-buy-now-saffron-glass"
            style={{
              fontWeight: 800,
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              fontSize: '0.88rem',
              textTransform: 'uppercase'
            }}
          >
            {isHindi ? "अभी खरीदें" : "Buy Now"}
          </button>
        </div>
      </div>

    </div>
  );
};
