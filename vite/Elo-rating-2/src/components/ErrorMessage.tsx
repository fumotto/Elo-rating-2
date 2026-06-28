interface Props {
  message: string;
}

export function ErrorMessage({ message }: Props) {
  if (!message) {
    return null;
  }
  return <div className="error-banner">{message}</div>;
}
