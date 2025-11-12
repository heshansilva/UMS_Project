import jwt from "jsonwebtoken";
import { getConnection } from "../config/dbConfig.js";
import sql from "mssql";

export const protect = async (req, res, next) => {
  let token;

  // Check if the token is in the 'Authorization' header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 1. Get token from header
      token = req.headers.authorization.split(" ")[1];

      // 2. Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Get user from DB (excluding password)
      // We do this to attach the user's info to the request
      const pool = await getConnection();
      const result = await pool.request()
        .input("UserID", sql.Int, decoded.id)
        .query(`
          SELECT U.UserID, U.Username, R.RoleName
          FROM Users U
          JOIN Roles R ON U.RoleID = R.RoleID
          WHERE U.UserID = @UserID
        `);

      req.user = result.recordset[0];

      // 4. Continue to the next function (the controller)
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