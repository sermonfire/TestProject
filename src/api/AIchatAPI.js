/**
 * @file AIchatAPI.js
 * @description AI聊天相关的API接口封装
 */

import request from '@/utils/request'

/**
 * 获取对话历史列表
 * @returns {Promise} 返回对话历史数据
 */
export function getChatHistory() {
    return request({
        url: 'dev-api/ai/chat/history',
        method: 'get'
    })
}

/**
 * 发送流式对话请求
 * @param {Object} data 请求参数
 * @param {string} data.content - 用户发送的消息内容
 * @param {string} data.conversationId - 会话ID
 * @returns {Promise} 返回流式响应
 */
export function sendStreamChat(data) {
    return request({
        url: `/dev-api/ai/chat/stream/deepseek?message=${data.content}&conversationId=${data.conversationId}`,
        method: 'GET',
    })
}

/**
 * 删除对话
 * @param {string} conversationId - 会话ID
 * @returns {Promise} 返回删除结果
 */
export function deleteConversation(conversationId) {
    return request({
        url: `/dev-api/ai/chat/history/${conversationId}`,
        method: 'DELETE'
    })
}

//获取自动行程规划
export function getAItripGenerateAPI(data) {
    return request({
        url: `/dev-api/ai/chat/json`,
        method: 'POST',
        data: data,
    })
}






