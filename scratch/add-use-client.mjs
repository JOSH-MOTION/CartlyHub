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
  // Exclude API routes
  if (filePath.includes(path.normalize('src/app/api'))) return;
  // Exclude root layout since it exports metadata
  if (filePath === path.normalize('src/app/layout.jsx')) return;
  // Exclude non-components
  if (filePath.endsWith('.js') && !filePath.includes('components')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Check if it uses client-side APIs
  const needsUseClient = content.match(/useState|useEffect|useRouter|usePathname|useApp|window\.|document\.|onClick={|onSubmit={|onChange={|useCart|useQuery|navigator\.|localStorage\./);
  const hasUseClient = content.startsWith('"use client"') || content.startsWith("'use client'");
  
  if (needsUseClient && !hasUseClient) {
    // Make sure we add it right at the top
    content = '"use client";\n\n' + content;
  }

  // Also check for multiple "use client" and clean up
  const clientRegex = /['"]use client['"];?\n*/g;
  const matchCount = (content.match(clientRegex) || []).length;
  if (matchCount > 1) {
    content = content.replace(clientRegex, '');
    content = '"use client";\n\n' + content;
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Modified:', filePath);
    modified++;
  }
});

console.log('Done, modified files:', modified);
