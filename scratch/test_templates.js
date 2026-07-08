const phoneNumbers = ['9742100448', '9302550606', '9617350006'];

async function testTemplates() {
  const tests = [
    {
      name: 'demo_utility (BUZWAP)',
      url: 'http://bhashsms.com/api/sendmsg.php?user=MisCRM&pass=123456&sender=BUZWAP&phone=9742100448&text=demo_utility&priority=wa&stype=normal&Params=1234'
    },
    {
      name: 'whoapplied (MisCRM)',
      url: 'https://bhashsms.com/api/sendmsg.php?user=MisCRM&pass=123456&sender=MisCRM&phone=9302550606&text=whoapplied&priority=wa&stype=normal&Params=1234,Low CIBIL Score'
    },
    {
      name: 'service_rejected_hindi (MisCRM)',
      url: 'https://bhashsms.com/api/sendmsg.php?user=MisCRM&pass=123456&sender=MisCRM&phone=9617350006&text=service_rejected_hindi&priority=wa&stype=normal&Params=1234,Low CIBIL Score'
    },
    {
      name: 'Welcome_to_Miss_CRM (MISSCRM)',
      url: 'http://wp.sixthsenseit.com/api/sendmsg.php?user=MisCRM&pass=123456&sender=MISSCRM&phone=9302550606&text=Welcome_to_Miss_CRM&priority=wa&stype=normal&Params=1234'
    }
  ];

  console.log('--- Testing BhashSMS Templates ---');
  for (const t of tests) {
    try {
      const res = await fetch(t.url);
      const body = await res.text();
      console.log(`[Test] ${t.name}: Status=${res.status}, Response=${body.trim()}`);
    } catch (err) {
      console.error(`[Test] ${t.name} failed:`, err.message);
    }
  }
}

testTemplates();
