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

const malaId = 'ef9700ec-42c3-4de4-8b94-9f3e86b8d760';

async function run() {
  try {
    console.log(`Updating product ${malaId} in Supabase website_pooja_products...`);

    const updatePayload = {
      name: 'Tulsi Mala',
      subtitle: 'Sacred devotion beads blessed with divine purity',
      price: 399,
      original_price: 1999,
      short_description: 'Experience the sacred vibrations of an authentic Tulsi Mala, revered for devotion, spiritual growth, inner peace, and divine blessings. Carefully crafted from natural Tulsi wood and spiritually energized through traditional rituals.',
      description: 'Experience the sacred vibrations of an authentic Tulsi Mala, revered for devotion, spiritual growth, inner peace, and divine blessings. Carefully crafted from natural Tulsi wood and spiritually energized through traditional rituals. Tulsi Mala holds immense importance in Sanatan Dharma and is traditionally associated with Lord Vishnu and Lord Krishna. It symbolizes purity, devotion, spiritual discipline, and divine protection while supporting meditation and mantra chanting.',
      spiritual_significance: 'Tulsi Mala holds immense importance in Sanatan Dharma and is traditionally associated with Lord Vishnu and Lord Krishna. It symbolizes purity, devotion, spiritual discipline, and divine protection while supporting meditation and mantra chanting.',
      benefits: [
        'Strengthens devotion and spiritual connection',
        'Promotes inner peace, positivity, and mental calmness',
        'Supports meditation, chanting, and daily prayers',
        'Helps create a protective spiritual aura',
        'Encourages purity of thoughts and actions',
        'Invokes the divine blessings of Lord Vishnu and Goddess Tulsi'
      ],
      material: 'Natural Sacred Tulsi Wood',
      weight: '15g – 35g (Approx.)',
      dimensions: '108 Beads, 22 – 30 Inches (Approx.)',
      origin: 'India',
      priest_details: {
        name: 'Acharya Madhav Goswami',
        qualification: 'Vaishnav Tradition & Tulsi Energization Specialist',
        experience: '21+ Years',
        bio: 'Acharya Madhav Goswami specializes in Vishnu worship, Tulsi rituals, and traditional spiritual energization ceremonies.'
      },
      rituals_included: [
        { "name": "Step 1: Mala Selection", "duration": "Sacred bead quality verification", "description": "Each Tulsi Mala is carefully inspected for purity and craftsmanship." },
        { "name": "Step 2: Sacred Purification", "duration": "Traditional spiritual cleansing process", "description": "The mala undergoes purification through sacred Vedic rituals." },
        { "name": "Step 3: Personalized Sankalp", "duration": "Devotion-focused blessing invocation", "description": "A special Sankalp is performed according to the devotee's intentions." },
        { "name": "Step 4: Vishnu-Tulsi Invocation", "duration": "Divine blessing activation ceremony", "description": "Sacred Vishnu and Tulsi mantras are recited." },
        { "name": "Step 5: Spiritual Energization", "duration": "Activation through sacred mantra vibrations", "description": "The mala is energized through Vedic chanting and blessings." },
        { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred sanctification before dispatch", "description": "Final blessings are offered for devotion, peace, and spiritual growth." }
      ],
      faqs: [
        { "question": "What is a Tulsi Mala?", "answer": "A Tulsi Mala is a sacred prayer mala made from natural Tulsi wood beads and is traditionally used for chanting, meditation, and devotion." },
        { "question": "Who can wear a Tulsi Mala?", "answer": "Anyone seeking spiritual growth, peace, devotion, and divine blessings can wear a Tulsi Mala." },
        { "question": "Can I wear it daily?", "answer": "Yes, Tulsi Mala is commonly worn daily by devotees and spiritual practitioners." },
        { "question": "Is the mala energized before delivery?", "answer": "Yes, every Tulsi Mala undergoes spiritual energization before dispatch." },
        { "question": "Can it be used for japa chanting?", "answer": "Yes, Tulsi Mala is highly revered for mantra japa, meditation, and prayer practices." }
      ],
      booking_instructions: `Simple Booking Process
1. Enter your Full Name
2. Provide Mobile Number
3. Enter Complete Delivery Address
4. Complete Secure Payment
5. Priest performs energization ritual
6. Product dispatched with blessings and certification

Important Guidelines
✔ Wear the Tulsi Mala with devotion and respect.
✔ Keep the mala clean and stored in a sacred place.
✔ Avoid direct exposure to perfumes and harsh chemicals.
✔ Remove before bathing if possible to maintain longevity.
✔ Chant "Om Namo Bhagavate Vasudevaya" or "Hare Krishna Hare Rama" regularly.
✔ Use the mala for meditation, chanting, and spiritual practices.
✔ Clean gently using a soft dry cloth.
✔ Handle the beads carefully to preserve their natural quality.
✔ Maintain positive thoughts while wearing the mala.
✔ Respect it as a sacred spiritual accessory.`,
      certificates: [
        { "name": "Original Natural Tulsi Wood Beads", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Premium Handcrafted Mala", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Spiritual Energization Completed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Vishnu-Tulsi Blessing Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Quality Assurance Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
      ],
      testimonials: [
        { "name": "Raghav Sharma", "location": "Vrindavan", "rating": 5, "comment": "Beautiful Tulsi Mala with authentic beads and excellent craftsmanship." },
        { "name": "Priya Mishra", "location": "Delhi", "rating": 5, "comment": "The mala feels very pure and arrived beautifully packaged." },
        { "name": "Mohan Das", "location": "Mathura", "rating": 5, "comment": "Perfect for daily chanting and spiritual practices. Highly recommended." },
        { "name": "Neha Verma", "location": "Jaipur", "rating": 5, "comment": "Excellent quality beads and comfortable to wear throughout the day." },
        { "name": "Sandeep Goswami", "location": "Haridwar", "rating": 5, "comment": "Authentic Tulsi Mala with great finishing and spiritual significance." }
      ],
      seo_title: 'Tulsi Mala – Original Sacred Holy Basil Beads',
      seo_description: 'Shop authentic energized Tulsi Mala online. Handcrafted natural holy basil wood beads japa mala for chanting, meditation, and Lord Vishnu devotion.',
      tags: [
        'Tulsi Mala', 'Original Tulsi Mala', 'Natural Tulsi Mala', 'Tulsi Beads Mala', 'Tulsi Japa Mala', 'Tulsi Kanthi Mala', 'Sacred Tulsi Mala', 'Vishnu Tulsi Mala', 'Krishna Tulsi Mala', 'Tulsi Necklace', 'Tulsi Prayer Mala', 'Buy Tulsi Mala Online', 'Handcrafted Tulsi Mala', 'Spiritual Mala for Chanting', 'Meditation Mala', 'Authentic Tulsi Wood Mala'
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
