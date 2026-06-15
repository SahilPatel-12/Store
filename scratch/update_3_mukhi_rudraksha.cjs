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

const threeMukhiRudrakshaId = '96175523-5182-43c9-a7fc-6abf7f96858c';

async function run() {
  try {
    console.log(`Updating product ${threeMukhiRudrakshaId} in Supabase website_pooja_products...`);

    const updatePayload = {
      name: 'Original 3 Mukhi Rudraksha (Nepali) – Energized & Certified for Confidence, Success and Removal of Past Negativity',
      subtitle: 'Sacred fire energy for confidence and transformation',
      price: 1201,
      original_price: 2499,
      short_description: 'Harness the transformative power of an authentic Vedic-energized 3 Mukhi Rudraksha, revered for boosting confidence, removing past burdens, attracting positivity, and supporting personal growth and success.',
      description: 'Harness the transformative power of an authentic Vedic-energized 3 Mukhi Rudraksha, revered for boosting confidence, removing past burdens, attracting positivity, and supporting personal growth and success. The 3 Mukhi Rudraksha is associated with Lord Agni, the deity of sacred fire. It symbolizes purification, transformation, and freedom from past karmic burdens while inspiring confidence, positivity, and spiritual progress.',
      spiritual_significance: 'The 3 Mukhi Rudraksha is associated with Lord Agni, the deity of sacred fire. It symbolizes purification, transformation, and freedom from past karmic burdens while inspiring confidence, positivity, and spiritual progress.',
      benefits: [
        'Helps release past regrets, guilt, and negative emotions',
        'Enhances self-confidence and personal courage',
        'Supports career growth and professional success',
        'Encourages positive thinking and emotional strength',
        'Promotes motivation, enthusiasm, and determination',
        'Strengthens spiritual growth and inner transformation'
      ],
      material: 'Natural Nepali Rudraksha',
      weight: '4g – 11g (Approx.)',
      dimensions: '18mm – 30mm (Approx.)',
      origin: 'Nepal',
      priest_details: {
        name: 'Acharya Harshvardhan Mishra',
        experience: '17+ Years',
        bio: 'Acharya Harshvardhan Mishra has extensive expertise in Vedic purification rituals, mantra energization, and sacred Rudraksha activation ceremonies.',
        qualification: 'Agni Vidya & Rudraksha Ritual Specialist'
      },
      rituals_included: [
        { "name": "Step 1: Rudraksha Selection", "duration": "Careful examination of authenticity", "description": "Each Rudraksha is selected through a strict quality verification process." },
        { "name": "Step 2: Sacred Purification", "duration": "Traditional Panchamrit cleansing ceremony", "description": "The bead is purified using holy substances and Vedic rituals." },
        { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-focused intention invocation", "description": "A sacred Sankalp is performed using the devotee's details." },
        { "name": "Step 4: Agni Invocation Ritual", "duration": "Sacred fire energy activation", "description": "Special Vedic mantras dedicated to Lord Agni are chanted." },
        { "name": "Step 5: Mantra Energization", "duration": "Spiritual activation through chanting", "description": "The Rudraksha is energized through repeated Vedic mantra recitations." },
        { "name": "Step 6: Divine Blessing Ceremony", "duration": "Final sanctification before dispatch", "description": "The energized Rudraksha receives sacred blessings and protection." }
      ],
      faqs: [
        { "question": "What does 3 Mukhi Rudraksha symbolize?", "answer": "It symbolizes the sacred fire of transformation, purification, and liberation from past negativity." },
        { "question": "Who should wear 3 Mukhi Rudraksha?", "answer": "Individuals seeking confidence, positivity, emotional strength, and personal growth may wear it." },
        { "question": "Can students wear 3 Mukhi Rudraksha?", "answer": "Yes, it is often worn by students to improve confidence, focus, and motivation." },
        { "question": "Is this Rudraksha energized before delivery?", "answer": "Yes, every Rudraksha undergoes a Vedic energization process before dispatch." },
        { "question": "Does the product include certification?", "answer": "Yes, authenticity assurance is provided with every Rudraksha." }
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
✔ Chant "Om Kleem Namah" or "Om Namah Shivaya" regularly.
✔ Wear with faith, positivity, and devotion for the best spiritual experience.
✔ Clean occasionally using a soft cloth to maintain its natural condition.
✔ Follow the provided energization and wearing instructions carefully.
✔ Handle the Rudraksha gently to preserve its natural structure and energy.
✔ Maintain purity and positive intentions while wearing the sacred bead.`,
      certificates: [
        { "name": "Natural Nepali 3 Mukhi Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Vedic Energization Completed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Sacred Ritual Blessings Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Certificate of Authenticity Provided", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
      ],
      testimonials: [
        { "name": "Vivek Sharma", "location": "Delhi", "rating": 5, "comment": "The Rudraksha quality is excellent. I noticed a positive shift in my confidence and mindset." },
        { "name": "Pooja Jain", "location": "Jaipur", "rating": 5, "comment": "Beautiful bead with professional packaging and certification. Very happy with the purchase." },
        { "name": "Sandeep Verma", "location": "Lucknow", "rating": 5, "comment": "The energization process and attention to detail were impressive. Highly recommended." },
        { "name": "Neha Kulshreshtha", "location": "Indore", "rating": 5, "comment": "Authentic product and smooth delivery experience. Everything was exactly as described." },
        { "name": "Rohit Agrawal", "location": "Mumbai", "rating": 5, "comment": "Excellent craftsmanship and genuine quality. A wonderful addition to my spiritual practices." }
      ],
      seo_title: 'Original 3 Mukhi Rudraksha (Nepali) – Energized & Certified',
      seo_description: 'Discover 3 Mukhi Rudraksha, Vedic-energized for confidence, motivation, and clearing past karmas under Lord Agni\'s blessings.',
      tags: [
        '3 Mukhi Rudraksha', 'Original 3 Mukhi Rudraksha', 'Certified 3 Mukhi Rudraksha', 'Nepali 3 Mukhi Rudraksha', 'Agni Rudraksha', 'Rudraksha for Confidence', 'Rudraksha for Success', 'Rudraksha for Positive Energy', 'Energized 3 Mukhi Rudraksha', 'Authentic Rudraksha Online', 'Rudraksha for Career Growth', 'Rudraksha for Motivation', 'Genuine Rudraksha India', 'Spiritual Rudraksha Bead', 'Buy 3 Mukhi Rudraksha Online'
      ]
    };

    const { data, error } = await supabase
      .from('website_pooja_products')
      .update(updatePayload)
      .eq('id', threeMukhiRudrakshaId);

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
