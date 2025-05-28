import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    categoryName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    description: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  }, { timestamps: true });


const Category = mongoose.model('Category',categorySchema);
export default Category;

