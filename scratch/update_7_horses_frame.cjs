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

const frameId = 'ef68116b-09ae-4034-812a-8c6ecb898a12';

async function run() {
  try {
    console.log(`Updating product ${frameId} in Supabase website_pooja_products...`);

    const updatePayload = {
      name: '7 Horses on Raw Pyrite Frame',
      subtitle: 'Powerful prosperity symbol for wealth and success',
      price: 949,
      original_price: 2899,
      short_description: 'Invite prosperity, progress, and positive energy into your home or workplace with the energized 7 Horses on Raw Pyrite Frame, a powerful Vastu and Feng Shui symbol associated with success, financial growth, and achievement.',
      description: 'Invite prosperity, progress, and positive energy into your home or workplace with the energized 7 Horses on Raw Pyrite Frame, a powerful Vastu and Feng Shui symbol associated with success, financial growth, and achievement. The 7 Horses symbolize strength, progress, speed, success, and achievement, while Raw Pyrite is known as the "Stone of Wealth." Together, they create a powerful prosperity symbol believed to attract abundance, confidence, and financial growth.',
      spiritual_significance: 'The 7 Horses symbolize strength, progress, speed, success, and achievement, while Raw Pyrite is known as the "Stone of Wealth." Together, they create a powerful prosperity symbol believed to attract abundance, confidence, and financial growth.',
      benefits: [
        'Attracts prosperity, abundance, and financial opportunities',
        'Symbolizes speed, progress, and continuous growth',
        'Supports career advancement and business success',
        'Enhances positive energy within the environment',
        'Encourages determination, confidence, and achievement',
        'Creates a powerful Vastu remedy for prosperity and success'
      ],
      material: 'Natural Raw Pyrite, Premium Resin & Decorative Frame',
      weight: '500g – 1200g (Approx.)',
      dimensions: '8 x 10 Inches to 12 x 16 Inches (Approx.)',
      origin: 'India',
      priest_details: {
        name: 'Acharya Shubhendra Sharma',
        qualification: 'Vastu Prosperity & Energy Activation Specialist',
        experience: '20+ Years',
        bio: 'Acharya Shubhendra Sharma specializes in prosperity rituals, Vastu remedies, and sacred energy activation ceremonies for homes and businesses.'
      },
      rituals_included: [
        { "name": "Step 1: Product Inspection", "duration": "Premium quality verification process", "description": "Each frame is carefully inspected for craftsmanship and quality." },
        { "name": "Step 2: Sacred Purification", "duration": "Traditional Vedic cleansing ritual", "description": "The frame undergoes sacred purification before energization." },
        { "name": "Step 3: Personalized Sankalp", "duration": "Prosperity-focused blessing invocation", "description": "A special Sankalp is performed according to the devotee's intentions." },
        { "name": "Step 4: Lakshmi-Kuber Invocation", "duration": "Divine abundance blessing ceremony", "description": "Sacred prosperity mantras are chanted for wealth and success." },
        { "name": "Step 5: Energy Activation", "duration": "Spiritual prosperity energization process", "description": "The frame is energized through Vedic mantra vibrations." },
        { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred prosperity blessing ritual", "description": "Final blessings are offered before packaging and dispatch." }
      ],
      faqs: [
        { "question": "What does the 7 Horses Frame symbolize?", "answer": "The 7 Horses symbolize success, progress, determination, growth, and victory according to Vastu and Feng Shui principles." },
        { "question": "What is the significance of Raw Pyrite?", "answer": "Raw Pyrite is traditionally associated with prosperity, abundance, confidence, and positive financial energy." },
        { "question": "Where should I place the frame?", "answer": "It is commonly placed in offices, business premises, living rooms, reception areas, and workspaces." },
        { "question": "Is the frame energized before delivery?", "answer": "Yes, every frame undergoes a spiritual energization process before dispatch." },
        { "question": "Is it suitable as a gift?", "answer": "Yes, it makes an excellent gift for business owners, entrepreneurs, professionals, and family members." }
      ],
      booking_instructions: `Simple Booking Process
1. Enter your Full Name
2. Provide Mobile Number
3. Enter Complete Delivery Address
4. Complete Secure Payment
5. Priest performs energization ritual
6. Product dispatched with blessings and certification

Important Guidelines
✔ Place the frame in a clean and visible location.
✔ Ideal for offices, business cabins, living rooms, and workspaces.
✔ Keep the frame free from dust and clutter.
✔ Avoid placing it in damaged or neglected areas.
✔ Position according to Vastu recommendations for optimal results.
✔ Clean gently with a soft dry cloth.
✔ Maintain positive intentions while displaying the frame.
✔ Avoid exposure to excessive moisture and direct damage.
✔ Handle carefully to preserve the frame and crystal structure.
✔ Respect it as a sacred prosperity and success symbol.`,
      certificates: [
        { "name": "Premium Natural Raw Pyrite Used", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Prosperity Energy Activation Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Lakshmi-Kuber Energization Ritual Completed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Vastu-Friendly Design", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Quality Assurance Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
      ],
      testimonials: [
        { "name": "Amit Bansal", "location": "Delhi", "rating": 5, "comment": "Beautiful frame with premium finishing. Perfect addition to my office." },
        { "name": "Neha Agrawal", "location": "Jaipur", "rating": 5, "comment": "Excellent quality and very attractive design. Highly recommended." },
        { "name": "Rajesh Verma", "location": "Lucknow", "rating": 5, "comment": "The Raw Pyrite detailing looks amazing and the packaging was excellent." },
        { "name": "Priya Sharma", "location": "Ahmedabad", "rating": 5, "comment": "Placed it in my workspace and it looks absolutely stunning." },
        { "name": "Mohit Kulkarni", "location": "Pune", "rating": 5, "comment": "Premium craftsmanship and excellent presentation. Worth every penny." }
      ],
      seo_title: '7 Horses on Raw Pyrite Frame – Vastu & Success Art',
      seo_description: 'Buy energized 7 Horses on Raw Pyrite Frame online. Designed for success, financial growth, and positive energy according to Vastu principles.',
      tags: [
        '7 Horses on Raw Pyrite Frame', '7 Running Horses Frame', 'Pyrite Horses Frame', 'Wealth Attraction Frame', 'Vastu 7 Horses Frame', 'Prosperity Wall Decor', 'Success Symbol Frame', 'Pyrite Wealth Frame', 'Vastu Products for Home', 'Vastu Decor for Office', 'Buy 7 Horses Frame Online', 'Wealth Attraction Decor', 'Feng Shui Horses Frame', 'Business Success Wall Art', 'Prosperity Frame for Office', 'Financial Growth Vastu Product'
      ]
    };

    const { data, error } = await supabase
      .from('website_pooja_products')
      .update(updatePayload)
      .eq('id', frameId);

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
