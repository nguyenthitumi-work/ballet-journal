const ALLOWED_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
]);

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export function parseYouTubeId(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  if (!ALLOWED_HOSTS.has(url.hostname)) return null;

  if (url.hostname === 'youtu.be' || url.hostname === 'www.youtu.be') {
    const id = url.pathname.slice(1).split('/')[0];
    return VIDEO_ID_RE.test(id) ? id : null;
  }

  const v = url.searchParams.get('v');
  if (v && VIDEO_ID_RE.test(v)) return v;

  const embedMatch = url.pathname.match(/^\/(?:embed|shorts|v|live)\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  return null;
}

export function toEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

export function youtubeSearchUrl(query: string): string {
  const params = new URLSearchParams({ search_query: `${query} ballet kids tutorial` });
  return `https://www.youtube.com/results?${params.toString()}`;
}

interface YouTubeSearchResponse {
  items?: { id?: { videoId?: string } }[];
}

/**
 * Fetch the first YouTube video ID matching the query via the YouTube Data API v3.
 * Returns null when the API key is missing, the network call fails, or no result is found.
 * The caller is responsible for caching — this function does no caching itself.
 */
export async function fetchFirstYouTubeVideoUrl(query: string): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '1',
    safeSearch: 'strict',
    videoEmbeddable: 'true',
    q: `${query} ballet kids tutorial`,
    key: apiKey,
  });

  const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`YouTube API responded ${res.status}`);
  }
  const body = (await res.json()) as YouTubeSearchResponse;
  const id = body.items?.[0]?.id?.videoId;
  if (!id || !VIDEO_ID_RE.test(id)) return null;
  return `https://www.youtube.com/watch?v=${id}`;
}
