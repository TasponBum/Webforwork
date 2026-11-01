
import "server-only";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/verify-auth";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

type ProfileRecord = {
  name: string;
  email: string;
  major: string;
  year: string;
  bio: string;
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

// ---------------------------------
// GET: อ่านข้อมูล Profile
// ---------------------------------

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
    // อ่านข้อมูลบัญชีจาก Firebase Authentication
    const authUser = await adminAuth.getUser(user.uid);

    // อ่านข้อมูลเพิ่มเติมจาก Firestore
    const profileRef = adminDb
      .collection("users")
      .doc(user.uid);

    const profileSnapshot = await profileRef.get();

    const savedData = profileSnapshot.exists
      ? profileSnapshot.data() ?? {}
      : {};

    // รวมข้อมูลจาก Authentication และ Firestore
    const profile: ProfileRecord = {
      name:
        typeof savedData.name === "string"
          ? savedData.name
          : authUser.displayName ?? "",

      email: authUser.email ?? "",

      major:
        typeof savedData.major === "string"
          ? savedData.major
          : "",

      year:
        typeof savedData.year === "string"
          ? savedData.year
          : "",

      bio:
        typeof savedData.bio === "string"
          ? savedData.bio
          : "",
    };

    return Response.json(
      {
        success: true,
        profile,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Get profile error:", error);

    return Response.json(
      {
        success: false,
        message: "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้",
      },
      { status: 500 }
    );
  }
}

// ---------------------------------
// PATCH: แก้ไขข้อมูล Profile
// ---------------------------------

export async function PATCH(request: Request) {
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

    // ฟิลด์ที่อนุญาตให้แก้ไข
    const allowedFields = [
      "name",
      "major",
      "year",
      "bio",
    ];

    // ป้องกันการแก้ไขฟิลด์ที่ไม่ได้รับอนุญาต
    const hasInvalidField = Object.keys(body).some(
      (key) => !allowedFields.includes(key)
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

    // ต้องมีข้อมูลอย่างน้อยหนึ่งฟิลด์
    if (Object.keys(body).length === 0) {
      return Response.json(
        {
          success: false,
          message: "ไม่มีข้อมูลสำหรับแก้ไข",
        },
        { status: 400 }
      );
    }

    const updates: Partial<ProfileRecord> = {};

    // ตรวจสอบชื่อที่ใช้แสดง
    if ("name" in body) {
      if (typeof body.name !== "string") {
        return Response.json(
          {
            success: false,
            message: "ชื่อที่ใช้แสดงไม่ถูกต้อง",
          },
          { status: 400 }
        );
      }

      const name = body.name.trim();

      if (!name || name.length > 80) {
        return Response.json(
          {
            success: false,
            message: "กรุณากรอกชื่อไม่เกิน 80 ตัวอักษร",
          },
          { status: 400 }
        );
      }

      updates.name = name;
    }

    // ตรวจสอบสาขาวิชา
    if ("major" in body) {
      if (
        typeof body.major !== "string" ||
        body.major.trim().length > 120
      ) {
        return Response.json(
          {
            success: false,
            message: "สาขาวิชาไม่ถูกต้อง",
          },
          { status: 400 }
        );
      }

      updates.major = body.major.trim();
    }

    // ตรวจสอบชั้นปี
    if ("year" in body) {
      if (
        typeof body.year !== "string" ||
        body.year.length > 30
      ) {
        return Response.json(
          {
            success: false,
            message: "ชั้นปีไม่ถูกต้อง",
          },
          { status: 400 }
        );
      }

      updates.year = body.year.trim();
    }

    // ตรวจสอบข้อมูลเกี่ยวกับฉัน
    if ("bio" in body) {
      if (
        typeof body.bio !== "string" ||
        body.bio.length > 300
      ) {
        return Response.json(
          {
            success: false,
            message: "ข้อมูลเกี่ยวกับฉันต้องไม่เกิน 300 ตัวอักษร",
          },
          { status: 400 }
        );
      }

      updates.bio = body.bio.trim();
    }

    // อ่านข้อมูลผู้ใช้จาก Firebase Authentication
    const authUser = await adminAuth.getUser(user.uid);

    // อัปเดต Display Name ใน Firebase Authentication
    if (updates.name !== undefined) {
      await adminAuth.updateUser(user.uid, {
        displayName: updates.name,
      });
    }

    // บันทึกข้อมูลโปรไฟล์ลง Firestore
    const profileRef = adminDb
      .collection("users")
      .doc(user.uid);

    await profileRef.set(
      {
        uid: user.uid,
        email: authUser.email ?? "",
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    // อ่านข้อมูลล่าสุดกลับมา
    const updatedSnapshot = await profileRef.get();
    const savedData = updatedSnapshot.data() ?? {};

    const profile: ProfileRecord = {
      name:
        typeof savedData.name === "string"
          ? savedData.name
          : updates.name ?? authUser.displayName ?? "",

      email: authUser.email ?? "",

      major:
        typeof savedData.major === "string"
          ? savedData.major
          : "",

      year:
        typeof savedData.year === "string"
          ? savedData.year
          : "",

      bio:
        typeof savedData.bio === "string"
          ? savedData.bio
          : "",
    };

    return Response.json({
      success: true,
      message: "บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว",
      profile,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return Response.json(
      {
        success: false,
        message: "ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้",
      },
      { status: 500 }
    );
  }
}
