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

const pyriteAnkletId = '4b93ba23-0817-4ce0-8706-7cb643dd2d36';

async function run() {
  try {
    console.log(`Updating product ${pyriteAnkletId} in Supabase website_pooja_products...`);

    const updatePayload = {
      name: 'Raw Pyrite Anklet',
      subtitle: 'Natural wealth crystal for abundance and positivity',
      price: 699,
      original_price: 1399,
      short_description: 'Carry the powerful energy of natural Pyrite wherever you go with this handcrafted Raw Pyrite Anklet, designed to attract prosperity, confidence, positive energy, and financial growth while complementing your daily style.',
      description: 'Carry the powerful energy of natural Pyrite wherever you go with this handcrafted Raw Pyrite Anklet, designed to attract prosperity, confidence, positive energy, and financial growth while complementing your daily style. Raw Pyrite is widely known as the "Stone of Wealth" and is believed to attract abundance, prosperity, confidence, and positive energy. Wearing a Pyrite Anklet helps keep these empowering vibrations close throughout the day.',
      spiritual_significance: 'Raw Pyrite is widely known as the "Stone of Wealth" and is believed to attract abundance, prosperity, confidence, and positive energy. Wearing a Pyrite Anklet helps keep these empowering vibrations close throughout the day.',
      benefits: [
        'Attracts prosperity, abundance, and financial opportunities',
        'Encourages confidence, motivation, and determination',
        'Supports positive thinking and goal-oriented actions',
        'Creates an energetic shield against negativity',
        'Promotes stability, focus, and personal growth',
        'Combines spiritual benefits with elegant everyday wear'
      ],
      material: 'Natural Raw Pyrite Crystal Beads',
      weight: '15g – 30g (Approx.)',
      dimensions: 'Adjustable 8 – 12 Inches (Approx.)',
      origin: 'Natural Pyrite Crystal',
      priest_details: {
        name: 'Acharya Arvind Pathak',
        qualification: 'Crystal Energization & Prosperity Ritual Specialist',
        experience: '17+ Years',
        bio: 'Acharya Arvind Pathak specializes in crystal activation rituals and prosperity-focused Vedic energization ceremonies.'
      },
      rituals_included: [
        { "name": "Step 1: Crystal Selection", "duration": "Premium natural crystal verification", "description": "Each Pyrite crystal is carefully selected for quality and natural energy." },
        { "name": "Step 2: Sacred Purification", "duration": "Traditional energy cleansing process", "description": "The anklet is purified using sacred Vedic methods." },
        { "name": "Step 3: Personalized Sankalp", "duration": "Prosperity-focused blessing invocation", "description": "A special Sankalp is performed according to the devotee's intentions." },
        { "name": "Step 4: Lakshmi-Kuber Invocation", "duration": "Wealth attraction blessing ceremony", "description": "Sacred prosperity mantras are recited during energization." },
        { "name": "Step 5: Crystal Activation", "duration": "Spiritual energy enhancement process", "description": "The Pyrite Anklet is energized through mantra vibrations." },
        { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred prosperity blessing ritual", "description": "Final blessings are offered before packaging and dispatch." }
      ],
      faqs: [
        { "question": "What is a Raw Pyrite Anklet?", "answer": "A Raw Pyrite Anklet is a wearable crystal accessory made from natural Pyrite stones, traditionally associated with prosperity and positive energy." },
        { "question": "Can I wear it daily?", "answer": "Yes, the anklet is designed for comfortable everyday use." },
        { "question": "Is the Pyrite natural?", "answer": "Yes, only natural Pyrite crystals are used in the anklet." },
        { "question": "Is it energized before delivery?", "answer": "Yes, every anklet undergoes a spiritual energization process before dispatch." },
        { "question": "Is the size adjustable?", "answer": "Yes, the anklet includes an adjustable design suitable for most users." }
      ],
      booking_instructions: `Simple Booking Process
1. Enter your Full Name
2. Provide Mobile Number
3. Enter Complete Delivery Address
4. Complete Secure Payment
5. Priest performs energization ritual
6. Product dispatched with blessings and certification

Important Guidelines
✔ Wear the anklet regularly for a stronger spiritual connection.
✔ Keep the crystal clean and free from dirt or chemicals.
✔ Remove before swimming or bathing if possible.
✔ Avoid direct exposure to perfumes and harsh chemicals.
✔ Maintain positive intentions while wearing the anklet.
✔ Clean gently using a soft dry cloth.
✔ Store safely when not in use.
✔ Handle the natural crystals with care.
✔ Follow the provided energization instructions.
✔ Respect the anklet as a sacred prosperity accessory.`,
      certificates: [
        { "name": "Natural Raw Pyrite Crystal", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Premium Quality Crystal Selection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Spiritual Energization Completed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Prosperity Activation Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Quality Assurance Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
      ],
      testimonials: [
        { "name": "Shreya Gupta", "location": "Mumbai", "rating": 5, "comment": "Beautiful anklet with genuine Pyrite crystals and excellent finishing." },
        { "name": "Rohit Sharma", "location": "Delhi", "rating": 5, "comment": "Comfortable to wear and looks premium. Very satisfied with the quality." },
        { "name": "Priya Verma", "location": "Jaipur", "rating": 5, "comment": "The crystal quality exceeded my expectations. Highly recommended." },
        { "name": "Manish Agrawal", "location": "Indore", "rating": 5, "comment": "Perfect combination of style and positive crystal energy." },
        { "name": "Kavya Patel", "location": "Ahmedabad", "rating": 5, "comment": "Elegant design, secure packaging, and excellent craftsmanship." }
      ],
      seo_title: 'Raw Pyrite Anklet – Natural Wealth & Prosperity Crystal',
      seo_description: 'Shop authentic Raw Pyrite Anklet online. Handcrafted natural pyrite crystal beaded anklet energized for wealth attraction, confidence, and protection.',
      tags: [
        'Raw Pyrite Anklet', 'Pyrite Crystal Anklet', 'Natural Pyrite Anklet', 'Wealth Attraction Anklet', 'Prosperity Crystal Jewelry', 'Pyrite Bracelet Alternative', 'Crystal Anklet for Wealth', 'Pyrite for Money Attraction', 'Handmade Crystal Anklet', 'Buy Pyrite Anklet Online', 'Natural Crystal Jewelry', 'Pyrite Stone Anklet', 'Prosperity Crystal Accessory', 'Energy Crystal Anklet', 'Spiritual Crystal Jewelry'
      ]
    };

    const { data, error } = await supabase
      .from('website_pooja_products')
      .update(updatePayload)
      .eq('id', pyriteAnkletId);

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
