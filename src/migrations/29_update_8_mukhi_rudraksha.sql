-- Migration: Update 8 Mukhi Rudraksha details with new rich copy, pricing, and priest details
BEGIN;

UPDATE public.website_pooja_products
SET 
  name = 'Original 8 Mukhi Rudraksha (Nepali) – Energized & Certified for Success, Obstacle Removal and Victory',
  subtitle = 'Divine obstacle-removing energy for success and victory',
  price = 1901,
  original_price = 3999,
  short_description = 'Experience the blessings of an authentic Vedic-energized 8 Mukhi Rudraksha, traditionally revered for removing obstacles, attracting success, enhancing confidence, and creating favorable opportunities in personal and professional life.',
  description = 'Experience the blessings of an authentic Vedic-energized 8 Mukhi Rudraksha, traditionally revered for removing obstacles, attracting success, enhancing confidence, and creating favorable opportunities in personal and professional life. The 8 Mukhi Rudraksha is associated with Lord Ganesha, the remover of obstacles and the deity of wisdom and success. It symbolizes victory, progress, intelligence, and the smooth accomplishment of goals and aspirations.',
  spiritual_significance = 'The 8 Mukhi Rudraksha is associated with Lord Ganesha, the remover of obstacles and the deity of wisdom and success. It symbolizes victory, progress, intelligence, and the smooth accomplishment of goals and aspirations.',
  benefits = ARRAY[
    'Helps remove obstacles and challenges from life',
    'Attracts success, growth, and new opportunities',
    'Enhances confidence, determination, and leadership qualities',
    'Supports career advancement and business development',
    'Encourages clear thinking and effective decision-making',
    'Promotes spiritual growth and positive energy'
  ],
  material = 'Natural Nepali Rudraksha',
  weight = '5g – 15g (Approx.)',
  dimensions = '20mm – 36mm (Approx.)',
  origin = 'Nepal',
  priest_details = '{
    "name": "Acharya Vishwajeet Dwivedi",
    "experience": "19+ Years",
    "bio": "Acharya Vishwajeet Dwivedi specializes in Ganapati rituals, Vedic mantra siddhi, and authentic Rudraksha energization ceremonies performed according to traditional scriptures.",
    "qualification": "Ganesh Sadhana & Rudraksha Energization Expert"
  }'::JSONB,
  rituals_included = '[
    { "name": "Step 1: Rudraksha Selection", "duration": "Authenticity and quality verification", "description": "Every Rudraksha is carefully examined for natural formation and purity." },
    { "name": "Step 2: Sacred Purification", "duration": "Traditional Vedic cleansing process", "description": "The Rudraksha is purified using Panchamrit and holy water rituals." },
    { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-specific blessing invocation", "description": "A sacred Sankalp is performed using the devotee''s name and intentions." },
    { "name": "Step 4: Ganesh Invocation Ritual", "duration": "Divine obstacle-removal blessing ceremony", "description": "Powerful Ganesh mantras are chanted for success and protection." },
    { "name": "Step 5: Mantra Energization", "duration": "Activation through sacred Vedic vibrations", "description": "The Rudraksha is energized through dedicated mantra chanting." },
    { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred protection before dispatch", "description": "The energized bead receives final blessings and spiritual protection." }
  ]'::JSONB,
  faqs = '[
    { "question": "What is the significance of 8 Mukhi Rudraksha?", "answer": "It is associated with Lord Ganesha and is traditionally believed to help remove obstacles, attract success, and support personal growth." },
    { "question": "Who should wear 8 Mukhi Rudraksha?", "answer": "Students, entrepreneurs, professionals, business owners, and individuals facing repeated obstacles may wear it." },
    { "question": "Can it help in career and business growth?", "answer": "Traditionally, it is considered beneficial for attracting opportunities, confidence, and progress." },
    { "question": "Is the Rudraksha energized before delivery?", "answer": "Yes, every Rudraksha undergoes authentic Vedic energization rituals before dispatch." },
    { "question": "Does the product include authenticity certification?", "answer": "Yes, authenticity assurance and certification are provided with every Rudraksha." }
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
✔ Chant "Om Hreem Hum Namah" or "Om Gan Ganapataye Namah" regularly for spiritual connection.
✔ Wear with faith, positivity, and devotion for the best spiritual experience.
✔ Clean occasionally using a soft cloth to maintain its natural condition.
✔ Follow the provided energization and wearing instructions carefully.
✔ Handle the Rudraksha gently to preserve its natural structure and energy.
✔ Maintain purity and positive intentions while wearing the sacred bead.',
  certificates = '[
    { "name": "Natural Nepali 8 Mukhi Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Ganesh Energization Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Sacred Success & Protection Blessings Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Certificate of Authenticity Provided", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
  ]'::JSONB,
  testimonials = '[
    { "name": "Ankit Verma", "location": "Noida", "rating": 5, "comment": "Excellent quality Rudraksha with authentic appearance and premium packaging." },
    { "name": "Shreya Kulshreshtha", "location": "Indore", "rating": 5, "comment": "Beautiful bead and proper certification. The overall experience was wonderful." },
    { "name": "Rajesh Tiwari", "location": "Varanasi", "rating": 5, "comment": "Received exactly as described. Packaging and energization details were impressive." },
    { "name": "Priya Sharma", "location": "Delhi", "rating": 5, "comment": "A genuine product with excellent craftsmanship and quick delivery." },
    { "name": "Amit Bansal", "location": "Chandigarh", "rating": 5, "comment": "Highly satisfied with the quality and authenticity. Would definitely recommend." }
  ]'::JSONB,
  seo_title = 'Original 8 Mukhi Rudraksha (Nepali) – Energized & Certified',
  seo_description = 'Discover 8 Mukhi Rudraksha, Vedic-energized for success, obstacle removal, wisdom, and Lord Ganesha''s blessing energy.',
  tags = ARRAY[
    '8 Mukhi Rudraksha', 'Original 8 Mukhi Rudraksha', 'Certified 8 Mukhi Rudraksha', 'Nepali 8 Mukhi Rudraksha', 'Ganesh Rudraksha', 'Rudraksha for Success', 'Rudraksha for Obstacle Removal', 'Rudraksha for Career Growth', 'Rudraksha for Business Success', 'Energized Rudraksha Online', 'Buy 8 Mukhi Rudraksha Online', 'Authentic Rudraksha India', 'Genuine Nepali Rudraksha', 'Lord Ganesha Rudraksha', 'Prosperity and Success Rudraksha'
  ]
WHERE id = 'f7a85ab0-e05c-495b-a440-d87941d09df1';

COMMIT;
