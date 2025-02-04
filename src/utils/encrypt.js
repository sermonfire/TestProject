// 在工具类文件 utils/encrypt.js 中
import CryptoJS from 'crypto-js'

// 使用固定的密钥字符串（注意：实际生产环境建议使用更安全的方式存储密钥）
const SECRET_KEY = 'TravelRec_SecretKey_2024';

export const encryptPassword = (password) => {
  // 确保输入是字符串类型
  const textToEncrypt = String(password);
  return CryptoJS.AES.encrypt(textToEncrypt, SECRET_KEY).toString();
}

export const decryptPassword = (encrypted) => {
  try {
    // 添加错误处理
    if (!encrypted) {
      return '';
    }
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('解密失败:', error);
    return '';
  }
}