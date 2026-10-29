
export type MockUser = {
  id: string;
  name: string;
  email: string;
  major: string;
  year: string;
  bio: string;
  createdAt: string;
};

type StoredUser = MockUser & {
  salt: string;
  passwordHash: string;
};

type MockResult<T> =
  | { success: true; data: T }
  | { success: false; message: string };

type ProfileInput = {
  name: string;
  email: string;
  major: string;
  year: string;
  bio: string;
};

const USERS_KEY = "studymate_mock_users";
const SESSION_KEY = "studymate_mock_session";

// อ่านรายชื่อผู้ใช้ที่บันทึกไว้
function readUsers(): StoredUser[] {
  try {
    const saved = localStorage.getItem(USERS_KEY);

    if (!saved) return [];

    const users: unknown = JSON.parse(saved);

    if (!Array.isArray(users)) return [];

    return users as StoredUser[];
  } catch {
    return [];
  }
}

// บันทึกรายชื่อผู้ใช้
function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// สร้าง salt แบบสุ่มสำหรับข้อมูลรหัสผ่านจำลอง
function createSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));

  return Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

// สร้างค่า hash เพื่อไม่เก็บรหัสผ่านเป็นข้อความธรรมดา
async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

// ตัดข้อมูลรหัสผ่านออกก่อนส่งให้หน้าเว็บ
function toPublicUser(user: StoredUser): MockUser {
  const { salt: _salt, passwordHash: _passwordHash, ...publicUser } =
    user;

  return publicUser;
}

// สมัครสมาชิก
export async function registerMockUser(
  name: string,
  email: string,
  password: string
): Promise<MockResult<MockUser>> {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedName || !normalizedEmail || !password) {
    return {
      success: false,
      message: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
    };
  }

  const users = readUsers();

  if (users.some((user) => user.email === normalizedEmail)) {
    return {
      success: false,
      message: "อีเมลนี้ถูกใช้สมัครสมาชิกแล้ว",
    };
  }

  const salt = createSalt();
  const passwordHash = await hashPassword(password, salt);

  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    name: normalizedName,
    email: normalizedEmail,
    major: "",
    year: "",
    bio: "",
    createdAt: new Date().toISOString(),
    salt,
    passwordHash,
  };

  users.push(newUser);
  saveUsers(users);

  return {
    success: true,
    data: toPublicUser(newUser),
  };
}

// เข้าสู่ระบบ
export async function loginMockUser(
  email: string,
  password: string
): Promise<MockResult<MockUser>> {
  const normalizedEmail = email.trim().toLowerCase();
  const users = readUsers();

  const user = users.find(
    (item) => item.email === normalizedEmail
  );

  if (!user) {
    return {
      success: false,
      message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    };
  }

  const passwordHash = await hashPassword(
    password,
    user.salt
  );

  if (passwordHash !== user.passwordHash) {
    return {
      success: false,
      message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    };
  }

  // เก็บเฉพาะ ID ของผู้ใช้ที่เข้าสู่ระบบ
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ userId: user.id })
  );

  return {
    success: true,
    data: toPublicUser(user),
  };
}

// อ่านข้อมูลผู้ใช้ที่เข้าสู่ระบบอยู่
export function getCurrentMockUser(): MockUser | null {
  try {
    const session = localStorage.getItem(SESSION_KEY);

    if (!session) return null;

    const parsed: unknown = JSON.parse(session);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("userId" in parsed) ||
      typeof parsed.userId !== "string"
    ) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    const user = readUsers().find(
      (item) => item.id === parsed.userId
    );

    if (!user) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return toPublicUser(user);
  } catch {
    return null;
  }
}

// แก้ไขข้อมูลโปรไฟล์
export function updateMockProfile(
  profile: ProfileInput
): MockResult<MockUser> {
  const currentUser = getCurrentMockUser();

  if (!currentUser) {
    return {
      success: false,
      message: "กรุณาเข้าสู่ระบบก่อนแก้ไขโปรไฟล์",
    };
  }

  const name = profile.name.trim();
  const email = profile.email.trim().toLowerCase();

  if (!name || !email) {
    return {
      success: false,
      message: "กรุณากรอกชื่อและอีเมล",
    };
  }

  const users = readUsers();

  if (
    users.some(
      (user) =>
        user.email === email &&
        user.id !== currentUser.id
    )
  ) {
    return {
      success: false,
      message: "อีเมลนี้ถูกใช้โดยบัญชีอื่นแล้ว",
    };
  }

  const updatedUsers = users.map((user) =>
    user.id === currentUser.id
      ? {
          ...user,
          name,
          email,
          major: profile.major.trim(),
          year: profile.year,
          bio: profile.bio.trim(),
        }
      : user
  );

  saveUsers(updatedUsers);

  const updatedUser = updatedUsers.find(
    (user) => user.id === currentUser.id
  );

  if (!updatedUser) {
    return {
      success: false,
      message: "ไม่สามารถบันทึกโปรไฟล์ได้",
    };
  }

  return {
    success: true,
    data: toPublicUser(updatedUser),
  };
}

// ออกจากระบบ
export function logoutMockUser(): void {
  localStorage.removeItem(SESSION_KEY);
}
