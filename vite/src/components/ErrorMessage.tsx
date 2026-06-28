interface Props {
  message?: string;
  onRetry?: () => void;
  actionLabel?: string;
  onClose?: () => void;
}

export function ErrorMessage({ message, onRetry, actionLabel = '再試行', onClose }: Props) {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1 }}>{message}</div>
        {onRetry ? (
          <button type="button" onClick={onRetry} style={{ marginLeft: 8 }}>
            {actionLabel}
          </button>
        ) : null}
        {onClose ? (
          <button type="button" onClick={onClose} aria-label="閉じる" style={{ marginLeft: 8 }}>
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}
