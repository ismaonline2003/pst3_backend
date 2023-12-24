module.exports = (sequelize, Sequelize, User, Categoria) => {
    const functions = require('../routes/functions');
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
        type: Sequelize.TEXT
      },
      miniatura: {
        type: Sequelize.STRING
      },
      fecha_publicacion: {
        type: Sequelize.DATE
      },
      is_published: {
        type: Sequelize.BOOLEAN
      },
      wordpress_id: {
        type: Sequelize.STRING
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
    Noticia.beforeDestroy(async (record, options) => {
      if(record.dataValues.is_published) {
        throw new Error("No se puede eliminar esta noticia hasta que este oculta.")
      }
    })

    User.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(Noticia, "user_id", record.id);
    });

    Categoria.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(Noticia, "categ_id", record.id);
    });
    return Noticia;
};

