const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const errors = [];
const warnings = [];

function fullPath(relativePath) {
  return path.join(root, String(relativePath || "").replace(/^\.\//, ""));
}

function readText(relativePath) {
  const target = fullPath(relativePath);

  if (!fs.existsSync(target)) {
    errors.push(`Missing ${relativePath}`);
    return "";
  }

  return fs.readFileSync(target, "utf8").replace(/^\uFEFF/, "");
}

function readJson(relativePath) {
  const source = readText(relativePath);
  if (!source) return null;

  try {
    return JSON.parse(source);
  } catch (error) {
    errors.push(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

function requireFile(relativePath, label = relativePath) {
  const target = fullPath(relativePath);

  if (!fs.existsSync(target)) {
    errors.push(`Missing ${label}: ${relativePath}`);
    return;
  }

  const stat = fs.statSync(target);

  if (!stat.isFile()) {
    errors.push(`${label} must be a file`);
    return;
  }

  if (stat.size === 0) {
    errors.push(`${label} is empty`);
  }
}

function requireRoute(relativePath) {
  requireFile(relativePath, `Expo Router screen`);
}

function envKeys(relativePath) {
  const source = readText(relativePath);
  const keys = new Set();

  source.split(/\r?\n/).forEach((line) => {
    const clean = line.trim();
    if (!clean || clean.startsWith("#") || !clean.includes("=")) return;
    keys.add(clean.slice(0, clean.indexOf("=")).trim());
  });

  return keys;
}

function validateEnvironment() {
  const exampleKeys = envKeys(".env.example");
  const requiredKeys = [
    "EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  ];

  requiredKeys.forEach((key) => {
    if (!exampleKeys.has(key)) {
      errors.push(`${key} is not documented in .env.example`);
    }
  });

  const gitignore = readText(".gitignore");
  if (!/(^|\n)\.env(\n|$)/.test(gitignore)) {
    errors.push(".env must be ignored by Git");
  }

  const localEnvPath = fullPath(".env");
  if (fs.existsSync(localEnvPath)) {
    const localEnv = fs.readFileSync(localEnvPath, "utf8");
    if (/service[_-]?role/i.test(localEnv)) {
      errors.push("Supabase service-role key must never be stored in the mobile app");
    }
  }
}

function validateRoutes() {
  [
    "src/app/index.tsx",
    "src/app/dashboard.tsx",
    "src/app/leads.tsx",
    "src/app/customers.tsx",
    "src/app/customer-360.tsx",
    "src/app/followups.tsx",
    "src/app/notifications.tsx",
    "src/app/search.tsx",
    "src/app/properties.tsx",
    "src/app/property-details.tsx",
    "src/app/settings.tsx",
  ].forEach(requireRoute);
}

function validateAppConfig(appConfig, packageConfig) {
  const expo = appConfig?.expo;

  if (!expo) {
    errors.push("app.json must contain an expo object");
    return;
  }

  if (expo.name !== "JMK CRM PRO") errors.push("expo.name must be JMK CRM PRO");
  if (expo.slug !== "jmk-mobile-crm") errors.push("expo.slug must be jmk-mobile-crm");
  if (expo.scheme !== "jmkmobile") errors.push("expo.scheme must be jmkmobile");
  if (!/^\d+\.\d+\.\d+$/.test(expo.version || "")) {
    errors.push("expo.version must use semantic versioning");
  }
  if (packageConfig?.version !== expo.version) {
    errors.push("package.json version and app.json expo.version must match");
  }
  if (expo.android?.package !== "com.jmkgroup.crm") {
    errors.push("Android package must be com.jmkgroup.crm");
  }
  if (!Number.isInteger(expo.android?.versionCode) || expo.android.versionCode < 1) {
    errors.push("android.versionCode must be a positive integer");
  }
  if (!expo.extra?.eas?.projectId) errors.push("EAS projectId is missing");
  if (expo.orientation !== "portrait") warnings.push("App orientation is not locked to portrait");
  if (!expo.newArchEnabled) warnings.push("React Native New Architecture is disabled");
  if (!expo.android?.edgeToEdgeEnabled) warnings.push("Android edge-to-edge is disabled");
  if (!Array.isArray(expo.android?.permissions) || !expo.android.permissions.includes("INTERNET")) {
    errors.push("Android INTERNET permission is required");
  }

  requireFile(expo.icon, "Expo icon");
  requireFile(expo.android?.adaptiveIcon?.foregroundImage, "Android adaptive foreground icon");
  requireFile("./assets/images/android-icon-background.png", "Android adaptive background image");
  requireFile("./assets/images/splash-icon.png", "Splash image");
  requireFile("./assets/images/jmk-logo-light.png", "JMK light logo");
  requireFile("./assets/images/jmk-logo-dark.png", "JMK dark logo");
}

function validateEasConfig(easConfig) {
  if (!easConfig) return;

  if (easConfig.cli?.requireCommit !== true) {
    warnings.push("eas.cli.requireCommit should be true for release builds");
  }
  if (easConfig.cli?.appVersionSource !== "remote") {
    warnings.push("EAS appVersionSource should be remote");
  }
  if (easConfig.build?.preview?.android?.buildType !== "apk") {
    errors.push("Preview build must generate an APK");
  }
  if (easConfig.build?.preview?.env?.APP_ENV !== "preview") {
    errors.push("Preview build APP_ENV must be preview");
  }
  if (easConfig.build?.production?.distribution !== "store") {
    errors.push("Production distribution must be store");
  }
  if (easConfig.build?.production?.android?.buildType !== "app-bundle") {
    errors.push("Production build must generate an Android App Bundle");
  }
  if (easConfig.build?.production?.env?.APP_ENV !== "production") {
    errors.push("Production build APP_ENV must be production");
  }
}

function validatePackage(packageConfig, tsConfig) {
  if (!packageConfig) return;

  if (packageConfig.main !== "expo-router/entry") {
    errors.push("package.json main must be expo-router/entry");
  }

  [
    "typecheck",
    "lint",
    "verify:release",
    "build:apk",
    "build:aab",
    "release:apk",
    "release:aab",
  ].forEach((scriptName) => {
    if (!packageConfig.scripts?.[scriptName]) {
      errors.push(`Missing npm script: ${scriptName}`);
    }
  });

  if (!packageConfig.dependencies?.expo) errors.push("Expo dependency is missing");
  if (!packageConfig.dependencies?.["expo-router"]) errors.push("Expo Router dependency is missing");
  if (!packageConfig.dependencies?.["@supabase/supabase-js"]) {
    errors.push("Supabase dependency is missing");
  }
  if (!packageConfig.dependencies?.["react-native-url-polyfill"]) {
    errors.push("react-native-url-polyfill dependency is missing");
  }

  if (!tsConfig?.compilerOptions?.strict) {
    errors.push("TypeScript strict mode must be enabled");
  }
}

const appConfig = readJson("app.json");
const easConfig = readJson("eas.json");
const packageConfig = readJson("package.json");
const tsConfig = readJson("tsconfig.json");

requireFile("package-lock.json", "npm lockfile");
requireFile("src/app/_layout.tsx", "Root layout");
requireFile("src/services/supabase.ts", "Supabase client");

validateEnvironment();
validateRoutes();
validateAppConfig(appConfig, packageConfig);
validateEasConfig(easConfig);
validatePackage(packageConfig, tsConfig);

if (warnings.length > 0) {
  console.warn("\nJMK release verification warnings:\n");
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}

if (errors.length > 0) {
  console.error("\nJMK release verification failed:\n");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("\nJMK release configuration verified successfully.");
console.log(`Version: ${appConfig.expo.version}`);
console.log(`Android package: ${appConfig.expo.android.package}`);
console.log(`Version code: ${appConfig.expo.android.versionCode}`);
console.log(`Preview output: ${easConfig.build.preview.android.buildType}`);
console.log(`Production output: ${easConfig.build.production.android.buildType}`);
console.log("Core routes, branding assets, Supabase environment and release scripts are present.");
