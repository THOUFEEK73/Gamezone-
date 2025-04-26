 import mongoose from "mongoose";

const gameSeriesSchema = new mongoose.Schema({
    name: {
      type: String, // e.g., "Assassin's Creed"
      required: true,
      unique: true
    },
    description: String,
    coverImage: String // optional
  });
  
const gameSeries =  mongoose.model('GameSeries', gameSeriesSchema);

export default gameSeries;
  