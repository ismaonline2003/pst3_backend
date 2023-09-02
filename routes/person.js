module.exports = app => {
    const functions = require('./functions');
    const person = require("../controllers/person.js");
  
    var router = require("express").Router();
  
    // add a new person
    router.post("/", person.create);
  
    // view all person
    router.get("/", person.findAll);
  
    // view an person
    router.get("/:id", person.findOne);
  
    // update an person
    router.put("/:id", person.update);
  
    // remove an person with id
    router.delete("/:id", person.delete);
  
    app.use('/api/person', functions.verifyToken, router);
};
  