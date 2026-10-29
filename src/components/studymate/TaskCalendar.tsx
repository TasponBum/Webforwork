
"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import type { Task } from "@/types/task";

type TaskCalendarProps = {
  tasks: Task[];
};

type Priority = "low" | "medium" | "high";

const priorityLabels: Record<Priority, string> = {
  high: "สำคัญสูง",
  medium: "สำคัญปานกลาง",
  low: "สำคัญต่ำ",
};

// แปลงวันที่เป็น YYYY-MM-DD โดยใช้เวลาท้องถิ่น
function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// แปลงข้อความวันที่กลับเป็น Date และตรวจสอบวันที่
function parseDateKey(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export default function TaskCalendar({
  tasks,
}: TaskCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();

    return new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
  });

  const [selectedDate, setSelectedDate] = useState(() =>
    toDateKey(new Date())
  );

  const todayKey = toDateKey(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthPrefix =
    `${year}-${String(month + 1).padStart(2, "0")}`;

  // สร้างช่องปฏิทิน โดยให้วันอาทิตย์เป็นวันแรกของสัปดาห์
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cellCount = Math.max(
      35,
      Math.ceil((firstDayIndex + daysInMonth) / 7) * 7
    );

    return Array.from({ length: cellCount }, (_, index) => {
      const day = index - firstDayIndex + 1;

      if (day < 1 || day > daysInMonth) {
        return null;
      }

      return new Date(year, month, day);
    });
  }, [year, month]);

  // จัดกลุ่มงานตามวันกำหนดส่ง
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, Task[]>();

    tasks.forEach((task) => {
      if (!parseDateKey(task.dueDate)) {
        return;
      }

      const existing = grouped.get(task.dueDate) ?? [];
      existing.push(task);
      grouped.set(task.dueDate, existing);
    });

    return grouped;
  }, [tasks]);

  // สรุปงานที่มีกำหนดส่งภายในเดือนที่กำลังดู
  const tasksThisMonth = tasks.filter((task) => {
    return (
      task.dueDate.startsWith(monthPrefix) &&
      parseDateKey(task.dueDate) !== null
    );
  });

  const pendingThisMonth = tasksThisMonth.filter(
    (task) => !task.completed
  ).length;

  const completedThisMonth = tasksThisMonth.filter(
    (task) => task.completed
  ).length;

  // เรียงงานของวันที่เลือก โดยงานที่ยังไม่เสร็จอยู่ก่อน
  const selectedTasks = [
    ...(tasksByDate.get(selectedDate) ?? []),
  ].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    const priorityRank: Record<Priority, number> = {
      high: 0,
      medium: 1,
      low: 2,
    };

    return priorityRank[a.priority] - priorityRank[b.priority];
  });

  const selectedDateObject = parseDateKey(selectedDate);

  const selectedDateLabel = selectedDateObject
    ? selectedDateObject.toLocaleDateString("th-TH", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : selectedDate;

  function changeMonth(amount: number) {
    const nextMonth = new Date(year, month + amount, 1);

    setCurrentMonth(nextMonth);
    setSelectedDate(toDateKey(nextMonth));
  }

  function goToToday() {
    const today = new Date();

    setCurrentMonth(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );

    setSelectedDate(toDateKey(today));
  }

  return (
    <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
      {/* หัวข้อปฏิทิน */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <CalendarDays size={23} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-800">
              ปฏิทินงานเรียน
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              ดูงานตามวันกำหนดส่ง
            </p>
          </div>
        </div>

        {/* เปลี่ยนเดือน */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            วันนี้
          </button>

          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="เดือนก่อนหน้า"
            className="rounded-xl border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50"
          >
            <ChevronLeft size={19} />
          </button>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="เดือนถัดไป"
            className="rounded-xl border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>

      {/* ชื่อเดือน */}
      <h3 className="mb-4 text-xl font-bold text-gray-800">
        {currentMonth.toLocaleDateString("th-TH", {
          month: "long",
          year: "numeric",
        })}
      </h3>

      {/* สรุปกำหนดส่งประจำเดือน */}
      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl bg-blue-50 p-3">
          <p className="text-xs text-blue-700 sm:text-sm">
            งานทั้งหมด
          </p>
          <p className="mt-1 text-2xl font-bold text-blue-800">
            {tasksThisMonth.length}
          </p>
        </div>

        <div className="rounded-xl bg-amber-50 p-3">
          <p className="text-xs text-amber-700 sm:text-sm">
            ยังไม่เสร็จ
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-800">
            {pendingThisMonth}
          </p>
        </div>

        <div className="rounded-xl bg-[#E6F1FB] p-3">
          <p className="text-xs text-[#185FA5] sm:text-sm">
            เสร็จแล้ว
          </p>
          <p className="mt-1 text-2xl font-bold text-[#185FA5]">
            {completedThisMonth}
          </p>
        </div>
      </div>

      {/* ป้ายวันในสัปดาห์ */}
      <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
        {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map(
          (day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-semibold text-gray-500 sm:text-sm"
            >
              {day}
            </div>
          )
        )}
      </div>

      {/* ช่องปฏิทิน */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {calendarDays.map((date, index) => {
          if (!date) {
            return (
              <div
                key={`empty-${index}`}
                aria-hidden="true"
                className="min-h-[66px] rounded-xl sm:min-h-[84px]"
              />
            );
          }

          const dateKey = toDateKey(date);
          const dayTasks = tasksByDate.get(dateKey) ?? [];

          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === todayKey;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => setSelectedDate(dateKey)}
              aria-pressed={isSelected}
              aria-label={`${date.getDate()} มีงาน ${dayTasks.length} งาน`}
              title={`${dateKey}: ${dayTasks.length} งาน`}
              className={`relative flex min-h-[82px] flex-col items-start rounded-xl border p-1.5 text-left transition sm:min-h-[104px] sm:p-2 ${
                isSelected
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                  : isToday
                    ? "border-blue-200 bg-white hover:bg-blue-50"
                    : "border-gray-100 bg-white hover:border-blue-200 hover:bg-gray-50"
              }`}
            >
              <span
                className={`text-xs font-semibold sm:text-sm ${
                  isSelected
                    ? "text-blue-700"
                    : isToday
                      ? "text-blue-600"
                      : "text-gray-700"
                }`}
              >
                {date.getDate()}
              </span>

              {dayTasks.length > 0 && (
                <>
                  <span className="absolute right-1 top-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                    {dayTasks.length}
                  </span>

                  <div className="mt-1 flex w-full flex-col gap-1 overflow-hidden">
                    {dayTasks.slice(0, 2).map((task) => {
                      const chipColor = task.completed
                        ? "bg-[#E6F1FB] text-[#185FA5]"
                        : task.priority === "high"
                          ? "bg-red-100 text-red-800"
                          : task.priority === "medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800";

                      const shortLabel = task.completed
                        ? "✓ เสร็จ"
                        : task.priority === "high"
                          ? "สูง"
                          : task.priority === "medium"
                            ? "กลาง"
                            : "ต่ำ";

                      return (
                        <span
                          key={task.id}
                          title={task.title}
                          className={`block w-full truncate rounded-md px-1 py-1 text-[9px] font-semibold leading-tight sm:px-1.5 sm:text-[10px] ${chipColor}`}
                        >
                          <span className="sm:hidden">
                            {shortLabel}
                          </span>
                          <span className="hidden sm:inline">
                            {task.completed ? "✓ " : ""}
                            {task.title}
                          </span>
                        </span>
                      );
                    })}

                    {dayTasks.length > 2 && (
                      <span className="px-1 text-[10px] font-medium text-gray-500">
                        +{dayTasks.length - 2} งาน
                      </span>
                    )}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* คำอธิบายสีของป้ายงาน */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-md bg-red-100 px-2 py-1 font-semibold text-red-800">
          สำคัญสูง
        </span>
        <span className="rounded-md bg-amber-100 px-2 py-1 font-semibold text-amber-800">
          สำคัญปานกลาง
        </span>
        <span className="rounded-md bg-green-100 px-2 py-1 font-semibold text-green-800">
          สำคัญต่ำ
        </span>
        <span className="rounded-md bg-[#E6F1FB] px-2 py-1 font-semibold text-[#185FA5]">
          ✓ เสร็จแล้ว
        </span>
      </div>

      {/* รายละเอียดงานของวันที่เลือก */}
      <div className="mt-6 border-t border-gray-100 pt-5">
        <h3 className="text-base font-bold text-gray-800">
          งานที่ครบกำหนด
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          {selectedDateLabel}
        </p>

        <div className="mt-4 space-y-3">
          {selectedTasks.length === 0 ? (
            <p className="rounded-xl bg-gray-50 px-4 py-7 text-center text-sm text-gray-500">
              ไม่มีงานที่ครบกำหนดในวันที่เลือก
            </p>
          ) : (
            selectedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 rounded-xl border border-gray-100 p-4"
              >
                <div
                  className={`mt-0.5 rounded-full p-1.5 ${
                    task.completed
                      ? "bg-[#E6F1FB] text-[#185FA5]"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {task.completed ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Clock3 size={18} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`break-words text-sm font-semibold ${
                      task.completed
                        ? "text-gray-400 line-through"
                        : "text-gray-800"
                    }`}
                  >
                    {task.title}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    วิชา: {task.subject || "ทั่วไป"}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        task.priority === "high"
                          ? "bg-red-50 text-red-700"
                          : task.priority === "medium"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-green-50 text-green-700"
                      }`}
                    >
                      {priorityLabels[task.priority]}
                    </span>

                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        task.completed
                          ? "bg-[#E6F1FB] text-[#185FA5]"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {task.completed
                        ? "✓ เสร็จแล้ว"
                        : "ยังไม่เสร็จ"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <p className="mt-5 text-xs leading-5 text-gray-400">
        * ปฏิทินแสดงเฉพาะงานที่ระบุวันกำหนดส่ง งานที่ไม่มีวันกำหนดส่งจะไม่ปรากฏในช่องวันที่
      </p>
    </section>
  );
}
