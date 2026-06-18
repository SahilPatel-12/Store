export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  category: string;
  inStock: boolean;
  benefits: string[];
  popularity: number; // 1 to 100
  spiritualType: 'Rituals' | 'Meditation' | 'Vastu' | 'Wisdom' | 'Aromatherapy';
  subtitle?: string;
  shortDescription?: string;
  purchaseLimit?: number;
}

export interface PoojaProduct extends Product {
  sanskritName?: string;
  shortName?: string;
  slug: string;
  subtitle?: string;
  shortDescription?: string;
  spiritualSignificance?: string;
  material?: string;
  weight?: string;
  dimensions?: string;
  origin?: string;
  customIcons?: {
    significance?: string;
    rituals?: string;
    samagri?: string;
    guidelines?: string;
    priest?: string;
    cert?: string;
  };
  ritualsIncluded?: Array<{ name: string; description: string; duration?: string }>;
  samagriList?: Array<{ name: string; quantity: string; description?: string }>;
  priestDetails?: { name: string; experience?: string; bio?: string; qualification?: string };
  duration?: string;
  idealOccasions?: string[];
  templeAssociation?: string;
  whoShouldPerform?: string;
  offers?: string[];
  badges?: string[];
  testimonials?: Array<{ author: string; content: string; location?: string; rating?: number }>;
  faqs?: Array<{ question: string; answer: string }>;
  bookingInstructions?: string;
  ctaLabels?: { primary?: string; secondary?: string };
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogData?: { title?: string; description?: string; image?: string };
  schemaMarkup?: Record<string, any>;
  imageAlt?: string;
  imageCaption?: string;
  isFeatured: boolean;
  isTrending: boolean;
  recommendationLogic?: string;
  relatedProducts?: string[];
  videoUrl?: string;
  translations?: Record<string, any>;
  uiLabels?: Record<string, string>;
  publishedAt?: string;
  isPublished: boolean;
  bannerImage?: string;
  galleryImages?: Array<{ url: string; alt?: string; caption?: string }>;
  ritualImages?: Array<{ url: string; name?: string; description?: string }>;
  priestImage?: string;
  certificates?: Array<{ url: string; name?: string; issuer?: string }>;
  iconImage?: string;
  promoCreatives?: Array<{ url: string; position?: string }>;
  gstOverrideEnabled?: boolean;
  customGst?: number;
  deliveryOverrideEnabled?: boolean;
  customDelivery?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface LocalOrder {
  orderId: string;
  userId?: string;
  placedAt: Date;
  total: number;
  subtotal: number;
  discount: number;
  discountPercent: number;
  shipping: number;
  tax: number;
  paymentMethod: string;
  deliveryCity: string;
  deliveryState: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  pincode: string;
  status: string; // 'Being Packed' | 'Shipped' | 'Delivered' | 'Cancelled'
  items: CartItem[];
  razorpayPaymentId?: string;
  paymentScreenshot?: string;
  paymentStatus?: string;
  paymentDeclineCount?: number;
  gstPercentSnapshot?: number;
  gstAmountSnapshot?: number;
  deliveryAmountSnapshot?: number;
  freeDeliveryEligibleSnapshot?: boolean;
}

