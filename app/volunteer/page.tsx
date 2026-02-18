"use client";

import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { VolunteerSignup, VolunteerSlot } from "@/lib/types";
import {
  formatVolunteerSlotTime,
  groupSignupsBySlot,
  sortSlotsChronologically,
  VOLUNTEER_TIMEZONE,
} from "@/lib/volunteer";
import { MapPin, Phone } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function VolunteerPage() {
  const configured = supabaseConfigured();
  const [slots, setSlots] = useState<VolunteerSlot[]>([]);
  const [signups, setSignups] = useState<VolunteerSignup[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [nameBySlot, setNameBySlot] = useState<Record<string, string>>({});
  const [submittingSlotId, setSubmittingSlotId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    configured ? null : "Supabase is not configured."
  );
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;

    const supabase = createClient();

    async function loadData() {
      const nowIso = new Date().toISOString();
      const { data: slotRows, error: slotError } = await supabase
        .from("volunteer_slots")
        .select("*")
        .eq("is_active", true)
        .gte("starts_at", nowIso)
        .order("starts_at", { ascending: true });

      if (slotError) {
        setMessage(slotError.message);
        setLoading(false);
        return;
      }

      const nextSlots = sortSlotsChronologically((slotRows as VolunteerSlot[]) ?? []);
      setSlots(nextSlots);

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
        );

      if (signupError) {
        setMessage(signupError.message);
      } else {
        setSignups((signupRows as VolunteerSignup[]) ?? []);
      }

      setLoading(false);
    }

    void loadData();

    const channel = supabase
      .channel("volunteer-public")
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

  async function handleSignup(event: FormEvent, slot: VolunteerSlot) {
    event.preventDefault();
    if (!configured) {
      setMessage("Supabase is not configured.");
      return;
    }

    const rawName = (nameBySlot[slot.id] ?? "").trim();
    if (!rawName) {
      setMessage("Please enter your name.");
      return;
    }

    const existingName = (signupsBySlot[slot.id] ?? []).find(
      (entry) => entry.volunteer_name.trim().toLowerCase() === rawName.toLowerCase()
    );
    if (existingName) {
      setMessage("That name is already signed up for this timeslot.");
      return;
    }

    setSubmittingSlotId(slot.id);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.from("volunteer_signups").insert({
      slot_id: slot.id,
      volunteer_name: rawName,
    });

    if (error) {
      const duplicate = error.message.toLowerCase().includes("duplicate");
      setMessage(duplicate ? "That name is already signed up for this timeslot." : error.message);
    } else {
      setNameBySlot((prev) => ({ ...prev, [slot.id]: "" }));
      setMessage("Signup saved.");
      setRefreshKey((prev) => prev + 1);
    }

    setSubmittingSlotId(null);
  }

  return (
    <AppShell title="Volunteer Signup" subtitle="Needed Timeslots">
      <Card>
        <CardContent className="space-y-4 p-5">
          <p className="text-lg font-semibold leading-snug text-foreground">
            Below are the timeslots where we could really use some volunteers to help with English
            conversations.
          </p>
          <p className="text-base font-medium text-foreground">
            You do not need to know Spanish to participate.
          </p>
          <p className="text-base text-foreground">7:00-8:30pm.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild className="w-full">
              <a
                href="https://maps.apple.com/?q=Community%20Council%20of%20Idaho%20437%20E%2013th%20St%2C%20Burley%2C%20ID%2083318"
                target="_blank"
                rel="noreferrer"
              >
                <MapPin className="h-4 w-4" />
                Open Directions
              </a>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <a href="tel:+12083125052">
                <Phone className="h-4 w-4" />
                Call Cameron
              </a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Community Council of Idaho, 437 E 13th St, Burley, ID 83318
          </p>
          <p className="text-sm text-muted-foreground">Times are shown in {VOLUNTEER_TIMEZONE} (Burley, Idaho).</p>
        </CardContent>
      </Card>

      {loading ? <p className="text-sm text-muted-foreground">Loading timeslots...</p> : null}

      {!loading && slots.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            No open timeslots right now.
          </CardContent>
        </Card>
      ) : null}

      {slots.map((slot) => {
        const slotSignups = signupsBySlot[slot.id] ?? [];
        const remainingSeats = slot.seats_available - slotSignups.length;
        return (
          <Card key={slot.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                <span>{formatVolunteerSlotTime(slot.starts_at)}</span>
                <Badge variant={remainingSeats > 0 ? "outline" : "secondary"}>
                  {Math.max(0, remainingSeats)} needed
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-bold leading-none">
                {Math.max(0, remainingSeats)} needed
              </p>
              <p className="text-sm text-muted-foreground">
                {slotSignups.length}/{slot.seats_available} filled
              </p>
              {slot.details ? <p className="text-sm text-muted-foreground">{slot.details}</p> : null}
              <div className="space-y-1">
                {slotSignups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No names added yet.</p>
                ) : (
                  slotSignups
                    .sort((a, b) => a.volunteer_name.localeCompare(b.volunteer_name))
                    .map((signup) => (
                      <p key={signup.id} className="text-sm">
                        {signup.volunteer_name}
                      </p>
                    ))
                )}
              </div>
              <form className="flex gap-2" onSubmit={(event) => void handleSignup(event, slot)}>
                <Input
                  placeholder="Your name"
                  value={nameBySlot[slot.id] ?? ""}
                  onChange={(event) =>
                    setNameBySlot((prev) => ({ ...prev, [slot.id]: event.target.value }))
                  }
                  disabled={submittingSlotId === slot.id}
                  required
                />
                <Button type="submit" disabled={submittingSlotId === slot.id}>
                  {submittingSlotId === slot.id ? "Saving..." : "Sign up"}
                </Button>
              </form>
            </CardContent>
          </Card>
        );
      })}

      {message ? (
        <p className="rounded-xl border bg-white p-3 text-sm text-muted-foreground">{message}</p>
      ) : null}
    </AppShell>
  );
}
