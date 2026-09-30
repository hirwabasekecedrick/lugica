import Link from "next/link";

export const metadata = {
  title: "Lugica | Access denied",
};

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen bg-page text-text flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-xl font-black text-text">Access denied</h1>
        <p className="text-sm text-text-muted">
          Your account does not have permission to view this area. The API enforces the same
          rules, so this is not something you can work around.
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/shop"
            className="px-4 py-2 bg-surface hover:bg-sunken border border-border text-text rounded-xl text-xs font-semibold transition-colors"
          >
            Go to shop
          </Link>
          <Link
            href="/account"
            className="px-4 py-2 bg-accent hover:bg-border text-on-accent rounded-xl text-xs font-bold transition-colors"
          >
            My account
          </Link>
        </div>
      </div>
    </main>
  );
}
