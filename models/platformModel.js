import mongoose  from "mongoose";

const platformSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        unique :true,
    }
})

const platform = mongoose.model('plaform',platformSchema);

export default platform;