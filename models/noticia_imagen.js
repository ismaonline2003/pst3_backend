module.exports = (sequelize, Sequelize, Noticia) => {
    const NoticiaImagen = sequelize.define("noticia_imagen", {
        noticia_id: {
            type: Sequelize.INTEGER
        },
        file: {
            type: Sequelize.STRING
        }
    }, 
    {
      tableName: 'noticia_imagen',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });
    Noticia.hasMany(NoticiaImagen,  {
        foreignKey: "noticia_id",
        onDelete: 'RESTRICT'
    });
    NoticiaImagen.belongsTo(Noticia, {
      foreignKey: "noticia_id",
      onDelete: 'RESTRICT'
    });
    //validations in hooks
    Noticia.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(NoticiaImagen, "noticia_id", record.id);
    });
    return NoticiaImagen;
};
