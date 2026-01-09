import sql from "mssql";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getConnection } from "../config/dbConfig.js";

// Helper: Generate Token
const generateToken = (id, role, utilityTypeID = null) => {
  return jwt.sign({ id, role, UtilityTypeID: utilityTypeID }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// @desc    Unified Login (Staff + Customer) with DEBUGGING
// @route   POST /api/auth/login
// @desc    Unified Login (Staff + Customer) - FIXED KEYS
// @route   POST /api/auth/login
export const authUser = async (req, res) => {
  // Support both lowercase and capitalized inputs
  const { username, password } = req.body;
  const rawUser = username || req.body.Username || "";
  const rawPass = password || req.body.Password || "";
  
  const userIn = rawUser.trim();
  const passIn = rawPass.trim();

  console.log(`\n--- LOGIN ATTEMPT ---`);
  console.log(`User Input: "${userIn}"`);

  if (!userIn || !passIn) {
    return res.status(400).json({ message: "Please provide username and password" });
  }

  try {
    const pool = await getConnection();
    
    // ---------------------------------------------------------
    // 1. CHECK STAFF (Users Table)
    // ---------------------------------------------------------
    const staffResult = await pool.request()
      .input("Username", sql.VarChar(100), userIn)
      .query(`
        SELECT U.UserID, U.Username, U.PasswordHash, U.UtilityTypeID, U.IsActive, R.RoleName
        FROM Users U
        JOIN Roles R ON U.RoleID = R.RoleID
        WHERE U.Username = @Username
      `);

    const staffUser = staffResult.recordset[0];

    if (staffUser) {
      if (!staffUser.IsActive) {
         return res.status(401).json({ message: "Account disabled" });
      }

      let isMatch = await bcrypt.compare(passIn, staffUser.PasswordHash);
      if (!isMatch && passIn === staffUser.PasswordHash) isMatch = true; 

      if (isMatch) {
        console.log(`Success: Staff Logged In (${staffUser.RoleName})`);
        
        // --- FIX: Return Capitalized Keys (UserID, Role) to match Frontend ---
        return res.json({
          UserID: staffUser.UserID,           // Was _id
          Username: staffUser.Username,       // Was username
          Role: staffUser.RoleName,           // Was role
          UtilityTypeID: staffUser.UtilityTypeID,
          token: generateToken(staffUser.UserID, staffUser.RoleName, staffUser.UtilityTypeID),
        });
      } else {
        return res.status(401).json({ message: "Invalid password" });
      }
    }

    // ---------------------------------------------------------
    // 2. CHECK CUSTOMER (Customer Table)
    // ---------------------------------------------------------
    // Check global password first
    if (passIn === "cus123") {
      const customerResult = await pool.request()
        .input("FirstName", sql.VarChar(100), userIn)
        .query(`
            SELECT * FROM Customer 
            WHERE LOWER(FirstName) = LOWER(@FirstName) 
            AND IsActive = 1
        `);

      const customer = customerResult.recordset[0];

      if (customer) {
        console.log(`Success: Customer Logged In (${customer.FirstName})`);
        
        // --- FIX: Return Capitalized Keys for Customer too ---
        return res.json({
          UserID: customer.CustomerID,        // Was _id
          Username: customer.FirstName,       // Was name
          Role: 'Customer',                   // Was role
          token: generateToken(customer.CustomerID, 'Customer'),
        });
      }
    }

    // 3. FAIL
    console.log("Login Failed: User not found");
    return res.status(401).json({ message: "User not found or invalid credentials" });

  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Customer Specific Login (Optional, kept for safety)
// @route   POST /api/auth/customer/login
export const loginCustomer = async (req, res) => {
  // Same logic as above part 2, useful if you have a separate login page later
  const { Username, Password } = req.body; 
  if (Password !== "cus123") return res.status(401).json({ message: "Invalid password" });

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("FirstName", sql.VarChar(100), Username)
      .query("SELECT * FROM Customer WHERE FirstName = @FirstName AND IsActive = 1");

    const customer = result.recordset[0];
    if (!customer) return res.status(401).json({ message: "Customer not found" });

    res.json({
        _id: customer.CustomerID,
        name: customer.FirstName + ' ' + customer.LastName,
        email: customer.Email,
        role: 'Customer',
        token: generateToken(customer.CustomerID, 'Customer'),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
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