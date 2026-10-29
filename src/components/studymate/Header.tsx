
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  UserRound,
  LogOut,
} from "lucide-react";
import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Header() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const today = new Date().toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ตรวจสอบสถานะการเข้าสู่ระบบจาก Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // ออกจากระบบ
  async function handleLogout() {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      window.alert("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-5 sm:px-8">
      {/* ส่วนหัวด้านซ้าย */}
      <div>
        <p className="text-sm text-gray-500">{today}</p>

        <h2 className="mt-1 text-xl font-bold text-gray-800 sm:text-2xl">
          พร้อมลุยงานวันนี้หรือยัง?
        </h2>
      </div>

      {/* ส่วนด้านขวา */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* ช่องค้นหา */}
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
          <Search size={18} className="shrink-0 text-gray-400" />

          <input
            type="text"
            placeholder="ค้นหางาน..."
            aria-label="ค้นหางาน"
            className="w-24 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 sm:w-36"
          />
        </label>

        {/* การแจ้งเตือน */}
        <button
          type="button"
          aria-label="การแจ้งเตือน"
          className="rounded-xl border border-gray-200 p-3 text-gray-600 transition hover:bg-gray-50"
        >
          <Bell size={19} />
        </button>

        {/* รอให้ Firebase ตรวจสอบสถานะก่อนแสดงปุ่มบัญชี */}
        {authReady && (
          <>
            {user ? (
              <>
                {/* แสดงเมื่อเข้าสู่ระบบแล้ว */}
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <UserRound size={18} />
                  <span className="max-w-32 truncate">
                    {user.displayName?.trim() || "โปรไฟล์"}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:px-4"
                >
                  <LogOut size={17} />
                  <span>ออกจากระบบ</span>
                </button>
              </>
            ) : (
              <>
                {/* แสดงเฉพาะเมื่อยังไม่ได้เข้าสู่ระบบ */}
                <Link
                  href="/login"
                  className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:px-4"
                >
                  เข้าสู่ระบบ
                </Link>

                <Link
                  href="/register"
                  className="rounded-xl bg-blue-600 px-3 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 sm:px-4"
                >
                  สมัครสมาชิก
                </Link>
              </>
            )}
          </>
        )}
      </div>
    </header>
  );
}
