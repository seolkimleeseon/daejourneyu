export interface User {
  id: string;
  /** 카카오 계정은 이메일 동의를 안 받았을 수 있어 없을 수 있다. */
  email: string | null;
  nickname: string;
  /** "local" | "kakao" — 비밀번호 로그인이 가능한 계정인지 구분한다. */
  provider: string;
}
