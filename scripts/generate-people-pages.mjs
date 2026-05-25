#!/usr/bin/env node
/**
 * Generates static per-person pages for GitHub Pages.
 * Run after changing Profiles.json: node scripts/generate-people-pages.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const profilesPath = path.join(root, "Profiles.json");
const peopleDir = path.join(root, "people");

function nameToSlug(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function personPageHtml(name, slug) {
  const title = escapeHtml(name);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} — CompanyOS</title>
    <link rel="stylesheet" href="../../styles.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <script id="companyos-config" type="application/json" data-asset-base="../../" data-slug="${slug}"></script>
  </head>
  <body data-profile-slug="${slug}">
    <header class="top-bar">
      <div class="brand">
        <a href="../../people/" class="brand-link">
          <span class="brand-mark" aria-hidden="true"></span>
          <span class="brand-name">companyOS</span>
        </a>
      </div>
      <label class="person-picker">
        <span class="visually-hidden">View profile for</span>
        <select id="person-select" aria-label="Select employee profile"></select>
      </label>
    </header>

    <main class="page">
      <nav id="breadcrumb" class="breadcrumb" aria-label="Breadcrumb"></nav>

      <section class="card profile-header">
        <div class="profile-main">
          <img id="profile-avatar" class="profile-avatar" src="" alt="" width="120" height="120" />
          <div class="profile-identity">
            <h1 id="profile-name" class="profile-name"></h1>
            <p class="profile-team">
              <span id="profile-team-line"></span>
              <button type="button" class="icon-btn" aria-label="Edit role (demo)" disabled>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </p>
          </div>
        </div>
        <div class="quick-info">
          <div class="info-cell">
            <span class="info-label">
              <svg class="info-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2 12l20-9-9 20-2-7-9-4z" fill="currentColor" />
              </svg>
              Say hey
            </span>
            <span id="profile-handle" class="info-primary"></span>
            <a id="profile-email" class="info-link" href="#"></a>
          </div>
          <div class="info-cell">
            <span class="info-label">
              <svg class="info-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none" />
                <path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
              Current time
            </span>
            <span id="profile-local-time" class="info-primary"></span>
          </div>
          <div class="info-cell">
            <span class="info-label">
              <svg class="info-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2" fill="none" />
                <path d="M8 6V4h8v2" stroke="currentColor" stroke-width="2" />
              </svg>
              At company
            </span>
            <span id="profile-tenure" class="info-primary"></span>
            <span id="profile-started" class="info-secondary"></span>
          </div>
          <div class="info-cell">
            <span class="info-label">
              <svg class="info-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z"
                  stroke="currentColor"
                  stroke-width="2"
                  fill="none"
                />
              </svg>
              Location
            </span>
            <span id="profile-location" class="info-primary"></span>
            <a href="#" class="info-link" onclick="return false">View people nearby</a>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="section-head">
          <h2><span class="section-icon" aria-hidden="true">◇</span> Organization</h2>
          <div class="section-actions">
            <div class="toggle-group" role="group" aria-label="Organization view">
              <button type="button" class="toggle active" aria-pressed="true">Reporting line</button>
              <button type="button" class="toggle" aria-pressed="false" disabled>Teams</button>
            </div>
            <button type="button" class="icon-btn" aria-label="Expand (demo)" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8 3H3v5M16 3h5v5M16 21h5v-5M8 21H3v-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </div>
        <div id="reporting-line" class="reporting-line" role="list"></div>
      </section>

      <section class="card">
        <div class="section-head">
          <h2><span class="section-icon" aria-hidden="true">◇</span> Peers</h2>
        </div>
        <div id="peers-grid" class="peers-grid"></div>
      </section>

      <section class="card">
        <div class="section-head">
          <h2><span class="section-icon" aria-hidden="true">◇</span> Workstreams</h2>
        </div>
        <div class="empty-state">
          <div class="empty-illustration" aria-hidden="true">📋</div>
          <p class="empty-title">No Workstreams just yet</p>
          <p class="empty-body">Workstreams will show up here once added, so check again later!</p>
        </div>
      </section>

      <section class="card">
        <div class="section-head">
          <h2><span class="section-icon" aria-hidden="true">◇</span> About me</h2>
        </div>
        <div class="about-grid">
          <div>
            <h3 class="about-subhead">Communication preferences</h3>
            <ul id="about-bullets" class="about-list"></ul>
          </div>
          <div class="about-side">
            <div>
              <h3 class="about-subhead">Resource groups</h3>
              <div id="resource-groups" class="pill-row"></div>
            </div>
            <div>
              <h3 class="about-subhead">Badges</h3>
              <div id="badges" class="badge-row"></div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <script type="module" src="../../js/app.js"></script>
  </body>
</html>
`;
}

function peopleIndexHtml(people) {
  const cards = people
    .map((p) => {
      const slug = nameToSlug(p.name);
      const href = `./${slug}/`;
      return `<li><a class="people-link" href="${href}"><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.role)}</span></a></li>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>People — CompanyOS</title>
    <link rel="stylesheet" href="../styles.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <script id="companyos-config" data-asset-base="../"></script>
  </head>
  <body class="people-directory">
    <header class="top-bar">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true"></span>
        <span class="brand-name">companyOS</span>
      </div>
    </header>
    <main class="page">
      <h1 class="directory-title">People</h1>
      <p class="directory-sub">Select a profile — each person has a shareable page.</p>
      <ul class="people-directory-list">${cards}</ul>
    </main>
  </body>
</html>
`;
}

const data = JSON.parse(fs.readFileSync(profilesPath, "utf8"));
const people = data.company_structure || [];

if (fs.existsSync(peopleDir)) {
  for (const entry of fs.readdirSync(peopleDir, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== ".git") {
      fs.rmSync(path.join(peopleDir, entry.name), { recursive: true, force: true });
    }
  }
} else {
  fs.mkdirSync(peopleDir, { recursive: true });
}

const slugs = new Map();
for (const person of people) {
  const slug = nameToSlug(person.name);
  if (slugs.has(slug)) {
    console.error(`Duplicate slug "${slug}" for ${person.name}`);
    process.exit(1);
  }
  slugs.set(slug, person.name);
  const dir = path.join(peopleDir, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), personPageHtml(person.name, slug));
  console.log(`  people/${slug}/`);
}

fs.writeFileSync(path.join(peopleDir, "index.html"), peopleIndexHtml(people));
console.log("  people/index.html");
console.log(`Generated ${people.length} profile pages.`);
