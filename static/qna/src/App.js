import React, { useState, useRef, useEffect } from "react";
import { invoke } from "@forge/bridge";
import TextArea from "@atlaskit/textarea";
import Button   from "@atlaskit/button";
import Spinner  from "@atlaskit/spinner";
import IconChevronDown from "@atlaskit/icon/glyph/chevron-down";

export default function App() {
  /* ------------- state ------------- */
  const [prompt, setPrompt]   = useState("");
  const [msgs,   setMsgs]     = useState([]);
  const [loading, setLoading] = useState(false);
  const historyRef = useRef(null);

  /* 履歴を最下部へスクロール */
  useEffect(() => {
    if (historyRef.current)
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [msgs]);

  /* ---------- /result ポーリング ---------- */
  const poll = async (jobId, tries = 0) => {
    if (tries > 600) {                            // 10 min timeout
      setMsgs(m => m.map(msg =>
        msg.jobId === jobId
          ? { ...msg, text:"⚠️ タイムアウトしました", pending:false }
          : msg
      ));
      setLoading(false);
      return;
    }
    const { thinking, logs, answer, done } =
      await invoke("get-result", { jobId });

    setMsgs(m => m.map(msg =>
      msg.jobId === jobId
        ? { ...msg,
            text: done ? answer : (thinking || msg.text),
            logs,
            pending: !done }
        : msg
    ));

    if (done) setLoading(false);
    else      setTimeout(() => poll(jobId, tries + 1), 1_000);
  };

  /* ---------------- 送信 ---------------- */
  const send = async () => {
    if (!prompt.trim()) return;
    const userText = prompt;
    setPrompt("");
    setMsgs(m => [...m, { role:"user", text:userText }]);
    setLoading(true);

    const res = await invoke("main-resolver", { prompt:userText });
    if (res.status === "queued") {
      setMsgs(m => [...m, {
        role:"assistant",
        text:"",
        jobId:res.jobId,
        pending:true,
        logs:[],
        showThinking:false
      }]);
      poll(res.jobId);
    } else {
      setMsgs(m => [...m, { role:"assistant", text: res.message }]);
      setLoading(false);
    }
  };

  const toggle = idx =>
    setMsgs(m => m.map((msg,i) =>
      i===idx ? { ...msg, showThinking:!msg.showThinking } : msg
    ));

  /* ------------- render ------------- */
  return (
    <div style={{height:650,display:"flex",flexDirection:"column",padding:12,overflow:"hidden"}}>
      {/* 履歴 */}
      <div ref={historyRef} style={{flex:1,overflowY:"auto",paddingRight:4}}>
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
                {/* 本文／途中思考 */}
                {m.pending ? (
                  <>
                    <span style={{display:"inline-flex",alignItems:"center"}}>
                      考え中…
                      <Spinner size="small" style={{marginLeft:6}}/>
                    </span>
                    {m.text && (
                      <div style={{marginTop:4,color:"#6B778C",fontSize:13}}>
                        {m.text}
                      </div>
                    )}
                  </>
                ) : (
                  <>{m.text}</>
                )}

                {/* トグル */}
                {m.logs && m.logs.length>0 && (
                  <div onClick={()=>toggle(i)} style={{
                    position:"absolute",
                    bottom:6,right:8,
                    display:"flex",alignItems:"center",
                    cursor:"pointer",userSelect:"none"
                  }}>
                    <span style={{fontSize:11,color:"#8993A4",marginRight:4}}>
                      {m.showThinking?"隠す":"もっと表示"}
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

                {/* 展開領域：左寄せタイムライン */}
                {m.showThinking && (
                  <div style={{
                    marginTop:12,
                    fontSize:12,
                    color:"#5E6C84",
                    position:"relative",
                    paddingLeft:12          /* ←18→12 で左寄せ */
                  }}>
                    {/* dashed 縦ライン（バレット中心を通す） */}
                    <div style={{
                      position:"absolute",
                      left:3,                /* バレット中心 = 半径3 */
                      top:8,bottom:8,
                      borderLeft:"1px dashed #DFE1E6"
                    }}/>
                    {m.logs.map((line,idx)=>(
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

      {/* 入力バー */}
      <div style={{marginTop:6}}>
        <TextArea
          placeholder="質問を入力..."
          value={prompt}
          onChange={e=>setPrompt(e.target.value)}
          minimumRows={2}
          maxHeight={120}
          resize="vertical"
        />
        <Button appearance="primary"
                style={{width:"100%",marginTop:4}}
                onClick={send}
                isDisabled={loading}>
          送信
        </Button>
      </div>
    </div>
  );
}