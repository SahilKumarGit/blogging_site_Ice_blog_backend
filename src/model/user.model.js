const { default: mongoose } = require("mongoose");
const objectId = mongoose.Schema.Types.ObjectId

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Invalid email address!"]
    },
    verified: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: true
    },
    following: {
        type: [objectId],
        ref: "User",
        default: []
    },
    follower: {
        type: [objectId],
        ref: "User",
        default: []
    },
    history: {
        type: [objectId],
        ref: "Blog",
        default: []
    },
    bookmarsk: {
        type: [objectId],
        ref: "Blog",
        default: []
    }
}, {
    timestamps: true
});

module.exports.userModel = mongoose.model('User', userSchema)