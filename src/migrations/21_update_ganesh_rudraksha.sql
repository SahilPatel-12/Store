-- Migration: Update Ganesh Rudraksha details with new rich copy, pricing, and priest details
BEGIN;

UPDATE public.website_pooja_products
SET 
  name = 'Original Ganesh Rudraksha (Nepali) – Energized & Certified for Success, Wisdom and Obstacle Removal',
  subtitle = 'Blessed by Lord Ganesha for success and prosperity',
  price = 1301,
  original_price = 6999,
  short_description = 'Invoke the divine blessings of Lord Ganesha with an authentic Vedic-energized Ganesh Rudraksha, traditionally revered for removing obstacles, attracting success, enhancing wisdom, and creating new opportunities in life.',
  description = 'Invoke the divine blessings of Lord Ganesha with an authentic Vedic-energized Ganesh Rudraksha, traditionally revered for removing obstacles, attracting success, enhancing wisdom, and creating new opportunities in life. The Ganesh Rudraksha is recognized by a natural trunk-like protrusion resembling Lord Ganesha''s trunk. It symbolizes wisdom, prosperity, success, and the removal of obstacles while invoking the blessings of Vighnaharta Shri Ganesh.',
  spiritual_significance = 'The Ganesh Rudraksha is recognized by a natural trunk-like protrusion resembling Lord Ganesha''s trunk. It symbolizes wisdom, prosperity, success, and the removal of obstacles while invoking the blessings of Vighnaharta Shri Ganesh.',
  benefits = ARRAY[
    'Helps remove obstacles and challenges from life',
    'Attracts success, prosperity, and positive opportunities',
    'Enhances wisdom, intelligence, and decision-making abilities',
    'Supports business growth and career advancement',
    'Encourages confidence, focus, and leadership qualities',
    'Promotes spiritual growth and divine protection'
  ],
  material = 'Natural Nepali Ganesh Rudraksha',
  weight = '5g – 18g (Approx.)',
  dimensions = '20mm – 40mm (Approx.)',
  origin = 'Nepal',
  priest_details = '{
    "name": "Acharya Ganeshanand Shastri",
    "experience": "23+ Years",
    "bio": "Acharya Ganeshanand Shastri specializes in Ganesh Pujan, Siddhi Vinayak rituals, and authentic Vedic Rudraksha energization ceremonies.",
    "qualification": "Ganapati Sadhana & Rudraksha Energization Specialist"
  }'::JSONB,
  rituals_included = '[
    { "name": "Step 1: Rudraksha Selection", "duration": "Authentic Ganesh formation verification", "description": "Each Ganesh Rudraksha is carefully inspected for its natural trunk-like formation and authenticity." },
    { "name": "Step 2: Sacred Purification", "duration": "Traditional Panchamrit cleansing ceremony", "description": "The Rudraksha is purified through sacred Vedic purification rituals." },
    { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-focused blessing invocation", "description": "A special Sankalp is performed according to the devotee''s name and spiritual intentions." },
    { "name": "Step 4: Ganapati Invocation Ritual", "duration": "Divine obstacle-removal blessing ceremony", "description": "Sacred Ganesh mantras are chanted to invoke wisdom and success." },
    { "name": "Step 5: Mantra Energization", "duration": "Activation through sacred Vedic chants", "description": "The Rudraksha is energized through dedicated mantra recitations." },
    { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred sanctification before dispatch", "description": "Final blessings are offered for prosperity, success, and protection." }
  ]'::JSONB,
  faqs = '[
    { "question": "What is Ganesh Rudraksha?", "answer": "Ganesh Rudraksha is a naturally formed Rudraksha bead that possesses a trunk-like protrusion resembling Lord Ganesha''s trunk." },
    { "question": "Why is Ganesh Rudraksha considered special?", "answer": "It is traditionally revered as a symbol of Lord Ganesha''s blessings for wisdom, prosperity, success, and obstacle removal." },
    { "question": "Who should wear Ganesh Rudraksha?", "answer": "Students, business owners, entrepreneurs, professionals, and spiritual seekers may wear it." },
    { "question": "Is the Rudraksha energized before delivery?", "answer": "Yes, every Ganesh Rudraksha undergoes authentic Vedic energization rituals before dispatch." },
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
✔ Chant "Om Gan Ganapataye Namah" regularly for divine blessings.
✔ Wear with faith, positivity, and devotion for the best spiritual experience.
✔ Clean occasionally using a soft cloth to maintain its natural condition.
✔ Follow the provided energization and wearing instructions carefully.
✔ Handle the Rudraksha gently to preserve its natural structure and energy.
✔ Maintain purity and positive intentions while wearing the sacred bead.',
  certificates = '[
    { "name": "Original Nepali Ganesh Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Natural Trunk Formation Verification", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Ganapati Energization Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Sacred Success & Prosperity Blessings Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Certificate of Authenticity Provided", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
  ]'::JSONB,
  testimonials = '[
    { "name": "Mukesh Sharma", "location": "Delhi", "rating": 5, "comment": "Beautiful Ganesh Rudraksha with a clearly visible natural trunk formation. Highly satisfied." },
    { "name": "Ritu Agarwal", "location": "Jaipur", "rating": 5, "comment": "Excellent quality and authentic appearance. Packaging was premium and secure." },
    { "name": "Saurabh Mishra", "location": "Lucknow", "rating": 5, "comment": "The energization process and certification gave me complete confidence in the product." },
    { "name": "Neha Patel", "location": "Ahmedabad", "rating": 5, "comment": "A genuine Ganesh Rudraksha exactly as shown. Delivery was fast and professional." },
    { "name": "Vivek Tiwari", "location": "Varanasi", "rating": 5, "comment": "Outstanding quality and spiritual significance. Highly recommended for devotees of Lord Ganesha." }
  ]'::JSONB,
  seo_title = 'Original Ganesh Rudraksha (Nepali) – Energized & Certified',
  seo_description = 'Discover Ganesh Rudraksha, Vedic-energized for success, intelligence, and Lord Ganesha''s obstacle-removal blessings.',
  tags = ARRAY[
    'Ganesh Rudraksha', 'Original Ganesh Rudraksha', 'Certified Ganesh Rudraksha', 'Nepali Ganesh Rudraksha', 'Ganpati Rudraksha', 'Ganesha Rudraksha', 'Rudraksha for Success', 'Rudraksha for Prosperity', 'Rudraksha for Wisdom', 'Rudraksha for Obstacle Removal', 'Energized Ganesh Rudraksha', 'Buy Ganesh Rudraksha Online', 'Authentic Rudraksha India', 'Genuine Nepali Rudraksha', 'Ganesh Blessing Rudraksha', 'Siddhi Vinayak Rudraksha'
  ]
WHERE id = '975e48a5-e295-421c-a6ac-e56664167439';

COMMIT;
