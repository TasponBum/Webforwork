
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/studymate/Header";
import StatsCards from "@/components/studymate/StatsCards";
import TaskList from "@/components/studymate/TaskList";
import TaskCalendar from "@/components/studymate/TaskCalendar";

import type { Task } from "@/types/task";
import type { Subject } from "@/types/subject";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

type Priority = "low" | "medium" | "high";
type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
} & T;

// ---------------------------------
// ฟังก์ชันกลางสำหรับเรียก Back-end API
// ---------------------------------

async function callApi<T>(
  user: User,
  url: string,
  method: ApiMethod,
  body?: unknown,
  signal?: AbortSignal
): Promise<ApiResponse<T>> {
  // ขอ Firebase ID Token
  const token = await user.getIdToken();

  // ส่ง Request ไปยัง Back-end
  const response = await fetch(url, {
    method,

    headers: {
      Authorization: `Bearer ${token}`,

      ...(body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
    },

    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {}),

    cache: "no-store",
    signal,
  });

  // อ่าน Response
  let result: ApiResponse<T>;

  try {
    result = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error("ไม่สามารถอ่านข้อมูลจากเซิร์ฟเวอร์ได้");
  }

  if (!result || typeof result !== "object") {
    throw new Error("รูปแบบข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง");
  }

  if (!response.ok || result.success !== true) {
    throw new Error(
      result.message || "เกิดข้อผิดพลาดในการเรียก API"
    );
  }

  return result;
}

// ---------------------------------
// Dashboard
// ---------------------------------

