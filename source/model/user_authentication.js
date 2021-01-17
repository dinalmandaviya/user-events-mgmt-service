const mongoose = require('mongoose')
const dbCon = require('../constants/dbCon')

const userAuthenticationSchema = new mongoose.Schema({
    user_code: {
        type: Number,
        required: true,
    },
    created_on: {
        type: Date,
        default: Date.now()
    },
    token: {
        type: String,
        required: true
    },
    expires_on: {
        type: Date,
        required: true
    }
}, {
    collection: dbCon.COLLECTION_USER_AUTHENTICATION
})

userAuthenticationSchema.plugin(global.db.autoIncrement.plugin, {
    model: dbCon.COLLECTION_USER_AUTHENTICATION,
    field: 'id',
    startAt: 1
})

module.exports = mongoose.model(dbCon.COLLECTION_USER_AUTHENTICATION, userAuthenticationSchema)