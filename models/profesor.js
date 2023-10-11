module.exports = (sequelize, Sequelize, Person) => {
    const functions = require('../routes/functions');
    const Profesor = sequelize.define("profesor", {
        id_persona: {
            type: Sequelize.INTEGER
        },
        grado_instruccion: {        
            type: Sequelize.ENUM,
            values: ["1", "2", "3", "4", "5", "6", "7"]
            /*
                1: Primaria
                2: Bachiller
                3: Técnico Medio
                4: Técnico Superior
                Universitario
                5: Pregrado
                Universitario
                6: Postgrado
                7: Doctorado
            */      
        }
    }, 
    {
      tableName: 'profesor',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });
    Person.hasOne(Profesor,  {
      foreignKey: "id_persona",
      onDelete: 'RESTRICT'
    });
    Profesor.belongsTo(Person, {
      foreignKey: "id_persona",
      onDelete: 'RESTRICT'
    });
    Profesor.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(Profesor, "id_persona", record.id);
    });
    return Profesor;
};

