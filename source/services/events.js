const { addEventValidation, updateEventValidation, inviteUsersForEventsValidation } = require('../common/validation')
const { errorGanerator, responseGenerators } = require('../common/errorHandlar')
const comCon = require('../constants/comCon')
const { getData, saveData, updateData, getDataWithAggregate } = require('../repository/commonRepo')
const status = require('http-status')
const dbCon = require('../constants/dbCon')
const _ = require('lodash')
const { verifyToken } = require('./token')
const serviceRoute = 'UEMS_ER_'

const addEvents = (body, userCode, token) => {
    return new Promise(async (resolve, reject) => {
        try {
            // validate body
            const { error } = addEventValidation(body)
            if (error) return reject(errorGanerator(status.BAD_REQUEST, error.details[0].message))
            const verifiedToken = await verifyToken(token, userCode)
            // check event already there in system for particular user
            const eventName = body.event_name.toLowerCase()
            const eventExist = await getData({
                "name": eventName
            }, {}, dbCon.COLLECTION_EVENT)
            if (eventExist.length >= 0 && verifiedToken) {
                const eventData = await checkEventExistsByUser(eventExist, eventName, userCode)
                if (eventData) {
                    return resolve(responseGenerators(
                        '', serviceRoute + comCon.CODE_SERVER_OK, comCon.MSG_EVENT_ALREADY_ASSIGNED))
                } else {
                    // save event details
                    const user = {}
                    user[dbCon.FIELD_NAME] = eventName
                    user[dbCon.FIELD_EMAIL] = verifiedToken._id
                    user[dbCon.FIELD_USER_CODE] = userCode
                    user[dbCon.FIELD_STATUS] = 0 // 0 means event created by ownself and 1 means event invited by other user
                    const eventData = await saveData(user, dbCon.COLLECTION_EVENT)
                    return resolve(eventData)
                }
            }
        } catch (err) {
            return reject(err)
        }
    })
}

function checkEventExistsByUser(eventData, event_name, userCode) {
    let checkData
    eventData.forEach(element => {
        if (element.name == event_name && element.user_code == userCode) {
            checkData = element
        } else {
            return {}
        }
    })
    return checkData
}

const updateEvents = (body, userCode, token) => {
    return new Promise(async (resolve, reject) => {
        try {
            const {
                error
            } = updateEventValidation(body)
            if (error) return reject(errorGanerator(status.BAD_REQUEST, error.details[0].message))
            const verifiedToken = await verifyToken(token, userCode)
            if (verifiedToken) {
                const event = {}
                event[dbCon.FIELD_NAME] = body.event_name
                const updatedData = await updateData({
                    'eventId': body.event_id
                }, event, dbCon.COLLECTION_EVENT)
                return resolve(updatedData)
            }
        } catch (err) {
            return reject(err)
        }
    })
}


const viewOwnEvents = (userCode, token, queryString) => {
    return new Promise(async (resolve, reject) => {
        try {
            const verifiedToken = await verifyToken(token, userCode)
            if (verifiedToken) {
                const query = await viewOwnEventsQuery(queryString, userCode)
                let eventData = await getDataWithAggregate(query, dbCon.COLLECTION_EVENT)
                const eventObj = {}
                eventObj['own_created_events'] = eventData
                return resolve(eventObj)
            }
        } catch (err) {
            return reject(err)
        }
    })
}

async function viewOwnEventsQuery(queryString, userCode) {
    let query = [{
        "$match": {
            'user_code': Number(userCode),
            'status': 0
        }
    }, {
        "$project": {
            'name': 1,
            '_id': 0
        }
    }]
    if (queryString && queryString.offset && queryString.limit && !queryString.search) {        
        query = await checkQueryParams(query, queryString)
    }
    // searching by event name
    if (queryString && queryString.search) {
        const matchObj = {
            "$match": {
                "name": queryString.search
            }
        }
        query.push(matchObj)
    }

   // sorting by event name
    if (queryString && queryString.sort) {
        let type
        if (queryString.sort.event_name === 'desc') {
            type = -1
        } else if (queryString.sort.event_name === 'asc') {
            type = 1
        }
        const sortObj = {
            "$sort": {
                "name": type
            }
        }
        query.push(sortObj)
    }

    // sorting on event created date
    if (queryString && queryString.fromDate && queryString.toDate) {
        const dateObj = {
            "$match": {
                "$expr": {
                    "$and": [{
                            "$gte": [
                                "$created_date",
                                queryString.fromDate
                            ]
                        },
                        {
                            "$lt": [
                                "$created_date",
                                queryString.toDate
                            ]
                        }
                    ]
                }
            }
        }
        query.push(dateObj)
    }
    return query
}

const viewInviteeEvents = (userCode, token, queryString) => {
    return new Promise(async (resolve, reject) => {
        try {
            const verifiedToken = await verifyToken(token, userCode)
            if (verifiedToken) {
                let eventData = await getInviteeEventListData(verifiedToken._id, queryString)
                const eventObj = {}
                eventObj['events_invited_by_other_user'] = eventData
                return resolve(eventObj)
            }
        } catch (err) {
            return reject(err)
        }
    })
}

