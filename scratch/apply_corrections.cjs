const fs = require('fs');
const path = require('path');

const englishPath = 'C:\\Users\\Lenovo\\Desktop\\store\\Store\\shop_product_english_source_for_hindi.json';
const hindiPath = 'C:\\Users\\Lenovo\\Desktop\\store\\Store\\scratch\\shop_product_hindi_translations.json';

const englishRaw = JSON.parse(fs.readFileSync(englishPath, 'utf8'));
const english = englishRaw.products || englishRaw;
const hindi = JSON.parse(fs.readFileSync(hindiPath, 'utf8'));

// Map products
const englishMap = new Map(english.map(p => [p.id, p]));
const hindiMap = new Map(hindi.map(p => [p.id, p]));

// --- CORRECTION 1: 7 Horses on Raw Pyrite Frame (ef68116b-09ae-4034-812a-8c6ecb898a12) ---
console.log('Applying Correction 1 (7 Horses)...');
const h7Horses = hindiMap.get('ef68116b-09ae-4034-812a-8c6ecb898a12');
if (h7Horses) {
  h7Horses.cta_labels = {
    primary: "अभी बुक करें",
    secondary: "अधिक जानें"
  };
  h7Horses.seo_title = "7 हॉर्स ऑन रॉ पाइराइट फ्रेम – वास्तु और सफलता कला";
  h7Horses.seo_description = "ऊर्जित 7 हॉर्स ऑन रॉ पाइराइट फ्रेम ऑनलाइन खरीदें। वास्तु सिद्धांतों के अनुसार सफलता, वित्तीय विकास और सकारात्मक ऊर्जा के लिए डिज़ाइन किया गया।";
  h7Horses.og_data = {
    image: "",
    title: "",
    description: ""
  };
  h7Horses.image_alt = null;
  h7Horses.image_caption = null;
  h7Horses.gallery_images = [
    {
      alt: "7 हॉर्स ऑन रॉ पाइराइट फ्रेम",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/a2350db4-0035-48fa-89f5-868b90dea269_h1.webp"
    },
    {
      alt: "7 हॉर्स ऑन रॉ पाइराइट फ्रेम",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/65611df2-fcd9-4c5d-b3b7-222fc43806ab_h2.webp"
    },
    {
      alt: "7 हॉर्स ऑन रॉ पाइराइट फ्रेम",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/ead82392-5a6f-499c-82f9-00fd3907f565_h3.webp"
    },
    {
      alt: "7 हॉर्स ऑन रॉ पाइराइट फ्रेम",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/399f2fc3-2b5e-47bb-911c-95e3c25a311a_h4.webp"
    },
    {
      alt: "7 हॉर्स ऑन रॉ पाइराइट फ्रेम",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/2a6a5bea-84eb-4378-bb41-fb1adf64c799_h5.webp"
    }
  ];
  h7Horses.certificates = [
    {
      url: "📜",
      name: "प्रीमियम प्राकृतिक रॉ पाइराइट प्रयुक्त",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "विशेषज्ञ गुणवत्ता निरीक्षण",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "समृद्धि ऊर्जा संवर्धन संपन्न",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "लक्ष्मी-कुबेर ऊर्जीकरण अनुष्ठान पूर्ण",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "वास्तु-अनुकूल डिजाइन",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "सुरक्षित सुरक्षात्मक पैकेजिंग",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "गुणवत्ता आश्वासन शामिल",
      issuer: "काशी वैदिक संस्थान"
    }
  ];
  h7Horses.material = "प्राकृतिक रॉ पाइराइट, प्रीमियम राल (रेजिन) और सजावटी फ्रेम";
  h7Horses.weight = "500 ग्राम – 1200 ग्राम (लगभग)";
  h7Horses.dimensions = "8 x 10 इंच से 12 x 16 इंच (लगभग)";
  h7Horses.origin = "भारत";
}

