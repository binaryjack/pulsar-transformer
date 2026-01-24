import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';

function getAllTsFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    if (statSync(fullPath).isDirectory()) {
      getAllTsFiles(fullPath, fileList);
    } else if (file.endsWith('.ts')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = getAllTsFiles('src');

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;
  
  // Match: from './path' or from "./path" (but NOT from 'typescript' or other packages)
  content = content.replace(/from\s+(['"])\.([^'"]+)(['"])/g, (match, quote1, path, quote2) => {
    // Skip if already has .js extension
    if (path.endsWith('.js') || path.endsWith('.ts')) {
      return match;
    }
    
    // Resolve the import path relative to the current file
    const currentDir = dirname(file);
    const resolvedPath = resolve(currentDir, `.${path}`);
    
    // Check if it's a .ts file
    if (existsSync(`${resolvedPath}.ts`)) {
      modified = true;
      return `from ${quote1}.${path}.js${quote2}`;
    }
    
    // Check if it's a directory with index.ts
    if (existsSync(resolvedPath) && statSync(resolvedPath).isDirectory()) {
      if (existsSync(join(resolvedPath, 'index.ts'))) {
        modified = true;
        return `from ${quote1}.${path}/index.js${quote2}`;
      }
    }
    
    // Default: assume it's a file and add .js
    modified = true;
    return `from ${quote1}.${path}.js${quote2}`;
  });
  
  // Also handle: import type { } from './path'
  content = content.replace(/import\s+type\s+\{[^}]+\}\s+from\s+(['"])\.([^'"]+)(['"])/g, (match, quote1, path, quote2) => {
    if (path.endsWith('.js') || path.endsWith('.ts')) {
      return match;
    }
    
    const currentDir = dirname(file);
    const resolvedPath = resolve(currentDir, `.${path}`);
    const importStatement = match.substring(0, match.lastIndexOf('from'));
    
    if (existsSync(`${resolvedPath}.ts`)) {
      modified = true;
      return `${importStatement}from ${quote1}.${path}.js${quote2}`;
    }
    
    if (existsSync(resolvedPath) && statSync(resolvedPath).isDirectory()) {
      if (existsSync(join(resolvedPath, 'index.ts'))) {
        modified = true;
        return `${importStatement}from ${quote1}.${path}/index.js${quote2}`;
      }
    }
    
    modified = true;
    return `${importStatement}from ${quote1}.${path}.js${quote2}`;
  });
  
  if (modified) {
    writeFileSync(file, content, 'utf-8');
    console.log(`Fixed: ${file}`);
  }
}

console.log('Done!');
