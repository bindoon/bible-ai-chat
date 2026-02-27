import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useRTC } from '../hooks/useRTC';
import './Connection.css';
import pastorHoman from '../assets/Pastor_Homan.jpeg';
import pastorTim from '../assets/Pastor_Tim.jpeg';
import pastorWong from '../assets/Pastor_Wong.jpeg';
import pastorHuang from '../assets/Pastor_Huang.jpeg';

// --- Mock Data & Constants ---
const ROOM_ID = '000001';
const API_URL = import.meta.env.VITE_API_URL || '';

const PASTORS = [
  {
    id: 'p1',
    name: { en: 'Pastor Homan', zh: '何牧师' },
    role: { en: 'Youth Ministry', zh: '家庭 | 夫妻关系 | 情感关怀' },
    avatar: pastorHoman,
    status: 'busy',
    type: 'image',
    time: { en: '19:00-21:00', zh: '19:00-21:00' },
    date: { en: '26/02', zh: '26/02' },
    specialties: ['家庭', '夫妻关系', '情感关怀']
  },
  {
    id: 'p2',
    name: { en: 'Pastor Tim', zh: '提姆牧师' },
    role: { en: 'Family Counseling', zh: '夫妻关系 | 情感关怀 | 包容' },
    avatar: pastorTim,
    status: 'busy',
    type: 'image',
    time: { en: '18:00-20:00', zh: '18:00-20:00' },
    date: { en: '25/02', zh: '25/02' },
    specialties: ['夫妻关系', '情感关怀', '包容']
  },
  {
    id: 'p3',
    name: { en: 'Pastor Huang', zh: '黄牧师' },
    role: { en: 'Spiritual Formation', zh: '职场挑战 | 学业压力' },
    avatar: pastorHuang,
    status: 'busy',
    type: 'image',
    time: { en: '19:00-20:00', zh: '19:00-20:00' },
    date: { en: '29/02', zh: '29/02' },
    specialties: ['职场挑战', '学业压力']
  },
  {
    id: 'p4',
    name: { en: 'Pastor Wong', zh: '黄牧师' },
    role: { en: 'Spiritual Formation', zh: '前景未来 | 信教困惑' },
    avatar: pastorWong,
    status: 'busy',
    type: 'image',
    time: { en: '19:00-20:00', zh: '19:00-20:00' },
    date: { en: '29/02', zh: '29/02' },
    specialties: ['前景未来', '信教困惑']
  },
];

// Helper to get or create device ID
const getDeviceId = () => {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('deviceId', id);
  }
  return id;
};

// --- Invite Modal Component ---
function InviteModal({ onClose, lang = 'en' }: { onClose: () => void, lang?: 'en' | 'zh' }) {
  const inviteUrl = `https://jesuswithme.love/connection`;
  const copyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    alert(lang === 'en' ? 'Link copied!' : '链接已复制！');
  };

  const t = {
    title: lang === 'en' ? 'Invite Brothers and Sisters to Register and Connect' : '发个邀请 其他兄弟不用登录注册即可语音',
    copy: lang === 'en' ? 'Copy Link' : '邀 请',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content invite-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>{t.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem'}}>
        </div>
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', fontSize: '0.9rem', color: '#6366f1', wordBreak: 'break-all' }}>
          {inviteUrl}
        </div>
        <button className="submit-btn" onClick={copyInvite}>{t.copy}</button>
      </div>
    </div>
  );
}

