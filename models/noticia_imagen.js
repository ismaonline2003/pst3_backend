module.exports = (sequelize, Sequelize, Noticia) => {
    const functions = require('../routes/functions');
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
      timestamps: true
    });
    Noticia.hasMany(NoticiaImagen,  {
        foreignKey: "noticia_id",
        onDelete: 'cascade'
    });
    NoticiaImagen.belongsTo(Noticia, {
      foreignKey: "noticia_id",
      onDelete: 'RESTRICT'
    });
    return NoticiaImagen;
};
