import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRoomId, getUserNickname, setUserNickname } from '../services/api';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>('');
  const [showNicknameInput, setShowNicknameInput] = useState<boolean>(false);

  useEffect(() => {
    // 检查是否已有昵称
    const savedNickname = getUserNickname();
    if (savedNickname) {
      setNickname(savedNickname);
    } else {
      setShowNicknameInput(true);
    }
  }, []);

  const handleStartCall = () => {
    // 如果没有昵称，提示输入
    if (!nickname.trim()) {
      setShowNicknameInput(true);
      return;
    }
    
    setLoading(true);
    // 保存昵称
    setUserNickname(nickname.trim());
    // 生成房间 ID 并跳转
    const roomId = generateRoomId();
    navigate(`/room/${roomId}`);
  };

  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      setUserNickname(nickname.trim());
      setShowNicknameInput(false);
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">🎙️ 在线语音聊天</h1>
        <p className="home-description">
          点击按钮创建房间，复制链接分享给朋友即可开始通话
        </p>
        
        {showNicknameInput && (
          <form onSubmit={handleNicknameSubmit} className="nickname-form">
            <input
              type="text"
              placeholder="请输入你的昵称"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="nickname-input"
              autoFocus
            />
            <button 
              type="submit" 
              className="nickname-button"
              disabled={!nickname.trim()}
            >
              确认
            </button>
          </form>
        )}
        
        {!showNicknameInput && nickname && (
          <div className="nickname-display">
            <span>👤 {nickname}</span>
            <button 
              className="nickname-edit"
              onClick={() => setShowNicknameInput(true)}
            >
              修改
            </button>
          </div>
        )}
        
        <button 
          className="start-button"
          onClick={handleStartCall}
          disabled={loading || !nickname.trim()}
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