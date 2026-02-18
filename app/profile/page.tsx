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

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5">
      <path
        fill="#FFC107"
        d="M43.61 20.08H42V20H24v8h11.3C33.65 32.66 29.2 36 24 36c-6.63 0-12-5.37-12-12s5.37-12 12-12c3.06 0 5.84 1.15 7.95 3.05l5.66-5.66C34.05 6.05 29.27 4 24 4 12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20c0-1.34-.14-2.65-.39-3.92z"
      />
      <path
        fill="#FF3D00"
        d="M6.31 14.69l6.57 4.82C14.66 15.06 18.97 12 24 12c3.06 0 5.84 1.15 7.95 3.05l5.66-5.66C34.05 6.05 29.27 4 24 4c-7.68 0-14.38 4.34-17.69 10.69z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.17 0 9.86-1.98 13.41-5.2l-6.19-5.24C29.15 35.17 26.7 36 24 36c-5.18 0-9.62-3.32-11.28-7.93l-6.52 5.02C9.47 39.56 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.61 20.08H42V20H24v8h11.3c-.79 2.27-2.23 4.25-4.08 5.56l.01-.01 6.19 5.24C36.97 39.19 44 34 44 24c0-1.34-.14-2.65-.39-3.92z"
      />
    </svg>
  );
}

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
          <CardContent className="space-y-4 p-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">{copy.googleSignInEasier}</p>
              <Button
                type="button"
                size="lg"
                className="w-full bg-linear-to-r from-emerald-500 via-green-500 to-lime-500 text-white shadow-lg hover:from-emerald-500/90 hover:via-green-500/90 hover:to-lime-500/90"
                onClick={() => void handleGoogleSignIn()}
              >
                <GoogleLogo />
                {copy.continueWithGoogle}
              </Button>
            </div>
            <form className="space-y-3" onSubmit={handleSignIn}>
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-600">{copy.useEmailInstead}</p>
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-slate-700">
                    {copy.email}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-slate-700">
                    {copy.password}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="submit" variant="secondary">
                    {copy.signIn}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => void handleSignUp()}>
                    {copy.signUp}
                  </Button>
                </div>
              </div>
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
                  <Button className="w-full bg-linear-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-500/90 hover:to-blue-500/90">
                    Admin Panel
                  </Button>
                </Link>
                <Link href="/admin/patterns">
                  <Button className="w-full bg-linear-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-500/90 hover:to-cyan-500/90">
                    Pattern Uploads
                  </Button>
                </Link>
                <Link href="/admin/volunteer">
                  <Button className="w-full bg-linear-to-r from-fuchsia-500 to-pink-500 text-white hover:from-fuchsia-500/90 hover:to-pink-500/90">
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
