# Prestige AI Chatbot

A smart and friendly AI assistant powered by Groq LLaMA 3.3 70B, built with a cute white theme and deployed on Netlify.

## Live Demo

Deployed at: https://effulgent-medovik-038722.netlify.app

## Tech Stack

- **Backend**: Node.js, Express
- **AI Engine**: Groq (llama-3.3-70b-versatile)
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Deployment**: Netlify
- **Version Control**: GitHub

## Features

- Real-time AI responses powered by Groq
- Cute white and green friendly UI
- Image analysis support
- Voice chat support
- File upload support
- Conversation memory within session
- Supports Hindi, English and Hinglish
- Mobile responsive design
- Session management with auto-cleanup

## Project Structure

prestige-ai/
├── src/
│   └── server.js
├── public/
│   └── index.html
├── netlify/
│   └── functions/
│       └── api.js
├── .env.example
├── .gitignore
├── netlify.toml
├── package.json
└── README.md

## Environment Variables

| Variable | Description |
| --- | --- |
| GROQ_API_KEY | Your Groq API key from console.groq.com |
| BOT_NAME | Display name for the chatbot |
| SYSTEM_PROMPT | Custom personality prompt for the AI |

## Local Setup

git clone https://github.com/Bhadauria9z56/Prestige-Ai.git
cd Prestige-Ai
npm install
cp .env.example .env
npm start

*Built by Abhishek Kumar*
