import React, { useState, useEffect } from 'react';
import { invoke, view } from '@forge/bridge';
import TextField from '@atlaskit/textfield';
import Button, { ButtonGroup } from '@atlaskit/button';
import Spinner from '@atlaskit/spinner';

export default function Edit({ onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [config, setConfig] = useState({
    A2A_AGENT_URL: '',
    DEV_TUNNEL_TOKEN: ''
  });
  const [errors, setErrors] = useState({});

  // 既存設定を読み込み
  useEffect(() => {
    view.getContext().then(context => {
      if (context.extension.gadgetConfiguration) {
        setConfig(context.extension.gadgetConfiguration);
      }
      setLoading(false);
    });
  }, []);

  // 接続テスト
  const validateConnection = async () => {
    setValidating(true);
    setValidationResult(null);
    
    try {
      const result = await invoke('validate-config', {
        url: config.A2A_AGENT_URL,
        token: config.DEV_TUNNEL_TOKEN
      });
      
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        valid: false,
        error: error.message
      });
    } finally {
      setValidating(false);
    }
  };

  // 保存
  const handleSave = async () => {
    // バリデーション
    const newErrors = {};
    if (!config.A2A_AGENT_URL || !config.A2A_AGENT_URL.trim()) {
      newErrors.A2A_AGENT_URL = 'URLを入力してください';
    } else if (!config.A2A_AGENT_URL.startsWith('http://') && !config.A2A_AGENT_URL.startsWith('https://')) {
      newErrors.A2A_AGENT_URL = 'URLはhttp://またはhttps://で始まる必要があります';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setSaving(true);
    setErrors({});
    
    try {
      const result = await invoke('edit-resolver', config);
      if (result.status === 'success') {
        alert('✅ 設定を保存しました');
        if (onSaved) onSaved();
      } else {
        alert('設定の保存に失敗しました: ' + result.message);
      }
    } catch (error) {
      alert(`エラー: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', width: '100%', boxSizing: 'border-box' }}>
      <h2 style={{ marginBottom: '8px' }}>接続設定</h2>
      <p style={{ color: '#6B778C', fontSize: '14px', marginBottom: '24px' }}>
        A2Aエージェントに接続するための設定を行います
      </p>

      {/* A2A Agent URL */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          A2A Agent URL <span style={{ color: '#DE350B' }}>*</span>
        </label>
        <TextField
          value={config.A2A_AGENT_URL}
          onChange={(e) => {
            setConfig({ ...config, A2A_AGENT_URL: e.target.value });
            setErrors({ ...errors, A2A_AGENT_URL: undefined });
            setValidationResult(null);
          }}
          placeholder="https://xxx-5000.asse.devtunnels.ms"
          autoComplete="off"
          style={{ width: '100%' }}
        />
        {errors.A2A_AGENT_URL && (
          <div style={{ color: '#DE350B', fontSize: '12px', marginTop: '4px' }}>
            {errors.A2A_AGENT_URL}
          </div>
        )}
      </div>

      {/* DevTunnel Token */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
          DevTunnel Token (オプション)
        </label>
        <TextField
          value={config.DEV_TUNNEL_TOKEN}
          onChange={(e) => {
            setConfig({ ...config, DEV_TUNNEL_TOKEN: e.target.value });
            setValidationResult(null);
          }}
          placeholder="your-tunnel-token"
          type="password"
          autoComplete="off"
          style={{ width: '100%' }}
        />
      </div>

      {/* 接続テストボタン */}
      <div style={{ marginBottom: '16px' }}>
        <Button
          appearance="default"
          onClick={validateConnection}
          isDisabled={validating || !config.A2A_AGENT_URL}
        >
          {validating ? (
            <>
              <Spinner size="small" /> 接続テスト中...
            </>
          ) : (
            '接続テスト'
          )}
        </Button>
      </div>

      {/* 検証結果 */}
      {validationResult && (
        <div style={{
          padding: '12px',
          marginBottom: '16px',
          borderRadius: '3px',
          backgroundColor: validationResult.valid ? '#E3FCEF' : '#FFEBE6',
          border: `1px solid ${validationResult.valid ? '#00875A' : '#DE350B'}`
        }}>
          {validationResult.valid ? (
            <>
              <div style={{ color: '#00875A', fontWeight: 600, marginBottom: '8px' }}>
                ✅ 接続成功
              </div>
              {validationResult.agentCard && (
                <div style={{ fontSize: '14px', color: '#172B4D' }}>
                  <div><strong>エージェント名:</strong> {validationResult.agentCard.name}</div>
                  <div><strong>説明:</strong> {validationResult.agentCard.description}</div>
                  <div>
                    <strong>ストリーミング対応:</strong>{' '}
                    {validationResult.agentCard.capabilities?.streaming ? '✅ はい' : '❌ いいえ'}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ color: '#DE350B' }}>
              ❌ 接続失敗: {validationResult.error}
            </div>
          )}
        </div>
      )}

      {/* アクションボタン */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <ButtonGroup>
          <Button
            appearance="primary"
            onClick={handleSave}
            isDisabled={saving || validating}
          >
            {saving ? (
              <>
                <Spinner size="small" /> 保存中...
              </>
            ) : (
              '保存'
            )}
          </Button>
          <Button
            appearance="subtle"
            onClick={() => onSaved && onSaved()}
            isDisabled={saving || validating}
          >
            キャンセル
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
