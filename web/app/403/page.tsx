import Link from "next/link";

export const metadata = {
  title: "Lugica | Access denied",
};

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen bg-[#0b1324] text-white flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#131e36] border border-[#263B6A] flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-[#6984A9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-xl font-black text-white">Access denied</h1>
        <p className="text-sm text-[#6984A9]">
          Your account does not have permission to view this area. The API enforces the same
          rules, so this is not something you can work around.
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/shop"
            className="px-4 py-2 bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Go to shop
          </Link>
          <Link
            href="/account"
            className="px-4 py-2 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] rounded-xl text-xs font-bold transition-colors"
          >
            My account
          </Link>
        </div>
      </div>
    </main>
  );
}