async function getInviteeEventListData(email, queryString) {
    let query = await getInviteeEventListQuery(email, queryString)
    if (queryString && queryString.offset && queryString.limit && !queryString.search) {
        query = await checkQueryParams(query, queryString)
    }
    const eventDetails = await getDataWithAggregate(query, dbCon.COLLECTION_INVITATIONS)
    return eventDetails
}

function checkQueryParams(query, queryString) {
    // Pagination
    // NOTE: In Mongodb atlas, $Offset is not supported so i have used  $skip for pagination.
    if (queryString.offset > 1) {
        if (queryString.offset > queryString.limit) {
            queryString.offset = queryString.limit
        }
        const offsetObj = {
            "$skip": Number(queryString.offset)
        }
        query.push(offsetObj)
    }
    const limitObj = {
        "$limit": Number(queryString.limit)
    }
    query.push(limitObj)
    return query
}

const inviteUsersForEvents = (body, userCode, token) => {
    return new Promise(async (resolve, reject) => {
        try {
            const {
                error
            } = inviteUsersForEventsValidation(body)
            if (error) return reject(errorGanerator(status.BAD_REQUEST, error.details[0].message))
            const verifiedToken = await verifyToken(token, userCode)
            // check event already assigned or not to particular user 
            const eventExist = await getData({
                inviter_email: verifiedToken._id
            }, {}, dbCon.COLLECTION_INVITATIONS)
            if (eventExist.length >= 0 && verifiedToken) {
                const eventData = await checkEventExists(eventExist, body.event_name, body.invitee_email)
                if (eventData) {
                    return reject(errorGanerator(status.BAD_REQUEST, comCon.MSG_EVENT_ALREADY_ASSIGNED))
                } else {
                    // save invitee invitation details
                    if (verifiedToken._id === body.invitee_email) {
                        return reject(errorGanerator(status.BAD_REQUEST, comCon.MSG_EVENT_INVITED_YOUSELF))
                    }
                    const inviter = {}
                    inviter[dbCon.FIELD_INVITER_EMAIL] = verifiedToken._id
                    inviter[dbCon.FIELD_INVITEE_EMAIL] = body.invitee_email
                    let inviteeData = await getData({
                        'email': body.invitee_email
                    }, {
                        'userId': 1,
                        '_id': 0
                    }, dbCon.COLLECTION_USER)
                    // save invitee user event details
                    const eventObj = {}
                    eventObj[dbCon.FIELD_NAME] = body.event_name
                    eventObj[dbCon.FIELD_EMAIL] = body.invitee_email
                    eventObj[dbCon.FIELD_USER_CODE] = inviteeData[0].userId
                    eventObj[dbCon.FIELD_STATUS] = 1
                    const [invitationData, eventDetails] = await Promise.all([saveData(inviter, dbCon.COLLECTION_INVITATIONS), saveData(eventObj, dbCon.COLLECTION_EVENT)])
                    return resolve(invitationData)
                }
            }
        } catch (err) {
            return reject(err)
        }
    })
}

function checkEventExists(eventData, event_name, invitee_email) {
    let checkData
    eventData.forEach(element => {
        if (element.event_name === event_name && element.invitee_email === invitee_email) {
            checkData = element
        } else {
            return {}
        }
    })
    return checkData
}

const viewInvitedListByEvent = (userCode, token, eventName) => {
    return new Promise(async (resolve, reject) => {
        try {
            const verifiedToken = await verifyToken(token, userCode)
            if (verifiedToken) {
                const eventData = await getInvitedUserListData(verifiedToken._id, eventName)
                const eventObj = {}
                eventObj['invited_user_list'] = eventData
                return resolve(eventObj)
            }
        } catch (err) {
            return reject(err)
        }
    })
}

async function getInvitedUserListData(email, eventName) {
    const eventDetails = await getDataWithAggregate(await getInvitedUserListQuery(email, eventName), dbCon.COLLECTION_INVITATIONS)
    return eventDetails
}

