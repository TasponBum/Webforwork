"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/studymate/Header";
import StatsCards from "@/components/studymate/StatsCards";
import TaskList from "@/components/studymate/TaskList";
import TaskCalendar from "@/components/studymate/TaskCalendar";

import type { Task } from "@/types/task";
import type { Subject } from "@/types/subject";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";

type Priority = "low" | "medium" | "high";

export default function Home() {
  const router = useRouter();

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [authReady, setAuthReady] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  // โหลดงานและวิชาของบัญชีที่เข้าสู่ระบบ
  useEffect(() => {
    let unsubscribeTasks: (() => void) | undefined;
    let unsubscribeSubjects: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeTasks?.();
      unsubscribeSubjects?.();

      unsubscribeTasks = undefined;
      unsubscribeSubjects = undefined;

      setAuthReady(true);

      if (!user) {
        setFirebaseUser(null);
        setTasks([]);
        setSubjects([]);
        setTasksLoading(false);

        router.replace("/login");
        return;
      }

      setFirebaseUser(user);
      setTasks([]);
      setSubjects([]);
      setTasksLoading(true);
      setDataError("");

      // โหลดงานจาก users/{uid}/tasks
      unsubscribeTasks = onSnapshot(
        collection(db, "users", user.uid, "tasks"),
        (snapshot) => {
          const loadedTasks: Task[] = snapshot.docs.map(
            (taskDocument) => {
              const data = taskDocument.data();

              const priority: Priority =
                data.priority === "high"
                  ? "high"
                  : data.priority === "low"
                    ? "low"
                    : "medium";

              return {
                id: taskDocument.id,
                title:
                  typeof data.title === "string"
                    ? data.title
                    : "",
                description:
                  typeof data.description === "string"
                    ? data.description
                    : "",
                subject:
                  typeof data.subject === "string"
                    ? data.subject
                    : "ทั่วไป",
                dueDate:
                  typeof data.dueDate === "string"
                    ? data.dueDate
                    : "",
                priority,
                completed: data.completed === true,
                createdAt:
                  typeof data.createdAt === "string"
                    ? data.createdAt
                    : "",
              };
            }
          );

          loadedTasks.sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt)
          );

          setTasks(loadedTasks);
          setTasksLoading(false);
        },
        (error) => {
          console.error("Load tasks error:", error);
          setDataError(
            "โหลดงานไม่สำเร็จ กรุณาตรวจสอบ Firestore Rules"
          );
          setTasksLoading(false);
        }
      );

      // โหลดวิชาจาก users/{uid}/subjects
      unsubscribeSubjects = onSnapshot(
        collection(db, "users", user.uid, "subjects"),
        (snapshot) => {
          const loadedSubjects: Subject[] = snapshot.docs
            .map((subjectDocument) => {
              const data = subjectDocument.data();

              return {
                id: subjectDocument.id,
                name:
                  typeof data.name === "string"
                    ? data.name
                    : "",
                createdAt:
                  typeof data.createdAt === "string"
                    ? data.createdAt
                    : "",
              };
            })
            .filter((subject) => subject.name.trim() !== "");

          loadedSubjects.sort((a, b) =>
            a.name.localeCompare(b.name)
          );

          setSubjects(loadedSubjects);
        },
        (error) => {
          console.error("Load subjects error:", error);
          setDataError(
            "โหลดวิชาเรียนไม่สำเร็จ กรุณาตรวจสอบ Firestore Rules"
          );
        }
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeTasks?.();
      unsubscribeSubjects?.();
    };
  }, [router]);

  // เพิ่มงานลง Firestore
  async function handleAddTask(
    title: string,
    subject: string,
    dueDate: string,
    priority: Priority
  ) {
    if (!firebaseUser) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description: "",
      subject: subject.trim() || "ทั่วไป",
      dueDate,
      priority,
      completed: false,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    try {
      await setDoc(
        doc(db, "users", firebaseUser.uid, "tasks", newTask.id),
        newTask
      );

      setDataError("");
    } catch (error) {
      console.error("Add task error:", error);
      setDataError("เพิ่มงานไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  // เพิ่มวิชาเรียนลง Firestore
  async function handleAddSubject(
    name: string
  ): Promise<boolean> {
    if (!firebaseUser) return false;

    const normalizedName = name.trim();

    if (!normalizedName) {
      setDataError("กรุณากรอกชื่อวิชาเรียน");
      return false;
    }

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
      const id = crypto.randomUUID();

      const newSubject: Subject = {
        id,
        name: normalizedName,
        createdAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, "users", firebaseUser.uid, "subjects", id),
        newSubject
      );

      setDataError("");
      return true;
    } catch (error) {
      console.error("Add subject error:", error);
      setDataError(
        "เพิ่มวิชาเรียนไม่สำเร็จ กรุณาตรวจสอบ Firestore Rules"
      );
      return false;
    }
  }

  // เปลี่ยนสถานะงาน
  async function handleToggleTask(id: string) {
    if (!firebaseUser) return;

    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    try {
      await updateDoc(
        doc(db, "users", firebaseUser.uid, "tasks", id),
        { completed: !task.completed }
      );

      setDataError("");
    } catch (error) {
      console.error("Toggle task error:", error);
      setDataError(
        "เปลี่ยนสถานะงานไม่สำเร็จ กรุณาลองใหม่"
      );
    }
  }

  // ลบงาน
  async function handleDeleteTask(id: string) {
    if (!firebaseUser) return;

    try {
      await deleteDoc(
        doc(db, "users", firebaseUser.uid, "tasks", id)
      );

      setDataError("");
    } catch (error) {
      console.error("Delete task error:", error);
      setDataError("ลบงานไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  // แก้ไขงาน
  async function handleEditTask(
    id: string,
    title: string,
    subject: string,
    dueDate: string,
    priority: Priority
  ): Promise<boolean> {
    if (!firebaseUser) return false;

    try {
      await updateDoc(
        doc(db, "users", firebaseUser.uid, "tasks", id),
        {
          title,
          subject,
          dueDate,
          priority,
        }
      );

      setDataError("");
      return true;
    } catch (error) {
      console.error("Edit task error:", error);
      setDataError("แก้ไขงานไม่สำเร็จ กรุณาลองใหม่");
      return false;
    }
  }

  // หน้ารอโหลดข้อมูล
  if (!authReady || !firebaseUser || tasksLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">
          กำลังโหลดข้อมูล StudyMate...
        </p>
      </main>
    );
  }

  // หน้า Dashboard ที่ไม่มี Sidebar
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