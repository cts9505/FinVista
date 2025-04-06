// server/routes/aiChatRoutes.js

import express from 'express';
import { chatWithAI, getAIChatSuggestions } from '../controllers/aiChatController.js';

import userAuth from '../middleware/userAuth.js';
import { getUserData } from '../controllers/usercontroller.js';
const Chatrouter = express.Router();

// Chat with AI
Chatrouter.post('/chat', userAuth, chatWithAI);

// Get AI chat suggestions
Chatrouter.get('/suggestions', userAuth, getAIChatSuggestions);

export default Chatrouter;