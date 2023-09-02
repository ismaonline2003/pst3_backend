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
    user.belongsTo(Person, {
      foreignKey: "person_id",
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