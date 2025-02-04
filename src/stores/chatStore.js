import { defineStore } from 'pinia'

export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: [], // 存储所有对话
    currentConversationId: null, // 当前对话的ID
    hasActiveChat: false,
  }),
  
  getters: {
    currentConversation: (state) => {
      return state.conversations.find(conv => conv.id === state.currentConversationId) || null
    },
    
    currentMessages: (state) => {
      const conversation = state.conversations.find(conv => conv.id === state.currentConversationId)
      return conversation ? conversation.messages : []
    }
  },
  
  actions: {
    createNewConversation() {
      const newConversation = {
        id: Date.now().toString(),
        title: '新对话',
        messages: [{
          type: 'system',
          content: '你好！我是你的旅行助手，请问需要什么帮助？',
          isNew: true
        }],
        createdAt: new Date().toISOString()
      }
      
      this.conversations.unshift(newConversation)
      this.currentConversationId = newConversation.id
      this.hasActiveChat = true
      
      // 保持最多10个对话
      if (this.conversations.length > 10) {
        this.conversations = this.conversations.slice(0, 10)
      }
    },
    
    async addMessage(message) {
      const conversation = this.currentConversation;
      if (!conversation) return;
      
      try {
        // 先添加消息到UI
        conversation.messages.push({...message, status: 'sending'});
        
        // 发送消息到服务器
        await sendMessageAPI(message);
        
        // 更新消息状态
        const msgIndex = conversation.messages.findIndex(m => m.id === message.id);
        if (msgIndex !== -1) {
          conversation.messages[msgIndex].status = 'sent';
        }
      } catch (error) {
        // 处理发送失败
        const msgIndex = conversation.messages.findIndex(m => m.id === message.id);
        if (msgIndex !== -1) {
          conversation.messages[msgIndex].status = 'failed';
        }
        throw error;
      }
    },
    
    clearCurrentConversation() {
      if (this.currentConversationId) {
        const index = this.conversations.findIndex(conv => conv.id === this.currentConversationId)
        if (index !== -1) {
          this.conversations[index].messages = [{
            type: 'system',
            content: '你好！我是你的旅行助手，请问需要什么帮助？',
            isNew: true
          }]
        }
      }
    },
    
    switchConversation(conversationId) {
      this.currentConversationId = conversationId
      this.hasActiveChat = true
    },
    
    deleteConversation(conversationId) {
      const index = this.conversations.findIndex(conv => conv.id === conversationId)
      if (index !== -1) {
        this.conversations.splice(index, 1)
        if (conversationId === this.currentConversationId) {
          this.currentConversationId = this.conversations[0]?.id || null
          this.hasActiveChat = this.conversations.length > 0
        }
      }
    }
  }
}) 