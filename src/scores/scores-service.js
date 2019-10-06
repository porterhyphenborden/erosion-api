const ScoresService = {
    getAllScores(knex) {
        return(knex)
            .select('*')
            .from('scores')
            .orderBy('final_score', 'desc')
    },
    insertScore(knex, newScore) {
        return knex
            .insert(newScore)
            .into('scores')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex
            .from('scores')
            .select('*')
            .where('id', id)
            .first()
    },
    deleteScore(knex, id) {
        return knex('scores')
            .where({ id })
            .delete()
    },
    updateScore(knex, id, newScoreFields) {
        return knex('scores')
            .where({ id })
            .update(newScoreFields)
    },
    getByUserId(knex, userId) {
        return knex
            .from('scores')
            .select('*')
            .where('user_id', userId)
            .orderBy('date')
    },
}

module.exports = ScoresService