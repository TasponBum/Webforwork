
import "server-only";

import {
  cert,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// อ่านข้อมูลจาก Environment Variables
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
  /\\n/g,
  "\n"
);

// ตรวจสอบว่ากำหนดค่าครบหรือไม่
if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    "Firebase Admin credentials are missing. Please check .env.local"
  );
}

// ป้องกันการสร้าง Firebase Admin App ซ้ำ
const adminApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

// ส่งออก Firebase Admin Authentication
export const adminAuth = getAuth(adminApp);

// ส่งออก Firebase Admin Firestore
export const adminDb = getFirestore(adminApp);
