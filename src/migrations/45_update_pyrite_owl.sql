-- Migration: Update Pyrite Owl details with new rich copy, pricing, and priest details
BEGIN;

UPDATE public.website_pooja_products
SET 
  name = 'Pyrite Owl',
  subtitle = 'Wise prosperity energy for wealth and success',
  price = 999,
  original_price = 4499,
  short_description = 'Bring home the powerful combination of wisdom and prosperity with an energized Pyrite Owl, carefully crafted from natural Pyrite crystal and revered for attracting abundance, financial growth, protection, and positive energy.',
  description = 'Bring home the powerful combination of wisdom and prosperity with an energized Pyrite Owl, carefully crafted from natural Pyrite crystal and revered for attracting abundance, financial growth, protection, and positive energy. The Owl is traditionally regarded as a symbol of wisdom, awareness, and prosperity, while Pyrite is known as the "Stone of Wealth." Together, the Pyrite Owl is believed to attract abundance, clarity, confidence, and positive opportunities.',
  spiritual_significance = 'The Owl is traditionally regarded as a symbol of wisdom, awareness, and prosperity, while Pyrite is known as the "Stone of Wealth." Together, the Pyrite Owl is believed to attract abundance, clarity, confidence, and positive opportunities.',
  benefits = ARRAY[
    'Attracts prosperity, abundance, and financial opportunities',
    'Symbolizes wisdom, intelligence, and better decision-making',
    'Supports business growth and professional success',
    'Creates a positive and protective energy field',
    'Encourages confidence, focus, and clarity of thought',
    'Enhances Vastu and Feng Shui energy balance'
  ],
  material = 'Natural Pyrite Crystal',
  weight = '100g – 350g (Approx.)',
  dimensions = '2 – 5 Inches (Approx.)',
  origin = 'Natural Pyrite Stone',
  priest_details = '{
    "name": "Acharya Kuberanand Mishra",
    "qualification": "Prosperity Crystal & Energy Activation Specialist",
    "experience": "18+ Years",
    "bio": "Acharya Kuberanand Mishra specializes in crystal energization, prosperity rituals, and sacred wealth-attraction ceremonies."
  }'::JSONB,
  rituals_included = '[
    { "name": "Step 1: Crystal Selection", "duration": "Premium quality crystal verification", "description": "Each Pyrite Owl is carefully selected for quality and natural energy." },
    { "name": "Step 2: Sacred Purification", "duration": "Traditional spiritual cleansing process", "description": "The crystal undergoes purification through sacred Vedic methods." },
    { "name": "Step 3: Personalized Sankalp", "duration": "Prosperity-focused blessing invocation", "description": "A special Sankalp is performed according to the devotee''s intentions." },
    { "name": "Step 4: Lakshmi-Kuber Invocation", "duration": "Divine abundance blessing ceremony", "description": "Sacred prosperity mantras are recited to invoke wealth and success." },
    { "name": "Step 5: Crystal Energization", "duration": "Activation through sacred vibrations", "description": "The Pyrite Owl is spiritually energized through mantra chanting." },
    { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred prosperity blessing ritual", "description": "Final blessings are offered before packaging and dispatch." }
  ]'::JSONB,
  faqs = '[
    { "question": "What is a Pyrite Owl?", "answer": "A Pyrite Owl is a decorative crystal carving made from natural Pyrite, symbolizing wisdom, prosperity, and positive energy." },
    { "question": "Where should I place the Pyrite Owl?", "answer": "It is commonly placed on office desks, study tables, business counters, and wealth corners." },
    { "question": "Is the Pyrite natural?", "answer": "Yes, the Pyrite used in the owl carving is natural and carefully selected." },
    { "question": "Is the Pyrite Owl energized before delivery?", "answer": "Yes, every Pyrite Owl undergoes a spiritual energization process before dispatch." },
    { "question": "Is it suitable as a gift?", "answer": "Yes, it makes an excellent gift for students, professionals, entrepreneurs, and crystal enthusiasts." }
  ]'::JSONB,
  booking_instructions = 'Simple Booking Process
1. Enter your Full Name
2. Provide Mobile Number
3. Enter Complete Delivery Address
4. Complete Secure Payment
5. Priest performs energization ritual
6. Product dispatched with blessings and certification

Important Guidelines
✔ Place the Pyrite Owl in a clean and respected location.
✔ Ideal for office desks, study tables, and workspaces.
✔ Keep the crystal free from dust and clutter.
✔ Avoid dropping or mishandling the crystal carving.
✔ Maintain positive intentions while keeping the crystal.
✔ Clean gently using a soft dry cloth.
✔ Avoid harsh chemicals and excessive moisture.
✔ Follow the provided placement recommendations.
✔ Respect it as a sacred prosperity and wisdom symbol.
✔ Store carefully when not in use.',
  certificates = '[
    { "name": "Natural Pyrite Crystal", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Handcrafted Owl Carving", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Spiritual Energization Completed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Lakshmi-Kuber Blessing Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Quality Assurance Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
  ]'::JSONB,
  testimonials = '[
    { "name": "Ankit Verma", "location": "Delhi", "rating": 5, "comment": "The carving quality is excellent and the Pyrite has a beautiful natural shine." },
    { "name": "Neha Agarwal", "location": "Jaipur", "rating": 5, "comment": "Perfect addition to my office desk. Premium quality and packaging." },
    { "name": "Rohan Patel", "location": "Ahmedabad", "rating": 5, "comment": "The detailing of the owl is impressive and the crystal feels genuine." },
    { "name": "Priya Sharma", "location": "Lucknow", "rating": 5, "comment": "Beautiful craftsmanship and a very elegant prosperity symbol." },
    { "name": "Vivek Mishra", "location": "Indore", "rating": 5, "comment": "Excellent product quality with secure packaging and timely delivery." }
  ]'::JSONB,
  seo_title = 'Pyrite Owl – Handcrafted Crystal Wisdom & Wealth Carving',
  seo_description = 'Shop authentic natural Pyrite Owl showpiece online. Spiritual crystal carving energized for wealth attraction, business wisdom, and protection.',
  tags = ARRAY[
    'Pyrite Owl', 'Natural Pyrite Owl', 'Pyrite Crystal Owl', 'Wealth Attraction Owl', 'Prosperity Crystal Owl', 'Wisdom Crystal Owl', 'Owl for Wealth and Success', 'Pyrite Wealth Crystal', 'Feng Shui Owl', 'Vastu Crystal Owl', 'Buy Pyrite Owl Online', 'Natural Pyrite Carving', 'Prosperity Crystal Decor', 'Business Success Crystal', 'Owl Symbol of Wisdom', 'Pyrite Decorative Crystal'
  ]
WHERE id = '5fbc27f1-fd14-41af-b350-c348151b0c75';

COMMIT;
