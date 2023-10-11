module.exports = (sequelize, Sequelize) => {
    const CarreraUniversitaria = sequelize.define("carrera_universitaria", {
      nombre: {
        type: Sequelize.STRING
      },
      pertenece_uni: {
        type: Sequelize.BOOLEAN
      },
      nombre_pnf: {
        type: Sequelize.STRING
      },
      codigo_pnf: {
        type: Sequelize.STRING
      }
    }, 
    {
      tableName: 'carrera_universitaria',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });
    return CarreraUniversitaria;
};

