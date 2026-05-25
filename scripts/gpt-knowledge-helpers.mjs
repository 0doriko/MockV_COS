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

const MESSAGE_EXAMPLES = {
  "Marcus Reed": `🔥 Hey Marcus — ⚡️ admin console load failures spiking in APJ + EMEA!! 🛠️ 12+ cases / 48 hrs 📉 smells like auth/API 😬 Can your team claim ownership + bump priority on investigation? ✅🚀`,
  "Maya Chen": `• Situation: Regional admin console loading failures (APJ + EMEA)
• Volume: 12+ cases in the last 48 hours
• Teams affected: Support, Engineering, Incident Response
• Ask: Align Support guidance and tagging so cases route consistently while we escalate`,
  "Linh Tran": `Issue: Admin console loading failures elevated across APJ and EMEA
Details: 12+ tickets in 48 hours; suspected auth/API correlation; need breakdown by region, account tier, and error signature
Ask: Pull ticket volume for admin console loading failures (48h), segmented by region, tier, and error pattern`,
};

export function enrichEmployee(person) {
  const iana = person.timezone_iana || TIMEZONE_IANA[person.timezone] || "UTC";
  return {
    ...person,
    timezone_iana: iana,
    location_detail: person.location_detail || "Location not set",
  };
}

export function buildGptOutput(person) {
  const p = enrichEmployee(person);
  const example = MESSAGE_EXAMPLES[p.name] || null;
  return {
    copy_exactly: {
      name: p.name,
      role: p.role,
      location_detail: p.location_detail,
      time_zone: p.timezone,
      timezone_iana: p.timezone_iana,
      good_time_to_contact: p.good_contact_time,
    },
    local_time_rule:
      "At response time, compute this person's current local time using timezone_iana and show it in output (e.g. 'Sunday 7:01 PM'). Never write 'Local time unavailable'.",
    tailored_message_format: p.tailored_message_format,
    tailored_message_shape_example: example,
    tailored_message_must_not:
      "Do NOT use the same paragraph format as other stakeholders. Follow tailored_message_format exactly.",
    never_use: [
      "Local time unavailable",
      "Local time unknown",
      "PM Owner",
      "Support Manager",
      "Engineering Lead",
      "Admin Console Product Manager",
    ],
  };
}

export function buildGptKnowledgePayload(people, profilesBySlug, siteBaseUrl) {
  const enriched = people.map(enrichEmployee);
  const bySlug = {};
  for (const [slug, profile] of Object.entries(profilesBySlug)) {
    const emp = enrichEmployee(profile.employee);
    bySlug[slug] = {
      ...profile,
      employee: emp,
      gpt_output: buildGptOutput(emp),
    };
  }

  return {
    dataset: "profiles_gpt_v1",
    version: "1.2.0",
    description:
      "Mock CompanyOS employee data for Custom GPT Knowledge. Each person has a unique tailored_message_format and location for local time.",
    site_reference: siteBaseUrl,
    generated_at: new Date().toISOString(),
    gpt_required_rules: {
      data_file: "profiles_gpt_v1.json",
      output_sections_in_order: [
        "Name & Role",
        "Location & local time",
        "Why contact",
        "Tailored message",
      ],
      location_and_time:
        "For each person, show: **Location & local time:** {location_detail} — {compute current time from timezone_iana} ({timezone}). Example: 'Chicago, Illinois, United States — Sunday 7:01 PM (CST)'.",
      tailored_message_rule:
        "CRITICAL: Each Tailored message MUST follow that person's tailored_message_format in profiles_by_slug[slug].gpt_output. Marcus = heavy emoji. Maya = bullets only. Linh = Issue / Details / Ask sections. Never use one shared paragraph style for everyone.",
      use_real_names_only: true,
      forbidden_output_phrases: ["Local time unavailable", "Local time unknown"],
      forbidden_generic_names: [
        "PM Owner",
        "Support Manager",
        "Engineering Lead",
        "Admin Console Product Manager",
      ],
    },
    scenario_hints: {
      admin_console_loading_or_auth_api_issue: {
        use_these_real_names: [
          "Marcus Reed",
          "Maya Chen",
          "Linh Tran",
          "Priya Sharma",
          "Mateo Alvarez",
        ],
      },
    },
    company_structure: enriched,
    profiles_by_slug: bySlug,
    slug_index: enriched.map((p) => ({
      name: p.name,
      slug: p.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
      location_detail: p.location_detail,
      timezone_iana: p.timezone_iana,
    })),
  };
}
