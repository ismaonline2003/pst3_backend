module.exports = (sequelize, Sequelize) => {
    const CategoriaNoticia = sequelize.define("categoria_noticia", {
      parent_id: {
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING
      },
      descripcion: {
        type: Sequelize.STRING
      }//
    }, 
    {
      tableName: 'categoria_noticia',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });
    CategoriaNoticia.hasMany(CategoriaNoticia, {
        foreignKey: "parent_id",
        onDelete: 'RESTRICT',
        as: 'Parent'
    });
    CategoriaNoticia.belongsTo(CategoriaNoticia, {
      foreignKey: "parent_id",
      onDelete: 'RESTRICT',
      as: 'Children'
    });
    //CategoriaNoticia.beforeDestroy(async (record, options) => {
    //    functions.onDeleteRestrictValidation(CategoriaNoticia, "parent_id", record.id);
    //});
    return CategoriaNoticia;
};
