
import "server-only";

import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/verify-auth";

export const runtime = "nodejs";

type Priority = "low" | "medium" | "high";

type TaskRecord = {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  priority: Priority;
  completed: boolean;
  createdAt: string;
};

// ตรวจสอบว่าเป็น Object
function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

// ตรวจสอบวันที่รูปแบบ YYYY-MM-DD
function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

// GET: อ่านรายการงานของผู้ใช้
export async function GET(request: Request) {
  const user = await verifyAuth(request);

  if (!user) {
    return Response.json(
      {
        success: false,
        message: "กรุณาเข้าสู่ระบบ",
      },
      { status: 401 }
    );
  }

  try {
    const snapshot = await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("tasks")
      .get();

    // กำหนด Type ของข้อมูลให้ชัดเจน
    const tasks: TaskRecord[] = snapshot.docs.map(
      (taskDoc): TaskRecord => {
        const data = taskDoc.data();

        const priority: Priority =
          data.priority === "high"
            ? "high"
            : data.priority === "low"
              ? "low"
              : "medium";

        return {
          id: taskDoc.id,

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

    // เรียงงานใหม่ไว้ด้านบน
    tasks.sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );

    return Response.json(
      {
        success: true,
        tasks,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Get tasks error:", error);

    return Response.json(
      {
        success: false,
        message: "ไม่สามารถโหลดรายการงานได้",
      },
      { status: 500 }
    );
  }
}

// POST: เพิ่มงานใหม่
export async function POST(request: Request) {
  const user = await verifyAuth(request);

  if (!user) {
    return Response.json(
      {
        success: false,
        message: "กรุณาเข้าสู่ระบบ",
      },
      { status: 401 }
    );
  }

  try {
    // อ่านข้อมูลจาก Front-end
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          message: "รูปแบบข้อมูล JSON ไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    // ตรวจสอบข้อมูล
    if (!isRecord(body)) {
      return Response.json(
        {
          success: false,
          message: "ข้อมูลไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const subject =
      body.subject === undefined
        ? "ทั่วไป"
        : typeof body.subject === "string"
          ? body.subject.trim()
          : null;

    const description =
      body.description === undefined
        ? ""
        : typeof body.description === "string"
          ? body.description.trim()
          : null;

    const dueDate =
      body.dueDate === undefined
        ? ""
        : typeof body.dueDate === "string"
          ? body.dueDate
          : null;

    const priority =
      body.priority === undefined
        ? "medium"
        : body.priority;

    // ตรวจสอบชื่องาน
    if (!title || title.length > 150) {
      return Response.json(
        {
          success: false,
          message: "กรุณากรอกชื่องานไม่เกิน 150 ตัวอักษร",
        },
        { status: 400 }
      );
    }

    // ตรวจสอบวิชาและรายละเอียด
    if (subject === null || subject.length > 80) {
      return Response.json(
        {
          success: false,
          message: "ชื่อวิชาไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    if (
      description === null ||
      description.length > 2000
    ) {
      return Response.json(
        {
          success: false,
          message: "รายละเอียดงานไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    // ตรวจสอบวันกำหนดส่ง
    if (
      dueDate === null ||
      (dueDate !== "" && !isValidDate(dueDate))
    ) {
      return Response.json(
        {
          success: false,
          message: "รูปแบบวันกำหนดส่งไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    // ตรวจสอบระดับความสำคัญ
    if (
      priority !== "low" &&
      priority !== "medium" &&
      priority !== "high"
    ) {
      return Response.json(
        {
          success: false,
          message: "ระดับความสำคัญไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    // สร้างรหัสงานจาก Firestore
    const taskRef = adminDb
      .collection("users")
      .doc(user.uid)
      .collection("tasks")
      .doc();

    // เตรียมข้อมูลสำหรับบันทึก
    const newTask: TaskRecord = {
      id: taskRef.id,
      title,
      description,
      subject: subject || "ทั่วไป",
      dueDate,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    // บันทึกงานลง Firestore
    await taskRef.set(newTask);

    return Response.json(
      {
        success: true,
        message: "เพิ่มงานเรียบร้อยแล้ว",
        task: newTask,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add task error:", error);

    return Response.json(
      {
        success: false,
        message: "ไม่สามารถเพิ่มงานได้",
      },
      { status: 500 }
    );
  }
}