function getInvitedUserListQuery(email, eventName) {
    const query = [{
            "$match": {
                "inviter_email": email
            }
        }, {
            "$project": {
                "_id": 0,
                "invitee_email": 1,
                "inviter_email": 1
            }
        },
        {
            "$group": {
                "_id": "$invitee_email",
                "emails": {
                    "$addToSet": {
                        "inviter_email": "$inviter_email",
                        "invitee_email": "$invitee_email"
                    }
                }
            }
        },
        {
            "$unwind": {
                "path": "$emails"
            }
        },
        {
            "$lookup": {
                "from": "events_details",
                "let": {
                    "email": "$emails.invitee_email"
                },
                "pipeline": [{
                        "$match": {
                            "$expr": {
                                "$and": [{
                                        "$eq": [
                                            "$email",
                                            "$$email"
                                        ]
                                    },
                                    {
                                        "$eq": [
                                            "$status",
                                            1
                                        ]
                                    },
                                    {
                                        "$eq": [
                                            "$name",
                                            eventName
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    {
                        "$project": {
                            "_id": 0,
                            "name": 1,

                        }
                    }
                ],
                "as": "event_data"
            }
        }, {
            "$unwind": "$event_data"
        },
        {
            "$project": {
                "_id": 0,
                "inviter_email": "$emails.inviter_email",
                "invitee_email": "$emails.invitee_email",
                "event_name": "$event_data.name"
            }
        },
        {
            "$lookup": {
                "from": "user_details",
                "let": {
                    "email": "$invitee_email"
                },
                "pipeline": [{
                        "$match": {
                            "$expr": {
                                "$and": [{
                                    "$eq": [
                                        "$email",
                                        "$$email"
                                    ]
                                }]
                            }
                        }
                    },
                    {
                        "$project": {
                            "_id": 0,
                            "name": 1
                        }
                    }
                ],
                "as": "user_data"
            }
        },
        {
            "$unwind": "$user_data"
        },
        {
            "$project": {
                "_id": 0,
                "invitee_email": "$invitee_email",
                "invitee_name": "$user_data.name"
            }
        },
        {
            "$group": {
                "_id": "$invitee_email",
                "invited_user_emails": {
                    "$addToSet": {
                        "invitee_email": "$invitee_email",
                        "invitee_name": "$invitee_name"
                    }
                }
            }
        }, {
            "$unwind": "$invited_user_emails"
        },
        {
            "$project": {
                "_id": 0,
                "invited_user_email": "$invited_user_emails.invitee_email",
                "invited_user_name": "$invited_user_emails.invitee_name"
            }
        }
    ]
    return query
}

function getInviteeEventListQuery(email, queryString) {
    let query = [{
            "$match": {
                "invitee_email": email
            }
        }, {
            "$project": {
                "_id": 0,
                "invitee_email": 1,
                "inviter_email": 1
            }
        },
        {
            "$group": {
                "_id": "$invitee_email",
                "emails": {
                    "$addToSet": {
                        "inviter_email": "$inviter_email",
                        "invitee_email": "$invitee_email"
                    }
                }
            }
        },
        {
            "$unwind": {
                "path": "$emails"
            }
        },
        {
            "$lookup": {
                "from": "events_details",
                "let": {
                    "email": "$emails.invitee_email"
                },
                "pipeline": [{
                        "$match": {
                            "$expr": {
                                "$and": [{
                                        "$eq": [
                                            "$email",
                                            "$$email"
                                        ]
                                    },
                                    {
                                        "$eq": [
                                            "$status",
                                            1
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    {
                        "$project": {
                            "_id": 0,
                            "name": 1,
                            "created_date": 1,
                            "createdAt": 1
                        }
                    }
                ],
                "as": "event_data"
            }
        }, {
            "$unwind": "$event_data"
        },
        {
            "$project": {
                "_id": 0,
                "inviter_email": "$emails.inviter_email",
                "invitee_email": "$emails.invitee_email",
                "event_name": "$event_data.name",
                "created_date": "$event_data.created_date",
                "createdAt": "$event_data.createdAt"
            }
        }
    ]

    // sorting on invited date
    if (queryString && queryString.fromDate && queryString.toDate) {
        const dateObj = {
            "$match": {
                "$expr": {
                    "$and": [{
                            "$gte": [
                                "$created_date",
                                queryString.fromDate
                            ]
                        },
                        {
                            "$lt": [
                                "$created_date",
                                queryString.toDate
                            ]
                        }
                    ]
                }
            }
        }
        query.push(dateObj)
    }

    const lookupUser = {
        "$lookup": {
            "from": "user_details",
            "let": {
                "email": "$inviter_email"
            },
            "pipeline": [{
                    "$match": {
                        "$expr": {
                            "$and": [{
                                "$eq": [
                                    "$email",
                                    "$$email"
                                ]
                            }]
                        }
                    },
                },
                {
                    "$project": {
                        "_id": 0,
                        "name": 1
                    }
                }
            ],
            "as": "user_data"
        }
    }
    query.push(lookupUser)
    const userUnwind = {
        "$unwind": "$user_data"
    }
    query.push(userUnwind)

    const eventProj = {
        "$project": {
            "_id": 0,
            // "inviter_email": "$inviter_email",
            // "invitee_email": "$invitee_email",
            "event_name": "$event_name",
            "creator_name": "$user_data.name"
        }
    }
    query.push(eventProj)

    // searching by event name
    if (queryString && queryString.search) {
        const matchObj = {
            "$match": {
                "event_name": queryString.search
            }
        }
        query.push(matchObj)
    }

    // sorting by event name
    if (queryString && queryString.sort) {
        let type
        if (queryString.sort.event_name === 'desc') {
            type = -1
        } else if (queryString.sort.event_name === 'asc') {
            type = 1
        }
        const sortObj = {
            "$sort": {
                "event_name": type
            }
        }
        query.push(sortObj)
    }
    return query
}



module.exports = {
    addEvents,
    updateEvents,
    viewOwnEvents,
    inviteUsersForEvents,
    viewInviteeEvents,
    viewInvitedListByEvent
}