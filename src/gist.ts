import type { GistState } from "./types";

const GITHUB_API = "https://api.github.com";
const STATE_FILENAME = "infirmary-state.json";
const USER_AGENT = "tbb-infirmary-monitor/1.0";

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": USER_AGENT,
  };
}

export async function readSeenIds(
  gistId: string,
  token: string,
): Promise<number[] | null> {
  const res = await fetch(`${GITHUB_API}/gists/${gistId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) return null;

  const gist = (await res.json()) as {
    files: Record<string, { content: string } | undefined>;
  };

  const file = gist.files[STATE_FILENAME];
  if (!file) return null;

  const state = JSON.parse(file.content) as GistState;
  return state.seenIds;
}

export async function writeSeenIds(
  gistId: string,
  token: string,
  ids: number[],
): Promise<void> {
  const state: GistState = { seenIds: ids };
  const res = await fetch(`${GITHUB_API}/gists/${gistId}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: {
        [STATE_FILENAME]: { content: JSON.stringify(state, null, 2) },
      },
    }),
  });
  if (!res.ok) throw new Error(`Gist write failed: HTTP ${res.status}`);
}
