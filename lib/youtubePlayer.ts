// Minimal wrapper around the YouTube IFrame Player API. We deliberately avoid
// pulling in @types/youtube — the surface we actually use is tiny, and inline
// types keep the dependency footprint zero.

export interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  destroy: () => void;
}

interface YouTubePlayerVars {
  rel?: 0 | 1;
  modestbranding?: 0 | 1;
  playsinline?: 0 | 1;
  controls?: 0 | 1;
}

interface YouTubePlayerOptions {
  videoId: string;
  host?: string;
  playerVars?: YouTubePlayerVars;
  events?: {
    onReady?: () => void;
    onError?: (event: { data: number }) => void;
  };
}

interface YouTubePlayerCtor {
  new (target: HTMLElement | string, options: YouTubePlayerOptions): YouTubePlayer;
}

interface YouTubeApi {
  Player: YouTubePlayerCtor;
}

interface WindowWithYT extends Window {
  YT?: YouTubeApi;
  onYouTubeIframeAPIReady?: () => void;
  __ytApiPromise?: Promise<YouTubeApi>;
}

const SCRIPT_SRC = 'https://www.youtube.com/iframe_api';

export function loadYouTubeIframeApi(): Promise<YouTubeApi> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube IFrame API can only load in the browser.'));
  }
  const w = window as WindowWithYT;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (w.__ytApiPromise) return w.__ytApiPromise;

  const promise = new Promise<YouTubeApi>((resolve, reject) => {
    const previous = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (w.YT?.Player) resolve(w.YT);
      else reject(new Error('YouTube API loaded but YT.Player is missing.'));
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) return;

    const tag = document.createElement('script');
    tag.src = SCRIPT_SRC;
    tag.async = true;
    tag.onerror = () => reject(new Error('Could not load YouTube IFrame API.'));
    document.body.appendChild(tag);
  });

  w.__ytApiPromise = promise;
  return promise;
}
