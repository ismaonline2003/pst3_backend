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
      ci_type: {
        type: Sequelize.STRING
      },
      phone: {
        type: Sequelize.STRING
      },
      mobile: {
        type: Sequelize.STRING
      },
      address: {
        type: Sequelize.STRING
      },
      foto_carnet: {
        type: Sequelize.BLOB
      }
    }, 
    {
      tableName: 'person',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true,
    });
    return Person;
};

