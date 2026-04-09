import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p, callback);
    } else {
      if (p.endsWith('.jsx') || p.endsWith('.tsx') || p.endsWith('.js') || p.endsWith('.ts')) {
        callback(p);
      }
    }
  }
}

let modified = 0;

walk('./src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Undo <Link to <a
  content = content.replace(/<Link/g, '<a');
  content = content.replace(/<\/Link>/g, '</a>');
  
  // Remove Link import
  content = content.replace(/import Link from "next\/link";?\n?/g, '');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Modified:', filePath);
    modified++;
  }
});

console.log('Done, modified files:', modified);
