const path = require('path')
const express = require('express')
const xss = require('xss')
const TilesService = require('./tiles-service')

const tilesRouter = express.Router()
const jsonParser = express.json()

const serializeTile = tile => ({
    id: tile.id,
    type: xss(tile.type),
    resistance: tile.resistance,
})

tilesRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        TilesService.getAllTiles(knexInstance)
            .then(tiles => {
                res.json(tiles.map(serializeTile))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { type, resistance } = req.body
        const newTile = { type, resistance }

        for (const [key, value] of Object.entries(newTile))
        if (value == null)
            return res.status(400).json({
                error: { message: `Missing '${key}' in request body.` }
            })
            TilesService.insertTile(
                req.app.get('db'),
                newTile
        )
            .then(tile => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${tile.id}`))
                    .json(serializeTile(tile))
            })
            .catch(next)
    })

tilesRouter
    .route('/:id')
    .all((req, res, next) => {
        TilesService.getById(
            req.app.get('db'),
            req.params.id
        )
            .then(tile => {
                if (!tile) {
                    return res.status(404).json({
                        error: { message: `Tile not found.`}
                    })
                }
                res.tile = tile
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeTile(res.tile))
    })
    .delete((req, res, next) => {
        TilesService.deleteTile(
            req.app.get('db'),
            req.params.id
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { type, resistance } = req.body
        const tileToUpdate = { type, resistance }

        const numberOfValues = Object.values(tileToUpdate).filter(Boolean).length
            if (numberOfValues === 0)
                return res.status(400).json({
                    error: {
                        message: `Request body must contain a value to update.`
                    }
                })

            TilesService.updateTile(
                req.app.get('db'),
                req.params.id,
                tileToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

    module.exports = tilesRouter