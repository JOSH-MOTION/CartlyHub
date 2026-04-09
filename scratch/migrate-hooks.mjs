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

  // React Router navigate -> Next.js router
  if (content.includes('useNavigate()') || content.includes('useNavigate') || content.includes('react-router') || content.includes('react-router-dom')) {
    content = content.replace(/import\s+\{([^}]*?)useNavigate([^}]*?)\}\s+from\s+['"]react-router(?:-dom)?['"];?/g, 'import { $1useRouter as useNavigate$2 } from "next/navigation";');
    
    // Replace any remaining React Router imports that no longer have useNavigate
    content = content.replace(/import\s+\{\s*\}\s+from\s+['"]react-router(?:-dom)?['"];?\n/g, '');
    
    // Replace standalone useNavigate import
    content = content.replace(/import\s+\{\s*useNavigate\s*}\s+from\s+['"]react-router(?:-dom)?['"];?/g, 'import { useRouter } from "next/navigation";');
    
    content = content.replace(/const navigate = useNavigate\(\)/g, 'const router = useRouter()');
    content = content.replace(/navigate\(/g, 'router.push(');
  }

  // Next.js client component directive
  if (original !== content && !content.includes('"use client"') && !content.includes("'use client'")) {
    content = '"use client";\n' + content;
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Modified:', filePath);
    modified++;
  }
});

console.log('Done, modified files:', modified);
