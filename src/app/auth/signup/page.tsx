"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getCredits } from "@/lib/credits";
import { useLang, TRANSLATIONS } from "@/lib/i18n";

export default function SignUpPage() {
  const { lang } = useLang();
  const tr       = TRANSLATIONS[lang];
  const router   = useRouter();

  const [form, setForm] = useState({
    name: "", email: "", password: "", company: "", jobTitle: "", country: "",
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // localStorage 크레딧 병합
    const localCredits = getCredits();

    try {
      const res = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...form, localCredits }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        setLoading(false);
        return;
      }

      // 자동 로그인
      const signInRes = await signIn("credentials", {
        email:    form.email,
        password: form.password,
        redirect: false,
      });
      setLoading(false);
      if (signInRes?.error) {
        router.push("/auth/signin");
      } else {
        router.push("/account");
      }
    } catch {
      setError(tr.networkError);
      setLoading(false);
    }
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl: "/account" });
  }

  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-baseline gap-2 hover:opacity-80 transition-opacity">
            <span className="text-white text-base font-bold tracking-[0.15em] uppercase">Tenasia</span>
            <span className="text-white/30 text-[10px] tracking-[0.4em] uppercase">{tr.gallery}</span>
          </a>
        </div>

        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 shadow-2xl">
          <h1 className="text-white text-lg font-semibold mb-5">{tr.authSignUp}</h1>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                       border border-white/15 bg-white/5 hover:bg-white/10 text-white text-sm
                       transition-colors duration-150 mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            {tr.authContinueWithGoogle}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-white/25 text-xs">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* 이름 */}
            <div>
              <label className="block text-white/50 text-xs mb-1">{tr.authName}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={tr.authNamePlaceholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5
                           text-white text-sm placeholder:text-white/20 focus:outline-none
                           focus:border-white/30 transition-colors"
              />
            </div>
            {/* 이메일 */}
            <div>
              <label className="block text-white/50 text-xs mb-1">{tr.authEmail}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder={tr.authEmailPlaceholder}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5
                           text-white text-sm placeholder:text-white/20 focus:outline-none
                           focus:border-white/30 transition-colors"
              />
            </div>
            {/* 비밀번호 */}
            <div>
              <label className="block text-white/50 text-xs mb-1">{tr.authPassword}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder={tr.authPasswordPlaceholder}
                required
                minLength={8}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5
                           text-white text-sm placeholder:text-white/20 focus:outline-none
                           focus:border-white/30 transition-colors"
              />
            </div>
            {/* 선택 항목 */}
            <div className="pt-1 space-y-3">
              <p className="text-white/20 text-[11px]">{tr.authOptional}</p>
              <input
                type="text"
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder={`${tr.authCompany} (${tr.authOptional})`}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5
                           text-white text-sm placeholder:text-white/20 focus:outline-none
                           focus:border-white/30 transition-colors"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={form.jobTitle}
                  onChange={(e) => set("jobTitle", e.target.value)}
                  placeholder={tr.authJobTitlePlaceholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5
                             text-white text-sm placeholder:text-white/20 focus:outline-none
                             focus:border-white/30 transition-colors"
                />
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  placeholder={tr.authCountryPlaceholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5
                             text-white text-sm placeholder:text-white/20 focus:outline-none
                             focus:border-white/30 transition-colors"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-white text-black text-sm font-semibold
                         hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors"
            >
              {loading ? tr.authCreatingAccount : tr.authSignUp}
            </button>
          </form>

          <p className="mt-4 text-center text-white/30 text-xs">
            {tr.authHasAccount}{" "}
            <a href="/auth/signin" className="text-white/60 hover:text-white transition-colors underline">
              {tr.authSignIn}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
