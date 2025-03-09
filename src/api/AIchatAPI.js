import OpenAI from "openai"

const client = OpenAI({
    apiKey: 'sk-1e067aeec49b4f10ad421a65d0835df8',
    baseURL: 'https://api.deepseek.com'
})

const messages = [{ "role": "user", "content": "What's the highest mountain in the world?" }]

const response = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: messages
})

console.log(response.choices[0].message)