// --- CORRECTION 2: Dhan Yog Bracelet (e8c015d8-dd72-461f-830c-7f113dede450) ---
console.log('Applying Correction 2 (Dhan Yog Bracelet)...');
const hDhanYog = hindiMap.get('e8c015d8-dd72-461f-830c-7f113dede450');
if (hDhanYog) {
  hDhanYog.cta_labels = {
    primary: "अभी बुक करें",
    secondary: "अधिक जानें"
  };
  hDhanYog.seo_title = "धन योग ब्रेसलेट – धन और सफलता के लिए पवित्र क्रिस्टल";
  hDhanYog.seo_description = "प्रामाणिक ऊर्जित धन योग ब्रेसलेट ऑनलाइन खरीदें। धन, आत्मविश्वास और सकारात्मक ऊर्जा को आकर्षित करने के लिए प्रीमियम समृद्धि क्रिस्टल के साथ हस्तनिर्मित।";
  hDhanYog.og_data = {
    image: "",
    title: "",
    description: ""
  };
  hDhanYog.image_alt = null;
  hDhanYog.image_caption = null;
  hDhanYog.gallery_images = [
    {
      alt: "धन योग ब्रेसलेट",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/8742b9f6-4007-459c-998e-7fd1242b1ac9_d1.webp"
    },
    {
      alt: "धन योग ब्रेसलेट",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/74add12b-c6be-4847-a9c6-cb9730778d16_d2.webp"
    },
    {
      alt: "धन योग ब्रेसलेट",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/13863962-5cc1-4f39-a8fa-039906851aae_d3.webp"
    },
    {
      alt: "धन योग ब्रेसलेट",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/94d202a1-dbb8-470c-adaa-7dd01cc87cc8_d4.webp"
    },
    {
      alt: "धन योग ब्रेसलेट",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/443737c5-e659-485c-ad23-4004b9432937_d5.webp"
    },
    {
      alt: "उत्पाद वीडियो",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/videos/7eff6d42-7a72-4cd5-8250-38931b8cfc13_dhanyog_testimonial2.mp4",
      isVideo: true,
      thumbnail: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/thumbnails/42105cdd-4e9e-4b89-a348-e138d3bb1ff5_thumb_1781610451179.jpg"
    },
    {
      alt: "उत्पाद वीडियो",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/videos/d7fb7055-d09e-40b4-a5c2-67a173c9d319_dhanyog_testimonial1.mp4",
      isVideo: true,
      thumbnail: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/thumbnails/66efb57f-c5b0-405e-a71a-40bb28be88a2_thumb_1781610471876.jpg"
    }
  ];
  hDhanYog.certificates = [
    {
      url: "📜",
      name: "प्रीमियम गुणवत्ता समृद्धि ब्रेसलेट",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "विशेषज्ञ गुणवत्ता निरीक्षण",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "प्रामाणिकता सत्यापन प्रक्रिया",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "लक्ष्मी-कुबेर ऊर्जीकरण अनुष्ठान संपन्न",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "समृद्धि सक्रियण पूर्ण",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "सुरक्षित सुरक्षात्मक पैकेजिंग",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "गुणवत्ता आश्वासन शामिल",
      issuer: "काशी वैदिक संस्थान"
    }
  ];
  hDhanYog.material = "प्रीमियम समृद्धि क्रिस्टल और आध्यात्मिक मनके";
  hDhanYog.weight = "20 ग्राम – 40 ग्राम (लगभग)";
  hDhanYog.dimensions = "समायोज्य / खिंचावदार फिट (स्ट्रेचेबल फिट)";
  hDhanYog.origin = "भारत";
}

