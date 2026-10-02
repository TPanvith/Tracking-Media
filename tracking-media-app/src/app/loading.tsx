export default function Loading() {
  return (
    <main className="loading-page" aria-label="Loading Tracking Media">
      <div className="skeleton skeleton-nav" />
      <div className="skeleton skeleton-hero" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton-grid">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    </main>
  );
}

