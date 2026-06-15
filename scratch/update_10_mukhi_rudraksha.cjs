const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tenMukhiRudrakshaId = '95190328-7b2e-4c54-9672-903427cae5b0';

async function run() {
  try {
    console.log(`Updating product ${tenMukhiRudrakshaId} in Supabase website_pooja_products...`);

    const updatePayload = {
      name: 'Original 10 Mukhi Rudraksha (Nepali) – Energized & Certified for Divine Protection, Success and Positive Energy',
      subtitle: 'Powerful divine shield against negativity and obstacles',
      price: 3501,
      original_price: 6999,
      short_description: 'Experience the protective blessings of an authentic Vedic-energized 10 Mukhi Rudraksha, traditionally revered for divine protection, success, positivity, spiritual strength, and overcoming unseen obstacles in life.',
      description: 'Experience the protective blessings of an authentic Vedic-energized 10 Mukhi Rudraksha, traditionally revered for divine protection, success, positivity, spiritual strength, and overcoming unseen obstacles in life. The 10 Mukhi Rudraksha is associated with Lord Vishnu, the preserver of the universe. It symbolizes divine protection, spiritual security, righteousness, and freedom from negative energies while promoting peace, prosperity, and success.',
      spiritual_significance: 'The 10 Mukhi Rudraksha is associated with Lord Vishnu, the preserver of the universe. It symbolizes divine protection, spiritual security, righteousness, and freedom from negative energies while promoting peace, prosperity, and success.',
      benefits: [
        'Provides powerful spiritual protection from negative influences',
        'Helps remove obstacles and challenges from life',
        'Enhances confidence, courage, and inner strength',
        'Promotes peace of mind and emotional balance',
        'Supports success in personal and professional endeavors',
        'Encourages spiritual growth and positive vibrations'
      ],
      material: 'Natural Nepali Rudraksha',
      weight: '5g – 16g (Approx.)',
      dimensions: '20mm – 38mm (Approx.)',
      origin: 'Nepal',
      priest_details: {
        name: 'Acharya Narayan Shukla',
        experience: '22+ Years',
        bio: 'Acharya Narayan Shukla is renowned for performing Vishnu Sadhana, Vedic protection rituals, and authentic Rudraksha energization ceremonies according to ancient scriptures.',
        qualification: 'Vishnu Upasana & Rudraksha Energization Specialist'
      },
      rituals_included: [
        { "name": "Step 1: Rudraksha Selection", "duration": "Authenticity and sacred quality verification", "description": "Every Rudraksha is carefully inspected to ensure purity and originality." },
        { "name": "Step 2: Sacred Purification", "duration": "Traditional Vedic cleansing ritual", "description": "The bead is purified using Panchamrit and sanctified holy water." },
        { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-specific blessing invocation", "description": "A sacred Sankalp is performed using the devotee's details and intentions." },
        { "name": "Step 4: Vishnu Invocation Ritual", "duration": "Divine protection blessing ceremony", "description": "Sacred Vishnu mantras are chanted to invoke blessings and protection." },
        { "name": "Step 5: Mantra Energization", "duration": "Activation through Vedic vibrations", "description": "The Rudraksha is energized through powerful mantra recitations." },
        { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred sanctification before dispatch", "description": "Final blessings are offered to ensure positivity and spiritual protection." }
      ],
      faqs: [
        { "question": "What is the significance of 10 Mukhi Rudraksha?", "answer": "It is associated with Lord Vishnu and is traditionally believed to provide protection, positivity, and spiritual security." },
        { "question": "Who should wear 10 Mukhi Rudraksha?", "answer": "Individuals seeking protection, peace of mind, confidence, and spiritual growth may wear it." },
        { "question": "Can it help remove obstacles and negativity?", "answer": "Traditionally, it is believed to create a protective shield against negative influences and challenges." },
        { "question": "Is the Rudraksha energized before delivery?", "answer": "Yes, every Rudraksha undergoes authentic Vedic energization rituals before dispatch." },
        { "question": "Does it include authenticity certification?", "answer": "Yes, every Rudraksha comes with authenticity assurance and certification." }
      ],
      booking_instructions: `Simple Booking Process
1. Enter your Full Name
2. Provide Mobile Number
3. Enter Complete Delivery Address
4. Complete Secure Payment
5. Priest performs energization ritual
6. Product dispatched with blessings and certification

Important Guidelines
✔ Keep the Rudraksha clean and treated with respect at all times.
✔ Store it in a clean and sacred place when not in use.
✔ Avoid direct contact with perfumes, chemicals, soaps, and detergents.
✔ Remove before swimming or activities involving excessive moisture.
✔ Chant "Om Hreem Namah" or "Om Namo Bhagavate Vasudevaya" regularly.
✔ Wear with faith, positivity, and devotion for the best spiritual experience.
✔ Clean occasionally using a soft cloth to maintain its natural condition.
✔ Follow the provided energization and wearing instructions carefully.
✔ Handle the Rudraksha gently to preserve its natural structure and energy.
✔ Maintain purity and positive intentions while wearing the sacred bead.`,
      certificates: [
        { "name": "Natural Nepali 10 Mukhi Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Vishnu Energization Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Sacred Protection Blessings Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Certificate of Authenticity Provided", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
      ],
      testimonials: [
        { "name": "Vivek Tandon", "location": "Mumbai", "rating": 5, "comment": "Excellent quality and authentic appearance. The packaging was premium and secure." },
        { "name": "Nisha Sharma", "location": "Delhi", "rating": 5, "comment": "Beautiful Rudraksha with proper certification and energization details." },
        { "name": "Gaurav Patel", "location": "Ahmedabad", "rating": 5, "comment": "Highly satisfied with the product quality and overall buying experience." },
        { "name": "Priyanka Mishra", "location": "Lucknow", "rating": 5, "comment": "The Rudraksha arrived exactly as described and beautifully packed." },
        { "name": "Sandeep Verma", "location": "Jaipur", "rating": 5, "comment": "Authentic product with excellent service and timely delivery." }
      ],
      seo_title: 'Original 10 Mukhi Rudraksha (Nepali) – Energized & Certified',
      seo_description: 'Discover 10 Mukhi Rudraksha, Vedic-energized for protection, positive energy, success, and Lord Vishnu\'s preservation blessings.',
      tags: [
        '10 Mukhi Rudraksha', 'Original 10 Mukhi Rudraksha', 'Certified 10 Mukhi Rudraksha', 'Nepali 10 Mukhi Rudraksha', 'Vishnu Rudraksha', 'Rudraksha for Protection', 'Rudraksha for Positive Energy', 'Rudraksha for Success', 'Rudraksha for Spiritual Growth', 'Energized Rudraksha Online', 'Buy 10 Mukhi Rudraksha Online', 'Authentic Rudraksha India', 'Genuine Nepali Rudraksha', 'Divine Protection Rudraksha', 'Lord Vishnu Rudraksha'
      ]
    };

    const { data, error } = await supabase
      .from('website_pooja_products')
      .update(updatePayload)
      .eq('id', tenMukhiRudrakshaId);

    if (error) {
      console.error('Update Error:', error);
      return;
    }

    console.log('Update executed successfully!');
  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
