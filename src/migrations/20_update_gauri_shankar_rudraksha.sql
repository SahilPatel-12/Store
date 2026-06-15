-- Migration: Update Gauri Shankar Rudraksha details with new rich copy, pricing, and priest details
BEGIN;

UPDATE public.website_pooja_products
SET 
  name = 'Original Gauri Shankar Rudraksha (Nepali) – Energized & Certified for Love, Harmony and Divine Union',
  subtitle = 'Sacred Shiva-Parvati blessings for love and harmony',
  price = 6501,
  original_price = 13499,
  short_description = 'Experience the divine blessings of an authentic Vedic-energized Gauri Shankar Rudraksha, traditionally revered for strengthening relationships, attracting harmony, enhancing emotional balance, and fostering spiritual growth through the union of Lord Shiva and Goddess Parvati.',
  description = 'Experience the divine blessings of an authentic Vedic-energized Gauri Shankar Rudraksha, traditionally revered for strengthening relationships, attracting harmony, enhancing emotional balance, and fostering spiritual growth through the union of Lord Shiva and Goddess Parvati. The Gauri Shankar Rudraksha is formed by two naturally joined Rudraksha beads and symbolizes the eternal union of Lord Shiva and Goddess Parvati. It represents love, harmony, unity, emotional balance, and spiritual awakening.',
  spiritual_significance = 'The Gauri Shankar Rudraksha is formed by two naturally joined Rudraksha beads and symbolizes the eternal union of Lord Shiva and Goddess Parvati. It represents love, harmony, unity, emotional balance, and spiritual awakening.',
  benefits = ARRAY[
    'Strengthens love, trust, and harmony in relationships',
    'Promotes marital happiness and emotional bonding',
    'Helps resolve misunderstandings and relationship conflicts',
    'Encourages peace, balance, and mutual understanding',
    'Supports spiritual growth and inner harmony',
    'Attracts positive energy and divine blessings into life'
  ],
  material = 'Natural Nepali Gauri Shankar Rudraksha',
  weight = '6g – 20g (Approx.)',
  dimensions = '22mm – 42mm (Approx.)',
  origin = 'Nepal',
  priest_details = '{
    "name": "Acharya Parameshwar Tiwari",
    "experience": "24+ Years",
    "bio": "Acharya Parameshwar Tiwari specializes in Gauri-Shankar worship rituals, Vedic marriage harmony ceremonies, and authentic Rudraksha energization processes.",
    "qualification": "Shiva-Parvati Sadhana & Rudraksha Energization Specialist"
  }'::JSONB,
  rituals_included = '[
    { "name": "Step 1: Rudraksha Selection", "duration": "Natural twin-bead authenticity verification", "description": "Each Gauri Shankar Rudraksha is carefully inspected for natural formation and originality." },
    { "name": "Step 2: Sacred Purification", "duration": "Traditional Panchamrit cleansing ceremony", "description": "The Gauri Shankar Rudraksha is purified through authentic Vedic purification rituals." },
    { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-focused blessing invocation", "description": "A special Sankalp is performed according to the devotee''s relationship and spiritual intentions." },
    { "name": "Step 4: Shiva-Parvati Invocation", "duration": "Divine union blessing ceremony", "description": "Sacred mantras dedicated to Lord Shiva and Goddess Parvati are chanted." },
    { "name": "Step 5: Mantra Energization", "duration": "Activation through sacred Vedic chants", "description": "The Rudraksha is spiritually energized through dedicated mantra recitations." },
    { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred sanctification before dispatch", "description": "Final blessings are offered for harmony, love, and prosperity." }
  ]'::JSONB,
  faqs = '[
    { "question": "What is Gauri Shankar Rudraksha?", "answer": "Gauri Shankar Rudraksha consists of two naturally joined Rudraksha beads symbolizing Lord Shiva and Goddess Parvati." },
    { "question": "Why is Gauri Shankar Rudraksha considered special?", "answer": "It is traditionally revered for promoting love, harmony, unity, emotional balance, and spiritual growth." },
    { "question": "Who should wear Gauri Shankar Rudraksha?", "answer": "Married couples, individuals seeking harmonious relationships, spiritual seekers, and devotees of Shiva-Parvati may wear it." },
    { "question": "Is the Rudraksha energized before delivery?", "answer": "Yes, every Gauri Shankar Rudraksha undergoes authentic Vedic energization rituals before dispatch." },
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
✔ Chant "Om Gauri Shankaraya Namah" or "Om Namah Shivaya" regularly.
✔ Wear with faith, positivity, and devotion for the best spiritual experience.
✔ Clean occasionally using a soft cloth to maintain its natural condition.
✔ Follow the provided energization and wearing instructions carefully.
✔ Handle the Rudraksha gently to preserve its natural structure and energy.
✔ Maintain purity and positive intentions while wearing the sacred bead.',
  certificates = '[
    { "name": "Original Nepali Gauri Shankar Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Naturally Joined Twin-Bead Formation", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Shiva-Parvati Energization Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Sacred Harmony & Relationship Blessings Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Certificate of Authenticity Provided", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
  ]'::JSONB,
  testimonials = '[
    { "name": "Pankaj Sharma", "location": "Delhi", "rating": 5, "comment": "Beautiful natural twin Rudraksha with excellent quality and authenticity." },
    { "name": "Sneha Verma", "location": "Jaipur", "rating": 5, "comment": "The bead arrived exactly as shown and was beautifully energized." },
    { "name": "Rajesh Mishra", "location": "Lucknow", "rating": 5, "comment": "Premium packaging, proper certification, and genuine spiritual value." },
    { "name": "Priya Agrawal", "location": "Indore", "rating": 5, "comment": "Excellent craftsmanship and a very smooth ordering experience." },
    { "name": "Vivek Kulkarni", "location": "Pune", "rating": 5, "comment": "Authentic Gauri Shankar Rudraksha with powerful symbolism and premium quality." }
  ]'::JSONB,
  seo_title = 'Original Gauri Shankar Rudraksha (Nepali) – Energized & Certified',
  seo_description = 'Discover Gauri Shankar Rudraksha, Vedic-energized for relationship harmony, love, trust, and divine union blessings of Lord Shiva and Goddess Parvati.',
  tags = ARRAY[
    'Gauri Shankar Rudraksha', 'Original Gauri Shankar Rudraksha', 'Certified Gauri Shankar Rudraksha', 'Nepali Gauri Shankar Rudraksha', 'Shiva Parvati Rudraksha', 'Twin Rudraksha', 'Rudraksha for Love', 'Rudraksha for Marriage', 'Rudraksha for Relationship Harmony', 'Rudraksha for Emotional Balance', 'Energized Gauri Shankar Rudraksha', 'Buy Gauri Shankar Rudraksha Online', 'Authentic Rudraksha India', 'Genuine Nepali Rudraksha', 'Shiva Shakti Rudraksha', 'Relationship Blessing Rudraksha'
  ]
WHERE id = '30c03d59-902d-45eb-82e3-1dc0cad298b8';

COMMIT;
