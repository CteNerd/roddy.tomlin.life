import { profile } from "../src/profile.js";

export const siteUrl = "https://roddy.tomlin.life/";
export const sharingImage = new URL("roddy-headshot.jpg", siteUrl).href;
export const pages = {
  home: {
    path: "",
    title: "Roddy Tomlin | Engineering Leadership",
    description: "Roddy Tomlin, Director of Software Engineering at FMG and former NFL player with the Jacksonville Jaguars and Atlanta Falcons. Engineering leadership, platform reliability, and responsible AI.",
  },
  experience: {
    path: "experience.html",
    title: "Experience | Roddy Tomlin",
    description: "Explore Roddy Tomlin's software engineering career, from development and architecture to Director of Software Engineering at FMG, plus education at Murray State University.",
  },
};

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function renderMetadata(page) {
  if (page === "notFound") {
    return '<title>Page not found | Roddy Tomlin</title>\n<meta name="robots" content="noindex, follow" />';
  }
  const details = pages[page];
  if (!details) throw new Error(`Unknown metadata page: ${page}`);
  const url = new URL(details.path, siteUrl).href;
  const person = {
    "@type": "Person",
    "@id": `${siteUrl}#person`,
    name: profile.name,
    url: siteUrl,
    image: sharingImage,
    jobTitle: profile.title,
    worksFor: { "@type": "Organization", name: profile.company },
    sameAs: [profile.linkedin],
  };
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}#profile`,
    url,
    name: details.title,
    description: details.description,
    inLanguage: "en",
    mainEntity: person,
  };
  const tags = [
    `<title>${escapeHtml(details.title)}</title>`,
    `<meta name="description" content="${escapeHtml(details.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
  ];
  for (const [property, value] of Object.entries({
    "og:type": "profile",
    "og:site_name": profile.name,
    "og:locale": "en_US",
    "og:title": details.title,
    "og:description": details.description,
    "og:url": url,
    "og:image": sharingImage,
    "og:image:type": "image/jpeg",
    "og:image:width": "721",
    "og:image:height": "901",
    "og:image:alt": "Roddy Tomlin smiling in a navy jacket",
  })) {
    tags.push(`<meta property="${property}" content="${escapeHtml(value)}" />`);
  }
  for (const [name, value] of Object.entries({
    "twitter:card": "summary",
    "twitter:title": details.title,
    "twitter:description": details.description,
    "twitter:image": sharingImage,
    "twitter:image:alt": "Roddy Tomlin smiling in a navy jacket",
  })) {
    tags.push(`<meta name="${name}" content="${escapeHtml(value)}" />`);
  }
  tags.push(`<script type="application/ld+json">${JSON.stringify(structuredData).replaceAll("<", "\\u003c")}</script>`);
  return tags.join("\n");
}

export function applyMetadata(html, page) {
  const marker = /<!-- profile-metadata:start -->[\s\S]*?<!-- profile-metadata:end -->/;
  if (!marker.test(html)) throw new Error("Missing profile metadata template boundary");
  return html.replace(marker, () => renderMetadata(page));
}

export function renderSitemap() {
  const urls = Object.values(pages).map(({ path }) => `<url><loc>${new URL(path, siteUrl).href}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>\n`;
}
