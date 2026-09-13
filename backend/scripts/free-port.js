// npm run dev 전에 자동 실행되는 스크립트(package.json의 predev). tsx watch가 재시작 중이거나
// 이전 세션이 비정상 종료돼서 4000번 포트를 여전히 물고 있으면 EADDRINUSE로 죽는 문제가 반복돼서,
// dev 서버를 켜기 직전에 그 포트를 쓰고 있는 프로세스가 있으면 먼저 정리한다.
const { execSync } = require("node:child_process");

const PORT = process.env.PORT || 4000;

function run(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString();
  } catch {
    return "";
  }
}

function freePortWindows(port) {
  const output = run(`netstat -ano | findstr :${port}`);
  const pids = new Set();
  for (const line of output.split("\n")) {
    const match = line.trim().match(/LISTENING\s+(\d+)\s*$/);
    if (match) pids.add(match[1]);
  }
  for (const pid of pids) {
    run(`taskkill /F /PID ${pid}`);
    console.log(`[free-port] 이전에 ${port}번 포트를 쓰던 프로세스(PID ${pid})를 정리했어요.`);
  }
}

function freePortUnix(port) {
  const output = run(`lsof -ti tcp:${port}`);
  const pids = output.split("\n").map((line) => line.trim()).filter(Boolean);
  for (const pid of pids) {
    run(`kill -9 ${pid}`);
    console.log(`[free-port] 이전에 ${port}번 포트를 쓰던 프로세스(PID ${pid})를 정리했어요.`);
  }
}

if (process.platform === "win32") {
  freePortWindows(PORT);
} else {
  freePortUnix(PORT);
}
