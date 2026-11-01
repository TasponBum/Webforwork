
import "server-only";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

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

// ---------------------------------
// POST: สมัครสมาชิก
// ---------------------------------

export async function POST(request: Request) {
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

    // อนุญาตเฉพาะ name, email และ password
    const allowedFields = [
      "name",
      "email",
      "password",
    ];

    const hasInvalidField = Object.keys(body).some(
      (key) => !allowedFields.includes(key)
    );

    if (hasInvalidField) {
      return Response.json(
        {
          success: false,
          message: "มีข้อมูลที่ไม่อนุญาตให้ส่งมา",
        },
        { status: 400 }
      );
    }

    // เตรียมข้อมูล
    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    // ---------------------------------
    // ตรวจสอบข้อมูล
    // ---------------------------------

    if (!name || name.length > 80) {
      return Response.json(
        {
          success: false,
          message: "กรุณากรอกชื่อไม่เกิน 80 ตัวอักษร",
        },
        { status: 400 }
      );
    }

    if (
      !email ||
      email.length > 254
    ) {
      return Response.json(
        {
          success: false,
          message: "อีเมลไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    if (
      password.length < 6 ||
      password.length > 4096
    ) {
      return Response.json(
        {
          success: false,
          message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
        },
        { status: 400 }
      );
    }

    // ---------------------------------
    // สร้างบัญชี Firebase Authentication
    // ---------------------------------

    let createdUser;

    try {
      createdUser = await adminAuth.createUser({
        displayName: name,
        email,
        password,
      });

    } catch (error) {
      const firebaseError = error as {
        code?: string;
      };

      console.error(
        "Create Firebase user error:",
        error
      );

      switch (firebaseError.code) {
        case "auth/email-already-exists":
          return Response.json(
            {
              success: false,
              message: "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบแทน",
            },
            { status: 409 }
          );

        case "auth/invalid-email":
          return Response.json(
            {
              success: false,
              message: "รูปแบบอีเมลไม่ถูกต้อง",
            },
            { status: 400 }
          );

        case "auth/invalid-password":
        case "auth/weak-password":
          return Response.json(
            {
              success: false,
              message: "รหัสผ่านไม่ถูกต้อง กรุณาตั้งรหัสผ่านใหม่",
            },
            { status: 400 }
          );

        case "auth/operation-not-allowed":
          return Response.json(
            {
              success: false,
              message: "ระบบสมัครสมาชิกยังไม่เปิดใช้งาน",
            },
            { status: 500 }
          );

        default:
          return Response.json(
            {
              success: false,
              message: "ไม่สามารถสร้างบัญชีได้ กรุณาลองใหม่",
            },
            { status: 500 }
          );
      }
    }

    // ---------------------------------
    // บันทึกข้อมูลลง Cloud Firestore
    // ---------------------------------

    try {
      await adminDb
        .collection("users")
        .doc(createdUser.uid)
        .set({
          uid: createdUser.uid,
          name,
          email,
          major: "",
          year: "",
          bio: "",
          createdAt: FieldValue.serverTimestamp(),
        });

    } catch (error) {
      console.error(
        "Save initial profile error:",
        error
      );

      // หากบันทึก Firestore ไม่สำเร็จ
      // ให้ลบบัญชี Authentication ที่เพิ่งสร้าง
      // เพื่อป้องกันการมีบัญชีที่ไม่มี Profile
      try {
        await adminAuth.deleteUser(createdUser.uid);
      } catch (rollbackError) {
        console.error(
          "Rollback Firebase user error:",
          rollbackError
        );
      }

      return Response.json(
        {
          success: false,
          message: "สร้างบัญชีได้ แต่บันทึกข้อมูลโปรไฟล์ไม่สำเร็จ",
        },
        { status: 500 }
      );
    }

    // ---------------------------------
    // ส่งผลลัพธ์กลับ Front-end
    // ---------------------------------

    return Response.json(
      {
        success: true,
        message: "สมัครสมาชิกเรียบร้อยแล้ว",
        user: {
          uid: createdUser.uid,
          name: createdUser.displayName,
          email: createdUser.email,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Register API error:", error);

    return Response.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการสมัครสมาชิก",
      },
      { status: 500 }
    );
  }
}
