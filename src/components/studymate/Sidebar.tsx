
"use client";

import { LayoutDashboard, CheckSquare, CalendarDays, BookOpen } from "lucide-react";

const menuItems = [
  { label: "ภาพรวม", icon: LayoutDashboard },
  { label: "งานทั้งหมด", icon: CheckSquare },
  { label: "ปฏิทิน", icon: CalendarDays },
  { label: "รายวิชา", icon: BookOpen },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white p-5">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-blue-700">
          StudyMate
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          วางแผนการเรียนอย่างเป็นระบบ
        </p>
      </div>

      <p className="mb-3 text-xs font-semibold text-gray-400">
        WORKSPACE
      </p>

      <nav className="space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                index === 0
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-400 hover:bg-gray-50"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl bg-blue-50 p-4">
        <p className="font-semibold text-blue-800">
          ตั้งใจหน่อยจ้าา!
        </p>
        <p className="mt-1 text-sm text-blue-600">
          จัดการงานทีละชิ้น เดี๋ยวก็เสร็จแหละ
        </p>
      </div>
    </aside>
  );
}
