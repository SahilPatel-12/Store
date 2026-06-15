
import React from 'react';
import { Heart, ShoppingBag, Star, Share2, ShieldCheck, Check, Clock, ChevronRight, MessageSquare, Info, User, Award, Calendar, ChevronDown, BookOpen, Upload, Plus, Minus, Trash2, Eye, EyeOff, X, ChevronLeft, ZoomIn, Play, Pencil } from 'lucide-react';
import type { Product, PoojaProduct } from '../types';
import { InlineEdit } from './InlineEdit';
import { uploadToR2 } from '../lib/cloudflare/r2';
import { isImageUrl, getDisplayImageUrl } from '../lib/imageHelper';

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
}) => {
  const activeProducts = productsProp || [];
  const [activeTab, setActiveTab] = React.useState<'specs' | 'shipping'>('specs');
  const [quantity, setQuantity] = React.useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = React.useState<number>(0);
  const [showShareToast, setShowShareToast] = React.useState<boolean>(false);
  const [activeToastMsg, setActiveToastMsg] = React.useState<string>('');
  const [expandedFaqIndex, setExpandedFaqIndex] = React.useState<number | null>(null);
  const [isCapturingThumbnail, setIsCapturingThumbnail] = React.useState<boolean>(false);

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
      list = pooja.galleryImages.map(img => ({
        url: img.url,
        alt: img.alt || pooja.name,
        isEmoji: false,
        gradient: 'none',
        isVideo: (img as any).isVideo || false,
        thumbnail: (img as any).thumbnail
      }));
    } else {
      list = [
        { url: product.image, alt: product.name, isEmoji: !isRealUrl(product.image), gradient: selectedGradient, isVideo: false },
        { url: product.image, alt: product.name, isEmoji: !isRealUrl(product.image), gradient: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', isVideo: false },
        { url: '🕉️', alt: 'Om', isEmoji: true, gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', isVideo: false }
      ];
    }

    // Auto-append legacy video if present
    const poojaProd = product as PoojaProduct;
    if (poojaProd.videoUrl) {
      list.push({
        url: poojaProd.videoUrl,
        alt: 'Product Video',
        isEmoji: false,
        gradient: 'none',
        isVideo: true,
        thumbnail: poojaProd.uiLabels?.videoThumbnail
      });
    }
    return list;
  }, [product, pooja, selectedGradient]);

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
                    const cdnUrl = await uploadToR2(file, `section-icons-${section}`);
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
    <div style={{ paddingBottom: '80px', backgroundColor: '#fafafa', position: 'relative' }}>

      {/* Breadcrumbs Row */}
      <div className="container" style={{ paddingTop: '24px', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'left' }}>
          <span style={{ cursor: 'pointer', fontWeight: 600 }} onClick={onBackToShop}>Shop</span>
          <ChevronRight size={14} />
          <span style={{ cursor: 'pointer', fontWeight: 600 }}>{product.category}</span>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text-dark)', fontWeight: 700 }}>{product.name}</span>
        </div>
      </div>

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Primary Image View */}
            <div 
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
              {!resolvedGallery[activeImageIndex]?.isEmoji && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(activeImageIndex);
                  }}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
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
                  title="View full screen"
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <ZoomIn size={18} />
                </button>
              )}
              {resolvedGallery[activeImageIndex] ? (
                resolvedGallery[activeImageIndex].isVideo ? (
                  <video
                    id="pooja-product-video-player"
                    src={resolvedGallery[activeImageIndex].url}
                    poster={resolvedGallery[activeImageIndex].thumbnail || undefined}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    crossOrigin="anonymous"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : resolvedGallery[activeImageIndex].isEmoji ? (
                  <span style={{ fontSize: '8rem', userSelect: 'none', filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.15))' }}>
                    {resolvedGallery[activeImageIndex].url}
                  </span>
                ) : (
                  <img
                    src={getDisplayImageUrl(resolvedGallery[activeImageIndex].url)}
                    alt={resolvedGallery[activeImageIndex].alt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                          const cdnUrl = await uploadToR2(file, 'products/gallery');
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

              {/* Authenticity Badge */}
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
                <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px' }}>100% Temple Blessed & Energized</span>
              </div>
            </div>

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
                            const cdnUrl = await uploadToR2(file, 'products/thumbnails');
                            
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
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              {resolvedGallery.map((img, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
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
                      width: '80px',
                      height: '80px',
                      borderRadius: 'var(--radius-md)',
                      background: img.gradient !== 'none' ? img.gradient : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: activeImageIndex === idx ? '2px solid var(--primary-lime)' : '1px solid var(--border-light)',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.15s',
                      overflow: 'hidden',
                      padding: 0
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
                        ) : null}
                        <Play size={24} fill="currentColor" style={{ zIndex: 2 }} />
                      </div>
                    ) : img.isEmoji ? (
                      <span style={{ fontSize: '2.2rem' }}>{img.url}</span>
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
                      width: '80px',
                      height: '80px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--primary-lime)',
                      backgroundColor: 'rgba(132, 204, 22, 0.05)',
                      color: 'var(--primary-lime)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(132, 204, 22, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(132, 204, 22, 0.05)'}
                  >
                    <Upload size={18} />
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
                          const cdnUrl = await uploadToR2(file, 'products/gallery');
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
                      width: '80px',
                      height: '80px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed #3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      color: '#3b82f6',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      gap: '4px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)'}
                  >
                    <Play size={18} />
                    <span>Add Video</span>
                  </label>
                  <input
                    id={`detail-video-add-${product.id}`}
                    type="file"
                    accept="video/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && onUpdate) {
                        try {
                          const cdnUrl = await uploadToR2(file, 'products/videos');
                          const currentGallery = pooja.galleryImages || [{ url: product.image, alt: product.name }];
                          onUpdate({
                            galleryImages: [...currentGallery, { url: cdnUrl, alt: 'Product Video', isVideo: true } as any]
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

            {/* Accordion Tabs Info Blocks */}
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
                  Material & Dimensions
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
                  Shipping & Returns
                </button>
              </div>

              {/* Tab Contents */}
              <div style={{ padding: '24px', textAlign: 'left' }}>
                {activeTab === 'specs' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', fontSize: '0.88rem', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Material</span>
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
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Weight</span>
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
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Dimensions</span>
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
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Origin</span>
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
                      Fast Delivery: Shipped within 24-48 hours. Delivered in 3-5 business days.
                    </p>
                    <p>
                      Every spiritual item is packed carefully in sanitized cushions to maintain sacred purity and avoid transit damages.
                    </p>
                    <p style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                      Return Policy: Easy 7-day hassle-free returns on standard items if package is unopened and pristine.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Right Column: Title, Specs, Variant, Quantity, and Main Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>

            {/* Title & Reviews Row */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
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
                  {product.spiritualType}
                </span>

                {/* Share Button */}
                <button
                  onClick={handleShareClick}
                  style={{
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-lime)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Share2 size={16} /> Share
                </button>
              </div>

              <h1 style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: 'var(--text-dark)',
                lineHeight: '1.2',
                marginBottom: '4px'
              }}>
                {editable ? (
                  <InlineEdit
                    value={product.name}
                    onChange={(val) => onUpdate && onUpdate({ name: val })}
                    placeholder="Product Name"
                  />
                ) : (
                  product.name
                )}
              </h1>
              {(editable || pooja.sanskritName) && (
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
              {(editable || pooja.subtitle) && (
                <p style={{
                  fontSize: '0.92rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  marginBottom: '12px',
                  lineHeight: '1.4'
                }}>
                  {editable ? (
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

              {/* Star Rating summary */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      fill={s <= Math.round(product.rating) ? '#fbbf24' : 'none'}
                      color="#fbbf24"
                    />
                  ))}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)' }}>{product.rating}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({reviews.length} customer reviews)</span>
              </div>
            </div>

            {/* Pricing Section with Dynamic Modifier */}
            <div style={{
              padding: '16px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'baseline',
              gap: '12px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary-forest)' }}>
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
                  )}
                </>
              )}
            </div>

            {/* Quantity Selector & Wishlist */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-dark)' }}>Quantity</span>
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
                    onClick={() => setQuantity(prev => prev + 1)}
                    style={{ padding: '8px 16px', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-muted)' }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Dynamic total feedback */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Cost</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                  ₹{totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 0.5fr', gap: '12px', marginTop: '8px' }}>
              {(() => {
                const cartItem = cart.find(item => item.product.id === product.id);
                const qty = cartItem ? cartItem.quantity : 0;
                if (qty > 0) {
                  return (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--primary-deep)',
                      borderRadius: 'var(--radius-md)',
                      padding: '5px',
                      height: '54px',
                      boxSizing: 'border-box'
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
                        <Minus size={16} strokeWidth={2.5} />
                      </button>
                      <span style={{
                        color: '#ffffff',
                        fontWeight: '800',
                        fontSize: '0.95rem',
                        userSelect: 'none'
                      }}>
                        {qty} in Cart
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
                    <ShoppingBag size={18} /> Add to Cart
                  </button>
                );
              })()}

              <button
                onClick={handleBuyNowClick}
                style={{
                  backgroundColor: 'var(--primary-forest)',
                  color: '#ffffff',
                  fontWeight: 800,
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'opacity 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Buy It Now
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

            {/* Description */}
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

            {/* Spiritual Benefits Bullet Points */}
            <div style={{
              backgroundColor: 'var(--primary-lime-light)',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(249, 115, 22, 0.15)'
            }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={16} /> Spiritual Benefits & Blessings
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

          </div>
        </div>
      </section>

      {/* Detailed Pooja Description & Spiritual Elements */}
      {((pooja.spiritualSignificance && pooja.spiritualSignificance !== '') ||
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
                        {renderSectionHeaderIcon('significance', <BookOpen size={22} />)} Spiritual Significance
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
                          pooja.spiritualSignificance
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rituals Included (Timeline) */}
                  {(Array.isArray(pooja.ritualsIncluded) && pooja.ritualsIncluded.length > 0) && (
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                        {renderSectionHeaderIcon('rituals', <Calendar size={22} />)} Rituals & Vedic Steps Included ({pooja.ritualsIncluded?.length || 0})
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
                                      ritual.name
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
                                  ritual.description
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
                        {renderSectionHeaderIcon('samagri', <Award size={22} />)} Sacred Samagri (Included Ingredients)
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
                                  samagri.name
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
                                  samagri.quantity
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
                                samagri.description
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
                        {renderSectionHeaderIcon('guidelines', <Info size={22} />)} Booking & Performance Guidelines
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
                          pooja.bookingInstructions
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
                        {renderSectionHeaderIcon('priest', <User size={22} />)} Assigned Priest Details
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
                                        const cdnUrl = await uploadToR2(file, 'priests');
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
                              pooja.priestDetails?.name
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
                                pooja.priestDetails?.qualification
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
                                pooja.priestDetails?.experience
                              )} of Vedic Rituals
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
                                pooja.priestDetails?.bio
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
                        🕉️ Frequently Asked Questions
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
                                    faq.question
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
                                    faq.answer
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
                        {renderSectionHeaderIcon('cert', <ShieldCheck size={22} style={{ color: 'var(--primary-lime)' }} />)} Authenticity & Certification
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
                                      {cert.name}
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

      {/* Reviews Section */}
      {(!reviewsHidden || editable) && (
        <section style={{ marginTop: '56px', borderTop: '1px solid var(--border-light)', paddingTop: '40px' }}>
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
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={20} style={{ color: 'var(--primary-lime)' }} /> Verified Devotee Reviews
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: editable ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
                  gap: '24px'
                }}>
                  {reviews.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)', backgroundColor: '#fafafa', gridColumn: '1 / -1' }}>
                      <p style={{ fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>No reviews yet for this product.</p>
                      {editable && <p style={{ fontSize: '0.78rem', marginTop: '4px', margin: '4px 0 0' }}>Be the first to share a blessing review on the right!</p>}
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
                                    ✓ Verified
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
            Recommended Related Items
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
                Search, filter, and choose from your active catalog to display as recommended related products on this Pooja page.
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
                                  {qty} in Cart
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

    </div>
  );
};
