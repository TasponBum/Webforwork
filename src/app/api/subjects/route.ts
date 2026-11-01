
import "server-only";

import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/verify-auth";

export const runtime = "nodejs";

type SubjectRecord = {
  id: string;
  name: string;
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

// GET: อ่านรายการวิชาของผู้ใช้
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
    // อ่าน Subjects ของบัญชีที่ Login
    const snapshot = await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("subjects")
      .get();

    const subjects: SubjectRecord[] =
      snapshot.docs.map((subjectDoc) => {
        const data = subjectDoc.data();

        return {
          id: subjectDoc.id,

          name:
            typeof data.name === "string"
              ? data.name
              : "",

          createdAt:
            typeof data.createdAt === "string"
              ? data.createdAt
              : "",
        };
      });

    // เรียงชื่อวิชาตามตัวอักษร
    subjects.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return Response.json(
      {
        success: true,
        subjects,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Get subjects error:", error);

    return Response.json(
      {
        success: false,
        message: "ไม่สามารถโหลดวิชาเรียนได้",
      },
      { status: 500 }
    );
  }
}

// POST: เพิ่มวิชาเรียน
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
    // อ่าน JSON จาก Front-end
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

    // ตรวจสอบรูปแบบข้อมูล
    if (!isRecord(body)) {
      return Response.json(
        {
          success: false,
          message: "ข้อมูลไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    // อนุญาตให้ส่งเฉพาะ name
    if (Object.keys(body).some((key) => key !== "name")) {
      return Response.json(
        {
          success: false,
          message: "ข้อมูลมีฟิลด์ที่ไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    // ตรวจสอบชื่อวิชา
    if (!name || name.length > 80) {
      return Response.json(
        {
          success: false,
          message: "กรุณากรอกชื่อวิชาไม่เกิน 80 ตัวอักษร",
        },
        { status: 400 }
      );
    }

    // อ้างอิง Subjects ของผู้ใช้
    const subjectsRef = adminDb
      .collection("users")
      .doc(user.uid)
      .collection("subjects");

    // ตรวจสอบวิชาซ้ำ โดยไม่สนตัวพิมพ์เล็กหรือใหญ่
    const snapshot = await subjectsRef.get();

    const duplicate = snapshot.docs.some((subjectDoc) => {
      const data = subjectDoc.data();

      return (
        typeof data.name === "string" &&
        data.name.trim().toLowerCase() ===
          name.toLowerCase()
      );
    });

    if (duplicate) {
      return Response.json(
        {
          success: false,
          message: "มีวิชานี้อยู่แล้ว กรุณาใช้ชื่อวิชาอื่น",
        },
        { status: 409 }
      );
    }

    // สร้าง Document ID จาก Firestore
    const subjectRef = subjectsRef.doc();

    const newSubject: SubjectRecord = {
      id: subjectRef.id,
      name,
      createdAt: new Date().toISOString(),
    };

    // บันทึกข้อมูลลง Firestore
    await subjectRef.set(newSubject);

    return Response.json(
      {
        success: true,
        message: "เพิ่มวิชาเรียนเรียบร้อยแล้ว",
        subject: newSubject,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add subject error:", error);

    return Response.json(
      {
        success: false,
        message: "ไม่สามารถเพิ่มวิชาเรียนได้",
      },
      { status: 500 }
    );
  }
}
