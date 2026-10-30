import { useEffect, useState } from 'react';
import { formatNumber } from '../utils/format.js';

function AnimatedNumber({ value, format }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame;
    let start;
    const duration = 750;
    const from = 0;
    const to = Number(value) || 0;

    const tick = (time) => {
      if (!start) start = time;
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{format(Math.round(display))}</>;
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'violet',
  delay = 0,
  formatter = formatNumber
}) {
  const animated = typeof value === 'number';

  return (
    <article
      className={`stat-card tone-${tone}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="stat-icon">
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="stat-copy">
        <span className="stat-label">{label}</span>
        <strong>{animated ? <AnimatedNumber value={value} format={formatter} /> : value}</strong>
        {hint ? <span className="stat-hint">{hint}</span> : null}
      </div>
      <span className="stat-glow" aria-hidden="true" />
    </article>
  );
}
