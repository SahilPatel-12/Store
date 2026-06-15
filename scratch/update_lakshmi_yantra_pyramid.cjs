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

const yantraId = '4f68644d-0962-448f-8c32-5c0ba01ea293';

async function run() {
  try {
    console.log(`Updating product ${yantraId} in Supabase website_pooja_products...`);

    const updatePayload = {
      name: 'Lakshmi Yantra Pyramid',
      subtitle: 'Sacred prosperity energy for wealth and abundance',
      price: 849,
      original_price: 3999,
      short_description: 'Invite the divine blessings of Goddess Lakshmi into your home, office, or business space with an energized Lakshmi Yantra Pyramid, traditionally revered for attracting prosperity, abundance, financial growth, and positive vibrations.',
      description: 'Invite the divine blessings of Goddess Lakshmi into your home, office, or business space with an energized Lakshmi Yantra Pyramid, traditionally revered for attracting prosperity, abundance, financial growth, and positive vibrations. The Lakshmi Yantra Pyramid combines the sacred geometry of a pyramid with the divine power of the Lakshmi Yantra. It is traditionally used to attract prosperity, abundance, financial growth, and positive spiritual vibrations into a space.',
      spiritual_significance: 'The Lakshmi Yantra Pyramid combines the sacred geometry of a pyramid with the divine power of the Lakshmi Yantra. It is traditionally used to attract prosperity, abundance, financial growth, and positive spiritual vibrations into a space.',
      benefits: [
        'Attracts wealth, prosperity, and abundance',
        'Supports business growth and financial stability',
        'Helps create positive and harmonious surroundings',
        'Enhances Vastu balance and energetic flow',
        'Encourages success, opportunities, and growth',
        'Invokes the blessings of Goddess Mahalakshmi'
      ],
      material: 'Sacred Yantra with Pyramid Structure',
      weight: '100g – 300g (Approx.)',
      dimensions: '2 – 4 Inches (Approx.)',
      origin: 'India',
      priest_details: {
        name: 'Acharya Mahendra Kaushik',
        qualification: 'Lakshmi Sadhana & Prosperity Ritual Specialist',
        experience: '21+ Years',
        bio: 'Acharya Mahendra Kaushik specializes in Mahalakshmi worship, prosperity rituals, and sacred Yantra energization ceremonies.'
      },
      rituals_included: [
        { "name": "Step 1: Yantra Inspection", "duration": "Sacred quality verification process", "description": "Each Lakshmi Yantra Pyramid is carefully inspected for spiritual accuracy and quality." },
        { "name": "Step 2: Sacred Purification", "duration": "Traditional Vedic cleansing ritual", "description": "The pyramid undergoes purification using sacred Vedic methods." },
        { "name": "Step 3: Personalized Sankalp", "duration": "Prosperity-focused blessing invocation", "description": "A special Sankalp is performed according to the devotee's intentions." },
        { "name": "Step 4: Mahalakshmi Invocation", "duration": "Divine wealth blessing ceremony", "description": "Sacred Lakshmi mantras are recited to invoke prosperity and abundance." },
        { "name": "Step 5: Yantra Energization", "duration": "Activation through mantra vibrations", "description": "The Yantra Pyramid is spiritually energized through Vedic chanting." },
        { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred prosperity blessing ritual", "description": "Final blessings are offered before packaging and dispatch." }
      ],
      faqs: [
        { "question": "What is a Lakshmi Yantra Pyramid?", "answer": "A Lakshmi Yantra Pyramid is a spiritual Vastu product combining the power of the Lakshmi Yantra and pyramid energy for prosperity and abundance." },
        { "question": "Where should I place the Lakshmi Yantra Pyramid?", "answer": "It is commonly placed in homes, offices, business premises, cash counters, and wealth corners." },
        { "question": "Is the Yantra energized before delivery?", "answer": "Yes, every Lakshmi Yantra Pyramid undergoes Vedic energization before dispatch." },
        { "question": "Can it be kept in a temple or puja room?", "answer": "Yes, it can be placed in a home temple, puja room, office desk, or business location." },
        { "question": "Does it come with authenticity assurance?", "answer": "Yes, every Yantra Pyramid is quality-checked and energized before delivery." }
      ],
      booking_instructions: `Simple Booking Process
1. Enter your Full Name
2. Provide Mobile Number
3. Enter Complete Delivery Address
4. Complete Secure Payment
5. Priest performs energization ritual
6. Product dispatched with blessings and certification

Important Guidelines
✔ Place the pyramid in a clean and sacred location.
✔ Keep the Yantra facing upward and unobstructed.
✔ Clean periodically using a soft dry cloth.
✔ Avoid placing it in unclean or cluttered areas.
✔ Maintain faith and positive intentions while using the Yantra.
✔ Ideal for homes, offices, business premises, and cash counters.
✔ Follow placement guidance provided with the product.
✔ Handle the Yantra respectfully as a sacred spiritual object.
✔ Keep away from excessive moisture and damage.
✔ Perform regular prayers or gratitude practices for spiritual connection.`,
      certificates: [
        { "name": "Energized Lakshmi Yantra Pyramid", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Sacred Geometry Verification", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Mahalakshmi Energization Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Prosperity Activation Process Completed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Quality Assurance Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
      ],
      testimonials: [
        { "name": "Rakesh Agarwal", "location": "Jaipur", "rating": 5, "comment": "Beautiful Yantra Pyramid with premium finishing and excellent packaging." },
        { "name": "Neha Sharma", "location": "Delhi", "rating": 5, "comment": "Placed it in my office and the product quality exceeded expectations." },
        { "name": "Saurabh Gupta", "location": "Lucknow", "rating": 5, "comment": "Authentic spiritual product with a very elegant design." },
        { "name": "Priya Patel", "location": "Ahmedabad", "rating": 5, "comment": "Loved the craftsmanship and energization process. Highly recommended." },
        { "name": "Mohit Verma", "location": "Indore", "rating": 5, "comment": "Excellent quality and perfect for my home temple setup." }
      ],
      seo_title: 'Lakshmi Yantra Pyramid – Sacred Wealth & Vastu Harmony',
      seo_description: 'Buy premium energized Lakshmi Yantra Pyramid online. Designed with sacred geometry to attract wealth, prosperity, and Vastu protection.',
      tags: [
        'Lakshmi Yantra Pyramid', 'Energized Lakshmi Yantra Pyramid', 'Lakshmi Pyramid', 'Wealth Attraction Pyramid', 'Prosperity Yantra', 'Mahalakshmi Yantra', 'Vastu Pyramid for Wealth', 'Pyramid for Financial Growth', 'Lakshmi Vastu Product', 'Wealth Attraction Yantra', 'Buy Lakshmi Yantra Pyramid Online', 'Prosperity Pyramid for Home', 'Business Growth Yantra', 'Vastu Remedies for Wealth', 'Sacred Pyramid Energy', 'Lakshmi Yantra for Money Attraction'
      ]
    };

    const { data, error } = await supabase
      .from('website_pooja_products')
      .update(updatePayload)
      .eq('id', yantraId);

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
