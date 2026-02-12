import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoomUrl } from '../services/api';
import VoiceCall from '../components/VoiceCall';
import './Room.css';

function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(true);
  
  const roomUrl = getRoomUrl(roomId);

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

      <VoiceCall roomId={roomId} />
    </div>
  );
}

export default Room;
