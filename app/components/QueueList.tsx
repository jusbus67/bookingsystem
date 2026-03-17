"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";

type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
};

type Entry = {
  id: string;
  status: string;
  position?: number;
  service_type?: string | null;
  added_at: string;
  customers?: Customer | Customer[] | null;
  customer?: Customer | null;
};

type Props = {
  waiting: Entry[];
  notified: Entry[];
  completed: Entry[];
  cancelled: Entry[];
};

/** Resolve joined customer from queue row (handles customers(*) as object or array, or customer) */
function getCustomer(entry: Entry): Customer | null {
  const c = entry.customers ?? entry.customer;
  if (c == null) return null;
  return Array.isArray(c) ? c[0] ?? null : c;
}

function EntryCard({
  entry,
  onNotify,
  onComplete,
  onBackToWaiting,
  onRemove,
  showNotify,
  showComplete,
  showBackToWaiting,
  showRemove,
  isNotifying,
  dragHandleProps,
  isDragging,
}: {
  entry: Entry;
  onNotify: (entry: Entry) => void;
  onComplete: (id: string) => void;
  onBackToWaiting: (id: string) => void;
  onRemove: (id: string) => void;
  showNotify: boolean;
  showComplete: boolean;
  showBackToWaiting: boolean;
  showRemove: boolean;
  isNotifying: boolean;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}) {
  const c = getCustomer(entry);
  const name = c ? `${c.first_name} ${c.last_name}`.trim() || "—" : "—";
  const phone = c?.phone_number ?? "—";
  const serviceType = (entry.service_type ?? "tattoo").toLowerCase();
  const isTattoo = serviceType === "tattoo";
  const isPiercing = serviceType === "piercing";
  const cardBorder = isDragging
    ? "border-white/40 opacity-60"
    : isTattoo
      ? "border-red-500/80 bg-red-500/5"
      : isPiercing
        ? "border-blue-500/80 bg-blue-500/5"
        : "border-white/20";
  const badgeClass = isTattoo
    ? "bg-red-500/90 text-white"
    : isPiercing
      ? "bg-blue-500/90 text-white"
      : "bg-white/20 text-white/80";

  return (
    <div
      className={`border-2 rounded p-4 bg-white/5 transition-opacity ${cardBorder}`}
    >
      <p
        className={`inline-block text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded mb-2 ${badgeClass}`}
      >
        {isTattoo ? "Tattoo" : isPiercing ? "Piercing" : entry.service_type ?? "—"}
      </p>
      <p className="font-medium">{name}</p>
      <p className="text-sm text-white/60 mt-0.5">{phone}</p>
      <p className="text-xs text-white/40 mt-1">
        Added {new Date(entry.added_at).toLocaleTimeString()}
      </p>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {showNotify && (
          <button
            type="button"
            onClick={() => onNotify(entry)}
            disabled={isNotifying}
            className="text-sm px-3 py-1.5 rounded border border-white/30 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isNotifying ? "Sending…" : "Notify"}
          </button>
        )}
        {showBackToWaiting && (
          <button
            type="button"
            onClick={() => onBackToWaiting(entry.id)}
            className="text-sm px-3 py-1.5 rounded border border-white/20 text-white/60 hover:text-white/80 hover:border-white/30 transition-colors"
          >
            Back to Waiting
          </button>
        )}
        {showComplete && (
          <button
            type="button"
            onClick={() => onComplete(entry.id)}
            className="text-sm px-3 py-1.5 rounded border border-white/30 hover:bg-white/10 transition-colors"
          >
            Complete
          </button>
        )}
        {showRemove && (
          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            className="text-xs text-white/40 hover:text-red-400 transition-colors ml-auto"
            title="Remove from queue"
          >
            Cancel
          </button>
        )}
      </div>
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="mt-2 pt-2 border-t border-white/10 text-xs text-white/40 cursor-grab active:cursor-grabbing touch-none"
        >
          Drag to reorder
        </div>
      )}
    </div>
  );
}

