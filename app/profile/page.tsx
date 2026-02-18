"use client";

import { AppShell } from "@/components/app/app-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const { language } = useLanguage();
  const copy = t(language);
  const { user, profile, refreshProfile } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [realName, setRealName] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);

  async function saveNames() {
    if (!supabaseConfigured() || !user) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        real_name: (realName ?? profile?.real_name ?? "").trim(),
        nickname: (nickname ?? profile?.nickname ?? "").trim(),
        display_name: (nickname ?? profile?.nickname ?? "").trim(),
      })
      .eq("id", user.id);
    setMessage(error ? error.message : "Profile saved.");
    await refreshProfile();
  }

  async function handleSignUp() {
    if (!supabaseConfigured()) {
      setMessage(copy.supabaseMissing);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    setMessage(error ? error.message : copy.accountCreated);
    await refreshProfile();
  }

  async function handleSignIn(event: FormEvent) {
    event.preventDefault();
    if (!supabaseConfigured()) {
      setMessage(copy.supabaseMissing);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : copy.signedIn);
    await refreshProfile();
  }

  async function handleSignOut() {
    if (!supabaseConfigured()) {
      setMessage(copy.supabaseMissing);
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    await refreshProfile();
    setMessage(copy.signedOut);
  }

  async function handleGoogleSignIn() {
    if (!supabaseConfigured()) {
      setMessage(copy.supabaseMissing);
      return;
    }

    const supabase = createClient();
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const normalizedSiteUrl = configuredSiteUrl?.replace(/\/+$/, "");
    const redirectBase = normalizedSiteUrl || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${redirectBase}/profile`,
      },
    });

    if (error) {
      setMessage(error.message);
    }
  }

  return (
    <AppShell title={copy.profile} subtitle={copy.optionalLogin}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {user ? `${copy.loggedInAs} ${user.email}` : copy.continueGuest}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{copy.gamesOpenNotice}</p>
        </CardContent>
      </Card>

      {!user ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <form className="space-y-3" onSubmit={handleSignIn}>
              <div className="space-y-1">
                <Label htmlFor="email">{copy.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">{copy.password}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button type="submit">{copy.signIn}</Button>
                <Button type="button" variant="secondary" onClick={() => void handleSignUp()}>
                  {copy.signUp}
                </Button>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={() => void handleGoogleSignIn()}>
                {copy.continueWithGoogle}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="space-y-1">
              <Label>Real name</Label>
              <Input
                onChange={(event) => setRealName(event.target.value)}
                value={realName ?? profile?.real_name ?? ""}
              />
            </div>
            <div className="space-y-1">
              <Label>Nickname</Label>
              <Input
                onChange={(event) => setNickname(event.target.value)}
                value={nickname ?? profile?.nickname ?? ""}
              />
            </div>
            <Button variant="secondary" onClick={() => void saveNames()}>
              Save profile
            </Button>
            {profile?.is_admin ? (
              <div className="space-y-2">
                <Link href="/admin">
                  <Button variant="outline" className="w-full">
                    Admin Panel
                  </Button>
                </Link>
                <Link href="/admin/volunteer">
                  <Button variant="outline" className="w-full">
                    Volunteer Scheduler
                  </Button>
                </Link>
              </div>
            ) : null}
            <Button onClick={handleSignOut}>{copy.signOut}</Button>
          </CardContent>
        </Card>
      )}

      {message ? (
        <p className="rounded-xl border bg-white p-3 text-sm text-muted-foreground">{message}</p>
      ) : null}
    </AppShell>
  );
}
