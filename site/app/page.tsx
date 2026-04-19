// See docs/specs/website/nextjs-architecture.md §1 — placeholder landing page
// The real landing page ships with milestone M_Landing.
export default function HomePage() {
  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="font-display text-4xl font-bold text-text">
        Élection 2027
      </h1>
      <p className="mt-4 text-text-secondary">
        Site en construction — milestone M_WebsiteCore.
      </p>
    </main>
  );
}
