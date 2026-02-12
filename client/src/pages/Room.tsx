import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoomUrl, getUserNickname, setUserNickname } from '../services/api';
import VoiceCall from '../components/VoiceCall';
import './Room.css';

function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState<boolean>(false);
  const [showInvite, setShowInvite] = useState<boolean>(true);
  const [nickname, setNickname] = useState<string>('');
  const [needsNickname, setNeedsNickname] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  
  const roomUrl = getRoomUrl(roomId!);

  useEffect(() => {
    // 检查是否已有昵称
    const savedNickname = getUserNickname();
    if (savedNickname) {
      setNickname(savedNickname);
      setIsReady(true);
    } else {
      setNeedsNickname(true);
    }
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('复制失败，请手动复制链接');
    }
  };

  const handleLeave = () => {
    navigate('/');
  };

  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      setUserNickname(nickname.trim());
      setNeedsNickname(false);
      setIsReady(true);
    }
  };

  // 如果需要设置昵称，显示昵称输入界面
  if (needsNickname) {
    return (
      <div className="room-container">
        <div className="nickname-required-overlay">
          <div className="nickname-required-card">
            <h2>👋 欢迎加入房间</h2>
            <p>请先设置你的昵称</p>
            <form onSubmit={handleNicknameSubmit} className="nickname-form-full">
              <input
                type="text"
                placeholder="请输入你的昵称"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                className="nickname-input-full"
                autoFocus
              />
              <button 
                type="submit" 
                className="nickname-button-full"
                disabled={!nickname.trim()}
              >
                加入房间
              </button>
            </form>
            <button className="cancel-button" onClick={handleLeave}>
              取消
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 等待昵称准备好
  if (!isReady) {
    return null;
  }

  return (
    <div className="room-container">
      <div className="room-header">
        <h2 className="room-title">房间号: {roomId}</h2>
        <button className="leave-button" onClick={handleLeave}>
          离开房间
        </button>
      </div>

      {showInvite && (
        <div className="invite-card">
          <button 
            className="close-invite"
            onClick={() => setShowInvite(false)}
          >
            ×
          </button>
          <h3>邀请朋友加入通话</h3>
          <p className="invite-description">
            复制下方链接发送给朋友，对方点击即可加入
          </p>
          <div className="invite-link-container">
            <input 
              type="text" 
              value={roomUrl} 
              readOnly 
              className="invite-link-input"
            />
            <button 
              className="copy-button"
              onClick={handleCopyLink}
            >
              {copied ? '✓ 已复制' : '复制链接'}
            </button>
          </div>
        </div>
      )}

      <VoiceCall roomId={roomId!} />
    </div>
  );
}

export default Room;