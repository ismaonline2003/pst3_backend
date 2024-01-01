module.exports = app => {
    const users = require("../controllers/user.js");
    const functions = require('./functions');
    var router = require("express").Router();
  
    // add a new user
    router.post("/", functions.verifyToken, users.create);
  
    // view all users
    router.get("/", functions.verifyToken, users.findAll);
  
    // view an user
    router.get("/:id", functions.verifyToken, users.findOne);

    router.get('/api/userVerification/:id', users.userVerify)
  
    // update an user
    router.put("/:id", functions.verifyToken, users.update);
  
    // remove an user with id
    router.delete("/:id", functions.verifyToken, users.delete);

    router.post("/login", users.login);

    router.post("/signup", users.signup);

    router.put("/api/logout", functions.verifyToken, users.logout);
  
    app.use('/api/users', router);
};
  