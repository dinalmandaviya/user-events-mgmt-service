const {Mail} = require('./mailService')
const { forgotValidation } = require('../common/validation')
const {errorGanerator} = require('../common/errorHandlar')
const comCon = require('../constants/comCon')
const { getData} = require('../repository/commonRepo')
const status  = require('http-status')
const dbCon = require('../constants/dbCon')
const _ = require('lodash')


const sendMail = (body) => {
    return new Promise(async (resolve, reject) => {
        try {
            const emailExist = await getData({ email: body.email }, {}, dbCon.COLLECTION_USER)
            if (_.size(emailExist) === 0) return reject(errorGanerator(status.BAD_REQUEST, comCon.MSG_EMAIL_NOT_EXIST))

            const mailOptions = {}
            mailOptions[comCon.FIELD_FROM] = '##############12@gmail.com'
            mailOptions[comCon.FIELD_TO] = body.email
            mailOptions[comCon.FIELD_SUBJECT] = 'Reset Your Password'
            mailOptions[comCon.FIELD_TEXT] = 'Hello,' + '\n Click here (http://localhost:3000/api/v1/user/reset) for reset your password.\n Thanks & Regards \n ABC company'

            const mailRes = await Mail(mailOptions)
            return resolve(mailRes)

        } catch (err) {
            return reject(err)
        }
    })
}

module.exports = {
    sendMail
}