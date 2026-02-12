import { useState, useEffect, useRef, useCallback } from 'react';
import DingRTC from 'dingrtc';
import { getToken, generateUserId, getUserNickname } from '../services/api';

// Define types for our RTC components
type RTCStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface RemoteUser {
  userId: string;
  userName: string;
}

interface TokenData {
  appId: string;
  token: string;
}

interface JoinOptions {
  appId: string;
  token: string;
  uid: string;
  channel: string;
  userName: string;
}

interface RTCClient {
  on(event: string, callback: Function): void;
  join(options: JoinOptions): Promise<any>;
  publish(tracks: any[]): Promise<void>;
  subscribe(stream: string, type: string): Promise<any>;
  leave(): void; // DingRTC's leave method returns void, not a Promise
}

interface AudioTrack {
  play(): void;
  close(): void;
  setEnabled(enabled: boolean): void;
}

export function useRTC(roomId: string) {
  const [status, setStatus] = useState<RTCStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  const clientRef = useRef<RTCClient | null>(null);
  const localStreamRef = useRef<AudioTrack | null>(null);
  const userIdRef = useRef<string>(generateUserId());
  const mcuSubscribedRef = useRef<boolean>(false);

  /**
   * 初始化 RTC 客户端
   */
  const initClient = useCallback(async () => {
    try {
      setStatus('connecting');
      setError(null);

      // 获取 Token
      const tokenData: TokenData = await getToken(roomId, userIdRef.current);
      console.log('Token obtained:', tokenData);
      
      // 1. 创建客户端实例
      const client: RTCClient = DingRTC.createClient();
      clientRef.current = client;
      
      // 2. 监听远端用户发布事件
      client.on('user-published', async (user: any, mediaType: string) => {
        console.log('Remote user published:', user.userId, mediaType);
        
        // 更新远端用户列表
        setRemoteUsers(prev => {
          const exists = prev.find(u => u.userId === user.userId);
          if (!exists) {
            return [...prev, { userId: user.userId, userName: user.userName }];
          }
          return prev;
        });
        
        // 订阅音频（使用 MCU 音频合流）
        if (mediaType === 'audio' && !mcuSubscribedRef.current) {
          try {
            mcuSubscribedRef.current = true;
            const track: AudioTrack = await client.subscribe('mcu', 'audio');
            console.log('Subscribed to MCU audio');
            track.play(); // 播放远端音频
          } catch (err: any) {
            console.error('Failed to subscribe MCU audio:', err);
            mcuSubscribedRef.current = false;
          }
        }
      });
      
      // 3. 监听远端用户离开事件
      client.on('user-unpublished', (user: any, mediaType: string) => {
        console.log('Remote user unpublished:', user.userId, mediaType);
        
        // 更新远端用户列表
        setRemoteUsers(prev => prev.filter(u => u.userId !== user.userId));
      });
      
      // 4. 监听错误事件（仅记录非致命错误）
      client.on('error', (err) => {
        console.error('RTC error:', err);
        // 只有在未连接时才设置错误状态，避免临时错误影响用户体验
        if (clientRef.current?.connectionState !== 'CONNECTED') {
          setError(err.message || '发生未知错误');
        }
      });
      
      // 5. 加入频道
      const userNickname = getUserNickname() || `用户_${userIdRef.current.slice(-4)}`;
      await client.join({
        appId: tokenData.appId,
        token: tokenData.token,
        uid: userIdRef.current,
        channel: roomId,
        userName: userNickname,
      });
      console.log('Joined channel successfully with nickname:', userNickname);
      
      // 6. 创建并发布本地音频轨道
      const micTrack: AudioTrack = await DingRTC.createMicrophoneAudioTrack();
      localStreamRef.current = micTrack;
      await client.publish([micTrack]);
      console.log('Published local audio');
            // 连接成功，清除之前的错误
      setError(null);      setStatus('connected');
    } catch (err: any) {
      console.error('Failed to init RTC:', err);
      setError(err.message || '连接失败');
      setStatus('error');
    }
  }, [roomId]);

  /**
   * 静音/取消静音
   */
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    
    try {
      // 使用 DingRTC 的 setEnabled 方法
      localStreamRef.current.setEnabled(!isMuted);
      setIsMuted(!isMuted);
      console.log(!isMuted ? 'Unmuted' : 'Muted');
    } catch (err: any) {
      console.error('Failed to toggle mute:', err);
    }
  }, [isMuted]);

  /**
   * 离开房间
   */
  const leave = useCallback(async () => {
    try {
      // 停止并关闭本地音频轨道
      if (localStreamRef.current) {
        localStreamRef.current.close();
        localStreamRef.current = null;
      }
      
      // 离开频道
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }
      
      mcuSubscribedRef.current = false;
      setStatus('idle');
      setRemoteUsers([]);
      console.log('Left room successfully');
    } catch (err: any) {
      console.error('Failed to leave room:', err);
    }
  }, []);

  // 组件挂载时初始化
  useEffect(() => {
    initClient();
    
    // 组件卸载时清理
    return () => {
      leave();
    };
  }, [initClient, leave]);

  return {
    status,
    error,
    remoteUsers,
    isMuted,
    toggleMute,
    leave,
  };
}