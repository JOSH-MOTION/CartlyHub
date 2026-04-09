import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p, callback);
    } else {
      if (p.endsWith('.js') || p.endsWith('.ts')) {
        callback(p);
      }
    }
  }
}

let modified = 0;

walk('./src/app/api', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Convert React Router v7 API exports to Next.js API Routes format
  content = content.replace(/export\s+async\s+function\s+action\(\{\s*request\s*\}\)/g, 'export async function POST(request)');
  content = content.replace(/export\s+async\s+function\s+loader\(\{\s*request\s*\}\)/g, 'export async function GET(request)');
  content = content.replace(/export\s+async\s+function\s+loader\(\)/g, 'export async function GET()');

  // Next.js Response mapping (it works implicitly with Response, but let's be explicit)
  if (content.match(/export\s+async\s+function\s+(POST|GET)/) && !content.includes('NextResponse')) {
    content = "import { NextResponse } from 'next/server';\n" + content;
    content = content.replace(/Response\.json/g, 'NextResponse.json');
  } else if (content.includes('NextResponse')) {
    content = content.replace(/Response\.json/g, 'NextResponse.json');
    // Ensure not replacing NextResponse to NextNextResponse
    content = content.replace(/NextNextResponse/g, 'NextResponse');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Modified:', filePath);
    modified++;
  }
});

console.log('Done, modified API routes:', modified);
