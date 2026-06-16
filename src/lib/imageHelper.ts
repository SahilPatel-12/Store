export const isImageUrl = (val: any): boolean => {
  if (!val || typeof val !== 'string') return false;
  const s = val.trim();
  return (
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    s.startsWith('//') ||
    s.startsWith('/') ||
    s.includes('.r2.dev') ||
    s.includes('.cloudflarestorage.com') ||
    s.includes('.supabase.') ||
    /\.(jpg|jpeg|png|webp|gif|svg|bmp)/i.test(s) ||
    s.includes('/')
  );
};

export const getDisplayImageUrl = (val: any): string => {
  if (!val || typeof val !== 'string') return '';
  let s = val.trim();
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('//')) {
    return s;
  }
  if (s.startsWith('/')) {
    return s;
  }
  if (s.includes('.r2.dev') || s.includes('.cloudflarestorage.com') || s.includes('.supabase.')) {
    return `https://${s}`;
  }
  return s;
};
