import { createClient } from "@/lib/supabase/server";
import { QueueList } from "@/app/components/QueueList";

export const dynamic = "force-dynamic";

const STATUS_ORDER: Record<string, number> = {
  waiting: 1,
  notified: 2,
  completed: 3,
  cancelled: 4,
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: entries } = await supabase
    .from("queue")
    .select("*, customers(*)")
    .order("position", { ascending: true });

  const sorted = (entries ?? []).sort(
    (a, b) =>
      (STATUS_ORDER[String(a.status).toLowerCase()] ?? 99) -
      (STATUS_ORDER[String(b.status).toLowerCase()] ?? 99) ||
      (a.position ?? 0) - (b.position ?? 0) ||
      new Date(a.added_at).getTime() - new Date(b.added_at).getTime()
  );

  const waiting = sorted.filter((e) => String(e.status).toLowerCase() === "waiting");
  const notified = sorted.filter((e) => String(e.status).toLowerCase() === "notified");
  const completed = sorted.filter((e) => String(e.status).toLowerCase() === "completed");
  const cancelled = sorted.filter((e) => String(e.status).toLowerCase() === "cancelled");

  return (
    <main className="min-h-screen p-6">
      <header className="mb-8">
        <h1 className="text-xl font-medium tracking-tight">Queue</h1>
        <p className="text-white/60 text-sm mt-1">Staff view</p>
      </header>
      <QueueList
        waiting={waiting}
        notified={notified}
        completed={completed}
        cancelled={cancelled}
      />
    </main>
  );
}
