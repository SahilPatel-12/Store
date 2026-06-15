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

const horseshoeId = '1fe03faa-3042-492d-b977-d536548cf0e2';

async function run() {
  try {
    console.log(`Updating product ${horseshoeId} in Supabase website_pooja_products...`);

    const updatePayload = {
      name: 'Kale Ghode Ki Naal (Black Horseshoe)',
      subtitle: 'Traditional protection symbol for luck and prosperity',
      price: 499,
      original_price: 2199,
      short_description: 'Bring home the powerful traditional symbol of protection, prosperity, and good fortune with an energized Kale Ghode Ki Naal, carefully prepared to enhance positivity, ward off negativity, and attract success.',
      description: 'Bring home the powerful traditional symbol of protection, prosperity, and good fortune with an energized Kale Ghode Ki Naal, carefully prepared to enhance positivity, ward off negativity, and attract success. The Kale Ghode Ki Naal has been traditionally regarded as a symbol of protection, prosperity, and positive energy. It is commonly used in Vastu and spiritual practices to attract good fortune and create a harmonious environment.',
      spiritual_significance: 'The Kale Ghode Ki Naal has been traditionally regarded as a symbol of protection, prosperity, and positive energy. It is commonly used in Vastu and spiritual practices to attract good fortune and create a harmonious environment.',
      benefits: [
        'Attracts positive energy and good fortune',
        'Helps create a protective shield against negativity',
        'Promotes prosperity, success, and stability',
        'Supports Vastu balance within home and workplace',
        'Encourages confidence, harmony, and well-being',
        'Traditionally regarded as a symbol of luck and protection'
      ],
      material: 'Authentic Black Horseshoe Iron',
      weight: '250g – 600g (Approx.)',
      dimensions: '4 – 7 Inches (Approx.)',
      origin: 'India',
      priest_details: {
        name: 'Acharya Bhairav Nath Sharma',
        qualification: 'Vastu Remedy & Spiritual Protection Specialist',
        experience: '20+ Years',
        bio: 'Acharya Bhairav Nath Sharma specializes in traditional Vastu remedies, protection rituals, and sacred energization ceremonies.'
      },
      rituals_included: [
        { "name": "Step 1: Horseshoe Selection", "duration": "Authenticity and quality verification", "description": "Each horseshoe is carefully inspected and selected for ritual use." },
        { "name": "Step 2: Sacred Purification", "duration": "Traditional spiritual cleansing process", "description": "The horseshoe undergoes purification using sacred Vedic methods." },
        { "name": "Step 3: Personalized Sankalp", "duration": "Protection-focused blessing invocation", "description": "A special Sankalp is performed according to the devotee's intentions." },
        { "name": "Step 4: Divine Protection Ritual", "duration": "Sacred positivity blessing ceremony", "description": "Protective mantras are chanted to invoke positive vibrations." },
        { "name": "Step 5: Spiritual Energization", "duration": "Activation through sacred mantra vibrations", "description": "The horseshoe is spiritually energized through Vedic chanting." },
        { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred protection blessing ritual", "description": "Final blessings are offered before packaging and dispatch." }
      ],
      faqs: [
        { "question": "What is Kale Ghode Ki Naal?", "answer": "Kale Ghode Ki Naal is a traditional horseshoe often used in Vastu and spiritual practices as a symbol of protection and good fortune." },
        { "question": "Where should I place the horseshoe?", "answer": "It is commonly placed near the main entrance of homes, offices, shops, or business premises." },
        { "question": "Is the horseshoe energized before delivery?", "answer": "Yes, every horseshoe undergoes a spiritual energization process before dispatch." },
        { "question": "Can it be used in offices and shops?", "answer": "Yes, it is widely placed in homes, offices, stores, and business locations." },
        { "question": "Does it come with authenticity assurance?", "answer": "Yes, every product is quality-checked and prepared before dispatch." }
      ],
      booking_instructions: `Simple Booking Process
1. Enter your Full Name
2. Provide Mobile Number
3. Enter Complete Delivery Address
4. Complete Secure Payment
5. Priest performs energization ritual
6. Product dispatched with blessings and certification

Important Guidelines
✔ Install the horseshoe in a clean and respected location.
✔ Commonly placed near the main entrance for traditional use.
✔ Keep the horseshoe clean and free from rust buildup.
✔ Avoid placing it in neglected or cluttered areas.
✔ Follow placement instructions provided with the product.
✔ Handle respectfully as a sacred spiritual remedy.
✔ Maintain positive intentions during installation.
✔ Clean periodically using a dry cloth.
✔ Protect from excessive moisture when possible.
✔ Regular prayers or gratitude practices may enhance spiritual connection.`,
      certificates: [
        { "name": "Authentic Black Horseshoe", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Spiritual Energization Completed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Protection Blessing Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Vastu-Friendly Preparation", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Quality Assurance Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
      ],
      testimonials: [
        { "name": "Rajesh Singh", "location": "Delhi", "rating": 5, "comment": "Excellent quality horseshoe with proper finishing and secure packaging." },
        { "name": "Neha Verma", "location": "Jaipur", "rating": 5, "comment": "Arrived exactly as described and was easy to install near my entrance." },
        { "name": "Mohit Sharma", "location": "Lucknow", "rating": 5, "comment": "Very satisfied with the quality and spiritual presentation." },
        { "name": "Priya Patel", "location": "Ahmedabad", "rating": 5, "comment": "Authentic product and excellent customer support throughout the process." },
        { "name": "Amit Agrawal", "location": "Indore", "rating": 5, "comment": "Beautifully prepared and packaged. Highly recommended." }
      ],
      seo_title: 'Kale Ghode Ki Naal (Black Horseshoe) – Vastu Protection',
      seo_description: 'Shop energized original Kale Ghode Ki Naal (Black Horseshoe) online. Handcrafted Vastu remedy for main door protection, luck, and Shani Dosh relief.',
      tags: [
        'Kale Ghode Ki Naal', 'Black Horseshoe', 'Original Black Horseshoe', 'Energized Black Horseshoe', 'Vastu Horseshoe', 'Horseshoe for Good Luck', 'Horseshoe for Protection', 'Black Horse Shoe Remedy', 'Main Door Vastu Remedy', 'Good Luck Horseshoe', 'Buy Kale Ghode Ki Naal Online', 'Spiritual Protection Remedy', 'Prosperity Symbol', 'Vastu Products India', 'Traditional Luck Symbol', 'Black Horseshoe for Home and Office'
      ]
    };

    const { data, error } = await supabase
      .from('website_pooja_products')
      .update(updatePayload)
      .eq('id', horseshoeId);

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
