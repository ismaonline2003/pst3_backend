module.exports = (sequelize, Sequelize, User, Categoria) => {
    const Noticia = sequelize.define("noticia", {
      user_id: {
        type: Sequelize.INTEGER
      },
      categ_id: {
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING
      },
      descripcion: {
        type: Sequelize.STRING
      },
      contenido: {
        type: Sequelize.STRING
      },
      miniatura: {
        type: Sequelize.BLOB
      }
    }, 
    {
      tableName: 'noticia',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });

    User.hasMany(Noticia,  {
        foreignKey: "user_id",
        onDelete: 'RESTRICT'
    });
    Noticia.belongsTo(User, {
      foreignKey: "user_id",
      onDelete: 'RESTRICT'
    });

    Categoria.hasMany(Noticia,  {
        foreignKey: "categ_id",
        onDelete: 'RESTRICT'
    });
    Noticia.belongsTo(Categoria, {
      foreignKey: "categ_id",
      onDelete: 'RESTRICT'
    });

    //hooks validations
    User.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(Noticia, "user_id", record.id);
    });

    Categoria.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(Noticia, "categ_id", record.id);
    });
    return Noticia;
};
