const MapsService = {
    getAllMaps(knex) {
        return(knex).select('*').from('maps')
    },
    insertMap(knex, newMap) {
        return knex
            .insert(newMap)
            .into('maps')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex
            .from('maps')
            .select('*')
            .where('id', id)
            .first()
    },
    deleteMap(knex, id) {
        return knex('maps')
            .where({ id })
            .delete()
    },
    updateMap(knex, id, newMapFields) {
        return knex('maps')
            .where({ id })
            .update(newMapFields)
    }
}

module.exports = MapsService