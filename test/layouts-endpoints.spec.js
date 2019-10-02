const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Layouts Endpoints', function() {
    let db

    const { testLayouts, testMaps, testTiles } = helpers.makeErosionFixtures()

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

    describe(`GET /layouts`, () => {
        context(`Given no layouts`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/layouts')
                    .expect(200, [])
            })
        })

        context(`Given there are layouts in the database`, () => {
           
            beforeEach('insert layouts', () => {
                return db
                    .into('maps')
                    .insert(testMaps)
                    .then(() => {
                        return db
                            .into('tiles')
                            .insert(testTiles)
                            .then(() => {
                                return db
                                    .into('map_layouts')
                                    .insert(testLayouts)
                            })
                    })
            })

            it('responds with 200 and all of the layouts', () => {
                return supertest(app)
                    .get('/layouts')
                    .expect(200, testLayouts)
            })
        })
    })

    describe(`GET /layouts/:id`, () => {
        context(`Given no layouts`, () => {
            it(`responds with 404`, () => {
                const layoutId = 100000
                return supertest(app)
                    .get(`/layouts/${layoutId}`)
                    .expect(404, { error: { message: `Layout not found.`}})
            })
        })

        context(`Given there are layouts in the database`, () => {
           
            beforeEach('insert layouts', () => {
                return db
                    .into('maps')
                    .insert(testMaps)
                    .then(() => {
                        return db
                            .into('tiles')
                            .insert(testTiles)
                            .then(() => {
                                return db
                                    .into('map_layouts')
                                    .insert(testLayouts)
                            })
                    })
            })

            it('responds with 200 and the specified layout', () => {
                const layoutId = 2
                const expectedLayout = testLayouts[layoutId - 1]
                return supertest(app)
                    .get(`/layouts/${layoutId}`)
                    .expect(200, expectedLayout)
            })
        })
    })

    describe(`POST /layouts`, () => {
        beforeEach('insert layouts', () => {
            return db
                .into('maps')
                .insert(testMaps)
                .then(() => {
                    return db
                        .into('tiles')
                        .insert(testTiles)
                })
        })

        it(`creates an layout, responding with 201 and the new layout`, () => {
            const newLayout = {
                map_id: 1,
                tile_id: 2,
                position: 6
            }
            return supertest(app)
                .post('/layouts')
                .send(newLayout)
                .expect(201)
                .expect(res => {
                    expect(res.body.map_id).to.eql(newLayout.map_id)
                    expect(res.body.tile_id).to.eql(newLayout.tile_id)
                    expect(res.body.position).to.eql(newLayout.position)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/layouts/${res.body.id}`)
                })
                .then(res =>
                    supertest(app)
                    .get(`/layouts/${res.body.id}`)
                    .expect(res.body)
                )
        })
    })

    describe(`DELETE /layouts/:id`, () => {
        context(`Given no layouts`, () => {
            it(`responds with 404`, () => {
                const layoutId = 1000000
                return supertest(app)
                    .delete(`/layouts/${layoutId}`)
                    .expect(404, { error: { message: `Layout not found.` } })
            })
        })

        context(`Given there are layouts in the database`, () => {

            beforeEach('insert layouts', () => {
                return db
                    .into('maps')
                    .insert(testMaps)
                    .then(() => {
                        return db
                            .into('tiles')
                            .insert(testTiles)
                            .then(() => {
                                return db
                                    .into('map_layouts')
                                    .insert(testLayouts)
                            })
                    })
            })

            it('responds with 204 and removes the layout', () => {
                const idToRemove = 2
                const expectedLayouts = testLayouts.filter(layout => layout.id !== idToRemove)
                return supertest(app)
                    .delete(`/layouts/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/layouts`)
                            .expect(expectedLayouts)
                    )
            })
        })
    })

    describe(`PATCH /layouts/:id`, () => {
        context(`Given no layouts`, () => {
            it(`responds with 404`, () => {
                const layoutId = 1000000
                return supertest(app)
                    .patch(`/layouts/${layoutId}`)
                    .expect(404, { error: { message: `Layout not found.` } })
            })
        })

        context(`Given there are layouts in the database`, () => {

            beforeEach('insert layouts', () => {
                return db
                    .into('maps')
                    .insert(testMaps)
                    .then(() => {
                        return db
                            .into('tiles')
                            .insert(testTiles)
                            .then(() => {
                                return db
                                    .into('map_layouts')
                                    .insert(testLayouts)
                            })
                    })
            })

            it('responds with 204 and updates the layout', () => {
                const idToUpdate = 3
                const updateLayout = {
                    position: 4
                }
                const expectedLayout = {
                    ...testLayouts[idToUpdate - 1],
                    ...updateLayout
                }
                return supertest(app)
                    .patch(`/layouts/${idToUpdate}`)
                    .send(updateLayout)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/layouts/${idToUpdate}`)
                            .expect(expectedLayout)
                    )
            })

            it('responds with 400 when no fields supplied', () => {
                const idToUpdate = 3
                return supertest(app)
                    .patch(`/layouts/${idToUpdate}`)
                    .send({ irrelevantField: 'nonsense' })
                    .expect(400, {
                        error: { message: `Request body must contain a value to update.` }
                    })
            })
        })
    })
})