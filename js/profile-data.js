/**
 * Loads Profiles.json and derives CompanyOS-style profile views.
 * Designed so a Custom GPT can later return the same shape via API.
 */

import { getSlugFromPath, nameToSlug, resolveAsset } from "./paths.js";

const TIMEZONE_IANA = {
  EST: "America/New_York",
  PST: "America/Los_Angeles",
  CST: "America/Chicago",
  IST: "Asia/Kolkata",
  JST: "Asia/Tokyo",
  KST: "Asia/Seoul",
  CET: "Europe/Paris",
  EET: "Europe/Bucharest",
  GMT: "Europe/London",
};

const TIMEZONE_LOCATION = {
  EST: "United States (East)",
  PST: "United States (West)",
  CST: "United States (Central)",
  IST: "India",
  JST: "Japan",
  KST: "South Korea",
  CET: "Europe",
  EET: "Eastern Europe",
  GMT: "United Kingdom",
};

let profilesCache = null;
let byName = null;
let bySlug = null;

export { nameToSlug };

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function slugHandle(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return `@${parts[0].toLowerCase()}`;
  return `@${parts[0][0].toLowerCase()}${parts[parts.length - 1].toLowerCase()}`;
}

function fakeEmail(name) {
  const parts = name.trim().toLowerCase().split(/\s+/);
  if (parts.length < 2) return `${parts[0]}@example.com`;
  return `${parts[0]}.${parts[parts.length - 1]}@example.com`;
}

function fakeTenure(name) {
  const months = 6 + (hashString(name) % 48);
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const start = new Date();
  start.setMonth(start.getMonth() - months);
  const label =
    years > 0
      ? rem > 0
        ? `${years} year${years > 1 ? "s" : ""}, ${rem} month${rem > 1 ? "s" : ""}`
        : `${years} year${years > 1 ? "s" : ""}`
      : `${rem} month${rem > 1 ? "s" : ""}`;
  const started = start.toLocaleString("en-US", { month: "long", year: "numeric" });
  return { label, started };
}

