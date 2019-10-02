const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Tiles Endpoints', function() {
    let db

    const { testTiles } = helpers.makeErosionFixtures()

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

    describe(`GET /tiles`, () => {
        context(`Given no tiles`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/tiles')
                    .expect(200, [])
            })
        })

        context(`Given there are tiles in the database`, () => {
           
            beforeEach('insert tiles', () => {
                return db
                    .into('tiles')
                    .insert(testTiles)
            })

            it('responds with 200 and all of the tiles', () => {
                return supertest(app)
                    .get('/tiles')
                    .expect(200, testTiles)
            })
        })
    })

    describe(`GET /tiles/:id`, () => {
        context(`Given no tiles`, () => {
            it(`responds with 404`, () => {
                const tileId = 100000
                return supertest(app)
                    .get(`/tiles/${tileId}`)
                    .expect(404, { error: { message: `Tile not found.`}})
            })
        })

        context(`Given there are tiles in the database`, () => {
           
            beforeEach('insert tiles', () => {
                return db
                    .into('tiles')
                    .insert(testTiles)
            })

            it('responds with 200 and the specified tile', () => {
                const tileId = 2
                const expectedTile = testTiles[tileId - 1]
                return supertest(app)
                    .get(`/tiles/${tileId}`)
                    .expect(200, expectedTile)
            })
        })
    })

    describe(`POST /tiles`, () => {
        it(`creates an tile, responding with 201 and the new tile`, () => {
            const newTile = {
                type: "mud",
                resistance: 3
            }
            return supertest(app)
                .post('/tiles')
                .send(newTile)
                .expect(201)
                .expect(res => {
                    expect(res.body.type).to.eql(newTile.type)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/tiles/${res.body.id}`)
                })
                .then(res =>
                    supertest(app)
                    .get(`/tiles/${res.body.id}`)
                    .expect(res.body)
                )
        })
    })

    describe(`DELETE /tiles/:id`, () => {
        context(`Given no tiles`, () => {
            it(`responds with 404`, () => {
                const tileId = 1000000
                return supertest(app)
                    .delete(`/tiles/${tileId}`)
                    .expect(404, { error: { message: `Tile not found.` } })
            })
        })

        context(`Given there are tiles in the database`, () => {

            beforeEach('insert tiles', () => {
                return db
                    .into('tiles')
                    .insert(testTiles)
            })

            it('responds with 204 and removes the tile', () => {
                const idToRemove = 2
                const expectedTiles = testTiles.filter(tile => tile.id !== idToRemove)
                return supertest(app)
                    .delete(`/tiles/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/tiles`)
                            .expect(expectedTiles)
                    )
            })
        })
    })

    describe(`PATCH /tiles/:id`, () => {
        context(`Given no tiles`, () => {
            it(`responds with 404`, () => {
                const tileId = 1000000
                return supertest(app)
                    .patch(`/tiles/${tileId}`)
                    .expect(404, { error: { message: `Tile not found.` } })
            })
        })

        context(`Given there are tiles in the database`, () => {

            beforeEach('insert tiles', () => {
                return db
                    .into('tiles')
                    .insert(testTiles)
            })

            it('responds with 204 and updates the tile', () => {
                const idToUpdate = 3
                const updateTile = {
                    type: 'magma'
                }
                const expectedTile = {
                    ...testTiles[idToUpdate - 1],
                    ...updateTile
                }
                return supertest(app)
                    .patch(`/tiles/${idToUpdate}`)
                    .send(updateTile)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/tiles/${idToUpdate}`)
                            .expect(expectedTile)
                    )
            })

            it('responds with 400 when no fields supplied', () => {
                const idToUpdate = 3
                return supertest(app)
                    .patch(`/tiles/${idToUpdate}`)
                    .send({ irrelevantField: 'nonsense' })
                    .expect(400, {
                        error: { message: `Request body must contain a value to update.` }
                    })
            })
        })
    })
})