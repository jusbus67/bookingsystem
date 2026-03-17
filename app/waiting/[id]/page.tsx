import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function WaitingPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();
  const { data: entry, error } = await supabase
    .from("queue")
    .select("id, status")
    .eq("id", id)
    .single();

  if (error || !entry) notFound();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <h1 className="text-2xl font-medium tracking-tight mb-3">
          You’re in the queue
        </h1>
        <p className="text-white/70">
          We’ll text you when you’re up. Sit tight.
        </p>
        <p className="mt-8 text-sm text-white/50">
          Queue # {id.slice(0, 8)}
        </p>
      </div>
    </main>
  );
}
