const bcrypt = require("bcrypt");
const multer = require("multer");
const { StatusCodes } = require("http-status-codes");
const userController = require("../controller/userController"); // Assuming your controller is here

//db connection
const dbConnection = require("../db/dbConfig.js");

const jwt = require("jsonwebtoken");


async function register(req, res) {
  const { userName, firstName, lastName, email, password } = req.body;
  if (!email || !password || !firstName || !lastName || !userName) {
    return res.status(400).json({ msg: "Please provide all required fields" });
  }
  try {
    const [existingUser] = await dbConnection.query(
      "SELECT userName,userid from users where userName=? or email=?",
      [userName, email]
    );
    if (existingUser.length > 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "User is already exist" });
    }

    if (password.length < 8) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "password must be at least 8 characters!" });
    }
    // password encrypt
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    await dbConnection.query(
      "INSERT INTO users(userName,firstName,lastName,email,password) VALUES (?,?,?,?,?)",
      [userName, firstName, lastName, email, hashPassword]
    );
    return res
      .status(StatusCodes.CREATED)
      .json({ msg: "User registered successfully" });
  } catch (error) {
    console.log(error.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "something went wrong,try again later!" });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please enter all required fields" });
  }

  try {
    // 1. MODIFICATION: Include 'role' in the SELECT query
    const [userExisting] = await dbConnection.query(
      "SELECT userName, userid, password, role FROM users WHERE email=?",
      [email]
    );

    if (userExisting.length === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Invalid credential!" });
    }

    const user = userExisting[0]; // Get the first (and only) user record

    // Decrypt password and compare
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Invalid credential!" });
    }

    const userName = user.userName;
    const userid = user.userid;
    const role = user.role; // Extract the role
    const photo = user.photo;

    // Create JWT with userName and userid (optional: add role to JWT payload)
    const token = jwt.sign(
      { userName, userid, role, photo },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 2. MODIFICATION: Return the 'role' to the frontend
    res.status(StatusCodes.OK).json({
      msg: "User login successful",
      token,
      // The frontend needs this to navigate!
      user: {
        userName: userName,
        role: role,
        photo: photo,
      },
    });
  } catch (error) {
    console.log(error.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Something went wrong, try again later!" });
  }
}

async function checkUser(req, res) {
  const username = req.user.userName;
  const userid = req.user.userid;
  res.status(StatusCodes.OK).json({ msg: "valid user", username, userid });
}

// routes/users.js or wherever your user routes live
async function logout(req, res) {
  try {
    // Optionally verify token if needed
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, msg: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    // You could verify the token here if needed:
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // If you're not blacklisting tokens, just respond
    return res
      .status(StatusCodes.OK)
      .json({ success: true, msg: "Logout successful" });
  } catch (error) {
    console.log(error.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, msg: "Logout failed" });
  }
}

module.exports = {
  register,
  login,

  logout,

  checkUser,

};
