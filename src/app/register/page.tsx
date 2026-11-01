
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  BookOpen,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  UserRound,
} from "lucide-react";

// ---------------------------------
// Register API Response
// ---------------------------------

type RegisterResponse = {
  success: boolean;
  message?: string;
  user?: {
    uid: string;
    name: string | null;
    email: string | null;
  };
};

// ---------------------------------
// Register Page
// ---------------------------------

export default function RegisterPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  // ---------------------------------
  // POST: สมัครสมาชิกผ่าน Back-end API
  // ---------------------------------

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setMessage("");

    const formData = new FormData(e.currentTarget);

    const name = String(
      formData.get("name") ?? ""
    ).trim();

    const email = String(
      formData.get("email") ?? ""
    ).trim().toLowerCase();

    const password = String(
      formData.get("password") ?? ""
    );

    const confirmPassword = String(
      formData.get("confirmPassword") ?? ""
    );

    // ตรวจสอบชื่อและอีเมล
    if (!name || !email) {
      setMessageType("error");
      setMessage("กรุณากรอกชื่อและอีเมล");
      return;
    }

    // ตรวจสอบความยาวรหัสผ่าน
    if (password.length < 6) {
      setMessageType("error");
      setMessage("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    // ตรวจสอบรหัสผ่านทั้งสองช่อง
    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    setLoading(true);
    setMessageType("error");

    try {
      // ---------------------------------
      // ส่งข้อมูลไปยัง Register API
      // ---------------------------------

      const response = await fetch("/api/register", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name,
          email,
          password,
        }),

        cache: "no-store",
      });

      // อ่าน Response จาก Back-end
      let result: RegisterResponse;

      try {
        result = (await response.json()) as RegisterResponse;
      } catch {
        throw new Error(
          "ไม่สามารถอ่านข้อมูลจากเซิร์ฟเวอร์ได้"
        );
      }

      // ตรวจสอบผลลัพธ์การสมัครสมาชิก
      if (!response.ok || result.success !== true) {
        setMessage(
          result.message ||
            "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่"
        );
        return;
      }

      // ตรวจสอบข้อมูลบัญชีที่ได้รับกลับมา
      if (!result.user?.uid) {
        throw new Error(
          "สมัครสมาชิกแล้ว แต่ไม่ได้รับข้อมูลบัญชีจากเซิร์ฟเวอร์"
        );
      }

      // ---------------------------------
      // สมัครสมาชิกสำเร็จ
      // ---------------------------------

      setMessageType("success");
      setMessage("สมัครสมาชิกเรียบร้อยแล้ว");

      // ไปหน้า Login เพื่อเข้าสู่ระบบด้วยตนเอง
      router.replace("/login?registered=1");

    } catch (error) {
      console.error("Register error:", error);

      setMessageType("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "สมัครสมาชิกไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่"
      );

    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------
  // Register UI
  // ---------------------------------

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <BookOpen size={26} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              StudyMate
            </h1>

            <p className="text-sm text-gray-500">
              Your study companion
            </p>
          </div>
        </Link>

        {/* Register Card */}
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 sm:p-8">

          <div className="mb-7 text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              สร้างบัญชีใหม่
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              เริ่มวางแผนการเรียนของคุณไปด้วยกัน
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                ชื่อที่ใช้แสดง
              </label>

              <div className="relative">
                <UserRound
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="ชื่อของคุณ"
                  autoComplete="name"
                  maxLength={80}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                อีเมล
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                รหัสผ่าน
              </label>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-12 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={
                    showPassword
                      ? "ซ่อนรหัสผ่าน"
                      : "แสดงรหัสผ่าน"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                ยืนยันรหัสผ่าน
              </label>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword ? "text" : "password"
                  }
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-12 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "ซ่อนรหัสผ่านยืนยัน"
                      : "แสดงรหัสผ่านยืนยัน"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "กำลังสมัครสมาชิก..."
                : "สมัครสมาชิก"}
            </button>

            {/* Success / Error Message */}
            {message && (
              <p
                role={
                  messageType === "error"
                    ? "alert"
                    : "status"
                }
                className={`rounded-xl p-3 text-sm leading-6 ${
                  messageType === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {message}
              </p>
            )}

          </form>

          <div className="my-6 border-t border-gray-100" />

          <p className="text-center text-sm text-gray-500">
            มีบัญชีอยู่แล้ว?{" "}

            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              เข้าสู่ระบบ
            </Link>
          </p>

        </section>

        <p className="mt-6 text-center text-xs text-gray-400">
          จัดการทุกงานเรียนได้ง่ายขึ้นด้วย StudyMate
        </p>

      </div>
    </main>
  );
}