// --- Like Topic Notification Modal ---
function LikeNotificationModal({ onClose, lang = 'en' }: { onClose: () => void, lang?: 'en' | 'zh' }) {
  const inviteUrl = `https://ttc.zhiyu.hk/connection`;
  const handleShare = () => {
    navigator.clipboard.writeText(inviteUrl);
    alert(lang === 'en' ? 'Link copied!' : '链接已复制！');
    onClose();
  };

  const t = {
    title: lang === 'en' ? 'Received Your Attention to This Topic' : '收到你对这个话题的关注',
    subtitle: lang === 'en' ? 'You can also forward this link to XXX, and we will help you connect with other pastors.' : '你也可以转发这个链接到XXX，帮你联系其他牧师与你语音',
    shareBtn: lang === 'en' ? 'Share' : '转 发',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3 style={{ marginBottom: '1rem', textAlign: 'center', fontSize: '1.1rem' }}>{t.title}</h3>
        <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.95rem', lineHeight: '1.6' }}>
          {t.subtitle}
        </p>
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', fontSize: '0.85rem', color: '#6366f1', wordBreak: 'break-all' }}>
          {inviteUrl}
        </div>
        <button className="submit-btn" onClick={handleShare} style={{ width: '100%' }}>
          {t.shareBtn}
        </button>
      </div>
    </div>
  );
}

