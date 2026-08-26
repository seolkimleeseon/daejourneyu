import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = "30d";

export function signAuthToken(userId: string): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET이 설정되지 않았어요. backend/.env를 확인해주세요");
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

/** 유효하지 않거나 만료된 토큰이면 null을 돌려준다(예외를 던지지 않음 — 호출부에서 401로 처리). */
export function verifyAuthToken(token: string): string | null {
  if (!JWT_SECRET) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload === "object" && payload !== null && typeof payload.sub === "string") {
      return payload.sub;
    }
    return null;
  } catch {
    return null;
  }
}
