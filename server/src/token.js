import crypto from 'crypto';

/**
 * 生成阿里云 RTC Token
 * @param {string} appId - 应用 ID
 * @param {string} appKey - 应用密钥
 * @param {string} channelId - 频道 ID（房间号）
 * @param {string} userId - 用户 ID
 * @param {number} timestamp - 时间戳（秒）
 * @param {number} nonce - 随机数
 * @returns {string} Token
 */
export function generateToken(appId, appKey, channelId, userId, timestamp, nonce) {
  // Token 有效期：24 小时
  const expireTime = timestamp + 24 * 3600;
  
  // 构建签名字符串
  const signString = `${appId}${appKey}${channelId}${userId}${timestamp}${nonce}${expireTime}`;
  
  // 使用 SHA256 生成签名
  const signature = crypto
    .createHash('sha256')
    .update(signString)
    .digest('hex');
  
  // 构建 Token
  const token = {
    appId,
    channelId,
    userId,
    timestamp,
    nonce,
    expireTime,
    signature
  };
  
  // 返回 Base64 编码的 Token
  return Buffer.from(JSON.stringify(token)).toString('base64');
}

/**
 * 生成随机 nonce
 */
export function generateNonce() {
  return Math.floor(Math.random() * 1000000).toString();
}
