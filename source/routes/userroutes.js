const router = require('express').Router()
const status = require('http-status')
const { registerDetails } = require('../services/registration')
const { login } = require('../services/login')
const comCon = require('../constants/comCon')
const { responseGenerators } = require('../common/errorHandlar')
const { sendMail } = require('../services/forgotPass')
const { changePassword } = require('../services/resetPassword')
const serviceRoute = 'UEMS_UR_'
const { expireToken } = require('../services/token')
const dbCon = require('../constants/dbCon')
const { resetValidation, forgotValidation } = require('../common/validation')

// User registration API
router.post('/register', async (req, res) => {
    try {
        const body = req.body
        const response = await registerDetails(body)
        res.status(status.OK).json(responseGenerators(
            response, serviceRoute + comCon.CODE_SERVER_OK, comCon.MSG_REGISTER))
    } catch (err) {
        res.status(err.status).send({
            "status_code": err.status,
            "error_message": err.message
        })
    }
})

// User login API

router.post('/login', async (req, res) => {
    try {
        const response = await login(req.body)
        res.setHeader(comCon.FIELD_AUTH_TOKEN, response.token)
        res.setHeader(comCon.FIELD_USER_CODE, response[comCon.FIELD_USER_CODE])
        res.status(status.OK).json(responseGenerators(
            response, serviceRoute + comCon.CODE_SERVER_OK, comCon.MSG_LOGGEDIN))
    } catch (err) {
        res.status(err.status).send({
            "status_code": err.status,
            "error_message": err.message
        })
    }
})

// User forgot password API
router.post('/forgot', async (req, res, next) => {
    try {
        const { errorValidation } = forgotValidation(req.body)        
        if (errorValidation && errorValidation.error) {            
            res.status(status.BAD_REQUEST).json(responseGenerators(
                '', serviceRoute + comCon.CODE_BAD_REQUEST, errorValidation.error.details[0].message))
        }
        const response = await sendMail(req.body)
        res.status(status.OK).json(responseGenerators(
            response, serviceRoute + comCon.CODE_SERVER_OK, comCon.MSG_CHECK_MAIL))
    } catch (err) {
        res.status(err.status).send({
            "status_code": err.status,
            "error_message": 'please enter valid email'
        })
    }
})

// User reset password API
router.post('/reset', async (req, res, next) => {
    try {
        const body = req.body
        const errorValidation = resetValidation(body)        
        if (errorValidation && errorValidation.error) {            
            res.status(status.BAD_REQUEST).json(responseGenerators(
                '', serviceRoute + comCon.CODE_BAD_REQUEST, errorValidation.error.details[0].message))
        }
        if (body['password'] !== body['confirm_password']) {            
            res.status(status.OK).json(responseGenerators(
                '', serviceRoute + comCon.CODE_NOT_FOUND, comCon.MSG_EMAIL_NOT_EXIST))
        } else {
            delete body['confirm_password'];
            const response = await changePassword(body)            
            res.status(status.OK).json(responseGenerators(
                response, serviceRoute + comCon.CODE_SERVER_OK, comCon.MAG_CHANGE_PASSWORD))
        }
    } catch (err) {
        res.status(err.status).send({
            "status_code": err.status,
            "error_message": err.message
        })
    }
})

// logout
router.get('/logout', async (req, res) => {
    try {
        const userCode = req.headers[dbCon.FIELD_USER_CODE]
        const token = req.headers[dbCon.FIELD_TOKEN]
        const response = await expireToken(token, userCode)        
        res.status(status.OK).json(responseGenerators(
            response, serviceRoute + comCon.CODE_SERVER_OK, comCon.MSG_LOGOUT))
    } catch (error) {
        throw err
    }
})

module.exports = router