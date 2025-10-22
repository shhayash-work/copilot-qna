import React, { useState, useRef, useEffect } from "react";
import { invoke } from "@forge/bridge";
import TextArea from "@atlaskit/textarea";
import Button   from "@atlaskit/button";
import IconChevronDown from "@atlaskit/icon/glyph/chevron-down";
import IconSettings from "@atlaskit/icon/glyph/settings";
import Edit from "./Edit";

export default function App() {
  /* ------------- state ------------- */
  const [prompt, setPrompt]   = useState("");
  const [msgs,   setMsgs]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const historyRef = useRef(null);

  /* 履歴を最下部へスクロール */
  useEffect(() => {
    if (historyRef.current)
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [msgs]);

  /* ---------------- 送信（非同期タスク + ポーリング） ---------------- */
  const send = async () => {
    if (!prompt.trim()) return;
    const userText = prompt;
    setPrompt("");
    setMsgs(m => [...m, { role:"user", text:userText }]);
    setLoading(true);

    try {
      // 1. タスクを開始
      const startRes = await invoke("start-task", { prompt: userText });
      
      if (startRes.status === "error") {
        setMsgs(m => [...m, {
          role: "assistant",
          text: startRes.message || "エラーが発生しました"
        }]);
        setLoading(false);
        return;
      }
      
      if (startRes.status !== "started") {
        setMsgs(m => [...m, {
          role: "assistant",
          text: "タスクの開始に失敗しました"
        }]);
        setLoading(false);
        return;
      }
      
      const { taskId, agentName } = startRes;
      
      // 2. アシスタントメッセージを追加（処理中）
      const currentMsgCount = msgs.length + 1; // ユーザーメッセージの後
      const assistantMsgIndex = currentMsgCount; // アシスタントメッセージのインデックス
      
      setMsgs(m => [...m, {
        role: "assistant",
        text: "", // 空文字（Spinnerのみ表示）
        thinking: [],
        showThinking: false,
        agentName: agentName,
        taskId: taskId,
        isProcessing: true
      }]);
      
      // 3. ポーリングループ
      const pollInterval = 500; // 0.5秒ごと
      const maxPolls = 240; // 最大2分間（240回 × 0.5秒）
      let pollCount = 0;
      
      const poll = async () => {
        try {
          const pollRes = await invoke("poll-task", { taskId });
          console.log("Poll result:", pollRes, "assistantMsgIndex:", assistantMsgIndex);
          
          if (pollRes.status === "error") {
            setMsgs(m => {
              console.log("Setting error, current msgs length:", m.length);
              return m.map((msg, i) => 
                i === assistantMsgIndex ? {
                  ...msg,
                  text: `❌ ${pollRes.message}`,
                  isProcessing: false
                } : msg
              );
            });
            setLoading(false);
            return;
          }
          
          // 途中経過を更新
          if (pollRes.thinking && pollRes.thinking.length > 0) {
            setMsgs(m => m.map((msg, i) => 
              i === assistantMsgIndex ? {
                ...msg,
                thinking: pollRes.thinking,
                text: pollRes.answer || "" // 空文字（Spinnerのみ表示）
              } : msg
            ));
          }
          
          // 完了チェック
          if (pollRes.status === "completed") {
            console.log("Task completed! Setting isProcessing to false");
            setMsgs(m => {
              console.log("Completing task, current msgs length:", m.length);
              return m.map((msg, i) => {
                if (i === assistantMsgIndex) {
                  console.log("Updating message at index", i, "isProcessing:", msg.isProcessing, "-> false");
                  return {
                    ...msg,
                    text: pollRes.answer || "回答を取得できませんでした",
                    thinking: pollRes.thinking || [],
                    isProcessing: false
                  };
                }
                return msg;
              });
            });
            setLoading(false);
            return;
          }
          
          // まだ実行中の場合、再度ポーリング
          pollCount++;
          if (pollCount < maxPolls) {
            setTimeout(poll, pollInterval);
          } else {
            // タイムアウト
            setMsgs(m => m.map((msg, i) => 
              i === assistantMsgIndex ? {
                ...msg,
                text: "⚠️ タイムアウトしました",
                isProcessing: false
              } : msg
            ));
            setLoading(false);
          }
        } catch (error) {
          setMsgs(m => m.map((msg, i) => 
            i === assistantMsgIndex ? {
              ...msg,
              text: `❌ ポーリングエラー: ${error.message}`,
              isProcessing: false
            } : msg
          ));
          setLoading(false);
        }
      };
      
      // 最初のポーリングを開始
      setTimeout(poll, pollInterval);
      
    } catch (error) {
      // 例外発生時
      setMsgs(m => [...m, {
        role: "assistant",
        text: `❌ エラー: ${error.message || "不明なエラー"}`
      }]);
      setLoading(false);
    }
  };

  const toggle = idx =>
    setMsgs(m => m.map((msg,i) =>
      i===idx ? { ...msg, showThinking:!msg.showThinking } : msg
    ));

  /* ------------- render ------------- */
  // 設定画面を表示
  if (showSettings) {
    return (
      <div style={{height:650,display:"flex",flexDirection:"column",overflow:"auto"}}>
        <Edit onSaved={() => setShowSettings(false)} />
      </div>
    );
  }

  return (
    <div style={{height:650,display:"flex",flexDirection:"column",padding:12,overflow:"hidden"}}>
      {/* 履歴 */}
      <div ref={historyRef} style={{flex:1,overflowY:"auto",paddingRight:4,marginBottom:12}}>
        {msgs.map((m,i) => {
          const isUser = m.role==="user";
          return (
            <div key={i} style={{textAlign:isUser?"right":"left",marginTop:4}}>
              <div style={{
                position:"relative",
                display:"inline-block",
                maxWidth:"80%",
                background:isUser?"#2E64FF":"#F4F5F7",
                color:isUser?"#fff":"#172B4D",
                borderRadius:isUser?"20px 20px 4px 20px":"20px 20px 20px 4px",
                padding:isUser?"10px 14px":"10px 14px 26px 14px",
                whiteSpace:"pre-wrap",
                lineHeight:1.45,
                textAlign:"left"
              }}>
                {/* 本文 */}
                {m.isProcessing ? (
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <span>💭</span>
                      <span>考え中...</span>
                    </div>
                    {/* 処理中の途中思考を表示（最新のみ） */}
                    {m.thinking && m.thinking.length > 0 && (
                      <div style={{
                        marginTop:8,
                        fontSize:12,
                        color:"#5E6C84",
                        paddingLeft:8
                      }}>
                        {(() => {
                          const latestItem = m.thinking[m.thinking.length - 1];
                          const text = typeof latestItem === 'string' ? latestItem : latestItem.text;
                          const timestamp = typeof latestItem === 'object' ? latestItem.timestamp : null;
                          
                          return (
                            <div style={{
                              display:"flex",
                              alignItems:"flex-start",
                              gap:8
                            }}>
                              {/* バレット ● */}
                              <div style={{
                                width:6,height:6,
                                borderRadius:"50%",
                                background:"#5E6C84",
                                marginTop:4,
                                flexShrink:0
                              }}/>
                              {/* メッセージ */}
                              <div style={{flex:1}}>
                                {timestamp && (
                                  <div style={{fontSize:10,color:"#8993A4",marginBottom:2}}>
                                    {new Date(timestamp).toLocaleTimeString('ja-JP')}
                                  </div>
                                )}
                                <div>{text}</div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <>{m.text}</>
                )}

                {/* エージェント情報 + もっと表示ボタン */}
                {m.agentName && !m.isProcessing && (
                  <div style={{
                    marginTop:8,
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"space-between"
                  }}>
                    <div style={{fontSize:11,color:"#6B778C"}}>
                      🤖 {m.agentName}
                    </div>
                    {m.thinking && m.thinking.length > 0 && (
                      <div onClick={()=>toggle(i)} style={{
                        display:"flex",
                        alignItems:"center",
                        cursor:"pointer",
                        userSelect:"none",
                        fontSize:11,
                        color:"#0052CC",
                        fontWeight:500
                      }}>
                        <span style={{marginRight:4}}>
                          {m.showThinking?"隠す":"もっと表示"}
                        </span>
                        <IconChevronDown
                          label=""
                          size="small"
                          primaryColor="#0052CC"
                          style={{
                            transform:m.showThinking?"rotate(180deg)":"rotate(0deg)",
                            transition:"transform .2s"
                          }}/>
                      </div>
                    )}
                  </div>
                )}

                {/* 展開領域：思考プロセス（完了後のみ） */}
                {!m.isProcessing && m.showThinking && (
                  <div style={{
                    marginTop:12,
                    fontSize:12,
                    color:"#5E6C84",
                    position:"relative",
                    paddingLeft:12
                  }}>
                    {/* dashed 縦ライン */}
                    <div style={{
                      position:"absolute",
                      left:3,
                      top:8,bottom:8,
                      borderLeft:"1px dashed #DFE1E6"
                    }}/>
                    {m.thinking.map((item,idx)=>{
                      // itemが文字列の場合とオブジェクトの場合に対応
                      const text = typeof item === 'string' ? item : item.text;
                      const timestamp = typeof item === 'object' ? item.timestamp : null;
                      const type = typeof item === 'object' ? item.type : null;
                      
                      return (
                        <div key={idx} style={{
                          display:"flex",
                          alignItems:"flex-start",
                          marginBottom:8
                        }}>
                          {/* バレット ● */}
                          <div style={{
                            width:12,display:"flex",justifyContent:"center"
                          }}>
                            <div style={{
                              width:6,height:6,
                              borderRadius:"50%",
                              background:"#5E6C84",
                              marginTop:4
                            }}/>
                          </div>
                          {/* メッセージ */}
                          <div style={{flex:1}}>
                            {timestamp && (
                              <div style={{fontSize:10,color:"#8993A4",marginBottom:2}}>
                                {new Date(timestamp).toLocaleTimeString('ja-JP')}
                              </div>
                            )}
                            <div>{text}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 入力エリア */}
      <div style={{marginTop:6,width:'100%'}}>
        <TextArea
          placeholder="質問を入力...（Ctrl+Enterで送信）"
          value={prompt}
          onChange={e=>setPrompt(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              send();
            }
          }}
          minimumRows={6}
          maxHeight={200}
          resize="vertical"
        />
        <div style={{display:"flex",gap:4,marginTop:4,justifyContent:"flex-end"}}>
          <Button 
            appearance="subtle"
            onClick={() => setShowSettings(true)}
            iconBefore={<IconSettings label="設定" size="small" />}
          />
          <Button 
            appearance="primary"
            onClick={send}
            isDisabled={loading}
          >
            送信
          </Button>
        </div>
      </div>
    </div>
  );
}
