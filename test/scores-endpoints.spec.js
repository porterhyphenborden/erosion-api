const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Scores Endpoints', function() {
    let db

    const { testScores, testUsers, testMaps } = helpers.makeErosionFixtures()

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

    describe(`GET /scores`, () => {
        context(`Given no scores`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/scores')
                    .expect(200, [])
            })
        })

        context(`Given there are scores in the database`, () => {
           
            beforeEach('insert scores', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('maps')
                            .insert(testMaps)
                            .then(() => {
                                return db
                                    .into('scores')
                                    .insert(testScores)
                            })
                    })
            })

            it('responds with 200 and all of the scores', () => {
                return supertest(app)
                    .get('/scores')
                    .expect(200, testScores)
            })
        })
    })

    describe(`GET /scores/:id`, () => {
        context(`Given no scores`, () => {
            it(`responds with 404`, () => {
                const scoreId = 100000
                return supertest(app)
                    .get(`/scores/${scoreId}`)
                    .expect(404, { error: { message: `Score not found.`}})
            })
        })

        context(`Given there are scores in the database`, () => {
           
            beforeEach('insert scores', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('maps')
                            .insert(testMaps)
                            .then(() => {
                                return db
                                    .into('scores')
                                    .insert(testScores)
                            })
                    })
            })

            it('responds with 200 and the specified score', () => {
                const scoreId = 2
                const expectedScore = testScores[scoreId - 1]
                return supertest(app)
                    .get(`/scores/${scoreId}`)
                    .expect(200, expectedScore)
            })
        })
    })

    describe(`POST /scores`, () => {
        beforeEach('insert scores', () => {
            return db
                .into('users')
                .insert(testUsers)
                .then(() => {
                    return db
                        .into('maps')
                        .insert(testMaps)
                })
        })

        it(`creates an score, responding with 201 and the new score`, () => {
            const newScore = {
                user_id: 1,
                map_id: 3,
                final_score: 4800,
                score: 2000,
                soil_bonus: 1200,
                location_bonus: 1.5,
                date: JSON.stringify(new Date)
            }
            return supertest(app)
                .post('/scores')
                .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                .send(newScore)
                .expect(201)
                .expect(res => {
                    expect(res.body.user_id).to.eql(newScore.user_id)
                    expect(res.body.map_id).to.eql(newScore.map_id)
                    expect(res.body.final_score).to.eql(newScore.final_score)
                    expect(res.body.score).to.eql(newScore.score)
                    expect(res.body.soil_bonus).to.eql(newScore.soil_bonus)
                    expect(res.body.location_bonus).to.eql(newScore.location_bonus)
                    expect(res.body).to.have.property('date')
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/scores/${res.body.id}`)
                })
                .then(res =>
                    supertest(app)
                    .get(`/scores/${res.body.id}`)
                    .expect(res.body)
                )
        })
    })

    describe(`DELETE /scores/:id`, () => {
        context(`Given no scores`, () => {
            it(`responds with 404`, () => {
                const scoreId = 1000000
                return supertest(app)
                    .delete(`/scores/${scoreId}`)
                    .expect(404, { error: { message: `Score not found.` } })
            })
        })

        context(`Given there are scores in the database`, () => {

            beforeEach('insert scores', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('maps')
                            .insert(testMaps)
                            .then(() => {
                                return db
                                    .into('scores')
                                    .insert(testScores)
                            })
                    })
            })

            it('responds with 204 and removes the score', () => {
                const idToRemove = 2
                const expectedScores = testScores.filter(score => score.id !== idToRemove)
                return supertest(app)
                    .delete(`/scores/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/scores`)
                            .expect(expectedScores)
                    )
            })
        })
    })

})