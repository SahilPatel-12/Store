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

const malaId = '4d567787-bd06-418e-be2a-7e5ab2ca0abf';

async function run() {
  try {
    console.log(`Updating product ${malaId} in Supabase website_pooja_products...`);

    const updatePayload = {
      name: 'Karungali Mala with Lord Murugan Pendant',
      subtitle: 'Sacred protection and divine blessings in every bead',
      price: 849,
      original_price: 1599,
      short_description: 'Experience the spiritual power of authentic Karungali wood beads combined with the divine blessings of Lord Murugan. This energized mala is revered for protection, positivity, confidence, spiritual growth, and inner strength.',
      description: 'Experience the spiritual power of authentic Karungali wood beads combined with the divine blessings of Lord Murugan. This energized mala is revered for protection, positivity, confidence, spiritual growth, and inner strength. Karungali wood is traditionally revered for its protective and grounding properties. Combined with the sacred presence of Lord Murugan, this mala symbolizes courage, wisdom, devotion, protection, and victory over challenges and negativity.',
      spiritual_significance: 'Karungali wood is traditionally revered for its protective and grounding properties. Combined with the sacred presence of Lord Murugan, this mala symbolizes courage, wisdom, devotion, protection, and victory over challenges and negativity.',
      benefits: [
        'Invokes the blessings of Lord Murugan for courage and success',
        'Creates a protective spiritual shield against negativity',
        'Enhances confidence, determination, and willpower',
        'Supports meditation, prayer, and spiritual practices',
        'Promotes positive energy and emotional balance',
        'Helps strengthen devotion and inner peace'
      ],
      material: 'Natural Karungali Wood Beads & Lord Murugan Pendant',
      weight: '40g – 80g (Approx.)',
      dimensions: '108 Beads, 24 – 32 Inches (Approx.)',
      origin: 'South India',
      priest_details: {
        name: 'Acharya Subramanya Iyer',
        qualification: 'Murugan Upasana & Spiritual Energization Specialist',
        experience: '22+ Years',
        bio: 'Acharya Subramanya Iyer specializes in Murugan worship rituals, sacred mantra recitations, and spiritual energization ceremonies.'
      },
      rituals_included: [
        { "name": "Step 1: Mala Selection", "duration": "Premium bead quality verification", "description": "Each Karungali Mala is carefully inspected for authenticity and craftsmanship." },
        { "name": "Step 2: Sacred Purification", "duration": "Traditional spiritual cleansing ritual", "description": "The mala undergoes purification using sacred Vedic methods." },
        { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-focused blessing invocation", "description": "A special Sankalp is performed according to the devotee's spiritual intentions." },
        { "name": "Step 4: Lord Murugan Invocation", "duration": "Divine protection blessing ceremony", "description": "Sacred Murugan mantras are recited to invoke divine blessings." },
        { "name": "Step 5: Spiritual Energization", "duration": "Activation through mantra vibrations", "description": "The mala is energized through traditional spiritual chanting." },
        { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred sanctification before dispatch", "description": "Final blessings are offered for protection, strength, and positivity." }
      ],
      faqs: [
        { "question": "What is a Karungali Mala?", "answer": "A Karungali Mala is a sacred mala made from Karungali wood beads, traditionally used for spiritual practices, protection, and devotion." },
        { "question": "What is the significance of the Lord Murugan Pendant?", "answer": "The Lord Murugan Pendant symbolizes courage, wisdom, victory, protection, and divine guidance." },
        { "question": "Can I wear it daily?", "answer": "Yes, the mala is suitable for daily wear and spiritual practices." },
        { "question": "Is the mala energized before delivery?", "answer": "Yes, every Karungali Mala undergoes a spiritual energization process before dispatch." },
        { "question": "Is it suitable for gifting?", "answer": "Yes, it is a meaningful spiritual gift for devotees, family members, and loved ones." }
      ],
      booking_instructions: `Simple Booking Process
1. Enter your Full Name
2. Provide Mobile Number
3. Enter Complete Delivery Address
4. Complete Secure Payment
5. Priest performs energization ritual
6. Product dispatched with blessings and certification

Important Guidelines
✔ Wear the mala with faith and devotion.
✔ Keep the mala clean and stored respectfully when not in use.
✔ Avoid direct contact with perfumes and harsh chemicals.
✔ Remove before swimming or bathing when possible.
✔ Chant "Om Saravanabhavaya Namah" regularly while wearing the mala.
✔ Use the mala for prayer, meditation, and spiritual practices.
✔ Clean gently using a soft dry cloth.
✔ Avoid excessive pulling or rough handling of the beads.
✔ Maintain positive intentions while wearing the mala.
✔ Respect it as a sacred spiritual accessory.`,
      certificates: [
        { "name": "Original Karungali Wood Beads", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Premium Lord Murugan Pendant", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Spiritual Energization Completed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Murugan Blessing Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Quality Assurance Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
      ],
      testimonials: [
        { "name": "Aravind Kumar", "location": "Chennai", "rating": 5, "comment": "Beautiful mala with excellent bead quality and a detailed Murugan pendant." },
        { "name": "Karthik Raman", "location": "Coimbatore", "rating": 5, "comment": "Premium craftsmanship and comfortable to wear daily. Highly satisfied." },
        { "name": "Priya Subramanian", "location": "Madurai", "rating": 5, "comment": "The mala arrived beautifully packed and spiritually energized." },
        { "name": "Ramesh Iyer", "location": "Bengaluru", "rating": 5, "comment": "Excellent quality and authentic Karungali wood. Highly recommended." },
        { "name": "Lakshmi Narayanan", "location": "Tiruchirappalli", "rating": 5, "comment": "A meaningful spiritual accessory with wonderful finishing and presentation." }
      ],
      seo_title: 'Karungali Mala with Lord Murugan Pendant – Sacred Ebony Wood',
      seo_description: 'Shop authentic energized Karungali Mala with Lord Murugan Pendant. Traditional ebony beads mala handcrafted in South India for protection and victory.',
      tags: [
        'Karungali Mala with Lord Murugan Pendant', 'Karungali Mala', 'Murugan Mala', 'Lord Murugan Pendant Mala', 'Karungali Wood Mala', 'Spiritual Protection Mala', 'Murugan Devotional Mala', 'Karungali Beads Necklace', 'Energized Karungali Mala', 'South Indian Spiritual Mala', 'Buy Karungali Mala Online', 'Lord Murugan Jewelry', 'Sacred Prayer Mala', 'Meditation Mala', 'Protection Mala', 'Murugan Blessing Necklace'
      ]
    };

    const { data, error } = await supabase
      .from('website_pooja_products')
      .update(updatePayload)
      .eq('id', malaId);

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
