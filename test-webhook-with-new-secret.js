const crypto = require('crypto');
const https = require('https');

// Dein neuer Webhook Secret
const SECRET = 'AByU_DwS5gEc2AvYLh2g60oiO8tWQVYTWcOMzAwz8wqrH_gO8WpGTe4_LQG-QWMDVg';
const MANDATE_ID = 'MD01KCD3T4ACS0';

// Webhook Payload
const payload = {
  events: [{
    id: 'EV_TEST_' + Date.now(),
    created_at: new Date().toISOString(),
    resource_type: 'mandates',
    action: 'active',
    links: {
      mandate: MANDATE_ID
    }
  }]
};

const payloadString = JSON.stringify(payload);

// HMAC Signature erstellen
const signature = crypto
  .createHmac('sha256', SECRET)
  .update(payloadString)
  .digest('hex');

console.log('📡 Teste GoCardless Webhook mit neuem Secret...\n');
console.log('Secret:', SECRET.substring(0, 20) + '...');
console.log('Mandate:', MANDATE_ID);
console.log('Signature:', signature);
console.log('\n📤 Sende Webhook an bereifung24.de...\n');

const options = {
  hostname: 'www.bereifung24.de',
  port: 443,
  path: '/api/webhooks/gocardless',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'webhook-signature': signature,
    'Content-Length': Buffer.byteLength(payloadString)
  }
};

const req = https.request(options, (res) => {
  console.log('✅ Response Status:', res.statusCode);
  console.log('Response Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📥 Response Body:');
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(payloadString);
req.end();
