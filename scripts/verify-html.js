const fs = require('fs');

const html = fs.readFileSync('.next/server/app/index.html', 'utf8');

console.log('=== HTML VERIFICATION ===');
console.log('1. Page size (KB):', (html.length / 1024).toFixed(1));
console.log('2. One H1 heading:', (html.match(/<h1/g) || []).length === 1);
console.log('3. LCP priority image count:', (html.match(/fetchPriority="high"/i) || []).length);
console.log('4. Lazy loaded images:', (html.match(/loading="lazy"/g) || []).length);
console.log('5. Zero-flash head script:', html.includes('id="theme-initializer"'));
console.log('6. Mobile sticky action bar:', html.includes('Quick Contact Actions'));
console.log('7. Compare counter:', html.includes('Compare'));
console.log('8. Direct from Japan inverted section:', html.includes('data-section-inverted="true"'));
console.log('9. Kaduruwela phone dialer:', html.includes('+94 27 222 0000'));
console.log('10. WhatsApp prefilled link:', html.includes('https://wa.me/'));

