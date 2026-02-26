/**
 * API 服务 - 调用后端接口
 */

const API_BASE_URL = '/api';

export interface TokenData {
  appId: string;
  token: string;
}

/**
 * 获取 RTC Token
 * @param {string} channelId - 房间 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<TokenData>} Token 信息
 */
export async function getToken(channelId: string, userId: string): Promise<TokenData> {
  try {
    const response = await fetch(`${API_BASE_URL}/rtc/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channelId, userId }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: TokenData = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get token:', error);
    throw error;
  }
}

/**
 * 生成随机房间 ID（6 位数字）
 */
export function generateRoomId(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 生成或获取持久化的用户 ID（刷新页面保持不变）
 */
export function generateUserId(): string {
  const STORAGE_KEY = 'user_id';
  
  // 先尝试从 localStorage 获取已有的用户 ID
  let userId = localStorage.getItem(STORAGE_KEY);
  
  // 如果不存在，生成新的 ID 并保存
  if (!userId) {
    userId = `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    localStorage.setItem(STORAGE_KEY, userId);
    console.log('Generated new persistent userId:', userId);
  } else {
    console.log('Using existing userId from storage:', userId);
  }
  
  return userId;
}

/**
 * 获取完整的房间链接
 */
export function getRoomUrl(roomId: string): string {
  return `${window.location.origin}/room/${roomId}`;
}

/**
 * 获取用户昵称（从 localStorage）
 */
export function getUserNickname(): string | null {
  return localStorage.getItem('user_nickname');
}

/**
 * 设置用户昵称（保存到 localStorage）
 */
export function setUserNickname(nickname: string): void {
  localStorage.setItem('user_nickname', nickname);
}

/**
 * 清除用户身份信息（用于重置为新用户）
 */
export function clearUserIdentity(): void {
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_nickname');
  console.log('User identity cleared');
}