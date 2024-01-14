module.exports = app => {
    const multer = require('multer');
    const users = require("../controllers/user.js");
    const functions = require('./functions');
    var router = require("express").Router();
    const fileUpload = multer({ dest: 'src/fileUploads' });
  
    // add a new user
    router.post("/", functions.verifyToken, users.create);
  
    // view all users
    router.get("/", functions.verifyToken, users.findAll);
  
    // view an user
    router.get("/:id", functions.verifyToken, users.findOne);

    router.get('/api/userVerification/:id', users.userVerify)

    router.get('/api/passwordResetRequest/:email', users.recoverPasswordRequest);
  
    // update an user
    router.put("/:id", functions.verifyToken, users.update);

    //update my profile data
    router.put("/api/myProfile/:id", fileUpload.single('foto_carnet'), functions.verifyToken, users.myProfile);
  
    // remove an user with id
    router.delete("/:id", functions.verifyToken, users.delete);

    router.post("/passwordReset", users.passwordReset);

    router.post("/login", users.login);

    router.post("/signup", users.signup);

    router.put("/api/logout", functions.verifyToken, users.logout);
  
    app.use('/api/users', router);
};
  