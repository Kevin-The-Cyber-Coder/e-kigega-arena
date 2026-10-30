import { Moon, ShieldCheck, Sun, UserRound, UsersRound } from 'lucide-react';
import { ROLE_LABELS, SHIFT_LABELS } from '../utils/format.js';

export default function Badge({ tone = 'neutral', icon: Icon, children, dot = false, className = '' }) {
  return (
    <span className={`badge badge-${tone} ${className}`}>
      {dot ? <i className="badge-dot" /> : null}
      {Icon ? <Icon size={13} strokeWidth={2.4} /> : null}
      {children}
    </span>
  );
}

const roleTones = {
  super_admin: 'violet',
  admin: 'blue',
  manager: 'teal',
  staff: 'amber'
};

const roleIcons = {
  super_admin: ShieldCheck,
  admin: UsersRound,
  manager: UserRound,
  staff: UserRound
};

export function RoleBadge({ role }) {
  return (
    <Badge tone={roleTones[role] || 'neutral'} icon={roleIcons[role]}>
      {ROLE_LABELS[role] || role}
    </Badge>
  );
}

export function ShiftBadge({ shift }) {
  if (!shift) return <Badge tone="neutral">No shift</Badge>;
  return (
    <Badge tone={shift === 'day' ? 'amber' : 'violet'} icon={shift === 'day' ? Sun : Moon}>
      {SHIFT_LABELS[shift] || shift}
    </Badge>
  );
}

export function StockBadge({ state }) {
  const map = {
    healthy: { tone: 'green', label: 'In stock' },
    low: { tone: 'amber', label: 'Low stock' },
    out: { tone: 'rose', label: 'Out of stock' }
  };
  const item = map[state] || map.healthy;
  return (
    <Badge tone={item.tone} dot>
      {item.label}
    </Badge>
  );
}