export default function Home() {
  const router = useRouter();

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [authReady, setAuthReady] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  // ---------------------------------
  // ตรวจสอบ Login และโหลดข้อมูล
  // ---------------------------------

  useEffect(() => {
    let controller: AbortController | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // ยกเลิก Request เก่าของบัญชีก่อนหน้า
      controller?.abort();
      controller = undefined;

      setAuthReady(true);

      // กรณียังไม่ได้ Login
      if (!user) {
        setFirebaseUser(null);
        setTasks([]);
        setSubjects([]);
        setTasksLoading(false);
        setDataError("");

        router.replace("/login");
        return;
      }

      const currentUser = user;

      setFirebaseUser(currentUser);
      setTasks([]);
      setSubjects([]);
      setTasksLoading(true);
      setDataError("");

      const currentController = new AbortController();
      controller = currentController;

      // ---------------------------------
      // GET: โหลด Tasks
      // ---------------------------------

      async function loadTasks() {
        try {
          const result = await callApi<{
            tasks: Task[];
          }>(
            currentUser,
            "/api/tasks",
            "GET",
            undefined,
            currentController.signal
          );

          if (!Array.isArray(result.tasks)) {
            throw new Error("ข้อมูลรายการงานไม่ถูกต้อง");
          }

          if (!currentController.signal.aborted) {
            setTasks(result.tasks);
            setTasksLoading(false);
          }
        } catch (error) {
          if (currentController.signal.aborted) return;

          console.error("Load tasks error:", error);

          setDataError(
            error instanceof Error
              ? error.message
              : "โหลดงานไม่สำเร็จ กรุณาลองใหม่"
          );

          setTasksLoading(false);
        }
      }

      // ---------------------------------
      // GET: โหลด Subjects
      // ---------------------------------

      async function loadSubjects() {
        try {
          const result = await callApi<{
            subjects: Subject[];
          }>(
            currentUser,
            "/api/subjects",
            "GET",
            undefined,
            currentController.signal
          );

          if (!Array.isArray(result.subjects)) {
            throw new Error("ข้อมูลวิชาเรียนไม่ถูกต้อง");
          }

          if (!currentController.signal.aborted) {
            setSubjects(result.subjects);
          }
        } catch (error) {
          if (currentController.signal.aborted) return;

          console.error("Load subjects error:", error);

          setDataError(
            error instanceof Error
              ? error.message
              : "โหลดวิชาเรียนไม่สำเร็จ กรุณาลองใหม่"
          );
        }
      }

      // เริ่มโหลดข้อมูลทั้งสองส่วน
      void loadTasks();
      void loadSubjects();
    });

    return () => {
      unsubscribeAuth();
      controller?.abort();
    };
  }, [router]);

  // ---------------------------------
  // POST: เพิ่มงาน
  // ---------------------------------

  async function handleAddTask(
    title: string,
    subject: string,
    dueDate: string,
    priority: Priority
  ) {
    if (!firebaseUser) return;

    try {
      const result = await callApi<{
        task: Task;
      }>(
        firebaseUser,
        "/api/tasks",
        "POST",
        {
          title,
          description: "",
          subject: subject.trim() || "ทั่วไป",
          dueDate,
          priority,
        }
      );

      setTasks((currentTasks) => [
        result.task,
        ...currentTasks,
      ]);

      setDataError("");
    } catch (error) {
      console.error("Add task error:", error);

      setDataError(
        error instanceof Error
          ? error.message
          : "เพิ่มงานไม่สำเร็จ กรุณาลองใหม่"
      );
    }
  }

  // ---------------------------------
  // POST: เพิ่มวิชาเรียน
  // ---------------------------------

  async function handleAddSubject(
    name: string
  ): Promise<boolean> {
    if (!firebaseUser) return false;

    const normalizedName = name.trim();

    if (!normalizedName) {
      setDataError("กรุณากรอกชื่อวิชาเรียน");
      return false;
    }

    // ตรวจสอบวิชาซ้ำใน Front-end
    const duplicate = subjects.some(
      (subject) =>
        subject.name.trim().toLowerCase() ===
        normalizedName.toLowerCase()
    );

    if (duplicate) {
      setDataError(
        "มีวิชานี้อยู่แล้ว กรุณาใช้ชื่อวิชาอื่น"
      );
      return false;
    }

    try {
      const result = await callApi<{
        subject: Subject;
      }>(
        firebaseUser,
        "/api/subjects",
        "POST",
        {
          name: normalizedName,
        }
      );

      setSubjects((currentSubjects) =>
        [...currentSubjects, result.subject].sort(
          (a, b) => a.name.localeCompare(b.name)
        )
      );

      setDataError("");
      return true;
    } catch (error) {
      console.error("Add subject error:", error);

      setDataError(
        error instanceof Error
          ? error.message
          : "เพิ่มวิชาเรียนไม่สำเร็จ กรุณาลองใหม่"
      );

      return false;
    }
  }

  // ---------------------------------
  // PATCH: เปลี่ยนสถานะงาน
  // ---------------------------------

  async function handleToggleTask(id: string) {
    if (!firebaseUser) return;

    const task = tasks.find((item) => item.id === id);

    if (!task) return;

    try {
      const result = await callApi<{
        task: Task;
      }>(
        firebaseUser,
        `/api/tasks/${encodeURIComponent(id)}`,
        "PATCH",
        {
          completed: !task.completed,
        }
      );

      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.id === id ? result.task : item
        )
      );

      setDataError("");
    } catch (error) {
      console.error("Toggle task error:", error);

      setDataError(
        error instanceof Error
          ? error.message
          : "เปลี่ยนสถานะงานไม่สำเร็จ กรุณาลองใหม่"
      );
    }
  }

  // ---------------------------------
  // DELETE: ลบงาน
  // ---------------------------------

  async function handleDeleteTask(id: string) {
    if (!firebaseUser) return;

    try {
      await callApi<{
        id: string;
      }>(
        firebaseUser,
        `/api/tasks/${encodeURIComponent(id)}`,
        "DELETE"
      );

      setTasks((currentTasks) =>
        currentTasks.filter((item) => item.id !== id)
      );

      setDataError("");
    } catch (error) {
      console.error("Delete task error:", error);

      setDataError(
        error instanceof Error
          ? error.message
          : "ลบงานไม่สำเร็จ กรุณาลองใหม่"
      );
    }
  }

  // ---------------------------------
  // PATCH: แก้ไขงาน
  // ---------------------------------

  async function handleEditTask(
    id: string,
    title: string,
    subject: string,
    dueDate: string,
    priority: Priority
  ): Promise<boolean> {
    if (!firebaseUser) return false;

    try {
      const result = await callApi<{
        task: Task;
      }>(
        firebaseUser,
        `/api/tasks/${encodeURIComponent(id)}`,
        "PATCH",
        {
          title,
          subject,
          dueDate,
          priority,
        }
      );

      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.id === id ? result.task : item
        )
      );

      setDataError("");
      return true;
    } catch (error) {
      console.error("Edit task error:", error);

      setDataError(
        error instanceof Error
          ? error.message
          : "แก้ไขงานไม่สำเร็จ กรุณาลองใหม่"
      );

      return false;
    }
  }

  // ---------------------------------
  // Loading Screen
  // ---------------------------------

  if (!authReady || !firebaseUser || tasksLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">
          กำลังโหลดข้อมูล StudyMate...
        </p>
      </main>
    );
  }

  // ---------------------------------
  // Dashboard UI
  // ---------------------------------

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <section className="p-4 sm:p-8">
        <h2 className="text-xl font-bold text-gray-800">
          ภาพรวมการเรียน
        </h2>

        <p className="mb-6 mt-2 text-gray-500">
          ยินดีต้อนรับสู่ StudyMate
        </p>

        {/* ข้อความแจ้งข้อผิดพลาด */}
        {dataError && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
          >
            {dataError}
          </p>
        )}

        {/* สถิติการเรียน */}
        <StatsCards tasks={tasks} />

        {/* ปฏิทินงานเรียน */}
        <TaskCalendar tasks={tasks} />

        {/* รายการงานและการจัดการวิชา */}
        <TaskList
          tasks={tasks}
          subjects={subjects}
          onAddTask={handleAddTask}
          onAddSubject={handleAddSubject}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
        />
      </section>
    </main>
  );
}
