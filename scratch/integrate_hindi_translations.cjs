const fs = require('fs');
const path = require('path');

const HINDI_JSON_PATH = path.join(__dirname, 'shop_product_hindi_translations.json');
const ENGLISH_JSON_PATH = path.join(__dirname, '../shop_product_english_source_for_hindi.json');

const BLACK_HORSESHOE_HINDI = {
  "id": "1fe03faa-3042-492d-b977-d536548cf0e2",
  "name": "काले घोड़े की नाल",
  "sanskrit_name": "(बुरी नज़र एवं शनि दोष से सुरक्षा)",
  "short_name": "काले घोड़े की नाल",
  "category": "कवच",
  "tags": [
    "महाशिवरात्रि",
    "प्रदोषम्"
  ],
  "subtitle": "सौभाग्य और समृद्धि के लिए पारंपरिक सुरक्षा प्रतीक",
  "short_description": "अभिमंत्रित काले घोड़े की नाल के रूप में सुरक्षा, समृद्धि और सौभाग्य के इस शक्तिशाली पारंपरिक प्रतीक को अपने घर लाएँ। इसे सकारात्मक ऊर्जा बढ़ाने, नकारात्मकता से सुरक्षा और सफलता को आकर्षित करने की भावना के साथ विशेष रूप से तैयार किया जाता है।",
  "description": "अभिमंत्रित काले घोड़े की नाल के रूप में सुरक्षा, समृद्धि और सौभाग्य के इस शक्तिशाली पारंपरिक प्रतीक को अपने घर लाएँ। इसे सकारात्मक ऊर्जा बढ़ाने, नकारात्मकता से सुरक्षा और सफलता को आकर्षित करने की भावना के साथ विशेष रूप से तैयार किया जाता है। काले घोड़े की नाल को पारंपरिक रूप से सुरक्षा, समृद्धि और सकारात्मक ऊर्जा का प्रतीक माना जाता है। वास्तु एवं आध्यात्मिक परंपराओं में इसका उपयोग सौभाग्य को आकर्षित करने और घर या कार्यस्थल में सामंजस्यपूर्ण वातावरण बनाने के लिए किया जाता है।",
  "spiritual_significance": "काले घोड़े की नाल को पारंपरिक रूप से सुरक्षा, समृद्धि और सकारात्मक ऊर्जा का प्रतीक माना जाता है। वास्तु एवं आध्यात्मिक परंपराओं में इसका उपयोग सौभाग्य को आकर्षित करने और सामंजस्यपूर्ण वातावरण बनाने के लिए किया जाता है।",
  "benefits": [
    "सकारात्मक ऊर्जा और सौभाग्य को आकर्षित करने में सहायक",
    "नकारात्मकता से सुरक्षा के लिए एक सकारात्मक कवच की भावना प्रदान करने में सहायक",
    "समृद्धि, सफलता और स्थिरता की सकारात्मक भावना को बढ़ावा देने में सहायक",
    "घर और कार्यस्थल में वास्तु संतुलन को सहयोग प्रदान करने में सहायक",
    "आत्मविश्वास, सामंजस्य और कल्याण की भावना को प्रोत्साहित करने में सहायक",
    "पारंपरिक रूप से सौभाग्य और सुरक्षा का प्रतीक माना जाता है"
  ],
  "rituals_included": [
    {
      "name": "चरण 1: घोड़े की नाल का चयन",
      "duration": "प्रामाणिकता और गुणवत्ता की जाँच",
      "description": "प्रत्येक घोड़े की नाल का सावधानीपूर्वक निरीक्षण कर अनुष्ठानिक उपयोग के लिए चयन किया जाता है।"
    },
    {
      "name": "चरण 2: पवित्र शुद्धिकरण",
      "duration": "पारंपरिक आध्यात्मिक शुद्धिकरण प्रक्रिया",
      "description": "घोड़े की नाल का पवित्र वैदिक विधियों द्वारा शुद्धिकरण किया जाता है।"
    },
    {
      "name": "चरण 3: व्यक्तिगत संकल्प",
      "duration": "सुरक्षा-केंद्रित आशीर्वाद संकल्प",
      "description": "भक्त की मनोकामना और भावना के अनुसार विशेष संकल्प किया जाता है।"
    },
    {
      "name": "चरण 4: दिव्य सुरक्षा अनुष्ठान",
      "duration": "पवित्र सकारात्मक ऊर्जा आशीर्वाद अनुष्ठान",
      "description": "सकारात्मक स्पंदनों और सुरक्षा की भावना के आह्वान हेतु पवित्र मंत्रों का जाप किया जाता है।"
    },
    {
      "name": "चरण 5: आध्यात्मिक अभिमंत्रण",
      "duration": "पवित्र मंत्र स्पंदनों द्वारा ऊर्जाकरण",
      "description": "वैिडक मंत्रोच्चार द्वारा घोड़े की नाल को आध्यात्मिक रूप से अभिमंत्रित और ऊर्जित किया जाता है।"
    },
    {
      "name": "चरण 6: अंतिम आशीर्वाद अनुष्ठान",
      "duration": "पवित्र सुरक्षा आशीर्वाद विधि",
      "description": "पैकिंग और प्रेषण से पहले अंतिम आशीर्वाद अर्पित किया जाता है।"
    }
  ],
  "samagri_list": [],
  "priest_details": {
    "bio": "आचार्य भैरव नाथ शर्मा पारंपरिक वास्तु उपायों, सुरक्षा अनुष्ठानों और पवित्र अभिमंत्रण विधियों में विशेषज्ञ हैं।",
    "name": "आचार्य भैरव नाथ शर्मा",
    "experience": "20+ वर्ष",
    "qualification": "वास्तु उपाय एवं आध्यात्मिक सुरक्षा विशेषज्ञ"
  },
  "duration": "2 घंटे",
  "ideal_occasions": [
    "महाशिवरात्रि",
    "प्रदोषम्"
  ],
  "temple_association": "काशी विश्वनाथ मंदिर, वाराणसी",
  "who_should_perform": "आध्यात्मिक उन्नति और बाधाओं से मुक्ति की कामना रखने वाले परिवार",
  "offers": [
    "निःशुल्क अभिमंत्रित प्रसाद बॉक्स",
    "लाइव स्ट्रीम एक्सेस लिंक"
  ],
  "badges": [
    "वैदिक आशीर्वाद प्राप्त",
    "शीर्ष रेटेड"
  ],
  "testimonials": [
    {
      "name": "राजेश सिंह",
      "rating": 5,
      "comment": "उत्कृष्ट गुणवत्ता की घोड़े की नाल है। फिनिशिंग बहुत अच्छी है और पैकेजिंग भी सुरक्षित थी।",
      "location": "दिल्ली"
    },
    {
      "name": "नेहा वर्मा",
      "rating": 5,
      "comment": "उत्पाद बिल्कुल विवरण के अनुसार मिला और इसे मुख्य प्रवेश द्वार के पास लगाना भी आसान था।",
      "location": "जयपुर"
    },
    {
      "name": "मोहित शर्मा",
      "rating": 5,
      "comment": "गुणवत्ता और आध्यात्मिक प्रस्तुति से बहुत संतुष्ट हूँ।",
      "location": "लखनऊ"
    },
    {
      "name": "प्रिया पटेल",
      "rating": 5,
      "comment": "प्रामाणिक उत्पाद और पूरी प्रक्रिया के दौरान उत्कृष्ट ग्राहक सहायता मिली।",
      "location": "अहमदाबाद"
    },
    {
      "name": "अमित अग्रवाल",
      "rating": 5,
      "comment": "बहुत सुंदर तरीके से तैयार और पैक किया गया है। अत्यधिक अनुशंसित।",
      "location": "इंदौर"
    }
  ],
  "faqs": [
    {
      "answer": "काले घोड़े की नाल एक पारंपरिक घोड़े की नाल है, जिसका उपयोग वास्तु और आध्यात्मिक परंपराओं में सुरक्षा एवं सौभाग्य के प्रतीक के रूप में किया जाता है।",
      "question": "काले घोड़े की नाल क्या है?"
    },
    {
      "answer": "इसे सामान्यतः घर, कार्यालय, दुकान या व्यावसायिक परिसर के मुख्य प्रवेश द्वार के पास लगाया जाता है।",
      "question": "मुझे घोड़े की नाल कहाँ लगानी चाहिए?"
    },
    {
      "answer": "हाँ, प्रत्येक घोड़े की नाल को प्रेषण से पहले आध्यात्मिक अभिमंत्रण और ऊर्जाकरण प्रक्रिया से गुजारा जाता है।",
      "question": "क्या डिलीवरी से पहले घोड़े की नाल को अभिमंत्रित किया जाता है?"
    },
    {
      "answer": "हाँ, इसे घरों, कार्यालयों, दुकानों और व्यावसायिक स्थानों पर पारंपरिक रूप से लगाया जाता है।",
      "question": "क्या इसका उपयोग कार्यालय और दुकान में किया जा सकता है?"
    },
    {
      "answer": "हाँ, प्रत्येक उत्पाद की गुणवत्ता जाँच की जाती है और प्रेषण से पहले इसे सावधानीपूर्वक तैयार किया जाता है।",
      "question": "क्या इसके साथ प्रामाणिकता का आश्वासन मिलता है?"
    }
  ],
  "booking_instructions": "सरल बुकिंग प्रक्रिया\n1. अपना पूरा नाम दर्ज करें\n2. मोबाइल नंबर प्रदान करें\n3. पूरा डिलीवरी पता दर्ज करें\n4. सुरक्षित भुगतान पूरा करें\n5. आचार्य अभिमंत्रण अनुष्ठान संपन्न करते हैं\n6. उत्पाद आशीर्वाद और प्रमाणन के साथ भेजा जाता है\n\nमहत्वपूर्ण दिशानिर्देश\n✔ घोड़े की नाल को स्वच्छ और सम्मानजनक स्थान पर स्थापित करें।\n✔ पारंपरिक उपयोग के लिए इसे सामान्यतः मुख्य प्रवेश द्वार के पास लगाया जाता है।\n✔ घोड़े की नाल को स्वच्छ रखें और उस पर अत्यधिक जंग जमा न होने दें।\n✔ इसे उपेक्षित या अव्यवस्थित स्थान पर रखने से बचें।\n✔ उत्पाद के साथ दिए गए स्थापना निर्देशों का पालन करें।\n✔ इसे एक पवित्र आध्यात्मिक उपाय मानकर सम्मानपूर्वक संभालें।\n✔ स्थापना के समय सकारात्मक भाव और संकल्प बनाए रखें।\n✔ समय-समय पर सूखे कपड़े से इसे साफ करें।\n✔ जहाँ तक संभव हो, इसे अत्यधिक नमी से सुरक्षित रखें।\n✔ नियमित प्रार्थना या कृतज्ञता का अभ्यास आध्यात्मिक जुड़ाव की भावना को बढ़ाने में सहायक हो सकता है।",
  "cta_labels": {
    "primary": "अभी बुक करें",
    "secondary": "और जानें"
  },
  "seo_title": "काले घोड़े की नाल – वास्तु सुरक्षा एवं शनि दोष उपाय",
  "seo_description": "अभिमंत्रित काले घोड़े की नाल ऑनलाइन प्राप्त करें। मुख्य द्वार की वास्तु सुरक्षा, सौभाग्य और शनि दोष से संबंधित पारंपरिक आध्यात्मिक उपाय के रूप में विशेष रूप से तैयार।",
  "og_data": {
    "image": "",
    "title": "",
    "description": ""
  },
  "image_alt": null,
  "image_caption": null,
  "gallery_images": [
    {
      "alt": "काले घोड़े की नाल",
      "url": "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/1213e07c-7523-4c6c-95a8-6859418583b0_b1.webp"
    },
    {
      "alt": "काले घोड़े की नाल",
      "url": "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/b3ca14e2-bef4-4b6e-8b28-e02466962bb2_b2.webp"
    },
    {
      "alt": "काले घोड़े की नाल",
      "url": "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/e4e6b89d-8f1f-4a2c-b40b-939503a193cc_b3.webp"
    },
    {
      "alt": "काले घोड़े की नाल",
      "url": "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/d4457361-1284-4a55-b92f-852a9c27bd3d_b4.webp"
    },
    {
      "alt": "काले घोड़े की नाल",
      "url": "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/21725387-b105-44eb-b708-e254baa6e776_b5.webp"
    }
  ],
  "certificates": [
    {
      "url": "📜",
      "name": "प्रामाणिक काले घोड़े की नाल",
      "issuer": "काशी वैदिक संस्थान"
    },
    {
      "url": "📜",
      "name": "विशेषज्ञ गुणवत्ता निरीक्षण",
      "issuer": "काशी वैदिक संस्थान"
    },
    {
      "url": "📜",
      "name": "आध्यात्मिक अभिमंत्रण पूर्ण",
      "issuer": "काशी वैदिक संस्थान"
    },
    {
      "url": "📜",
      "name": "सुरक्षा आशीर्वाद अनुष्ठान संपन्न",
      "issuer": "काशी वैदिक संस्थान"
    },
    {
      "url": "📜",
      "name": "वास्तु-अनुकूल तैयारी",
      "issuer": "काशी वैदिक संस्थान"
    },
    {
      "url": "📜",
      "name": "सुरक्षित एवं संरक्षणयुक्त पैकेजिंग",
      "issuer": "काशी वैदिक संस्थान"
    },
    {
      "url": "📜",
      "name": "गुणवत्ता आश्वासन शामिल",
      "issuer": "काशी वैदिक संस्थान"
    }
  ],
  "material": "प्रामाणिक काले घोड़े की नाल का लोहा",
  "weight": "250 ग्राम – 600 ग्राम (लगभग)",
  "dimensions": "4 – 7 इंच (लगभग)",
  "origin": "भारत"
};

