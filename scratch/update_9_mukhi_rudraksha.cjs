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

const nineMukhiRudrakshaId = 'c9297723-c21a-42ea-b22b-c2389ec20126';

async function run() {
  try {
    console.log(`Updating product ${nineMukhiRudrakshaId} in Supabase website_pooja_products...`);

    const updatePayload = {
      name: 'Original 9 Mukhi Rudraksha (Nepali) – Energized & Certified for Strength, Protection and Divine Blessings',
      subtitle: 'Sacred Durga energy for courage and protection',
      price: 2501,
      original_price: 4999,
      short_description: 'Harness the divine blessings of an authentic Vedic-energized 9 Mukhi Rudraksha, traditionally revered for courage, protection, confidence, spiritual strength, and overcoming fears and negative influences.',
      description: 'Harness the divine blessings of an authentic Vedic-energized 9 Mukhi Rudraksha, traditionally revered for courage, protection, confidence, spiritual strength, and overcoming fears and negative influences. The 9 Mukhi Rudraksha is associated with Goddess Durga, the embodiment of divine power and protection. It symbolizes fearlessness, strength, victory over negativity, spiritual empowerment, and the blessings of the nine forms of Maa Durga.',
      spiritual_significance: 'The 9 Mukhi Rudraksha is associated with Goddess Durga, the embodiment of divine power and protection. It symbolizes fearlessness, strength, victory over negativity, spiritual empowerment, and the blessings of the nine forms of Maa Durga.',
      benefits: [
        'Enhances courage, confidence, and determination',
        'Creates a powerful shield against negativity and fear',
        'Supports spiritual growth and inner strength',
        'Helps overcome self-doubt and emotional instability',
        'Encourages success in challenging situations',
        'Invites divine blessings, positivity, and protection'
      ],
      material: 'Natural Nepali Rudraksha',
      weight: '5g – 15g (Approx.)',
      dimensions: '20mm – 36mm (Approx.)',
      origin: 'Nepal',
      priest_details: {
        name: 'Acharya Rudransh Pathak',
        experience: '21+ Years',
        bio: 'Acharya Rudransh Pathak is highly experienced in Durga worship, Navarna mantra rituals, and authentic Vedic Rudraksha energization ceremonies.',
        qualification: 'Durga Sadhana & Rudraksha Energization Specialist'
      },
      rituals_included: [
        { "name": "Step 1: Rudraksha Selection", "duration": "Authenticity and sacred quality verification", "description": "Every Rudraksha is carefully inspected for purity, originality, and natural structure." },
        { "name": "Step 2: Sacred Purification", "duration": "Traditional Panchamrit cleansing ritual", "description": "The bead is purified through Vedic procedures using sacred ingredients." },
        { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-focused blessing invocation", "description": "A sacred Sankalp is performed with the devotee's name and spiritual intentions." },
        { "name": "Step 4: Durga Invocation Ritual", "duration": "Divine protection blessing ceremony", "description": "Sacred Durga mantras are chanted to invoke divine strength and protection." },
        { "name": "Step 5: Mantra Energization", "duration": "Spiritual activation through Vedic chanting", "description": "The Rudraksha is energized through dedicated mantra recitations." },
        { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred protection before dispatch", "description": "Final blessings are offered for strength, courage, and spiritual well-being." }
      ],
      faqs: [
        { "question": "What is the significance of 9 Mukhi Rudraksha?", "answer": "It is associated with Goddess Durga and is traditionally believed to provide courage, protection, strength, and spiritual empowerment." },
        { "question": "Who should wear 9 Mukhi Rudraksha?", "answer": "Individuals seeking confidence, protection, fearlessness, and spiritual growth may wear it." },
        { "question": "Can it help overcome fear and negativity?", "answer": "Traditionally, it is believed to support emotional strength, positivity, and protection from negative influences." },
        { "question": "Is the Rudraksha energized before delivery?", "answer": "Yes, every Rudraksha undergoes authentic Vedic energization before dispatch." },
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
✔ Chant "Om Hreem Hum Namah" or "Om Dum Durgaye Namah" regularly.
✔ Wear with faith, positivity, and devotion for the best spiritual experience.
✔ Clean occasionally using a soft cloth to maintain its natural condition.
✔ Follow the provided energization and wearing instructions carefully.
✔ Handle the Rudraksha gently to preserve its natural structure and energy.
✔ Maintain purity and positive intentions while wearing the sacred bead.`,
      certificates: [
        { "name": "Natural Nepali 9 Mukhi Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Durga Energization Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Sacred Protection Blessings Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Certificate of Authenticity Provided", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
      ],
      testimonials: [
        { "name": "Nitin Sharma", "location": "Delhi", "rating": 5, "comment": "Excellent quality Rudraksha with proper certification and beautiful packaging." },
        { "name": "Pooja Mishra", "location": "Lucknow", "rating": 5, "comment": "The bead feels authentic and arrived perfectly energized and protected." },
        { "name": "Harsh Agrawal", "location": "Jaipur", "rating": 5, "comment": "Amazing craftsmanship and professional service. Highly recommended." },
        { "name": "Kavya Patel", "location": "Ahmedabad", "rating": 5, "comment": "Very satisfied with the quality, packaging, and authenticity of the Rudraksha." },
        { "name": "Rahul Dubey", "location": "Varanasi", "rating": 5, "comment": "A genuine product with excellent spiritual presentation and fast delivery." }
      ],
      seo_title: 'Original 9 Mukhi Rudraksha (Nepali) – Energized & Certified',
      seo_description: 'Discover 9 Mukhi Rudraksha, Vedic-energized for strength, courage, protection, and Goddess Durga\'s blessing energy.',
      tags: [
        '9 Mukhi Rudraksha', 'Original 9 Mukhi Rudraksha', 'Certified 9 Mukhi Rudraksha', 'Nepali 9 Mukhi Rudraksha', 'Durga Rudraksha', 'Navdurga Rudraksha', 'Rudraksha for Protection', 'Rudraksha for Courage', 'Rudraksha for Confidence', 'Rudraksha for Spiritual Strength', 'Energized Rudraksha Online', 'Buy 9 Mukhi Rudraksha Online', 'Authentic Rudraksha India', 'Genuine Nepali Rudraksha', 'Divine Protection Rudraksha'
      ]
    };

    const { data, error } = await supabase
      .from('website_pooja_products')
      .update(updatePayload)
      .eq('id', nineMukhiRudrakshaId);

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
