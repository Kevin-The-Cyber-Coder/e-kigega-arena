import { Link } from 'react-router-dom';
import { ArrowLeft, MapPinOff } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="not-found">
      <span className="not-found-icon">
        <MapPinOff size={38} strokeWidth={1.6} />
      </span>
      <span>404</span>
      <h1>This shelf is empty</h1>
      <p>The page you are looking for does not exist in this workspace.</p>
      <Link to="/" className="button primary">
        <ArrowLeft size={17} /> Back to dashboard
      </Link>
    </div>
  );
}
