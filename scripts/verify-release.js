const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const errors = [];
const warnings = [];

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing ${relativePath}`);
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    errors.push(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

function resolveProjectPath(relativePath) {
  if (typeof relativePath !== "string" || !relativePath.trim()) return "";
  return path.join(root, relativePath.replace(/^\.\//, ""));
}

function requireFile(relativePath, label = relativePath) {
  const fullPath = resolveProjectPath(relativePath);
  if (!fullPath || !fs.existsSync(fullPath)) {
    errors.push(`Missing ${label}`);
    return;
  }

  if (!fs.statSync(fullPath).isFile()) {
    errors.push(`${label} must be a file`);
  }
}

function requireEnvKey(key) {
  const envExamplePath = path.join(root, ".env.example");
  if (!fs.existsSync(envExamplePath)) {
    warnings.push(".env.example is missing");
    return;
  }

  const content = fs.readFileSync(envExamplePath, "utf8");
  const present = content
    .split(/\r?\n/)
    .some((line) => line.trim().startsWith(`${key}=`));

  if (!present) warnings.push(`${key} is not documented in .env.example`);
}

const appConfig = readJson("app.json");
const easConfig = readJson("eas.json");
const packageConfig = readJson("package.json");
const tsConfig = readJson("tsconfig.json");

if (appConfig?.expo) {
  const expo = appConfig.expo;

  if (expo.name !== "JMK CRM PRO") errors.push("expo.name must be JMK CRM PRO");
  if (expo.slug !== "jmk-mobile-crm") errors.push("expo.slug must be jmk-mobile-crm");
  if (expo.scheme !== "jmkmobile") errors.push("expo.scheme must be jmkmobile");
  if (!/^\d+\.\d+\.\d+$/.test(expo.version || "")) {
    errors.push("expo.version must use semantic versioning");
  }
  if (expo.android?.package !== "com.jmkgroup.crm") {
    errors.push("Android package must be com.jmkgroup.crm");
  }
  if (!Number.isInteger(expo.android?.versionCode) || expo.android.versionCode < 1) {
    errors.push("android.versionCode must be a positive integer");
  }
  if (expo.orientation !== "portrait") warnings.push("App orientation is not locked to portrait");
  if (!expo.newArchEnabled) warnings.push("React Native New Architecture is disabled");
  if (!expo.android?.edgeToEdgeEnabled) warnings.push("Android edge-to-edge is disabled");
  if (!Array.isArray(expo.android?.permissions) || !expo.android.permissions.includes("INTERNET")) {
    errors.push("Android INTERNET permission is required");
  }

  requireFile(expo.icon, "Expo icon");
  requireFile(expo.android?.adaptiveIcon?.foregroundImage, "Android adaptive foreground icon");
  requireFile("./assets/images/splash-icon.png", "Splash image");
}

if (easConfig) {
  if (easConfig.cli?.requireCommit !== true) {
    warnings.push("eas.cli.requireCommit should be true for release builds");
  }
  if (easConfig.build?.preview?.android?.buildType !== "apk") {
    errors.push("Preview build must generate an APK");
  }
  if (easConfig.build?.production?.android?.buildType !== "app-bundle") {
    errors.push("Production build must generate an Android App Bundle");
  }
  if (easConfig.build?.production?.env?.APP_ENV !== "production") {
    errors.push("Production build APP_ENV must be production");
  }
}

if (packageConfig) {
  if (packageConfig.version !== appConfig?.expo?.version) {
    errors.push("package.json version and app.json expo.version must match");
  }
  if (packageConfig.main !== "expo-router/entry") {
    errors.push("package.json main must be expo-router/entry");
  }

  ["typecheck", "build:apk", "build:aab"].forEach((scriptName) => {
    if (!packageConfig.scripts?.[scriptName]) {
      errors.push(`Missing npm script: ${scriptName}`);
    }
  });
}

if (!tsConfig?.compilerOptions?.strict) {
  errors.push("TypeScript strict mode must be enabled");
}

requireEnvKey("EXPO_PUBLIC_SUPABASE_URL");
requireEnvKey("EXPO_PUBLIC_SUPABASE_ANON_KEY");

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
console.log(`Release profile: ${easConfig.build.production.android.buildType}`);
