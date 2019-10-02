const TilesService = {
    getAllTiles(knex) {
        return(knex).select('*').from('tiles')
    },
    insertTile(knex, newTile) {
        return knex
            .insert(newTile)
            .into('tiles')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex
            .from('tiles')
            .select('*')
            .where('id', id)
            .first()
    },
    deleteTile(knex, id) {
        return knex('tiles')
            .where({ id })
            .delete()
    },
    updateTile(knex, id, newTileFields) {
        return knex('tiles')
            .where({ id })
            .update(newTileFields)
    }
}

module.exports = TilesService