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
    
    addMessage(message) {
      const conversation = this.currentConversation
      if (!conversation) return
      
      conversation.messages.push(message)
      // 根据消息内容更新对话标题
      if (message.type === 'user' && conversation.title === '新对话') {
        conversation.title = message.content.slice(0, 20) + (message.content.length > 20 ? '...' : '')
      }
      
      // 保持最多10条消息
      if (conversation.messages.length > 10) {
        conversation.messages = conversation.messages.slice(-10)
      }
      
      this.hasActiveChat = true
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