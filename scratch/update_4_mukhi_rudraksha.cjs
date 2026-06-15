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

const fourMukhiRudrakshaId = 'aff7370b-e77a-4afc-a9a3-18b388a62176';

async function run() {
  try {
    console.log(`Updating product ${fourMukhiRudrakshaId} in Supabase website_pooja_products...`);

    const updatePayload = {
      name: 'Original 4 Mukhi Rudraksha (Nepali) – Energized & Certified for Intelligence, Knowledge and Communication Skills',
      subtitle: 'Divine wisdom energy for learning and success',
      price: 999,
      original_price: 1999,
      short_description: 'Unlock the blessings of wisdom, creativity, and intellectual growth with an authentic Vedic-energized 4 Mukhi Rudraksha, revered for enhancing knowledge, communication, memory, and academic excellence.',
      description: 'Unlock the blessings of wisdom, creativity, and intellectual growth with an authentic Vedic-energized 4 Mukhi Rudraksha, revered for enhancing knowledge, communication, memory, and academic excellence. The 4 Mukhi Rudraksha is associated with Lord Brahma, the creator of knowledge and wisdom. It symbolizes intellect, creativity, communication, and learning, helping the wearer pursue knowledge, confidence, and spiritual understanding.',
      spiritual_significance: 'The 4 Mukhi Rudraksha is associated with Lord Brahma, the creator of knowledge and wisdom. It symbolizes intellect, creativity, communication, and learning, helping the wearer pursue knowledge, confidence, and spiritual understanding.',
      benefits: [
        'Enhances memory power and concentration',
        'Supports academic success and learning abilities',
        'Improves communication and public speaking skills',
        'Encourages creativity and innovative thinking',
        'Strengthens confidence during interviews and presentations',
        'Promotes clarity of thought and better decision-making'
      ],
      material: 'Natural Nepali Rudraksha',
      weight: '4g – 12g (Approx.)',
      dimensions: '18mm – 32mm (Approx.)',
      origin: 'Nepal',
      priest_details: {
        name: 'Acharya Devendra Shastri',
        experience: '19+ Years',
        bio: 'Acharya Devendra Shastri specializes in Vedic mantra siddhi, Saraswati worship rituals, and traditional Rudraksha energization ceremonies.',
        qualification: 'Vedic Knowledge & Rudraksha Energization Expert'
      },
      rituals_included: [
        { "name": "Step 1: Rudraksha Selection", "duration": "Careful authenticity and quality inspection", "description": "Each Rudraksha is examined to ensure natural purity and originality." },
        { "name": "Step 2: Sacred Purification", "duration": "Traditional Panchamrit cleansing process", "description": "The Rudraksha is purified through authentic Vedic procedures." },
        { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-specific blessing invocation", "description": "Special Sankalp is performed using the devotee's name and intentions." },
        { "name": "Step 4: Brahma Invocation Ritual", "duration": "Divine wisdom blessing ceremony", "description": "Sacred mantras dedicated to Lord Brahma are chanted." },
        { "name": "Step 5: Mantra Energization", "duration": "Spiritual activation through Vedic chants", "description": "The bead is energized using powerful Vedic mantra recitations." },
        { "name": "Step 6: Final Blessing Ceremony", "duration": "Sanctification before sacred dispatch", "description": "The Rudraksha receives final blessings and protection rituals." }
      ],
      faqs: [
        { "question": "What is the significance of 4 Mukhi Rudraksha?", "answer": "It represents Lord Brahma and is associated with wisdom, intelligence, communication, and creativity." },
        { "question": "Who should wear 4 Mukhi Rudraksha?", "answer": "Students, teachers, researchers, professionals, speakers, and individuals seeking intellectual growth can wear it." },
        { "question": "Can students benefit from this Rudraksha?", "answer": "Yes, it is widely sought by students for improved memory, concentration, and academic performance." },
        { "question": "Is this Rudraksha energized before delivery?", "answer": "Yes, every Rudraksha undergoes authentic Vedic energization rituals before dispatch." },
        { "question": "Does it come with authenticity certification?", "answer": "Yes, every Rudraksha includes authenticity assurance and quality verification." }
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
✔ Chant "Om Hreem Namah" or "Om Namah Shivaya" regularly.
✔ Wear with faith, positivity, and devotion for the best spiritual experience.
✔ Clean occasionally using a soft cloth to maintain its natural condition.
✔ Follow the provided energization and wearing instructions carefully.
✔ Handle the Rudraksha gently to preserve its natural structure and energy.
✔ Maintain purity and positive intentions while wearing the sacred bead.`,
      certificates: [
        { "name": "Natural Nepali 4 Mukhi Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Vedic Energization Completed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Sacred Ritual Blessings Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Certificate of Authenticity Provided", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
      ],
      testimonials: [
        { "name": "Aarav Kulkarni", "location": "Pune", "rating": 5, "comment": "Excellent quality Rudraksha. The craftsmanship and authenticity exceeded my expectations." },
        { "name": "Riya Sharma", "location": "Delhi", "rating": 5, "comment": "I purchased it for academic focus and found the overall experience highly satisfying." },
        { "name": "Karan Mehta", "location": "Ahmedabad", "rating": 5, "comment": "Beautifully packaged and professionally energized. Highly recommended." },
        { "name": "Sneha Tiwari", "location": "Bhopal", "rating": 5, "comment": "The bead looks genuine and arrived with proper certification. Very pleased." },
        { "name": "Vishal Mishra", "location": "Varanasi", "rating": 5, "comment": "Amazing quality, fast delivery, and authentic Vedic energization process." }
      ],
      seo_title: 'Original 4 Mukhi Rudraksha (Nepali) – Energized & Certified',
      seo_description: 'Discover 4 Mukhi Rudraksha, Vedic-energized for memory, intelligence, communication, and Lord Brahma\'s creation blessings.',
      tags: [
        '4 Mukhi Rudraksha', 'Original 4 Mukhi Rudraksha', 'Certified 4 Mukhi Rudraksha', 'Nepali 4 Mukhi Rudraksha', 'Brahma Rudraksha', 'Rudraksha for Students', 'Rudraksha for Memory Power', 'Rudraksha for Knowledge', 'Rudraksha for Communication Skills', 'Energized Rudraksha Online', 'Buy 4 Mukhi Rudraksha Online', 'Rudraksha for Intelligence', 'Spiritual Rudraksha Bead', 'Genuine Nepali Rudraksha'
      ]
    };

    const { data, error } = await supabase
      .from('website_pooja_products')
      .update(updatePayload)
      .eq('id', fourMukhiRudrakshaId);

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
