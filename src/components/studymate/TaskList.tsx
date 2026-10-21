"use client";

import { useState, type FormEvent } from "react";
import { Check, Clock, Plus, Trash2, Pencil } from "lucide-react";
import type { Task } from "@/types/task";

type Priority = "low" | "medium" | "high";
type TaskFilter = "all" | "pending" | "completed";

type TaskListProps = {
  tasks: Task[];
  onAddTask: (
    title: string,
    dueDate: string,
    priority: Priority
  ) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (
    id: string,
    title: string,
    subject: string,
    dueDate: string,
    priority: Priority
  ) => void;
};

const priorityLabels: Record<Priority, string> = {
  high: "สำคัญสูง",
  medium: "สำคัญปานกลาง",
  low: "สำคัญต่ำ",
};

export default function TaskList({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onEditTask,
}: TaskListProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [filter, setFilter] = useState<TaskFilter>("all");

  const filteredTasks = tasks.filter((task) => {
    if (filter === "pending") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const title = newTaskTitle.trim();

    if (!title) return;

    onAddTask(title, newDueDate, newPriority);

    setNewTaskTitle("");
    setNewDueDate("");
    setNewPriority("medium");
  }

  function handleEdit(task: Task) {
    const title = window.prompt("แก้ไขชื่องาน", task.title);

    if (title === null || !title.trim()) return;

    const subject = window.prompt(
      "แก้ไขรายวิชา",
      task.subject || "ทั่วไป"
    );

    if (subject === null) return;

    const dueDate = window.prompt(
      "แก้ไขวันกำหนดส่ง (YYYY-MM-DD หรือเว้นว่าง)",
      task.dueDate || ""
    );

    if (dueDate === null) return;

    const priorityInput = window.prompt(
      "เลือกระดับความสำคัญ: high / medium / low",
      task.priority
    );

    if (priorityInput === null) return;

    const normalizedPriority = priorityInput.trim().toLowerCase();

    if (
      normalizedPriority !== "high" &&
      normalizedPriority !== "medium" &&
      normalizedPriority !== "low"
    ) {
      window.alert("กรุณาเลือกระดับ high, medium หรือ low");
      return;
    }

    const normalizedDate = dueDate.trim();

    if (
      normalizedDate &&
      !/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)
    ) {
      window.alert("กรุณากรอกวันที่ในรูปแบบ YYYY-MM-DD");
      return;
    }

    onEditTask(
      task.id,
      title.trim(),
      subject.trim() || "ทั่วไป",
      normalizedDate,
      normalizedPriority
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            งานของฉัน
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            จัดการงานที่ต้องทำในแต่ละวัน
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          {tasks.length} งาน
        </span>
      </div>

      {/* ฟอร์มเพิ่มงาน */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-wrap items-center gap-3"
      >
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="ชื่องาน เช่น ทำการบ้าน React"
          aria-label="ชื่องาน"
          className="min-w-[180px] flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          required
        />

        <input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          aria-label="วันกำหนดส่ง"
          className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm"
        />

        <select
          value={newPriority}
          onChange={(e) =>
            setNewPriority(e.target.value as Priority)
          }
          aria-label="ระดับความสำคัญ"
          className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm"
        >
          <option value="high">สำคัญสูง</option>
          <option value="medium">สำคัญปานกลาง</option>
          <option value="low">สำคัญต่ำ</option>
        </select>

        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          เพิ่มงาน
        </button>
      </form>

      {/* ตัวกรองงาน */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { label: "ทั้งหมด", value: "all" },
          { label: "ยังไม่เสร็จ", value: "pending" },
          { label: "เสร็จแล้ว", value: "completed" },
        ].map((item) => {
          const itemFilter = item.value as TaskFilter;

          const count =
            itemFilter === "all"
              ? tasks.length
              : itemFilter === "pending"
                ? tasks.filter((task) => !task.completed).length
                : tasks.filter((task) => task.completed).length;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(itemFilter)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                filter === itemFilter
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {item.label} ({count})
            </button>
          );
        })}
      </div>

      {/* รายการงาน */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <p className="rounded-xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
            {filter === "pending"
              ? "ไม่มีงานที่ค้างอยู่ เยี่ยมมาก!"
              : filter === "completed"
                ? "ยังไม่มีงานที่ทำเสร็จ"
                : "ยังไม่มีงาน ลองเพิ่มงานแรกของคุณได้เลย"}
          </p>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-xl border border-gray-100 p-4"
            >
              <button
                type="button"
                onClick={() => onToggleTask(task.id)}
                aria-label={
                  task.completed
                    ? "ยกเลิกสถานะงานเสร็จแล้ว"
                    : "ทำเครื่องหมายว่าเสร็จแล้ว"
                }
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  task.completed
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 text-transparent hover:border-blue-500"
                }`}
              >
                <Check size={14} />
              </button>

              <div className="min-w-0 flex-1">
                <p
                  className={`break-words font-medium ${
                    task.completed
                      ? "text-gray-400 line-through"
                      : "text-gray-800"
                  }`}
                >
                  {task.title}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={13} />
                    {task.subject || "ทั่วไป"}
                  </span>

                  {task.dueDate && (
                    <span className="flex items-center gap-1">
                      <span>•</span>
                      ส่ง{" "}
                      {new Date(
                        `${task.dueDate}T12:00:00`
                      ).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}

                  <span
                    className={`rounded-full px-2 py-1 font-medium ${
                      task.priority === "high"
                        ? "bg-red-50 text-red-700"
                        : task.priority === "medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-green-50 text-green-700"
                    }`}
                  >
                    {priorityLabels[task.priority]}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleEdit(task)}
                aria-label={`แก้ไขงาน ${task.title}`}
                className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
              >
                <Pencil size={18} />
              </button>

              <button
                type="button"
                onClick={() => onDeleteTask(task.id)}
                aria-label={`ลบงาน ${task.title}`}
                className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
