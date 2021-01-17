const mongoose = require('mongoose')
const dbCon = require('../constants/dbCon')

const eventSchema = new mongoose.Schema({
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
    user_code: {
        type: Number,
        required: true,
    },
    status: {
        type: Number
    },
    created_date: {
        type: Date,
        default: Date.now()
    }
}, {
    collection: dbCon.COLLECTION_EVENT
})
eventSchema.plugin(global.db.autoIncrement.plugin, {
    model: dbCon.COLLECTION_EVENT,
    field: 'eventId',
    startAt: 1
})
module.exports = global.db.connection.model(dbCon.COLLECTION_EVENT, eventSchema)