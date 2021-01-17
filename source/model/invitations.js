const mongoose = require('mongoose')
const dbCon = require('../constants/dbCon')

const invitationSchema = new mongoose.Schema({
    inviter_email: {
        type: String,
        max: 255,
        min: 6
    },
    invitee_email: {
        type: String,
        required: true,
        max: 255,
        min: 6
    },
    // event_name: {
    //     type: String,
    //     required: true
    // },
    created_date: {
        type: Date,
        default: Date.now()
    }
}, {
    collection: dbCon.COLLECTION_INVITATIONS
})

invitationSchema.plugin(global.db.autoIncrement.plugin, {
    model: dbCon.COLLECTION_INVITATIONS,
    field: 'invitationId',
    startAt: 1
})
module.exports = global.db.connection.model(dbCon.COLLECTION_INVITATIONS, invitationSchema)