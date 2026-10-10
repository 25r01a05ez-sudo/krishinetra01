import { AlertCircle, RefreshCw } from 'lucide-react';
import { describeApiError } from '../../services/api';

/** Shows an ApiError (or plain message) in a calm, readable panel. */
export default function ErrorPanel({ error, message, title, onRetry, retryLabel = 'Try again' }) {
  const info = error ? describeApiError(error) : { title: title || 'Something went wrong', message };
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-950">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 shrink-0 text-red-600" size={22} aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-bold">{title || info.title}</p>
          <p className="mt-1 text-base">{message || info.message}</p>
          {info.hint && <p className="mt-1 break-words text-sm text-red-900/70">{info.hint}</p>}
          {onRetry && (
            <button type="button" onClick={onRetry} className="btn-secondary btn-sm mt-3">
              <RefreshCw size={16} aria-hidden="true" /> {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
