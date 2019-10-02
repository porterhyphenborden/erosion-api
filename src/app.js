require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const tilesRouter = require('./tiles/tiles-router')
const mapsRouter = require('./maps/maps-router')
const scoresRouter = require('./scores/scores-router')
const mapLayoutsRouter = require('./map_layouts/map_layouts-router')
const authRouter = require('./auth/auth-router')
const usersRouter = require('./users/users-router')

const app = express()

const morganOption = (NODE_ENV === 'production')
    ? 'tiny'
    : 'common'

app.use(morgan(morganOption))
app.use(cors())
app.use(helmet())

app.use('/tiles', tilesRouter)
app.use('/maps', mapsRouter)
app.use('/scores', scoresRouter)
app.use('/layouts', mapLayoutsRouter)
app.use('/auth', authRouter)
app.use('/users', usersRouter)

app.get('/', (req, res) => {
    res.send('Hello, world!')
})

app.use(function errorHandler(error, req, res, next) {
    let response;
    if (NODE_ENV === 'production') {
        response = { error: { message: 'server error' }}
    } else {
        console.error(error);
        response = { message: error.message, error }
    }
    res.status(500).json(response)
})

module.exports = app