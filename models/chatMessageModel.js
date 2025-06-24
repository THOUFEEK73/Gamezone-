import mongoose  from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, default: 'Guest' },
  message: { type: String, required: true },
  sender: { type: String, enum: ['user', 'admin'], required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;