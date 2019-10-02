const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

function makeUsersArray() {
    return [
        {
            id: 1,
            handle: 'test1',
            username: 'test1user1',
            password: 'secret'
        },
        {
            id: 2,
            handle: 'test2',
            username: 'test2user2',
            password: 'secret'
        },
        {
            id: 3,
            handle: 'test3',
            username: 'test3user3',
            password: 'secret'
        }
    ]
}

function makeTilesArray() {
    return [
        {
            id: 1,
            type: 'stone',
            resistance: 4,
        },
        {
            id: 2,
            type: 'dirt',
            resistance: 1,
        },
        {
            id: 3,
            type: 'adamantium',
            resistance: 10,
        }
    ]
}

function makeMapsArray() {
    return [
        {
            id: 1,
            river_start_row: 2,
            river_start_column: 4,
            river_end_row: 0,
            river_end_column: 1,
        },
        {
            id: 2,
            river_start_row: 3,
            river_start_column: 0,
            river_end_row: 2,
            river_end_column: 0,
        },
        {
            id: 3,
            river_start_row: 1,
            river_start_column: 4,
            river_end_row: 3,
            river_end_column: 4,
        },
    ]
}

function makeScoresArray() {
    return [
        {
            id: 1,
            user_id: 1,
            map_id: 1,
            final_score: 6300,
            score: 4000,
            soil_bonus: 1200,
            location_bonus: 1.5,
            date: '2019-09-22T04:00:00.000Z'
        },
        {
            id: 2,
            user_id: 2,
            map_id: 3,
            final_score: 4000,
            score: 3000,
            soil_bonus: 1000,
            location_bonus: 1,
            date: '2019-09-23T04:00:00.000Z'
        },
        {
            id: 3,
            user_id: 1,
            map_id: 3,
            final_score: 3000,
            score: 1600,
            soil_bonus: 400,
            location_bonus: 1.5,
            date: '2019-09-24T04:00:00.000Z'
        }
    ]
}

function makeLayoutsArray() {
    return [
        {
            id: 1,
            map_id: 1,
            tile_id: 1,
            position: 1
        },
        {
            id: 2,
            map_id: 2,
            tile_id: 3,
            position: 3
        },
        {
            id: 3,
            map_id: 3,
            tile_id: 2,
            position: 2
        }
    ]
}

function makeErosionFixtures() {
    const testUsers = makeUsersArray()
    const testTiles = makeTilesArray()
    const testMaps = makeMapsArray()
    const testScores = makeScoresArray()
    const testLayouts = makeLayoutsArray()
    return { testUsers, testTiles, testMaps, testScores, testLayouts }
}

function seedUsers(db, users) {
    const preppedUsers = users.map(user => ({
        ...user,
        password: bcrypt.hashSync(user.password, 1)
    }))
    return db.into('users').insert(preppedUsers)
        .then(() =>
            // update the auto sequence to stay in sync
            db.raw(
                `SELECT setval('users_id_seq', ?)`,
                [users[users.length - 1].id],
            )
        )
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
    const token = jwt.sign({ user_id: user.id }, secret, {
        subject: user.username,
        algorithm: 'HS256',
    })
    return `Bearer ${token}`
}


module.exports = {
    makeUsersArray,
    makeTilesArray,
    makeMapsArray,
    makeScoresArray,
    makeLayoutsArray,
    makeErosionFixtures,
    makeAuthHeader,
    seedUsers,
  }