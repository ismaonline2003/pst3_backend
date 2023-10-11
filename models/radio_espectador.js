module.exports = (sequelize, Sequelize) => {
    const RadioEspectador = sequelize.define("radio_espectador", {
        activo: {
            type: Sequelize.BOOLEAN
        },
        username: {
            type: Sequelize.STRING,
            unique: true
        },
        ip: {
            type: Sequelize.STRING
        }
    }, 
    {
      tableName: 'radio_espectador',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });
    return RadioEspectador;
};
