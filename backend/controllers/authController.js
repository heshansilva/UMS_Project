import sql from "mssql";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getConnection } from "../config/dbConfig.js";

// Helper function to generate a token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (for now, ideally Admin only)
export const registerUser = async (req, res) => {
  const { Username, Password, Email, FirstName, LastName, RoleID } = req.body;

  if (!Username || !Password || !Email || !RoleID) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }

  try {
    const pool = await getConnection();

    // Check if user already exists
    const userExists = await pool.request()
      .input("Username", sql.VarChar(100), Username)
      .input("Email", sql.VarChar(100), Email)
      .query("SELECT UserID FROM Users WHERE Username = @Username OR Email = @Email");

    if (userExists.recordset.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const PasswordHash = await bcrypt.hash(Password, salt);

    // Insert new user
    await pool.request()
      .input("Username", sql.VarChar(100), Username)
      .input("PasswordHash", sql.VarChar(255), PasswordHash)
      .input("Email", sql.VarChar(100), Email)
      .input("FirstName", sql.VarChar(100), FirstName)
      .input("LastName", sql.VarChar(100), LastName)
      .input("RoleID", sql.Int, RoleID)
      .query(`
        INSERT INTO Users (Username, PasswordHash, Email, FirstName, LastName, RoleID)
        VALUES (@Username, @PasswordHash, @Email, @FirstName, @LastName, @RoleID)
      `);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Authenticate/login a user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { Username, Password } = req.body;

  // --- DEBUG 1: Log incoming data ---
  console.log("--- Login Attempt ---");
  console.log("Username:", Username);
  console.log("Password:", Password);

  if (!Username || !Password) {
    return res.status(400).json({ message: "Please provide username and password" });
  }

  try {
    const pool = await getConnection();

    // Find the user
    const result = await pool.request()
      .input("Username", sql.VarChar(100), Username)
      .query(`
        SELECT U.UserID, U.Username, U.PasswordHash, R.RoleName
        FROM Users U
        JOIN Roles R ON U.RoleID = R.RoleID
        WHERE U.Username = @Username AND U.IsActive = 1
      `);

    const user = result.recordset[0];

    // --- DEBUG 2: Check if user was found ---
    if (!user) {
      console.log("Login Error: User not found in database.");
      return res.status(401).json({ message: "Invalid username or password" });
    }

    console.log("User Found:", user.Username);
    console.log("Database Hash:", user.PasswordHash);

    // --- DEBUG 3: Compare passwords ---
    const isMatch = await bcrypt.compare(Password, user.PasswordHash);
    console.log("Password Match:", isMatch);

    // Check user and password
    if (isMatch) {
      console.log("Login Success!");
      res.status(200).json({
        UserID: user.UserID,
        Username: user.Username,
        Role: user.RoleName,
        token: generateToken(user.UserID, user.RoleName),
      });
    } else {
      console.log("Login Error: Password comparison failed.");
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Error logging in:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};