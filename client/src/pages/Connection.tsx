import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useRTC } from '../hooks/useRTC';
import './Connection.css';
import pastorHoman from '../assets/Pastor_Homan.jpg';
import pastorTim from '../assets/Pastor_Tim.jpg';
import pastorWong from '../assets/Pastor_Wong.jpg';

// --- Mock Data & Constants ---
const ROOM_ID = '000001';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3020';

const PASTORS = [
    { id: 'p1', name: 'Pastor Homan', role: 'Youth Ministry', avatar: pastorHoman, status: 'busy', type: 'image' },
    { id: 'p2', name: 'Pastor Tim', role: 'Family Counseling', avatar: pastorTim, status: 'busy', type: 'image' },
    { id: 'p3', name: 'Pastor Wong', role: 'Spiritual Formation', avatar: pastorWong, status: 'busy', type: 'image' },
    { id: 'p4', name: 'Pastor Mary', role: 'Career Counseling', avatar: '👩‍🎓', status: 'busy', type: 'emoji' },
    { id: 'p5', name: 'Pastor Paul', role: 'Community Outreach', avatar: '🧔', status: 'offline', type: 'emoji' },
    { id: 'p6', name: 'Pastor Anna', role: 'Kids Ministry', avatar: '👩‍🏫', status: 'offline', type: 'emoji' },
];

// --- Sub-component for Active Call ---
function ActiveSession({ onLeave, lang = 'en' }: { onLeave: () => void, lang?: 'en' | 'zh' }) {
    const { status, remoteUsers, isMuted, toggleMute, leave, currentUserName, updateNickname } = useRTC(ROOM_ID, false); // false = initial unmute
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(currentUserName);

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
        waiting: lang === 'en' ? 'Waiting for pastors...' : '等待牧師加入...',
        me: lang === 'en' ? 'Me' : '我',
        mute: lang === 'en' ? 'Mute' : '靜音',
        unmute: lang === 'en' ? 'Unmute' : '取消靜音',
        leave: lang === 'en' ? 'Leave' : '離開',
    };

    return (
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
                <button className="control-btn hangup" onClick={handleLeave}>
                    {t.leave}
                </button>
            </div>
        </div>
    );
}

// --- Main Page Component ---
export default function Connection() {
    const [joined, setJoined] = useState(false); // Require click to join
    const [stats, setStats] = useState({ visitors: 1200, messages: 0, emails: 0, activeUsers: 0 });
    const [lang, setLang] = useState<'en' | 'zh'>('en');
    const [form, setForm] = useState({ name: '', email: '', question: '' });
    const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    // const [showPrivacy, setShowPrivacy] = useState(false);
    const socketRef = useRef<any>(null);

    useEffect(() => {
        // Socket connection for stats
        socketRef.current = io(API_URL);

        socketRef.current.on('connect', () => {
            console.log('Connected to stats server');
            socketRef.current.emit('join-room', 'connection'); // Join stats room
        });

        socketRef.current.on('stats-update', (newStats: any) => {
            setStats(newStats);
        });

        // Initial fetch
        fetch(`${API_URL}/api/stats`)
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error('Failed to fetch stats:', err));

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
            const res = await fetch(`${API_URL}/api/contact`, {
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
        visitors: lang === 'en' ? 'Visitors' : '訪問人數',
        activePromise: lang === 'en' ? 'Praying Now' : '正在禱告',
        emails: lang === 'en' ? 'Prayer Requests' : '代禱請求',
        selectPastor: lang === 'en' ? 'Select a Pastor' : '選擇你想預約連線的牧師',
        privacyText: lang === 'en' ? 'We value your privacy. By using our site, you consent to our data processing policies.' : '我們重視您的隱私。使用本網站即表示您同意我們的數據處理政策。',
        acceptBtn: lang === 'en' ? 'Accept & Continue' : '接受並繼續',
    };

    return (
        <div className="connection-page">
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
                                    <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    p.avatar
                                )}
                            </div>
                            <div className="pastor-name">{p.name}</div>
                            <div className="pastor-role">{p.role}</div>
                            <div style={{ fontSize: '0.85rem', color: p.status === 'online' ? '#16a34a' : '#ef4444', marginTop: '0.5rem', fontWeight: 500 }}>• {p.status}</div>
                        </div>
                    ))}
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