// --- CORRECTION 3: Gauri Ganesh Rudraksha (a6bd58fa-b20b-4a11-b63f-fe7b71dc156b) Certificates ---
console.log('Applying Correction 3 (Gauri Ganesh Certificates)...');
const hGauriGanesh = hindiMap.get('a6bd58fa-b20b-4a11-b63f-fe7b71dc156b');
if (hGauriGanesh) {
  // Current length is 4. Rebuild to 8 certificates.
  hGauriGanesh.certificates = [
    {
      url: "📜",
      name: "असली नेपाली गौरी गणेश रुद्राक्ष",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "प्राकृतिक रूप से निर्मित पवित्र संरचना",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "विशेषज्ञ गुणवत्ता निरीक्षण",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "प्रामाणिकता सत्यापन प्रक्रिया",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "शिव-पार्वती-गणेश ऊर्जीकरण अनुष्ठान संपन्न",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "पवित्र पारिवारिक सद्भाव आशीर्वाद शामिल",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "सुरक्षित सुरक्षात्मक पैकेजिंग",
      issuer: "काशी वैदिक संस्थान"
    },
    {
      url: "📜",
      name: "प्रामाणिकता का प्रमाण पत्र प्रदान किया गया",
      issuer: "काशी वैदिक संस्थान"
    }
  ];
}

// --- CORRECTION 4: Karungali Mala (4d567787-bd06-418e-be2a-7e5ab2ca0abf) Certificates ---
console.log('Applying Correction 4 (Karungali Certificates)...');
const hKarungali = hindiMap.get('4d567787-bd06-418e-be2a-7e5ab2ca0abf');
if (hKarungali) {
  // Append 7th certificate
  hKarungali.certificates = [
    {
      url: '📜',
      name: 'प्रामाणिक करुंगाली लकड़ी के मनके',
      issuer: 'काशी वैदिक संस्थान'
    },
    {
      url: '📜',
      name: 'प्रीमियम भगवान मुरुगन पेंडेंट',
      issuer: 'काशी वैदिक संस्थान'
    },
    {
      url: '📜',
      name: 'विशेषज्ञ गुणवत्ता निरीक्षण',
      issuer: 'काशी वैदिक संस्थान'
    },
    {
      url: '📜',
      name: 'आध्यात्मिक ऊर्जाकरण पूर्ण',
      issuer: 'काशी वैदिक संस्थान'
    },
    {
      url: '📜',
      name: 'मुरुगन आशीर्वाद अनुष्ठान संपन्न',
      issuer: 'काशी वैदिक संस्थान'
    },
    {
      url: '📜',
      name: 'सुरक्षित एवं संरक्षणयुक्त पैकेजिंग',
      issuer: 'काशी वैदिक संस्थान'
    },
    {
      url: '📜',
      name: 'गुणवत्ता आश्वासन शामिल',
      issuer: 'काशी वैदिक संस्थान'
    }
  ];
}

// --- CORRECTION 5: Vidya Rudraksh (9b2524ca-7eb8-43c0-9465-e38d00326eb6) Gallery ---
console.log('Applying Correction 5 (Vidya Rudraksh Gallery)...');
const hVidya = hindiMap.get('9b2524ca-7eb8-43c0-9465-e38d00326eb6');
if (hVidya) {
  hVidya.gallery_images = [
    {
      alt: "विद्या रुद्राक्ष",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/8486f6b0-0961-474c-8722-bdb236055211_1.webp"
    },
    {
      alt: "विद्या रुद्राक्ष",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/649059ea-c8f5-48c5-ac82-12a0841bbfe8_2.webp"
    },
    {
      alt: "उत्पाद वीडियो",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/videos/6ec5815f-fc92-404e-bbda-61fc4fc07b6f_vidhyarudraksh_podcast_mantra_astrologer.mp4",
      isVideo: true
    },
    {
      alt: "विद्या रुद्राक्ष",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/27ec70b2-3218-4658-85f1-ff007b99bb92_3.webp"
    },
    {
      alt: "विद्या रुद्राक्ष",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/46b72492-7eaa-4d1e-8504-95601817ffe9_v4.webp"
    },
    {
      alt: "विद्या रुद्राक्ष",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/c2419d9b-304c-447e-b72e-4da6fb85de91_v5.webp"
    },
    {
      alt: "विद्या रुद्राक्ष",
      url: "https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/bc2159c8-54d0-4fe1-86ce-18628fad56ac_v1.webp"
    }
  ];
}

