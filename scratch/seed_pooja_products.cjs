const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or key is missing from .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const r2Base = 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/';

// Read R2 file list
const r2ListPath = path.join(__dirname, 'r2_files_list.json');
if (!fs.existsSync(r2ListPath)) {
  console.error('r2_files_list.json not found. Run list_r2_products_json.cjs first.');
  process.exit(1);
}

const r2Data = JSON.parse(fs.readFileSync(r2ListPath, 'utf-8'));

// Categorize R2 files
const r1Images = [];
const r2Images = [];
const r3Images = [];
const r4Images = [];
const r5Images = [];

const tImages = [];
const oImages = [];
const dImages = [];
const tmImages = [];
const hImages = [];
const bImages = [];
const lImages = [];
let k1Image = '';
let horsesImage = '';

r2Data.forEach(item => {
  const key = item.key;
  if (key.startsWith('products/gallery/')) {
    if (key.endsWith('_r1.png')) r1Images.push(r2Base + key);
    else if (key.endsWith('_r2.png')) r2Images.push(r2Base + key);
    else if (key.endsWith('_r3.png')) r3Images.push(r2Base + key);
    else if (key.endsWith('_r4.png')) r4Images.push(r2Base + key);
    else if (key.endsWith('_r5.png')) r5Images.push(r2Base + key);
    
    else if (key.endsWith('_t1.png') || key.endsWith('_t2.png') || key.endsWith('_t3.png') || key.endsWith('_t4.png') || key.endsWith('_t5.png')) tImages.push(r2Base + key);
    else if (key.endsWith('_o1.png') || key.endsWith('_o2.png') || key.endsWith('_o3.png') || key.endsWith('_o4.png') || key.endsWith('_o5.png')) oImages.push(r2Base + key);
    else if (key.endsWith('_d1.png') || key.endsWith('_d2.png') || key.endsWith('_d3.png') || key.endsWith('_d4.png') || key.endsWith('_d5.png')) dImages.push(r2Base + key);
    else if (key.endsWith('_tm1.png') || key.endsWith('_tm2.png') || key.endsWith('_tm3.png') || key.endsWith('_tm4.png') || key.endsWith('_tm5.png')) tmImages.push(r2Base + key);
    else if (key.endsWith('_h1.png') || key.endsWith('_h2.png') || key.endsWith('_h3.png') || key.endsWith('_h4.png') || key.endsWith('_h5.png')) hImages.push(r2Base + key);
    else if (key.endsWith('_b1.png') || key.endsWith('_b2.png') || key.endsWith('_b3.png')) bImages.push(r2Base + key);
    else if (key.endsWith('_l1.png') || key.endsWith('_l2.png') || key.endsWith('_l3.png') || key.endsWith('_l4.png') || key.endsWith('_l5.png')) lImages.push(r2Base + key);
    else if (key.endsWith('_k1.png')) k1Image = r2Base + key;
    else if (key.includes('AI_Golden_Arch_Frame')) horsesImage = r2Base + key;
  }
});

r1Images.sort();
r2Images.sort();
r3Images.sort();
r4Images.sort();
r5Images.sort();
tImages.sort();
oImages.sort();
dImages.sort();
tmImages.sort();
hImages.sort();
bImages.sort();
lImages.sort();

console.log(`Loaded image counts: r1=${r1Images.length}, r2=${r2Images.length}, r3=${r3Images.length}, r4=${r4Images.length}, r5=${r5Images.length}`);
console.log(`Loaded other counts: t=${tImages.length}, o=${oImages.length}, d=${dImages.length}, tm=${tmImages.length}, h=${hImages.length}, b=${bImages.length}, l=${lImages.length}`);

// Common Seeding Snippets to avoid code bloating
const rudrakshaPriest = {
  name: "Acharya Shivansh Tirth",
  experience: "28+ Years",
  bio: "Highly respected Acharya from Varanasi specializing in advanced Rudra rituals, Shiva worship ceremonies, and authentic Vedic Rudraksha energization processes.",
  qualification: "Maha Rudra Sadhana & Rudraksha Energization Specialist"
};

const crystalPriest = {
  name: "Acharya Rajesh Shastri",
  experience: "15+ Years",
  bio: "Highly trained Vedic scholar specializing in sacred geometry, Vastu corrections, and Yantra energization rituals.",
  qualification: "Vedic Acharya & Vastu Specialist"
};

const rudrakshaFAQs = [
  { question: "Is the Rudraksha energized before delivery?", answer: "Yes, every Rudraksha undergoes authentic Vedic purification and energization rituals conducted by our priests before dispatch." },
  { question: "Does it come with an authenticity certificate?", answer: "Yes, each Rudraksha is shipped with an authenticity certification and purity seal." },
  { question: "How should I clean the Rudraksha?", answer: "Clean it occasionally with a soft dry cloth. Avoid contact with soap, detergent, or water." },
  { question: "Can anyone wear a Rudraksha?", answer: "Yes, anyone can wear a Rudraksha regardless of gender, age, or background, as long as it is worn with faith and respect." }
];

const crystalFAQs = [
  { question: "Where should I place this item?", answer: "It is ideal to place this energized item in your home temple, office desk, study area, or cash locker to attract positive vibrations." },
  { question: "Is it energized?", answer: "Yes, every item is purified and energized through dedicated Vedic mantras and rituals by our Acharyas." },
  { question: "Can I gift this item?", answer: "Yes, these sacred Vastu items make wonderful gifts for weddings, housewarmings, and new business ventures." }
];

const commonCertificates = [
  {
    url: "📜",
    name: "Devotional Purity Seal",
    issuer: "Kashi Vedic Sansthan"
  }
];

const commonCta = { primary: "Book Now", secondary: "Learn More" };

