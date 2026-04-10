const fs = require("fs");
const path = require("path");

const targetFile = path.join(
  __dirname,
  "..",
  "node_modules",
  "react-native-reanimated",
  "scripts",
  "validate-worklets-version.js",
);

if (!fs.existsSync(targetFile)) {
  process.exit(0);
}

const source = fs.readFileSync(targetFile, "utf8");
const patched = source.replace(
  "const semverSatisfies = require('semver/functions/satisfies');\nconst semverPrerelease = require('semver/functions/prerelease');",
  "const { prerelease: semverPrerelease, satisfies: semverSatisfies } = require('semver');",
);

if (patched !== source) {
  fs.writeFileSync(targetFile, patched, "utf8");
}
