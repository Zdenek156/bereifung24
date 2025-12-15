const gc = require('gocardless-nodejs');
const constants = require('gocardless-nodejs/constants');

const token = process.env.GOCARDLESS_ACCESS_TOKEN;
const env = process.env.GOCARDLESS_ENVIRONMENT === 'live' ? constants.Environments.Live : constants.Environments.Sandbox;

console.log('Token exists:', !!token);
console.log('Environment:', process.env.GOCARDLESS_ENVIRONMENT);

try {
  const client = gc(token, env);
  console.log('Client created successfully');
  
  client.customers.list({ limit: 1 })
    .then(result => {
      console.log('API call successful');
      console.log('Customers found:', result.customers.length);
      process.exit(0);
    })
    .catch(err => {
      console.error('API call failed:', err.message);
      console.error('Error code:', err.code);
      console.error('Full error:', JSON.stringify(err, null, 2));
      process.exit(1);
    });
} catch (error) {
  console.error('Client creation failed:', error.message);
  process.exit(1);
}
