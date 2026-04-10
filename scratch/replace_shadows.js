const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = execSync('find app components -type f -name "*.tsx" -o -name "*.ts"').toString().split('\n').filter(Boolean);

for (let file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace view shadows
  content = content.replace(/shadowColor:\s*['"][^'"]+['"],?\s*/g, '');
  content = content.replace(/shadowOffset:\s*\{\s*width:\s*\-?\d+,\s*height:\s*\-?\d+\s*\},?\s*/g, '');
  content = content.replace(/shadowOpacity:\s*[0-9.]+,?\s*/g, '');
  content = content.replace(/shadowRadius:\s*[0-9.]+,?\s*/g, 'boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",\n    ');

  // Replace text shadows
  content = content.replace(/textShadowColor:\s*['"][^'"]+['"],?\s*/g, '');
  content = content.replace(/textShadowOffset:\s*\{\s*width:\s*\-?\d+,\s*height:\s*\-?\d+\s*\},?\s*/g, 'textShadow: "0px 2px 4px rgba(0,0,0,0.5)",\n    ');
  content = content.replace(/textShadowRadius:\s*[0-9.]+,?\s*/g, '');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
}