function initials(name) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarUrl(name) {
  const enc = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${enc}&background=E8EEF7&color=1A56DB&size=128&bold=true`;
}

function countDirectReports(people, managerName) {
  if (!managerName) return 0;
  return people.filter((p) => p.reports_to === managerName).length;
}

function formatReportBadge(count) {
  if (count <= 0) return null;
  if (count >= 13) return "13+";
  if (count >= 8) return "8+";
  return String(count);
}

function getLocalTime(timezone) {
  const iana = TIMEZONE_IANA[timezone] || "UTC";
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: iana,
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return formatter.format(now);
}

function buildAboutBullets(person) {
  const style = person.communication_style || "";
  const goal = person.key_goal || "";
  const sentences = style
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const bullets = [];
  if (sentences[0]) bullets.push({ emoji: "💬", text: sentences[0] });
  if (sentences[1]) bullets.push({ emoji: "📌", text: sentences[1] });
  if (goal) bullets.push({ emoji: "🎯", text: `Current focus: ${goal}` });
  bullets.push({ emoji: "🤝", text: "Open to async updates with clear context upfront" });
  bullets.push({ emoji: "🔍", text: "Technical details are helpful when relevant" });
  return bullets.slice(0, 6);
}

function resourceGroupsFor(person) {
  const groups = ["SyncMind Pilot", "Cross-Functional Collab"];
  if (person.department?.includes("Customer")) groups.push("Customer Experience Guild");
  if (person.department?.includes("Engineering")) groups.push("Reliability Champions");
  if (person.department?.includes("Product")) groups.push("Product Council");
  return [...new Set(groups)].slice(0, 3);
}

function badgesFor(person) {
  const badges = ["🌟", "🛠️", "📊"];
  if (person.role?.includes("Manager") || person.role?.includes("Director")) {
    badges.push("👥");
  }
  if (person.role?.includes("Chief") || person.role?.includes("VP")) {
    badges.push("🏆");
  }
  return badges;
}

export async function loadProfiles() {
  if (profilesCache) return profilesCache;
  const res = await fetch(resolveAsset("Profiles.json"));
  if (!res.ok) throw new Error("Failed to load Profiles.json");
  const data = await res.json();
  profilesCache = data.company_structure || [];
  byName = new Map(profilesCache.map((p) => [p.name, p]));
  bySlug = new Map(profilesCache.map((p) => [nameToSlug(p.name), p]));
  return profilesCache;
}

export function getAllNames() {
  return profilesCache ? [...profilesCache.map((p) => p.name)].sort() : [];
}

export function findPerson(name) {
  return byName?.get(name) ?? null;
}

export function findPersonBySlug(slug) {
  if (!slug) return null;
  return bySlug?.get(slug.toLowerCase()) ?? null;
}

export function buildReportingLine(person, people) {
  const line = [];
  let current = person;
  const seen = new Set();

  while (current) {
    if (seen.has(current.name)) break;
    seen.add(current.name);
    const reports = countDirectReports(people, current.name);
    line.push({
      name: current.name,
      role: current.role,
      department: current.department,
      avatarUrl: avatarUrl(current.name),
      initials: initials(current.name),
      directReports: reports,
      reportBadge: formatReportBadge(reports),
      isCurrentUser: current.name === person.name,
    });
    if (!current.reports_to) break;
    current = findPerson(current.reports_to);
  }

  return line;
}

export function buildPeers(person, people) {
  if (!person.reports_to) {
    return people
      .filter((p) => !p.reports_to && p.name !== person.name)
      .map(peerCard);
  }
  return people
    .filter((p) => p.reports_to === person.reports_to && p.name !== person.name)
    .map(peerCard);
}

function peerCard(p) {
  return {
    name: p.name,
    role: p.role,
    avatarUrl: avatarUrl(p.name),
    initials: initials(p.name),
  };
}

export function buildBreadcrumb(person) {
  const crumbs = ["People"];
  const chain = [];
  let m = person.reports_to ? findPerson(person.reports_to) : null;
  while (m) {
    chain.unshift(m.name);
    m = m.reports_to ? findPerson(m.reports_to) : null;
  }
  if (chain.length > 2) {
    crumbs.push("…");
    crumbs.push(chain[chain.length - 1]);
  } else {
    crumbs.push(...chain);
  }
  crumbs.push(person.name);
  return crumbs;
}

/**
 * Full profile payload — same structure a Custom GPT endpoint could return.
 */
export function buildProfileView(personName) {
  const people = profilesCache;
  const person = findPerson(personName);
  if (!person) return null;

  const tenure = fakeTenure(person.name);
  const manager = person.reports_to ? findPerson(person.reports_to) : null;

  return {
    employee: {
      name: person.name,
      role: person.role,
      department: person.department,
      teamLine: `${person.role} on ${person.department}`,
      handle: slugHandle(person.name),
      email: fakeEmail(person.name),
      timezone: person.timezone,
      localTime: getLocalTime(person.timezone),
      location: TIMEZONE_LOCATION[person.timezone] || "Unknown",
      tenure: tenure.label,
      started: tenure.started,
      avatarUrl: avatarUrl(person.name),
      initials: initials(person.name),
      managerName: manager?.name ?? null,
    },
    breadcrumb: buildBreadcrumb(person),
    reportingLine: buildReportingLine(person, people),
    peers: buildPeers(person, people),
    aboutMe: {
      communicationPreferences: buildAboutBullets(person),
      resourceGroups: resourceGroupsFor(person),
      badges: badgesFor(person),
    },
    workstreams: [],
    meta: {
      source: "Profiles.json",
      generatedAt: new Date().toISOString(),
    },
  };
}

export function getDefaultPersonName() {
  const bodySlug = document.body?.dataset?.profileSlug;
  if (bodySlug) {
    const fromBody = findPersonBySlug(bodySlug);
    if (fromBody) return fromBody.name;
  }

  const config = document.getElementById("companyos-config");
  const configSlug = config?.dataset?.slug;
  if (configSlug) {
    const fromConfig = findPersonBySlug(configSlug);
    if (fromConfig) return fromConfig.name;
  }

  const pathSlug = getSlugFromPath();
  if (pathSlug) {
    const fromPath = findPersonBySlug(pathSlug);
    if (fromPath) return fromPath.name;
  }

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("person") || params.get("name");
  if (fromQuery && findPerson(fromQuery)) return fromQuery;

  return null;
}
