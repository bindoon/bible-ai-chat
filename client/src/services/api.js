/**
 * API 服务 - 调用后端接口
 */

const API_BASE_URL = '/api';

/**
 * 获取 RTC Token
 * @param {string} channelId - 房间 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} Token 信息
 */
export async function getToken(channelId, userId) {
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
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get token:', error);
    throw error;
  }
}

/**
 * 生成随机房间 ID（6 位数字）
 */
export function generateRoomId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 生成随机用户 ID
 */
export function generateUserId() {
  return `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * 获取完整的房间链接
 */
export function getRoomUrl(roomId) {
  return `${window.location.origin}/room/${roomId}`;
}
