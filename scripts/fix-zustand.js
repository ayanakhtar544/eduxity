const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../node_modules/zustand/esm');

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  fs.readdirSync(directory).forEach(file => {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.mjs') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('import.meta.env')) {
        content = content.replace(/import\.meta\.env/g, '(process.env)');
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  });
}

walk(dir);
console.log('✅ Zustand import.meta.env patched successfully!');
