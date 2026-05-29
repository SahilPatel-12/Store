export const isImageUrl = (val: string | undefined | null): boolean => {
  if (!val) return false;
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

export const getDisplayImageUrl = (val: string | undefined | null): string => {
  if (!val) return '';
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
