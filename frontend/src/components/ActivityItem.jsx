import {
  Moon,
  PackageMinus,
  PackagePlus,
  Pencil,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound
} from 'lucide-react';
import { timeAgo } from '../utils/format.js';

const activityMeta = {
  stock_in: { icon: PackagePlus, tone: 'green', label: 'Stock in' },
  stock_out: { icon: PackageMinus, tone: 'amber', label: 'Stock out' },
  product_added: { icon: PackagePlus, tone: 'violet', label: 'Product added' },
  product_edited: { icon: Pencil, tone: 'blue', label: 'Product edited' },
  product_deleted: { icon: Trash2, tone: 'rose', label: 'Product deleted' },
  user_added: { icon: UserPlus, tone: 'teal', label: 'Team member added' },
  user_edited: { icon: UserRound, tone: 'blue', label: 'Team member edited' },
  user_deleted: { icon: Trash2, tone: 'rose', label: 'Team member removed' },
  role_assigned: { icon: ShieldCheck, tone: 'violet', label: 'Role assigned' },
  shift_assigned: { icon: Moon, tone: 'amber', label: 'Shift assigned' }
};

export default function ActivityItem({ activity }) {
  const meta = activityMeta[activity.type] || activityMeta.user_edited;
  const Icon = meta.icon;

  return (
    <article className="activity-item">
      <span className={`activity-icon tone-${meta.tone}`}>
        <Icon size={17} strokeWidth={2.1} />
      </span>
      <div className="activity-copy">
        <div>
          <strong>{activity.actorName || 'System'}</strong>
          <span className="activity-type">{meta.label}</span>
        </div>
        <p>{activity.message}</p>
        <small>
          {activity.actorRole ? activity.actorRole.replace('_', ' ') : 'system'} ·{' '}
          {timeAgo(activity.createdAt)}
        </small>
      </div>
      {activity.amount ? <span className="activity-amount">×{activity.amount}</span> : null}
    </article>
  );
}
