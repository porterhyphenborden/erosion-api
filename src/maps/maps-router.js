const path = require('path')
const express = require('express')
const MapsService = require('./maps-service')
const mapLayoutsService = require('../map_layouts/map_layouts-service')

const mapsRouter = express.Router()
const jsonParser = express.json()

mapsRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        MapsService.getAllMaps(knexInstance)
            .then(maps => {
                res.json(maps)
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { river_start_row, river_start_column, river_end_row, river_end_column } = req.body
        const newMap = { river_start_row, river_start_column, river_end_row, river_end_column }
        
        for (const [key, value] of Object.entries(newMap))
        if (value == null)
            return res.status(400).json({
                error: { message: `Missing '${key}' in request body.` }
            })
            MapsService.insertMap(
                req.app.get('db'),
                newMap
        )
            .then(map => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${map.id}`))
                    .json(map)
            })
            .catch(next)
    })

mapsRouter
    .route('/:id')
    .all((req, res, next) => {
        MapsService.getById(
            req.app.get('db'),
            req.params.id
        )
            .then(map => {
                if (!map) {
                    return res.status(404).json({
                        error: { message: `Map not found.`}
                    })
                }
                res.map = map
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(res.map)
    })
    .delete((req, res, next) => {
        MapsService.deleteMap(
            req.app.get('db'),
            req.params.id
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { river_start_row, river_start_column, river_end_row, river_end_column } = req.body
        const mapToUpdate = { river_start_row, river_start_column, river_end_row, river_end_column }

        const numberOfValues = Object.values(mapToUpdate).filter(Boolean).length
            if (numberOfValues === 0)
                return res.status(400).json({
                    error: {
                        message: `Request body must contain a value to update.`
                    }
                })

            MapsService.updateMap(
                req.app.get('db'),
                req.params.id,
                mapToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

mapsRouter
    .route('/:id/layout')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        mapLayoutsService.getByMapId(knexInstance, req.params.id)
            .then(layouts => {
                res.json(layouts)
            })
            .catch(next)
    })

module.exports = mapsRouter