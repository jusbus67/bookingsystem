"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6)
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function getPhoneDigits(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

export type ServiceType = "tattoo" | "piercing";

export function KioskForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    agreedToWaiver: false,
  });

  const phoneDigits = getPhoneDigits(form.phoneNumber);
  const isPhoneValid = phoneDigits.length === 10;
  const canSubmit =
    serviceType !== null && form.agreedToWaiver && isPhoneValid && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.agreedToWaiver) {
      setError("Please agree to the waiver to continue.");
      return;
    }
    if (phoneDigits.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!serviceType) {
      setError("Please select a service type.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    try {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          phone_number: phoneDigits,
        })
        .select("id")
        .single();

      if (customerError) throw customerError;
      if (!customer?.id) throw new Error("Failed to create customer");

      await supabase.from("waivers").insert({
        customer_id: customer.id,
        agreed_to_terms: true,
      });

      // New walk-ins go to the bottom of Waiting: use max(position) + 1
      const { data: maxRow } = await supabase
        .from("queue")
        .select("position")
        .eq("status", "waiting")
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextPosition = (maxRow?.position ?? -1) + 1;

      const { data: queueEntry, error: queueError } = await supabase
        .from("queue")
        .insert({
          customer_id: customer.id,
          status: "waiting",
          service_type: serviceType,
          position: nextPosition,
        })
        .select("id")
        .single();

      if (queueError) throw queueError;
      if (!queueEntry?.id) throw new Error("Failed to add to queue");

      router.push(`/waiting/${queueEntry.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <p className="block text-sm text-white/70 mb-2">What are you here for?</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setServiceType("tattoo")}
            className={`py-4 px-4 rounded border-2 text-lg font-medium transition-colors ${
              serviceType === "tattoo"
                ? "border-white bg-white text-black"
                : "border-white/30 bg-white/5 text-white hover:border-white/50"
            }`}
          >
            Tattoo
          </button>
          <button
            type="button"
            onClick={() => setServiceType("piercing")}
            className={`py-4 px-4 rounded border-2 text-lg font-medium transition-colors ${
              serviceType === "piercing"
                ? "border-white bg-white text-black"
                : "border-white/30 bg-white/5 text-white hover:border-white/50"
            }`}
          >
            Piercing
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="firstName" className="block text-sm text-white/70 mb-1">
          First name
        </label>
        <input
          id="firstName"
          type="text"
          required
          value={form.firstName}
          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          className="w-full bg-white/5 border border-white/20 rounded px-3 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-white/50"
          placeholder="Jane"
        />
      </div>
      <div>
        <label htmlFor="lastName" className="block text-sm text-white/70 mb-1">
          Last name
        </label>
        <input
          id="lastName"
          type="text"
          required
          value={form.lastName}
          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          className="w-full bg-white/5 border border-white/20 rounded px-3 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-white/50"
          placeholder="Doe"
        />
      </div>
      <div>
        <label htmlFor="phoneNumber" className="block text-sm text-white/70 mb-1">
          Phone number
        </label>
        <input
          id="phoneNumber"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={form.phoneNumber}
          onChange={(e) =>
            setForm((f) => ({ ...f, phoneNumber: formatPhone(e.target.value) }))
          }
          className="w-full bg-white/5 border border-white/20 rounded px-3 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-white/50"
          placeholder="(555) 123-4567"
          maxLength={14}
          aria-invalid={form.phoneNumber.length > 0 && !isPhoneValid}
          aria-describedby={form.phoneNumber.length > 0 && !isPhoneValid ? "phone-hint" : undefined}
        />
        {form.phoneNumber.length > 0 && !isPhoneValid && (
          <p id="phone-hint" className="text-xs text-white/50 mt-1">
            Enter 10 digits
          </p>
        )}
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.agreedToWaiver}
          onChange={(e) =>
            setForm((f) => ({ ...f, agreedToWaiver: e.target.checked }))
          }
          className="mt-1 rounded border-white/30 bg-white/5 text-white focus:ring-white/50"
        />
        <span className="text-sm text-white/80">
          I agree to the waiver and terms. I am 18+ and understand the risks of
          getting a tattoo.
        </span>
      </label>
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-3 rounded border border-white bg-white text-black font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Adding you…" : "Join queue"}
      </button>
    </form>
  );
}
