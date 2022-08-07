const { default: mongoose } = require("mongoose");
const objectId = mongoose.Schema.Types.ObjectId

const schema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    imgUrl: {
        type: String
    },
    innerText: {
        type: String,
        required: true,
        max: 300
    },
    innerHtml: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    userId: {
        type: objectId,
        ref:"User",
        required: true
    },
    isPublished: {
        type: Boolean,
        default: true,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false,
        required: true
    }
}, {
    timestamps: true
});

module.exports.blogModel = mongoose.model('Blog', schema)