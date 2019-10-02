const path = require('path')
const express = require('express')
const MapLayoutsService = require('./map_layouts-service')

const mapLayoutsRouter = express.Router()
const jsonParser = express.json()

mapLayoutsRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        MapLayoutsService.getAllMapLayouts(knexInstance)
            .then(mapLayouts => {
                res.json(mapLayouts)
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { map_id, tile_id, position } = req.body
        const newMapLayout = { map_id, tile_id, position }

        for (const [key, value] of Object.entries(newMapLayout))
        if (value == null)
            return res.status(400).json({
                error: { message: `Missing '${key}' in request body.` }
            })
            MapLayoutsService.insertMapLayout(
                req.app.get('db'),
                newMapLayout
        )
            .then(mapLayout => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${mapLayout.id}`))
                    .json(mapLayout)
            })
            .catch(next)
    })

mapLayoutsRouter
    .route('/:id')
    .all((req, res, next) => {
        MapLayoutsService.getById(
            req.app.get('db'),
            req.params.id
        )
            .then(mapLayout => {
                if (!mapLayout) {
                    return res.status(404).json({
                        error: { message: `Layout not found.`}
                    })
                }
                res.mapLayout = mapLayout
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(res.mapLayout)
    })
    .delete((req, res, next) => {
        MapLayoutsService.deleteMapLayout(
            req.app.get('db'),
            req.params.id
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { map_id, tile_id, position } = req.body
        const mapLayoutToUpdate = { map_id, tile_id, position }

        const numberOfValues = Object.values(mapLayoutToUpdate).filter(Boolean).length
            if (numberOfValues === 0)
                return res.status(400).json({
                    error: {
                        message: `Request body must contain a value to update.`
                    }
                })

            MapLayoutsService.updateMapLayout(
                req.app.get('db'),
                req.params.id,
                mapLayoutToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

    module.exports = mapLayoutsRouter