-- Migration: Update 11 Mukhi Rudraksha details with new rich copy, pricing, and priest details
BEGIN;

UPDATE public.website_pooja_products
SET 
  name = 'Original 11 Mukhi Rudraksha (Nepali) – Energized & Certified for Courage, Leadership and Spiritual Power',
  subtitle = 'Divine Hanuman blessings for strength and success',
  price = 4901,
  original_price = 8999,
  short_description = 'Receive the sacred blessings of an authentic Vedic-energized 11 Mukhi Rudraksha, traditionally revered for courage, leadership, confidence, protection, spiritual strength, and achieving success in challenging situations.',
  description = 'Receive the sacred blessings of an authentic Vedic-energized 11 Mukhi Rudraksha, traditionally revered for courage, leadership, confidence, protection, spiritual strength, and achieving success in challenging situations. The 11 Mukhi Rudraksha is associated with Lord Hanuman and the eleven Rudras. It symbolizes courage, devotion, strength, protection, leadership, and unwavering determination while inspiring spiritual growth and success.',
  spiritual_significance = 'The 11 Mukhi Rudraksha is associated with Lord Hanuman and the eleven Rudras. It symbolizes courage, devotion, strength, protection, leadership, and unwavering determination while inspiring spiritual growth and success.',
  benefits = ARRAY[
    'Enhances courage, confidence, and fearlessness',
    'Strengthens leadership qualities and decision-making abilities',
    'Creates a powerful shield against negativity and obstacles',
    'Supports success in career, business, and personal goals',
    'Promotes mental clarity, discipline, and focus',
    'Encourages spiritual growth and divine protection'
  ],
  material = 'Natural Nepali Rudraksha',
  weight = '6g – 18g (Approx.)',
  dimensions = '22mm – 40mm (Approx.)',
  origin = 'Nepal',
  priest_details = '{
    "name": "Acharya Veerendra Joshi",
    "experience": "23+ Years",
    "bio": "Acharya Veerendra Joshi specializes in Hanuman worship, Rudra rituals, and powerful Vedic energization ceremonies performed according to sacred traditions.",
    "qualification": "Hanuman Sadhana & Rudraksha Energization Expert"
  }'::JSONB,
  rituals_included = '[
    { "name": "Step 1: Rudraksha Selection", "duration": "Authenticity and sacred quality verification", "description": "Every Rudraksha is thoroughly inspected for purity and originality." },
    { "name": "Step 2: Sacred Purification", "duration": "Traditional Panchamrit cleansing ritual", "description": "The bead is purified using holy ingredients and Vedic procedures." },
    { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-specific blessing invocation", "description": "A sacred Sankalp is performed according to the devotee''s spiritual intentions." },
    { "name": "Step 4: Hanuman Invocation Ritual", "duration": "Divine strength blessing ceremony", "description": "Powerful Hanuman mantras are chanted for courage and protection." },
    { "name": "Step 5: Mantra Energization", "duration": "Activation through sacred Vedic chants", "description": "The Rudraksha is energized through continuous mantra recitations." },
    { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred protection before dispatch", "description": "Final blessings are offered for success, strength, and spiritual growth." }
  ]'::JSONB,
  faqs = '[
    { "question": "What is the significance of 11 Mukhi Rudraksha?", "answer": "It is associated with Lord Hanuman and the eleven Rudras, symbolizing courage, protection, leadership, and spiritual strength." },
    { "question": "Who should wear 11 Mukhi Rudraksha?", "answer": "Leaders, entrepreneurs, professionals, spiritual seekers, and individuals seeking confidence and protection may wear it." },
    { "question": "Is it suitable for career and business growth?", "answer": "Traditionally, it is believed to support leadership qualities, confidence, and success in important endeavors." },
    { "question": "Is the Rudraksha energized before delivery?", "answer": "Yes, every Rudraksha undergoes authentic Vedic energization rituals before dispatch." },
    { "question": "Does it come with authenticity certification?", "answer": "Yes, authenticity assurance and certification are included with every Rudraksha." }
  ]'::JSONB,
  booking_instructions = 'Simple Booking Process
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
✔ Chant "Om Hreem Hum Namah" or "Om Hanumate Namah" regularly.
✔ Wear with faith, positivity, and devotion for the best spiritual experience.
✔ Clean occasionally using a soft cloth to maintain its natural condition.
✔ Follow the provided energization and wearing instructions carefully.
✔ Handle the Rudraksha gently to preserve its natural structure and energy.
✔ Maintain purity and positive intentions while wearing the sacred bead.',
  certificates = '[
    { "name": "Natural Nepali 11 Mukhi Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Hanuman Energization Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Sacred Protection Blessings Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Certificate of Authenticity Provided", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
  ]'::JSONB,
  testimonials = '[
    { "name": "Ashutosh Mishra", "location": "Varanasi", "rating": 5, "comment": "Excellent quality Rudraksha with authentic appearance and premium packaging." },
    { "name": "Ritu Sharma", "location": "Delhi", "rating": 5, "comment": "The bead is beautiful and arrived with proper certification and energization details." },
    { "name": "Kunal Agrawal", "location": "Jaipur", "rating": 5, "comment": "Very satisfied with the product quality and customer support." },
    { "name": "Pankaj Tiwari", "location": "Lucknow", "rating": 5, "comment": "Authentic Rudraksha and professional service. Highly recommended." },
    { "name": "Neha Bhatia", "location": "Chandigarh", "rating": 5, "comment": "Received exactly as described. Packaging, quality, and blessings were excellent." }
  ]'::JSONB,
  seo_title = 'Original 11 Mukhi Rudraksha (Nepali) – Energized & Certified',
  seo_description = 'Discover 11 Mukhi Rudraksha, Vedic-energized for courage, fearlessness, leadership, and Lord Hanuman''s protection blessings.',
  tags = ARRAY[
    '11 Mukhi Rudraksha', 'Original 11 Mukhi Rudraksha', 'Certified 11 Mukhi Rudraksha', 'Nepali 11 Mukhi Rudraksha', 'Hanuman Rudraksha', 'Ekadash Rudra Rudraksha', 'Rudraksha for Courage', 'Rudraksha for Leadership', 'Rudraksha for Protection', 'Rudraksha for Success', 'Energized Rudraksha Online', 'Buy 11 Mukhi Rudraksha Online', 'Authentic Rudraksha India', 'Genuine Nepali Rudraksha', 'Spiritual Power Rudraksha'
  ]
WHERE id = '41c77cb0-d03b-456d-b52d-db7c5e4964b8';

COMMIT;
