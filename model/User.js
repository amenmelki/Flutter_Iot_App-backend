const mongoose = require("mongoose");
const schema = mongoose.Schema

const UserSchema = new schema(
    {
        name: { type: String },
        email: { type: String, Unique: true },
        password: { type: String },
        phone: { type: String },
        address: { type: String },
        token: { type: String },
        avatar:{type: String,default: " "},
        notif_id: { type: String, default: " " }
    }
)
module.exports = User = mongoose.model("users", UserSchema)