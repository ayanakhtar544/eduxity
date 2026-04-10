/**
 * Fix all stale/broken import paths across the server/ directory.
 * Run this once after the folder restructure.
 */
const fs = require('fs');
const { execSync } = require('child_process');

const files = execSync('find server -type f \\( -name "*.ts" -o -name "*.tsx" \\)')
  .toString()
  .split('\n')
  .filter(Boolean);

let totalFixed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Fix stale @/app/api/_utils/response → @/server/utils/response
  content = content.replace(/from ["']@\/app\/api\/_utils\/response["']/g, 'from "@/server/utils/response"');

  // 2. Fix stale @/app/api/_utils/prisma → @/server/utils/prisma
  content = content.replace(/from ["']@\/app\/api\/_utils\/prisma["']/g, 'from "@/server/utils/prisma"');

  // 3. Fix stale @/app/api/_utils/feedRanking → @/server/utils/feedRanking
  content = content.replace(/from ["']@\/app\/api\/_utils\/feedRanking["']/g, 'from "@/server/utils/feedRanking"');

  // 4. Fix stale @/app/api/_utils/learning → @/server/utils/learning
  content = content.replace(/from ["']@\/app\/api\/_utils\/learning["']/g, 'from "@/server/utils/learning"');

  // 5. Fix non-aliased server/utils/* → @/server/utils/*
  content = content.replace(/from ["']server\/utils\/response["']/g, 'from "@/server/utils/response"');
  content = content.replace(/from ["']server\/utils\/prisma["']/g, 'from "@/server/utils/prisma"');
  content = content.replace(/from ["']server\/utils\/errorHandler["']/g, 'from "@/server/utils/errorHandler"');

  // 6. Fix stale @/prisma/generated/client → @/server/prisma/generated/client
  content = content.replace(/from ["']@\/prisma\/generated\/client["']/g, 'from "@/server/prisma/generated/client"');

  // 7. Fix @/services/ → @/server/services/ (old path before move)
  content = content.replace(/from ["']@\/services\//g, 'from "@/server/services/');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    totalFixed++;
  }
}

console.log(`\nDone. Fixed ${totalFixed} files.`);
