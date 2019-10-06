const path = require('path')
const express = require('express')
const xss = require('xss')
const ScoresService = require('./scores-service')
const { requireAuth } = require('../middleware/jwt-auth')

const scoresRouter = express.Router()
const jsonParser = express.json()

const serializeScore = score => ({
    id: score.id,
    user_id: score.user_id,
    map_id: score.map_id,
    final_score: score.final_score,
    score: score.score,
    soil_bonus: score.soil_bonus,
    location_bonus: score.location_bonus,
    date: new Date(score.date)
})

scoresRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        ScoresService.getAllScores(knexInstance)
            .then(scores => {
                res.json(scores.map(serializeScore))
            })
            .catch(next)
    })
    .post(requireAuth, jsonParser, (req, res, next) => {
        const { map_id, final_score, score, soil_bonus, location_bonus } = req.body
        const newScore = { map_id, final_score, score, soil_bonus, location_bonus }

        for (const [key, value] of Object.entries(newScore))
        if (value == null) {
            return res.status(400).json({
                error: { message: `Missing '${key}' in request body.` }
            })
        }
        newScore.user_id = req.user.id
            
        ScoresService.insertScore(
                req.app.get('db'),
                newScore
        )
            .then(score => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${score.id}`))
                    .json(serializeScore(score))
            })
            .catch(next)
    })

scoresRouter
    .route('/:id')
    .all((req, res, next) => {
        ScoresService.getById(
            req.app.get('db'),
            req.params.id
        )
            .then(score => {
                if (!score) {
                    return res.status(404).json({
                        error: { message: `Score not found.`}
                    })
                }
                res.score = score
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeScore(res.score))
    })
    .delete((req, res, next) => {
        ScoresService.deleteScore(
            req.app.get('db'),
            req.params.id
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

    module.exports = scoresRouter