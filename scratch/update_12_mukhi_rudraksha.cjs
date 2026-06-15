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

const twelveMukhiRudrakshaId = '61ac554b-6cd5-4bdb-80dc-94e2dd1aa584';

async function run() {
  try {
    console.log(`Updating product ${twelveMukhiRudrakshaId} in Supabase website_pooja_products...`);

    const updatePayload = {
      name: 'Original 12 Mukhi Rudraksha (Nepali) – Energized & Certified for Leadership, Success and Solar Power',
      subtitle: 'Radiant Sun energy for confidence and authority',
      price: 8901,
      original_price: 17999,
      short_description: 'Experience the powerful blessings of an authentic Vedic-energized 12 Mukhi Rudraksha, traditionally revered for leadership, confidence, authority, success, charisma, and attracting positive opportunities in life.',
      description: 'Experience the powerful blessings of an authentic Vedic-energized 12 Mukhi Rudraksha, traditionally revered for leadership, confidence, authority, success, charisma, and attracting positive opportunities in life. The 12 Mukhi Rudraksha is associated with Lord Surya (Sun God), the source of energy, vitality, and illumination. It symbolizes leadership, authority, confidence, success, and the power to shine in all areas of life.',
      spiritual_significance: 'The 12 Mukhi Rudraksha is associated with Lord Surya (Sun God), the source of energy, vitality, and illumination. It symbolizes leadership, authority, confidence, success, and the power to shine in all areas of life.',
      benefits: [
        'Enhances leadership qualities and decision-making abilities',
        'Boosts confidence, courage, and personal influence',
        'Attracts success, recognition, and professional growth',
        'Strengthens determination and goal-oriented mindset',
        'Encourages positive energy and self-motivation',
        'Supports spiritual growth while balancing material success'
      ],
      material: 'Natural Nepali Rudraksha',
      weight: '6g – 18g (Approx.)',
      dimensions: '22mm – 40mm (Approx.)',
      origin: 'Nepal',
      priest_details: {
        name: 'Acharya Suryakant Vyas',
        experience: '24+ Years',
        bio: 'Acharya Suryakant Vyas specializes in Surya worship, Aditya Hridayam recitations, and authentic Vedic Rudraksha energization ceremonies.',
        qualification: 'Surya Sadhana & Rudraksha Energization Specialist'
      },
      rituals_included: [
        { "name": "Step 1: Rudraksha Selection", "duration": "Authenticity and sacred quality verification", "description": "Every Rudraksha is carefully examined for natural formation and purity." },
        { "name": "Step 2: Sacred Purification", "duration": "Traditional Vedic cleansing ritual", "description": "The Rudraksha is purified using Panchamrit and holy water." },
        { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-specific blessing invocation", "description": "A sacred Sankalp is performed according to the devotee's spiritual intentions." },
        { "name": "Step 4: Surya Invocation Ritual", "duration": "Divine solar blessing ceremony", "description": "Powerful Surya mantras are chanted to invoke success and vitality." },
        { "name": "Step 5: Mantra Energization", "duration": "Activation through sacred Vedic chants", "description": "The Rudraksha is energized with traditional Vedic mantra recitations." },
        { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred sanctification before dispatch", "description": "Final blessings are offered for success, confidence, and prosperity." }
      ],
      faqs: [
        { "question": "What is the significance of 12 Mukhi Rudraksha?", "answer": "It is associated with Lord Surya and is traditionally linked with leadership, authority, confidence, success, and vitality." },
        { "question": "Who should wear 12 Mukhi Rudraksha?", "answer": "Business owners, executives, leaders, professionals, public speakers, and individuals seeking confidence may wear it." },
        { "question": "Can it help improve leadership qualities?", "answer": "Traditionally, it is believed to support authority, self-confidence, charisma, and decision-making abilities." },
        { "question": "Is the Rudraksha energized before delivery?", "answer": "Yes, every Rudraksha undergoes authentic Vedic energization rituals before dispatch." },
        { "question": "Does it include authenticity certification?", "answer": "Yes, authenticity assurance and certification are provided with every Rudraksha." }
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
✔ Chant "Om Kraum Sraum Raum Namah" or "Om Suryaya Namah" regularly.
✔ Wear with faith, positivity, and devotion for the best spiritual experience.
✔ Clean occasionally using a soft cloth to maintain its natural condition.
✔ Follow the provided energization and wearing instructions carefully.
✔ Handle the Rudraksha gently to preserve its natural structure and energy.
✔ Maintain purity and positive intentions while wearing the sacred bead.`,
      certificates: [
        { "name": "Natural Nepali 12 Mukhi Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Surya Energization Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Sacred Solar Blessings Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Certificate of Authenticity Provided", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
      ],
      testimonials: [
        { "name": "Rajat Khanna", "location": "Delhi", "rating": 5, "comment": "Excellent quality Rudraksha with premium finishing and proper certification." },
        { "name": "Sneha Agarwal", "location": "Mumbai", "rating": 5, "comment": "Beautiful bead and authentic packaging. Very satisfied with the purchase." },
        { "name": "Vikram Sharma", "location": "Jaipur", "rating": 5, "comment": "Received exactly as described. The energization process added great value." },
        { "name": "Anjali Mishra", "location": "Lucknow", "rating": 5, "comment": "Authentic Rudraksha with excellent presentation and quick delivery." },
        { "name": "Mohit Verma", "location": "Ahmedabad", "rating": 5, "comment": "Outstanding quality and professional service. Highly recommended." }
      ],
      seo_title: 'Original 12 Mukhi Rudraksha (Nepali) – Energized & Certified',
      seo_description: 'Discover 12 Mukhi Rudraksha, Vedic-energized for leadership, self-confidence, authority, and Lord Surya\'s blessing energy.',
      tags: [
        '12 Mukhi Rudraksha', 'Original 12 Mukhi Rudraksha', 'Certified 12 Mukhi Rudraksha', 'Nepali 12 Mukhi Rudraksha', 'Surya Rudraksha', 'Sun God Rudraksha', 'Rudraksha for Leadership', 'Rudraksha for Confidence', 'Rudraksha for Success', 'Rudraksha for Authority', 'Energized Rudraksha Online', 'Buy 12 Mukhi Rudraksha Online', 'Authentic Rudraksha India', 'Genuine Nepali Rudraksha', 'Leadership and Success Rudraksha'
      ]
    };

    const { data, error } = await supabase
      .from('website_pooja_products')
      .update(updatePayload)
      .eq('id', twelveMukhiRudrakshaId);

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
