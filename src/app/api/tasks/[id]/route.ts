
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

type TaskUpdate = Partial<
  Pick<
    TaskRecord,
    | "title"
    | "description"
    | "subject"
    | "dueDate"
    | "priority"
    | "completed"
  >
>;

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

// ตรวจสอบวันที่ YYYY-MM-DD
function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

// PATCH: แก้ไขงาน
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    // รับ ID จาก URL
    const { id } = await params;

    if (!id || id.includes("/")) {
      return Response.json(
        {
          success: false,
          message: "รหัสงานไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    // อ่านข้อมูล JSON
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

    if (!isRecord(body)) {
      return Response.json(
        {
          success: false,
          message: "ข้อมูลไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    // อนุญาตให้แก้ไขเฉพาะฟิลด์ที่กำหนด
    const allowedFields = [
      "title",
      "description",
      "subject",
      "dueDate",
      "priority",
      "completed",
    ];

    const hasInvalidField = Object.keys(body).some(
      (key) =>
        !allowedFields.includes(key)
    );

    if (hasInvalidField) {
      return Response.json(
        {
          success: false,
          message: "มีฟิลด์ที่ไม่อนุญาตให้แก้ไข",
        },
        { status: 400 }
      );
    }

    const updates: TaskUpdate = {};

    // ตรวจสอบชื่องาน
    if ("title" in body) {
      if (typeof body.title !== "string") {
        return Response.json(
          {
            success: false,
            message: "ชื่องานไม่ถูกต้อง",
          },
          { status: 400 }
        );
      }

      const title = body.title.trim();

      if (!title || title.length > 150) {
        return Response.json(
          {
            success: false,
            message: "กรุณากรอกชื่องานไม่เกิน 150 ตัวอักษร",
          },
          { status: 400 }
        );
      }

      updates.title = title;
    }

    // ตรวจสอบรายละเอียด
    if ("description" in body) {
      if (
        typeof body.description !== "string" ||
        body.description.length > 2000
      ) {
        return Response.json(
          {
            success: false,
            message: "รายละเอียดงานไม่ถูกต้อง",
          },
          { status: 400 }
        );
      }

      updates.description = body.description.trim();
    }

    // ตรวจสอบชื่อวิชา
    if ("subject" in body) {
      if (
        typeof body.subject !== "string" ||
        body.subject.trim().length > 80
      ) {
        return Response.json(
          {
            success: false,
            message: "ชื่อวิชาไม่ถูกต้อง",
          },
          { status: 400 }
        );
      }

      updates.subject = body.subject.trim() || "ทั่วไป";
    }

    // ตรวจสอบวันกำหนดส่ง
    if ("dueDate" in body) {
      if (
        typeof body.dueDate !== "string" ||
        (
          body.dueDate !== "" &&
          !isValidDate(body.dueDate)
        )
      ) {
        return Response.json(
          {
            success: false,
            message: "รูปแบบวันกำหนดส่งไม่ถูกต้อง",
          },
          { status: 400 }
        );
      }

      updates.dueDate = body.dueDate;
    }

    // ตรวจสอบระดับความสำคัญ
    if ("priority" in body) {
      if (
        body.priority !== "low" &&
        body.priority !== "medium" &&
        body.priority !== "high"
      ) {
        return Response.json(
          {
            success: false,
            message: "ระดับความสำคัญไม่ถูกต้อง",
          },
          { status: 400 }
        );
      }

      updates.priority = body.priority;
    }

    // ตรวจสอบสถานะงาน
    if ("completed" in body) {
      if (typeof body.completed !== "boolean") {
        return Response.json(
          {
            success: false,
            message: "สถานะงานไม่ถูกต้อง",
          },
          { status: 400 }
        );
      }

      updates.completed = body.completed;
    }

    // ต้องมีข้อมูลอย่างน้อยหนึ่งฟิลด์
    if (Object.keys(updates).length === 0) {
      return Response.json(
        {
          success: false,
          message: "ไม่มีข้อมูลสำหรับแก้ไข",
        },
        { status: 400 }
      );
    }

    // อ้างอิงงานเฉพาะของผู้ใช้ที่เข้าสู่ระบบ
    const taskRef = adminDb
      .collection("users")
      .doc(user.uid)
      .collection("tasks")
      .doc(id);

    const snapshot = await taskRef.get();

    if (!snapshot.exists) {
      return Response.json(
        {
          success: false,
          message: "ไม่พบรายการงานนี้",
        },
        { status: 404 }
      );
    }

    // อัปเดตข้อมูล
    await taskRef.update(updates);

    return Response.json({
      success: true,
      message: "แก้ไขงานเรียบร้อยแล้ว",
      task: {
        ...snapshot.data(),
        ...updates,
        id,
      },
    });
  } catch (error) {
    console.error("Update task error:", error);

    return Response.json(
      {
        success: false,
        message: "ไม่สามารถแก้ไขรายการงานได้",
      },
      { status: 500 }
    );
  }
}

// DELETE: ลบงาน
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    if (!id || id.includes("/")) {
      return Response.json(
        {
          success: false,
          message: "รหัสงานไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    // ค้นหางานภายในบัญชีของผู้ใช้เท่านั้น
    const taskRef = adminDb
      .collection("users")
      .doc(user.uid)
      .collection("tasks")
      .doc(id);

    const snapshot = await taskRef.get();

    if (!snapshot.exists) {
      return Response.json(
        {
          success: false,
          message: "ไม่พบรายการงานนี้",
        },
        { status: 404 }
      );
    }

    // ลบงาน
    await taskRef.delete();

    return Response.json({
      success: true,
      message: "ลบงานเรียบร้อยแล้ว",
      id,
    });
  } catch (error) {
    console.error("Delete task error:", error);

    return Response.json(
      {
        success: false,
        message: "ไม่สามารถลบรายการงานได้",
      },
      { status: 500 }
    );
  }
}
