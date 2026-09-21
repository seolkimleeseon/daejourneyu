import { ApiError, GoogleGenAI } from "@google/genai";

// GEMINI_API_KEYS(콤마로 여러 개) 또는 GEMINI_API_KEY 하나로 키를 준다. 아래 `gemini`는 첫 키 클라이언트로,
// 호출은 generateContentWithKeys를 거쳐 키·모델을 돌려 쓴다.
// 키가 비어있어도 생성 자체는 에러 내지 않는다 — 실제 호출 시점에
// 인증 에러로 실패하게 두고, 라우트에서 그걸 잡아 안내 메시지로 바꾼다.
// 발급: https://aistudio.google.com/apikey (무료 티어 — 분당·일일 요청 한도가 있고, 인기 모델은 붐비면 503으로 거절한다).
export const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

/**
 * 코스 추천처럼 가벼운 JSON 생성에 쓰는 모델. 앞에서부터 쓰고, 그 모델이 붐비면(503) 다음으로 내려간다.
 *
 * 최신 flash(3.6·3.7)는 무료 티어에서 "This model is currently experiencing high demand"(503)로
 * 튕겨내는 일이 잦다 — 같은 요청을 3번씩 넣어 보면 3.6은 2번, 3.7은 2번 실패하는데 3.5는 3번 다
 * 성공했다. 그래서 3.5를 앞에 두고, 붐빌 때만 뒤로 내려간다(세 모델이 동시에 붐비는 일은 드물다).
 *
 * lite 계열은 1초대로 빠르지만 후보에서 뺐다 — responseType을 course로 골라 놓고 days 대신
 * message에 이모지를 쏟아내는 식으로 새서, 걸러내면 결국 "응답을 이해하지 못했어요"가 된다.
 * 2.5 계열은 신규 키에 더 이상 열리지 않는다(404).
 */
export const GEMINI_MODELS = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash"] as const;

/**
 * 쓸 수 있는 Gemini 키 목록. GEMINI_API_KEYS="키1,키2,키3"(콤마로 여러 개)과 기존 GEMINI_API_KEY를 합친다.
 *
 * ⚠ 무료 티어 한도는 키가 아니라 **프로젝트**에 붙는다. 같은 프로젝트에서 키만 여러 개 만들면 한도를
 * 같이 써서 소용이 없다 — 키마다 다른 구글 프로젝트(또는 계정)에서 발급해야 한도가 늘어난다.
 */
export function geminiApiKeys(): string[] {
  const fromList = (process.env.GEMINI_API_KEYS ?? "").split(",");
  const keys = [...fromList, process.env.GEMINI_API_KEY ?? ""].map((key) => key.trim()).filter(Boolean);
  return [...new Set(keys)];
}

const clients = new Map<string, GoogleGenAI>();
function clientFor(key: string): GoogleGenAI {
  let client = clients.get(key);
  if (!client) {
    client = new GoogleGenAI({ apiKey: key });
    clients.set(key, client);
  }
  return client;
}

/** 막힌 (키, 모델) 조합이 다시 시도되기까지 쉬는 시간. 429는 한도가 풀리는 데 걸리는 시간이 길어 오래 쉰다. */
const COOLDOWN_MS = { quota: 5 * 60_000, busy: 20_000, badKey: 10 * 60_000 } as const;
/** 이 시간이 지나면 더 돌지 않고 지금까지의 실패를 알린다 — 답이 늦으면 화면(챗봇 25초)이 먼저 포기한다. */
const DEADLINE_MS = 20_000;

type CooldownReason = "quota" | "busy" | "badKey";
const cooldowns = new Map<string, { until: number; reason: CooldownReason }>();
let cursor = 0;

const cooldownKey = (key: string, model: string) => `${key}::${model}`;

/** 테스트에서 상태를 비우는 용도. */
export function resetGeminiRotation() {
  cooldowns.clear();
  clients.clear();
  cursor = 0;
}

type GenerateParams = Parameters<typeof gemini.models.generateContent>[0];

/**
 * 키와 모델을 돌려 가며 호출한다. 모델 순서(GEMINI_MODELS)가 우선이고, 같은 모델 안에서 키를 바꿔 본다.
 *
 * - 429(한도 초과)·503(붐빔)은 그 (키, 모델)을 잠깐 쉬게 하고 다음 조합으로 넘어간다. 쉬는 조합은 건너뛰어
 *   한도가 바닥난 키로 매번 헛호출을 하지 않는다.
 * - 401·403(잘못된 키)도 그 키만 쉬게 하고 다른 키로 넘어간다 — 키 하나가 틀렸다고 전체가 죽지 않게.
 * - 그 밖의 오류는 다시 불러도 같은 답이라 그대로 던진다.
 * - 요청마다 시작 키를 한 칸씩 옮겨 키들이 고르게 쓰이게 한다.
 * - 전부 실패하면 **가장 알려줄 만한** 오류를 던진다. 마지막 오류만 던지면 429(한도 소진)가 마지막 모델의
 *   503(붐빔)에 가려져 사용자는 원인을 모른 채 "일시적 문제"만 보게 된다: 429 > 잘못된 키 > 503 순으로 고른다.
 */
export async function generateContentWithKeys(params: Omit<GenerateParams, "model">) {
  const keys = geminiApiKeys();
  if (keys.length === 0) {
    // 키가 없으면 빈 키 클라이언트가 실제 호출에서 인증 오류를 내도록 둔다(라우트가 안내 문구로 바꾼다).
    return gemini.models.generateContent({ ...params, model: GEMINI_MODELS[0] });
  }

  const start = cursor++ % keys.length;
  const ordered = keys.map((_, index) => keys[(start + index) % keys.length]);
  const startedAt = Date.now();
  const failures: { status: number; error: unknown }[] = [];
  let tried = 0;

  outer: for (const model of GEMINI_MODELS) {
    for (const key of ordered) {
      const cooling = cooldowns.get(cooldownKey(key, model));
      if (cooling && cooling.until > Date.now()) continue;
      if (Date.now() - startedAt > DEADLINE_MS) break outer;

      tried++;
      try {
        return await clientFor(key).models.generateContent({ ...params, model });
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
        const status = error.status;
        if (status === 429 || status === 503) {
          const reason: CooldownReason = status === 429 ? "quota" : "busy";
          cooldowns.set(cooldownKey(key, model), { until: Date.now() + COOLDOWN_MS[reason], reason });
        } else if (status === 401 || status === 403) {
          // 잘못된 키는 어느 모델로 불러도 같으므로 그 키의 모든 모델을 쉬게 한다.
          for (const m of GEMINI_MODELS) {
            cooldowns.set(cooldownKey(key, m), { until: Date.now() + COOLDOWN_MS.badKey, reason: "badKey" });
          }
        } else {
          throw error;
        }
        failures.push({ status, error });
      }
    }
  }

  const pick = (statuses: number[]) => failures.find((failure) => statuses.includes(failure.status));
  const best = pick([429]) ?? pick([401, 403]) ?? pick([503]);
  if (best) throw best.error;

  // 이번 요청에서 한 번도 시도하지 못했다 — 모든 조합이 쉬는 중이다. 쉬는 이유로 알맞은 오류를 만든다.
  if (tried === 0) {
    const reasons = [...cooldowns.values()].filter((entry) => entry.until > Date.now()).map((entry) => entry.reason);
    const status = reasons.includes("quota") ? 429 : reasons.includes("badKey") ? 401 : 503;
    throw new ApiError({ message: "모든 Gemini 키·모델이 잠시 쉬는 중이에요", status });
  }
  throw new Error("Gemini 호출에 실패했어요");
}
