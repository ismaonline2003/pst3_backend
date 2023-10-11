module.exports = (sequelize, Sequelize, CarreraUniversitaria) => {
    const Seccion = sequelize.define("seccion", {
        pnf_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        nombre: {
            type: Sequelize.STRING,
            allowNull: false
        },
        year: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        trayecto: {        
            type: Sequelize.ENUM,
            values: ["0", "1", "2", "3", "4", "5"],
            allowNull: false
        },
        turno: {
            type: Sequelize.ENUM,
            values: ["1", "2", "3"],
            allowNull: false
        }
    }, 
    {
      tableName: 'seccion',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true
    });
    CarreraUniversitaria.hasMany(Seccion,  {
        foreignKey: "pnf_id",
        onDelete: 'RESTRICT'
    });
    Seccion.belongsTo(CarreraUniversitaria, {
      foreignKey: "pnf_id",
      onDelete: 'RESTRICT'
    });
    CarreraUniversitaria.beforeDestroy(async (record, options) => {
        functions.onDeleteRestrictValidation(Seccion, "pnf_id", record.id);
    });
    return Seccion;
};

