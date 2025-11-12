import sql from "mssql";
import { getConnection } from "../config/dbConfig.js";

// @desc    Get all customers using the view
// @route   GET /api/customers
// @access  Public
export const getAllCustomers = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query("SELECT * FROM vw_CustomerSummary");
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting all customers:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get a single customer by ID using the view
// @route   GET /api/customers/:id
// @access  Public
export const getCustomerById = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("CustomerID", sql.Int, req.params.id)
      .query("SELECT * FROM vw_CustomerSummary WHERE CustomerID = @CustomerID");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Error getting customer by ID:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new customer and their first meter
// @route   POST /api/customers
// @access  Public
export const createNewCustomer = async (req, res) => {
  // Get all required fields from the request body
  const {
    CustomerTypeID,
    FirstName,
    LastName,
    NIC,
    ContactNumber,
    Email,
    Address,
    City,
    PostalCode,
    UtilityTypeID,
    MeterNumber,
    InitialReading,
  } = req.body;

  // Basic validation
  if (!FirstName || !LastName || !ContactNumber || !MeterNumber) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const pool = await getConnection();
    const request = pool.request();

    // Add all 12 inputs for the sp_AddNewCustomer stored procedure
    request.input("CustomerTypeID", sql.Int, CustomerTypeID);
    request.input("FirstName", sql.VarChar(100), FirstName);
    request.input("LastName", sql.VarChar(100), LastName);
    request.input("NIC", sql.VarChar(20), NIC);
    request.input("ContactNumber", sql.VarChar(15), ContactNumber);
    request.input("Email", sql.VarChar(100), Email);
    request.input("Address", sql.VarChar(500), Address);
    request.input("City", sql.VarChar(100), City);
    request.input("PostalCode", sql.VarChar(10), PostalCode);
    request.input("UtilityTypeID", sql.Int, UtilityTypeID);
    request.input("MeterNumber", sql.VarChar(50), MeterNumber);
    request.input("InitialReading", sql.Decimal(10, 2), InitialReading);

    const result = await request.execute("sp_AddNewCustomer");

    // The SP returns a success message and IDs
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error("Error creating new customer:", error.message);
    // Handle specific SQL errors, like a duplicate NIC or MeterNumber
    if (error.number === 2627 || error.number === 2601) { // Unique constraint violation
      return res.status(400).json({ message: "Customer with this NIC, Email, or Meter Number already exists." });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update an existing customer
// @route   PUT /api/customers/:id
// @access  Public
export const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const {
    CustomerTypeID,
    FirstName,
    LastName,
    NIC,
    ContactNumber,
    Email,
    Address,
    City,
    PostalCode,
    IsActive,
  } = req.body;

  try {
    const pool = await getConnection();
    const request = pool.request();

    // Add inputs for all fields
    request.input("CustomerID", sql.Int, id);
    request.input("CustomerTypeID", sql.Int, CustomerTypeID);
    request.input("FirstName", sql.VarChar(100), FirstName);
    request.input("LastName", sql.VarChar(100), LastName);
    request.input("NIC", sql.VarChar(20), NIC);
    request.input("ContactNumber", sql.VarChar(15), ContactNumber);
    request.input("Email", sql.VarChar(100), Email);
    request.input("Address", sql.VarChar(500), Address);
    request.input("City", sql.VarChar(100), City);
    request.input("PostalCode", sql.VarChar(10), PostalCode);
    request.input("IsActive", sql.Bit, IsActive);

    // Note: This query updates the Customer table, not the view
    const query = `
      UPDATE Customer SET
        CustomerTypeID = @CustomerTypeID,
        FirstName = @FirstName,
        LastName = @LastName,
        NIC = @NIC,
        ContactNumber = @ContactNumber,
        Email = @Email,
        Address = @Address,
        City = @City,
        PostalCode = @PostalCode,
        IsActive = @IsActive
      WHERE CustomerID = @CustomerID
    `;

    await request.query(query);
    res.status(200).json({ message: "Customer updated successfully" });
  } catch (error) {
    console.error("Error updating customer:", error.message);
    if (error.number === 2627 || error.number === 2601) { // Unique constraint violation
      return res.status(400).json({ message: "This NIC or Email is already in use by another customer." });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Deactivate a customer (Soft Delete)
// @route   DELETE /api/customers/:id
// @access  Public
export const deleteCustomer = async (req, res) => {
  try {
    const pool = await getConnection();
    
    // We don't actually delete the customer, we just set them to inactive.
    // This preserves all their bill and payment history.
    await pool.request()
      .input("CustomerID", sql.Int, req.params.id)
      .query("UPDATE Customer SET IsActive = 0 WHERE CustomerID = @CustomerID");

    res.status(200).json({ message: "Customer deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating customer:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};


// @desc    Get all customer types
// @route   GET /api/customers/types
// @access  Protected
export const getCustomerTypes = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT CustomerTypeID, TypeName FROM CustomerType");
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting customer types:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};