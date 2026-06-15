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

const sixMukhiRudrakshaId = 'b7a1532f-dcbc-453d-bd43-b1acc27d0462';

async function run() {
  try {
    console.log(`Updating product ${sixMukhiRudrakshaId} in Supabase website_pooja_products...`);

    const updatePayload = {
      name: 'Original 6 Mukhi Rudraksha (Nepali) – Energized & Certified for Confidence, Wisdom and Career Success',
      subtitle: 'Divine strength and wisdom for success',
      price: 501,
      original_price: 999,
      short_description: 'Unlock the blessings of courage, wisdom, and self-confidence with an authentic Vedic-energized 6 Mukhi Rudraksha, traditionally revered for leadership, communication skills, career advancement, and personal growth.',
      description: 'Unlock the blessings of courage, wisdom, and self-confidence with an authentic Vedic-energized 6 Mukhi Rudraksha, traditionally revered for leadership, communication skills, career advancement, and personal growth. The 6 Mukhi Rudraksha is associated with Lord Kartikeya, the divine commander of celestial forces. It symbolizes courage, wisdom, discipline, confidence, and leadership, helping devotees move forward with determination and success.',
      spiritual_significance: 'The 6 Mukhi Rudraksha is associated with Lord Kartikeya, the divine commander of celestial forces. It symbolizes courage, wisdom, discipline, confidence, and leadership, helping devotees move forward with determination and success.',
      benefits: [
        'Enhances confidence, courage, and self-esteem',
        'Supports career growth and professional success',
        'Improves communication and leadership abilities',
        'Helps maintain emotional balance and mental clarity',
        'Encourages discipline, focus, and decision-making skills',
        'Attracts positive energy for personal and professional development'
      ],
      material: 'Natural Nepali Rudraksha',
      weight: '4g – 12g (Approx.)',
      dimensions: '18mm – 32mm (Approx.)',
      origin: 'Nepal',
      priest_details: {
        name: 'Acharya Siddharth Upadhyay',
        experience: '18+ Years',
        bio: 'Acharya Siddharth Upadhyay specializes in Vedic mantra rituals, Rudraksha siddhi procedures, and sacred energization ceremonies based on ancient traditions.',
        qualification: 'Kartikeya Sadhana & Rudraksha Energization Expert'
      },
      rituals_included: [
        { "name": "Step 1: Rudraksha Selection", "duration": "Authenticity and purity verification", "description": "Each Rudraksha is carefully examined to ensure natural formation and quality." },
        { "name": "Step 2: Sacred Purification", "duration": "Traditional Panchamrit cleansing ritual", "description": "The bead undergoes purification through authentic Vedic practices." },
        { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-specific blessing ceremony", "description": "A sacred Sankalp is performed using the devotee's details and intentions." },
        { "name": "Step 4: Kartikeya Invocation", "duration": "Divine courage blessing ritual", "description": "Special mantras dedicated to Lord Kartikeya are chanted." },
        { "name": "Step 5: Mantra Energization", "duration": "Spiritual activation through sacred chants", "description": "The Rudraksha is energized with powerful Vedic mantra recitations." },
        { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred sanctification before dispatch", "description": "The energized Rudraksha receives divine blessings and protection." }
      ],
      faqs: [
        { "question": "What is the significance of 6 Mukhi Rudraksha?", "answer": "It is associated with Lord Kartikeya and is traditionally linked with confidence, wisdom, discipline, and leadership." },
        { "question": "Who should wear 6 Mukhi Rudraksha?", "answer": "Students, professionals, entrepreneurs, leaders, and individuals seeking confidence and success can wear it." },
        { "question": "Can it help improve communication skills?", "answer": "Traditionally, it is believed to support effective communication, confidence, and public speaking abilities." },
        { "question": "Is the Rudraksha energized before delivery?", "answer": "Yes, every Rudraksha undergoes authentic Vedic energization rituals before dispatch." },
        { "question": "Does the product include certification?", "answer": "Yes, authenticity assurance and certification are provided with every Rudraksha." }
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
✔ Chant "Om Hreem Hum Namah" or "Om Skandaya Namah" regularly.
✔ Wear with faith, positivity, and devotion for the best spiritual experience.
✔ Clean occasionally using a soft cloth to maintain its natural condition.
✔ Follow the provided energization and wearing instructions carefully.
✔ Handle the Rudraksha gently to preserve its natural structure and energy.
✔ Maintain purity and positive intentions while wearing the sacred bead.`,
      certificates: [
        { "name": "Natural Nepali 6 Mukhi Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Vedic Energization Completed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Kartikeya Blessing Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Certificate of Authenticity Provided", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
      ],
      testimonials: [
        { "name": "Akash Patel", "location": "Ahmedabad", "rating": 5, "comment": "The Rudraksha quality is excellent and the packaging was premium. Highly satisfied." },
        { "name": "Nidhi Sharma", "location": "Delhi", "rating": 5, "comment": "Beautiful natural bead with proper certification and energization details." },
        { "name": "Rohit Kulkarni", "location": "Pune", "rating": 5, "comment": "Purchased it for confidence and career growth. The overall experience was wonderful." },
        { "name": "Ananya Verma", "location": "Lucknow", "rating": 5, "comment": "Authentic product and timely delivery. The quality exceeded my expectations." },
        { "name": "Vikram Joshi", "location": "Indore", "rating": 5, "comment": "Excellent craftsmanship, genuine appearance, and professionally energized before delivery." }
      ],
      seo_title: 'Original 6 Mukhi Rudraksha (Nepali) – Energized & Certified',
      seo_description: 'Discover 6 Mukhi Rudraksha, Vedic-energized for confidence, career success, communication skills, and Lord Kartikeya\'s blessing energy.',
      tags: [
        '6 Mukhi Rudraksha', 'Original 6 Mukhi Rudraksha', 'Certified 6 Mukhi Rudraksha', 'Nepali 6 Mukhi Rudraksha', 'Kartikeya Rudraksha', 'Rudraksha for Confidence', 'Rudraksha for Career Success', 'Rudraksha for Leadership', 'Rudraksha for Communication Skills', 'Energized Rudraksha Online', 'Buy 6 Mukhi Rudraksha Online', 'Authentic Rudraksha India', 'Genuine Nepali Rudraksha', 'Rudraksha for Wisdom', 'Spiritual Success Rudraksha'
      ]
    };

    const { data, error } = await supabase
      .from('website_pooja_products')
      .update(updatePayload)
      .eq('id', sixMukhiRudrakshaId);

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
