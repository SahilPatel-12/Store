export default function handler(req, res) {
  const { ref, card } = req.query || {};
  const affiliateCode = ref || '';
  
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'localhost:5173';
  const origin = `${proto}://${host}`;
  
  // Use the uploaded blessings card URL, falling back to static logo
  const cardUrl = card || `${origin}/logo.png`;
  const redirectUrl = `${origin}/?ref=${affiliateCode}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Mantra Puja Partner Program</title>
  <meta name="description" content="Join me on Mantra Puja and explore divine offerings! Bring peace, health & prosperity home. Access authentic Pujas, Yagnas and spiritual items.">
  
  <!-- Open Graph / Facebook Link Preview -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="Join me on Mantra Puja and explore divine offerings!">
  <meta property="og:description" content="Bring peace, health & prosperity home. Access authentic Pujas, Yagnas and spiritual items.">
  <meta property="og:image" content="${cardUrl}">
  <meta property="og:url" content="${origin}/share?ref=${affiliateCode}">
  
  <!-- Twitter Link Preview -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Join me on Mantra Puja and explore divine offerings!">
  <meta name="twitter:description" content="Bring peace, health & prosperity home. Access authentic Pujas, Yagnas and spiritual items.">
  <meta name="twitter:image" content="${cardUrl}">

  <script>
    // Redirect real users to the main page with referral code
    window.location.href = "${redirectUrl}";
  </script>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #fcf8f5; color: #2d140e;">
  <div style="text-align: center;">
    <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #ffedd5; border-top-color: #ea580c; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    <p style="margin-top: 16px; font-weight: 600;">Redirecting to Mantra Puja...</p>
  </div>
  <style>
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