function SortableEntryCard({
  entry,
  columnId,
  onNotify,
  onComplete,
  onBackToWaiting,
  onRemove,
  showNotify,
  showComplete,
  showBackToWaiting,
  showRemove,
  isNotifying,
}: {
  entry: Entry;
  columnId: "waiting" | "notified" | "completed";
  onNotify: (entry: Entry) => void;
  onComplete: (id: string) => void;
  onBackToWaiting: (id: string) => void;
  onRemove: (id: string) => void;
  showNotify: boolean;
  showComplete: boolean;
  showBackToWaiting: boolean;
  showRemove: boolean;
  isNotifying: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: entry.id,
    data: { columnId, type: "entry" as const },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <EntryCard
        entry={entry}
        onNotify={onNotify}
        onComplete={onComplete}
        onBackToWaiting={onBackToWaiting}
        onRemove={onRemove}
        showNotify={showNotify}
        showComplete={showComplete}
        showBackToWaiting={showBackToWaiting}
        showRemove={showRemove}
        isNotifying={isNotifying}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

function DroppableColumn({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] transition-colors rounded-lg ${isOver ? "ring-2 ring-white/50 bg-white/10" : ""} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

const DROP_ZONE_CANCEL_ID = "cancel";

function CancelledDropZone({ cancelledCount }: { cancelledCount: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: DROP_ZONE_CANCEL_ID });
  return (
    <div
      ref={setNodeRef}
      className={`mt-6 p-4 rounded border border-dashed text-center text-sm transition-colors ${
        isOver
          ? "border-red-400/60 bg-red-500/10 text-red-300"
          : "border-white/20 text-white/40"
      }`}
    >
      Drop here to cancel
      {cancelledCount > 0 && (
        <span className="block mt-1 text-white/30">{cancelledCount} cancelled</span>
      )}
    </div>
  );
}

const COLUMN_IDS = ["waiting", "notified", "completed", "cancelled"] as const;
type ColumnId = (typeof COLUMN_IDS)[number];

function getListForKey(
  key: ColumnId,
  lists: { waiting: Entry[]; notified: Entry[]; completed: Entry[]; cancelled: Entry[] }
): Entry[] {
  return lists[key];
}

function findEntryAndColumn(
  lists: { waiting: Entry[]; notified: Entry[]; completed: Entry[]; cancelled: Entry[] },
  entryId: string
): { entry: Entry; column: ColumnId } | null {
  for (const col of COLUMN_IDS) {
    const list = getListForKey(col, lists);
    const entry = list.find((e) => e.id === entryId);
    if (entry) return { entry, column: col };
  }
  return null;
}

function moveEntryBetweenLists(
  lists: { waiting: Entry[]; notified: Entry[]; completed: Entry[]; cancelled: Entry[] },
  entryId: string,
  toColumn: ColumnId
): { waiting: Entry[]; notified: Entry[]; completed: Entry[]; cancelled: Entry[] } {
  const found = findEntryAndColumn(lists, entryId);
  if (!found || found.column === toColumn) return lists;
  const fromList = getListForKey(found.column, lists);
  const toList = getListForKey(toColumn, lists);
  const newFrom = fromList.filter((e) => e.id !== entryId);
  const newTo = [...toList, found.entry];
  return {
    ...lists,
    [found.column]: newFrom,
    [toColumn]: newTo,
  };
}

export function QueueList({
  waiting,
  notified,
  completed,
  cancelled,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [hasMounted, setHasMounted] = useState(false);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [localLists, setLocalLists] = useState({
    waiting,
    notified,
    completed,
    cancelled,
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setLocalLists({ waiting, notified, completed, cancelled });
  }, [waiting, notified, completed, cancelled]);

  // Realtime: refetch when queue table changes (insert/update/delete)
  useEffect(() => {
    const channel = supabase
      .channel("queue-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue" },
        () => {
          router.refresh();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleNotify(entry: Entry) {
    const c = getCustomer(entry);
    const phoneNumber = c?.phone_number ?? "";
    const firstName = c?.first_name ?? "";
    if (!phoneNumber) {
      showToast("No phone number for this customer.", "error");
      return;
    }
    setNotifyingId(entry.id);
    try {
      await supabase
        .from("queue")
        .update({ status: "notified" })
        .eq("id", entry.id);
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, firstName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || "Failed to send text.", "error");
        return;
      }
      showToast("Text sent.", "success");
      router.refresh();
    } catch {
      showToast("Failed to send text.", "error");
    } finally {
      setNotifyingId(null);
    }
  }

  async function handleComplete(id: string) {
    await supabase.from("queue").update({ status: "completed" }).eq("id", id);
    router.refresh();
  }

  async function handleBackToWaiting(id: string) {
    await supabase.from("queue").update({ status: "waiting" }).eq("id", id);
    router.refresh();
  }

  async function handleSetCancelled(id: string) {
    const found = findEntryAndColumn(localLists, id);
    if (found) {
      setLocalLists((prev) => ({
        ...prev,
        [found.column]: prev[found.column].filter((e) => e.id !== id),
        cancelled: [...prev.cancelled, found.entry],
      }));
    }
    console.log("[QueueList] Cancel: calling cancel_queue_entry RPC for id", id);
    const { error } = await supabase.rpc("cancel_queue_entry", {
      p_queue_id: id,
    });
    if (error) console.error("[QueueList] Cancel RPC error:", error);
    router.refresh();
  }

  async function handleMoveToColumn(entryId: string, newStatus: ColumnId) {
    await supabase.rpc("move_queue_entry", {
      p_queue_id: entryId,
      p_new_status: newStatus,
    });
    router.refresh();
  }

  async function handleReorder(
    columnId: "waiting" | "notified",
    orderedIds: string[]
  ) {
    await Promise.all(
      orderedIds.map((id, position) =>
        supabase.from("queue").update({ position }).eq("id", id)
      )
    );
    router.refresh();
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || typeof over.id !== "string") return;
    const overId = over.id as string;
    const toColumn: ColumnId =
      overId === DROP_ZONE_CANCEL_ID ? "cancelled" : overId;
    if (!COLUMN_IDS.includes(toColumn)) return;
    setLocalLists((prev) =>
      moveEntryBetweenLists(prev, active.id as string, toColumn)
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (overId === DROP_ZONE_CANCEL_ID) {
      handleSetCancelled(activeId);
      return;
    }

    if (overId === "waiting" || overId === "notified" || overId === "completed") {
      handleMoveToColumn(activeId, overId);
      return;
    }

    const source = findEntryAndColumn(localLists, activeId);
    const targetColumn = COLUMN_IDS.find((col) =>
      getListForKey(col, localLists).some((e) => e.id === overId)
    );
    if (!source || !targetColumn) return;

    if (source.column === targetColumn && (targetColumn === "waiting" || targetColumn === "notified")) {
      const entries = getListForKey(targetColumn, localLists);
      const ids = entries.map((e) => e.id);
      const overIndex = ids.indexOf(overId);
      const activeIndex = ids.indexOf(activeId);
      if (overIndex === -1 || activeIndex === -1) return;
      const newOrder = arrayMove(ids, activeIndex, overIndex);
      if (newOrder.every((id, i) => id === ids[i])) return;
      handleReorder(targetColumn, newOrder);
    } else {
      handleMoveToColumn(activeId, targetColumn);
    }
  }

  const localWaiting = localLists.waiting;
  const localNotified = localLists.notified;
  const localCompleted = localLists.completed;
  const waitingIds = localWaiting.map((e) => e.id);
  const notifiedIds = localNotified.map((e) => e.id);
  const completedIds = localCompleted.map((e) => e.id);

  // Before mount: render list without DnD wrappers to avoid hydration mismatch (dnd-kit IDs)
  if (!hasMounted) {
    return (
      <>
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded text-sm ${
              toast.type === "success"
                ? "bg-white text-black"
                : "bg-red-500/90 text-white"
            }`}
          >
            {toast.message}
          </div>
        )}
        <div className="grid gap-8 sm:grid-cols-3">
          <section>
            <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-4">
              Waiting ({waiting.length})
            </h2>
            <div className="flex flex-col gap-3">
              {waiting.length === 0 ? (
                <p className="text-white/40 text-sm">No one waiting</p>
              ) : (
                waiting.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onNotify={handleNotify}
                    onComplete={handleComplete}
                    onBackToWaiting={handleBackToWaiting}
                    onRemove={handleSetCancelled}
                    showNotify
                    showComplete
                    showBackToWaiting={false}
                    showRemove
                    isNotifying={notifyingId === entry.id}
                  />
                ))
              )}
            </div>
          </section>
          <section>
            <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-4">
              Notified ({notified.length})
            </h2>
            <div className="flex flex-col gap-3">
              {notified.length === 0 ? (
                <p className="text-white/40 text-sm">None</p>
              ) : (
                notified.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onNotify={handleNotify}
                    onComplete={handleComplete}
                    onBackToWaiting={handleBackToWaiting}
                    onRemove={handleSetCancelled}
                    showNotify={false}
                    showComplete
                    showBackToWaiting
                    showRemove
                    isNotifying={notifyingId === entry.id}
                  />
                ))
              )}
            </div>
          </section>
          <section>
            <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-4">
              Completed ({completed.length})
            </h2>
            <div className="flex flex-col gap-3">
              {completed.length === 0 ? (
                <p className="text-white/40 text-sm">None</p>
              ) : (
                completed.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onNotify={handleNotify}
                    onComplete={handleComplete}
                    onBackToWaiting={handleBackToWaiting}
                    onRemove={handleSetCancelled}
                    showNotify={false}
                    showComplete={false}
                    showBackToWaiting={false}
                    showRemove={false}
                    isNotifying={false}
                  />
                ))
              )}
            </div>
          </section>
        </div>
        <div className="mt-6 p-4 rounded border border-dashed border-white/20 text-center text-sm text-white/40">
          Drop here to cancel — drag available after load
        </div>
      </>
    );
  }

  return (
    <>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded text-sm ${
            toast.type === "success"
              ? "bg-white text-black"
              : "bg-red-500/90 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <DndContext
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <div className="grid gap-8 sm:grid-cols-3">
          <section>
            <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-4">
              Waiting ({localWaiting.length})
            </h2>
            <DroppableColumn id="waiting" className="flex flex-col gap-3">
              <SortableContext
                items={waitingIds}
                strategy={verticalListSortingStrategy}
              >
                {localWaiting.length === 0 ? (
                  <p className="text-white/40 text-sm">No one waiting</p>
                ) : (
                  localWaiting.map((entry) => (
                    <SortableEntryCard
                      key={entry.id}
                      entry={entry}
                      columnId="waiting"
                      onNotify={handleNotify}
                      onComplete={handleComplete}
                      onBackToWaiting={handleBackToWaiting}
                      onRemove={handleSetCancelled}
                      showNotify
                      showComplete
                      showBackToWaiting={false}
                      showRemove
                      isNotifying={notifyingId === entry.id}
                    />
                  ))
                )}
              </SortableContext>
            </DroppableColumn>
          </section>

          <section>
            <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-4">
              Notified ({localNotified.length})
            </h2>
            <DroppableColumn id="notified" className="flex flex-col gap-3">
              <SortableContext
                items={notifiedIds}
                strategy={verticalListSortingStrategy}
              >
                {localNotified.length === 0 ? (
                  <p className="text-white/40 text-sm">None</p>
                ) : (
                  localNotified.map((entry) => (
                    <SortableEntryCard
                      key={entry.id}
                      entry={entry}
                      columnId="notified"
                      onNotify={handleNotify}
                      onComplete={handleComplete}
                      onBackToWaiting={handleBackToWaiting}
                      onRemove={handleSetCancelled}
                      showNotify={false}
                      showComplete
                      showBackToWaiting
                      showRemove
                      isNotifying={notifyingId === entry.id}
                    />
                  ))
                )}
              </SortableContext>
            </DroppableColumn>
          </section>

          <section>
            <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-4">
              Completed ({localCompleted.length})
            </h2>
            <DroppableColumn id="completed" className="flex flex-col gap-3">
              <SortableContext
                items={completedIds}
                strategy={verticalListSortingStrategy}
              >
                {localCompleted.length === 0 ? (
                  <p className="text-white/40 text-sm">None</p>
                ) : (
                  localCompleted.map((entry) => (
                    <SortableEntryCard
                      key={entry.id}
                      entry={entry}
                      columnId="completed"
                      onNotify={handleNotify}
                      onComplete={handleComplete}
                      onBackToWaiting={handleBackToWaiting}
                      onRemove={handleSetCancelled}
                      showNotify={false}
                      showComplete={false}
                      showBackToWaiting={false}
                      showRemove={false}
                      isNotifying={false}
                    />
                  ))
                )}
              </SortableContext>
            </DroppableColumn>
          </section>
        </div>

        <CancelledDropZone cancelledCount={localLists.cancelled.length} />
      </DndContext>
    </>
  );
}
