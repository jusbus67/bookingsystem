import Link from "next/link";

export default function WaitingNotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <p className="text-white/70">Queue entry not found.</p>
      <Link href="/" className="mt-4 text-sm underline text-white/80 hover:text-white">
        Back to kiosk
      </Link>
    </main>
  );
}
