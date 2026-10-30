import { initials } from '../utils/format.js';

const tones = ['violet', 'teal', 'amber', 'rose', 'blue', 'green'];

function toneFor(name = '') {
  const total = [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return tones[total % tones.length];
}

export default function Avatar({ name = '?', size = 'md', status = null, className = '' }) {
  return (
    <span
      className={`avatar avatar-${size} avatar-${toneFor(name)} ${className}`}
      title={name}
      aria-label={name}
    >
      <span>{initials(name) || '?'}</span>
      {status ? <i className={`avatar-status status-${status}`} /> : null}
    </span>
  );
}
