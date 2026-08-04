const contentPages = new Set([
  "buddhist-branches.html",
  "buddhist-images.html",
  "buddhist-legends.html",
  "buddhist-objects.html",
  "figures.html",
  "inscriptions.html",
  "maps.html",
  "monk-day.html",
  "monks.html",
  "temple-map.html",
]);

const projectRoot = new URL("./", window.location.href);

function rewriteLink(link) {
  const reference = link.getAttribute("href");
  if (!reference || reference.startsWith("#")) return;

  const url = new URL(reference, document.baseURI);
  const file = url.pathname.split("/").at(-1);
  if (url.origin !== window.location.origin || !contentPages.has(file)) return;
  if (url.pathname.includes("/pages/")) return;

  const destination = new URL(`pages/${file}`, projectRoot);
  destination.search = url.search;
  destination.hash = url.hash;
  link.href = destination.href;
}

function rewriteLinks(root) {
  if (root instanceof HTMLAnchorElement) rewriteLink(root);
  for (const link of root.querySelectorAll?.("a[href]") ?? []) rewriteLink(link);
}

rewriteLinks(document);

new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "attributes") rewriteLink(mutation.target);
    for (const node of mutation.addedNodes) {
      if (node instanceof Element) rewriteLinks(node);
    }
  }
}).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["href"],
  childList: true,
  subtree: true,
});
