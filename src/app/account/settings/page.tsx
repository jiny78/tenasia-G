"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useLang, TRANSLATIONS } from "@/lib/i18n";

interface Credential {
  status:     string;
  type:       string;
  reviewNote: string | null;
  createdAt:  string;
}

const CRED_TYPES = ["press_id", "media_badge", "agency_letter", "other"];
type ProfileForm = {
  name: string | null;
  company: string | null;
  jobTitle: string | null;
  country: string | null;
};

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { lang } = useLang();
  const tr       = TRANSLATIONS[lang];

  // 프로필
  const [profile, setProfile] = useState<ProfileForm>({
    name: null, company: null, jobTitle: null, country: null,
  });
  const [profileMsg, setProfileMsg] = useState("");

  // 비밀번호
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwMsg,  setPwMsg]  = useState("");

  // 크리덴셜
  const [cred,     setCred]     = useState<Credential | null>(null);
  const [credType, setCredType] = useState("press_id");
  const [credMsg,  setCredMsg]  = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/account/credentials")
      .then((r) => r.json())
      .then((d) => setCred(d.credential));
  }, [session]);

  const resolvedProfile = {
    name: profile.name ?? session?.user?.name ?? "",
    company: profile.company ?? session?.user?.company ?? "",
    jobTitle: profile.jobTitle ?? "",
    country: profile.country ?? "",
  };

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setProfileMsg("");
    const res  = await fetch("/api/account/settings", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(resolvedProfile),
    });
    setSaving(false);
    if (res.ok) {
      await updateSession({ name: resolvedProfile.name });
      setProfileMsg(tr.accountProfileSaved);
    } else {
      const d = await res.json();
      setProfileMsg(d.error ?? "Error");
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setPwMsg("");
    const res = await fetch("/api/account/settings", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(pwForm),
    });
    setSaving(false);
    if (res.ok) {
      setPwMsg(tr.accountPasswordChanged);
      setPwForm({ currentPassword: "", newPassword: "" });
    } else {
      const d = await res.json();
      setPwMsg(d.error ?? "Error");
    }
  }

  async function submitCredential(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setSaving(true);
    setCredMsg("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", credType);
    const res = await fetch("/api/account/credentials", { method: "POST", body: fd });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      setCred(d.credential);
      setCredMsg(tr.accountCredentialSubmitted);
      if (fileRef.current) fileRef.current.value = "";
    } else {
      const d = await res.json();
      setCredMsg(d.error ?? "Upload failed");
    }
  }

  const inputCls = `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5
                    text-white text-sm placeholder:text-white/20 focus:outline-none
                    focus:border-white/30 transition-colors`;
  const sectionCls = "bg-white/[0.02] border border-white/8 rounded-2xl p-5 space-y-4";
  const labelCls   = "block text-white/40 text-xs mb-1";

  return (
    <div className="space-y-6">
      <h1 className="text-white text-xl font-semibold">{tr.accountSettings}</h1>

      {/* 프로필 */}
      <section className={sectionCls}>
        <h2 className="text-white/70 text-sm font-medium">{tr.accountProfile}</h2>
        <form onSubmit={saveProfile} className="space-y-3">
          <div>
            <label className={labelCls}>{tr.authName}</label>
            <input type="text" value={resolvedProfile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              placeholder={tr.authNamePlaceholder} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{tr.authCompany}</label>
            <input type="text" value={resolvedProfile.company}
              onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
              placeholder={tr.authCompanyPlaceholder} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{tr.authJobTitle}</label>
              <input type="text" value={resolvedProfile.jobTitle}
                onChange={(e) => setProfile((p) => ({ ...p, jobTitle: e.target.value }))}
                placeholder={tr.authJobTitlePlaceholder} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{tr.authCountry}</label>
              <input type="text" value={resolvedProfile.country}
                onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
                placeholder={tr.authCountryPlaceholder} className={inputCls} />
            </div>
          </div>
          {profileMsg && (
            <p className={`text-xs ${profileMsg.includes("Error") ? "text-red-400" : "text-emerald-400"}`}>
              {profileMsg}
            </p>
          )}
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold
                       hover:bg-white/90 disabled:opacity-40 transition-colors">
            {tr.accountSaveChanges}
          </button>
        </form>
      </section>

      {/* 비밀번호 변경 */}
      <section className={sectionCls}>
        <h2 className="text-white/70 text-sm font-medium">{tr.accountChangePassword}</h2>
        <form onSubmit={changePassword} className="space-y-3">
          <div>
            <label className={labelCls}>{tr.accountCurrentPassword}</label>
            <input type="password" value={pwForm.currentPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
              placeholder="••••••••" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{tr.accountNewPassword}</label>
            <input type="password" value={pwForm.newPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
              placeholder={tr.authPasswordPlaceholder} className={inputCls} />
          </div>
          {pwMsg && (
            <p className={`text-xs ${pwMsg.includes("Error") || pwMsg.includes("incorrect") ? "text-red-400" : "text-emerald-400"}`}>
              {pwMsg}
            </p>
          )}
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm
                       hover:bg-white/15 disabled:opacity-40 transition-colors border border-white/10">
            {tr.accountChangePassword}
          </button>
        </form>
      </section>

      {/* 미디어 크리덴셜 */}
      <section className={sectionCls}>
        <div>
          <h2 className="text-white/70 text-sm font-medium">{tr.accountPressCredentials}</h2>
          <p className="text-white/30 text-xs mt-1">{tr.accountPressCredentialsSub}</p>
        </div>

        {cred && (
          <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/8 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/60">{tr.accountCredentialStatus}:</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                cred.status === "approved"  ? "bg-emerald-400/10 text-emerald-400" :
                cred.status === "rejected"  ? "bg-red-400/10 text-red-400" :
                                               "bg-amber-400/10 text-amber-400"
              }`}>
                {cred.status === "approved" ? tr.accountCredentialApproved :
                 cred.status === "rejected" ? tr.accountCredentialRejected :
                                              tr.accountCredentialPending}
              </span>
            </div>
            {cred.reviewNote && (
              <p className="text-white/30 text-xs mt-1">{cred.reviewNote}</p>
            )}
          </div>
        )}

        <form onSubmit={submitCredential} className="space-y-3">
          <div>
            <label className={labelCls}>{tr.accountCredentialType}</label>
            <select value={credType} onChange={(e) => setCredType(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5
                         text-white text-sm focus:outline-none focus:border-white/30">
              {CRED_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>{tr.accountCredentialFile}</label>
            <input ref={fileRef} type="file"
              accept="image/*,.pdf"
              required
              className="w-full text-white/50 text-sm file:mr-3 file:py-1.5 file:px-3
                         file:rounded-lg file:border-0 file:bg-white/10 file:text-white/70
                         file:text-xs file:cursor-pointer hover:file:bg-white/15" />
          </div>
          {credMsg && (
            <p className={`text-xs ${credMsg.includes("failed") || credMsg.includes("Error") ? "text-red-400" : "text-emerald-400"}`}>
              {credMsg}
            </p>
          )}
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm
                       hover:bg-white/15 disabled:opacity-40 transition-colors border border-white/10">
            {tr.accountSubmitCredentials}
          </button>
        </form>
      </section>
    </div>
  );
}
