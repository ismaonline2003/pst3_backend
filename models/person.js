module.exports = (sequelize, Sequelize) => {
    const Person = sequelize.define("person", {
      name: {
        type: Sequelize.STRING
      },
      lastname: {
        type: Sequelize.STRING
      },
      ci: {
        type: Sequelize.STRING
      },
      ci_type:  {
        type: Sequelize.ENUM,
        values: ["V", "J", "E", "P"]
      },
      birthdate: {
        type: Sequelize.DATE
      },
      phone: {
        type: Sequelize.STRING
      },
      sexo: {
        type: Sequelize.ENUM,
        values: ["M", "F"]
      },
      mobile: {
        type: Sequelize.STRING
      },
      address: {
        type: Sequelize.STRING
      },
      foto_carnet: {
        type: Sequelize.BLOB('long')
      },
      foto_carnet_filename: {
        type: Sequelize.STRING
      }
    }, 
    {
      tableName: 'person',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });
    return Person;
};

