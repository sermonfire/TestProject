import { createRequest } from '@/utils/request';
import { DEEPSEEK_API_CONFIG } from '@/config/api.config';

// 系统提示词
const SYSTEM_PROMPT = `你是一个专业的旅行规划助手，擅长：
1. 根据用户的预算、时间、偏好推荐合适的旅行目的地
2. 提供详细的行程规划建议，包括交通、住宿、景点、美食等
3. 考虑季节性因素，推荐最佳旅行时间
4. 提供实用的旅行贴士，如必备物品、注意事项等
5. 根据不同旅行类型（如亲子游、蜜月游、摄影游等）定制建议

请用友好的语气与用户交流，给出具体且实用的建议。回答要条理清晰，重点突出。`;

// 创建专用的请求实例
const deepseekRequest = createRequest(DEEPSEEK_API_CONFIG);

// 发送聊天请求
export const sendChatMessage = async (messages) => {
  
  try {
    const messagesWithSystem = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];
    
    const response = await deepseekRequest({
      url: '/chat/completions',
      method: 'POST',
      timeout: 0,  // 显式设置为0，表示无超时限制
      data: {
        model: DEEPSEEK_API_CONFIG.model,
        messages: messagesWithSystem,
        temperature: DEEPSEEK_API_CONFIG.temperature,
        max_tokens: DEEPSEEK_API_CONFIG.max_tokens
      },
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_CONFIG.apiKey}`
      }
    });
    return response;
  } catch (error) {
    throw error;
  }
}; 