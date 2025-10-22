import React, { useState, useRef, useEffect } from "react";
import { invoke } from "@forge/bridge";
import TextArea from "@atlaskit/textarea";
import Button   from "@atlaskit/button";
import Spinner  from "@atlaskit/spinner";
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

  /* ---------------- 送信 ---------------- */
  const send = async () => {
    if (!prompt.trim()) return;
    const userText = prompt;
    setPrompt("");
    setMsgs(m => [...m, { role:"user", text:userText }]);
    setLoading(true);

    try {
      // A2Aプロトコルでメッセージ送信（同期処理）
      const res = await invoke("main-resolver", { prompt: userText });
      
      if (res.status === "completed") {
        // 成功時: 回答と思考プロセスを表示
        setMsgs(m => [...m, {
          role: "assistant",
          text: res.answer || "回答を取得できませんでした",
          thinking: res.thinking || [],
          showThinking: false,
          agentName: res.agentName,
          taskId: res.taskId
        }]);
      } else if (res.status === "error") {
        // エラー時
        setMsgs(m => [...m, {
          role: "assistant",
          text: res.message || "エラーが発生しました"
        }]);
      }
    } catch (error) {
      // 例外発生時
      setMsgs(m => [...m, {
        role: "assistant",
        text: `❌ エラー: ${error.message || "不明なエラー"}`
      }]);
    } finally {
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
                <>{m.text}</>

                {/* エージェント情報 */}
                {m.agentName && (
                  <div style={{marginTop:8,fontSize:11,color:"#6B778C"}}>
                    🤖 {m.agentName}
                  </div>
                )}

                {/* トグル */}
                {m.thinking && m.thinking.length>0 && (
                  <div onClick={()=>toggle(i)} style={{
                    position:"absolute",
                    bottom:6,right:8,
                    display:"flex",alignItems:"center",
                    cursor:"pointer",userSelect:"none"
                  }}>
                    <span style={{fontSize:11,color:"#8993A4",marginRight:4}}>
                      {m.showThinking?"隠す":"思考プロセス"}
                    </span>
                    <IconChevronDown
                      label=""
                      size="small"
                      primaryColor="#8993A4"
                      style={{
                        transform:m.showThinking?"rotate(180deg)":"rotate(0deg)",
                        transition:"transform .2s"
                      }}/>
                  </div>
                )}

                {/* 展開領域：思考プロセス */}
                {m.showThinking && (
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
                    {m.thinking.map((line,idx)=>(
                      <div key={idx} style={{
                        display:"flex",
                        alignItems:"flex-start",
                        marginBottom:6
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
                        <div style={{flex:1}}>{line}</div>
                      </div>
                    ))}
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
          placeholder="質問を入力... (Ctrl+Enterで送信)"
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
            {loading ? <Spinner size="small" /> : "送信"}
          </Button>
        </div>
      </div>
    </div>
  );
}
