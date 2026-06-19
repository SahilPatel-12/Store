/**
 * Helper utility to dynamically classify storefront items into spiritual types
 * if they are missing or default in the database, matching actual website content.
 */

export const getSpiritualTypeForProduct = (
  name: string,
  category: string,
  tags: string[] = [],
  dbSpiritualType?: string
): 'Rituals' | 'Meditation' | 'Vastu' | 'Wisdom' | 'Aromatherapy' => {
  // If the product explicitly has a custom spiritual type from the database (not default 'Rituals'), respect it
  if (
    dbSpiritualType &&
    dbSpiritualType !== 'Rituals' &&
    ['Rituals', 'Meditation', 'Vastu', 'Wisdom', 'Aromatherapy'].includes(dbSpiritualType)
  ) {
    return dbSpiritualType as 'Rituals' | 'Meditation' | 'Vastu' | 'Wisdom' | 'Aromatherapy';
  }

  const nameLower = (name || '').toLowerCase();
  const catLower = (category || '').toLowerCase();
  const tagsStr = (tags || []).map(t => t.toLowerCase()).join(' ');

  // 1. Aromatherapy: Incense, Camphor, Agarbatti, Dhoop, Aroma, Cup Burners
  if (
    catLower.includes('incense') ||
    catLower.includes('camphor') ||
    catLower.includes('fragrance') ||
    nameLower.includes('incense') ||
    nameLower.includes('camphor') ||
    nameLower.includes('dhoop') ||
    nameLower.includes('agarbatti') ||
    nameLower.includes('aroma') ||
    nameLower.includes('cup holder') ||
    tagsStr.includes('incense') ||
    tagsStr.includes('camphor')
  ) {
    return 'Aromatherapy';
  }

  // 2. Vastu: Pyramid, Frame, Horseshoe, Vastu, Feng Shui, Tortoise, Owl, Crystal Tree
  if (
    catLower.includes('vastu') ||
    catLower.includes('pyramid') ||
    catLower.includes('frame') ||
    catLower.includes('crystal dome tree') ||
    catLower.includes('tree') ||
    catLower.includes('tower') ||
    catLower.includes('tumble') ||
    catLower.includes('evil eye') ||
    nameLower.includes('pyramid') ||
    nameLower.includes('vastu') ||
    nameLower.includes('horseshoe') ||
    nameLower.includes('naal') ||
    nameLower.includes('frame') ||
    nameLower.includes('tortoise') ||
    nameLower.includes('owl') ||
    nameLower.includes('tree of life') ||
    nameLower.includes('evil eye') ||
    tagsStr.includes('vastu') ||
    tagsStr.includes('pyramid') ||
    tagsStr.includes('tortoise')
  ) {
    return 'Vastu';
  }

  // 3. Wisdom: Vidya, Book, Gita, Text, Wisdom, Saraswati, Education, Knowledge, 4 Mukhi, 6 Mukhi (Saraswati combination)
  if (
    catLower.includes('book') ||
    catLower.includes('wisdom') ||
    nameLower.includes('vidya') ||
    nameLower.includes('book') ||
    nameLower.includes('gita') ||
    nameLower.includes('saraswati') ||
    nameLower.includes('study') ||
    nameLower.includes('wisdom') ||
    nameLower.includes('knowledge') ||
    tagsStr.includes('wisdom') ||
    tagsStr.includes('vidya')
  ) {
    return 'Wisdom';
  }

  // 4. Meditation: Japa, Mala, Rudraksha, Bracelet, Anklet, Crystals, Karungali, Pyrite, Meditation, Yoga
  if (
    catLower.includes('rudraksha') ||
    catLower.includes('bracelet') ||
    catLower.includes('anklet') ||
    catLower.includes('karungali') ||
    catLower.includes('mala') ||
    catLower.includes('pyrite') ||
    catLower.includes('crystal') ||
    nameLower.includes('japa') ||
    nameLower.includes('mala') ||
    nameLower.includes('bracelet') ||
    nameLower.includes('anklet') ||
    nameLower.includes('rudraksha') ||
    nameLower.includes('karungali') ||
    nameLower.includes('pyrite') ||
    nameLower.includes('meditation') ||
    nameLower.includes('yoga') ||
    nameLower.includes('crystal') ||
    nameLower.includes('mukhi') ||
    tagsStr.includes('rudraksha') ||
    tagsStr.includes('bracelet') ||
    tagsStr.includes('karungali')
  ) {
    return 'Meditation';
  }

  // 5. Rituals: Pooja, Puja, Yajna, Murti, Idol, Brass, Deity, Shaligram, Havan, Abhishek, Aarti, Prasad, Rituals
  if (
    catLower.includes('pooja') ||
    catLower.includes('puja') ||
    catLower.includes('murti') ||
    catLower.includes('idol') ||
    catLower.includes('yantra') ||
    catLower.includes('brass') ||
    catLower.includes('deity') ||
    nameLower.includes('pooja') ||
    nameLower.includes('puja') ||
    nameLower.includes('murti') ||
    nameLower.includes('idol') ||
    nameLower.includes('yantra') ||
    nameLower.includes('brass') ||
    nameLower.includes('deity') ||
    nameLower.includes('abhishek') ||
    nameLower.includes('havan') ||
    nameLower.includes('aarti') ||
    nameLower.includes('prasad') ||
    tagsStr.includes('pooja') ||
    tagsStr.includes('puja') ||
    tagsStr.includes('yantra')
  ) {
    return 'Rituals';
  }

  // Fallback to database value (if it exists) or default to Rituals
  return (dbSpiritualType as any) || 'Rituals';
};
