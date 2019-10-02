const path = require('path')
const express = require('express')
const xss = require('xss')
const UsersService = require('./users-service')
const ScoresService = require('../scores/scores-service')
const { requireAuth } = require('../middleware/jwt-auth')

const usersRouter = express.Router()
const jsonParser = express.json()

const serializeUser = user => ({
    id: user.id,
    handle: xss(user.handle),
    username: xss(user.username),
})

usersRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        UsersService.getAllUsers(knexInstance)
            .then(users => {
                res.json(users.map(serializeUser))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { password, username, handle } = req.body
    
        for (const field of ['handle', 'username', 'password'])
            if (!req.body[field])
                return res.status(400).json({
                    error: `Missing '${field}' in request body`
                })
        
        const passwordError = UsersService.validatePassword(password)
    
        if (passwordError)
            return res.status(400).json({ error: passwordError })
    
        UsersService.hasUserWithUserName(
            req.app.get('db'),
            username
        )
          .then(hasUserWithUserName => {
                if (hasUserWithUserName)
                return res.status(400).json({ error: `Username already taken` })
        
                return UsersService.hashPassword(password)
                .then(hashedPassword => {
                    const newUser = {
                        username,
                        password: hashedPassword,
                        handle,
                    }
        
                    return UsersService.insertUser(
                        req.app.get('db'),
                        newUser
                    )
                    .then(user => {
                        res
                            .status(201)
                            .location(path.posix.join(req.originalUrl, `/${user.id}`))
                            .json(serializeUser(user))
                    })
                })
            })
            .catch(next)
    })

usersRouter
    .route('/:id')
    .all((req, res, next) => {
        UsersService.getById(
            req.app.get('db'),
            req.params.id
        )
            .then(user => {
                if (!user) {
                return res.status(404).json({
                    error: { message: `User not found.` }
                })
                }
                res.user = user
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeUser(res.user))
    })
    .delete((req, res, next) => {
        UsersService.deleteUser(
            req.app.get('db'),
            req.params.id
        )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { handle, username, } = req.body
        const userToUpdate = { handle, username }

        const numberOfValues = Object.values(userToUpdate).filter(Boolean).length
        if (numberOfValues === 0)
            return res.status(400).json({
                error: {
                    message: `Request body must contain field to update.`
                }
        })

        UsersService.updateUser(
            req.app.get('db'),
            req.params.id,
            userToUpdate
        )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
    })

usersRouter
    .route('/:id/scores')
    .get(requireAuth, (req, res, next) => {
        const knexInstance = req.app.get('db')
        userId = req.user.id
        ScoresService.getByUserId(knexInstance, userId)
            .then(scores => {
                res.json(scores)
            })
            .catch(next)
    })


module.exports = usersRouter