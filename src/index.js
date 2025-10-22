import Resolver from "@forge/resolver";
import api, { assumeTrustedRoute, storage } from "@forge/api";

const resolver = new Resolver();

const log = (...a) => console.log("[resolver]", ...a);

log("index.js loaded (A2A Protocol with Config) =====");

/**
 * ガジェット固有の設定を取得
 */
async function getConfig(context) {
  try {
    const gadgetId = context?.extension?.gadget?.id;
    if (!gadgetId) {
      log("No gadget ID found");
      return { A2A_AGENT_URL: "", DEV_TUNNEL_TOKEN: "" };
    }
    
    const config = await storage.get(`config:${gadgetId}`);
    log("Config loaded:", config ? "found" : "not found");
    
    return {
      A2A_AGENT_URL: config?.A2A_AGENT_URL || "",
      DEV_TUNNEL_TOKEN: config?.DEV_TUNNEL_TOKEN || ""
    };
  } catch (e) {
    log("getConfig error", e);
    return { A2A_AGENT_URL: "", DEV_TUNNEL_TOKEN: "" };
  }
}

/**
 * 設定を保存
 */
resolver.define("edit-resolver", async ({ payload, context }) => {
  log("edit-resolver called", payload);
  
  try {
    const gadgetId = context?.extension?.gadget?.id;
    if (!gadgetId) {
      return {
        status: "error",
        message: "ガジェットIDが取得できませんでした"
      };
    }
    
    const { A2A_AGENT_URL, DEV_TUNNEL_TOKEN } = payload;
    
    // 設定を保存
    await storage.set(`config:${gadgetId}`, {
      A2A_AGENT_URL: A2A_AGENT_URL?.trim() || "",
      DEV_TUNNEL_TOKEN: DEV_TUNNEL_TOKEN?.trim() || ""
    });
    
    log("Config saved for gadget:", gadgetId);
    
    return {
      status: "success",
      message: "設定を保存しました"
    };
  } catch (e) {
    log("edit-resolver error", e);
    return {
      status: "error",
      message: `エラー: ${e.message}`
    };
  }
});

/**
 * URL検証機能
 */
resolver.define("validate-config", async ({ payload }) => {
  log("validate-config called", payload);
  
  const { A2A_AGENT_URL, DEV_TUNNEL_TOKEN } = payload;
  
  if (!A2A_AGENT_URL?.trim()) {
    return {
      valid: false,
      error: "URLが入力されていません"
    };
  }
  
  try {
    // エージェントカードを取得して検証
    const url = `${A2A_AGENT_URL.trim()}/.well-known/agent.json`;
    log("Validating URL:", url);
    
    const res = await api.fetch(
      assumeTrustedRoute(url),
      {
        headers: DEV_TUNNEL_TOKEN?.trim() 
          ? { "X-Tunnel-Authorization": `tunnel ${DEV_TUNNEL_TOKEN.trim()}` } 
          : {},
        timeout: 10000  // 10秒タイムアウト
      }
    );
    
    log("Validation response status:", res.status);
    
    if (!res.ok) {
      return {
        valid: false,
        error: `接続失敗: HTTP ${res.status}`
      };
    }
    
    const agentCard = await res.json();
    log("Agent card received:", agentCard.name);
    
    return {
      valid: true,
      agentName: agentCard.name || "Unknown",
      agentDescription: agentCard.description || "",
      capabilities: agentCard.capabilities || {}
    };
    
  } catch (e) {
    log("validate-config error", e);
    return {
      valid: false,
      error: `接続エラー: ${e.message}`
    };
  }
});

/**
 * A2Aエージェントカードを取得
 */
async function getAgentCard(baseUrl, token) {
  try {
    const url = `${baseUrl}/.well-known/agent.json`;
    const res = await api.fetch(
      assumeTrustedRoute(url),
      {
        headers: token ? { "X-Tunnel-Authorization": `tunnel ${token}` } : {}
      }
    );
    
    if (!res.ok) {
      throw new Error(`Failed to fetch agent card: ${res.status}`);
    }
    
    return await res.json();
  } catch (e) {
    log("getAgentCard error", e);
    throw e;
  }
}

/**
 * UUIDv4を生成（簡易版）
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * プロンプト拡張: ユーザーからの質問に追加の指示を付け加える
 */
