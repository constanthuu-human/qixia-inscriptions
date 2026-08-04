export const navigationPages = [
  "temple-map.html",
  "monk-day.html",
  "monks.html",
  "buddhist-objects.html",
  "buddhist-images.html",
  "buddhist-legends.html",
  "buddhist-branches.html",
];

const navigationLinks = [
  ["index.html", "Historical network"],
  ["temple-map.html", "Qixia map"],
  ["monk-day.html", "A day as a monk"],
  ["monks.html", "Monks in the Jiankang story"],
  ["buddhist-objects.html", "Buddhist objects and places"],
  ["buddhist-images.html", "Buddhist images"],
  ["buddhist-legends.html", "Buddhist legends in Nanjing"],
  ["buddhist-branches.html", "Buddhist branches in Nanjing"],
  ["inscriptions.html", "Qixia inscriptions"],
];

export function renderSiteNavigation(currentPage) {
  const links = navigationLinks.map(([page, label]) => {
    const current = page === currentPage ? ' aria-current="page"' : "";
    const href = page === "index.html" ? "../index.html" : `./${page}`;
    return `        <a href="${href}"${current}>${label}</a>`;
  });

  return [
    '    <nav class="site-nav" aria-label="Website sections">',
    ...links,
    "    </nav>",
  ].join("\n");
}