// --- Sub-component for Active Call ---
function ActiveSession({ onLeave, lang = 'en' }: { onLeave: () => void, lang?: 'en' | 'zh' }) {
  const { status, remoteUsers, isMuted, toggleMute, leave, currentUserName, updateNickname } = useRTC(ROOM_ID, false); // false = initial unmute
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(currentUserName);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Update local state when hook provides initial username
  useEffect(() => {
    if (currentUserName && !newName) {
      setNewName(currentUserName);
    }
  }, [currentUserName]);

  const handleSaveName = () => {
    if (newName.trim()) {
      updateNickname(newName.trim());
      setIsEditingName(false);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup handled by useRTC
    };
  }, []);

  const handleLeave = () => {
    leave();
    onLeave();
  };

  const t = {
    connected: lang === 'en' ? 'Connected' : '已連接',
    connecting: lang === 'en' ? 'Connecting...' : '連接中...',
    waiting: lang === 'en' ? '"Help us share God\'s grace—invite a pastor to join us today." ' : '"牧師剛結束完連線，您可分享這份上帝的恩典到群組——讓大家邀請一位牧師與您連線。"',
    me: lang === 'en' ? 'Me' : '我',
    mute: lang === 'en' ? 'Mute' : '靜音',
    unmute: lang === 'en' ? 'Unmute' : '取消靜音',
    leave: lang === 'en' ? 'Leave' : '離開',
    invite: lang === 'en' ? 'Invite' : '邀请',
  };

  return (
    <>
      {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} lang={lang} />}
      <div className="glass-card active-session">
        <div className="session-header">
          <div className="status-indicator">
            <span className={`status-dot ${status}`}></span>
            {status === 'connected' ? t.connected : t.connecting}
          </div>
          <div className="timer">00:00</div>
        </div>

        <div className="participants-grid">
          {/* Local User */}
          <div className="participant-card local glass-panel">
            <div className="participant-avatar-large">👤</div>

            {isEditingName ? (
              <div className="name-edit-container">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="name-edit-input"
                  autoFocus
                />
                <button onClick={handleSaveName} className="name-save-btn">✓</button>
              </div>
            ) : (
              <div className="name-display-container">
                <p className="participant-name">{currentUserName || t.me}</p>
                <button onClick={() => {
                  setNewName(currentUserName);
                  setIsEditingName(true);
                }} className="name-edit-btn">✎</button>
              </div>
            )}

            <div className="mic-status-indicator">
              {isMuted ? <span className="status-badge muted">🔇 {t.mute}</span> : <span className="status-badge active">🎙️ On Air</span>}
            </div>
          </div>

          {/* Remote Users */}
          {remoteUsers.map(user => (
            <div key={user.userId} className="participant-card remote">
              <div className="participant-avatar-large">👥</div>
              <p>{user.userName}</p>
              <div className="mic-status">🎙️</div>
            </div>
          ))}

          {remoteUsers.length === 0 && status === 'connected' && (
            <div className="waiting-placeholder">
              <p>{t.waiting}</p>
            </div>
          )}
        </div>

        <div className="session-controls">
          <button className={`control-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute}>
            {isMuted ? t.unmute : t.mute}
          </button>
          <button className="control-btn" onClick={() => setShowInviteModal(true)}>
            {t.invite}
          </button>
          <button className="control-btn hangup" onClick={handleLeave}>
            {t.leave}
          </button>
        </div>
      </div>
    </>
  );
}

// --- Main Page Component ---
export default function Connection() {
  const [joined, setJoined] = useState(false); // Require click to join
  const [stats, setStats] = useState({ visitors: 1200, messages: 0, emails: 0, activeUsers: 0, pv: 0 });
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [form, setForm] = useState({ name: '', email: '', question: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [topics, setTopics] = useState<any[]>([]);
  const [showLikeNotification, setShowLikeNotification] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [topicSubmitStatus, setTopicSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  // const [showPrivacy, setShowPrivacy] = useState(false);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // Socket connection for stats
    socketRef.current = io(API_URL, { path: '/api/rtc/socket.io' });

    socketRef.current.on('connect', () => {
      console.log('Connected to stats server');
      const deviceId = getDeviceId();
      socketRef.current.emit('join-room', 'connection', deviceId); // Join stats room with deviceId
    });

    socketRef.current.on('stats-update', (newStats: any) => {
      setStats(newStats);
    });

    // Initial fetch
    fetch(`${API_URL}/api/rtc/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to fetch stats:', err));

    // Fetch hot topics
    fetch(`${API_URL}/api/rtc/topics`)
      .then(res => res.json())
      .then(data => setTopics(data.topics || []))
      .catch(err => console.error('Failed to fetch topics:', err));

    // Check privacy consent
    const consented = localStorage.getItem('privacy_consented');
    if (!consented) {
      // setShowPrivacy(true);
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const handleJoin = () => {
    setJoined(true);
    // Trigger "visitor" stat increment if not already counted by socket join
    // But socket join logic in server already handles 'visitors' increment for '000001'
    // We might want to separate "View Page" vs "Join Call".
    // For now, server increments on socket join room.
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');
    try {
      const res = await fetch(`${API_URL}/api/rtc/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setFormStatus('success');
        setForm({ name: '', email: '', question: '' });
      } else {
        setFormStatus('error');
      }
    } catch (err) {
      setFormStatus('error');
    }
  };

  const handleLikeTopic = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/rtc/topics/${id}/like`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics || []);
        // Show notification after successful like
        setShowLikeNotification(true);
      }
    } catch (err) {
      console.error('Failed to like topic:', err);
    }
  };

  const handleSubmitTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    setTopicSubmitStatus('submitting');
    try {
      const res = await fetch(`${API_URL}/api/rtc/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: newTopic })
      });
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics || []);
        setNewTopic('');
        setTopicSubmitStatus('success');
        setTimeout(() => setTopicSubmitStatus('idle'), 2000);
      } else {
        setTopicSubmitStatus('error');
        setTimeout(() => setTopicSubmitStatus('idle'), 2000);
      }
    } catch (err) {
      console.error('Failed to submit topic:', err);
      setTopicSubmitStatus('error');
      setTimeout(() => setTopicSubmitStatus('idle'), 2000);
    }
  };

  const t = {
    title: lang === 'en' ? 'Connecting the World through Grace, Shepherding Souls into Peace.' : '以大愛連結世界，為靈魂搭建避風港。',
    subtitle: lang === 'en'
      ? 'We bridge the gap between global pastoral care and your daily struggles. Here, we carry your burdens together, offering spiritual wisdom and compassionate listening to illuminate your path.'
      : '我們匯聚全球牧者的慈愛與智慧，致力於消除心靈的隔閡。無論您身在何處，這裡都有願意傾聽的耳朵與為您禱告的心，助您卸下重擔，重獲屬天的平安。',
    joinBtn: lang === 'en' ? 'Connect Now' : '立即連線',
    leaveInfo: lang === 'en' ? 'Leave your email, and the pastor will notify you as soon as they become available.' : '留下你的郵箱，牧師方便了第一時間通知你。',
    namePlaceholder: lang === 'en' ? 'Your Name' : '你的名字',
    emailPlaceholder: lang === 'en' ? 'Your Email' : '你的郵箱',
    questionPlaceholder: lang === 'en' ? 'Your Question' : '你想諮詢的問題',
    submitBtn: lang === 'en' ? 'Contact Pastor' : '預約牧師',
    visitors: lang === 'en' ? 'Total Users' : '總用戶數',
    pv: lang === 'en' ? 'Page Views' : '總訪問量',
    activePromise: lang === 'en' ? 'Active Users' : '當前在線',
    emails: lang === 'en' ? 'Prayer Requests' : '代禱請求',
    selectPastor: lang === 'en' ? 'Select a Pastor' : '選擇你想預約連線的牧師',
    privacyText: lang === 'en' ? 'We value your privacy. By using our site, you consent to our data processing policies.' : '我們重視您的隱私。使用本網站即表示您同意我們的數據處理政策。',
    acceptBtn: lang === 'en' ? 'Accept & Continue' : '接受並繼續',
    hotTopicsTitle: lang === 'en' ? 'Hot Topics' : '热门话题',
    hotTopicsSubtitle: lang === 'en' ? 'I will compile your concerns and invite qualified pastors to answer them.' : '我们将最受大家关切的话题，邀请和配给合适的牧师来给大家解答。',
    submitTopicPlaceholder: lang === 'en' ? 'Describe the topic you are interested in, the more people, the more likely to invite qualified pastors to connect and answer you.' : '描述你关注的话题，认可人数多，将邀请适合的牧师来与你语音和解答。',
    submitTopicBtn: lang === 'en' ? 'Submit' : '提交',
    viewAllBtn: lang === 'en' ? 'View All' : '查看全部',
    collapseBtn: lang === 'en' ? 'Collapse' : '收起',
  };

  return (
    <div className="connection-page">
      {showLikeNotification && <LikeNotificationModal onClose={() => setShowLikeNotification(false)} lang={lang} />}

      <header className="connection-header">
        {/* Room ID removed as requested */}
        <div className="logo-area">
          {/* Placeholder for Logo if needed */}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert(lang === 'en' ? 'Link copied!' : '链接已复制！');
          }} className="leave-btn">
            {lang === 'en' ? 'Share' : '分享'}
          </button>
          <button onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')} className="leave-btn">
            {lang === 'en' ? '繁體中文' : 'English'}
          </button>
        </div>
      </header>

      <div className="main-content">
        <div className="hero-text">
          <h1 className="hero-title">{t.title}</h1>
          <p className="hero-subtitle">{t.subtitle}</p>
        </div>

        {!joined ? (
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🙏</div>
            <button className="submit-btn" style={{ maxWidth: '300px' }} onClick={handleJoin}>{t.joinBtn}</button>
          </div>
        ) : (
          <ActiveSession onLeave={() => setJoined(false)} lang={lang} />
        )}

        {/* Pastors Section */}
        <h3 className="section-title">
          {t.selectPastor}
        </h3>
        <div className="pastors-grid">
          {PASTORS.map(p => (
            <div key={p.id} className="pastor-card">
              <div className="pastor-avatar">
                {p.type === 'image' ? (
                  <img src={p.avatar} alt={typeof p.name === 'string' ? p.name : p.name[lang]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  p.avatar
                )}
              </div>
              <div className="pastor-time" style={{ fontSize: '0.9rem', color: '#6366f1', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span>🕐</span>
                {typeof p.time === 'string' ? p.time : p.time[lang]}
                <span style={{ marginLeft: '0.3rem' }}>{typeof p.date === 'string' ? p.date : p.date[lang]}</span>
              </div>
              <div className="pastor-specialties" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                {p.specialties?.map((tag, i) => (
                  <span key={i} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', borderRadius: '4px' }}>
                    #{tag}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', fontStyle: 'italic' }}>
                {typeof p.role === 'string' ? p.role : p.role[lang]}
              </p>
            </div>
          ))}
        </div>

        {/* Hot Topics Section */}
        <div className="hot-topics-section glass-card" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{t.hotTopicsTitle}</h3>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>{t.hotTopicsSubtitle}</p>

          <div className="topics-list-container" style={{
            maxHeight: showAllTopics ? 'none' : '400px',
            overflowY: showAllTopics ? 'visible' : 'auto',
            marginBottom: '1rem',
            paddingRight: '0.5rem'
          }}>
            <div className="topics-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(showAllTopics ? topics : topics.slice(0, 3)).map((topic) => (
                <div key={topic.id} className="topic-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '2rem' }}>👤</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ marginBottom: '0.5rem' }}>{topic.text}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    <button
                      onClick={() => handleLikeTopic(topic.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}
                    >
                      👍
                    </button>
                    <span style={{ fontSize: '0.9rem', color: '#6366f1', fontWeight: 'bold' }}>{topic.likes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {topics.length > 3 && (
            <button
              onClick={() => setShowAllTopics(!showAllTopics)}
              className="leave-btn"
              style={{ marginBottom: '1.5rem', width: '100%' }}
            >
              {showAllTopics ? t.collapseBtn : t.viewAllBtn}
            </button>
          )}

          {/* Topic Submission Form */}
          <form onSubmit={handleSubmitTopic} style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <input
                className="form-input"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder={t.submitTopicPlaceholder}
                style={{ flex: 1 }}
                disabled={topicSubmitStatus === 'submitting'}
              />
              <button
                type="submit"
                className="submit-btn"
                style={{
                  padding: '0.8rem 2rem',
                  minWidth: 'auto',
                  opacity: topicSubmitStatus === 'submitting' ? 0.6 : 1
                }}
                disabled={topicSubmitStatus === 'submitting' || !newTopic.trim()}
              >
                {topicSubmitStatus === 'submitting' ? '...' : t.submitTopicBtn}
              </button>
            </div>
            {topicSubmitStatus === 'success' && (
              <p style={{ marginTop: '0.5rem', color: '#16a34a', fontSize: '0.9rem' }}>
                {lang === 'en' ? 'Topic submitted successfully!' : '话题提交成功！'}
              </p>
            )}
            {topicSubmitStatus === 'error' && (
              <p style={{ marginTop: '0.5rem', color: '#ef4444', fontSize: '0.9rem' }}>
                {lang === 'en' ? 'Failed to submit topic. Please try again.' : '话题提交失败，请重试。'}
              </p>
            )}
          </form>
        </div>

        {/* Contact Form */}
        <div className="contact-section glass-card">
          <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>{t.leaveInfo}</h3>

          {formStatus === 'success' ? (
            <div style={{ textAlign: 'center', color: '#16a34a', padding: '2rem' }}>
              <div style={{ fontSize: '3rem' }}>✓</div>
              <p>{lang === 'en' ? 'Thank you! We have received your request.' : '謝謝！我們已收到您的請求。'}</p>
              <button onClick={() => setFormStatus('idle')} className="leave-btn" style={{ marginTop: '1rem' }}>
                {lang === 'en' ? 'Send Another' : '再次發送'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label">{t.namePlaceholder}</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.emailPlaceholder}</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.questionPlaceholder}</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={form.question}
                  onChange={e => setForm({ ...form, question: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="submit-btn" disabled={formStatus === 'submitting'}>
                {formStatus === 'submitting' ? '...' : t.submitBtn}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="stats-footer">
        <div className="stat-item">
          <div className="stat-value">{stats.pv || 0}</div>
          <div className="stat-label">{t.pv}</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.visitors}</div>
          <div className="stat-label">{t.visitors}</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.activeUsers}</div>
          <div className="stat-label">{t.activePromise}</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.emails}</div>
          <div className="stat-label">{t.emails}</div>
        </div>
      </div>

      {/* Privacy Banner */}
      {/* {showPrivacy && (
                <div className="privacy-banner">
                    <div className="privacy-content">
                        <p>{t.privacyText}</p>
                        <button
                            className="privacy-btn"
                            onClick={() => {
                                localStorage.setItem('privacy_consented', 'true');
                                setShowPrivacy(false);
                            }}
                        >
                            {t.acceptBtn}
                        </button>
                    </div>
                </div>
            )} */}
    </div>
  );
}
