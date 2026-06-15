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

const twoMukhiRudrakshaId = 'e3af2e49-7fc7-4bd5-89ec-ed861641c799';

async function run() {
  try {
    console.log(`Updating product ${twoMukhiRudrakshaId} in Supabase website_pooja_products...`);

    const updatePayload = {
      name: 'Original 2 Mukhi Rudraksha (Nepali) – Energized & Certified for Harmony, Relationships and Emotional Balance',
      subtitle: 'Divine union energy for love, harmony and peace',
      price: 1501,
      original_price: 2999,
      short_description: 'Experience the sacred blessings of an authentic and Vedic-energized 2 Mukhi Rudraksha, revered for strengthening relationships, promoting emotional stability, enhancing unity, and attracting harmony in personal and professional life.',
      description: 'Experience the sacred blessings of an authentic and Vedic-energized 2 Mukhi Rudraksha, revered for strengthening relationships, promoting emotional stability, enhancing unity, and attracting harmony in personal and professional life. The 2 Mukhi Rudraksha symbolizes the divine union of Lord Shiva and Goddess Parvati. It is believed to promote harmony, strengthen relationships, balance emotions, and help individuals achieve unity, peace, and spiritual well-being.',
      spiritual_significance: 'The 2 Mukhi Rudraksha symbolizes the divine union of Lord Shiva and Goddess Parvati. It is believed to promote harmony, strengthen relationships, balance emotions, and help individuals achieve unity, peace, and spiritual well-being.',
      benefits: [
        'Strengthens marital relationships and family harmony',
        'Promotes emotional balance and inner peace',
        'Helps resolve misunderstandings and conflicts',
        'Enhances love, trust, and mutual understanding',
        'Encourages positive communication and cooperation',
        'Supports spiritual growth through unity and balance'
      ],
      material: 'Natural Nepali Rudraksha',
      weight: '4g – 10g (Approx.)',
      dimensions: '18mm – 30mm (Approx.)',
      origin: 'Nepal',
      priest_details: {
        name: 'Acharya Venkatesh Trivedi',
        experience: '16+ Years',
        bio: 'Acharya Venkatesh Trivedi specializes in traditional Rudraksha energization and sacred Shiva-Parvati worship rituals performed according to authentic Vedic scriptures.',
        qualification: 'Rudraksha Siddhi & Vedic Ritual Expert'
      },
      rituals_included: [
        { "name": "Step 1: Rudraksha Selection", "duration": "Careful authenticity verification process", "description": "Every Rudraksha is inspected and selected for natural purity and quality." },
        { "name": "Step 2: Sacred Purification", "duration": "Traditional Panchamrit cleansing ritual", "description": "The Rudraksha is purified using sacred Vedic purification procedures." },
        { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-specific intention invocation", "description": "Special Sankalp is performed using the devotee's name and prayer intentions." },
        { "name": "Step 4: Shiva-Parvati Invocation", "duration": "Divine union blessing ceremony", "description": "Special mantras invoking Lord Shiva and Goddess Parvati are recited." },
        { "name": "Step 5: Energization Process", "duration": "Activation through sacred mantra chanting", "description": "Vedic mantras are chanted to spiritually energize the Rudraksha." },
        { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred sealing and protection ritual", "description": "The Rudraksha receives final blessings before dispatch." }
      ],
      faqs: [
        { "question": "What is the significance of 2 Mukhi Rudraksha?", "answer": "It represents the divine union of Shiva and Parvati and is associated with harmony, relationships, and emotional balance." },
        { "question": "Who can wear 2 Mukhi Rudraksha?", "answer": "Both men and women seeking relationship harmony, peace, and emotional stability can wear it." },
        { "question": "Is the Rudraksha energized before delivery?", "answer": "Yes, every Rudraksha undergoes a Vedic energization ritual before dispatch." },
        { "question": "Can unmarried individuals wear it?", "answer": "Yes, many devotees wear it to attract harmonious relationships and emotional well-being." },
        { "question": "Does it come with authenticity certification?", "answer": "Yes, every Rudraksha includes an authenticity assurance certificate." }
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
✔ Chant "Om Namah Shivaya" regularly to strengthen spiritual connection.
✔ Wear with faith, positivity, and devotion for the best spiritual experience.
✔ Clean occasionally using a soft cloth to maintain its natural condition.
✔ Follow the provided energization and wearing instructions carefully.
✔ Handle the Rudraksha gently to preserve its natural structure and energy.
✔ Maintain purity and positive intentions while wearing the sacred bead.`,
      certificates: [
        { "name": "Natural Nepali 2 Mukhi Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Thorough Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Vedic Energization Completed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Sacred Ritual Blessing Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
        { "name": "Certificate of Authenticity Provided", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
      ],
      testimonials: [
        { "name": "Anjali Mehta", "location": "Ahmedabad", "rating": 5, "comment": "I purchased this Rudraksha for relationship harmony and was impressed by its quality and presentation." },
        { "name": "Rakesh Dubey", "location": "Bhopal", "rating": 5, "comment": "Excellent product with authentic appearance and proper certification. Highly satisfied." },
        { "name": "Sneha Kapoor", "location": "Chandigarh", "rating": 5, "comment": "The energization process and packaging were exceptional. A truly spiritual experience." },
        { "name": "Manish Tiwari", "location": "Varanasi", "rating": 5, "comment": "Received a genuine Rudraksha exactly as described. Great support from the team." },
        { "name": "Kavita Sharma", "location": "Indore", "rating": 5, "comment": "Beautiful bead, carefully packed and spiritually energized. I would definitely recommend it." }
      ],
      seo_title: 'Original 2 Mukhi Rudraksha (Nepali) – Energized & Certified',
      seo_description: 'Discover 2 Mukhi Rudraksha, Vedic-energized for relationship harmony, love, unity, and Shiva-Parvati blessings.',
      tags: [
        '2 Mukhi Rudraksha', 'Original 2 Mukhi Rudraksha', 'Certified 2 Mukhi Rudraksha', 'Nepali 2 Mukhi Rudraksha', 'Shiva Parvati Rudraksha', 'Rudraksha for Marriage', 'Rudraksha for Relationships', 'Rudraksha for Harmony', 'Energized Rudraksha Online', 'Genuine Rudraksha India', 'Authentic 2 Mukhi Rudraksha', 'Relationship Healing Rudraksha', 'Spiritual Rudraksha Bead', 'Buy 2 Mukhi Rudraksha Online', 'Blessed Rudraksha'
      ]
    };

    const { data, error } = await supabase
      .from('website_pooja_products')
      .update(updatePayload)
      .eq('id', twoMukhiRudrakshaId);

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
