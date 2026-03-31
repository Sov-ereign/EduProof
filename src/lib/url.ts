export type EvidenceType = "github" | "google-docs" | "loom" | "portfolio" | "other";

const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);
const GOOGLE_DOCS_HOSTS = new Set(["docs.google.com", "drive.google.com"]);
const LOOM_HOSTS = new Set(["loom.com", "www.loom.com"]);
const PORTFOLIO_HOST_HINTS = ["portfolio", "behance", "dribbble"];

export function parseUrlSafe(rawUrl: string): URL | null {
  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
}

export function detectEvidenceType(rawUrl: string): EvidenceType {
  const parsed = parseUrlSafe(rawUrl);
  if (!parsed) {
    return "other";
  }

  const host = parsed.hostname.toLowerCase();
  const href = parsed.href.toLowerCase();

  if (GITHUB_HOSTS.has(host)) return "github";
  if (GOOGLE_DOCS_HOSTS.has(host)) return "google-docs";
  if (LOOM_HOSTS.has(host)) return "loom";
  if (PORTFOLIO_HOST_HINTS.some((hint) => host.includes(hint) || href.includes(hint))) {
    return "portfolio";
  }

  return "other";
}

export function parseGitHubRepoUrl(rawUrl: string): { owner: string; repo: string } | null {
  const parsed = parseUrlSafe(rawUrl);
  if (!parsed) {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (!GITHUB_HOSTS.has(host)) {
    return null;
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    return null;
  }

  const owner = segments[0];
  const repo = segments[1].replace(/\.git$/i, "");
  if (!owner || !repo) {
    return null;
  }

  return { owner, repo };
}
