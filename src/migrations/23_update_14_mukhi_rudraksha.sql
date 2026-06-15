-- Migration: Update 14 Mukhi Rudraksha details with new rich copy, pricing, and priest details
BEGIN;

UPDATE public.website_pooja_products
SET 
  name = 'Original 14 Mukhi Rudraksha (Nepali) – Energized & Certified for Intuition, Protection and Supreme Success',
  subtitle = 'Divine Shiva blessings for wisdom and protection',
  price = 28501,
  original_price = 47999,
  short_description = 'Experience the extraordinary spiritual power of an authentic Vedic-energized 14 Mukhi Rudraksha, traditionally revered for intuition, protection, leadership, decision-making, success, and divine blessings from Lord Shiva.',
  description = 'Experience the extraordinary spiritual power of an authentic Vedic-energized 14 Mukhi Rudraksha, traditionally revered for intuition, protection, leadership, decision-making, success, and divine blessings from Lord Shiva. The 14 Mukhi Rudraksha is known as the "Dev Mani" and is associated with Lord Shiva. It symbolizes wisdom, intuition, protection, spiritual awakening, and the ability to make sound decisions while overcoming life''s challenges.',
  spiritual_significance = 'The 14 Mukhi Rudraksha is known as the "Dev Mani" and is associated with Lord Shiva. It symbolizes wisdom, intuition, protection, spiritual awakening, and the ability to make sound decisions while overcoming life''s challenges.',
  benefits = ARRAY[
    'Enhances intuition, foresight, and decision-making abilities',
    'Provides powerful spiritual protection from negative influences',
    'Strengthens leadership qualities and personal authority',
    'Supports career advancement, business success, and prosperity',
    'Encourages confidence, courage, and mental clarity',
    'Promotes spiritual growth, wisdom, and inner transformation'
  ],
  material = 'Natural Nepali Rudraksha',
  weight = '7g – 22g (Approx.)',
  dimensions = '24mm – 45mm (Approx.)',
  origin = 'Nepal',
  priest_details = '{
    "name": "Acharya Shivansh Tirth",
    "experience": "28+ Years",
    "bio": "Acharya Shivansh Tirth is highly respected for conducting advanced Rudra rituals, Shiva worship ceremonies, and authentic Vedic Rudraksha energization processes.",
    "qualification": "Maha Rudra Sadhana & Rudraksha Energization Specialist"
  }'::JSONB,
  rituals_included = '[
    { "name": "Step 1: Rudraksha Selection", "duration": "Authenticity and sacred quality verification", "description": "Each Rudraksha is carefully examined for purity, originality, and natural formation." },
    { "name": "Step 2: Sacred Purification", "duration": "Traditional Panchamrit cleansing ritual", "description": "The Rudraksha undergoes Vedic purification using sacred ingredients and holy water." },
    { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-specific blessing invocation", "description": "A sacred Sankalp is performed according to the devotee''s name and intentions." },
    { "name": "Step 4: Maha Rudra Invocation", "duration": "Divine Shiva blessing ceremony", "description": "Powerful Rudra mantras are chanted to invoke Lord Shiva''s blessings." },
    { "name": "Step 5: Mantra Energization", "duration": "Activation through sacred Vedic chants", "description": "The Rudraksha is spiritually energized through dedicated mantra recitations." },
    { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred sanctification before dispatch", "description": "Final blessings are offered for protection, wisdom, and success." }
  ]'::JSONB,
  faqs = '[
    { "question": "What is the significance of 14 Mukhi Rudraksha?", "answer": "The 14 Mukhi Rudraksha is associated with Lord Shiva and is traditionally revered for intuition, wisdom, protection, leadership, and spiritual growth." },
    { "question": "Who should wear 14 Mukhi Rudraksha?", "answer": "Business leaders, entrepreneurs, professionals, spiritual seekers, and individuals seeking better decision-making and confidence may wear it." },
    { "question": "Why is it called Dev Mani?", "answer": "According to traditional beliefs, the 14 Mukhi Rudraksha is known as \"Dev Mani\" because of its highly revered spiritual significance and association with divine wisdom." },
    { "question": "Is the Rudraksha energized before delivery?", "answer": "Yes, every Rudraksha undergoes authentic Vedic energization rituals before dispatch." },
    { "question": "Does it come with authenticity certification?", "answer": "Yes, authenticity assurance and certification are provided with every Rudraksha." }
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
✔ Chant "Om Namah Shivaya" or "Om Rudraya Namah" regularly.
✔ Wear with faith, positivity, and devotion for the best spiritual experience.
✔ Clean occasionally using a soft cloth to maintain its natural condition.
✔ Follow the provided energization and wearing instructions carefully.
✔ Handle the Rudraksha gently to preserve its natural structure and energy.
✔ Maintain purity and positive intentions while wearing the sacred bead.',
  certificates = '[
    { "name": "Natural Nepali 14 Mukhi Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Premium Grade Quality Selection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Expert Authenticity Verification", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Maha Rudra Energization Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Sacred Shiva Blessings Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Secure Luxury Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Certificate of Authenticity Provided", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Individually Inspected and Verified", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
  ]'::JSONB,
  testimonials = '[
    { "name": "Rajeev Kulshreshtha", "location": "Delhi", "rating": 5, "comment": "Exceptional quality and authentic appearance. The Rudraksha exceeded my expectations." },
    { "name": "Ananya Sharma", "location": "Mumbai", "rating": 5, "comment": "Beautifully energized and professionally packaged. Truly a premium spiritual product." },
    { "name": "Mohit Agrawal", "location": "Jaipur", "rating": 5, "comment": "Excellent craftsmanship and certification. Highly satisfied with the purchase." },
    { "name": "Prerna Mishra", "location": "Lucknow", "rating": 5, "comment": "The Rudraksha arrived exactly as described with proper blessings and documentation." },
    { "name": "Kunal Trivedi", "location": "Ahmedabad", "rating": 5, "comment": "Outstanding quality, fast delivery, and a very trustworthy buying experience." }
  ]'::JSONB,
  seo_title = 'Original 14 Mukhi Rudraksha (Nepali) – Energized & Certified',
  seo_description = 'Discover 14 Mukhi Rudraksha (Dev Mani), Vedic-energized for leadership, intuition, foresight, and Lord Shiva''s protection.',
  tags = ARRAY[
    '14 Mukhi Rudraksha', 'Original 14 Mukhi Rudraksha', 'Certified 14 Mukhi Rudraksha', 'Nepali 14 Mukhi Rudraksha', 'Dev Mani Rudraksha', 'Shiva Rudraksha', 'Rudraksha for Intuition', 'Rudraksha for Protection', 'Rudraksha for Leadership', 'Rudraksha for Decision Making', 'Rudraksha for Success', 'Premium Rudraksha Online', 'Buy 14 Mukhi Rudraksha Online', 'Authentic Rudraksha India', 'Genuine Nepali Rudraksha', 'Energized 14 Mukhi Rudraksha'
  ]
WHERE id = 'b0b37b77-7e85-4813-b214-ed84e81c49c0';

COMMIT;
