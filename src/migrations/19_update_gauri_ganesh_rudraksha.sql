-- Migration: Update Gauri Ganesh Rudraksha details with new rich copy, pricing, and priest details
BEGIN;

UPDATE public.website_pooja_products
SET 
  name = 'Original Gauri Ganesh Rudraksha (Nepali) – Energized & Certified for Family Harmony, Prosperity and Divine Blessings',
  subtitle = 'Sacred Shiva-Parvati-Ganesh blessings for family happiness',
  price = 3901,
  original_price = 8999,
  short_description = 'Experience the divine blessings of an authentic Vedic-energized Gauri Ganesh Rudraksha, traditionally revered for family harmony, prosperity, relationship strengthening, obstacle removal, and attracting peace and happiness into life.',
  description = 'Experience the divine blessings of an authentic Vedic-energized Gauri Ganesh Rudraksha, traditionally revered for family harmony, prosperity, relationship strengthening, obstacle removal, and attracting peace and happiness into life. The Gauri Ganesh Rudraksha combines the sacred symbolism of Lord Shiva, Goddess Parvati, and Lord Ganesha. It represents family unity, divine blessings, prosperity, happiness, obstacle removal, and spiritual harmony within the household.',
  spiritual_significance = 'The Gauri Ganesh Rudraksha combines the sacred symbolism of Lord Shiva, Goddess Parvati, and Lord Ganesha. It represents family unity, divine blessings, prosperity, happiness, obstacle removal, and spiritual harmony within the household.',
  benefits = ARRAY[
    'Promotes harmony, love, and unity within the family',
    'Invokes Lord Ganesha''s blessings for obstacle removal',
    'Strengthens relationships and emotional bonding',
    'Attracts prosperity, happiness, and positive energy',
    'Encourages peace, understanding, and mutual respect',
    'Supports spiritual growth and divine protection'
  ],
  material = 'Natural Nepali Gauri Ganesh Rudraksha',
  weight = '7g – 22g (Approx.)',
  dimensions = '24mm – 45mm (Approx.)',
  origin = 'Nepal',
  priest_details = '{
    "name": "Acharya Bhavesh Shukla",
    "experience": "26+ Years",
    "bio": "Acharya Bhavesh Shukla specializes in family harmony rituals, Ganesh Sadhana, and authentic Vedic Rudraksha energization ceremonies.",
    "qualification": "Ganapati & Shiva-Parvati Ritual Specialist"
  }'::JSONB,
  rituals_included = '[
    { "name": "Step 1: Rudraksha Selection", "duration": "Natural formation authenticity verification", "description": "Each Gauri Ganesh Rudraksha is carefully examined for genuine natural formation." },
    { "name": "Step 2: Sacred Purification", "duration": "Traditional Panchamrit cleansing ritual", "description": "The Gauri Ganesh Rudraksha undergoes purification using holy Vedic procedures." },
    { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-focused family blessing invocation", "description": "A special Sankalp is performed according to the devotee''s wishes and family intentions." },
    { "name": "Step 4: Shiva-Parvati-Ganesh Invocation", "duration": "Divine family blessing ceremony", "description": "Sacred mantras are chanted to invoke the blessings of the divine family." },
    { "name": "Step 5: Mantra Energization", "duration": "Activation through sacred Vedic chants", "description": "The Rudraksha is spiritually energized through dedicated mantra recitations." },
    { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred sanctification before dispatch", "description": "Final blessings are offered for prosperity, harmony, and protection." }
  ]'::JSONB,
  faqs = '[
    { "question": "What is Gauri Ganesh Rudraksha?", "answer": "Gauri Ganesh Rudraksha is a rare Rudraksha featuring the natural union symbolism of Gauri Shankar along with a Ganesh-like trunk formation." },
    { "question": "Why is Gauri Ganesh Rudraksha considered special?", "answer": "It symbolizes the divine family of Shiva, Parvati, and Ganesha, representing harmony, prosperity, unity, and obstacle removal." },
    { "question": "Who should wear Gauri Ganesh Rudraksha?", "answer": "Families, married couples, business owners, spiritual seekers, and devotees seeking harmony and prosperity may wear it." },
    { "question": "Is the Rudraksha energized before delivery?", "answer": "Yes, every Gauri Ganesh Rudraksha undergoes authentic Vedic energization rituals before dispatch." },
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
✔ Chant "Om Gan Ganapataye Namah" and "Om Namah Shivaya" regularly.
✔ Wear with faith, positivity, and devotion for the best spiritual experience.
✔ Clean occasionally using a soft cloth to maintain its natural condition.
✔ Follow the provided energization and wearing instructions carefully.
✔ Handle the Rudraksha gently to preserve its natural structure and energy.
✔ Maintain purity and positive intentions while wearing the sacred bead.',
  certificates = '[
    { "name": "Original Nepali Gauri Ganesh Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Naturally Formed Sacred Structure", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Shiva-Parvati-Ganesh Energization Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Sacred Family Harmony Blessings Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Certificate of Authenticity Provided", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
  ]'::JSONB,
  testimonials = '[
    { "name": "Manish Trivedi", "location": "Varanasi", "rating": 5, "comment": "Beautiful natural formation and excellent spiritual significance. Highly satisfied." },
    { "name": "Neha Sharma", "location": "Delhi", "rating": 5, "comment": "The Rudraksha arrived with proper certification and premium packaging." },
    { "name": "Piyush Agarwal", "location": "Jaipur", "rating": 5, "comment": "Authentic product with excellent craftsmanship and energization." },
    { "name": "Ritu Mishra", "location": "Lucknow", "rating": 5, "comment": "Perfect for our family altar. Very happy with the quality and presentation." },
    { "name": "Saurabh Verma", "location": "Indore", "rating": 5, "comment": "A rare and powerful Rudraksha. The service and packaging were outstanding." }
  ]'::JSONB,
  seo_title = 'Original Gauri Ganesh Rudraksha (Nepali) – Energized & Certified',
  seo_description = 'Discover Gauri Ganesh Rudraksha, Vedic-energized for family harmony, relationship bonding, and Lord Ganesha''s obstacle-removal blessings.',
  tags = ARRAY[
    'Gauri Ganesh Rudraksha', 'Original Gauri Ganesh Rudraksha', 'Certified Gauri Ganesh Rudraksha', 'Nepali Gauri Ganesh Rudraksha', 'Shiva Parvati Ganesh Rudraksha', 'Family Harmony Rudraksha', 'Rudraksha for Prosperity', 'Rudraksha for Relationship Harmony', 'Rudraksha for Obstacle Removal', 'Ganesh Rudraksha', 'Gauri Shankar Ganesh Rudraksha', 'Energized Rudraksha Online', 'Buy Gauri Ganesh Rudraksha Online', 'Authentic Rudraksha India', 'Genuine Nepali Rudraksha', 'Family Blessing Rudraksha'
  ]
WHERE id = 'a6bd58fa-b20b-4a11-b63f-fe7b71dc156b';

COMMIT;
