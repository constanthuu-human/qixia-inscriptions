import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

import { navigationPages, renderSiteNavigation } from "./site-navigation.mjs";

const root = process.cwd();
const errors = [];
const linkedLocalFiles = new Set();

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(filePath) : [filePath];
  });
}

function relative(filePath) {
  return path.relative(root, filePath);
}

function isExternal(reference) {
  return /^(?:data:|#|https?:|mailto:|tel:|\/\/)/.test(reference);
}

function resolveReference(reference, sourceFile) {
  const cleanReference = reference.split("#")[0].split("?")[0];
  if (!cleanReference) return null;
  return path.resolve(path.dirname(sourceFile), cleanReference);
}

function checkFileReference(reference, sourceFile) {
  if (isExternal(reference)) return;
  const resolved = resolveReference(reference, sourceFile);
  if (resolved) linkedLocalFiles.add(resolved);
  if (resolved && !fs.existsSync(resolved)) {
    errors.push(
      `${relative(sourceFile)} references missing file: ${reference}`,
    );
  }
}

const pagesDirectory = path.join(root, "pages");
const rootHtmlFiles = fs.readdirSync(root).filter((file) => file.endsWith(".html"));
const unexpectedRootPages = rootHtmlFiles.filter((file) => file !== "index.html");
if (unexpectedRootPages.length) {
  errors.push(`content pages must live in pages/: ${unexpectedRootPages.join(", ")}`);
}
const htmlFiles = [
  path.join(root, "index.html"),
  ...listFiles(pagesDirectory).filter((file) => file.endsWith(".html")),
].sort();

const dynamicAnchors = new Map([["temple-map.html", /^period-[1-6]$/]]);

for (const filePath of htmlFiles) {
  const file = path.basename(filePath);
  const html = fs.readFileSync(filePath, "utf8");
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
  const duplicateIds = [
    ...new Set(ids.filter((id, index) => ids.indexOf(id) !== index)),
  ];

  if (!/<head\b[\s\S]*<\/head>/.test(html))
    errors.push(`${file} has no explicit head element`);
  if (!/<body\b[\s\S]*<\/body>/.test(html))
    errors.push(`${file} has no explicit body element`);
  if (file !== "index.html" && !/<main\b[\s\S]*<\/main>/.test(html)) {
    errors.push(`${file} has no explicit main element`);
  }
  if (/<aside\b[^>]*\brole=["']dialog["']/.test(html)) {
    errors.push(`${file} assigns role="dialog" to an aside element`);
  }
  if (/data:image\//.test(html))
    errors.push(`${file} contains an embedded image`);
  if (/\sstyle=["']/.test(html)) errors.push(`${file} contains inline styles`);
  if (Buffer.byteLength(html) > 500_000) errors.push(`${file} exceeds 500 KB`);
  if (duplicateIds.length)
    errors.push(`${file} has duplicate IDs: ${duplicateIds.join(", ")}`);

  const h1Count = html.match(/<h1\b/g)?.length ?? 0;
  if (file !== "index.html" && h1Count !== 1) {
    errors.push(`${file} must have exactly one h1 element`);
  }
  for (const property of ["og:type", "og:title", "og:description"]) {
    if (!new RegExp(`<meta\\b[^>]*property=["']${property}["']`).test(html)) {
      errors.push(`${file} is missing ${property} metadata`);
    }
  }

  if (file === "inscriptions.html") {
    for (const [index, image] of [
      ...html.matchAll(/<img\b[^>]*>/g),
    ].entries()) {
      if (!/\bloading=["']lazy["']/.test(image[0])) {
        errors.push(`${file} image ${index + 1} is not lazy-loaded`);
      }
      if (!/\bdecoding=["']async["']/.test(image[0])) {
        errors.push(`${file} image ${index + 1} has no async decoding hint`);
      }
      if (
        !/\bwidth=["']\d+["']/.test(image[0]) ||
        !/\bheight=["']\d+["']/.test(image[0])
      ) {
        errors.push(`${file} image ${index + 1} has no intrinsic dimensions`);
      }
    }
  }

  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
    checkFileReference(match[1], filePath);
  }

  for (const match of html.matchAll(
    /<a\b([^>]*\btarget=["']_blank["'][^>]*)>/g,
  )) {
    if (!/\brel=["'][^"']*\bnoreferrer\b[^"']*["']/.test(match[1])) {
      errors.push(`${file} has target="_blank" without rel="noreferrer"`);
    }
  }

  for (const reference of [
    ...html.matchAll(/\bhref=["']([^"']*#[^"']+)["']/g),
  ].map((match) => match[1])) {
    if (/^(?:https?:|mailto:|tel:)/.test(reference)) continue;
    const [targetFileReference, targetId] = reference.split("#");
    const targetPath = targetFileReference
      ? path.resolve(path.dirname(filePath), targetFileReference)
      : filePath;
    if (!fs.existsSync(targetPath)) continue;
    const targetFile = path.basename(targetPath);
    const targetHtml = fs.readFileSync(targetPath, "utf8");
    const isDynamic = dynamicAnchors.get(targetFile)?.test(targetId) ?? false;
    const escapedId = targetId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (
      !isDynamic &&
      !new RegExp(`\\bid=["']${escapedId}["']`).test(targetHtml)
    ) {
      errors.push(`${file} references missing anchor: ${reference}`);
    }
  }
}

for (const file of navigationPages) {
  const html = fs.readFileSync(path.join(pagesDirectory, file), "utf8");
  const navigation = html.match(
    /<nav class="site-nav" aria-label="Website sections">[\s\S]*?<\/nav>/,
  )?.[0];
  const normalize = (markup) => markup?.replace(/\s+/g, " ").trim();
  if (normalize(navigation) !== normalize(renderSiteNavigation(file))) {
    errors.push(`${file} site navigation is out of sync; run npm run sync-nav`);
  }
  if (!html.includes('href="../index.html"'))
    errors.push(`${file} has no historical-network home link`);
  if (!html.includes('href="./inscriptions.html"'))
    errors.push(`${file} has no Qixia-inscriptions link`);
  const currentLinks = html.match(/\baria-current=["']page["']/g) ?? [];
  if (currentLinks.length !== 1)
    errors.push(`${file} must have exactly one aria-current="page" link`);
}

const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const requiredReference of [
  "./site.js",
  "./site.css",
  "./pages/inscriptions.html",
]) {
  if (!indexHtml.includes(requiredReference))
    errors.push(`index.html is missing ${requiredReference}`);
}

for (const obsoleteBundle of [
  "assets/index-CQGstJ3s.js",
  "assets/index-BRp7_Udq.css",
]) {
  if (fs.existsSync(path.join(root, obsoleteBundle)))
    errors.push(`${obsoleteBundle} is an obsolete duplicate bundle`);
}
if (fs.existsSync(path.join(root, "assets", "css", "index.css"))) {
  errors.push("assets/css/index.css is an obsolete duplicate stylesheet");
}

const assetFiles = listFiles(path.join(root, "assets"));
const linkedFiles = [...linkedLocalFiles].filter((file) => fs.existsSync(file));
const cssFiles = [
  ...new Set([
    ...assetFiles.filter((file) => file.endsWith(".css")),
    ...linkedFiles.filter((file) => file.endsWith(".css")),
  ]),
];
const jsFiles = [
  ...new Set([
    ...assetFiles.filter((file) => file.endsWith(".js")),
    ...linkedFiles.filter((file) => file.endsWith(".js")),
  ]),
];

for (const filePath of cssFiles) {
  const css = fs.readFileSync(filePath, "utf8");
  if (/\.\.intro\b/.test(css))
    errors.push(`${relative(filePath)} contains the invalid ..intro selector`);
  for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    checkFileReference(match[1], filePath);
  }
}

for (const filePath of jsFiles) {
  const js = fs.readFileSync(filePath, "utf8");
  const result = spawnSync(process.execPath, ["--check", filePath], {
    encoding: "utf8",
  });
  if (result.status !== 0)
    errors.push(`${relative(filePath)} has invalid JavaScript syntax`);
  for (const match of js.matchAll(
    /(?:import|export)\s+[\s\S]*?\sfrom\s*["']([^"']+)["']/g,
  )) {
    checkFileReference(match[1], filePath);
  }
}

const mapDataPath = path.join(root, "assets", "js", "temple-data.js");
const mapData = fs.readFileSync(mapDataPath, "utf8");
for (const match of mapData.matchAll(/["']([^"']+\.(?:png|jpe?g|webp))["']/g)) {
  checkFileReference(match[1], path.join(pagesDirectory, "temple-map.html"));
}

const imagePattern = /\.(?:png|jpe?g|webp)$/i;
const rootImageNames = fs.readdirSync(root).filter((file) => imagePattern.test(file));
if (rootImageNames.length) {
  errors.push(`images must live in assets/images/: ${rootImageNames.join(", ")}`);
}
const imageFiles = [
  ...rootImageNames.map((file) => path.join(root, file)),
  ...assetFiles.filter((file) => imagePattern.test(file)),
];
const imagesByHash = new Map();
for (const filePath of imageFiles) {
  const hash = crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
  const matches = imagesByHash.get(hash) ?? [];
  matches.push(relative(filePath));
  imagesByHash.set(hash, matches);
}
for (const matches of imagesByHash.values()) {
  if (matches.length > 1)
    errors.push(`duplicate image files: ${matches.join(", ")}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `Validated ${htmlFiles.length} pages, ${assetFiles.length} assets, ${cssFiles.length} stylesheets, ` +
    `${jsFiles.length} scripts, and all local references.`,
);