// --- CORRECTION 6: English Leakages ---
console.log('Applying Correction 6 (English Leakages)...');

// 1. Pyrite Owl (5fbc27f1-fd14-41af-b350-c348151b0c75) description "and" -> "और"
const hPyriteOwl = hindiMap.get('5fbc27f1-fd14-41af-b350-c348151b0c75');
if (hPyriteOwl && hPyriteOwl.rituals_included && hPyriteOwl.rituals_included[5]) {
  console.log('Pyrite Owl current description:', hPyriteOwl.rituals_included[5].description);
  hPyriteOwl.rituals_included[5].description = hPyriteOwl.rituals_included[5].description.replace('and', 'और');
  console.log('Pyrite Owl corrected:', hPyriteOwl.rituals_included[5].description);
}

// 2. 5 Mukhi Rudraksha (af3a8114-20ad-481f-95db-cafef72eec73) spiritual_significance "and" -> "और"
const h5Mukhi = hindiMap.get('af3a8114-20ad-481f-95db-cafef72eec73');
if (h5Mukhi && h5Mukhi.spiritual_significance) {
  console.log('5 Mukhi current spiritual_significance:', h5Mukhi.spiritual_significance);
  h5Mukhi.spiritual_significance = h5Mukhi.spiritual_significance.replace('and', 'और');
  console.log('5 Mukhi corrected:', h5Mukhi.spiritual_significance);
}

// 3. 11 Mukhi Rudraksha (41c77cb0-d03b-456d-b52d-db7c5e4964b8) spiritual_significance "and" -> "और"
const h11Mukhi = hindiMap.get('41c77cb0-d03b-456d-b52d-db7c5e4964b8');
if (h11Mukhi && h11Mukhi.spiritual_significance) {
  console.log('11 Mukhi current spiritual_significance:', h11Mukhi.spiritual_significance);
  h11Mukhi.spiritual_significance = h11Mukhi.spiritual_significance.replace('and', 'और');
  console.log('11 Mukhi corrected:', h11Mukhi.spiritual_significance);
}

// 4. 14 Mukhi Rudraksha (b0b37b77-7e85-4813-b214-ed84e81c49c0) seo_description "Dev Mani" -> "देव मणि"
const h14Mukhi = hindiMap.get('b0b37b77-7e85-4813-b214-ed84e81c49c0');
if (h14Mukhi && h14Mukhi.seo_description) {
  console.log('14 Mukhi current seo_description:', h14Mukhi.seo_description);
  h14Mukhi.seo_description = h14Mukhi.seo_description.replace('Dev Mani', 'देव मणि');
  console.log('14 Mukhi corrected:', h14Mukhi.seo_description);
}

// 5. 7 Chakra Crystal Tree of Life (c0a304bd-011d-4f63-9efd-ed0f047a615e) gallery_images[2].alt "life" -> "लाइफ"
const h7ChakraTree = hindiMap.get('c0a304bd-011d-4f63-9efd-ed0f047a615e');
if (h7ChakraTree && h7ChakraTree.gallery_images && h7ChakraTree.gallery_images[2]) {
  console.log('7 Chakra Tree current alt:', h7ChakraTree.gallery_images[2].alt);
  h7ChakraTree.gallery_images[2].alt = h7ChakraTree.gallery_images[2].alt.replace('life', 'लाइफ');
  console.log('7 Chakra Tree corrected:', h7ChakraTree.gallery_images[2].alt);
}

// Write the updated array back to file
fs.writeFileSync(hindiPath, JSON.stringify(hindi, null, 2), 'utf8');
console.log('Saved corrections to shop_product_hindi_translations.json');
