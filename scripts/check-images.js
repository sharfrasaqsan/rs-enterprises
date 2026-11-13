const fs = require('fs');
const html = fs.readFileSync('.next/server/app/index.html', 'utf8');

const imgTags = html.match(/<img[^>]*>/g) || [];
console.log('Total img tags:', imgTags.length);
imgTags.forEach((img, i) => {
  console.log(`\nIMG ${i + 1}:`);
  console.log(img.substring(0, 200));
});

