module.exports = (sequelize, Sequelize, Person) => {
    const Estudiante = sequelize.define("estudiante", {
      id_persona: {
        type: Sequelize.INTEGER
      },
      nro_expediente: {
        type: Sequelize.STRING
      }
    }, 
    {
      tableName: 'estudiante',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true,
    });
    Estudiante.belongsTo(Person, {
      foreignKey: "id_persona",
    });
    return Estudiante;
};

