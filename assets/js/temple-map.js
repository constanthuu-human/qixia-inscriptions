import {
  CARD_IMAGES,
  DATA,
  IMAGES,
  PERIOD_CONTEXT,
  PERIOD_LABELS,
  PERIODS,
} from "./temple-data.js";
const byId = Object.fromEntries(DATA.map((x) => [x.id, x]));
const minX = 118.55,
  maxX = 119.12,
  minY = 31.87,
  maxY = 32.22;
function position(d) {
  return {
    left: (((d.lon - minX) / (maxX - minX)) * 100).toFixed(3) + "%",
    top: (((maxY - d.lat) / (maxY - minY)) * 100).toFixed(3) + "%",
  };
}
byId.dabaoen.time = "";
byId.dabaoen.status = "";
const atlas = document.querySelector("#atlas");
for (const [index, p] of PERIODS.entries()) {
  const sec = document.createElement("section");
  const context = PERIOD_CONTEXT[p.title],
    label = PERIOD_LABELS[index],
    isContemporary = index === 5;
  sec.className = "period";
  sec.id = "period-" + (index + 1);
  const lead = isContemporary
    ? ""
    : '<p class="period-lead">' + context.lead + "</p>";
  const caption = isContemporary
    ? '<p class="period-caption">' + context.lead + "</p>"
    : "";
  sec.innerHTML =
    '<div class="period-head"><div><h2><span class="period-era">' +
    label.era +
    '</span><span class="period-place">' +
    label.place +
    "</span></h2></div><div>" +
    lead +
    '</div></div><div class="map-frame"><div class="map"><img loading="lazy" src="' +
    IMAGES[p.image] +
    '" alt="Temple network map for ' +
    p.title +
    '"><div class="points"></div></div></div>' +
    caption;
  const points = sec.querySelector(".points");
  for (const id of p.ids) {
    const d = byId[id],
      b = document.createElement("button"),
      q = position(d);
    b.className = "hotspot";
    b.style.left = q.left;
    b.style.top = q.top;
    b.title = d.name + " · " + d.chinese;
    b.setAttribute("aria-label", "Open research card for " + d.name);
    b.onclick = () => openCard(d, label.era + " / " + label.place);
    points.append(b);
  }
  atlas.append(sec);
}
for (const hotspot of atlas.querySelectorAll(".hotspot")) {
  hotspot.type = "button";
  hotspot.setAttribute("aria-controls", "drawer");
  hotspot.setAttribute("aria-expanded", "false");
}
const drawer = document.querySelector("#drawer");
const sheet = drawer.querySelector(".sheet");
const closeButton = document.querySelector("#close");
const pageRegions = [document.querySelector(".header"), atlas].filter(Boolean);
let drawerTrigger = null;
let closeTimer = null;

function setPageInert(isInert) {
  for (const region of pageRegions) region.inert = isInert;
}

function openCard(d, p) {
  if (closeTimer !== null) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  drawerTrigger = document.activeElement;
  drawerTrigger?.setAttribute("aria-expanded", "true");
  document.querySelector("#dPeriod").textContent = p;
  document.querySelector("#dTitle").textContent = d.name;
  document.querySelector("#dCn").textContent = d.chinese;
  const time = document.querySelector("#dTime"),
    status = document.querySelector("#dStatus");
  time.textContent = d.time || "";
  status.textContent = d.status || "";
  time.hidden = !d.time;
  status.hidden = !d.status;
  const images = CARD_IMAGES[d.id] || [];
  const gallery = document.querySelector("#dImages");
  gallery.className = "card-gallery" + (images.length === 1 ? " single" : "");
  gallery.innerHTML = images
    .map(
      (src, i) =>
        '<img src="' +
        src +
        '" alt="' +
        d.name +
        " photograph " +
        (i + 1) +
        '" loading="lazy">',
    )
    .join("");
  document.querySelector("#dLead").textContent = d.lead || d.background;
  document.querySelector("#dDevelopment").textContent =
    d.development || d.background;
  document.querySelector("#dSignificance").textContent =
    d.significance || d.value;
  drawer.hidden = false;
  setPageInert(true);
  document.body.classList.add("drawer-open");
  requestAnimationFrame(() => {
    drawer.classList.add("open");
    sheet.focus();
  });
}

function closeDrawer() {
  if (!drawer.classList.contains("open")) return;
  drawer.classList.remove("open");
  document.body.classList.remove("drawer-open");
  const finish = () => {
    drawer.hidden = true;
    setPageInert(false);
    drawerTrigger?.setAttribute("aria-expanded", "false");
    drawerTrigger?.focus();
    drawerTrigger = null;
  };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) finish();
  else
    closeTimer = setTimeout(() => {
      closeTimer = null;
      finish();
    }, 280);
}

closeButton.addEventListener("click", closeDrawer);
drawer.addEventListener("click", (e) => {
  if (e.target === drawer) closeDrawer();
});
document.addEventListener("keydown", (e) => {
  if (!drawer.classList.contains("open")) return;
  if (e.key === "Escape") {
    e.preventDefault();
    closeDrawer();
    return;
  }
  if (e.key === "Tab") {
    const focusable = [
      ...sheet.querySelectorAll(
        'button,[href],[tabindex]:not([tabindex="-1"])',
      ),
    ].filter((element) => !element.hidden);
    const first = focusable[0],
      last = focusable.at(-1);
    if (
      e.shiftKey &&
      (document.activeElement === first || document.activeElement === sheet)
    ) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
