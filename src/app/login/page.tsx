
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  BookOpen,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
} from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage(
      "หน้าจอพร้อมใช้งานแล้ว แต่ระบบเข้าสู่ระบบจริงยังไม่ได้เชื่อมต่อ"
    );
  }

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

        {/* Login Card */}
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 sm:p-8">
          <div className="mb-7 text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              ยินดีต้อนรับกลับ!
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              เข้าสู่ระบบเพื่อจัดการงานเรียนของคุณ
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="กรอกรหัสผ่าน"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-12 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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

            {/* Submit */}
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.99]"
            >
              เข้าสู่ระบบ
            </button>

            {message && (
              <p
                role="status"
                className="rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-700"
              >
                {message}
              </p>
            )}
          </form>

          <div className="my-6 border-t border-gray-100" />

          <p className="text-center text-sm text-gray-500">
            ยังไม่มีบัญชีใช่ไหม?{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              สมัครสมาชิก
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
