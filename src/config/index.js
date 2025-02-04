export default {
  development: {
    DEEPSEEK_API_ENDPOINT: 'https://api.deepseek.com/v1',
    DEEPSEEK_API_KEY: 'sk-0ae327bb6314460082fe215111b636db'
  },
  production: {
    DEEPSEEK_API_ENDPOINT: 'https://api.deepseek-ai.com/v1',
    DEEPSEEK_API_KEY: 'your_production_api_key'
  }
}[process.env.NODE_ENV || 'development']; 