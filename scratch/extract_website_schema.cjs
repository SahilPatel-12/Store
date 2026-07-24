const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'openapi_schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const websiteTables = [
  'website_store_users',
  'user_sessions',
  'website_store_orders',
  'website_store_addresses',
  'website_store_pundits',
  'website_store_pundit_bookings',
  'website_store_affiliates',
  'website_store_affiliate_commissions',
  'website_store_affiliate_withdrawals',
  'website_store_affiliate_settings',
  'website_store_coupon_redemptions',
  'website_store_msg91_test_otps',
  'website_store_otp_logs',
  'website_pooja_products',
  'website_pooja_product_translations',
  'localized_website_pooja_products',
  'website_settings',
  'razorpay_webhook_events'
];

const report = {};

websiteTables.forEach(tableName => {
  const definition = schema.definitions[tableName];
  if (definition) {
    report[tableName] = {
      description: definition.description || '',
      properties: {}
    };
    
    if (definition.properties) {
      Object.keys(definition.properties).forEach(colName => {
        const prop = definition.properties[colName];
        report[tableName].properties[colName] = {
          type: prop.type || '',
          format: prop.format || '',
          default: prop.default !== undefined ? prop.default : null,
          description: prop.description || ''
        };
      });
    }
  } else {
    report[tableName] = 'NOT FOUND IN SCHEMA';
  }
});

const outputPath = path.join(__dirname, 'website_tables_summary.json');
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
console.log(`Website tables summary written to ${outputPath}`);
console.log(Object.keys(report).filter(k => report[k] !== 'NOT FOUND IN SCHEMA').join(', '));
