"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, supabaseConfigured } from "@/lib/supabase";

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  company: string | null;
  website: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const loadProfile = async (retries = 3) => {
      if (!supabaseConfigured || !supabase) {
        setStatus("Authentication not configured");
        setLoading(false);
        return;
      }

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          // Force fresh session check with cache-busting
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            if (attempt < retries) {
              console.warn(`Session fetch attempt ${attempt} failed, retrying...`, sessionError);
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              continue;
            }
          }
          
          if (sessionError || !session) {
            router.replace("/login?redirect=/profile");
            return;
          }

          // session is guaranteed to be defined here after the check above
          const userId = session.user.id;

          // Fetch user profile with cache-busting
          const { data: profileData, error: profileError } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();

          if (profileError) {
            // Check if it's a "not found" error (PGRST116) - profile doesn't exist
            if (profileError.code === 'PGRST116' || profileError.message.includes('No rows')) {
              // Create profile if it doesn't exist
              const { error: insertError } = await supabase
                .from("users")
                .insert({
                  id: userId,
                  email: session.user.email,
                  full_name: session.user.email?.split('@')[0] || 'User',
                });
              
              if (!insertError) {
                // Refetch after creation with fresh query
                const { data: newProfile } = await supabase
                  .from("users")
                  .select("*")
                  .eq("id", userId)
                  .single();
                
                setProfile(newProfile);
              } else {
                console.error("Error creating profile:", insertError);
                setStatus("Failed to create profile");
              }
            } else {
              // Other errors - retry if not last attempt
              if (attempt < retries) {
                console.warn(`Profile fetch attempt ${attempt} failed, retrying...`, profileError);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
              }
              console.error("Profile fetch error:", profileError);
              setStatus("Failed to load profile");
            }
          } else {
            setProfile(profileData);
          }

          setLoading(false);
          return; // Success, exit retry loop
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          if (attempt < retries) {
            console.warn(`Profile load attempt ${attempt} failed, retrying...`, err);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          console.error("Error loading profile:", err);
          setStatus(`Failed to load profile: ${errorMessage}`);
          setLoading(false);
        }
      }
    };

    loadProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !profile) return;

    setSaving(true);
    setStatus("Saving...");

    const { error } = await supabase
      .from("users")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        bio: profile.bio,
        company: profile.company,
        website: profile.website,
      })
      .eq("id", profile.id);

    if (error) {
      setStatus(`Error: ${error.message}`);
    } else {
      setStatus("✅ Profile updated successfully!");
      setTimeout(() => setStatus(""), 3000);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <main className="relative min-h-screen">
        <div
          aria-hidden
          className="fixed inset-0 -z-10"
          style={{
            backgroundColor: '#fff8dc',
            backgroundImage: 'radial-gradient(rgba(201,162,39,0.6) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            backgroundPosition: '0 0',
          }}
        />
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center rounded-xl border border-black/10 bg-white/70 backdrop-blur p-8 max-w-md text-slate-900">
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto rounded-full border-4 border-black/10 border-t-amber-500 animate-spin"></div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Loading Profile...</h2>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="relative min-h-screen">
        <div
          aria-hidden
          className="fixed inset-0 -z-10"
          style={{
            backgroundColor: '#fff8dc',
            backgroundImage: 'radial-gradient(rgba(201,162,39,0.6) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            backgroundPosition: '0 0',
          }}
        />
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center rounded-xl border border-red-300 bg-red-50/70 backdrop-blur p-8 max-w-md text-slate-900">
            <h2 className="text-xl font-bold text-red-900 mb-2">Profile Not Found</h2>
            <p className="text-red-700 mb-6">Unable to load your profile</p>
            <button 
              onClick={() => router.push("/")} 
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 font-semibold text-slate-900 bg-gradient-to-r from-yellow-400 to-amber-500 shadow hover:brightness-105"
            >
              Go Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen">
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: '#fff8dc',
          backgroundImage: 'radial-gradient(rgba(201,162,39,0.6) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          backgroundPosition: '0 0',
        }}
      />

      <div className="max-w-3xl mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 md:mb-8 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Your Profile
            </h1>
            <p className="text-sm sm:text-base text-slate-700 mt-2">
              Manage your account information
            </p>
          </div>
          <button
            onClick={() => router.push("/rooms")}
            className="inline-flex items-center gap-2 rounded-md px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border border-black/15 bg-white/60 hover:bg-white/80 min-h-[44px] self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Back to Rooms</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>

        <div className="rounded-xl border border-black/10 bg-white/70 backdrop-blur p-4 sm:p-6 md:p-8 text-slate-900">
          <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
            {/* Profile Avatar */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg">
                {profile.full_name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-bold">{profile.full_name || 'Your Name'}</h3>
                <p className="text-xs sm:text-sm text-slate-600">{profile.email}</p>
              </div>
            </div>

            <div className="h-px bg-black/10" />

            {/* Profile Form */}
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="full_name" className="block text-sm font-medium mb-1">
                  Full Name
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full rounded-md border border-black/20 bg-white/70 p-2 outline-none focus:ring-2 focus:ring-amber-400/50 text-sm sm:text-base min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-md border border-black/20 bg-white/70 p-2 outline-none focus:ring-2 focus:ring-amber-400/50 text-sm sm:text-base min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium mb-1">
                  Company
                </label>
                <input
                  id="company"
                  type="text"
                  value={profile.company || ''}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  placeholder="Your company"
                  className="w-full rounded-md border border-black/20 bg-white/70 p-2 outline-none focus:ring-2 focus:ring-amber-400/50 text-sm sm:text-base min-h-[44px]"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="website" className="block text-sm font-medium mb-1">
                  Website
                </label>
                <input
                  id="website"
                  type="url"
                  value={profile.website || ''}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full rounded-md border border-black/20 bg-white/70 p-2 outline-none focus:ring-2 focus:ring-amber-400/50 text-sm sm:text-base min-h-[44px]"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="bio" className="block text-sm font-medium mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="w-full rounded-md border border-black/20 bg-white/70 p-2 outline-none focus:ring-2 focus:ring-amber-400/50 resize-none text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-semibold text-slate-900 bg-gradient-to-r from-yellow-400 to-amber-500 shadow hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 min-h-[44px] text-sm sm:text-base"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push("/rooms")}
                className="sm:flex-none inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-semibold border border-black/15 bg-white/60 hover:bg-white/80 min-h-[44px] text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>

            {status && (
              <div className={`mt-4 p-3 rounded-lg ${
                status.includes("✅")
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}>
                <p className="text-sm font-medium">{status}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}

