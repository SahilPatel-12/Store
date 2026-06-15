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

const facelessRudrakshaId = '3ad8e19e-0acb-4e1c-9554-91709f7c75c3';

async function run() {
  try {
    console.log(`Updating product ${facelessRudrakshaId} in Supabase website_pooja_products...`);

    const updatePayload = {
      name: 'Original Faceless Rudraksha (Nepali) – Energized & Certified for Divine Protection, Spiritual Growth and Positive Energy',
      subtitle: 'Pure divine energy beyond worldly limitations',
      price: 3701,
      original_price: 6499,
      short_description: 'Experience the sacred vibrations of an authentic Vedic-energized Faceless Rudraksha, revered for spiritual growth, divine protection, inner peace, positive energy, and strengthening one\'s connection with higher consciousness.',
      description: 'Experience the sacred vibrations of an authentic Vedic-energized Faceless Rudraksha, revered for spiritual growth, divine protection, inner peace, positive energy, and strengthening one\'s connection with higher consciousness. The Faceless Rudraksha is considered a rare and unique form of Rudraksha that symbolizes purity, divine consciousness, and spiritual awakening. It is revered for fostering inner transformation, positivity, and a deeper connection with spiritual energies.',
      spiritual_significance: 'The Faceless Rudraksha is considered a rare and unique form of Rudraksha that symbolizes purity, divine consciousness, and spiritual awakening. It is revered for fostering inner transformation, positivity, and a deeper connection with spiritual energies.',
      benefits: [
        'Promotes spiritual growth and higher awareness',
        'Creates a protective aura against negativity',
        'Encourages inner peace, balance, and mental clarity',
        'Supports meditation, mindfulness, and self-discovery',
        'Attracts positive energy and harmonious vibrations',
        'Strengthens devotion and connection with divine consciousness'
      ],
      material: 'Natural Nepali Faceless Rudraksha',
      weight: '5g – 18g (Approx.)',
      dimensions: '20mm – 38mm (Approx.)',
      origin: 'Nepal',
      priest_details: {
        name: 'Acharya Adwait Raman',
        experience: '22+ Years',
        bio: 'Acharya Adwait Raman specializes in advanced Vedic rituals, Rudraksha energization, and sacred spiritual ceremonies rooted in traditional practices.',
        qualification: 'Spiritual Energization & Rudraksha Ritual Specialist'
      },
      rituals_included: [
        { "name": "Step 1: Rudraksha Selection", "duration": "Rare specimen authenticity verification", "description": "Each Faceless Rudraksha is carefully selected for uniqueness and purity." },
        { "name": "Step 2: Sacred Purification", "duration": "Traditional Vedic cleansing process", "description": "The Rudraksha is purified using Panchamrit and sacred rituals." },
        { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-focused blessing invocation", "description": "A special Sankalp is performed according to the devotee's spiritual intentions." },
        { "name": "Step 4: Divine Invocation Ritual", "duration": "Sacred energy activation ceremony", "description": "Powerful Vedic mantras are recited to invoke divine blessings." },
        { "name": "Step 5: Mantra Energization", "duration": "Spiritual activation through chanting", "description": "The Rudraksha is energized through authentic mantra recitations." },
        { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred sanctification before dispatch", "description": "Final blessings are offered for protection, positivity, and spiritual growth." }
      ],
      faqs: [
        { "question": "What is a Faceless Rudraksha?", "answer": "A Faceless Rudraksha is a rare Rudraksha bead that possesses a naturally unique surface structure and is highly valued by spiritual practitioners." },
        { "question": "Who can wear a Faceless Rudraksha?", "answer": "Anyone seeking spiritual growth, peace of mind, positivity, and divine protection may wear it." },
        { "question": "Is this Rudraksha suitable for meditation?", "answer": "Yes, it is traditionally used by devotees to support meditation and spiritual practices." },
        { "question": "Is the Rudraksha energized before delivery?", "answer": "Yes, every Faceless Rudraksha undergoes authentic Vedic energization rituals before dispatch." },
        { "question": "Does it come with authenticity certification?", "answer": "Yes, every Rudraksha includes authenticity assurance and certification." }
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
✔ Chant "Om Namah Shivaya" regularly for spiritual connection.
✔ Wear with faith, positivity, and devotion for the best spiritual experience.
✔ Clean occasionally using a soft cloth to maintain its natural condition.
✔ Follow the provided energization and wearing instructions carefully.
✔ Handle the Rudraksha gently to preserve its natural structure and energy.
✔ Maintain purity and positive intentions while wearing the sacred bead.`,
      certificates: [
        { "name": "Original Nepali Faceless Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Rare & Naturally Formed Bead", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Vedic Energization Completed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Sacred Blessings Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Certificate of Authenticity Provided", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
      ],
      testimonials: [
        { "name": "Rohan Trivedi", "location": "Varanasi", "rating": 5, "comment": "The Faceless Rudraksha is truly unique and beautifully energized. Highly satisfied." },
        { "name": "Sneha Sharma", "location": "Delhi", "rating": 5, "comment": "Excellent quality, authentic appearance, and premium packaging." },
        { "name": "Vivek Agrawal", "location": "Jaipur", "rating": 5, "comment": "Received exactly as described. The certification and ritual process were impressive." },
        { "name": "Priya Joshi", "location": "Indore", "rating": 5, "comment": "A rare and beautiful Rudraksha. Very happy with the purchase experience." },
        { "name": "Ankit Verma", "location": "Ahmedabad", "rating": 5, "comment": "Authentic product with excellent customer support and timely delivery." }
      ],
      seo_title: 'Original Faceless Rudraksha (Nepali) – Energized & Certified',
      seo_description: 'Discover Faceless Rudraksha, Vedic-energized for spiritual growth, meditation support, and divine protection.',
      tags: [
        'Faceless Rudraksha', 'Original Faceless Rudraksha', 'Certified Faceless Rudraksha', 'Nepali Faceless Rudraksha', 'Rare Rudraksha Bead', 'Spiritual Rudraksha', 'Rudraksha for Meditation', 'Rudraksha for Spiritual Growth', 'Rudraksha for Positive Energy', 'Energized Rudraksha Online', 'Buy Faceless Rudraksha Online', 'Genuine Nepali Rudraksha', 'Divine Protection Rudraksha', 'Rare Spiritual Rudraksha'
      ]
    };

    const { data, error } = await supabase
      .from('website_pooja_products')
      .update(updatePayload)
      .eq('id', facelessRudrakshaId);

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
