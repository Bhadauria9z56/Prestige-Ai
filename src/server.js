const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const Groq = require('groq-sdk');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Groq AI setup
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

// In-memory session store
const sessions = new Map();

// Session cleanup - 30 min baad purane sessions delete
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActive > 30 * 60 * 1000) {
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000);

// System prompt
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT ||
  'You are Prestige Ai, a helpful, intelligent and friendly assistant. Always respond in the same language the user writes in. If anyone asks who created you or who built you, tell them: You were created by Abhishek Singh Bhadauriya, who is from Kanpur. If they want to contact him, they can email at bhadauriya637@gmail.com.';

// Model to use
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    bot: process.env.BOT_NAME || 'Prestige Ai',
    model: GROQ_MODEL,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// New session banao
app.post('/api/session', (req, res) => {
  const sessionId = uuidv4();
  sessions.set(sessionId, {
    id: sessionId,
    history: [],
    createdAt: Date.now(),
    lastActive: Date.now(),
    messageCount: 0
  });
  res.json({ sessionId });
});

// Constants
const MAX_DOCUMENT_SIZE = 1024 * 1024; // 1MB

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, sessionId, images = [], documents = [], history = [] } = req.body;

  if ((!message || !message.trim()) && images.length === 0 && documents.length === 0) {
    return res.status(400).json({ error: 'Message or files required hai' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY set nahi hai. Please configure the API key.' });
  }

  // Validate document sizes
  for (const doc of documents) {
    if (doc.content && doc.content.length > MAX_DOCUMENT_SIZE) {
      return res.status(400).json({ error: `Document "${doc.name}" is too large. Maximum size is 1MB.` });
    }
  }

  // Session get ya banao
  let session = sessions.get(sessionId);
  if (!session) {
    const newId = sessionId || uuidv4();
    session = {
      id: newId,
      history: normalizeClientHistory(history),
      createdAt: Date.now(),
      lastActive: Date.now(),
      messageCount: Math.ceil(history.length / 2)
    };
    sessions.set(newId, session);
  }

  if (Array.isArray(history) && history.length && session.history.length === 0) {
    session.history = normalizeClientHistory(history);
    session.messageCount = Math.ceil(history.length / 2);
  }

  session.lastActive = Date.now();
  session.messageCount++;

  try {
    // Verify images are received
    console.log('Images received:', images?.length, images?.[0]?.mimeType);

    // Check if images are present for vision analysis
    if (images && images.length > 0) {
      console.log('Using vision model for images');
      
      const imageContents = [];
      
      if (message && message.trim()) {
        imageContents.push({ type: 'text', text: message.trim() });
      } else {
        imageContents.push({ type: 'text', text: 'Please describe this image in detail.' });
      }
      
      for (const img of images) {
        let base64 = img.data || '';
        if (base64.includes(',')) {
          base64 = base64.split(',')[1];
        }
        imageContents.push({
          type: 'image_url',
          image_url: {
            url: `data:${img.mimeType};base64,${base64}`
          }
        });
      }
      
      const visionCompletion = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: imageContents }
        ],
        max_tokens: 1024,
      });
      
      const responseText = visionCompletion.choices[0].message.content;
      
      session.history.push(
        { role: 'user', parts: [{ text: message || '[image]' }] },
        { role: 'model', parts: [{ text: responseText }] }
      );
      
      return res.json({
        reply: responseText,
        sessionId: session.id,
        messageCount: session.messageCount
      });
    }

    // Original logic for text/documents only
    let groqMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...session.history.map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts.map(p => p.text).join('\n')
      }))
    ];

    // Current message build karo
    const messageParts = [];

    if (message && message.trim()) {
      messageParts.push({ text: message.trim() });
    }

    if (documents && documents.length > 0) {
      for (const doc of documents) {
        if (doc.content) {
          messageParts.push({ text: `[Document: ${doc.name || 'Unnamed'}]\n${doc.content}` });
        }
      }
    }

    if (messageParts.length === 0) {
      return res.status(400).json({ error: 'No valid content to send' });
    }

    const currentContent = messageParts.map(p => p.text).join('\n');
    groqMessages.push({ role: 'user', content: currentContent });

    const completion = await groq.chat.completions.create({
      messages: groqMessages,
      model: GROQ_MODEL,
      max_tokens: 2048,
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content;

    // History update karo
    const userHistoryParts = [];
    if (message && message.trim()) {
      userHistoryParts.push({ text: message.trim() });
    }
    if (documents && documents.length > 0) {
      userHistoryParts.push({ text: `[User sent ${documents.length} document(s)]` });
    }

    session.history.push(
      { role: 'user', parts: userHistoryParts },
      { role: 'model', parts: [{ text: responseText }] }
    );

    // Max 6 turns history rakho
    if (session.history.length > 6) {
      session.history = session.history.slice(-6);
    }

    res.json({
      reply: responseText,
      sessionId: session.id,
      messageCount: session.messageCount
    });

  } catch (error) {
    console.error('Groq API Error:', error.message);

    if (error.message?.includes('401') || error.message?.includes('API key')) {
      return res.status(401).json({ error: 'Groq API key invalid hai. Please check Netlify env variables.' });
    }
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }

    res.status(500).json({ error: `Server error: ${error.message}` });
  }
});

function normalizeClientHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter(item => item && ['user', 'model'].includes(item.role) && typeof item.text === 'string' && item.text.trim())
    .slice(-6)
    .map(item => ({
      role: item.role,
      parts: [{ text: item.text.trim() }]
    }));
}

// Clear session
app.delete('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  if (sessions.has(sessionId)) {
    sessions.delete(sessionId);
    res.json({ success: true, message: 'Session cleared' });
  } else {
    res.json({ success: true, message: 'Session not found' });
  }
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  res.json({
    activeSessions: sessions.size,
    uptime: Math.floor(process.uptime()),
    botName: process.env.BOT_NAME || 'Prestige Ai',
    model: GROQ_MODEL
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Prestige Ai running on port ${PORT} | Model: ${GROQ_MODEL}`);
});
