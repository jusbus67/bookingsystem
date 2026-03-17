import { KioskForm } from "@/app/components/KioskForm";

export default function KioskPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-medium tracking-tight text-center mb-2">
          Join the queue
        </h1>
        <p className="text-white/60 text-sm text-center mb-8">
          We’ll text you when you’re up.
        </p>
        <KioskForm />
      </div>
    </main>
  );
}
