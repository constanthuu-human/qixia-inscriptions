import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { navigationPages, renderSiteNavigation } from "./site-navigation.mjs";

const root = process.cwd();
const navigationPattern = /\s*<nav class="site-nav" aria-label="Website sections">[\s\S]*?<\/nav>/;

for (const file of navigationPages) {
  const filePath = path.join(root, "pages", file);
  const html = fs.readFileSync(filePath, "utf8");
  if (!navigationPattern.test(html)) throw new Error(`${file} has no shared site navigation`);

  const updated = html.replace(navigationPattern, `\n${renderSiteNavigation(file)}`);
  fs.writeFileSync(filePath, updated);
}

console.log(`Synchronized navigation in ${navigationPages.length} pages.`);
