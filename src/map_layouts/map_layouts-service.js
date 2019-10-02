const MapLayoutsService = {
    getAllMapLayouts(knex) {
        return(knex).select('*').from('map_layouts')
    },
    insertMapLayout(knex, newMapLayout) {
        return knex
            .insert(newMapLayout)
            .into('map_layouts')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex
            .from('map_layouts')
            .select('*')
            .where('id', id)
            .first()
    },
    deleteMapLayout(knex, id) {
        return knex('map_layouts')
            .where({ id })
            .delete()
    },
    updateMapLayout(knex, id, newMapLayoutFields) {
        return knex('map_layouts')
            .where({ id })
            .update(newMapLayoutFields)
    },
    getByMapId(knex, id) {
        return knex
            .select(
                'm.id AS id',
                'ml.tile_id AS tileID',
                'ml.position AS position',
                't.type AS type',
                't.resistance AS resistance'
            )
            .from('maps AS m')
            .join('map_layouts AS ml', 'm.id', 'ml.map_id')
            .join('tiles AS t', 'ml.tile_id', 't.id')
            .where('map_id', id)
            .orderBy('position')
    }
}

module.exports = MapLayoutsService