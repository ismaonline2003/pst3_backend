module.exports = (sequelize, Sequelize) => {
    const Author = sequelize.define("author", {
      name: {
        type: Sequelize.STRING
      },
      code: {
        type: Sequelize.STRING
      }
    }, 
    {
      tableName: 'author',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true,
    });
    return Author;
};