"use client";

import { AdminGate } from "@/components/app/admin-gate";
import { AdminShell } from "@/components/app/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { VolunteerSignup, VolunteerSlot } from "@/lib/types";
import {
  boiseInputToIso,
  formatVolunteerSlotTime,
  groupSignupsBySlot,
  sortSlotsChronologically,
  toBoiseDateTimeInputValue,
  VOLUNTEER_TIMEZONE,
} from "@/lib/volunteer";
import { FormEvent, useEffect, useMemo, useState } from "react";

type SlotDraft = {
  startsAt: string;
  seatsAvailable: number;
  details: string;
  isActive: boolean;
};

type BatchDraft = {
  id: number;
  date: string;
  seatsAvailable: number;
};

export default function AdminVolunteerPage() {
  const configured = supabaseConfigured();
  const [slots, setSlots] = useState<VolunteerSlot[]>([]);
  const [signups, setSignups] = useState<VolunteerSignup[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [draftBySlot, setDraftBySlot] = useState<Record<string, SlotDraft>>({});
  const [batchDrafts, setBatchDrafts] = useState<BatchDraft[]>([
    { id: 1, date: "", seatsAvailable: 1 },
  ]);
  const [nextBatchDraftId, setNextBatchDraftId] = useState(2);
  const [newDetails, setNewDetails] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [savingSlotId, setSavingSlotId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    configured ? null : "Supabase is not configured."
  );
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;

    const supabase = createClient();

    async function loadData() {
      const { data: slotRows, error: slotError } = await supabase
        .from("volunteer_slots")
        .select("*")
        .order("starts_at", { ascending: true });

      if (slotError) {
        setMessage(slotError.message);
        setLoading(false);
        return;
      }

      const nextSlots = sortSlotsChronologically((slotRows as VolunteerSlot[]) ?? []);
      setSlots(nextSlots);

      const nextDrafts: Record<string, SlotDraft> = {};
      for (const slot of nextSlots) {
        nextDrafts[slot.id] = {
          startsAt: toBoiseDateTimeInputValue(slot.starts_at),
          seatsAvailable: slot.seats_available,
          details: slot.details ?? "",
          isActive: slot.is_active,
        };
      }
      setDraftBySlot(nextDrafts);

      if (nextSlots.length === 0) {
        setSignups([]);
        setLoading(false);
        return;
      }

      const { data: signupRows, error: signupError } = await supabase
        .from("volunteer_signups")
        .select("*")
        .in(
          "slot_id",
          nextSlots.map((slot) => slot.id)
        )
        .order("created_at", { ascending: true });

      if (signupError) {
        setMessage(signupError.message);
      } else {
        setSignups((signupRows as VolunteerSignup[]) ?? []);
      }

      setLoading(false);
    }

    void loadData();

    const channel = supabase
      .channel("volunteer-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "volunteer_slots" }, () => {
        void loadData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "volunteer_signups" }, () => {
        void loadData();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [configured, refreshKey]);

  const signupsBySlot = useMemo(() => groupSignupsBySlot(signups), [signups]);

  async function handleCreateSlots(event: FormEvent) {
    event.preventDefault();
    if (!configured) {
      setMessage("Supabase is not configured.");
      return;
    }

    const validRows = batchDrafts
      .map((row) => ({
        date: row.date.trim(),
        seatsAvailable: Math.max(1, row.seatsAvailable),
      }))
      .filter((row) => row.date.length > 0);

    if (validRows.length === 0) {
      setMessage("Add at least one date.");
      return;
    }

    const uniqueDates = new Set(validRows.map((row) => row.date));
    if (uniqueDates.size !== validRows.length) {
      setMessage("Each date should appear only once in a batch.");
      return;
    }

    setSavingSlotId("new");
    setMessage(null);

    const inserts = validRows.map((row) => {
      const startsAtIso = boiseInputToIso(`${row.date}T19:00`);
      return {
        starts_at: startsAtIso,
        seats_available: row.seatsAvailable,
        details: newDetails.trim() || null,
        is_active: newIsActive,
      };
    });

    if (inserts.some((slot) => !slot.starts_at)) {
      setSavingSlotId(null);
      setMessage("One or more dates are invalid.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("volunteer_slots").insert(
      inserts.map((slot) => ({
        starts_at: slot.starts_at as string,
        seats_available: slot.seats_available,
        details: slot.details,
        is_active: slot.is_active,
      }))
    );

    if (error) {
      setMessage(error.message);
    } else {
      setBatchDrafts([{ id: 1, date: "", seatsAvailable: 1 }]);
      setNextBatchDraftId(2);
      setNewDetails("");
      setNewIsActive(true);
      setMessage(`${validRows.length} timeslot${validRows.length > 1 ? "s" : ""} created at 7:00 PM.`);
      setRefreshKey((prev) => prev + 1);
    }

    setSavingSlotId(null);
  }

  async function handleUpdateSlot(slotId: string) {
    const draft = draftBySlot[slotId];
    if (!draft || !configured) return;

    const startsAtIso = boiseInputToIso(draft.startsAt);
    if (!startsAtIso) {
      setMessage("Please enter a valid start date/time.");
      return;
    }

    setSavingSlotId(slotId);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("volunteer_slots")
      .update({
        starts_at: startsAtIso,
        seats_available: Math.max(1, draft.seatsAvailable),
        details: draft.details.trim() || null,
        is_active: draft.isActive,
      })
      .eq("id", slotId);

    setMessage(error ? error.message : "Timeslot updated.");
    if (!error) {
      setRefreshKey((prev) => prev + 1);
    }
    setSavingSlotId(null);
  }

  async function handleDeleteSlot(slotId: string) {
    if (!configured) return;
    setSavingSlotId(slotId);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.from("volunteer_slots").delete().eq("id", slotId);
    setMessage(error ? error.message : "Timeslot deleted.");
    if (!error) {
      setRefreshKey((prev) => prev + 1);
    }
    setSavingSlotId(null);
  }

  async function handleDeleteSignup(signupId: string) {
    if (!configured) return;
    setSavingSlotId(signupId);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.from("volunteer_signups").delete().eq("id", signupId);
    setMessage(error ? error.message : "Signup removed.");
    if (!error) {
      setRefreshKey((prev) => prev + 1);
    }
    setSavingSlotId(null);
  }

  return (
    <AdminShell title="Volunteer Scheduler">
      <AdminGate>
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Add, reschedule, and remove timeslots. Times should be entered in Boise time ({VOLUNTEER_TIMEZONE}).
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Batch Create Timeslots</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleCreateSlots}>
              <p className="text-sm text-muted-foreground">
                New slots are always created at 7:00 PM Boise time.
              </p>
              <div className="space-y-2">
                <Label>Dates and seat counts</Label>
                {batchDrafts.map((row) => (
                  <div key={row.id} className="flex gap-2">
                    <Input
                      type="date"
                      value={row.date}
                      onChange={(event) =>
                        setBatchDrafts((prev) =>
                          prev.map((draft) =>
                            draft.id === row.id ? { ...draft, date: event.target.value } : draft
                          )
                        )
                      }
                    />
                    <Input
                      type="number"
                      min={1}
                      value={row.seatsAvailable}
                      onChange={(event) =>
                        setBatchDrafts((prev) =>
                          prev.map((draft) =>
                            draft.id === row.id
                              ? { ...draft, seatsAvailable: Number(event.target.value) }
                              : draft
                          )
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setBatchDrafts((prev) =>
                          prev.length === 1 ? prev : prev.filter((draft) => draft.id !== row.id)
                        )
                      }
                      disabled={batchDrafts.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setBatchDrafts((prev) => [...prev, { id: nextBatchDraftId, date: "", seatsAvailable: 1 }]);
                    setNextBatchDraftId((prev) => prev + 1);
                  }}
                >
                  Add date
                </Button>
              </div>
              <div className="space-y-1">
                <Label>Details (optional)</Label>
                <Input
                  value={newDetails}
                  onChange={(event) => setNewDetails(event.target.value)}
                  placeholder="Example: setup team, welcome table, clean-up"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newIsActive}
                  onChange={(event) => setNewIsActive(event.target.checked)}
                />
                Open for signup
              </label>
              <Button type="submit" disabled={savingSlotId === "new"}>
                {savingSlotId === "new" ? "Saving..." : "Create batch"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {loading ? <p className="text-sm text-muted-foreground">Loading timeslots...</p> : null}

        {slots.map((slot) => {
          const draft = draftBySlot[slot.id];
          if (!draft) return null;
          const slotSignups = signupsBySlot[slot.id] ?? [];
          const neededCount = Math.max(0, slot.seats_available - slotSignups.length);
          return (
            <Card key={slot.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span>{formatVolunteerSlotTime(slot.starts_at)}</span>
                  <Badge variant={slot.is_active ? "outline" : "secondary"}>
                    {slot.is_active ? "Open" : "Closed"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-2xl font-bold leading-none">{neededCount} needed</p>
                <p className="text-sm text-muted-foreground">
                  {slotSignups.length}/{slot.seats_available} filled
                </p>
                <div className="space-y-1">
                  <Label>Start date/time</Label>
                  <Input
                    type="datetime-local"
                    value={draft.startsAt}
                    onChange={(event) =>
                      setDraftBySlot((prev) => ({
                        ...prev,
                        [slot.id]: { ...draft, startsAt: event.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Seats requested</Label>
                  <Input
                    type="number"
                    min={1}
                    value={draft.seatsAvailable}
                    onChange={(event) =>
                      setDraftBySlot((prev) => ({
                        ...prev,
                        [slot.id]: {
                          ...draft,
                          seatsAvailable: Number(event.target.value),
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Details</Label>
                  <Input
                    value={draft.details}
                    onChange={(event) =>
                      setDraftBySlot((prev) => ({
                        ...prev,
                        [slot.id]: { ...draft, details: event.target.value },
                      }))
                    }
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(event) =>
                      setDraftBySlot((prev) => ({
                        ...prev,
                        [slot.id]: { ...draft, isActive: event.target.checked },
                      }))
                    }
                  />
                  Open for signup
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => void handleUpdateSlot(slot.id)}
                    disabled={savingSlotId === slot.id}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => void handleDeleteSlot(slot.id)}
                    disabled={savingSlotId === slot.id}
                  >
                    Delete
                  </Button>
                </div>
                <div className="space-y-1">
                  <Label>Signed up names</Label>
                  {slotSignups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No names yet.</p>
                  ) : (
                    slotSignups.map((signup) => (
                      <div key={signup.id} className="flex items-center justify-between rounded-lg border p-2">
                        <span className="text-sm">{signup.volunteer_name}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => void handleDeleteSignup(signup.id)}
                          disabled={savingSlotId === signup.id}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {message ? (
          <p className="rounded-xl border bg-white p-3 text-sm text-muted-foreground">{message}</p>
        ) : null}
      </AdminGate>
    </AdminShell>
  );
}
