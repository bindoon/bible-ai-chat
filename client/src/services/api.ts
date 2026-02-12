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
    const response = await fetch(`${API_BASE_URL}/token`, {
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
 * 生成随机用户 ID
 */
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
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