const mongoose = require('mongoose')
const dbCon = require('../constants/dbCon')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        max: 255,
        min: 3
    },
    email: {
        type: String,
        required: true,
        max: 255,
        min: 6
    },
    password: {
        type: String,
        required: true,
        max: 1024,
        min: 6
    },
    date: {
        type: Date,
        default: Date.now()
    }
}, {
    collection: dbCon.COLLECTION_USER
})
userSchema.plugin(global.db.autoIncrement.plugin, {
    model: dbCon.COLLECTION_USER,
    field: 'userId',
    startAt: 1
})
module.exports = global.db.connection.model(dbCon.COLLECTION_USER, userSchema)
