export default function Skeleton({ className = '', circle = false }) {
  return <span className={`skeleton ${circle ? 'skeleton-circle' : ''} ${className}`} aria-hidden="true" />;
}

export function CardSkeleton() {
  return (
    <div className="card skeleton-card">
      <div className="skeleton-row">
        <Skeleton circle className="skeleton-avatar" />
        <div className="skeleton-stack">
          <Skeleton className="skeleton-line w-60" />
          <Skeleton className="skeleton-line w-40" />
        </div>
      </div>
      <Skeleton className="skeleton-line w-100" />
      <Skeleton className="skeleton-line w-80" />
      <Skeleton className="skeleton-block" />
    </div>
  );
}

export function PageLoader({ label = 'Loading your workspace…' }) {
  return (
    <div className="page-loader" role="status">
      <span className="loader-ring" />
      <p>{label}</p>
    </div>
  );
}
