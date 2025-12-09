// components/SiteHeader.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Login error:', error.message);
      alert('Failed to log in. Please try again.');
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
      alert('Failed to log out. Please try again.');
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Left: site title */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-2xl font-bold text-slate-100 transition-colors hover:text-emerald-300"
          >
            AppLabo
          </Link>
        </div>

        {/* Right: login / logout + menu */}
        <nav className="flex items-center gap-2">
          {!loading && (
            <>
              {user ? (
                <>
                  <span className="hidden text-xs text-slate-300 sm:inline">
                    {user.email}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full border border-sky-500 px-3 py-1 text-sm font-medium text-sky-200 hover:bg-sky-500/10"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleLogin}
                  className="rounded-full border border-sky-500 px-3 py-1 text-sm font-medium text-sky-200 hover:bg-sky-500/10"
                >
                  Login
                </button>
              )}
            </>
          )}

          {/* 3-dot menu (そのまま日本語でもOKなら変更不要) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-full border border-slate-700 px-2 py-1 text-slate-100 hover:bg-slate-800"
              aria-label="Menu"
            >
              ⋯
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-md border border-slate-700 bg-slate-900 py-1 text-sm shadow-lg">
                <Link
                  href="/contact"
                  className="block px-3 py-1 text-slate-100 hover:bg-slate-800"
                  onClick={() => setMenuOpen(false)}
                >
                  Contact developer
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
