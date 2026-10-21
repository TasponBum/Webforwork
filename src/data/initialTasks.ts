
import type { Task } from "../types/task";

export const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "ทำรายงานวิศวกรรมซอฟต์แวร์",
    description: "เขียนรายงานและตรวจสอบความเรียบร้อยก่อนส่ง",
    subject: "วิศวกรรมซอฟต์แวร์",
    dueDate: "2026-10-23",
    priority: "high",
    completed: false,
    createdAt: "2026-10-21",
  },
  {
    id: "task-2",
    title: "อ่านหนังสือเตรียมสอบ",
    description: "ทบทวนเนื้อหาและทำแบบฝึกหัด",
    subject: "IT Security",
    dueDate: "2026-10-25",
    priority: "medium",
    completed: false,
    createdAt: "2026-10-21",
  },
  {
    id: "task-3",
    title: "ทำแบบฝึกหัด React",
    description: "ฝึกใช้ useState และการแสดงรายการด้วย map",
    subject: "Web Development",
    dueDate: "2026-10-22",
    priority: "low",
    completed: true,
    createdAt: "2026-10-20",
  },
];