// Reconstructed 28 Products data payload
const productsToSeed = [
  // 1. 7 Horses Frame
  {
    id: 'ef68116b-09ae-4034-812a-8c6ecb898a12',
    name: '7 Horses on Raw Pyrite Frame',
    sanskritName: '(Vastu Correction & Success)',
    short_name: '7 Horses Frame',
    slug: '7-horses-on-raw-pyrite-frame',
    category: 'Frames',
    subtitle: 'Vastu Harmony and Wealth Acceleration',
    short_description: 'Sacred Vastu art piece combining the speed of 7 running horses with wealth-attracting raw Pyrite.',
    description: 'A magnificent Vastu correction artwork combining the speed and success symbol of 7 running horses with the abundance and wealth attracting properties of natural raw Pyrite crystals. Helps bring career progress, business growth, and positive energy flow to your home or office space.',
    benefits: ['Attracts wealth, financial abundance, and luck', 'Eliminates career stagnation and obstacles', 'Brings high energy, power, and success to ventures', 'Balances Vastu directions, especially South or North-West'],
    price: 1399,
    original_price: 5299,
    rating: 4.9,
    reviews_count: 15,
    faqs: crystalFAQs,
    priest_details: crystalPriest,
    material: 'Premium Golden Frame, Raw Pyrite Crystals',
    weight: '300g – 500g',
    dimensions: '15 cm × 20 cm',
    origin: 'India',
    image: horsesImage || '🖼️',
    gallery_images: [{ alt: '7 Horses on Raw Pyrite Frame', url: horsesImage || '🖼️' }],
    rituals_included: [{ name: 'Vastu Purification', description: 'Purified with holy Ganges water and energized with Surya mantras.' }]
  },
  // 2. Dhan Yog Bracelet
  {
    id: 'e8c015d8-dd72-461f-830c-7f113dede450',
    name: 'Dhan Yog Bracelet',
    sanskritName: '(Wealth & Abundance)',
    short_name: 'Dhan Yog Bracelet',
    slug: 'dhan-yog-bracelet',
    category: 'Bracelet',
    subtitle: 'Manifest Prosperity and Luck',
    short_description: 'Spiritual stretch bracelet made of Citrine, Pyrite, Green Aventurine, and Tiger Eye.',
    description: 'Spiritual stretch bracelet crafted with Citrine, Pyrite, Green Aventurine, and Tiger Eye beads, energized to enhance wealth opportunities, luck, and positive energy flow. Beautifully designed for daily wear.',
    benefits: ['Brings financial growth and business success', 'Boosts self-confidence and manifestation power', 'Wards off bad luck and financial stagnation', 'Attracts new opportunities and fortune'],
    price: 799,
    original_price: 2799,
    rating: 4.9,
    reviews_count: 38,
    faqs: crystalFAQs,
    priest_details: crystalPriest,
    material: 'Natural Crystal Beads (Citrine, Pyrite, Green Aventurine, Tiger Eye)',
    weight: '25g – 35g',
    dimensions: '8mm Beads, Standard Stretchable Size',
    origin: 'India',
    image: bImages[0] || '📿',
    gallery_images: bImages.map(url => ({ alt: 'Dhan Yog Bracelet', url })),
    rituals_included: [{ name: 'Crystal Energization', description: 'Purified and charged under mantra chantings to activate crystal vibrations.' }]
  },
  // 3. Lakshmi Yantra Pyramid (RECOVERED SNAPSHOT)
  {
    id: '4f68644d-0962-448f-8c32-5c0ba01ea293',
    name: 'Lakshmi Yantra Pyramid',
    sanskritName: '(Wealth, Prosperity & Vastu Harmony)',
    short_name: 'Maha Pooja',
    slug: 'lakshmi-yantra-pyramid',
    category: 'Pyramid',
    subtitle: 'Sacred Lakshmi Energy for Wealth and Prosperity',
    short_description: 'Premium Lakshmi Yantra Pyramid crafted with sacred geometry and spiritual symbolism to attract prosperity, financial growth, positive energy, and Vastu harmony in homes and workplaces.',
    description: 'Premium Lakshmi Yantra Pyramid crafted with sacred geometry and spiritual symbolism to attract prosperity, financial growth, positive energy, and Vastu harmony in homes and workplaces.',
    benefits: [
      "Attracts wealth, abundance, and prosperity",
      "Enhances financial stability and growth opportunities",
      "Promotes positive vibrations and spiritual harmony",
      "Supports Vastu balance in home and office",
      "Helps create a peaceful and energized environment",
      "Invokes the blessings of Goddess Lakshmi"
    ],
    price: 899,
    original_price: 3299,
    rating: 4.9,
    reviews_count: 12,
    faqs: [
      { answer: "It is a spiritual Vastu product featuring the sacred Lakshmi Yantra designed to attract prosperity and positive energy.", question: "What is a Lakshmi Yantra Pyramid?" },
      { answer: "It can be placed in homes, offices, work desks, temples, or cash counters.", question: "Where should I place the pyramid?" },
      { answer: "Yes, every pyramid undergoes spiritual energization rituals.", question: "Is the pyramid energized before delivery?" },
      { answer: "Yes, it is widely used as a Vastu-enhancing spiritual product.", question: "Can it be used for Vastu purposes?" },
      { answer: "Yes, it makes an excellent gift for prosperity, housewarming, and business occasions.", question: "Is it suitable for gifting?" }
    ],
    priest_details: {
      name: "Acharya Rajesh Shastri",
      experience: "15+ Years",
      bio: "Highly trained scholar from Banaras Hindu University specializing in Rigveda rituals.",
      qualification: "Vedic Acharya"
    },
    material: "Resin Pyramid, Sacred Lakshmi Yantra, Copper Coil, Crystal Chips",
    weight: "150–250 grams",
    dimensions: "7 cm × 7 cm × 7 cm",
    origin: "India",
    image: r2Base + 'products/gallery/edd72c3e-7318-42f3-9784-0e54d0aa0e64_l1.png',
    gallery_images: lImages.map(url => ({ alt: 'Lakshmi Yantra Pyramid', url })),
    rituals_included: [
      { name: "Yantra Verification", duration: "", description: "The Lakshmi Yantra is verified and prepared for energization." },
      { name: "Spiritual Purification", duration: "", description: "The pyramid undergoes sacred purification rituals." },
      { name: "Lakshmi Invocation", duration: "", description: "Special Lakshmi mantras are chanted to invoke divine blessings." },
      { name: "Pyramid Energization", duration: "", description: "The pyramid is spiritually energized through Vedic rituals." },
      { name: "Final Blessing Ritual", duration: "", description: "Final prayers are performed before packaging and dispatch." }
    ],
    booking_instructions: "Easy Booking Process\n1. Enter Full Name\n2. Enter Mobile Number\n3. Enter Delivery Address\n4. Complete Payment\n5. Receive Confirmation\n6. Product Dispatch\n\nPlacement Guidelines\n✔ Place in home temple or office\n✔ Keep near work desk or cash counter\n✔ Maintain a clean and sacred space\n✔ Avoid cluttered surroundings",
    spiritual_significance: "The Lakshmi Yantra Pyramid combines sacred geometry and Goddess Lakshmi's divine symbolism. Traditionally used for attracting prosperity, abundance, positive energy, and financial stability while enhancing Vastu harmony."
  },
  // 4. Pyrite Tortoise
  {
    id: '7646538c-b65c-4e4f-bccb-cad7624eedb0',
    name: 'Pyrite Tortoise',
    sanskritName: '(Kachua - Lifespan & Abundance)',
    short_name: 'Pyrite Tortoise',
    slug: 'pyrite-tortoise',
    category: 'Pyrite',
    subtitle: 'Vastu Symbol of Longevity and Abundance',
    short_description: 'Vastu-energized Pyrite Tortoise representing longevity, stability, and fortune.',
    description: 'Vastu-energized Pyrite Tortoise crafted from natural pyrite crystals, representing long life, career growth, stability, and wealth retention. Place it facing North to attract career advancement.',
    benefits: ['Brings stability and focus in work', 'Attracts wealth and secures savings', 'Wards off Vastu defects and physical weakness', 'Promotes peace and longevity in family'],
    price: 899,
    original_price: 2499,
    rating: 4.8,
    reviews_count: 24,
    faqs: crystalFAQs,
    priest_details: crystalPriest,
    material: 'Natural Pyrite Stone',
    weight: '80g – 150g',
    dimensions: '5 cm × 4 cm × 3 cm',
    origin: 'Peru',
    image: tImages[0] || '🐢',
    gallery_images: tImages.map(url => ({ alt: 'Pyrite Tortoise', url })),
    rituals_included: [{ name: 'Vastu Energization', description: 'Purified and charged with Kuber mantras for wealth attraction.' }]
  },
  // 5. Karungali Mala with Lord Murugan Pendant
  {
    id: '4d567787-bd06-418e-be2a-7e5ab2ca0abf',
    name: 'Karungali Mala with Lord Murugan Pendant',
    sanskritName: '( Ebony Wood - Protection & Victory)',
    short_name: 'Karungali Mala',
    slug: 'karungali-mala-murugan-pendant',
    category: 'Karungali',
    subtitle: 'Divine Ebony Protection and Victory',
    short_description: 'Ebony Wood Mala with silver-plated Lord Murugan pendant for victory and focus.',
    description: 'Authentic Karungali (Black Ebony Wood) Mala featuring a silver-plated Lord Murugan pendant, traditionally worn for divine protection, focus, victory, and warding off negative forces. Brings focus, peace of mind, and willpower.',
    benefits: ['Wards off negative energies, evil eyes, and black magic', 'Enhances mental strength, focus, and concentration', 'Promotes leadership and victory in legal/business matters', 'Acts as a spiritual shield for physical health'],
    price: 899,
    original_price: 2799,
    rating: 4.9,
    reviews_count: 42,
    faqs: crystalFAQs,
    priest_details: crystalPriest,
    material: 'Original Karungali Ebony Wood, Metal Murugan Pendant',
    weight: '30g – 40g',
    dimensions: '108 Beads, 8mm bead size',
    origin: 'India',
    image: k1Image || '📿',
    gallery_images: [{ alt: 'Karungali Mala with Lord Murugan Pendant', url: k1Image || '📿' }],
    rituals_included: [{ name: 'Prana Pratishta', description: 'Energized with Subramanya Mantras and energized sacred oils.' }]
  },
  // 6. Kale Ghode Ki Naal (Black Horseshoe)
  {
    id: '1fe03faa-3042-492d-b977-d536548cf0e2',
    name: 'Kale Ghode Ki Naal (Black Horseshoe)',
    sanskritName: '(Evil Eye & Shani Dosh Shield)',
    short_name: 'Black Horseshoe',
    slug: 'kale-ghode-ki-naal-horseshoe',
    category: 'Kavach',
    subtitle: 'Sacred Guard Against Negative Energy',
    short_description: 'Traditional Black Horseshoe used to guard main doors and resolve Shani Dosh.',
    description: 'Spiritual Vastu protector Kale Ghode Ki Naal, traditionally placed above the main entrance of homes and offices to ward off evil eye, negative energies, and bring fortune. Extracted from the hoof of a black horse on an auspicious day.',
    benefits: ['Protects home from negative entities and dark energy', 'Pacifies Shani Dosh and bad planetary transits', 'Attracts fortune, wealth, and peace to household', 'Protects from unexpected financial losses'],
    price: 499,
    original_price: 1499,
    rating: 4.8,
    reviews_count: 51,
    faqs: crystalFAQs,
    priest_details: crystalPriest,
    material: 'Natural Iron (From Black Horse Hoof)',
    weight: '150g – 200g',
    dimensions: '10 cm × 9 cm',
    origin: 'India',
    image: hImages[0] || '🧲',
    gallery_images: hImages.map(url => ({ alt: 'Kale Ghode Ki Naal', url })),
    rituals_included: [{ name: 'Shani Shanti Energization', description: 'Purified with mustard oil and charged with Shani Beej Mantras.' }]
  },
  // 7. Tulsi Mala
  {
    id: 'ef9700ec-42c3-4de4-8b94-9f3e86b8d760',
    name: 'Tulsi Mala',
    sanskritName: '(Pure Tulsi - Peace & Devotion)',
    short_name: 'Tulsi Mala',
    slug: 'pure-tulsi-wooden-mala',
    category: 'Necklaces/Mala',
    subtitle: 'Sacred Meditation Beads for Devotion',
    short_description: 'Natural Tulsi wooden mala for meditation, chanting, and spiritual protection.',
    description: 'Sacred Tulsi (Holy Basil) wooden mala, hand-knotted and energized, worn for purification, spiritual protection, peace of mind, and connection with Lord Vishnu. Wearing it helps stabilize emotions and thoughts.',
    benefits: ['Brings mental peace and reduces stress', 'Purifies aura and coordinates energy channels', 'Deepens focus during chanting (Japa meditation)', 'Invokes Lord Vishnu and Krishna blessings'],
    price: 399,
    original_price: 999,
    rating: 4.9,
    reviews_count: 67,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Holy Tulsi Wood',
    weight: '10g – 15g',
    dimensions: '108 + 1 Beads, 6mm bead size',
    origin: 'Vrindavan, India',
    image: tmImages[0] || '📿',
    gallery_images: tmImages.map(url => ({ alt: 'Tulsi Mala', url })),
    rituals_included: [{ name: 'Tulsi Sanctification', description: 'Bathed in holy Yamuna river water and offered to Shri Krishna deity.' }]
  },
  // 8. Raw Pyrite Anklet
  {
    id: '4b93ba23-0817-4ce0-8706-7cb643dd2d36',
    name: 'Raw Pyrite Anklet',
    sanskritName: '(Wealth & Abundance Anklet)',
    short_name: 'Pyrite Anklet',
    slug: 'raw-pyrite-crystal-anklet',
    category: 'Anklet',
    subtitle: 'Prosperity and Energy Protection for Feet',
    short_description: 'Raw Pyrite crystal beaded anklet for grounding, confidence, and wealth energy.',
    description: 'Handcrafted anklet made of natural raw Pyrite beads, combining a modern fashion aesthetic with ancient crystal healing energies for prosperity, grounding, and personal growth. Enhances physical energy levels.',
    benefits: ['Attracts wealth energy and luck', 'Provides absolute grounding and protective shield', 'Boosts vitality, logic, and creative flow', 'Enhances style with beautiful golden crystal reflections'],
    price: 699,
    original_price: 1999,
    rating: 4.8,
    reviews_count: 14,
    faqs: crystalFAQs,
    priest_details: crystalPriest,
    material: 'Natural Raw Peru Pyrite Beads, Durable Cord',
    weight: '15g – 20g',
    dimensions: 'Standard Adjustable Anklet Size',
    origin: 'India',
    image: dImages[0] || '📿',
    gallery_images: dImages.map(url => ({ alt: 'Raw Pyrite Anklet', url })),
    rituals_included: [{ name: 'Vedic Blessing', description: 'Energized with Laxmi Kubera mantras for daily wealth flow.' }]
  },
  // 9. Pyrite Owl
  {
    id: '5fbc27f1-fd14-41af-b350-c348151b0c75',
    name: 'Pyrite Owl',
    sanskritName: '(Uluka - Wisdom & Wealth Guard)',
    short_name: 'Pyrite Owl',
    slug: 'pyrite-owl-wealth-guard',
    category: 'Pyrite',
    subtitle: 'Wealth Protection and Business Wisdom',
    short_description: 'Pyrite carved Owl showpiece to attract wisdom and guard home finances.',
    description: 'Stunning Vastu showpiece Pyrite Owl, associated with Goddess Lakshmi\'s vehicle, crafted from raw pyrite to attract wisdom, financial intelligence, and wealth protection. Place in office or study for quick results.',
    benefits: ['Guards home against sudden financial drops or losses', 'Enhances intelligence, quick logic, and decision making', 'Neutralizes black magic or negative intentions of guests', 'Attracts Laxmi grace to office and study tables'],
    price: 999,
    original_price: 2999,
    rating: 4.9,
    reviews_count: 22,
    faqs: crystalFAQs,
    priest_details: crystalPriest,
    material: 'Natural Pyrite Crystal',
    weight: '120g – 180g',
    dimensions: '6 cm × 4 cm × 4 cm',
    origin: 'Peru',
    image: oImages[0] || '🦉',
    gallery_images: oImages.map(url => ({ alt: 'Pyrite Owl', url })),
    rituals_included: [{ name: 'Kuber Archana', description: 'Purified and charged with Kuber and Lakshmi hymns.' }]
  },
  // 10. 1 Mukhi Rudraksha
  {
    id: '23d716ba-29bc-42ca-9795-8fc3f468d37a',
    name: '1 Mukhi Rudraksha (Full & Half Moon)',
    sanskritName: '(Param Shiva - Ultimate Power)',
    short_name: '1 Mukhi Rudraksha',
    slug: '1-mukhi-rudraksha-shiva',
    category: 'Rudraksha',
    subtitle: 'Sacred Meditation Bead of Lord Shiva',
    short_description: 'Rare 1 Mukhi Rudraksha for spiritual awakening, focus, and cosmic connection.',
    description: 'The ultimate sacred bead representing Lord Shiva (Param Shiva), known to manifest extreme spiritual awakening, focus, success, and the power of Sankalpa. It is the king of all Rudrakshas and brings supreme focus and meditative clarity.',
    benefits: ['Attains ultimate mental focus and cosmic awareness', 'Removes all past sins and negative karmic traits', 'Enhances leadership qualities and personal authority', 'Destroys fear of death and worldly anxieties'],
    price: 25001,
    original_price: 39999,
    rating: 5.0,
    reviews_count: 19,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Nepali Rudraksha',
    weight: '3g – 7g',
    dimensions: '18mm – 25mm',
    origin: 'Nepal',
    image: r1Images[0 % r1Images.length],
    gallery_images: [
      { alt: '1 Mukhi Rudraksha', url: r1Images[0 % r1Images.length] },
      { alt: '1 Mukhi Rudraksha', url: r2Images[0 % r2Images.length] },
      { alt: '1 Mukhi Rudraksha', url: r3Images[0 % r3Images.length] }
    ],
    rituals_included: [{ name: 'Mantra Jaap', description: 'Energized with 108 recitations of Om Namah Shivaya.' }]
  },
  // 11. 2 Mukhi Rudraksha
  {
    id: 'e3af2e49-7fc7-4bd5-89ec-ed861641c799',
    name: '2 Mukhi Rudraksha',
    sanskritName: '(Ardhanarishvara - Relationships)',
    short_name: '2 Mukhi Rudraksha',
    slug: '2-mukhi-rudraksha-ardhanarishvara',
    category: 'Rudraksha',
    subtitle: 'Bead of Unity and Relationship Harmony',
    short_description: 'Sacred 2 Mukhi bead representing Shiva and Parvati for emotional balance.',
    description: 'Sacred bead symbolizing Ardhanarishvara (union of Shiva and Parvati), traditionally worn to enhance marital harmony, relationships, and emotional balance. Promotes friendship and cooperative growth.',
    benefits: ['Harmonizes relationships between couples and partners', 'Improves emotional stability and reduces inner fears', 'Brings peace of mind and calms dynamic thoughts', 'Balances the moon energies in natal chart'],
    price: 1501,
    original_price: 2999,
    rating: 4.8,
    reviews_count: 12,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Nepali Rudraksha',
    weight: '4g – 8g',
    dimensions: '20mm – 25mm',
    origin: 'Nepal',
    image: r1Images[1 % r1Images.length],
    gallery_images: [
      { alt: '2 Mukhi Rudraksha', url: r1Images[1 % r1Images.length] },
      { alt: '2 Mukhi Rudraksha', url: r2Images[1 % r2Images.length] },
      { alt: '2 Mukhi Rudraksha', url: r3Images[1 % r3Images.length] }
    ],
    rituals_included: [{ name: 'Gauri Shankar Pujan', description: 'Purified and charged with relationship-enhancing mantras.' }]
  },
  // 12. 3 Mukhi Rudraksha
  {
    id: '96175523-5182-43c9-a7fc-6abf7f96858c',
    name: '3 Mukhi Rudraksha',
    sanskritName: '(Agni Dev - Karma Cleanse)',
    short_name: '3 Mukhi Rudraksha',
    slug: '3-mukhi-rudraksha-agni',
    category: 'Rudraksha',
    subtitle: 'Fire Energy for Courage and Karma Purification',
    short_description: 'Sacred 3 Mukhi bead associated with Agni Dev for self-confidence.',
    description: 'Powerful bead representing Agni Dev (Fire God), worn to cleanse past karma, build confidence, release fear, and activate the solar plexus chakra. Helps overcome laziness and low self-esteem.',
    benefits: ['Cleanses past negative actions and guilt feelings', 'Boosts digestion, physical power, and stamina', 'Replaces fear, anxiety, and depression with positive courage', 'Activates solar plexus chakra for power and wealth'],
    price: 1201,
    original_price: 2499,
    rating: 4.9,
    reviews_count: 24,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Nepali Rudraksha',
    weight: '4g – 8g',
    dimensions: '20mm – 25mm',
    origin: 'Nepal',
    image: r1Images[2 % r1Images.length],
    gallery_images: [
      { alt: '3 Mukhi Rudraksha', url: r1Images[2 % r1Images.length] },
      { alt: '3 Mukhi Rudraksha', url: r2Images[2 % r2Images.length] },
      { alt: '3 Mukhi Rudraksha', url: r3Images[2 % r3Images.length] }
    ],
    rituals_included: [{ name: 'Agni Havan Sanctification', description: 'Charged directly in holy fire puja.' }]
  },
  // 13. 4 Mukhi Rudraksha
  {
    id: 'aff7370b-e77a-4afc-a9a3-18b388a62176',
    name: '4 Mukhi Rudraksha',
    sanskritName: '(Lord Brahma - Creative Intellect)',
    short_name: '4 Mukhi Rudraksha',
    slug: '4-mukhi-rudraksha-brahma',
    category: 'Rudraksha',
    subtitle: 'Bead of Intelligence and Communication',
    short_description: 'Sacred 4 Mukhi bead representing Lord Brahma to enhance wisdom and memory.',
    description: 'Bead representing Lord Brahma, the creator, worn to enhance intelligence, memory, creative power, and communication skills. Ideal for students, writers, teachers, and public speakers.',
    benefits: ['Sharpens logic, memory power, and communication', 'Enhances creative skills, writing, and research', 'Improves vocal strength and removes public speaking fear', 'Aids spiritual learning and Vedic scriptures study'],
    price: 999,
    original_price: 1999,
    rating: 4.9,
    reviews_count: 31,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Nepali Rudraksha',
    weight: '5g – 9g',
    dimensions: '22mm – 26mm',
    origin: 'Nepal',
    image: r1Images[3 % r1Images.length],
    gallery_images: [
      { alt: '4 Mukhi Rudraksha', url: r1Images[3 % r1Images.length] },
      { alt: '4 Mukhi Rudraksha', url: r2Images[3 % r2Images.length] },
      { alt: '4 Mukhi Rudraksha', url: r3Images[3 % r3Images.length] }
    ],
    rituals_included: [{ name: 'Saraswati Abhishekam', description: 'Purified and charged with Saraswati intellect mantras.' }]
  },
  // 14. 5 Mukhi Rudraksha
  {
    id: 'af3a8114-20ad-481f-95db-cafef72eec73',
    name: '5 Mukhi Rudraksha',
    sanskritName: '(Kalagni Rudra - Well-being)',
    short_name: '5 Mukhi Rudraksha',
    slug: '5-mukhi-rudraksha-rudra',
    category: 'Rudraksha',
    subtitle: 'Auspicious Bead for Universal Peace',
    short_description: 'Kalagni Rudra bead worn for health, peace of mind, and spiritual grounding.',
    description: 'Most common and auspicious bead representing Kalagni Rudra, worn for general well-being, peace of mind, blood pressure control, and spiritual grounding. It is worn to balance solar plexus energies and keep off negative forces.',
    benefits: ['Attains mental peace, calms stress, and stabilizes thoughts', 'Helps control blood pressure and supports heart health', 'Protects against dynamic energies and negative environments', 'Excellent for general meditation and daily wearing'],
    price: 501,
    original_price: 999,
    rating: 4.8,
    reviews_count: 89,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Nepali Rudraksha',
    weight: '6g – 10g',
    dimensions: '22mm – 28mm',
    origin: 'Nepal',
    image: r1Images[4 % r1Images.length],
    gallery_images: [
      { alt: '5 Mukhi Rudraksha', url: r1Images[4 % r1Images.length] },
      { alt: '5 Mukhi Rudraksha', url: r2Images[4 % r2Images.length] },
      { alt: '5 Mukhi Rudraksha', url: r3Images[4 % r3Images.length] }
    ],
    rituals_included: [{ name: 'Rudra Abhishekam', description: 'Charged during Maha Rudrabhishek rituals.' }]
  },
  // 15. 6 Mukhi Rudraksha
  {
    id: 'b7a1532f-dcbc-453d-bd43-b1acc27d0462',
    name: '6 Mukhi Rudraksha',
    sanskritName: '(Lord Kartikeya - Leadership)',
    short_name: '6 Mukhi Rudraksha',
    slug: '6-mukhi-rudraksha-kartikeya',
    category: 'Rudraksha',
    subtitle: 'Warrior Energy for Willpower and Courage',
    short_description: 'Lord Kartikeya bead worn for courage, leadership, focus, and debt clearance.',
    description: 'Sacred bead representing Lord Kartikeya, the warrior god, worn to build leadership, courage, focus, willpower, and clear off debt. Enhances connection with Mars energy (Mangal).',
    benefits: ['Strengthens willpower, mental courage, and focus', 'Brings leadership qualities and speech authority', 'Helps resolve debts and financial liabilities', 'Resolves Mangal (Mars) related issues in horoscope'],
    price: 701,
    original_price: 1499,
    rating: 4.8,
    reviews_count: 18,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Nepali Rudraksha',
    weight: '6g – 11g',
    dimensions: '22mm – 28mm',
    origin: 'Nepal',
    image: r1Images[5 % r1Images.length],
    gallery_images: [
      { alt: '6 Mukhi Rudraksha', url: r1Images[5 % r1Images.length] },
      { alt: '6 Mukhi Rudraksha', url: r2Images[5 % r2Images.length] },
      { alt: '6 Mukhi Rudraksha', url: r3Images[5 % r3Images.length] }
    ],
    rituals_included: [{ name: 'Kartikeya Abhishekam', description: 'Blessed with mantras for courage and debt removal.' }]
  },
  // 16. 7 Mukhi Rudraksha
  {
    id: '9bab7781-f55f-4847-8361-692d00daf1ed',
    name: '7 Mukhi Rudraksha',
    sanskritName: '(Maha Lakshmi - Wealth & Abundance)',
    short_name: '7 Mukhi Rudraksha',
    slug: '7-mukhi-rudraksha-lakshmi',
    category: 'Rudraksha',
    subtitle: 'Sacred Abundance and Fortune Bead',
    short_description: 'Authentic 7 Mukhi Rudraksha associated with Goddess Lakshmi for wealth.',
    description: 'Authentic 7 Mukhi Rudraksha associated with Goddess Lakshmi, the deity of wealth, traditionally worn for prosperity, career success, and financial growth. Worn to resolve financial stresses and align with wealth opportunities.',
    benefits: ['Attracts wealth, business luck, and financial growth', 'Removes financial blocks and debt struggles', 'Brings health, longevity, and peaceful prosperity', 'Pacifies the negative effects of Shani (Saturn)'],
    price: 999,
    original_price: 2499,
    rating: 4.9,
    reviews_count: 45,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Nepali Rudraksha',
    weight: '7g – 12g',
    dimensions: '23mm – 28mm',
    origin: 'Nepal',
    image: r1Images[6 % r1Images.length],
    gallery_images: [
      { alt: '7 Mukhi Rudraksha', url: r1Images[6 % r1Images.length] },
      { alt: '7 Mukhi Rudraksha', url: r2Images[6 % r2Images.length] },
      { alt: '7 Mukhi Rudraksha', url: r3Images[6 % r3Images.length] }
    ],
    rituals_included: [{ name: 'Lakshmi Pujan', description: 'Energized with Lakshmi Beej Mantras for wealth manifestation.' }]
  },
  // 17. 8 Mukhi Rudraksha
  {
    id: 'f7a85ab0-e05c-495b-a440-d87941d09df1',
    name: '8 Mukhi Rudraksha',
    sanskritName: '(Lord Ganesha - Obstacle Removal)',
    short_name: '8 Mukhi Rudraksha',
    slug: '8-mukhi-rudraksha-ganesha',
    category: 'Rudraksha',
    subtitle: 'Success and Hurdles Shield',
    short_description: 'Lord Ganesha bead worn to remove life obstacles and bring success.',
    description: 'Sacred bead representing Lord Ganesha, the remover of obstacles, worn to gain success in new ventures, wisdom, and remove hurdles from life path. Highly supportive for business startups and legal struggles.',
    benefits: ['Dissolves major obstacles and blockages in progress', 'Brings success in new businesses, career, and exams', 'Enhances analytical intelligence and wisdom', 'Pacifies Rahu related transit issues in chart'],
    price: 1901,
    original_price: 3999,
    rating: 4.9,
    reviews_count: 22,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Nepali Rudraksha',
    weight: '7g – 13g',
    dimensions: '23mm – 28mm',
    origin: 'Nepal',
    image: r1Images[7 % r1Images.length],
    gallery_images: [
      { alt: '8 Mukhi Rudraksha', url: r1Images[7 % r1Images.length] },
      { alt: '8 Mukhi Rudraksha', url: r2Images[7 % r2Images.length] },
      { alt: '8 Mukhi Rudraksha', url: r3Images[7 % r3Images.length] }
    ],
    rituals_included: [{ name: 'Ganesh Archana', description: 'Energized with obstacle-removing Vigneshwara mantras.' }]
  },
  // 18. 9 Mukhi Rudraksha
  {
    id: 'c9297723-c21a-42ea-b22b-c2389ec20126',
    name: '9 Mukhi Rudraksha',
    sanskritName: '(Maa Durga - Fearlessness & Power)',
    short_name: '9 Mukhi Rudraksha',
    slug: '9-mukhi-rudraksha-durga',
    category: 'Rudraksha',
    subtitle: 'Sacred Power and Shield of Goddess Durga',
    short_description: 'Maa Durga bead for self-confidence, courage, energy, and protection.',
    description: 'Sacred bead representing Goddess Durga (Navadurga), worn to gain dynamic energy, self-confidence, fearlessness, and victory over adversaries. Excellent for people in defense, politics, and leadership roles.',
    benefits: ['Builds fearlessness, self-confidence, and high energy', 'Protects from negative intentions and evil eye', 'Enhances leadership authority and public power', 'Balances Ketu related transit defects in chart'],
    price: 2501,
    original_price: 4999,
    rating: 4.9,
    reviews_count: 15,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Nepali Rudraksha',
    weight: '7g – 14g',
    dimensions: '24mm – 30mm',
    origin: 'Nepal',
    image: r1Images[8 % r1Images.length],
    gallery_images: [
      { alt: '9 Mukhi Rudraksha', url: r1Images[8 % r1Images.length] },
      { alt: '9 Mukhi Rudraksha', url: r2Images[8 % r2Images.length] },
      { alt: '9 Mukhi Rudraksha', url: r3Images[8 % r3Images.length] }
    ],
    rituals_included: [{ name: 'Durga Saptashati Havan', description: 'Blessed in dynamic Navadurga fire rituals.' }]
  },
  // 19. 10 Mukhi Rudraksha
  {
    id: '95190328-7b2e-4c54-9672-903427cae5b0',
    name: '10 Mukhi Rudraksha',
    sanskritName: '(Lord Vishnu - Total Protection)',
    short_name: '10 Mukhi Rudraksha',
    slug: '10-mukhi-rudraksha-vishnu',
    category: 'Rudraksha',
    subtitle: 'Divine Shield for Health and Success',
    short_description: 'Lord Vishnu bead offering total protection from negative forces.',
    description: 'Sacred bead representing Lord Vishnu, the preserver, worn to obtain strong protection from negative influences, court cases, evil eye, and planetary afflictions. Safeguards the family from sudden health downfalls.',
    benefits: ['Acts as a powerful shield against evil eye, jealousy, and bad spells', 'Resolves complex court cases and legal disputes', 'Provides strong grounding and stability under pressure', 'Brings peace and universal protection to house'],
    price: 3501,
    original_price: 6999,
    rating: 4.8,
    reviews_count: 17,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Nepali Rudraksha',
    weight: '8g – 14g',
    dimensions: '24mm – 30mm',
    origin: 'Nepal',
    image: r1Images[9 % r1Images.length],
    gallery_images: [
      { alt: '10 Mukhi Rudraksha', url: r1Images[9 % r1Images.length] },
      { alt: '10 Mukhi Rudraksha', url: r2Images[9 % r2Images.length] },
      { alt: '10 Mukhi Rudraksha', url: r3Images[9 % r3Images.length] }
    ],
    rituals_included: [{ name: 'Vishnu Sahasranama Energization', description: 'Charged with sacred Vishnu Sahasranama prayers.' }]
  },
  // 20. 11 Mukhi Rudraksha
  {
    id: '41c77cb0-d03b-456d-b52d-db7c5e4964b8',
    name: '11 Mukhi Rudraksha',
    sanskritName: '(Lord Hanuman - Courage & Victory)',
    short_name: '11 Mukhi Rudraksha',
    slug: '11-mukhi-rudraksha-hanuman',
    category: 'Rudraksha',
    subtitle: 'Courage, Focus and Success Bead',
    short_description: 'Lord Hanuman bead for willpower, courage, and high spiritual growth.',
    description: 'Bead representing Lord Hanuman (Rudradev), worn to attain mental power, courage, fearlessness, success, and high spiritual growth. Helps focus dynamic energies and build supreme willpower.',
    benefits: ['Builds supreme mental courage, willpower, and fearlessness', 'Enhances logical thinking, wisdom, and decision capabilities', 'Protects from negative accidental events and illness', 'Speeds up spiritual alignment and energy channels'],
    price: 4901,
    original_price: 8999,
    rating: 4.9,
    reviews_count: 26,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Nepali Rudraksha',
    weight: '8g – 15g',
    dimensions: '24mm – 32mm',
    origin: 'Nepal',
    image: r1Images[10 % r1Images.length],
    gallery_images: [
      { alt: '11 Mukhi Rudraksha', url: r1Images[10 % r1Images.length] },
      { alt: '11 Mukhi Rudraksha', url: r2Images[10 % r2Images.length] },
      { alt: '11 Mukhi Rudraksha', url: r3Images[10 % r3Images.length] }
    ],
    rituals_included: [{ name: 'Hanuman Chalisa Path', description: 'Charged during Hanuman worships and sacred oils.' }]
  },
  // 21. 12 Mukhi Rudraksha
  {
    id: '61ac554b-6cd5-4bdb-80dc-94e2dd1aa584',
    name: '12 Mukhi Rudraksha',
    sanskritName: '(Surya Dev - Power & Radiance)',
    short_name: '12 Mukhi Rudraksha',
    slug: '12-mukhi-rudraksha-surya',
    category: 'Rudraksha',
    subtitle: 'Charisma, Radiance and Leadership Bead',
    short_description: 'Surya Dev bead for power, leadership, charisma, and health.',
    description: 'Bead representing Surya Dev (Sun God), worn to build radiance, leadership, power, charisma, self-confidence, and vitality. Removes hesitation and self-doubt, bringing name and fame in work.',
    benefits: ['Enhances name, fame, respect, and career progress', 'Boosts leadership power, confidence, and charisma', 'Removes self-doubt, fear of authority, and hesitation', 'Brings physical energy and balances sun energies in chart'],
    price: 8901,
    original_price: 17999,
    rating: 4.9,
    reviews_count: 19,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Nepali Rudraksha',
    weight: '8g – 18g',
    dimensions: '24mm – 38mm',
    origin: 'Nepal',
    image: r1Images[11 % r1Images.length],
    gallery_images: [
      { alt: '12 Mukhi Rudraksha', url: r1Images[11 % r1Images.length] },
      { alt: '12 Mukhi Rudraksha', url: r2Images[11 % r2Images.length] },
      { alt: '12 Mukhi Rudraksha', url: r3Images[11 % r3Images.length] }
    ],
    rituals_included: [{ name: 'Surya Arghya Abhishekam', description: 'Purified and charged during sunrise with Surya Beej Mantras.' }]
  },
  // 22. 13 Mukhi Rudraksha
  {
    id: '29dcf13d-4a56-404b-8705-8509e2c43751',
    name: '13 Mukhi Rudraksha',
    sanskritName: '(Kamadeva - Attraction & Success)',
    short_name: '13 Mukhi Rudraksha',
    slug: '13-mukhi-rudraksha-kamadeva',
    category: 'Rudraksha',
    subtitle: 'Personal Attraction and Magnetism Bead',
    short_description: 'Kamadeva bead for charm, personal magnetism, and success.',
    description: 'Bead representing Kamadeva (God of Love) and Lord Indra, worn to enhance attraction, charisma, personal magnetism, success, and relationship success. Brings dynamic expression and high financial prospects.',
    benefits: ['Attracts ideal life partner and brings relationship success', 'Enhances personal charm, attraction, and charisma', 'Brings high success, luck, and luxury to life', 'Deepens self-respect and dynamic expression skills'],
    price: 14501,
    original_price: 25999,
    rating: 4.9,
    reviews_count: 21,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Nepali Rudraksha',
    weight: '7g – 20g',
    dimensions: '24mm – 42mm',
    origin: 'Nepal',
    image: r1Images[12 % r1Images.length],
    gallery_images: [
      { alt: '13 Mukhi Rudraksha', url: r1Images[12 % r1Images.length] },
      { alt: '13 Mukhi Rudraksha', url: r2Images[12 % r2Images.length] },
      { alt: '13 Mukhi Rudraksha', url: r3Images[12 % r3Images.length] }
    ],
    rituals_included: [{ name: 'Kamadeva Devotional Ritual', description: 'Blessed with attraction and charisma hymns.' }]
  },
  // 23. 14 Mukhi Rudraksha (RECOVERED SNAPSHOT)
  {
    id: 'b0b37b77-7e85-4813-b214-ed84e81c49c0',
    name: '14 Mukhi Rudraksha',
    sanskritName: '(Energized & Certified)',
    short_name: 'Maha Pooja',
    slug: '14-mukhi-rudraksh',
    category: 'Rudraksha',
    subtitle: 'Divine Shiva blessings for wisdom and protection',
    short_description: 'Experience the extraordinary spiritual power of an authentic Vedic-energized 14 Mukhi Rudraksha, traditionally revered for intuition, protection, leadership, decision-making, success, and divine blessings from Lord Shiva.',
    description: 'Experience the extraordinary spiritual power of an authentic Vedic-energized 14 Mukhi Rudraksha, traditionally revered for intuition, protection, leadership, decision-making, success, and divine blessings from Lord Shiva.',
    benefits: [
      "Enhances intuition, foresight, and decision-making abilities",
      "Provides powerful spiritual protection from negative influences",
      "Strengthens leadership qualities and personal authority",
      "Supports career advancement, business success, and prosperity",
      "Encourages confidence, courage, and mental clarity",
      "Promotes spiritual growth, wisdom, and inner transformation"
    ],
    price: 28501,
    original_price: 47999,
    rating: 4.9,
    reviews_count: 12,
    faqs: [
      { answer: "The 14 Mukhi Rudraksha is associated with Lord Shiva and is traditionally revered for intuition, wisdom, protection, leadership, and spiritual growth.", question: "What is the significance of 14 Mukhi Rudraksha?" },
      { answer: "Business leaders, entrepreneurs, professionals, spiritual seekers, and individuals seeking better decision-making and confidence may wear it.", question: "Who should wear 14 Mukhi Rudraksha?" },
      { answer: "According to traditional beliefs, the 14 Mukhi Rudraksha is known as \"Dev Mani\" because of its highly revered spiritual significance and association with divine wisdom.", question: "Why is it called Dev Mani?" },
      { answer: "Yes, every Rudraksha undergoes authentic Vedic energization rituals before dispatch.", question: "Is the Rudraksha energized before delivery?" },
      { answer: "Yes, authenticity assurance and certification are provided with every Rudraksha.", question: "Does it come with authenticity certification?" }
    ],
    priest_details: {
      name: "Acharya Shivansh Tirth",
      experience: "28+ Years",
      bio: "Acharya Shivansh Tirth is highly respected for conducting advanced Rudra rituals, Shiva worship ceremonies, and authentic Vedic Rudraksha energization processes.",
      qualification: "Maha Rudra Sadhana & Rudraksha Energization Specialist"
    },
    material: "Natural Nepali Rudraksha",
    weight: "7g – 22g",
    dimensions: "24mm – 45mm",
    origin: "Nepal",
    image: r2Base + 'products/gallery/6923a6cf-fa90-4dc2-a0f1-642e9afb5d9c_r1.png',
    gallery_images: [
      { alt: "14 Mukhi Rudraksha", url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/6923a6cf-fa90-4dc2-a0f1-642e9afb5d9c_r1.png" },
      { alt: "14 Mukhi Rudraksha", url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/bf827fb0-a804-4740-877e-02fd6ab10782_r2.png" },
      { alt: "14 Mukhi Rudraksha", url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/43393fb5-49d4-496e-ab64-4760236393b5_r3.png" },
      { alt: "14 Mukhi Rudraksha", url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/7abb71e8-2930-4e6a-9a93-9f54ad11b925_r4.png" },
      { alt: "14 Mukhi Rudraksha", url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/3f6ae991-3c63-4005-b0d6-6d567c28e935_r5.png" }
    ],
    rituals_included: [
      { name: "Rudraksha Selection", duration: "", description: "Each Rudraksha is carefully examined for purity, originality, and natural formation." },
      { name: "Sacred Purification", duration: "", description: "The Rudraksha undergoes Vedic purification using sacred ingredients and holy water." },
      { name: "Personalized Sankalp", duration: "", description: "A sacred Sankalp is performed according to the devotee's name and intentions." },
      { name: "Maha Rudra Invocation", duration: "", description: "Powerful Rudra mantras are chanted to invoke Lord Shiva's blessings." },
      { name: "Mantra Energization", duration: "", description: "The Rudraksha is spiritually energized through dedicated mantra recitations." },
      { name: "Final Blessing Ceremony", duration: "", description: "Final blessings are offered for protection, wisdom, and success." }
    ],
    booking_instructions: "Simple Booking Process\n1. Enter your Full Name\n2. Provide Mobile Number\n3. Enter Complete Delivery Address\n4. Complete Secure Payment\n5. Priest performs energization ritual\n6. Product dispatched with blessings and certification\n\nImportant Guidelines\n✔ Keep the Rudraksha clean and treated with respect at all times.\n✔ Store it in a clean and sacred place when not in use.\n✔ Avoid direct contact with perfumes, chemicals, soaps, and detergents.\n✔ Remove before swimming or activities involving excessive moisture.\n✔ Chant \"Om Namah Shivaya\" or \"Om Rudraya Namah\" regularly.\n✔ Wear with faith, positivity, and devotion for the best spiritual experience.\n✔ Clean occasionally using a soft cloth to maintain its natural condition.\n✔ Follow the provided energization and wearing instructions carefully.\n✔ Handle the Rudraksha gently to preserve its natural structure and energy.\n✔ Maintain purity and positive intentions while wearing the sacred bead.",
    spiritual_significance: "The 14 Mukhi Rudraksha is known as the \"Dev Mani\" and is associated with Lord Shiva. It symbolizes wisdom, intuition, protection, spiritual awakening, and the ability to make sound decisions while overcoming life's challenges."
  },
  // 24. Faceless Rudraksha
  {
    id: '3ad8e19e-0acb-4e1c-9554-91709f7c75c3',
    name: 'Faceless Rudraksha',
    sanskritName: '(Nirankar Shiva - Formless Meditation)',
    short_name: 'Faceless Rudraksha',
    slug: 'faceless-rudraksha-nirankar',
    category: 'Rudraksha',
    subtitle: 'Spiritual Peace and Pure Meditation',
    short_description: 'Rare Nirankar (faceless) Rudraksha bead representing the formless Shiva.',
    description: 'Rare Nirankar (faceless) Rudraksha bead, representing the formless Shiva, traditionally worn for pure meditative focus, absolute peace, and self-realization.',
    benefits: ['Brings ultimate peace and stills the chatter of mind', 'Strengthens connection to inner self and soul energy', 'Wards off strong stress and depressive feelings', 'Excellent support for advanced yoga practitioners'],
    price: 3701,
    original_price: 6499,
    rating: 4.8,
    reviews_count: 9,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Nepali Rudraksha',
    weight: '6g – 12g',
    dimensions: '22mm – 28mm',
    origin: 'Nepal',
    image: r1Images[13 % r1Images.length],
    gallery_images: [
      { alt: 'Faceless Rudraksha', url: r1Images[13 % r1Images.length] },
      { alt: 'Faceless Rudraksha', url: r2Images[13 % r2Images.length] },
      { alt: 'Faceless Rudraksha', url: r3Images[13 % r3Images.length] }
    ],
    rituals_included: [{ name: 'Nirankar Sadhana', description: 'Purified and charged under Silent Shiva Mantras.' }]
  },
  // 25. Ganesh Rudraksha
  {
    id: '975e48a5-e295-421c-a6ac-e56664167439',
    name: 'Ganesh Rudraksha',
    sanskritName: '(Sacred Trunk - Obstacle Removal)',
    short_name: 'Ganesh Rudraksha',
    slug: 'ganesh-rudraksha-sacred',
    category: 'Rudraksha',
    subtitle: 'Success and Wisdom Blessings',
    short_description: 'Natural Rudraksha featuring a trunk protrusion, symbolizing Lord Ganesha.',
    description: 'Sacred natural Rudraksha bead featuring a trunk-like protrusion, symbolizing Lord Ganesha, worn to remove obstacles, bring success, and gain wisdom. Worn for dynamic luck and clearing life path.',
    benefits: ['Removes hurdles in career, education, and health', 'Invokes Ganesh blessings for all new beginnings', 'Enhances logic, intelligence, and analytical skills', 'Removes planetary obstacles and fear of failure'],
    price: 1301,
    original_price: 6999,
    rating: 4.9,
    reviews_count: 55,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Nepali Rudraksha',
    weight: '6g – 14g',
    dimensions: '22mm – 28mm',
    origin: 'Nepal',
    image: r1Images[14 % r1Images.length],
    gallery_images: [
      { alt: 'Ganesh Rudraksha', url: r1Images[14 % r1Images.length] },
      { alt: 'Ganesh Rudraksha', url: r2Images[14 % r2Images.length] },
      { alt: 'Ganesh Rudraksha', url: r3Images[14 % r3Images.length] }
    ],
    rituals_included: [{ name: 'Vighnaharta Puja', description: 'Charged during sacred Ganesh Chaturthi pujas.' }]
  },
  // 26. Gauri Shankar Rudraksha
  {
    id: '30c03d59-902d-45eb-82e3-1dc0cad298b8',
    name: 'Gauri Shankar Rudraksha',
    sanskritName: '(Joint Bead - Shiva Parvati Union)',
    short_name: 'Gauri Shankar',
    slug: 'gauri-shankar-rudraksha-union',
    category: 'Rudraksha',
    subtitle: 'Marital Harmony and Family Union',
    short_description: 'Joint Rudraksha bead representing Shiva Parvati for relationship peace.',
    description: 'A natural joint Rudraksha representing the divine union of Shiva and Goddess Parvati, worn to attract ideal life partner and bring harmony in family relationships. Keeps off marital struggles.',
    benefits: ['Harmonizes husband-wife relationships and prevents split ups', 'Attracts suitable partner for marriage seekers', 'Brings peace and positive growth to children', 'Balances general relationship energy in home'],
    price: 6501,
    original_price: 13499,
    rating: 4.9,
    reviews_count: 27,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Nepali Rudraksha',
    weight: '12g – 24g',
    dimensions: '28mm – 38mm',
    origin: 'Nepal',
    image: r1Images[15 % r1Images.length],
    gallery_images: [
      { alt: 'Gauri Shankar Rudraksha', url: r1Images[15 % r1Images.length] },
      { alt: 'Gauri Shankar Rudraksha', url: r2Images[15 % r2Images.length] },
      { alt: 'Gauri Shankar Rudraksha', url: r3Images[15 % r3Images.length] }
    ],
    rituals_included: [{ name: 'Gauri Shankar Sanctification', description: 'Purified and charged under Shiva Parvati marriage prayers.' }]
  },
  // 27. Gauri Ganesh Rudraksha
  {
    id: 'a6bd58fa-b20b-4a11-b63f-fe7b71dc156b',
    name: 'Gauri Ganesh Rudraksha',
    sanskritName: '(Mother & Child Joint Bead)',
    short_name: 'Gauri Ganesh',
    slug: 'gauri-ganesh-rudraksha-sacred',
    category: 'Rudraksha',
    subtitle: 'Obstacle Removal and Motherly Protection',
    short_description: 'Joint Rudraksha representing Goddess Gauri and Lord Ganesha for peace.',
    description: 'A natural joint Rudraksha representing Goddess Gauri and Lord Ganesha, worn to seek motherly protection, removal of obstacles, wisdom, and auspicious start. Restores positive vibes between children and parents.',
    benefits: ['Protects children and family from black magic/evil eye', 'Harmonizes parent-child relationship and understanding', 'Attracts wisdom, intellect, and career growth', 'Removes hurdles in education and work progress'],
    price: 3901,
    original_price: 8999,
    rating: 4.8,
    reviews_count: 14,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Nepali Rudraksha',
    weight: '12g – 22g',
    dimensions: '28mm – 38mm',
    origin: 'Nepal',
    image: r1Images[16 % r1Images.length],
    gallery_images: [
      { alt: 'Gauri Ganesh Rudraksha', url: r1Images[16 % r1Images.length] },
      { alt: 'Gauri Ganesh Rudraksha', url: r2Images[16 % r2Images.length] },
      { alt: 'Gauri Ganesh Rudraksha', url: r3Images[16 % r3Images.length] }
    ],
    rituals_included: [{ name: 'Gauri Ganesh Pujan', description: 'Purified and charged under motherly protection mantras.' }]
  },
  // 28. Undeveloped Rudraksha
  {
    id: 'f4286987-c5f2-455d-8022-4cd185681393',
    name: 'Undeveloped Rudraksha',
    sanskritName: '(Apurna - Esoteric Meditation)',
    short_name: 'Undeveloped',
    slug: 'undeveloped-rudraksha-sacred',
    category: 'Rudraksha',
    subtitle: 'Esoteric Protection and Meditation Support',
    short_description: 'Sacred Rudraksha bead with undeveloped segments for esoteric meditation.',
    description: 'Sacred natural Rudraksha bead with undeveloped segments, traditionally used in esoteric rituals and worn for spiritual protection, and meditation support. Highly powerful for grounding.',
    benefits: ['Protects wearer from negative energy and black magic', 'Cleanses energetic blockages in body meridians', 'Stabilizes thoughts and ground dynamic mind during prayers', 'Fosters absolute protection in travel and sleep'],
    price: 3901,
    original_price: 8999,
    rating: 4.7,
    reviews_count: 11,
    faqs: rudrakshaFAQs,
    priest_details: rudrakshaPriest,
    material: 'Natural Nepali Rudraksha',
    weight: '5g – 12g',
    dimensions: '20mm – 28mm',
    origin: 'Nepal',
    image: r1Images[17 % r1Images.length],
    gallery_images: [
      { alt: 'Undeveloped Rudraksha', url: r1Images[17 % r1Images.length] },
      { alt: 'Undeveloped Rudraksha', url: r2Images[17 % r2Images.length] },
      { alt: 'Undeveloped Rudraksha', url: r3Images[17 % r3Images.length] }
    ],
    rituals_included: [{ name: 'Mantra Charge', description: 'Purified and charged under specialized protection mantras.' }]
  }
];

// Execute Seeding
async function run() {
  try {
    console.log('--- STARTING POOJA PRODUCTS SEEDING ---');
    console.log(`Preparing to insert ${productsToSeed.length} products...`);
    
    // Add default values for common missing fields
    const finalPayload = productsToSeed.map(p => {
      return {
        id: p.id,
        name: p.name,
        sanskrit_name: p.sanskritName || null,
        short_name: p.short_name || null,
        slug: p.slug,
        category: p.category,
        subtitle: p.subtitle || null,
        short_description: p.short_description || null,
        description: p.description,
        spiritual_significance: p.spiritual_significance || null,
        material: p.material || null,
        weight: p.weight || null,
        dimensions: p.dimensions || null,
        origin: p.origin || null,
        custom_icons: {},
        booking_instructions: p.booking_instructions || "Easy booking process. 1. Fill details. 2. Pay. 3. Priest performs ritual. 4. Dispatched with blessings and certification.",
        duration: "2 Hours",
        temple_association: p.temple_association || "Kashi Vishwanath Temple, Varanasi",
        who_should_perform: p.who_should_perform || "Families seeking spiritual growth and obstacle clearance",
        rituals_included: p.rituals_included || [],
        samagri_list: p.samagri_list || [],
        priest_details: p.priest_details || rudrakshaPriest,
        testimonials: [],
        faqs: p.faqs || [],
        cta_labels: commonCta,
        og_data: { title: "", description: "", image: "" },
        schema_markup: {},
        tags: p.ideal_occasions || ["Sacred", "Vedic Blessed", "Top-Rated"],
        benefits: p.benefits || [],
        ideal_occasions: p.ideal_occasions || ["Shivratri", "Pradosham"],
        offers: ["Free energized Prasad box", "Live stream access link"],
        badges: ["Vedic Blessed", "Top-Rated"],
        image: p.image,
        banner_image: null,
        gallery_images: p.gallery_images || [],
        ritual_images: [],
        priest_image: null,
        certificates: commonCertificates,
        icon_image: null,
        promo_creatives: [],
        related_products: [],
        price: p.price,
        original_price: p.original_price,
        rating: p.rating || 4.9,
        reviews_count: p.reviews_count || 12,
        is_featured: p.is_featured || false,
        is_trending: p.is_trending || false,
        in_stock: true,
        is_published: true,
        published_at: new Date().toISOString(),
        ui_labels: {},
        translations: {},
        video_url: null
      };
    });

    // Delete existing products to make sure we don't hit key conflicts, and then insert
    console.log('Clearing existing entries...');
    const { error: deleteErr } = await supabase
      .from('website_pooja_products')
      .delete()
      .in('id', finalPayload.map(p => p.id));
      
    if (deleteErr) throw deleteErr;
    console.log('Cleaned up conflicts successfully.');

    console.log('Inserting products...');
    const { data, error } = await supabase
      .from('website_pooja_products')
      .insert(finalPayload)
      .select('id, name');

    if (error) throw error;
    console.log(`Seeding successful! Inserted ${data.length} products into website_pooja_products:`);
    data.forEach(p => console.log(` - ${p.name} (${p.id})`));

  } catch (err) {
    console.error('Seeding failed:', err.message || err);
  }
}

run();
