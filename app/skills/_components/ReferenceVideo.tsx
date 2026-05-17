import { parseYouTubeId, toEmbedUrl, youtubeSearchUrl } from '@/lib/youtube';
import { ReferenceUrlForm } from './ReferenceUrlForm';

interface Props {
  skillId: string;
  skillName: string;
  referenceUrl: string | null;
}

export function ReferenceVideo({ skillId, skillName, referenceUrl }: Props) {
  const videoId = referenceUrl ? parseYouTubeId(referenceUrl) : null;
  const searchUrl = youtubeSearchUrl(skillName);

  return (
    <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-violet-900/70">Reference video</h2>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-violet-700 underline-offset-2 hover:underline"
        >
          Search YouTube ↗
        </a>
      </div>

      {videoId ? (
        <div className="mt-3 aspect-video overflow-hidden rounded-xl bg-black">
          <iframe
            src={toEmbedUrl(videoId)}
            title={`${skillName} reference video`}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            className="h-full w-full"
          />
        </div>
      ) : (
        <p className="mt-3 text-sm text-violet-900/60">
          No reference video set yet. A grown-up can paste a YouTube link below to add one.
        </p>
      )}

      <details className="mt-4 group">
        <summary className="cursor-pointer text-xs font-medium text-violet-700 hover:text-violet-900">
          {referenceUrl ? 'Change link' : 'Add a YouTube link'}
        </summary>
        <div className="mt-3">
          <ReferenceUrlForm skillId={skillId} initialUrl={referenceUrl} />
        </div>
      </details>
    </div>
  );
}
