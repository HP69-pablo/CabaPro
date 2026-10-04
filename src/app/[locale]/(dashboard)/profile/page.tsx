"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "@/i18n/navigation";
import { getDocById, setDoc } from "@/lib/firestore";
import { updateProfile } from "firebase/auth";
import { User, Mail, Calendar, Shield, Loader2, Phone, MapPin, Edit3, CheckCircle2 } from "lucide-react";

interface UserProfileData {
  displayName?: string;
  phone?: string;
  city?: string;
  bio?: string;
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const { user, loading, signOut } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || "");

    const loadProfile = async () => {
      try {
        const doc = await getDocById<UserProfileData>("users", user.uid);
        if (doc) {
          if (doc.displayName) setDisplayName(doc.displayName);
          if (doc.phone) setPhone(doc.phone);
          if (doc.city) setCity(doc.city);
          if (doc.bio) setBio(doc.bio);
        }
      } catch (err) {
        console.warn("Could not load user profile:", err);
      }
    };
    loadProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSavedSuccess(false);

    try {
      if (displayName.trim() && displayName !== user.displayName) {
        await updateProfile(user, { displayName: displayName.trim() });
      }

      await setDoc("users", user.uid, {
        displayName: displayName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        bio: bio.trim(),
        updatedAt: new Date(),
      });

      setSavedSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-slate-500 mb-4">{t("notVerified")}</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            {tCommon("login" as any) || "Sign In"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span>{isEditing ? tCommon("cancel") : t("editProfile")}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{tCommon("success")}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-6">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="h-16 w-16 rounded-full object-cover border border-slate-200" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <User className="h-8 w-8" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {displayName || user.displayName || user.email?.split("@")[0]}
            </h2>
            <p className="text-xs text-slate-400">{user.email}</p>
            {user.emailVerified ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
                <Shield className="h-3 w-3" /> {t("verified")}
              </span>
            ) : (
              <span className="inline-block text-[11px] text-slate-400 mt-1">
                {t("notVerified")}
              </span>
            )}
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tCommon("appName") === "Caba Pro" ? "Full Name" : "الاسم الكامل"}
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+213 555 12 34 56"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City / Location
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Algiers, Algeria"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                About / Bio
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Regular traveler between Paris and Algiers..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                {tCommon("cancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-1"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {tCommon("save")}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-slate-600">
              <Mail className="h-4 w-4 text-slate-400" />
              <span>{user.email}</span>
            </div>

            {phone && (
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{phone}</span>
              </div>
            )}

            {city && (
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{city}</span>
              </div>
            )}

            {bio && (
              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 italic">
                "{bio}"
              </div>
            )}

            <div className="flex items-center gap-3 text-slate-500 text-xs pt-2 border-t border-slate-100">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {t("memberSince")}{" "}
                {user.metadata.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString()
                  : "—"}
              </span>
            </div>

            {/* Logout button */}
            <div className="pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => signOut()}
                className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
              >
                {tCommon("appName") === "Caba Pro" ? "Sign Out" : "تسجيل الخروج"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
