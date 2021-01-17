const nodeMailer = require('nodemailer')
const {errorGanerator} = require('../common/errorHandlar')
const status  = require('http-status')

let trans = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        user: '##############12@gmail.com',
        pass: 'varsha@123'
    }
})

// send mail 
const Mail = (mailOptions) => {
    return new Promise(async (resolve, reject) => {
        trans.sendMail(mailOptions, function (err, info) {
            return resolve(info)
        })
    })
}

module.exports = {
    Mail
}