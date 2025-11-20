const express=require('express');
const router=express.Router();
//authentication  middleware
const authMiddleware=require("../authMiddelware/authMiddleware")
const upload = require('../authMiddelware/uploads');


//user controllers 

const {register,login,logout,checkUser}=require("../controller/userController")


// Use the middleware to process the 'referenceImage' file before the controller function

// register route
router.post('/register',register)


// login user
router.post('/login',login)

// login user
router.delete("/logout", logout);


//check user
router.get('/check',authMiddleware,checkUser)



module.exports=router;