function run() {
  console.log('Reading files...');
  const hindiRaw = fs.readFileSync(HINDI_JSON_PATH, 'utf8');
  const englishRaw = fs.readFileSync(ENGLISH_JSON_PATH, 'utf8');

  const hindiData = JSON.parse(hindiRaw);
  const englishData = JSON.parse(englishRaw);

  console.log(`Original Hindi Count: ${hindiData.length}`);
  console.log(`English Count: ${englishData.products.length}`);

  // 1. Add Black Horseshoe if missing
  const hasBlackHorseshoe = hindiData.some(p => p.id === BLACK_HORSESHOE_HINDI.id);
  if (!hasBlackHorseshoe) {
    hindiData.push(BLACK_HORSESHOE_HINDI);
    console.log('Added Black Horseshoe to Hindi array.');
  } else {
    console.log('Black Horseshoe already exists in Hindi array.');
  }

  // 2. Fix untranslated word 'awareness' in Pyrite Owl
  const pyriteOwl = hindiData.find(p => p.id === '5fbc27f1-fd14-41af-b350-c348151b0c75');
  if (pyriteOwl) {
    if (pyriteOwl.description.includes('awareness')) {
      pyriteOwl.description = pyriteOwl.description.replace(/awareness/g, 'जागरूकता');
      console.log('Fixed "awareness" in Pyrite Owl description.');
    }
    if (pyriteOwl.spiritual_significance.includes('awareness')) {
      pyriteOwl.spiritual_significance = pyriteOwl.spiritual_significance.replace(/awareness/g, 'जागरूकता');
      console.log('Fixed "awareness" in Pyrite Owl spiritual_significance.');
    }
  }

  // 3. Fix missing fields for Karungali Mala and Tulsi Mala
  const requestedFields = [
    'id', 'name', 'sanskrit_name', 'short_name', 'category', 'tags', 'subtitle',
    'short_description', 'description', 'spiritual_significance', 'benefits',
    'rituals_included', 'samagri_list', 'priest_details', 'duration', 'ideal_occasions',
    'temple_association', 'who_should_perform', 'offers', 'badges', 'testimonials',
    'faqs', 'booking_instructions', 'cta_labels', 'seo_title', 'seo_description',
    'og_data', 'image_alt', 'image_caption', 'gallery_images', 'certificates',
    'material', 'weight', 'dimensions', 'origin'
  ];

  // Specific corrections for Karungali Mala (4d567787-bd06-418e-be2a-7e5ab2ca0abf)
  const karungali = hindiData.find(p => p.id === '4d567787-bd06-418e-be2a-7e5ab2ca0abf');
  if (karungali) {
    karungali.cta_labels = { "primary": "अभी बुक करें", "secondary": "और जानें" };
    karungali.seo_title = "करुंगाली माला – पवित्र आबनूस की लकड़ी";
    karungali.seo_description = "प्रीमियम ऊर्जित करुंगाली माला ऑनलाइन प्राप्त करें। भगवान मुरुगन पेंडेंट के साथ प्रामाणिक आबनूस की लकड़ी से निर्मित पारंपरिक माला।";
    karungali.og_data = { "image": "", "title": "", "description": "" };
    karungali.image_alt = null;
    karungali.image_caption = null;
    karungali.gallery_images = [
      {
        "alt": "मुरुगन पेंडेंट के साथ करुंगाली माला",
        "url": "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/239d95b0-5786-4f06-b44b-9f6c7b0a6b1f_k1.webp"
      },
      {
        "alt": "मुरुगन पेंडेंट के साथ करुंगाली माला",
        "url": "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/c436ea15-a6a5-410c-bcc1-87e5223a4592_k2.webp"
      },
      {
        "alt": "मुरुगन पेंडेंट के साथ करुंगाली माला",
        "url": "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/81b8d60d-5864-422c-a721-f490f91d1438_k3.webp"
      },
      {
        "alt": "मुरुगन पेंडेंट के साथ करुंगाली माला",
        "url": "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/87716c15-c939-4309-9b40-158e0d1715dc_k4.webp"
      },
      {
        "alt": "मुरुगन पेंडेंट के साथ करुंगाली माला",
        "url": "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/1a188fd2-f602-48b2-81e8-552ce038cf65_k5.webp"
      }
    ];
    karungali.certificates = [
      {
        "url": "📜",
        "name": "प्रामाणिक करुंगाली लकड़ी के मनके",
        "issuer": "काशी वैदिक संस्थान"
      },
      {
        "url": "📜",
        "name": "प्रीमियम भगवान मुरुगन पेंडेंट",
        "issuer": "काशी वैदिक संस्थान"
      },
      {
        "url": "📜",
        "name": "विशेषज्ञ गुणवत्ता निरीक्षण",
        "issuer": "काशी वैदिक संस्थान"
      },
      {
        "url": "📜",
        "name": "आध्यात्मिक ऊर्जाकरण पूर्ण",
        "issuer": "काशी वैदिक संस्थान"
      },
      {
        "url": "📜",
        "name": "मुरुगन आशीर्वाद अनुष्ठान संपन्न",
        "issuer": "काशी वैदिक संस्थान"
      },
      {
        "url": "📜",
        "name": "सुरक्षित एवं संरक्षणयुक्त पैकेजिंग",
        "issuer": "काशी वैदिक संस्थान"
      }
    ];
    karungali.material = "प्रामाणिक करुंगाली लकड़ी (आबनूस)";
    karungali.weight = "30 ग्राम – 60 ग्राम (लगभग)";
    karungali.dimensions = "108 मनके, 8 मिमी (लगभग)";
    karungali.origin = "दक्षिण भारत";
    console.log('Restored missing fields for Karungali Mala.');
  }

  // Specific corrections for Tulsi Mala (ef9700ec-42c3-4de4-8b94-9f3e86b8d760)
  const tulsi = hindiData.find(p => p.id === 'ef9700ec-42c3-4de4-8b94-9f3e86b8d760');
  if (tulsi) {
    tulsi.cta_labels = { "primary": "अभी बुक करें", "secondary": "और जानें" };
    tulsi.seo_title = "तुलसी माला – प्रामाणिक पवित्र तुलसी मनके";
    tulsi.seo_description = "प्रीमियम ऊर्जित तुलसी माला ऑनलाइन प्राप्त करें। मंत्र जाप, ध्यान और भगवान विष्णु भक्ति के लिए प्रामाणिक प्राकृतिक तुलसी की लकड़ी से निर्मित माला।";
    tulsi.og_data = { "image": "", "title": "", "description": "" };
    tulsi.image_alt = null;
    tulsi.image_caption = null;
    tulsi.gallery_images = [
      {
        "alt": "तुलसी माला",
        "url": "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/106fedf0-d735-462b-be60-c2c09bfcffef_tm1.webp"
      },
      {
        "alt": "तुलसी माला",
        "url": "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/cfb42634-7bff-4a51-a0e2-d95c3d6261e5_tm2.webp"
      },
      {
        "alt": "तुलसी माला",
        "url": "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/841da271-833b-415d-8f18-a3dfccb891a2_tm3.webp"
      },
      {
        "alt": "तुलसी माला",
        "url": "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/0c90ae00-1cd6-40cc-9fd6-6ea79816304e_tm4.webp"
      },
      {
        "alt": "तुलसी माला",
        "url": "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/c46cbe61-b59b-4693-b6f1-a3b20b29ff0c_tm5.webp"
      }
    ];
    tulsi.certificates = [
      {
        "url": "📜",
        "name": "प्रामाणिक प्राकृतिक तुलसी लकड़ी के मनके",
        "issuer": "काशी वैदिक संस्थान"
      },
      {
        "url": "📜",
        "name": "प्रीमियम हस्तनिर्मित माला",
        "issuer": "काशी वैदिक संस्थान"
      },
      {
        "url": "📜",
        "name": "विशेषज्ञ गुणवत्ता निरीक्षण",
        "issuer": "काशी वैदिक संस्थान"
      },
      {
        "url": "📜",
        "name": "आध्यात्मिक ऊर्जाकरण पूर्ण",
        "issuer": "काशी वैदिक संस्थान"
      },
      {
        "url": "📜",
        "name": "विष्णु-तुलसी आशीर्वाद अनुष्ठान संपन्न",
        "issuer": "काशी वैदिक संस्थान"
      },
      {
        "url": "📜",
        "name": "सुरक्षित एवं संरक्षणयुक्त पैकेजिंग",
        "issuer": "काशी वैदिक संस्थान"
      },
      {
        "url": "📜",
        "name": "गुणवत्ता आश्वासन शामिल",
        "issuer": "काशी वैदिक संस्थान"
      }
    ];
    tulsi.material = "प्राकृतिक पवित्र तुलसी की लकड़ी";
    tulsi.weight = "15 ग्राम – 35 ग्राम (लगभग)";
    tulsi.dimensions = "108 मनके, 22 – 30 इंच (लगभग)";
    tulsi.origin = "भारत";
    console.log('Restored missing fields for Tulsi Mala.');
  }

  // 4. Double check all 30 products have all 35 fields, set undefined/missing to null
  hindiData.forEach(p => {
    requestedFields.forEach(f => {
      if (p[f] === undefined) {
        p[f] = null;
      }
    });
    // Ensure correct ordering of keys to match exactly
    const ordered = {};
    requestedFields.forEach(f => {
      ordered[f] = p[f];
    });
    Object.keys(p).forEach(k => {
      if (!requestedFields.includes(k)) {
        console.log(`Warning: extra key "${k}" found on product "${p.name}". Deleting.`);
        delete p[k];
      }
    });
    // Replace with ordered keys
    Object.keys(p).forEach(k => delete p[k]);
    Object.assign(p, ordered);
  });

  // Verify that we now have 30 products and each has 35 keys
  console.log(`Final Hindi Product Count: ${hindiData.length}`);
  let allOk = true;
  hindiData.forEach((p, idx) => {
    const keys = Object.keys(p);
    if (keys.length !== 35) {
      console.error(`Error: product ${p.name} has ${keys.length} keys instead of 35.`);
      allOk = false;
    }
  });

  if (allOk) {
    console.log('All 30 products verified with exactly 35 keys.');
    // Write back to file
    fs.writeFileSync(HINDI_JSON_PATH, JSON.stringify(hindiData, null, 2));
    console.log(`Successfully wrote combined Hindi translation file to: ${HINDI_JSON_PATH}`);
  } else {
    console.error('Validation failed. File was not written.');
  }
}

run();
