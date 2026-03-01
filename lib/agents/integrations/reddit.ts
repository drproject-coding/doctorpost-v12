/**
 * Reddit API integration for the Research Agent.
 * Uses application-only OAuth (client_credentials grant).
 */

const REDDIT_AUTH_URL = "https://www.reddit.com/api/v1/access_token";
const REDDIT_API_URL = "https://oauth.reddit.com";

interface RedditCredentials {
  clientId: string;
  clientSecret: string;
}

interface RedditPost {
  title: string;
  selftext: string;
  subreddit: string;
  score: number;
  numComments: number;
  url: string;
  created: number;
}

export interface RedditSearchResult {
  posts: RedditPost[];
}

// Token cache — Reddit tokens are valid for ~1 hour
let cachedToken: { token: string; expiresAt: number; key: string } | null =
  null;

async function getAccessToken(credentials: RedditCredentials): Promise<string> {
  const cacheKey = `${credentials.clientId}:${credentials.clientSecret}`;
  if (
    cachedToken &&
    cachedToken.key === cacheKey &&
    Date.now() < cachedToken.expiresAt
  ) {
    return cachedToken.token;
  }

  const auth = Buffer.from(
    `${credentials.clientId}:${credentials.clientSecret}`,
  ).toString("base64");

  const response = await fetch(REDDIT_AUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "DoctorPost/1.0",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Reddit auth failed (${response.status})`);
  }

  const data = await response.json();
  const expiresIn = (data.expires_in as number) || 3600;

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn - 60) * 1000, // Refresh 60s before expiry
    key: cacheKey,
  };

  return data.access_token;
}

export async function searchReddit(
  query: string,
  credentials: RedditCredentials,
  options?: {
    subreddits?: string[];
    sort?: "relevance" | "hot" | "top" | "new";
    limit?: number;
  },
): Promise<RedditSearchResult> {
  const token = await getAccessToken(credentials);
  const limit = options?.limit || 10;
  const sort = options?.sort || "relevance";

  const subredditFilter = options?.subreddits?.length
    ? `subreddit:${options.subreddits.join("+")}`
    : "";
  const fullQuery = subredditFilter ? `${query} ${subredditFilter}` : query;

  const searchUrl = `${REDDIT_API_URL}/search?q=${encodeURIComponent(fullQuery)}&sort=${sort}&limit=${limit}&type=link`;

  const response = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "DoctorPost/1.0",
    },
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Reddit search failed (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const posts: RedditPost[] = (data.data?.children || []).map(
    (child: { data: Record<string, unknown> }) => ({
      title: child.data.title as string,
      selftext: ((child.data.selftext as string) || "").slice(0, 500),
      subreddit: child.data.subreddit as string,
      score: child.data.score as number,
      numComments: child.data.num_comments as number,
      url: `https://reddit.com${child.data.permalink}`,
      created: child.data.created_utc as number,
    }),
  );

  return { posts };
}
