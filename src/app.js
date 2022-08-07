const express = require('express')
const { default: mongoose } = require('mongoose')
const multer = require('multer');
const { bad } = require('./config/response.config');
const route = require('./routers/router');
const cors = require('cors')
require('dotenv').config();
const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json({ limit: '50mb' }))
app.use(multer().any())
app.use(cors({origin: '*'}))

mongoose.connect(process.env.CLUSTER, { useNewUrlParser: true })
    .then(_ => console.log("✅ MongoDb is Connected"))
    .catch(e => console.log('⚠️', e.message));



app.use('/api/', route)
app.all('/**', (req, res) => {
    bad(res, 404, false, '404 API NOT FOUND!')
})

app.listen(PORT, (e) => {
    if (e) console.log('⚠️ ', e.message)
    else console.log('✅ Server Started!')
})