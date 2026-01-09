import sql from "mssql";
import bcrypt from "bcryptjs";
import { getConnection } from "../config/dbConfig.js";

// @desc    Get all customers (Restricted view)
// @route   GET /api/customers
// @access  Protected
export const getAllCustomers = async (req, res) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    let query = `SELECT DISTINCT c.* FROM vw_CustomerSummary c`;

    // RESTRICTION: 
    // Only show customers who have a meter matching the user's utility
    if (req.user && req.user.UtilityTypeID) {
      query += ` 
        JOIN Meter m ON c.CustomerID = m.CustomerID 
        WHERE m.UtilityTypeID = @UserUtilityID
      `;
      request.input("UserUtilityID", sql.Int, req.user.UtilityTypeID);
    }

    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting all customers:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get a single customer by ID (Restricted view)
// @route   GET /api/customers/:id
// @access  Protected
export const getCustomerById = async (req, res) => {
  try {
    const pool = await getConnection();
    const request = pool.request();

    let query = `SELECT * FROM vw_CustomerSummary WHERE CustomerID = @CustomerID`;
    
    // RESTRICTION:
    if (req.user && req.user.UtilityTypeID) {
      query = `
        SELECT c.* FROM vw_CustomerSummary c
        JOIN Meter m ON c.CustomerID = m.CustomerID
        WHERE c.CustomerID = @CustomerID AND m.UtilityTypeID = @UserUtilityID
      `;
      request.input("UserUtilityID", sql.Int, req.user.UtilityTypeID);
    }

    request.input("CustomerID", sql.Int, req.params.id);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Customer not found or not in your utility purview" });
    }
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Error getting customer by ID:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new Customer (Admin/Manager only)
// @route   POST /api/customers
// @access  Protected
export const createCustomer = async (req, res) => {
  const { 
    CustomerTypeID, FirstName, LastName, NIC, ContactNumber, 
    Email, Address, City, PostalCode, 
    UtilityTypeID, MeterNumber, InitialReading 
  } = req.body;

  // 1. Set Default Customer Type if not provided (Default to 1 - e.g., Residential)
  const finalCustomerTypeID = CustomerTypeID || 1;

  // 2. Validate Required Fields
  if (!FirstName || !LastName || !NIC || !ContactNumber || !Address || !UtilityTypeID || !MeterNumber) {
    return res.status(400).json({ message: "Please fill in all required fields" });
  }

  try {
    const pool = await getConnection();
    
    // SECURITY: If Manager, ensure they create customers for THEIR utility
    if (req.user && req.user.UtilityTypeID) {
      if (parseInt(UtilityTypeID) !== req.user.UtilityTypeID) {
        return res.status(403).json({ message: "You can only register customers for your assigned utility." });
      }
    }

    // Use the Stored Procedure 'sp_AddNewCustomer'
    const result = await pool.request()
      .input("CustomerTypeID", sql.Int, finalCustomerTypeID)
      .input("FirstName", sql.VarChar(100), FirstName)
      .input("LastName", sql.VarChar(100), LastName)
      .input("NIC", sql.VarChar(20), NIC)
      .input("ContactNumber", sql.VarChar(15), ContactNumber)
      .input("Email", sql.VarChar(100), Email)
      .input("Address", sql.VarChar(500), Address)
      .input("City", sql.VarChar(100), City)
      .input("PostalCode", sql.VarChar(10), PostalCode)
      .input("UtilityTypeID", sql.Int, UtilityTypeID)
      .input("MeterNumber", sql.VarChar(50), MeterNumber)
      .input("InitialReading", sql.Decimal(10, 2), InitialReading || 0)
      .execute("sp_AddNewCustomer");

    // --- FIX STARTS HERE ---
    // Check if the Stored Procedure returned a custom ErrorMessage (e.g., Duplicate Key)
    if (result.recordset && result.recordset.length > 0 && result.recordset[0].ErrorMessage) {
       return res.status(400).json({ 
         message: result.recordset[0].ErrorMessage 
       });
    }
    // --- FIX ENDS HERE ---

    res.status(201).json({ 
      message: "Customer created successfully",
      customerID: result.recordset && result.recordset[0] ? result.recordset[0].CustomerID : null 
    });

  } catch (error) {
    console.error("Error creating customer:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update a Customer
// @route   PUT /api/customers/:id
// @access  Protected
export const updateCustomer = async (req, res) => {
  const { FirstName, LastName, ContactNumber, Email, Address, City } = req.body;
  const { id } = req.params;

  try {
    const pool = await getConnection();
    
    await pool.request()
      .input("CustomerID", sql.Int, id)
      .input("FirstName", sql.VarChar(100), FirstName)
      .input("LastName", sql.VarChar(100), LastName)
      .input("ContactNumber", sql.VarChar(15), ContactNumber)
      .input("Email", sql.VarChar(100), Email)
      .input("Address", sql.VarChar(500), Address)
      .input("City", sql.VarChar(100), City)
      .query(`
        UPDATE Customer 
        SET FirstName = @FirstName, LastName = @LastName, 
            ContactNumber = @ContactNumber, Email = @Email, 
            Address = @Address, City = @City
        WHERE CustomerID = @CustomerID
      `);

    res.status(200).json({ message: "Customer updated successfully" });
  } catch (error) {
    console.error("Error updating customer:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a Customer (Soft delete or hard delete)
// @route   DELETE /api/customers/:id
// @access  Admin Only
export const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getConnection();
    
    // Soft delete (Set IsActive = 0)
    await pool.request()
      .input("CustomerID", sql.Int, id)
      .query("UPDATE Customer SET IsActive = 0 WHERE CustomerID = @CustomerID");

    res.status(200).json({ message: "Customer deactivated successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};