import { useState, useEffect, useRef, useCallback } from 'react';
import DingRTC from 'dingrtc';
import { getToken, generateUserId } from '../services/api';

/**
 * 阿里云 RTC Hook
 * 封装 RTC 连接、音频发布/订阅逻辑
 * 
 * 使用阿里云 DingRTC SDK
 * SDK 文档：https://help.aliyun.com/document_detail/2640100.html
 */
export function useRTC(roomId) {
  const [status, setStatus] = useState('idle'); // idle, connecting, connected, error
  const [error, setError] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  
  const clientRef = useRef(null);
  const localStreamRef = useRef(null);
  const userIdRef = useRef(generateUserId());
  const mcuSubscribedRef = useRef(false); // 标识是否已订阅 MCU 音频合流

  /**
   * 初始化 RTC 客户端
   */
  const initClient = useCallback(async () => {
    try {
      setStatus('connecting');
      setError(null);

      // 获取 Token
      const tokenData = await getToken(roomId, userIdRef.current);
      console.log('Token obtained:', tokenData);
      
      // 1. 创建客户端实例
      const client = DingRTC.createClient();
      clientRef.current = client;
      
      // 2. 监听远端用户发布事件
      client.on('user-published', async (user, mediaType) => {
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
            const track = await client.subscribe('mcu', 'audio');
            console.log('Subscribed to MCU audio');
            track.play(); // 播放远端音频
          } catch (err) {
            console.error('Failed to subscribe MCU audio:', err);
            mcuSubscribedRef.current = false;
          }
        }
      });
      
      // 3. 监听远端用户离开事件
      client.on('user-unpublished', (user, mediaType) => {
        console.log('Remote user unpublished:', user.userId, mediaType);
        
        // 更新远端用户列表
        setRemoteUsers(prev => prev.filter(u => u.userId !== user.userId));
      });
      
      // 4. 监听错误事件
      client.on('error', (err) => {
        console.error('RTC error:', err);
        setError(err.message || '发生未知错误');
      });
      
      // 5. 加入频道
      await client.join({
        appId: tokenData.appId,
        token: tokenData.token,
        uid: userIdRef.current,
        channel: roomId,
        userName: `用户_${userIdRef.current.slice(-4)}`, // 简单的用户名
      });
      console.log('Joined channel successfully');
      
      // 6. 创建并发布本地音频轨道
      const micTrack = await DingRTC.createMicrophoneAudioTrack();
      localStreamRef.current = micTrack;
      await client.publish([micTrack]);
      console.log('Published local audio');
      
      setStatus('connected');
    } catch (err) {
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
      localStreamRef.current.setEnabled(isMuted); // isMuted 为 true 时启用，false 时禁用
      setIsMuted(!isMuted);
      console.log(isMuted ? 'Unmuted' : 'Muted');
    } catch (err) {
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
    } catch (err) {
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
