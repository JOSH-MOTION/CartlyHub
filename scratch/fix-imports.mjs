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

  // Fix the aliased useRouter as useNavigate
  content = content.replace(/import\s+\{\s*useRouter\s*as\s*useNavigate\s*\}\s+from\s+["']next\/navigation["'];?/g, 'import { useRouter } from "next/navigation";');
  
  // Also check for Link component from react-router mapping to next/link
  if (content.includes('import { Link } from "react-router') || content.includes("import { Link } from 'react-router")) {
    content = content.replace(/import\s+\{\s*Link\s*\}\s+from\s+['"]react-router(?:-dom)?['"];?/g, 'import Link from "next/link";');
  }

  // Next.js client component directive - Remove duplicates if added multiple times
  if (content.includes('"use client";\n"use client";\n')) {
     content = content.replace('"use client";\n"use client";\n', '"use client";\n');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Modified:', filePath);
    modified++;
  }
});

console.log('Done, modified files:', modified);
