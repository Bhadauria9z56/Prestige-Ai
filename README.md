# Bhadauriya AI Chatbot

A professional AI chatbot powered by Groq, deployed on Railway with a nature-inspired dashboard interface.

---

## Live Demo

Deployed at: `https://bhadauriya-ai-production.netlify.app`

---

## Tech Stack

- **Backend**: Node.js, Express
- **AI Engine**: Groq (llama-3.3-70b-versatile)
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Deployment**: Railway
- **Version Control**: GitHub

---

## Features

- Real-time AI responses powered by Groq
- Nature-inspired forest green UI
- Conversation memory within session
- Supports Hindi and English
- Mobile responsive design
- Session management with auto-cleanup

---

## Project Structure

```
bhadauriya-ai/
├── src/
│   └── server.js        # Express backend server
├── public/
│   └── index.html       # Frontend UI
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
├── railway.json         # Railway deployment config
└── README.md
```

---

## Local Setup

```bash
# Clone the repository
git clone https://github.com/Bhadauria9z56/Bhadauriya-Ai.git
cd Bhadauriya-Ai

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your Groq API key in .env
GROQ_API_KEY=your_key_here

# Start the server
npm start

# Open in browser
http://localhost:3000
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Your Groq API key from console.groq.com |
| `BOT_NAME` | Display name for the chatbot |
| `PORT` | Server port (Railway sets this automatically) |
| `SYSTEM_PROMPT` | Custom personality prompt for the AI |

---

## Deployment on Railway

1. Push code to GitHub
2. Go to railway.app and create a new project
3. Select "Deploy from GitHub repo"
4. Add environment variables in the Variables tab
5. Generate a domain under Settings > Networking
6. Done — the app is live

---

## Getting a Groq API Key

1. Go to console.groq.com
2. Create an API key
3. Copy and paste it into your .env file as `GROQ_API_KEY`

---

*Built by Bhadauria9z56*
