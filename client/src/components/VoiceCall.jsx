import { useRTC } from '../hooks/useRTC';
import './VoiceCall.css';

function VoiceCall({ roomId }) {
  const { status, error, remoteUsers, isMuted, toggleMute, leave } = useRTC(roomId);

  const getStatusText = () => {
    switch (status) {
      case 'connecting':
        return '正在连接...';
      case 'connected':
        return remoteUsers.length > 0 ? '通话中' : '等待对方加入...';
      case 'error':
        return '连接失败';
      default:
        return '初始化中...';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connecting':
        return '🔄';
      case 'connected':
        return remoteUsers.length > 0 ? '🎙️' : '⏳';
      case 'error':
        return '❌';
      default:
        return '🔄';
    }
  };

  return (
    <div className="voice-call-container">
      <div className="voice-call-card">
        <div className="status-section">
          <div className="status-icon">{getStatusIcon()}</div>
          <h2 className="status-text">{getStatusText()}</h2>
          {error && (
            <div className="error-message">
              <p>❌ 错误: {error}</p>
              <p className="error-hint">
                {error.includes('HTTPS') || error.includes('不支持') ? (
                  <>
                    <strong>⚠️ 安全限制：</strong>
                    <br />• 通过局域网 IP 访问需要 HTTPS 连接
                    <br />• 建议使用 <code>localhost:5173</code> 在本机测试
                    <br />• 或在同一设备上打开两个标签页测试
                    <br />• 生产环境请配置 HTTPS 证书
                  </>
                ) : (
                  <>
                    请检查：
                    <br />• 是否已配置阿里云 RTC AppID 和 AppKey
                    <br />• 浏览器是否允许麦克风权限
                    <br />• 网络连接是否正常
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {status === 'connected' && (
          <>
            <div className="participants-section">
              <h3>参与者</h3>
              <div className="participants-list">
                <div className="participant local">
                  <div className="participant-avatar">👤</div>
                  <div className="participant-info">
                    <span className="participant-name">你</span>
                    {isMuted && <span className="muted-badge">🔇</span>}
                  </div>
                </div>
                
                {remoteUsers.length === 0 ? (
                  <div className="waiting-message">
                    <p>等待对方加入...</p>
                    <p className="hint">分享房间链接给朋友吧</p>
                  </div>
                ) : (
                  remoteUsers.map((user) => (
                    <div key={user.userId} className="participant remote">
                      <div className="participant-avatar">👥</div>
                      <div className="participant-info">
                        <span className="participant-name">
                          {user.userName || `用户_${user.userId.slice(-4)}`}
                        </span>
                        <span className="connected-badge">🟢 已连接</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="controls-section">
              <button 
                className={`control-button ${isMuted ? 'muted' : ''}`}
                onClick={toggleMute}
                title={isMuted ? '取消静音' : '静音'}
              >
                {isMuted ? '🔇' : '🎤'}
                <span>{isMuted ? '取消静音' : '静音'}</span>
              </button>
              
              <button 
                className="control-button hangup"
                onClick={leave}
                title="挂断"
              >
                📞
                <span>挂断</span>
              </button>
            </div>
          </>
        )}

        {status === 'connecting' && (
          <div className="loading-section">
            <div className="spinner"></div>
            <p>正在连接到语音服务器...</p>
          </div>
        )}
      </div>

      <div className="info-card">
        <h4>💡 使用提示</h4>
        <ul>
          <li>首次使用需要允许浏览器访问麦克风</li>
          <li>建议使用耳机以避免回音</li>
          <li>网络不稳定可能导致掉线，请尝试刷新</li>
          <li>目前仅支持双人通话</li>
        </ul>
      </div>
    </div>
  );
}

export default VoiceCall;