function enhancePrompt(prompt) {
  return `
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
}

/**
 * A2Aストリーミングメッセージを送信し、イベントを収集
 */
async function sendA2AStreamingMessage(agentCard, prompt, token) {
  try {
    const messageId = generateUUID();
    const requestId = generateUUID();
    
    log("Sending A2A streaming message, messageId:", messageId);
    
    // A2A MessageSendParams構築
    const payload = {
      message: {
        messageId: messageId,
        role: "user",
        parts: [
          {
            kind: "text",
            text: prompt
          }
        ],
        kind: "message"
      }
    };
    
    // ストリーミングエンドポイントを呼び出し
    const streamUrl = `${agentCard.url}a2a/v1/messages/streaming`;
    
    const res = await api.fetch(
      assumeTrustedRoute(streamUrl),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "X-Tunnel-Authorization": `tunnel ${token}` }),
        },
        body: JSON.stringify({
          id: requestId,
          params: payload
        }),
      }
    );
    
    log("A2A streaming response status:", res.status);
    
    if (!res.ok) {
      throw new Error(`A2A streaming request failed: ${res.status}`);
    }
    
    // ストリーミングレスポンスをテキストとして取得
    const responseText = await res.text();
    log("A2A streaming response received, length:", responseText.length);
    
    // Server-Sent Events (SSE) 形式をパース
    const events = parseSSE(responseText);
    log("Parsed events count:", events.length);
    
    return {
      success: true,
      events: events,
      messageId: messageId
    };
    
  } catch (e) {
    log("sendA2AStreamingMessage error", e);
    throw e;
  }
}

/**
 * Server-Sent Events (SSE) 形式のテキストをパース
 */
function parseSSE(text) {
  const events = [];
  const lines = text.split('\n');
  let currentEvent = {};
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const dataStr = line.substring(6).trim();
      if (dataStr && dataStr !== '[DONE]') {
        try {
          const data = JSON.parse(dataStr);
          currentEvent.data = data;
        } catch (e) {
          log("Failed to parse SSE data:", dataStr);
        }
      }
    } else if (line.startsWith('event: ')) {
      currentEvent.event = line.substring(7).trim();
    } else if (line === '') {
      // 空行はイベントの区切り
      if (currentEvent.data) {
        events.push(currentEvent);
        currentEvent = {};
      }
    }
  }
  
  // 最後のイベントを追加
  if (currentEvent.data) {
    events.push(currentEvent);
  }
  
  return events;
}

/**
 * A2Aイベントから最終結果を抽出
 */
function extractFinalResult(events) {
  let finalText = "";
  let thinking = [];
  let taskId = null;
  let completed = false;
  
  for (const event of events) {
    const data = event.data;
    
    // Taskイベント
    if (data.kind === "task") {
      taskId = data.id;
      log("Task created:", taskId);
    }
    
    // Status updateイベント
    if (data.kind === "status-update") {
      const statusText = data.status?.message?.parts?.[0]?.text || "";
      if (statusText) {
        thinking.push(statusText);
        log("Status update:", statusText);
      }
      
      if (data.final) {
        completed = true;
        log("Task completed");
      }
    }
    
    // Artifact updateイベント
    if (data.kind === "artifact-update") {
      const artifactName = data.artifact?.name || data.artifact?.artifactId;
      
      // conversion_resultアーティファクトからテキストを抽出
      if (artifactName === "conversion_result") {
        const parts = data.artifact?.parts || [];
        for (const part of parts) {
          if (part.kind === "text" && part.text) {
            finalText += part.text;
          }
        }
        log("Extracted text from conversion_result:", finalText.substring(0, 100));
      }
    }
  }
  
  return {
    answer: finalText || null,
    thinking: thinking,
    taskId: taskId,
    completed: completed
  };
}

/* ---------- メインResolver: A2Aプロトコルでメッセージ送信 ---------- */
resolver.define("main-resolver", async ({ payload, context }) => {
  log("payload =", payload);
  const { prompt } = payload || {};
  
  if (!prompt?.trim()) {
    return { status: "error", message: "⚠️ 質問が空です" };
  }
  
  // ガジェットの設定を取得
  const config = await getConfig(context);
  const A2A_AGENT_URL = config.A2A_AGENT_URL;
  const TUNNEL_TOKEN = config.DEV_TUNNEL_TOKEN;
  
  if (!A2A_AGENT_URL) {
    return { 
      status: "error", 
      message: "⚠️ A2A Agent URLが設定されていません。ガジェット右上の設定ボタンから入力してください。" 
    };
  }
  
  try {
    // 1. エージェントカードを取得
    log("Fetching agent card...");
    const agentCard = await getAgentCard(A2A_AGENT_URL, TUNNEL_TOKEN);
    log("Agent card:", agentCard.name);
    
    // 2. プロンプトを拡張
    const enhancedPrompt = enhancePrompt(prompt);
    log("Enhanced prompt length:", enhancedPrompt.length);
    
    // 3. A2Aストリーミングメッセージを送信
    log("Sending A2A streaming message...");
    const result = await sendA2AStreamingMessage(agentCard, enhancedPrompt, TUNNEL_TOKEN);
    
    // 4. イベントから結果を抽出
    const finalResult = extractFinalResult(result.events);
    
    log("Final result extracted, answer length:", finalResult.answer?.length || 0);
    
    return {
      status: "completed",
      answer: finalResult.answer,
      thinking: finalResult.thinking,
      taskId: finalResult.taskId,
      messageId: result.messageId,
      agentName: agentCard.name
    };
    
  } catch (e) {
    log("main-resolver error", e);
    return {
      status: "error",
      message: `エラー: ${e.message}`
    };
  }
});

/* ---------- exports ---------- */
export const handler = resolver.getDefinitions();
export const editHandler = resolver.getDefinitions();
export const validateConfig = resolver.getDefinitions();
