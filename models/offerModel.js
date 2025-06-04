import mongoose from "mongoose";

const OfferSchema = new mongoose.Schema({
    offerName: {
        type: String,
        required: [true, 'Offer name is required'],
        trim: true,
        minlength: [3, 'Offer name must be at least 3 characters']
    },
    offerType: {
        type: String,
        enum: ['product', 'category'],
        required: [true, 'Offer type is required']
    },
    discountPercentage: {
        type: Number,
        required: [true, 'Discount percentage is required'],
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%']
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
        // validate: {
        //     validator: function(value) {
        //         return value >= new Date();
        //     },
        //     message: 'Start date must be in the future'
        // }
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
        // validate: {
        //     validator: function(value) {
        //         return value > this.startDate;
        //     },
        //     message: 'End date must be after start date'
        // }
    },
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game',
        required: [true, 'At least one item is required']
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    isManuallyDeactivated: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // minimumPurchaseAmount: {
    //     type: Number,
    //     min: 0,
    //     default: 0
    // }
}, {
    timestamps: true
});

// Add virtual for checking if offer is currently valid
OfferSchema.virtual('isValid').get(function() {
    const now = new Date();
    return this.isActive && 
           !this.isManuallyDeactivated && 
           now >= this.startDate && 
           now <= this.endDate;
});

// Pre-save middleware to check dates
OfferSchema.pre('save', function(next) {
    const now = new Date();
    if (now > this.endDate) {
        this.isActive = false;
    }
    next();
});

const Offer = mongoose.model("Offer", OfferSchema);

export default Offer;