import Resolver from "@forge/resolver";
import api, { assumeTrustedRoute } from "@forge/api";

const resolver = new Resolver();

// ───────── Dev Tunnel 環境変数 ─────────
const TUNNEL_URL   = (process.env.DEV_TUNNEL_URL  || "").trim().replace(/\/$/, "");
const TUNNEL_TOKEN =  process.env.DEV_TUNNEL_TOKEN || "";
// ──────────────────────────────────────

const log = (...a) => console.log("[resolver]", ...a);

log("index.js loaded =====");
log("TUNNEL_URL  =", TUNNEL_URL || "(empty)");
log("env present =", !!process.env.DEV_TUNNEL_URL, !!process.env.DEV_TUNNEL_TOKEN);

/* ---------- ① /submit を呼ぶ ---------- */
resolver.define("main-resolver", async ({ payload }) => {
  log("payload =", payload);
  const { prompt } = payload || {};
  if (!prompt?.trim()) return { status:"error", message:"⚠️ 質問が空です" };

  // プロンプト拡張: ユーザーからの質問に追加の指示を付け加える
  const enhancedPrompt = `
【ユーザーからの質問】
${prompt}

【回答のガイドライン】
・ユーザーからの指示がなければ以下のように回答してください：
    - 簡潔で分かりやすい回答を心がけてください
    - 技術的な内容の場合は、初心者にも理解できるよう説明してください
    - Jiraに関する質問の場合は、実際の操作手順も含めてください
・ユーザーからの質問に答える際は以下気を付けてください：
    - 必要に応じてSlackエージェントに問い合わせて最新情報を確認してください
`;

  log("enhanced prompt =", enhancedPrompt);

  try {
    const res = await api.fetch(
      assumeTrustedRoute(`${TUNNEL_URL}/submit`),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(TUNNEL_TOKEN && { "X-Tunnel-Authorization": `tunnel ${TUNNEL_TOKEN}` }),
        },
        body: JSON.stringify({ prompt: enhancedPrompt }),
      }
    );
    log("submit status =", res.status);
    if (!res.ok) return { status:"error", message:`HTTP ${res.status}` };

    const { jobId } = await res.json();
    log("jobId =", jobId);
    return { status:"queued", jobId };  // UI へ渡すのは jobId だけ
  } catch (e) {
    log("submit error", e);
    return { status:"error", message:e.message };
  }
});

/* ---------- ② /result を代理取得 ---------- */
resolver.define("get-result", async ({ payload }) => {
  const { jobId } = payload || {};
  if (!jobId) return { answer:null };

  const url = `${TUNNEL_URL}/result/${jobId}`;
  try {
    const res = await api.fetch(
      assumeTrustedRoute(url),
      { headers: TUNNEL_TOKEN ? { "X-Tunnel-Authorization": `tunnel ${TUNNEL_TOKEN}` } : {} }
    );
    log("result status", res.status, jobId);
    if (!res.ok) return { answer:null };

    return await res.json();   // {answer:null | "..."}
  } catch (e) {
    log("result error", e);
    return { answer:null };
  }
});

/* ---------- exports ---------- */
export const handler   = resolver.getDefinitions();  // main-resolver
export const getResult = resolver.getDefinitions();  // get-result