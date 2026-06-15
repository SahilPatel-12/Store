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

const thirteenMukhiRudrakshaId = '29dcf13d-4a56-404b-8705-8509e2c43751';

async function run() {
  try {
    console.log(`Updating product ${thirteenMukhiRudrakshaId} in Supabase website_pooja_products...`);

    const updatePayload = {
      name: 'Original 13 Mukhi Rudraksha (Nepali) – Energized & Certified for Attraction, Success and Fulfillment of Desires',
      subtitle: 'Divine attraction energy for success and abundance',
      price: 14501,
      original_price: 25999,
      short_description: 'Unlock the powerful blessings of an authentic Vedic-energized 13 Mukhi Rudraksha, traditionally revered for charisma, attraction, confidence, prosperity, success, and the fulfillment of personal and professional aspirations.',
      description: 'Unlock the powerful blessings of an authentic Vedic-energized 13 Mukhi Rudraksha, traditionally revered for charisma, attraction, confidence, prosperity, success, and the fulfillment of personal and professional aspirations. The 13 Mukhi Rudraksha is associated with Lord Kamadeva and is blessed by Lord Indra according to traditional beliefs. It symbolizes attraction, fulfillment of desires, prosperity, confidence, charisma, and success in various aspects of life.',
      spiritual_significance: 'The 13 Mukhi Rudraksha is associated with Lord Kamadeva and is blessed by Lord Indra according to traditional beliefs. It symbolizes attraction, fulfillment of desires, prosperity, confidence, charisma, and success in various aspects of life.',
      benefits: [
        'Enhances charm, confidence, and personal magnetism',
        'Attracts success, prosperity, and favorable opportunities',
        'Supports leadership and influential communication',
        'Encourages creativity, ambition, and goal achievement',
        'Helps strengthen relationships and social connections',
        'Promotes spiritual growth alongside material progress'
      ],
      material: 'Natural Nepali Rudraksha',
      weight: '6g – 20g (Approx.)',
      dimensions: '22mm – 42mm (Approx.)',
      origin: 'Nepal',
      priest_details: {
        name: 'Acharya Pranav Bhardwaj',
        experience: '25+ Years',
        bio: 'Acharya Pranav Bhardwaj specializes in advanced Vedic rituals, prosperity sadhanas, and authentic Rudraksha energization ceremonies.',
        qualification: 'Vedic Prosperity Ritual & Rudraksha Energization Specialist'
      },
      rituals_included: [
        { "name": "Step 1: Rudraksha Selection", "duration": "Authenticity and quality verification", "description": "Each Rudraksha is carefully selected and inspected for purity and originality." },
        { "name": "Step 2: Sacred Purification", "duration": "Traditional Panchamrit cleansing ritual", "description": "The bead undergoes Vedic purification using sacred ingredients and holy water." },
        { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-focused blessing invocation", "description": "A sacred Sankalp is performed according to the devotee's intentions." },
        { "name": "Step 4: Kamadeva Invocation Ritual", "duration": "Divine attraction blessing ceremony", "description": "Special Vedic mantras are chanted to invoke blessings of attraction and success." },
        { "name": "Step 5: Mantra Energization", "duration": "Activation through sacred Vedic chants", "description": "The Rudraksha is spiritually energized through dedicated mantra recitations." },
        { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred sanctification before dispatch", "description": "Final blessings are offered for prosperity, confidence, and success." }
      ],
      faqs: [
        { "question": "What is the significance of 13 Mukhi Rudraksha?", "answer": "It is traditionally associated with attraction, confidence, prosperity, charisma, and the fulfillment of desires." },
        { "question": "Who should wear 13 Mukhi Rudraksha?", "answer": "Business owners, professionals, leaders, artists, and individuals seeking success and confidence may wear it." },
        { "question": "Can it help attract opportunities?", "answer": "Traditionally, it is believed to support personal influence, attraction, and favorable opportunities." },
        { "question": "Is the Rudraksha energized before delivery?", "answer": "Yes, every Rudraksha undergoes authentic Vedic energization rituals before dispatch." },
        { "question": "Does it come with authenticity certification?", "answer": "Yes, authenticity assurance and certification are provided with every Rudraksha." }
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
✔ Chant "Om Hreem Namah" regularly with devotion and positivity.
✔ Wear with faith, sincerity, and spiritual discipline.
✔ Clean occasionally using a soft cloth to maintain its natural condition.
✔ Follow the provided energization and wearing instructions carefully.
✔ Handle the Rudraksha gently to preserve its natural structure and energy.
✔ Maintain purity and positive intentions while wearing the sacred bead.`,
      certificates: [
        { "name": "Natural Nepali 13 Mukhi Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Vedic Energization Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Sacred Prosperity Blessings Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Certificate of Authenticity Provided", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
      ],
      testimonials: [
        { "name": "Ankit Mehra", "location": "Delhi", "rating": 5, "comment": "Exceptional quality and authenticity. The Rudraksha arrived beautifully packaged." },
        { "name": "Priyanka Sharma", "location": "Jaipur", "rating": 5, "comment": "The bead looks genuine and came with complete certification details." },
        { "name": "Saurabh Agrawal", "location": "Indore", "rating": 5, "comment": "Excellent craftsmanship and professional service. Highly recommended." },
        { "name": "Neha Kapoor", "location": "Chandigarh", "rating": 5, "comment": "Very satisfied with the quality, packaging, and overall experience." },
        { "name": "Rohan Verma", "location": "Lucknow", "rating": 5, "comment": "A premium Rudraksha with authentic appearance and fast delivery." }
      ],
      seo_title: 'Original 13 Mukhi Rudraksha (Nepali) – Energized & Certified',
      seo_description: 'Discover 13 Mukhi Rudraksha, Vedic-energized for charisma, personal attraction, confidence, and desire fulfillment.',
      tags: [
        '13 Mukhi Rudraksha', 'Original 13 Mukhi Rudraksha', 'Certified 13 Mukhi Rudraksha', 'Nepali 13 Mukhi Rudraksha', 'Kamadeva Rudraksha', 'Rudraksha for Attraction', 'Rudraksha for Success', 'Rudraksha for Prosperity', 'Rudraksha for Confidence', 'Rudraksha for Charisma', 'Energized Rudraksha Online', 'Buy 13 Mukhi Rudraksha Online', 'Authentic Rudraksha India', 'Genuine Nepali Rudraksha', 'Desire Fulfillment Rudraksha'
      ]
    };

    const { data, error } = await supabase
      .from('website_pooja_products')
      .update(updatePayload)
      .eq('id', thirteenMukhiRudrakshaId);

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
