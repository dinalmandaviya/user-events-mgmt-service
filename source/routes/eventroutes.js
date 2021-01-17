const router = require('express').Router()
const status = require('http-status')
const {
    addEvents,
    updateEvents,
    viewOwnEvents,
    inviteUsersForEvents,
    viewInviteeEvents,
    viewInvitedListByEvent
} = require('../services/events')
const comCon = require('../constants/comCon')
const { responseGenerators } = require('../common/errorHandlar')
const dbCon = require('../constants/dbCon')
const serviceRoute = 'UEMS_ER_'
const { getStandardAPIStructureJson } = require('../repository/commonRepo')

// Create event API
router.post('/add', async (req, res) => {
    try {
        const body = req.body
        const userCode = req.headers[dbCon.FIELD_USER_CODE]
        const token = req.headers[dbCon.FIELD_TOKEN]
        const response = await addEvents(body, userCode, token)
        res.status(status.OK).json(responseGenerators(
            response, serviceRoute + comCon.CODE_SERVER_OK, comCon.MSG_EVENT_CREATED))
    } catch (err) {
        res.status(err.status).send({
            "status_code": err.status,
            "error_message": err.message
        })
    }
})

// Update event API
router.post('/update', async (req, res) => {
    try {
        const body = req.body
        const userCode = req.headers[dbCon.FIELD_USER_CODE]
        const token = req.headers[dbCon.FIELD_TOKEN]
        const response = await updateEvents(body, userCode, token)
        res.status(status.OK).json(responseGenerators(
            response, serviceRoute + comCon.CODE_SERVER_OK, comCon.MSG_EVENT_UPDATE))
    } catch (err) {
        res.status(err.status).send({
            "status_code": err.status,
            "error_message": err.message
        })
    }
})

// View own created Events API
router.get('/created/list', async (req, res) => {
    try {
        const userCode = req.headers[dbCon.FIELD_USER_CODE]
        const token = req.headers[dbCon.FIELD_TOKEN]
        const queryString = getStandardAPIStructureJson(req)
        const response = await viewOwnEvents(userCode, token, queryString)
        res.status(status.OK).json(responseGenerators(
            response, serviceRoute + comCon.CODE_SERVER_OK, comCon.MSG_INVITER_EVENT_DATA_FETCH_SUCCESSFULLY))
    } catch (err) {
        res.status(err.status).send({
            "status_code": err.status,
            "error_message": err.message
        })
    }
})

// send event invitation to other user
router.post('/send/invitation', async (req, res) => {
    try {
        const body = req.body
        const userCode = req.headers[dbCon.FIELD_USER_CODE]
        const token = req.headers[dbCon.FIELD_TOKEN]        
        const response = await inviteUsersForEvents(body, userCode, token)
        res.status(status.OK).json(responseGenerators(
            response, serviceRoute + comCon.CODE_SERVER_OK, comCon.MSG_EVENT_INVITATION_SEND_SUCCESSFULLY))
    } catch (err) {
        res.status(err.status).send({
            "status_code": err.status,
            "error_message": err.message
        })
    }
})

// View event list invited by other user
// Limit set = 5
// Sorting on event name
// Search on event name
// Date = Invited Date 
router.get('/invitee/list', async (req, res) => {
    try {
        const userCode = req.headers[dbCon.FIELD_USER_CODE]
        const token = req.headers[dbCon.FIELD_TOKEN]
        const queryString = getStandardAPIStructureJson(req)
        const response = await viewInviteeEvents(userCode, token, queryString)
        res.status(status.OK).json(responseGenerators(
            response, serviceRoute + comCon.CODE_SERVER_OK, comCon.MSG_INVITEE_EVENT_DATA_FETCH_SUCCESSFULLY))
    } catch (err) {
        res.status(err.status).send({
            "status_code": err.status,
            "error_message": err.message
        })
    }
})

// View Invited user list by event 
router.get('/invited/list', async (req, res) => {
    try {
        const userCode = req.headers[dbCon.FIELD_USER_CODE]
        const token = req.headers[dbCon.FIELD_TOKEN]
        const eventName = req.query[dbCon.FIELD_EVENT_NAME]
        const response = await viewInvitedListByEvent(userCode, token, eventName)
        res.status(status.OK).json(responseGenerators(
            response, serviceRoute + comCon.CODE_SERVER_OK, comCon.MSG_EVENT_USER_LIST_FETCH_SUCCESSFULLY))
    } catch (err) {
        res.status(err.status).send({
            "status_code": err.status,
            "error_message": err.message
        })
    }
})

module.exports = router