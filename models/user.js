module.exports = (sequelize, Sequelize, Person) => {
    const jwt = require('jsonwebtoken');
    const user = sequelize.define("user", {
      login: {
        type: Sequelize.STRING
      },
      password:{
        type:Sequelize.STRING
      },
      person_id: {
        type: Sequelize.INTEGER
      },
      verifiedDate: {
        type: Sequelize.DATE
      },
      verifiedToken: {
        type: Sequelize.STRING
      },
      rol: {
        type: Sequelize.ENUM,
        values: ["A", "P", "ER", "E"]
      }
    },
    {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      timestamps: true,
    },
    );
    Person.hasOne(user, {
      foreignKey: "person_id",
      onDelete: 'RESTRICT'
    });

    user.belongsTo(Person, {
      foreignKey: "person_id",
      onDelete: 'RESTRICT'
    });

    Person.beforeDestroy(async (record, options) => {
      let searchUser = await user.findAll({where: {person_id: record.id}})
      if(searchUser.length > 0) {
        console.log('No se puede eliminar a este usuario')
        throw ('No se puede eliminar a este usuario');
      }
    });

    user.prototype.holaMundo = function () {
      console.log('Hola Mundo')
    }

    user.prototype.verifyToken = function (authHeader, ) {
      //const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      if (token == null) return res.sendStatus(403);
      jwt.verify(token, "secret_key", (err, user) => {
          if (err) return res.sendStatus(404);
          req.user = user;
          next();
      });
    }
    return user;
  };