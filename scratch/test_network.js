import https from 'https';
https.get('https://api.dicebear.com/7.x/avataaars/png?seed=test', (res) => {
  console.log('Status code:', res.statusCode);
}).on('error', (e) => {
  console.error(e);
});
