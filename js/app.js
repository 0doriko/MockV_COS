import {
  loadProfiles,
  getAllNames,
  buildProfileView,
  getDefaultPersonName,
  findPerson,
  nameToSlug,
} from "./profile-data.js";
import { profilePageUrl, getSiteRoot, getSlugFromPath } from "./paths.js";

const els = {
  breadcrumb: document.getElementById("breadcrumb"),
  personSelect: document.getElementById("person-select"),
  avatar: document.getElementById("profile-avatar"),
  name: document.getElementById("profile-name"),
  teamLine: document.getElementById("profile-team-line"),
  handle: document.getElementById("profile-handle"),
  email: document.getElementById("profile-email"),
  localTime: document.getElementById("profile-local-time"),
  tenure: document.getElementById("profile-tenure"),
  started: document.getElementById("profile-started"),
  location: document.getElementById("profile-location"),
  reportingLine: document.getElementById("reporting-line"),
  peersGrid: document.getElementById("peers-grid"),
  aboutBullets: document.getElementById("about-bullets"),
  resourceGroups: document.getElementById("resource-groups"),
  badges: document.getElementById("badges"),
};

function renderBreadcrumb(crumbs) {
  els.breadcrumb.innerHTML = crumbs
    .map((c, i) => {
      const sep = i < crumbs.length - 1 ? '<span class="crumb-sep">/</span>' : "";
      const cls = i === crumbs.length - 1 ? "crumb current" : "crumb";
      return `<span class="${cls}">${escapeHtml(c)}</span>${sep}`;
    })
    .join("");
}

function renderReportingLine(line) {
  els.reportingLine.innerHTML = line
    .map((node, i) => {
      const badge = node.reportBadge
        ? `<span class="report-badge" title="${node.directReports} direct reports">${escapeHtml(node.reportBadge)}</span>`
        : "";
      const cardClass = node.isCurrentUser ? "org-card current" : "org-card";
      const connector =
        i < line.length - 1
          ? '<div class="org-connector" aria-hidden="true"></div>'
          : "";
      const href = profilePageUrl(node.name);
      return `
        ${connector}
        <article class="${cardClass}" data-name="${escapeAttr(node.name)}">
          <div class="org-avatar-wrap">
            <img src="${escapeAttr(node.avatarUrl)}" alt="" width="48" height="48" loading="lazy" />
            ${badge}
          </div>
          <div class="org-card-text">
            <a href="${escapeAttr(href)}" class="org-name">${escapeHtml(node.name)}</a>
            <p class="org-role">${escapeHtml(node.role)}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderPeers(peers) {
  if (!peers.length) {
    els.peersGrid.innerHTML =
      '<p class="empty-inline">No peers found for this reporting structure.</p>';
    return;
  }
  els.peersGrid.innerHTML = peers
    .map(
      (p) => `
    <a class="peer-card" href="${escapeAttr(profilePageUrl(p.name))}">
      <img src="${escapeAttr(p.avatarUrl)}" alt="" width="40" height="40" loading="lazy" />
      <div>
        <span class="peer-name">${escapeHtml(p.name)}</span>
        <span class="peer-role">${escapeHtml(p.role)}</span>
      </div>
    </a>
  `
    )
    .join("");
}

function renderAbout(about) {
  els.aboutBullets.innerHTML = about.communicationPreferences
    .map((b) => `<li><span class="about-emoji">${b.emoji}</span> ${escapeHtml(b.text)}</li>`)
    .join("");

  els.resourceGroups.innerHTML = about.resourceGroups
    .map((g) => `<span class="pill">${escapeHtml(g)}</span>`)
    .join("");

  els.badges.innerHTML = about.badges
    .map((b) => `<span class="badge-icon" title="Badge">${b}</span>`)
    .join("");
}

function renderProfile(view) {
  const e = view.employee;
  document.title = `${e.name} — CompanyOS`;
  els.avatar.src = e.avatarUrl;
  els.avatar.alt = e.name;
  els.name.textContent = e.name;
  els.teamLine.textContent = e.teamLine;
  els.handle.textContent = e.handle;
  els.email.textContent = e.email;
  els.email.href = `mailto:${e.email}`;
  els.localTime.textContent = e.localTime;
  els.tenure.textContent = e.tenure;
  els.started.textContent = `Started ${e.started}`;
  els.location.textContent = e.location;

  renderBreadcrumb(view.breadcrumb);
  renderReportingLine(view.reportingLine);
  renderPeers(view.peers);
  renderAbout(view.aboutMe);
}

function populateSelector(names, selected) {
  els.personSelect.innerHTML = names
    .map(
      (n) =>
        `<option value="${escapeAttr(n)}" data-slug="${escapeAttr(nameToSlug(n))}"${n === selected ? " selected" : ""}>${escapeHtml(n)}</option>`
    )
    .join("");
}

function navigateToPerson(name) {
  window.location.href = profilePageUrl(name);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

async function init() {
  try {
    await loadProfiles();
    const names = getAllNames();

    const params = new URLSearchParams(window.location.search);
    const legacyPerson = params.get("person") || params.get("name");
    if (legacyPerson && findPerson(legacyPerson)) {
      navigateToPerson(legacyPerson);
      return;
    }

    const unknownSlug = getSlugFromPath() && !getDefaultPersonName();
    if (unknownSlug) {
      window.location.replace(`${getSiteRoot()}people/`);
      return;
    }

    let personName = getDefaultPersonName();
    if (!personName || !findPerson(personName)) {
      window.location.replace(`${getSiteRoot()}people/`);
      return;
    }

    populateSelector(names, personName);
    const view = buildProfileView(personName);
    if (view) renderProfile(view);

    els.personSelect.addEventListener("change", () => {
      navigateToPerson(els.personSelect.value);
    });

    setInterval(() => {
      const name = els.personSelect.value;
      const refreshed = buildProfileView(name);
      if (refreshed) els.localTime.textContent = refreshed.employee.localTime;
    }, 60_000);
  } catch (err) {
    document.body.innerHTML = `<main class="error-state"><h1>Could not load profiles</h1><p>${escapeHtml(err.message)}</p><p>Deploy to GitHub Pages or run <code>python3 -m http.server 8080</code> from the repo root.</p></main>`;
  }
}

init();
