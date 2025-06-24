import ChatMessage from '../models/chatMessageModel.js';

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