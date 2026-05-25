/**
 * Path helpers for GitHub Pages (repo subpaths) and per-person URLs.
 */

/** URL slug from display name, e.g. "Maya Chen" → "maya-chen" */
export function nameToSlug(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Site root with trailing slash, e.g. "/Fake_CompanyOS/" or "/".
 * Works on github.io project pages and local dev.
 */
export function getSiteRoot() {
  let path = window.location.pathname;
  if (!path.endsWith("/")) {
    const last = path.split("/").pop() || "";
    if (last.includes(".")) {
      path = path.slice(0, path.lastIndexOf("/") + 1);
    } else {
      path += "/";
    }
  }
  path = path.replace(/people\/[^/]+\/?$/i, "");
  if (!path.endsWith("/")) path += "/";
  return path;
}

/** Relative prefix to repo root assets from the current page depth. */
export function getAssetBase() {
  const cfg = document.getElementById("companyos-config");
  if (cfg?.dataset?.assetBase) {
    const base = cfg.dataset.assetBase;
    return base.endsWith("/") ? base : `${base}/`;
  }
  const root = getSiteRoot();
  const current = window.location.pathname;
  if (current === root || current === root.slice(0, -1)) return "./";
  const rel = current.slice(root.length);
  const depth = rel.split("/").filter(Boolean).length;
  if (depth <= 0) return "./";
  return "../".repeat(depth);
}

/** Canonical profile page URL for an employee. */
export function profilePageUrl(name) {
  const slug = nameToSlug(name);
  return `${getSiteRoot()}people/${slug}/`;
}

/** Read slug from /people/:slug/ path. */
export function getSlugFromPath() {
  const root = getSiteRoot();
  const rel = window.location.pathname.slice(root.length);
  const match = rel.match(/^people\/([^/]+)\/?$/i);
  return match ? match[1].toLowerCase() : null;
}

export function resolveAsset(path) {
  const base = getAssetBase();
  const clean = path.replace(/^\.\//, "");
  return `${base}${clean}`;
}
