-- Migration: Update 7 Mukhi Rudraksha details with new rich copy, pricing, and priest details
BEGIN;

UPDATE public.website_pooja_products
SET 
  name = 'Original 7 Mukhi Rudraksha (Nepali) – Energized & Certified for Wealth, Prosperity and Financial Growth',
  subtitle = 'Sacred prosperity energy for abundance and success',
  price = 999,
  original_price = 2499,
  short_description = 'Invite the divine blessings of prosperity and abundance with an authentic Vedic-energized 7 Mukhi Rudraksha, traditionally revered for attracting financial growth, stability, success, and positive opportunities in life.',
  description = 'Invite the divine blessings of prosperity and abundance with an authentic Vedic-energized 7 Mukhi Rudraksha, traditionally revered for attracting financial growth, stability, success, and positive opportunities in life. The 7 Mukhi Rudraksha is associated with Goddess Mahalakshmi, the deity of wealth and prosperity. It symbolizes abundance, financial stability, success, and the removal of obstacles that hinder growth and prosperity.',
  spiritual_significance = 'The 7 Mukhi Rudraksha is associated with Goddess Mahalakshmi, the deity of wealth and prosperity. It symbolizes abundance, financial stability, success, and the removal of obstacles that hinder growth and prosperity.',
  benefits = ARRAY[
    'Attracts wealth, prosperity, and financial opportunities',
    'Supports business growth and career advancement',
    'Helps overcome financial challenges and obstacles',
    'Encourages confidence in decision-making and investments',
    'Promotes stability, success, and positive energy',
    'Enhances spiritual balance while pursuing material goals'
  ],
  material = 'Natural Nepali Rudraksha',
  weight = '5g – 14g (Approx.)',
  dimensions = '20mm – 35mm (Approx.)',
  origin = 'Nepal',
  priest_details = '{
    "name": "Acharya Gaurang Bhatt",
    "experience": "20+ Years",
    "bio": "Acharya Gaurang Bhatt has extensive expertise in Mahalakshmi worship, prosperity rituals, and authentic Vedic Rudraksha energization ceremonies.",
    "qualification": "Mahalakshmi Sadhana & Rudraksha Energization Specialist"
  }'::JSONB,
  rituals_included = '[
    { "name": "Step 1: Rudraksha Selection", "duration": "Natural authenticity verification process", "description": "Each Rudraksha is carefully selected and inspected for purity and quality." },
    { "name": "Step 2: Sacred Purification", "duration": "Traditional Panchamrit cleansing ritual", "description": "The bead is purified using holy ingredients and Vedic procedures." },
    { "name": "Step 3: Personalized Sankalp", "duration": "Devotee-focused prosperity invocation", "description": "A special Sankalp is performed using the devotee''s details and intentions." },
    { "name": "Step 4: Mahalakshmi Invocation", "duration": "Divine abundance blessing ceremony", "description": "Sacred Lakshmi mantras are chanted to invoke prosperity blessings." },
    { "name": "Step 5: Mantra Energization", "duration": "Activation through Vedic vibrations", "description": "The Rudraksha is spiritually energized through mantra chanting." },
    { "name": "Step 6: Final Blessing Ceremony", "duration": "Sacred protection before dispatch", "description": "Final blessings are offered for prosperity and positive energy." }
  ]'::JSONB,
  faqs = '[
    { "question": "What is the significance of 7 Mukhi Rudraksha?", "answer": "It is associated with Goddess Mahalakshmi and is traditionally linked with wealth, prosperity, financial stability, and abundance." },
    { "question": "Who should wear 7 Mukhi Rudraksha?", "answer": "Business owners, professionals, entrepreneurs, and individuals seeking financial growth may wear it." },
    { "question": "Can it be worn daily?", "answer": "Yes, it is suitable for regular wear and spiritual practices." },
    { "question": "Is the Rudraksha energized before delivery?", "answer": "Yes, every Rudraksha undergoes authentic Vedic energization before dispatch." },
    { "question": "Will I receive authenticity certification?", "answer": "Yes, every Rudraksha comes with authenticity assurance and certification." }
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
✔ Chant "Om Hum Namah" or "Om Shreem Mahalakshmyai Namah" regularly.
✔ Wear with faith, positivity, and devotion for the best spiritual experience.
✔ Clean occasionally using a soft cloth to maintain its natural condition.
✔ Follow the provided energization and wearing instructions carefully.
✔ Handle the Rudraksha gently to preserve its natural structure and energy.
✔ Maintain purity and positive intentions while wearing the sacred bead.',
  certificates = '[
    { "name": "Natural Nepali 7 Mukhi Rudraksha", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Expert Quality Inspection", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Authenticity Verification Process", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Mahalakshmi Energization Ritual Performed", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Sacred Prosperity Blessings Included", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Secure Protective Packaging", "issuer": "Kashi Vedic Sansthan", "url": "📜" },
    { "name": "Certificate of Authenticity Provided", "issuer": "Kashi Vedic Sansthan", "url": "📜" }
  ]'::JSONB,
  testimonials = '[
    { "name": "Deepak Agarwal", "location": "Jaipur", "rating": 5, "comment": "Excellent quality Rudraksha with premium packaging and proper certification." },
    { "name": "Ruchi Gupta", "location": "Delhi", "rating": 5, "comment": "Beautiful natural bead and a smooth ordering experience. Highly satisfied." },
    { "name": "Sanjay Patel", "location": "Ahmedabad", "rating": 5, "comment": "The Rudraksha arrived energized and exactly as described. Great quality." },
    { "name": "Neha Bansal", "location": "Chandigarh", "rating": 5, "comment": "Authentic product, secure packaging, and wonderful customer support." },
    { "name": "Mohit Sharma", "location": "Lucknow", "rating": 5, "comment": "One of the best Rudraksha purchases I have made. Highly recommended." }
  ]'::JSONB,
  seo_title = 'Original 7 Mukhi Rudraksha (Nepali) – Energized & Certified',
  seo_description = 'Discover 7 Mukhi Rudraksha, Vedic-energized for wealth, prosperity, and financial stability under Goddess Mahalakshmi''s blessings.',
  tags = ARRAY[
    '7 Mukhi Rudraksha', 'Original 7 Mukhi Rudraksha', 'Certified 7 Mukhi Rudraksha', 'Nepali 7 Mukhi Rudraksha', 'Mahalakshmi Rudraksha', 'Rudraksha for Wealth', 'Rudraksha for Money Attraction', 'Rudraksha for Financial Growth', 'Rudraksha for Prosperity', 'Energized Rudraksha Online', 'Buy 7 Mukhi Rudraksha Online', 'Authentic Rudraksha India', 'Genuine Nepali Rudraksha', 'Rudraksha for Business Success', 'Prosperity Rudraksha'
  ]
WHERE id = '9bab7781-f55f-4847-8361-692d00daf1ed';

COMMIT;
