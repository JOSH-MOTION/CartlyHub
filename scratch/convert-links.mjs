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

  // Convert <a> tags to <Link> for internal routes
  // But only for those that look like internal links (start with / and don't contain http or ://)
  
  // First, check if there are such <a> tags
  if (content.match(/<a\s+[^>]*href=["']\/[^"']*["'][^>]*>/g)) {
    // Add Link import if not present
    if (!content.includes('import Link from "next/link"')) {
      content = 'import Link from "next/link";\n' + content;
    }
    
    // Replace <a ... href="/..." ...>...</a> with <Link ... href="/..." ...>...</Link>
    // This is a bit tricky with regex, but let's try a simple approach
    content = content.replace(/<a(\s+[^>]*href=["']\/[^"']*["'][^>]*)>/g, (match, p1) => {
        // If it's an external link or has target="_blank", don't convert it? 
        // Actually, internal links with / are always target for Link.
        return '<Link' + p1 + '>';
    });
    content = content.replace(/<\/a>/g, '</Link>');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Modified:', filePath);
    modified++;
  }
});

console.log('Done, modified files:', modified);
