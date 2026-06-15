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

const oneMukhiRudrakshaId = '23d716ba-29bc-42ca-9795-8fc3f468d37a';

async function run() {
  try {
    console.log(`Updating product ${oneMukhiRudrakshaId} in Supabase website_pooja_products...`);

    const updatePayload = {
      name: 'Original 1 Mukhi Rudraksha (Full & Half Moon) – Energized & Certified for Spiritual Growth, Prosperity & Divine Blessings',
      subtitle: 'Energized Vedic blessing for success, peace and abundance',
      price: 25001,
      original_price: 39999,
      short_description: 'Experience the divine power of an authentic and Vedic-energized 1 Mukhi Rudraksha, carefully selected to attract spiritual growth, prosperity, mental peace, confidence, and positive life transformation.',
      description: 'Experience the divine power of an authentic and Vedic-energized 1 Mukhi Rudraksha, carefully selected to attract spiritual growth, prosperity, mental peace, confidence, and positive life transformation. The 1 Mukhi Rudraksha is regarded as one of the most sacred beads associated with Lord Shiva. It symbolizes supreme consciousness, spiritual enlightenment, inner peace, and the removal of karmic obstacles while attracting divine blessings and prosperity.',
      spiritual_significance: 'The 1 Mukhi Rudraksha is regarded as one of the most sacred beads associated with Lord Shiva. It symbolizes supreme consciousness, spiritual enlightenment, inner peace, and the removal of karmic obstacles while attracting divine blessings and prosperity.',
      benefits: [
        'Enhances concentration, wisdom, and decision-making abilities',
        'Attracts prosperity, abundance, and financial growth',
        'Supports spiritual awakening and divine consciousness',
        'Helps reduce stress, anxiety, and negative thoughts',
        'Strengthens self-confidence and leadership qualities',
        'Creates positive vibrations for peace and harmony'
      ],
      material: 'Natural Nepali Rudraksha',
      weight: '3g – 8g (Approx.)',
      dimensions: '18mm – 28mm (Approx.)',
      origin: 'Nepal',
      priest_details: {
        name: 'Acharya Raghav Sharma',
        experience: '18+ Years',
        bio: 'Acharya Raghav Sharma has performed thousands of authentic Vedic Rudraksha energization rituals following traditional Shiva Agama and Rudra Vidhi procedures.',
        qualification: 'Senior Rudraksha Energization Specialist'
      },
      rituals_included: [
        { "name": "Step 1: Rudraksha Selection", "duration": "Authentic bead verification process", "description": "The Rudraksha is carefully selected and inspected for natural authenticity." },
        { "name": "Step 2: Purification Ritual", "duration": "Traditional cleansing and sanctification", "description": "The bead undergoes sacred purification using Panchamrit and holy water." },
        { "name": "Step 3: Vedic Sankalp", "duration": "Personalized spiritual intention ceremony", "description": "Special Sankalp is performed in the devotee's name and Gotra." },
        { "name": "Step 4: Rudra Abhishek", "duration": "Invocation of Lord Shiva blessings", "description": "Powerful Rudra mantras are chanted during the energization process." },
        { "name": "Step 5: Mantra Siddhi Process", "duration": "Activation through Vedic vibrations", "description": "Sacred Shiva mantras are recited for spiritual activation." },
        { "name": "Step 6: Final Energization", "duration": "Blessing and divine sealing ritual", "description": "The Rudraksha receives final blessings before dispatch." }
      ],
      faqs: [
        { "question": "Who should wear 1 Mukhi Rudraksha?", "answer": "Anyone seeking spiritual growth, mental clarity, prosperity, and divine blessings can wear it." },
        { "question": "Is this Rudraksha original and certified?", "answer": "Yes, every Rudraksha is quality-checked and supplied with authenticity certification." },
        { "question": "Can men and women both wear it?", "answer": "Yes, it is suitable for both men and women." },
        { "question": "How should I wear the Rudraksha?", "answer": "It can be worn as a pendant, bracelet, or kept in the puja area." },
        { "question": "Does it require energization before wearing?", "answer": "Yes, energized Rudraksha is considered spiritually more effective according to Vedic traditions." }
      ],
      booking_instructions: `Simple Booking Process
1. Enter your Full Name
2. Provide Mobile Number
3. Enter Complete Delivery Address
4. Complete Secure Payment
5. Priest performs energization ritual
6. Product dispatched with blessings and certification

Important Guidelines
✔ Keep the Rudraksha clean and respected.
✔ Avoid contact with chemicals and perfumes.
✔ Remove before consuming alcohol or non-vegetarian food if following strict spiritual practices.
✔ Chant "Om Namah Shivaya" regularly for enhanced spiritual connection.`,
      certificates: [
        { "name": "Natural Nepali Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Authenticity Verification", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Vedic Energization Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Carefully Packed & Protected", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Certificate of Authenticity Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Sacred Ritual Completion Assurance", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
      ],
      testimonials: [
        { "name": "Priyanshu Verma", "location": "Delhi", "rating": 5, "comment": "The quality exceeded my expectations. The energization details and certification gave me complete confidence." },
        { "name": "Neha Joshi", "location": "Mumbai", "rating": 5, "comment": "Beautiful Rudraksha with excellent finishing. I felt positive energy from the first day itself." },
        { "name": "Arvind Mishra", "location": "Lucknow", "rating": 5, "comment": "Very satisfied with the authenticity and packaging. Highly recommended for spiritual seekers." },
        { "name": "Pooja Sharma", "location": "Jaipur", "rating": 5, "comment": "Received exactly as described. The rituals performed before delivery made it feel truly special." },
        { "name": "Rajeev Kulkarni", "location": "Pune", "rating": 5, "comment": "Amazing experience. Fast delivery, genuine product, and excellent customer support throughout the process." }
      ],
      seo_title: 'Original 1 Mukhi Rudraksha (Full & Half Moon) – Energized & Certified',
      seo_description: 'Discover 1 Mukhi Rudraksha, Vedic-energized for spiritual awakening, prosperity, concentration, and Lord Shiva\'s sacred blessings.',
      tags: [
        '1 Mukhi Rudraksha', 'Original 1 Mukhi Rudraksha', 'Certified 1 Mukhi Rudraksha', 'Nepali 1 Mukhi Rudraksha', 'Energized Rudraksha', 'Lord Shiva Rudraksha', 'Buy 1 Mukhi Rudraksha Online', 'Authentic Rudraksha Bead', 'Spiritual Rudraksha', 'Rudraksha for Prosperity', 'Rudraksha for Success', 'Rudraksha for Peace', 'Shiva Blessed Rudraksha', 'Vedic Energized Rudraksha', 'Genuine Rudraksha India'
      ]
    };

    const { data, error } = await supabase
      .from('website_pooja_products')
      .update(updatePayload)
      .eq('id', oneMukhiRudrakshaId);

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
