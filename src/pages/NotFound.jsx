import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import EmptyState from '../components/cards/EmptyState';

export default function NotFound() {
  return (
    <div className="container-page py-16">
      <EmptyState
        icon={Compass}
        title="This page could not be found"
        message="The link may be wrong or the page may have moved."
        action={
          <Link to="/" className="btn-primary">
            Go to Home
          </Link>
        }
      />
    </div>
  );
}
