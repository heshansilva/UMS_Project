import jwt from "jsonwebtoken";
import { getConnection } from "../config/dbConfig.js";
import sql from "mssql";

export const protect = async (req, res, next) => {
  let token;

  // Check for the token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 1. Get token from header
      token = req.headers.authorization.split(" ")[1];

      // 2. Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const pool = await getConnection();
      
      // 3. CHECK ROLE & QUERY CORRECT TABLE
      if (decoded.role === 'Customer') {
        // --- Logic for CUSTOMERS ---
        const result = await pool.request()
          .input("CustomerID", sql.Int, decoded.id)
          .query(`
            SELECT CustomerID, FirstName, LastName, Email 
            FROM Customer 
            WHERE CustomerID = @CustomerID
          `);

        const customer = result.recordset[0];
        
        if (customer) {
          // Normalize the user object so it looks like a Staff object to the rest of the app
          req.user = {
            id: customer.CustomerID,       // Standardize ID
            UserID: customer.CustomerID,   // Keep UserID for compatibility
            Username: customer.FirstName,
            RoleName: 'Customer',          // Important for authorize middleware
            UtilityTypeID: null            // Customers usually don't have a utility type restriction
          };
        }

      } else {
        // --- Logic for STAFF (Admin, Manager, etc.) ---
        const result = await pool.request()
          .input("UserID", sql.Int, decoded.id)
          .query(`
            SELECT U.UserID, U.Username, U.UtilityTypeID, R.RoleName
            FROM Users U
            JOIN Roles R ON U.RoleID = R.RoleID
            WHERE U.UserID = @UserID
          `);

        const staff = result.recordset[0];
        
        if (staff) {
          req.user = {
            ...staff,
            id: staff.UserID // Add 'id' property to match Customer object
          };
        }
      }

      // 4. Check if user was actually found
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      // 5. Continue
      next();
    } catch (error) {
      console.error("Auth Error:", error.message);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};