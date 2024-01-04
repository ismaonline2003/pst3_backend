module.exports = (sequelize, Sequelize, Author) => {
    const functions = require('../routes/functions');
    const AudioModel = sequelize.define("radio_audio", {
        id_autor: {
            type: Sequelize.INTEGER
        },
        title: {
            type: Sequelize.STRING
        },
        source: {
            type: Sequelize.ENUM,
            values: ["yt", "local"]
        },
        type: {
            type: Sequelize.ENUM,
            values: ["cancion", "record"]
        },
        yt_url: {
            type: Sequelize.STRING
        },
        filename: {
            type: Sequelize.STRING
        }
    }, 
    {
      tableName: 'radio_audio',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });
    Author.hasMany(AudioModel,  {
        foreignKey: "id_autor",
        onDelete: 'RESTRICT'
    });
    AudioModel.belongsTo(Author, {
      foreignKey: "id_autor",
      onDelete: 'RESTRICT'
    });
    //validations in hooks
    Author.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(AudioModel, "id_audio", record.id);
    });
    return AudioModel;
};
