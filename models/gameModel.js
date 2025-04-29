import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    media: {
        coverImage: {
            type: String,
            required: true
        },
        screenshots: [{
            type: String,
            required: true,
            default:[],
        }]
    },
    platforms: {
        type: [String],
        required: true,
        defualt:[],
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    description: {
        type: String,
        required: true
    },
    releaseDate: {
        type: Date,
        required: true
    },
    stockQuantity: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        required: true,
        enum: ['available', 'outofstock', 'comingsoon'],
        default: 'available'
    },
    gameSeries: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GameSeries'
    }
},{timestamps:true});

const Game = mongoose.model('Game', gameSchema);
export default Game;
