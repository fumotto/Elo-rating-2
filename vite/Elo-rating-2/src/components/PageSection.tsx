interface Props {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageSection({ title, children, actions }: Props) {
  return (
    <section className="page-section">
      <div className="section-header">
        <h2>{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
