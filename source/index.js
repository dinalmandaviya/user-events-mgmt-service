const express = require('express')
const dotenv = require('dotenv')
dotenv.config()
const dbCon = require('./repository/db')

global.db = dbCon.connect()
require('./model/modelExport')

const app = express()
app.listen(3000, () => console.log('User event mgmt Service is running on port 3000...'))

const userRoutes = require('./routes/userroutes')
const eventRoutes = require('./routes/eventroutes')

app.use(express.json())
app.use('/api/v1/user', userRoutes)
app.use('/api/v1/user/event', eventRoutes)