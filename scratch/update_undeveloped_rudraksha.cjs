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

const undevelopedRudrakshaId = 'f4286987-c5f2-455d-8022-4cd185681393';

async function run() {
  try {
    console.log(`Updating product ${undevelopedRudrakshaId} in Supabase website_pooja_products...`);

    const updatePayload = {
      name: 'Original Undeveloped Rudraksha (Nepali) – Energized & Certified Rare Rudraksha for Spiritual Protection & Divine Blessings',
      subtitle: 'Rare divine Rudraksha blessed with pure spiritual energy',
      price: 3901,
      original_price: 8999,
      short_description: 'Discover the spiritual power of a rare authentic Undeveloped Rudraksha, carefully selected and Vedic-energized to promote divine protection, positive energy, spiritual awakening, inner peace, and sacred blessings from Lord Shiva.',
      description: 'Discover the spiritual power of a rare authentic Undeveloped Rudraksha, carefully selected and Vedic-energized to promote divine protection, positive energy, spiritual awakening, inner peace, and sacred blessings from Lord Shiva. The Undeveloped Rudraksha is considered a rare natural form found before complete bead development. It symbolizes purity, untouched divine energy, spiritual potential, and a deep connection with Lord Shiva\'s sacred vibrations.',
      spiritual_significance: 'The Undeveloped Rudraksha is considered a rare natural form found before complete bead development. It symbolizes purity, untouched divine energy, spiritual potential, and a deep connection with Lord Shiva\'s sacred vibrations.',
      benefits: [
        'Attracts divine blessings and spiritual protection',
        'Promotes inner peace, positivity, and emotional balance',
        'Enhances meditation, mindfulness, and spiritual practices',
        'Creates a sacred energy field around the wearer',
        'Supports spiritual growth and self-awareness',
        'Helps maintain harmony, positivity, and mental clarity'
      ],
      material: 'Natural Undeveloped Nepali Rudraksha',
      weight: '5g – 20g (Approx.)',
      dimensions: '20mm – 40mm (Approx.)',
      origin: 'Nepal',
      priest_details: {
        name: 'Acharya Rudra Prakash Sharma',
        experience: '27+ Years',
        bio: 'Acharya Rudra Prakash Sharma specializes in identifying rare Rudraksha varieties and performing authentic Vedic energization rituals according to ancient traditions.',
        qualification: 'Rare Rudraksha Research & Energization Specialist'
      },
      rituals_included: [
        { "name": "Step 1: Rudraksha Selection", "duration": "Rare specimen authenticity verification", "description": "Each Undeveloped Rudraksha is carefully inspected for natural formation and originality." },
        { "name": "Step 2: Sacred Purification", "duration": "Traditional Vedic cleansing process", "description": "The Rudraksha is purified through Panchamrit and sacred ritual procedures." },
        { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-specific blessing invocation", "description": "A sacred Sankalp is performed according to the devotee's spiritual intentions." },
        { "name": "Step 4: Rudra Invocation Ritual", "duration": "Divine Shiva blessing ceremony", "description": "Powerful Shiva mantras are chanted to invoke sacred blessings and protection." },
        { "name": "Step 5: Mantra Energization", "duration": "Activation through Vedic mantra vibrations", "description": "The Rudraksha is spiritually energized through dedicated mantra recitations." },
        { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred sanctification before dispatch", "description": "Final blessings are offered for protection, positivity, and spiritual advancement." }
      ],
      faqs: [
        { "question": "What is an Undeveloped Rudraksha?", "answer": "An Undeveloped Rudraksha is a rare naturally occurring Rudraksha found before complete bead formation, making it unique and highly sought after by collectors and devotees." },
        { "question": "Why is Undeveloped Rudraksha considered rare?", "answer": "Its uncommon natural formation and limited availability make it a prized spiritual collectible among Rudraksha enthusiasts." },
        { "question": "Who can keep or wear Undeveloped Rudraksha?", "answer": "Spiritual seekers, Rudraksha collectors, Shiva devotees, and individuals seeking divine blessings may keep or wear it." },
        { "question": "Is the Rudraksha energized before delivery?", "answer": "Yes, every Undeveloped Rudraksha undergoes authentic Vedic energization rituals before dispatch." },
        { "question": "Does it come with authenticity certification?", "answer": "Yes, authenticity assurance and certification are included with every Rudraksha." }
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
✔ Chant "Om Namah Shivaya" regularly to strengthen spiritual connection.
✔ Wear with faith, positivity, and devotion for the best spiritual experience.
✔ Clean occasionally using a soft cloth to maintain its natural condition.
✔ Follow the provided energization and wearing instructions carefully.
✔ Handle the Rudraksha gently to preserve its natural structure and rarity.
✔ Maintain purity and positive intentions while keeping the sacred bead.`,
      certificates: [
        { "name": "Original Rare Undeveloped Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Natural Unprocessed Formation", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Vedic Energization Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Sacred Shiva Blessings Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Certificate of Authenticity Provided", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Individually Hand-Selected Specimen", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
      ],
      testimonials: [
        { "name": "Rajat Shukla", "location": "Varanasi", "rating": 5, "comment": "A truly rare Rudraksha with exceptional natural formation and authentic certification." },
        { "name": "Meera Sharma", "location": "Delhi", "rating": 5, "comment": "Beautiful spiritual collectible. The energization and packaging were excellent." },
        { "name": "Kunal Trivedi", "location": "Ahmedabad", "rating": 5, "comment": "Received exactly as shown. The rarity and quality exceeded my expectations." },
        { "name": "Priya Joshi", "location": "Indore", "rating": 5, "comment": "Authentic product with detailed certification and premium presentation." },
        { "name": "Vivek Mishra", "location": "Jaipur", "rating": 5, "comment": "An outstanding addition to my Rudraksha collection. Highly recommended." }
      ],
      seo_title: 'Original Undeveloped Rudraksha (Nepali) – Energized & Certified',
      seo_description: 'Discover the spiritual power of a rare authentic Undeveloped Rudraksha, carefully selected and Vedic-energized for divine protection, inner peace, and Shiva blessings.',
      tags: [
        'Undeveloped Rudraksha', 'Original Undeveloped Rudraksha', 'Certified Undeveloped Rudraksha', 'Rare Rudraksha', 'Rare Nepali Rudraksha', 'Authentic Undeveloped Rudraksha', 'Buy Undeveloped Rudraksha Online', 'Natural Rudraksha Bead', 'Shiva Rudraksha', 'Rare Spiritual Collectible', 'Energized Rudraksha Online', 'Genuine Nepali Rudraksha', 'Rudraksha for Spiritual Growth', 'Rudraksha for Protection', 'Premium Rudraksha India', 'Rare Sacred Rudraksha'
      ]
    };

    const { data, error } = await supabase
      .from('website_pooja_products')
      .update(updatePayload)
      .eq('id', undevelopedRudrakshaId);

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
