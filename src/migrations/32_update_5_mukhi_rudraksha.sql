-- Migration: Update 5 Mukhi Rudraksha details with new rich copy, pricing, and priest details
BEGIN;

UPDATE public.website_pooja_products
SET 
  name = 'Original 5 Mukhi Rudraksha (Nepali) – Energized & Certified for Peace, Protection and Spiritual Growth',
  subtitle = 'Sacred protection energy for peace and well-being',
  price = 999,
  original_price = 1999,
  short_description = 'Experience the divine blessings of an authentic Vedic-energized 5 Mukhi Rudraksha, revered for promoting peace, protection, spiritual growth, emotional balance, and positive energy in everyday life.',
  description = 'Experience the divine blessings of an authentic Vedic-energized 5 Mukhi Rudraksha, revered for promoting peace, protection, spiritual growth, emotional balance, and positive energy in everyday life. The 5 Mukhi Rudraksha is associated with Lord Kalagni Rudra, a powerful form of Lord Shiva. It symbolizes protection, purification, spiritual awakening, and inner peace, making it one of the most widely worn Rudraksha beads.',
  spiritual_significance = 'The 5 Mukhi Rudraksha is associated with Lord Kalagni Rudra, a powerful form of Lord Shiva. It symbolizes protection, purification, spiritual awakening, and inner peace, making it one of the most widely worn Rudraksha beads.',
  benefits = ARRAY[
    'Promotes mental peace and emotional stability',
    'Creates a protective spiritual shield against negativity',
    'Enhances meditation, focus, and spiritual practices',
    'Supports overall well-being and positive energy',
    'Helps reduce stress, anxiety, and unwanted thoughts',
    'Encourages self-discipline, wisdom, and inner strength'
  ],
  material = 'Natural Nepali Rudraksha',
  weight = '4g – 14g (Approx.)',
  dimensions = '18mm – 35mm (Approx.)',
  origin = 'Nepal',
  priest_details = '{
    "name": "Acharya Mahesh Chaturvedi",
    "experience": "21+ Years",
    "bio": "Acharya Mahesh Chaturvedi has performed thousands of Rudra Abhishek and Rudraksha energization ceremonies following authentic Vedic traditions.",
    "qualification": "Rudra Mantra Siddhi & Spiritual Ritual Expert"
  }'::JSONB,
  rituals_included = '[
    { "name": "Step 1: Rudraksha Selection", "duration": "Careful authenticity verification process", "description": "Every Rudraksha is inspected and selected for purity, quality, and natural formation." },
    { "name": "Step 2: Sacred Purification", "duration": "Traditional Panchamrit cleansing ceremony", "description": "The bead is purified through holy Vedic purification rituals." },
    { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-specific blessing invocation", "description": "A sacred Sankalp is performed in the devotee''s name." },
    { "name": "Step 4: Rudra Invocation Ritual", "duration": "Divine protection blessing ceremony", "description": "Special mantras dedicated to Lord Kalagni Rudra are chanted." },
    { "name": "Step 5: Mantra Energization", "duration": "Spiritual activation through Vedic chants", "description": "The Rudraksha is energized with powerful Shiva mantras." },
    { "name": "Step 6: Final Blessing Ceremony", "duration": "Sanctification before sacred dispatch", "description": "Final blessings are offered before packaging and delivery." }
  ]'::JSONB,
  faqs = '[
    { "question": "What is the significance of 5 Mukhi Rudraksha?", "answer": "It represents Lord Kalagni Rudra and is associated with protection, peace, spiritual growth, and positive energy." },
    { "question": "Who can wear 5 Mukhi Rudraksha?", "answer": "Men, women, students, professionals, and spiritual seekers can wear it." },
    { "question": "Is 5 Mukhi Rudraksha suitable for daily wear?", "answer": "Yes, it is one of the most commonly worn Rudraksha beads and is ideal for daily use." },
    { "question": "Does it require energization before wearing?", "answer": "Yes, Vedic energization is performed to enhance its spiritual significance." },
    { "question": "Will I receive an authenticity certificate?", "answer": "Yes, every Rudraksha includes authenticity assurance and certification." }
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
✔ Chant "Om Hreem Namah" or "Om Namah Shivaya" regularly.
✔ Wear with faith, positivity, and devotion for the best spiritual experience.
✔ Clean occasionally using a soft cloth to maintain its natural condition.
✔ Follow the provided energization and wearing instructions carefully.
✔ Handle the Rudraksha gently to preserve its natural structure and energy.
✔ Maintain purity and positive intentions while wearing the sacred bead.',
  certificates = '[
    { "name": "Natural Nepali 5 Mukhi Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Vedic Energization Completed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Rudra Mantra Blessings Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Certificate of Authenticity Provided", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
  ]'::JSONB,
  testimonials = '[
    { "name": "Rahul Sharma", "location": "Delhi", "rating": 5, "comment": "Excellent quality Rudraksha with genuine appearance and beautiful packaging." },
    { "name": "Meera Joshi", "location": "Mumbai", "rating": 5, "comment": "I wear it daily during meditation and am very satisfied with the product quality." },
    { "name": "Aditya Tiwari", "location": "Lucknow", "rating": 5, "comment": "Authentic Rudraksha with proper certification and energization details." },
    { "name": "Priya Verma", "location": "Jaipur", "rating": 5, "comment": "The bead is natural and well-finished. Delivery was fast and secure." },
    { "name": "Saurabh Mishra", "location": "Varanasi", "rating": 5, "comment": "Wonderful experience from ordering to delivery. Highly recommended for spiritual seekers." }
  ]'::JSONB,
  seo_title = 'Original 5 Mukhi Rudraksha (Nepali) – Energized & Certified',
  seo_description = 'Discover 5 Mukhi Rudraksha, Vedic-energized for peace, protection, and spiritual growth under Lord Kalagni Rudra''s blessings.',
  tags = ARRAY[
    '5 Mukhi Rudraksha', 'Original 5 Mukhi Rudraksha', 'Certified 5 Mukhi Rudraksha', 'Nepali 5 Mukhi Rudraksha', 'Kalagni Rudra Rudraksha', 'Rudraksha for Peace', 'Rudraksha for Protection', 'Rudraksha for Spiritual Growth', 'Rudraksha for Meditation', 'Energized Rudraksha Online', 'Authentic Rudraksha India', 'Buy 5 Mukhi Rudraksha Online', 'Genuine Nepali Rudraksha', 'Shiva Rudraksha Bead', 'Spiritual Protection Rudraksha'
  ]
WHERE id = 'af3a8114-20ad-481f-95db-cafef72eec73';

COMMIT;
