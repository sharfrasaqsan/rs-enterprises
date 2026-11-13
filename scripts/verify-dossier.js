const fs = require('fs');

const path = '.next/server/app/vehicles/2023-toyota-land-cruiser-300-zx.html';
if (!fs.existsSync(path)) {
  console.error('File not found:', path);
  process.exit(1);
}

const html = fs.readFileSync(path, 'utf8');

console.log('=== VEHICLE DOSSIER HTML VERIFICATION ===');
console.log('1. Page size (KB):', (html.length / 1024).toFixed(1));
console.log('2. Exactly one H1:', (html.match(/<h1/g) || []).length === 1);
console.log('3. JSON-LD Car schema:', html.includes('"@type":"Car"') && html.includes('"priceCurrency":"LKR"'));
console.log('4. JSON-LD BreadcrumbList:', html.includes('"@type":"BreadcrumbList"'));
console.log('5. Canonical link:', html.includes('rel="canonical"') && html.includes('2023-toyota-land-cruiser-300-zx'));
console.log('6. WhatsApp prefilled with URL:', html.includes('https://wa.me/') && html.includes('2023-toyota-land-cruiser-300-zx'));
console.log('7. Phone CTA hotline:', html.includes('+94 27 222 0000'));
console.log('8. Lead inquiry form:', html.includes('Showroom Inquiry Desk') && html.includes('lead-name'));
console.log('9. Large numerals (LKR 88.5M):', html.includes('88,500,000') && html.includes('3,346'));
console.log('10. Mobile sticky enquiry bar:', html.includes('Mobile Vehicle Quick Contact'));
console.log('11. Related vehicles:', html.includes('Similar Vehicles in Showroom'));
