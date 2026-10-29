
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  ArrowLeft,
  UserRound,
  Mail,
  GraduationCap,
  CalendarDays,
  Pencil,
  Save,
  X,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";

type UserProfile = {
  name: string;
  email: string;
  major: string;
  year: string;
  bio: string;
};

const emptyProfile: UserProfile = {
  name: "",
  email: "",
  major: "",
  year: "",
  bio: "",
};

export default function ProfilePage() {
  const router = useRouter();

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [draft, setDraft] = useState<UserProfile>(emptyProfile);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  // ตรวจสอบผู้ใช้และโหลดข้อมูลโปรไฟล์
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFirebaseUser(null);
        setLoading(false);
        router.replace("/login");
        return;
      }

      setFirebaseUser(user);

      try {
        const profileRef = doc(db, "users", user.uid);
        const profileSnap = await getDoc(profileRef);

        const savedData = profileSnap.exists()
          ? profileSnap.data()
          : {};

        const loadedProfile: UserProfile = {
          name: String(savedData.name ?? user.displayName ?? ""),
          email: user.email ?? "",
          major: String(savedData.major ?? ""),
          year: String(savedData.year ?? ""),
          bio: String(savedData.bio ?? ""),
        };

        setProfile(loadedProfile);
        setDraft(loadedProfile);
      } catch (error) {
        console.error("Load profile error:", error);
        setMessageType("error");
        setMessage("โหลดข้อมูลโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  function handleEdit() {
    setDraft(profile);
    setIsEditing(true);
    setMessage("");
  }

  function handleCancel() {
    setDraft(profile);
    setIsEditing(false);
    setMessage("");
  }

  // บันทึกข้อมูลลง Firebase Authentication และ Firestore
  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!firebaseUser) {
      setMessageType("error");
      setMessage("กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล");
      return;
    }

    const normalizedName = draft.name.trim();

    if (!normalizedName) {
      setMessageType("error");
      setMessage("กรุณากรอกชื่อที่ใช้แสดง");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await updateProfile(firebaseUser, {
        displayName: normalizedName,
      });

      const updatedProfile: UserProfile = {
        ...draft,
        name: normalizedName,
        email: firebaseUser.email ?? profile.email,
        major: draft.major.trim(),
        bio: draft.bio.trim(),
      };

      await setDoc(
        doc(db, "users", firebaseUser.uid),
        {
          uid: firebaseUser.uid,
          name: updatedProfile.name,
          email: updatedProfile.email,
          major: updatedProfile.major,
          year: updatedProfile.year,
          bio: updatedProfile.bio,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setProfile(updatedProfile);
      setDraft(updatedProfile);
      setIsEditing(false);
      setMessageType("success");
      setMessage("บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว");
    } catch (error) {
      console.error("Save profile error:", error);
      setMessageType("error");
      setMessage("บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบ Firestore Rules");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    setMessage("");

    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setMessageType("error");
      setMessage("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่");
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">
          กำลังโหลดข้อมูลโปรไฟล์...
        </p>
      </main>
    );
  }

  const initial = profile.name.trim().charAt(0) || "S";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={18} />
            กลับหน้าหลัก
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          >
            <LogOut size={17} />
            {loggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
          </button>
        </div>

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            โปรไฟล์ของฉัน
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            จัดการข้อมูลส่วนตัวของคุณใน StudyMate
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {/* Profile card */}
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="h-24 bg-gradient-to-r from-blue-600 to-sky-400" />

            <div className="px-6 pb-6">
              <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-3xl font-bold text-blue-700">
                {initial}
              </div>

              <h2 className="mt-4 break-words text-xl font-bold text-gray-900">
                {profile.name}
              </h2>

              <p className="mt-1 break-all text-sm text-gray-500">
                {profile.email}
              </p>

              <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <GraduationCap size={18} className="text-blue-600" />
                  <span>
                    {profile.major || "ยังไม่ได้ระบุสาขาวิชา"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CalendarDays size={18} className="text-blue-600" />
                  <span>
                    {profile.year || "ยังไม่ได้ระบุชั้นปี"}
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-green-50 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                  <ShieldCheck size={18} />
                  เชื่อมต่อบัญชี Firebase แล้ว
                </div>
              </div>
            </div>
          </section>

          {/* Profile information */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  ข้อมูลส่วนตัว
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  ข้อมูลที่บันทึกไว้ในบัญชีของคุณ
                </p>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Pencil size={16} />
                  แก้ไขโปรไฟล์
                </button>
              )}
            </div>

            <form onSubmit={handleSave}>
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label
                    htmlFor="profile-name"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    ชื่อที่ใช้แสดง
                  </label>

                  <div className="relative">
                    <UserRound
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="profile-name"
                      type="text"
                      value={isEditing ? draft.name : profile.name}
                      onChange={(e) =>
                        setDraft({ ...draft, name: e.target.value })
                      }
                      readOnly={!isEditing}
                      maxLength={80}
                      required
                      className={`w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none transition ${
                        isEditing
                          ? "border-gray-200 bg-white text-gray-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          : "border-transparent bg-gray-50 text-gray-700"
                      }`}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="profile-email"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    อีเมล
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="profile-email"
                      type="email"
                      value={profile.email}
                      readOnly
                      className="w-full rounded-xl border border-transparent bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-500 outline-none"
                    />
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    อีเมลมาจากบัญชี Firebase Authentication
                  </p>
                </div>

                {/* Major */}
                <div>
                  <label
                    htmlFor="profile-major"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    สาขาวิชา
                  </label>

                  <div className="relative">
                    <GraduationCap
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="profile-major"
                      type="text"
                      placeholder="เช่น เทคโนโลยีสารสนเทศ"
                      value={isEditing ? draft.major : profile.major}
                      onChange={(e) =>
                        setDraft({ ...draft, major: e.target.value })
                      }
                      readOnly={!isEditing}
                      className={`w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none transition ${
                        isEditing
                          ? "border-gray-200 bg-white text-gray-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          : "border-transparent bg-gray-50 text-gray-700"
                      }`}
                    />
                  </div>
                </div>

                {/* Year */}
                <div>
                  <label
                    htmlFor="profile-year"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    ชั้นปี
                  </label>

                  {isEditing ? (
                    <select
                      id="profile-year"
                      value={draft.year}
                      onChange={(e) =>
                        setDraft({ ...draft, year: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">ยังไม่ได้ระบุ</option>
                      <option value="ปี 1">ปี 1</option>
                      <option value="ปี 2">ปี 2</option>
                      <option value="ปี 3">ปี 3</option>
                      <option value="ปี 4">ปี 4</option>
                      <option value="อื่น ๆ">อื่น ๆ</option>
                    </select>
                  ) : (
                    <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                      {profile.year || "ยังไม่ได้ระบุ"}
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label
                    htmlFor="profile-bio"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    เกี่ยวกับฉัน
                  </label>

                  <textarea
                    id="profile-bio"
                    rows={3}
                    maxLength={300}
                    placeholder="แนะนำตัวสั้น ๆ"
                    value={isEditing ? draft.bio : profile.bio}
                    onChange={(e) =>
                      setDraft({ ...draft, bio: e.target.value })
                    }
                    readOnly={!isEditing}
                    className={`w-full resize-y rounded-xl border px-4 py-3 text-sm outline-none transition ${
                      isEditing
                        ? "border-gray-200 bg-white text-gray-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        : "border-transparent bg-gray-50 text-gray-700"
                    }`}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    <X size={17} />
                    ยกเลิก
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Save size={17} />
                    {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                  </button>
                </div>
              )}
            </form>

            {message && (
              <p
                role="status"
                className={`mt-5 rounded-xl px-4 py-3 text-sm ${
                  messageType === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {message}
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
