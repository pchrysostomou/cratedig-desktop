// Imperative audio engine: one long-lived HTMLAudioElement (current) plus a hidden
// element used to warm the next track's bytes. Lives OUTSIDE React (module singleton).
// See DESIGN.md §7.3. The store holds intent; this plays it.

export type EngineListeners = {
  onEnded: () => void;
  onLoadedMetadata: (duration: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onError: (message: string) => void;
};

class AudioEngine {
  readonly el: HTMLAudioElement;
  private readonly warm: HTMLAudioElement;
  private pendingSeek: number | null = null;
  private listeners: EngineListeners | null = null;

  constructor() {
    this.el = new Audio();
    this.el.preload = "auto";
    this.warm = new Audio();
    this.warm.preload = "auto";
  }

  /** Wire native element events to the store; returns a detach fn. Mount once. */
  attach(listeners: EngineListeners): () => void {
    this.listeners = listeners;
    const el = this.el;
    const onEnded = () => this.listeners?.onEnded();
    const onMeta = () => {
      this.listeners?.onLoadedMetadata(el.duration || 0);
      if (this.pendingSeek != null) {
        try {
          el.currentTime = this.pendingSeek;
        } catch {
          /* readyState raced; ignore */
        }
        this.pendingSeek = null;
      }
    };
    const onPlay = () => this.listeners?.onPlay();
    const onPause = () => this.listeners?.onPause();
    const onError = () => this.listeners?.onError("Playback error");
    el.addEventListener("ended", onEnded);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("error", onError);
      this.listeners = null;
    };
  }

  load(url: string, autoplay: boolean): void {
    this.pendingSeek = null;
    this.el.src = url;
    this.el.load();
    if (autoplay) this.play();
  }

  /** Warm the next track so the gap on advance is minimal (local files are fast anyway). */
  preloadNext(url: string | null): void {
    if (url) {
      this.warm.src = url;
      this.warm.load();
    } else {
      this.warm.removeAttribute("src");
    }
  }

  play(): void {
    const promise = this.el.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch((err: unknown) => {
        // AbortError is expected when a new load()/pause() interrupts play(); ignore it.
        const name = (err as { name?: string } | null)?.name;
        if (name !== "AbortError") {
          this.listeners?.onError(String((err as { message?: string } | null)?.message ?? err));
        }
      });
    }
  }

  pause(): void {
    this.el.pause();
  }

  seek(seconds: number): void {
    if (this.el.readyState >= 1) {
      try {
        this.el.currentTime = seconds;
      } catch {
        /* ignore */
      }
    } else {
      this.pendingSeek = seconds; // applied on loadedmetadata
    }
  }

  setVolume(v: number): void {
    this.el.volume = Math.min(1, Math.max(0, v));
  }

  setMuted(m: boolean): void {
    this.el.muted = m;
  }
}

export const audioEngine = new AudioEngine();
