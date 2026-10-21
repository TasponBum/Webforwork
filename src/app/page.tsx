"use client";
import { useState } from "react";

import Sidebar from "@/components/studymate/Sidebar";
import Header from "@/components/studymate/Header";
import StatsCards from "@/components/studymate/StatsCards";
import TaskList from "@/components/studymate/TaskList";
import { initialTasks } from "@/data/initialTasks";
import type { Task } from "@/types/task";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  
function handleAddTask(
  title: string,
  dueDate: string,
  priority: "low" | "medium" | "high"
) {
  const newTask: Task = {
    id: crypto.randomUUID(),
    title,
    description: "",
    subject: "ทั่วไป",
    dueDate,
    priority,
    completed: false,
    createdAt: new Date().toISOString().slice(0, 10),
  };

  setTasks((currentTasks) => [newTask, ...currentTasks]);
}


      function handleToggleTask(id: string) {
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === id
              ? { ...task, completed: !task.completed }
              : task
          )
        );
      }

      function handleDeleteTask(id: string) {
        setTasks((currentTasks) =>
          currentTasks.filter((task) => task.id !== id)
        );
      }

      function handleEditTask(
        id: string,
        title: string,
        subject: string,
        dueDate: string,
        priority: "low" | "medium" | "high"
      ) {
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === id
              ? { ...task, title, subject, dueDate, priority }
              : task
          )
        );
      }



  return (
    <main className="min-h-screen bg-gray-50 md:flex">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="min-w-0 flex-1">
        <Header />

        <section className="p-8">
          <h2 className="text-xl font-bold text-gray-800">
            ภาพรวมการเรียน
          </h2>

          <p className="mt-2 mb-6 text-gray-500">
            ยินดีต้อนรับสู่ StudyMate
          </p>

          <StatsCards tasks={tasks} />

          <TaskList
            tasks={tasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
 />

        </section>
      </div>
    </main>
  );
}
