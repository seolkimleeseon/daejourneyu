import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Express 4는 async 핸들러가 던진 예외를 잡아주지 않아 프로세스가 그대로 죽는다.
 * 모든 비동기 라우트를 이 래퍼로 감싸 에러 미들웨어로 넘긴다.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
