
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
            default: []
        }]
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'GameCompany',
        required: true,
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
        enum: ['active', 'inactive'],
        default: 'active'
    },
    gameSeries: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GameSeries'
    }
}, { timestamps: true })

   gameSchema.pre('save',function(next){
    if (this.price) {
        this.price = parseFloat(this.price.toString().replace(/,/g, ''));
      }
    this.titleLower = this.title.toLowerCase();
    this.titleUpper = this.title.toUpperCase();
    next();
   })

// Check if the model exists before compiling it
const Game = mongoose.models.Game || mongoose.model('Game', gameSchema);
export default Game;
