const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const errors = [];

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing ${relativePath}`);
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (error) {
    errors.push(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

function requireFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    errors.push(`Missing ${relativePath}`);
  }
}

const appConfig = readJson("app.json");
const easConfig = readJson("eas.json");
const packageConfig = readJson("package.json");

if (appConfig?.expo) {
  const expo = appConfig.expo;
  if (expo.name !== "JMK CRM PRO") errors.push("expo.name must be JMK CRM PRO");
  if (!/^\d+\.\d+\.\d+$/.test(expo.version || "")) errors.push("expo.version must use semantic versioning");
  if (expo.android?.package !== "com.jmkgroup.crm") errors.push("Android package must be com.jmkgroup.crm");
  if (!Number.isInteger(expo.android?.versionCode) || expo.android.versionCode < 1) {
    errors.push("android.versionCode must be a positive integer");
  }
  requireFile(expo.icon);
  requireFile(expo.android?.adaptiveIcon?.foregroundImage);
  requireFile(expo.splash?.image || "assets/images/splash-icon.png");
}

if (easConfig) {
  if (easConfig.build?.preview?.android?.buildType !== "apk") {
    errors.push("Preview build must generate an APK");
  }
  if (easConfig.build?.production?.android?.buildType !== "app-bundle") {
    errors.push("Production build must generate an Android App Bundle");
  }
}

if (packageConfig && packageConfig.version !== appConfig?.expo?.version) {
  errors.push("package.json version and app.json expo.version must match");
}

if (errors.length > 0) {
  console.error("\nJMK release verification failed:\n");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("JMK release configuration verified successfully.");
console.log(`Version: ${appConfig.expo.version}`);
console.log(`Android package: ${appConfig.expo.android.package}`);
console.log(`Version code: ${appConfig.expo.android.versionCode}`);
