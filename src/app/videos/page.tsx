import type { Metadata } from "next";
import { videosConfig } from "@/content/videos";

export const metadata: Metadata = {
  title: "Videos",
  description: "Watch videos from All The Glory.",
};

export default function VideosPage() {
  return (
    <div className="pt-24">
      <section className="w-full py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="modo-title text-colour-fg mb-6">Videos</h1>
          <p className="text-lg md:text-xl text-colour-fg/60">
            Watch, listen, and experience.
          </p>
        </div>
      </section>

      <section className="w-full py-12 md:py-20">
        <div className="max-w-5xl mx-auto px-6 space-y-16">
          {videosConfig.map((video, i) => (
            <div key={i}>
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-colour-surface">
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtubeId}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <div className="mt-4">
                <h2 className="text-xl md:text-2xl font-semibold text-colour-fg">
                  {video.title}
                </h2>
                {video.description && (
                  <p className="mt-2 text-colour-fg/60">{video.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
