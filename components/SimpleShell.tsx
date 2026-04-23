export function SimpleShell({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <main className="simple-main">
      <div className="simple-inner">
        <h1 className="simple-title">{title}</h1>
        {children}
      </div>
    </main>
  )
}
