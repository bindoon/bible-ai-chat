import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRoomId, getRoomUrl } from '../services/api';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleStartCall = () => {
    setLoading(true);
    // 生成房间 ID 并跳转
    const roomId = generateRoomId();
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">🎙️ 在线语音聊天</h1>
        <p className="home-description">
          点击按钮创建房间，复制链接分享给朋友即可开始通话
        </p>
        
        <button 
          className="start-button"
          onClick={handleStartCall}
          disabled={loading}
        >
          {loading ? '创建中...' : '开始通话'}
        </button>
        
        <div className="home-features">
          <div className="feature">
            <span className="feature-icon">🔒</span>
            <span className="feature-text">安全加密</span>
          </div>
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span className="feature-text">即时连接</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🌐</span>
            <span className="feature-text">全球可用</span>
          </div>
        </div>
        
        <div className="home-info">
          <p>💡 使用阿里云 RTC 技术提供稳定的语音通话服务</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
