import sql from "mssql";
import { getConnection } from "../config/dbConfig.js";

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Protected (Admin sees all, Staff sees relevant utility complaints)
export const getAllComplaints = async (req, res) => {
  try {
    const pool = await getConnection();
    const request = pool.request();

    let query = `
      SELECT 
        cp.*,
        c.FirstName + ' ' + c.LastName AS CustomerName,
        c.ContactNumber,
        c.Email
      FROM Complaint cp
      JOIN Customer c ON cp.CustomerID = c.CustomerID
    `;

    // RESTRICTION:
    // If logged in as Manager/Clerk, only show complaints for customers 
    // who have a meter in their specific utility.
    if (req.user && req.user.UtilityTypeID) {
      query += `
        JOIN Meter m ON c.CustomerID = m.CustomerID
        WHERE m.UtilityTypeID = @UserUtilityID
      `;
      request.input("UserUtilityID", sql.Int, req.user.UtilityTypeID);
    }

    query += ` ORDER BY cp.ComplaintDate DESC`;

    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting complaints:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single complaint by ID
// @route   GET /api/complaints/:id
// @access  Protected
export const getComplaintById = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("ComplaintID", sql.Int, req.params.id)
      .query(`
        SELECT 
          cp.*,
          c.FirstName + ' ' + c.LastName AS CustomerName,
          c.Address,
          c.ContactNumber
        FROM Complaint cp
        JOIN Customer c ON cp.CustomerID = c.CustomerID
        WHERE cp.ComplaintID = @ComplaintID
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Complaint not found" });
    }
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Error getting complaint:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Protected
export const createComplaint = async (req, res) => {
  const { CustomerID, ComplaintType, Description, AssignedTo } = req.body;

  if (!CustomerID || !ComplaintType || !Description) {
    return res.status(400).json({ message: "CustomerID, Type, and Description are required" });
  }

  try {
    const pool = await getConnection();
    await pool.request()
      .input("CustomerID", sql.Int, CustomerID)
      .input("ComplaintType", sql.VarChar(100), ComplaintType)
      .input("Description", sql.VarChar(1000), Description)
      .input("AssignedTo", sql.VarChar(100), AssignedTo || 'Pending Assignment')
      .query(`
        INSERT INTO Complaint (CustomerID, ComplaintType, Description, Status, AssignedTo, ComplaintDate)
        VALUES (@CustomerID, @ComplaintType, @Description, 'Open', @AssignedTo, GETDATE())
      `);

    res.status(201).json({ message: "Complaint submitted successfully" });
  } catch (error) {
    console.error("Error creating complaint:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update complaint status (Resolve/Close)
// @route   PUT /api/complaints/:id
// @access  Admin/Manager
export const updateComplaintStatus = async (req, res) => {
  const { Status, Resolution, AssignedTo } = req.body;
  const { id } = req.params;

  try {
    const pool = await getConnection();
    const request = pool.request()
      .input("ComplaintID", sql.Int, id)
      .input("Status", sql.VarChar(50), Status)
      .input("Resolution", sql.VarChar(1000), Resolution)
      .input("AssignedTo", sql.VarChar(100), AssignedTo);

    let query = `
      UPDATE Complaint 
      SET Status = @Status, 
          AssignedTo = ISNULL(@AssignedTo, AssignedTo)
    `;

    // If resolving, set the date
    if (Status === 'Resolved' || Status === 'Closed') {
      query += `, ResolvedDate = GETDATE(), Resolution = @Resolution`;
    }

    query += ` WHERE ComplaintID = @ComplaintID`;

    await request.query(query);
    res.status(200).json({ message: "Complaint updated successfully" });
  } catch (error) {
    console.error("Error updating complaint:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};