const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: String,
    nfts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tokens' }],
    favouriteNfts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tokens' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
    followings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
    email: String,
    wallet: String,
    verified: Boolean,
    imgUrl: String,
    headerUrl: String,
    creationDate: {type: Date, default: Date.now()}
})

module.exports = userSchema