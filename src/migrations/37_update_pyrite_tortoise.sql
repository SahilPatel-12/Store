-- Migration: Update Pyrite Tortoise details with new rich copy, pricing, and priest details
BEGIN;

UPDATE public.website_pooja_products
SET 
  name = 'Vastu Pyrite Tortoise',
  subtitle = 'Powerful wealth attractor for prosperity and protection',
  price = 649,
  original_price = 1799,
  short_description = 'Invite prosperity, stability, and positive energy into your home or workplace with a premium Vastu Pyrite Tortoise, carefully selected to enhance wealth attraction, financial growth, and Vastu harmony.',
  description = 'Invite prosperity, stability, and positive energy into your home or workplace with a premium Vastu Pyrite Tortoise, carefully selected to enhance wealth attraction, financial growth, and Vastu harmony. The Vastu Pyrite Tortoise combines the prosperity-attracting energy of Pyrite with the stability and longevity symbolism of the tortoise. It is widely revered in Vastu and Feng Shui practices for attracting wealth, protection, and positive energy.',
  spiritual_significance = 'The Vastu Pyrite Tortoise combines the prosperity-attracting energy of Pyrite with the stability and longevity symbolism of the tortoise. It is widely revered in Vastu and Feng Shui practices for attracting wealth, protection, and positive energy.',
  benefits = ARRAY[
    'Attracts wealth, abundance, and financial opportunities',
    'Supports business growth and career success',
    'Helps balance Vastu energies within the space',
    'Encourages stability, security, and long-term prosperity',
    'Promotes positive vibrations and confidence',
    'Creates a protective energy field against negativity'
  ],
  material = 'Natural Pyrite Crystal',
  weight = '150g – 300g (Approx.)',
  dimensions = '2 – 4 Inches (Approx.)',
  origin = 'Premium Natural Pyrite',
  priest_details = '{
    "name": "Acharya Vikas Tripathi",
    "qualification": "Vastu & Energy Activation Specialist",
    "experience": "19+ Years",
    "bio": "Acharya Vikas Tripathi specializes in Vastu remedies, prosperity rituals, and sacred energy activation ceremonies."
  }'::JSONB,
  rituals_included = '[
    { "name": "Step 1: Crystal Selection", "duration": "Premium quality crystal verification", "description": "Each Pyrite Tortoise is carefully selected for quality and natural energy." },
    { "name": "Step 2: Sacred Purification", "duration": "Traditional energy cleansing process", "description": "The crystal undergoes purification through sacred Vedic methods." },
    { "name": "Step 3: Personalized Sankalp", "duration": "Prosperity-focused blessing invocation", "description": "A special Sankalp is performed according to the devotee''s intentions." },
    { "name": "Step 4: Lakshmi-Kuber Invocation", "duration": "Wealth attraction blessing ceremony", "description": "Sacred mantras are recited to invoke prosperity and abundance." },
    { "name": "Step 5: Energy Activation", "duration": "Spiritual energization process", "description": "The Pyrite Tortoise is activated through Vedic mantra vibrations." },
    { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred prosperity blessing ritual", "description": "Final blessings are offered before packaging and dispatch." }
  ]'::JSONB,
  faqs = '[
    { "question": "What is a Vastu Pyrite Tortoise?", "answer": "A Vastu Pyrite Tortoise is a decorative and spiritual crystal item believed to attract wealth, stability, and positive energy." },
    { "question": "Where should I place the Pyrite Tortoise?", "answer": "It is commonly placed in homes, offices, cash counters, work desks, or wealth corners according to Vastu guidance." },
    { "question": "Is the Pyrite Tortoise energized before delivery?", "answer": "Yes, every Pyrite Tortoise undergoes a spiritual energization process before dispatch." },
    { "question": "Can it be used for business growth?", "answer": "Many people keep it in offices and business premises to support prosperity and positive energy." },
    { "question": "Does it come with authenticity assurance?", "answer": "Yes, every Pyrite Tortoise is quality-checked before delivery." }
  ]'::JSONB,
  booking_instructions = 'Simple Booking Process
1. Enter your Full Name
2. Provide Mobile Number
3. Enter Complete Delivery Address
4. Complete Secure Payment
5. Priest performs energization ritual
6. Product dispatched with blessings and certification

Important Guidelines
✔ Place the Pyrite Tortoise in a clean and respected location.
✔ Keep it free from dust and dirt for optimal appearance.
✔ Avoid placing it near cluttered or negative environments.
✔ Position it according to Vastu recommendations for best results.
✔ Maintain positive intentions while placing the crystal.
✔ Clean periodically using a soft dry cloth.
✔ Avoid harsh chemicals during cleaning.
✔ Handle carefully to preserve its natural finish.
✔ Keep away from excessive moisture and physical damage.
✔ Respect the crystal as a sacred prosperity symbol.',
  certificates = '[
    { "name": "Premium Natural Pyrite Crystal", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Vedic Energization Completed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Prosperity Activation Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Quality Assurance Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
  ]'::JSONB,
  testimonials = '[
    { "name": "Amit Agrawal", "location": "Delhi", "rating": 5, "comment": "Excellent craftsmanship and beautiful golden shine. Perfect for my office desk." },
    { "name": "Neha Sharma", "location": "Jaipur", "rating": 5, "comment": "The Pyrite Tortoise arrived exactly as shown and was packed securely." },
    { "name": "Rajesh Verma", "location": "Lucknow", "rating": 5, "comment": "Premium quality crystal with a strong and elegant appearance." },
    { "name": "Pooja Mishra", "location": "Indore", "rating": 5, "comment": "Beautiful decorative piece and a wonderful addition to my workspace." },
    { "name": "Karan Patel", "location": "Ahmedabad", "rating": 5, "comment": "Very satisfied with the quality, finish, and overall presentation." }
  ]'::JSONB,
  seo_title = 'Vastu Pyrite Tortoise – Wealth Attraction & Prosperity Crystal',
  seo_description = 'Buy premium Vastu Pyrite Tortoise online. Handcrafted natural pyrite crystal kachua for wealth attraction, financial growth, and Vastu protection.',
  tags = ARRAY[
    'Vastu Pyrite Tortoise', 'Pyrite Tortoise', 'Wealth Attraction Crystal', 'Prosperity Crystal', 'Pyrite Crystal Tortoise', 'Feng Shui Tortoise', 'Vastu Tortoise for Wealth', 'Pyrite for Money Attraction', 'Crystal Tortoise for Office', 'Wealth Crystal for Home', 'Buy Pyrite Tortoise Online', 'Natural Pyrite Crystal', 'Vastu Products India', 'Prosperity Tortoise', 'Financial Growth Crystal', 'Pyrite Wealth Remedy'
  ]
WHERE id = '7646538c-b65c-4e4f-bccb-cad7624eedb0';

COMMIT;
