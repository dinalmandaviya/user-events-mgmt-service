// VALIDATION

const Joi = require('@hapi/joi')

const registerValidation = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(3).required(),
        email: Joi.string().min(6).required().email(),
        password: Joi.string().min(6).required()
    })
    return schema.validate(data)
}

const loginValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().min(6).required().email(),
        password: Joi.string().min(6).required()
    })
    return schema.validate(data)
}

const forgotValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().min(6).required().email()
    })
    return schema.validate(data)
}

const resetValidation = (data) => {
    const schema = Joi.object({
        password: Joi.string().min(6).required(),
        email: Joi.string().min(6).required().email(),
        confirm_password: Joi.string().min(6).required()
    })
    return schema.validate(data)
}

const addEventValidation = (data) => {
    const schema = Joi.object({
        event_name: Joi.string().min(3).required()
    })
    return schema.validate(data)
}

const updateEventValidation = (data) => {
    const schema = Joi.object({
        event_name: Joi.string().min(3).required(),
        event_id: Joi.number().required()
    })
    return schema.validate(data)
}

const inviteUsersForEventsValidation = (data) => {
    const schema = Joi.object({
        invitee_email: Joi.string().min(6).required().email(),
        event_name: Joi.string().min(3).required()
    })
    return schema.validate(data)
}

module.exports = {
    registerValidation,
    loginValidation,
    forgotValidation,
    resetValidation,
    addEventValidation,
    updateEventValidation,
    inviteUsersForEventsValidation
}
