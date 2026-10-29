
"use client";

import { useState, type FormEvent } from "react";
import {
  Check,
  Clock,
  Plus,
  Trash2,
  Pencil,
  BookOpen,
  X,
  Save,
} from "lucide-react";
import type { Task } from "@/types/task";
import type { Subject } from "@/types/subject";

type Priority = "low" | "medium" | "high";
type TaskFilter = "all" | "pending" | "completed";

type TaskListProps = {
  tasks: Task[];
  subjects: Subject[];
  onAddTask: (
    title: string,
    subject: string,
    dueDate: string,
    priority: Priority
  ) => void;
  onAddSubject: (name: string) => Promise<boolean>;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (
    id: string,
    title: string,
    subject: string,
    dueDate: string,
    priority: Priority
  ) => Promise<boolean>;
};

const priorityLabels: Record<Priority, string> = {
  high: "สำคัญสูง",
  medium: "สำคัญปานกลาง",
  low: "สำคัญต่ำ",
};

export default function TaskList({
  tasks,
  subjects,
  onAddTask,
  onAddSubject,
  onToggleTask,
  onDeleteTask,
  onEditTask,
}: TaskListProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newSubject, setNewSubject] = useState("ทั่วไป");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");

  const [filter, setFilter] = useState<TaskFilter>("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [subjectNameInput, setSubjectNameInput] = useState("");
  const [subjectFormMessage, setSubjectFormMessage] = useState("");
  const [savingSubject, setSavingSubject] = useState(false);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("ทั่วไป");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPriority, setEditPriority] =
    useState<Priority>("medium");
  const [editingError, setEditingError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // สร้างรายการวิชาสำหรับเลือกและกรอง
  // รวมวิชาที่เคยอยู่ในงานไว้ด้วย เพื่อไม่ให้ข้อมูลเดิมหายจากตัวกรอง
  const availableSubjects = Array.from(
    new Set([
      "ทั่วไป",
      ...subjects.map((subject) => subject.name),
      ...tasks.map((task) => task.subject || "ทั่วไป"),
    ])
  );

  // กรองงานตามวิชาก่อน
  const tasksInSelectedSubject = tasks.filter(
    (task) =>
      subjectFilter === "all" ||
      (task.subject || "ทั่วไป") === subjectFilter
  );

  // จากนั้นกรองตามสถานะงาน
  const filteredTasks = tasksInSelectedSubject.filter((task) => {
    if (filter === "pending") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const title = newTaskTitle.trim();
    if (!title) return;

    onAddTask(title, newSubject, newDueDate, newPriority);

    setNewTaskTitle("");
    setNewSubject("ทั่วไป");
    setNewDueDate("");
    setNewPriority("medium");
  }

  async function handleSubjectSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const name = subjectNameInput.trim();

    if (!name) {
      setSubjectFormMessage("กรุณากรอกชื่อวิชา");
      return;
    }

    setSavingSubject(true);
    setSubjectFormMessage("");

    const success = await onAddSubject(name);

    if (success) {
      setSubjectNameInput("");
      setShowSubjectForm(false);
      setSubjectFormMessage("");
    } else {
      setSubjectFormMessage("เพิ่มวิชาไม่สำเร็จ กรุณาตรวจสอบข้อความแจ้งเตือน");
    }

    setSavingSubject(false);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditSubject(task.subject || "ทั่วไป");
    setEditDueDate(task.dueDate || "");
    setEditPriority(task.priority);
    setEditingError("");
  }

  async function handleEditSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editingTask) return;

    const title = editTitle.trim();

    if (!title) {
      setEditingError("กรุณากรอกชื่องาน");
      return;
    }

    setSavingEdit(true);
    setEditingError("");

    try {
      const saved = await onEditTask(
        editingTask.id,
        title,
        editSubject || "ทั่วไป",
        editDueDate,
        editPriority
      );

      if (saved) {
        setEditingTask(null);
        setEditingError("");
      } else {
        setEditingError(
          "บันทึกงานไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่"
        );
      }
    } catch (error) {
      console.error("Edit task error:", error);
      setEditingError("เกิดข้อผิดพลาดระหว่างบันทึกงาน");
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
      {/* Heading */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            งานของฉัน
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            จัดการงานและแยกตามวิชาเรียน
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            {tasks.length} งาน
          </span>

          <button
            type="button"
            onClick={() => {
              setShowSubjectForm((current) => !current);
              setSubjectFormMessage("");
            }}
            className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <BookOpen size={16} />
            เพิ่มวิชา
          </button>
        </div>
      </div>

      {/* Add subject form */}
      {showSubjectForm && (
        <form
          onSubmit={handleSubjectSubmit}
          className="mb-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4"
        >
          <label
            htmlFor="new-subject"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            ชื่อวิชาเรียน
          </label>

          <div className="flex flex-wrap gap-2">
            <input
              id="new-subject"
              type="text"
              value={subjectNameInput}
              onChange={(e) => setSubjectNameInput(e.target.value)}
              placeholder="เช่น Database"
              maxLength={80}
              required
              className="min-w-0 flex-1 rounded-xl text-black border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={savingSubject}
              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {savingSubject ? "กำลังบันทึก..." : "บันทึกวิชา"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowSubjectForm(false);
                setSubjectFormMessage("");
              }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
            >
              ยกเลิก
            </button>
          </div>

          {subjectFormMessage && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {subjectFormMessage}
            </p>
          )}
        </form>
      )}

      {/* Add task form */}
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
          className="min-w-[180px] flex-1 text-gray-500 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          required
        />

        <select
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          aria-label="วิชาเรียน"
          className="max-w-full rounded-xl border text-gray-500 border-gray-200 bg-white px-3 py-3 text-sm"
        >
          {availableSubjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          aria-label="วันกำหนดส่ง"
          className="rounded-xl border border-gray-200 text-gray-500 bg-white px-3 py-3 text-sm"
        />

        <select
          value={newPriority}
          onChange={(e) =>
            setNewPriority(e.target.value as Priority)
          }
          aria-label="ระดับความสำคัญ"
          className="rounded-xl border text-gray-500 border-gray-200 bg-white px-3 py-3 text-sm"
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

      {/* Subject filter */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label
          htmlFor="subject-filter"
          className="text-sm font-medium text-gray-600"
        >
          กรองตามวิชา
        </label>

        <select
          id="subject-filter"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="max-w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500"
        >
          <option value="all">ทุกวิชา</option>

          {availableSubjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { label: "ทั้งหมด", value: "all" },
          { label: "ยังไม่เสร็จ", value: "pending" },
          { label: "เสร็จแล้ว", value: "completed" },
        ].map((item) => {
          const itemFilter = item.value as TaskFilter;

          const count =
            itemFilter === "all"
              ? tasksInSelectedSubject.length
              : itemFilter === "pending"
                ? tasksInSelectedSubject.filter(
                    (task) => !task.completed
                  ).length
                : tasksInSelectedSubject.filter(
                    (task) => task.completed
                  ).length;

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

      {/* Task list */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <p className="rounded-xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
            {tasks.length === 0
              ? "ยังไม่มีงาน ลองเพิ่มงานแรกของคุณได้เลย"
              : subjectFilter !== "all" &&
                  tasksInSelectedSubject.length === 0
                ? `ยังไม่มีงานในวิชา ${subjectFilter}`
                : filter === "pending"
                  ? "ไม่มีงานที่ค้างอยู่ เยี่ยมมาก!"
                  : filter === "completed"
                    ? "ยังไม่มีงานที่ทำเสร็จ"
                    : "ไม่พบงานที่ตรงกับตัวกรอง"}
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
                    <BookOpen size={13} />
                    {task.subject || "ทั่วไป"}
                  </span>

                  {task.dueDate && (
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
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
                onClick={() => openEdit(task)}
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

      {/* Edit task modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-task-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h3
                  id="edit-task-title"
                  className="text-xl font-bold text-gray-900"
                >
                  แก้ไขงาน
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  ปรับรายละเอียดงานเรียนของคุณ
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!savingEdit) setEditingTask(null);
                }}
                disabled={savingEdit}
                aria-label="ปิดหน้าต่างแก้ไข"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Task title */}
              <div>
                <label
                  htmlFor="edit-title"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  ชื่องาน
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={150}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="edit-subject"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  วิชาเรียน
                </label>
                <select
                  id="edit-subject"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {availableSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due date */}
              <div>
                <label
                  htmlFor="edit-due-date"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  วันกำหนดส่ง
                </label>
                <input
                  id="edit-due-date"
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* Priority */}
              <div>
                <label
                  htmlFor="edit-priority"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  ระดับความสำคัญ
                </label>
                <select
                  id="edit-priority"
                  value={editPriority}
                  onChange={(e) =>
                    setEditPriority(e.target.value as Priority)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="high">สำคัญสูง</option>
                  <option value="medium">สำคัญปานกลาง</option>
                  <option value="low">สำคัญต่ำ</option>
                </select>
              </div>

              {editingError && (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {editingError}
                </p>
              )}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  disabled={savingEdit}
                  className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />
                  {savingEdit ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
