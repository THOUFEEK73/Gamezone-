import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    type:{
        type:String,
        required:true,
        enum:['home','work','billing','shipping','other']

    },
    name:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true
    },
    street:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    state:{
        type:String,
        requried:true
    },
    zipCode:{
        type:String,
        required:true
    },
    country:{
        type:String,
        default:'INDIA'
    },
    isDefault:{
        type:Boolean,
        default:false
    }
},{timestamps:true});

// Middleware to ensure only one default address per user 

addressSchema.pre('save',async function(next){
      if (this.isDefault) {
    // Find all other addresses for this user and set their isDefault to false
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
  next();
})

const Address =  mongoose.model('Address',addressSchema);
export default Address;

