import sql from "mssql";
import { getConnection } from "../config/dbConfig.js";

// @desc    Get all bills (Restricted by UtilityType)
// @route   GET /api/bills
export const getAllBills = async (req, res) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    let query = `
      SELECT 
        b.*, 
        c.FirstName + ' ' + c.LastName AS CustomerName,
        m.MeterNumber,
        ut.UtilityName
      FROM Bill b
      JOIN Customer c ON b.CustomerID = c.CustomerID
      JOIN Meter m ON b.MeterID = m.MeterID
      JOIN UtilityType ut ON m.UtilityTypeID = ut.UtilityTypeID
    `;

    if (req.user && req.user.UtilityTypeID) {
      query += ` WHERE m.UtilityTypeID = @UserUtilityID`;
      request.input("UserUtilityID", sql.Int, req.user.UtilityTypeID);
    }

    query += ` ORDER BY b.GeneratedDate DESC`;

    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting all bills:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single bill by ID (Restricted)
// @route   GET /api/bills/:id
export const getBillById = async (req, res) => {
  try {
    const pool = await getConnection();
    const request = pool.request();

    let query = `
      SELECT 
        b.*, 
        c.FirstName + ' ' + c.LastName AS CustomerName,
        c.Address,
        m.MeterNumber,
        ut.UtilityName,
        ut.Unit
      FROM Bill b
      JOIN Customer c ON b.CustomerID = c.CustomerID
      JOIN Meter m ON b.MeterID = m.MeterID
      JOIN UtilityType ut ON m.UtilityTypeID = ut.UtilityTypeID
      WHERE b.BillID = @BillID
    `;

    if (req.user && req.user.UtilityTypeID) {
      query += ` AND m.UtilityTypeID = @UserUtilityID`;
      request.input("UserUtilityID", sql.Int, req.user.UtilityTypeID);
    }

    request.input("BillID", sql.Int, req.params.id);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Bill not found or access denied" });
    }
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Error getting bill by ID:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get bills for a specific customer (Restricted)
// @route   GET /api/bills/customer/:customerId
// @desc    Get bills for a specific customer (Restricted)
// @route   GET /api/bills/customer/:customerId
export const getBillsByCustomer = async (req, res) => {
  try {
    // --- SECURITY CHECK START ---
    // Place this at the top to fail fast if unauthorized
    if (req.user.RoleName === 'Customer') {
      if (parseInt(req.params.customerId) !== req.user.UserID) {
        return res.status(403).json({ message: "Access denied. You can only view your own bills." });
      }
    }
    // --- SECURITY CHECK END ---

    const pool = await getConnection();
    const request = pool.request();

    let query = `
      SELECT 
        b.BillID, ut.UtilityName, m.MeterNumber, 
        b.BillingPeriodStart, b.BillingPeriodEnd, 
        b.Consumption, b.TotalAmount, b.BillStatus, b.DueDate
      FROM Bill b
      JOIN Meter m ON b.MeterID = m.MeterID
      JOIN UtilityType ut ON m.UtilityTypeID = ut.UtilityTypeID
      WHERE b.CustomerID = @CustomerID
    `;

    // Restriction for Staff (Managers) to only see their utility type
    if (req.user.UtilityTypeID) {
      query += ` AND m.UtilityTypeID = @UserUtilityID`;
      request.input("UserUtilityID", sql.Int, req.user.UtilityTypeID);
    }

    query += ` ORDER BY b.GeneratedDate DESC`;
    request.input("CustomerID", sql.Int, req.params.customerId);

    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting customer bills:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Generate a new bill (Restricted)
// @route   POST /api/bills/generate
export const generateBill = async (req, res) => {
  const { MeterID, ReadingID } = req.body;

  if (!MeterID || !ReadingID) {
    return res.status(400).json({ message: "MeterID and ReadingID are required" });
  }

  try {
    const pool = await getConnection();
    
    // SECURITY CHECK
    if (req.user && req.user.UtilityTypeID) {
      const checkMeter = await pool.request()
        .input("CheckMeterID", sql.Int, MeterID)
        .query("SELECT UtilityTypeID FROM Meter WHERE MeterID = @CheckMeterID");
      
      if (checkMeter.recordset.length === 0) return res.status(404).json({ message: "Meter not found" });

      if (checkMeter.recordset[0].UtilityTypeID !== req.user.UtilityTypeID) {
         return res.status(403).json({ message: "Unauthorized: You cannot generate bills for this utility type." });
      }
    }

    const result = await pool.request()
      .input("MeterID", sql.Int, MeterID)
      .input("ReadingID", sql.Int, ReadingID)
      .execute("sp_GenerateBill");

    res.status(201).json({ 
      message: "Bill generated successfully", 
      billID: result.recordset[0].BillID 
    });
  } catch (error) {
    console.error("Error generating bill:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update overdue status
// @route   PUT /api/bills/update-status
export const updateOverdueStatus = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().execute("sp_UpdateOverdueBills");
    res.status(200).json({ message: "Overdue status updated", affected: result.rowsAffected[0] });
  } catch (error) {
    console.error("Error updating overdue status:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get readings that haven't been billed yet (Restricted)
// @route   GET /api/bills/unbilled-readings
export const getUnbilledReadings = async (req, res) => {
  try {
    const pool = await getConnection();
    const request = pool.request();

    let query = `
      SELECT 
        mr.ReadingID, mr.ReadingDate, mr.CurrentReading, mr.Consumption,
        m.MeterID, m.MeterNumber, 
        c.FirstName + ' ' + c.LastName AS CustomerName,
        ut.UtilityName
      FROM MeterReading mr
      JOIN Meter m ON mr.MeterID = m.MeterID
      JOIN Customer c ON m.CustomerID = c.CustomerID
      JOIN UtilityType ut ON m.UtilityTypeID = ut.UtilityTypeID
      LEFT JOIN Bill b ON mr.ReadingID = b.ReadingID
      WHERE b.BillID IS NULL
    `;

    if (req.user && req.user.UtilityTypeID) {
      query += ` AND m.UtilityTypeID = @UserUtilityID`;
      request.input("UserUtilityID", sql.Int, req.user.UtilityTypeID);
    }

    query += ` ORDER BY mr.ReadingDate DESC`;

    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting unbilled readings:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get unpaid bills (Restricted)
// @route   GET /api/bills/unpaid
export const getUnpaidBills = async (req, res) => {
  try {
    const pool = await getConnection();
    const request = pool.request();

    let query = `
      SELECT 
        b.BillID,
        b.TotalAmount,
        (b.TotalAmount - ISNULL(SUM(p.AmountPaid), 0)) AS RemainingBalance,
        c.FirstName + ' ' + c.LastName AS CustomerName,
        m.MeterNumber,
        ut.UtilityName,
        b.DueDate,
        b.BillStatus
      FROM Bill b
      JOIN Customer c ON b.CustomerID = c.CustomerID
      JOIN Meter m ON b.MeterID = m.MeterID
      JOIN UtilityType ut ON m.UtilityTypeID = ut.UtilityTypeID
      LEFT JOIN Payment p ON b.BillID = p.BillID
      WHERE b.BillStatus IN ('Pending', 'Partial', 'Overdue')
    `;

    if (req.user && req.user.UtilityTypeID) {
      query += ` AND m.UtilityTypeID = @UserUtilityID`;
      request.input("UserUtilityID", sql.Int, req.user.UtilityTypeID);
    }

    query += `
      GROUP BY b.BillID, b.TotalAmount, c.FirstName, c.LastName, m.MeterNumber, b.BillStatus, ut.UtilityName, b.DueDate
      HAVING (b.TotalAmount - ISNULL(SUM(p.AmountPaid), 0)) > 0
      ORDER BY b.BillID DESC
    `;

    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting unpaid bills:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};