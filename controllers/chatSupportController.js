import ChatMessage from '../models/chatMessageModel.js';
import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const getChatSupportPage = async (req, res) => {
    res.render('admin/chatSupport');
}



export const getChats = async (req, res) => {
    try {
    
        const messages = await ChatMessage.find({});
        res.json(messages);
      } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
      }
}


export const postChat = async (req, res) => {
    try {
    console.log("Saving chat message:", req.body);
      const msg = await ChatMessage.create(req.body);
      res.status(201).json(msg);
    } catch (err) {
      console.error('Error saving message:', err);
      res.status(500).json({ error: 'Failed to save message' });
    }
  };

  // async function callYourAI(message) {
  //   console.log('Calling AI with message:', message);
  //   // Replace this with your real AI integration (OpenAI, etc.)
  //   if (message.toLowerCase().includes('refund')) {
  //     return "I'm sorry, I can't help with refunds. Please talk to a human.";
  //   }
  //   return "This is an AI reply to: " + message;
  // }

  async function callYourAI(message) {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }]
    });
    return completion.choices[0].message.content;
  }

  export const api = async(req,res)=>{
    console.log('API called with body:', req.body);
    const { message, userId, userName } = req.body;
    // Call your AI service here
    const aiReply = await callYourAI(message);
    // Decide if escalation is needed
    const escalate = aiReply.includes("I can't help") || message.toLowerCase().includes("human");
    res.json({ reply: aiReply, escalate });
  }