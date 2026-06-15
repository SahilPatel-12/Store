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

const braceletId = 'e8c015d8-dd72-461f-830c-7f113dede450';

async function run() {
  try {
    console.log(`Updating product ${braceletId} in Supabase website_pooja_products...`);

    const updatePayload = {
      name: 'Dhan Yog Bracelet',
      subtitle: 'Sacred prosperity energies for wealth and success',
      price: 599,
      original_price: 1999,
      short_description: 'Attract abundance, financial growth, and positive opportunities with the energized Dhan Yog Bracelet, thoughtfully crafted using prosperity-associated crystals and spiritual elements to support wealth, confidence, and success.',
      description: 'Attract abundance, financial growth, and positive opportunities with the energized Dhan Yog Bracelet, thoughtfully crafted using prosperity-associated crystals and spiritual elements to support wealth, confidence, and success. The Dhan Yog Bracelet is inspired by traditional prosperity principles and is believed to help attract abundance, wealth consciousness, confidence, and positive opportunities while maintaining energetic balance and spiritual positivity.',
      spiritual_significance: 'The Dhan Yog Bracelet is inspired by traditional prosperity principles and is believed to help attract abundance, wealth consciousness, confidence, and positive opportunities while maintaining energetic balance and spiritual positivity.',
      benefits: [
        'Attracts wealth, prosperity, and financial opportunities',
        'Supports business growth and career advancement',
        'Encourages positive thinking and success-oriented actions',
        'Enhances confidence, motivation, and determination',
        'Helps create a mindset of abundance and growth',
        'Promotes positive energy and spiritual balance'
      ],
      material: 'Premium Prosperity Crystals & Spiritual Beads',
      weight: '20g – 40g (Approx.)',
      dimensions: 'Adjustable / Stretchable Fit',
      origin: 'India',
      priest_details: {
        name: 'Acharya Lakshmikant Dwivedi',
        qualification: 'Prosperity Ritual & Bracelet Energization Specialist',
        experience: '18+ Years',
        bio: 'Acharya Lakshmikant Dwivedi specializes in Lakshmi-Kuber rituals and spiritual energization ceremonies focused on prosperity and abundance.'
      },
      rituals_included: [
        { "name": "Step 1: Bracelet Inspection", "duration": "Premium quality verification process", "description": "Each bracelet is carefully inspected for craftsmanship and quality." },
        { "name": "Step 2: Sacred Purification", "duration": "Traditional Vedic cleansing ritual", "description": "The bracelet is purified using sacred methods before energization." },
        { "name": "Step 3: Personalized Sankalp", "duration": "Prosperity-focused blessing invocation", "description": "A special Sankalp is performed according to the devotee's intentions." },
        { "name": "Step 4: Lakshmi-Kuber Invocation", "duration": "Divine wealth blessing ceremony", "description": "Sacred prosperity mantras are recited to invoke abundance." },
        { "name": "Step 5: Spiritual Energization", "duration": "Activation through mantra vibrations", "description": "The bracelet is energized through Vedic chanting and blessings." },
        { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred prosperity blessing ritual", "description": "Final blessings are offered before packaging and dispatch." }
      ],
      faqs: [
        { "question": "What is a Dhan Yog Bracelet?", "answer": "A Dhan Yog Bracelet is a spiritually energized bracelet associated with prosperity, abundance, confidence, and positive energy." },
        { "question": "Who can wear the Dhan Yog Bracelet?", "answer": "Anyone seeking prosperity, financial growth, confidence, and positive opportunities can wear it." },
        { "question": "Can I wear it daily?", "answer": "Yes, the bracelet is designed for comfortable daily wear." },
        { "question": "Is the bracelet energized before delivery?", "answer": "Yes, every bracelet undergoes a spiritual energization process before dispatch." },
        { "question": "Is the size adjustable?", "answer": "Yes, the bracelet is designed to fit most wrist sizes comfortably." }
      ],
      booking_instructions: `Simple Booking Process
1. Enter your Full Name
2. Provide Mobile Number
3. Enter Complete Delivery Address
4. Complete Secure Payment
5. Priest performs energization ritual
6. Product dispatched with blessings and certification

Important Guidelines
✔ Wear the bracelet regularly for a stronger spiritual connection.
✔ Keep the bracelet clean and free from chemicals.
✔ Avoid exposing it to perfumes and harsh cleaning products.
✔ Store safely when not in use.
✔ Maintain positive intentions while wearing the bracelet.
✔ Clean gently with a soft dry cloth when required.
✔ Handle the bracelet carefully to preserve its finish.
✔ Follow the provided energization instructions.
✔ Respect the bracelet as a sacred prosperity accessory.
✔ Wear with faith, gratitude, and positive thinking.`,
      certificates: [
        { "name": "Premium Quality Prosperity Bracelet", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Lakshmi-Kuber Energization Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Prosperity Activation Completed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Quality Assurance Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
      ],
      testimonials: [
        { "name": "Rahul Agrawal", "location": "Delhi", "rating": 5, "comment": "Excellent bracelet with premium finishing and comfortable daily wear." },
        { "name": "Neha Sharma", "location": "Jaipur", "rating": 5, "comment": "Beautiful design and high-quality craftsmanship. Very satisfied." },
        { "name": "Manish Verma", "location": "Lucknow", "rating": 5, "comment": "The bracelet looks elegant and arrived with proper energization details." },
        { "name": "Priya Patel", "location": "Ahmedabad", "rating": 5, "comment": "Perfect combination of style and spiritual significance." },
        { "name": "Saurabh Mishra", "location": "Indore", "rating": 5, "comment": "Excellent quality, secure packaging, and great overall experience." }
      ],
      seo_title: 'Dhan Yog Bracelet – Sacred Crystals for Wealth & Success',
      seo_description: 'Shop authentic energized Dhan Yog Bracelet online. Handcrafted with premium prosperity crystals to attract wealth, confidence, and positive energy.',
      tags: [
        'Dhan Yog Bracelet', 'Wealth Bracelet', 'Prosperity Bracelet', 'Money Attraction Bracelet', 'Financial Growth Bracelet', 'Energized Bracelet for Wealth', 'Lakshmi Bracelet', 'Kuber Bracelet', 'Crystal Bracelet for Prosperity', 'Wealth Attraction Jewelry', 'Buy Dhan Yog Bracelet Online', 'Prosperity Crystal Bracelet', 'Spiritual Wealth Bracelet', 'Abundance Bracelet', 'Positive Energy Bracelet', 'Wealth Manifestation Bracelet'
      ]
    };

    const { data, error } = await supabase
      .from('website_pooja_products')
      .update(updatePayload)
      .eq('id', braceletId);

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
