import { useEffect, useRef, useState } from "react";
import Photo from "./Photo.jsx";
import { mockPage } from "./mockApi.js";

const API_URL = "https://picsum.photos/v2/list";
const REQUEST_TIMEOUT_MS = 8000;
const FORCE_SAMPLE = import.meta.env.VITE_USE_MOCK === "true";

// Fetch one page of the real Picsum feed, with a timeout so the UI never hangs.
async function fetchRealPage(page, signal) {
  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);
  const onCleanupAbort = () => timeoutController.abort();
  signal.addEventListener("abort", onCleanupAbort);

  try {
    const res = await fetch(`${API_URL}?page=${page}`, {
      signal: timeoutController.signal,
    });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return await res.json();
  } catch (err) {
    if (signal.aborted) throw err; // cancelled by React cleanup, not a real error
    if (err.name === "AbortError") throw new Error("Request timed out");
    throw err;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", onCleanupAbort);
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true); // first page loads on mount
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [usingSample, setUsingSample] = useState(FORCE_SAMPLE);

  const sentinelRef = useRef(null);
  const sampleRef = useRef(FORCE_SAMPLE); // true once we switched to sample data
  const realLoadedRef = useRef(false); // true once a real Picsum page arrived

  // Fetch the current page whenever `page` changes (or the user hits Retry).
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    async function load() {
      if (sampleRef.current) {
        await wait(300);
        return mockPage(page);
      }
      try {
        const data = await fetchRealPage(page, controller.signal);
        if (data.length > 0) realLoadedRef.current = true;
        return data;
      } catch (err) {
        if (controller.signal.aborted) throw err;
        // If the real feed was working earlier, keep the real photos and
        // show an error + Retry. If it never worked (e.g. Picsum is down),
        // switch to local sample photos so the app is still usable.
        if (realLoadedRef.current) throw err;
        sampleRef.current = true;
        setUsingSample(true);
        return mockPage(page);
      }
    }

    load()
      .then((data) => {
        if (controller.signal.aborted) return;
        if (data.length === 0) {
          setHasMore(false); // no more data: stop paginating
          return;
        }
        setPhotos((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...data.filter((p) => !seen.has(p.id))];
        });
      })
      .catch((err) => {
        if (err.name !== "AbortError" && !controller.signal.aborted) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page, retryCount]);

  // When the sentinel at the bottom scrolls into view, ask for the next page.
  // The observer is recreated after every load, so if the sentinel is still
  // visible (short page / tall screen) it immediately triggers another load.
  useEffect(() => {
    if (!hasMore || loading || error) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setPage((p) => p + 1);
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, error]);

  return (
    <main className="app">
      <h1 className="app__title">Photo gallery</h1>

      {usingSample && (
        <p className="notice">
          {FORCE_SAMPLE
            ? "Sample data mode (VITE_USE_MOCK=true)."
            : "Showing local sample photos because the Picsum feed could not be reached."}
        </p>
      )}

      <ul className="gallery">
        {photos.map((photo) => (
          <Photo key={photo.id} photo={photo} />
        ))}
      </ul>

      <div ref={sentinelRef} className="sentinel" aria-hidden="true" />

      {loading && <p className="status">Loading…</p>}

      {error && (
        <p className="status status--error">
          Something went wrong: {error}{" "}
          <button type="button" onClick={() => setRetryCount((c) => c + 1)}>
            Retry
          </button>
        </p>
      )}

      {!hasMore && <p className="status">You've reached the end.</p>}
    </main>
  );
}
