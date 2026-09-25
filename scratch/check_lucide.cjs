const lucide = require('lucide-react');
console.log('Keys containing tiktok (case insensitive):');
console.log(Object.keys(lucide).filter(k => k.toLowerCase().includes('tiktok')));
