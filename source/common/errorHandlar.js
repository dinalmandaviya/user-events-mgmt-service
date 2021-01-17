const comCon = require('../constants/comCon')
const errorGanerator = (status, messaage) => {
    const errorJson = {}
    errorJson[comCon.FIELD_STATUS] = status
    errorJson[comCon.FIELD_MESSAGE] = messaage
    return errorJson
}

const responseGenerators = (responseData, responseStatusCode, responseStatusMsg, responseErrors) => {
    const responseJson = {}
    responseJson['data'] = responseData
    responseJson['status_code'] = responseStatusCode
    responseJson['status_message'] = responseStatusMsg

    // errors
    if (responseErrors === undefined) {
        responseJson['response_error'] = []
    } else {
        responseJson['response_error'] = responseErrors
    }

    return responseJson
}

module.exports = {
    errorGanerator,
    responseGenerators
}