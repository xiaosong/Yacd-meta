// releases/download/Prerelease-Alpha/version.txt would be the obvious source, but github.com
// redirects it to release-assets.githubusercontent.com and neither response carries CORS headers,
// so a browser cannot read it. api.github.com does send `Access-Control-Allow-Origin: *`
// (unauthenticated limit: 60 requests/hour per IP).
const REPO_API = 'https://api.github.com/repos/MetaCubeX/mihomo';

export const MIHOMO_RELEASES_URL = 'https://github.com/MetaCubeX/mihomo/releases';

/**
 * fetchAlphaCommit returns the full commit SHA of the Prerelease-Alpha tag, which is the commit the
 * current alpha binaries are built from — version.txt holds `alpha-` plus its first 7 characters.
 */
export async function fetchAlphaCommit(signal?: AbortSignal): Promise<string> {
  const res = await fetch(`${REPO_API}/commits/Prerelease-Alpha`, {
    headers: { Accept: 'application/vnd.github.sha' },
    signal,
  });
  if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
  return (await res.text()).trim();
}

/** fetchLatestReleaseTag returns the tag name of the latest stable release, e.g. `v1.19.31`. */
export async function fetchLatestReleaseTag(signal?: AbortSignal): Promise<string> {
  const res = await fetch(`${REPO_API}/releases/latest`, { signal });
  if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
  const json: { tag_name: string } = await res.json();
  return json.tag_name;
}
