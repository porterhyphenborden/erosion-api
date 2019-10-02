const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Maps Endpoints', function() {
    let db

    const { testMaps } = helpers.makeErosionFixtures()

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db.raw('TRUNCATE users, tiles, maps, scores, map_layouts RESTART IDENTITY CASCADE'))

    afterEach('cleanup', () => db.raw('TRUNCATE users, tiles, maps, scores, map_layouts RESTART IDENTITY CASCADE'))

    describe(`GET /maps`, () => {
        context(`Given no maps`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/maps')
                    .expect(200, [])
            })
        })

        context(`Given there are maps in the database`, () => {
           
            beforeEach('insert maps', () => {
                return db
                    .into('maps')
                    .insert(testMaps)
            })

            it('responds with 200 and all of the maps', () => {
                return supertest(app)
                    .get('/maps')
                    .expect(200, testMaps)
            })
        })
    })

    describe(`GET /maps/:id`, () => {
        context(`Given no maps`, () => {
            it(`responds with 404`, () => {
                const mapId = 100000
                return supertest(app)
                    .get(`/maps/${mapId}`)
                    .expect(404, { error: { message: `Map not found.`}})
            })
        })

        context(`Given there are maps in the database`, () => {
           
            beforeEach('insert maps', () => {
                return db
                    .into('maps')
                    .insert(testMaps)
            })

            it('responds with 200 and the specified map', () => {
                const mapId = 2
                const expectedMap = testMaps[mapId - 1]
                return supertest(app)
                    .get(`/maps/${mapId}`)
                    .expect(200, expectedMap)
            })
        })
    })

    describe(`POST /maps`, () => {
        it(`creates an map, responding with 201 and the new map`, () => {
            const newMap = {
                river_start_row: 1,
                river_start_column: 2,
                river_end_row: 3,
                river_end_column: 4,
            }
            return supertest(app)
                .post('/maps')
                .send(newMap)
                .expect(201)
                .expect(res => {
                    expect(res.body.river_start_row).to.eql(newMap.river_start_row)
                    expect(res.body.river_start_column).to.eql(newMap.river_start_column)
                    expect(res.body.river_end_row).to.eql(newMap.river_end_row)
                    expect(res.body.river_end_column).to.eql(newMap.river_end_column)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/maps/${res.body.id}`)
                })
                .then(res =>
                    supertest(app)
                    .get(`/maps/${res.body.id}`)
                    .expect(res.body)
                )
        })
    })

    describe(`DELETE /maps/:id`, () => {
        context(`Given no maps`, () => {
            it(`responds with 404`, () => {
                const mapId = 1000000
                return supertest(app)
                    .delete(`/maps/${mapId}`)
                    .expect(404, { error: { message: `Map not found.` } })
            })
        })

        context(`Given there are maps in the database`, () => {

            beforeEach('insert maps', () => {
                return db
                    .into('maps')
                    .insert(testMaps)
            })

            it('responds with 204 and removes the map', () => {
                const idToRemove = 2
                const expectedMaps = testMaps.filter(map => map.id !== idToRemove)
                return supertest(app)
                    .delete(`/maps/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/maps`)
                            .expect(expectedMaps)
                    )
            })
        })
    })

    describe(`PATCH /maps/:id`, () => {
        context(`Given no maps`, () => {
            it(`responds with 404`, () => {
                const mapId = 1000000
                return supertest(app)
                    .patch(`/maps/${mapId}`)
                    .expect(404, { error: { message: `Map not found.` } })
            })
        })

        context(`Given there are maps in the database`, () => {

            beforeEach('insert maps', () => {
                return db
                    .into('maps')
                    .insert(testMaps)
            })

            it('responds with 204 and updates the map', () => {
                const idToUpdate = 3
                const updateMap = {
                    river_end_column: 1
                }
                const expectedMap = {
                    ...testMaps[idToUpdate - 1],
                    ...updateMap
                }
                return supertest(app)
                    .patch(`/maps/${idToUpdate}`)
                    .send(updateMap)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/maps/${idToUpdate}`)
                            .expect(expectedMap)
                    )
            })

            it('responds with 400 when no fields supplied', () => {
                const idToUpdate = 3
                return supertest(app)
                    .patch(`/maps/${idToUpdate}`)
                    .send({ irrelevantField: 'nonsense' })
                    .expect(400, {
                        error: { message: `Request body must contain a value to update.` }
                    })
            })
        })
    })
})