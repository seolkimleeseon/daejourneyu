/** requireAuth가 채워 넣는 사용자 식별자. 라우터에서 req.userId로 읽는다. */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
