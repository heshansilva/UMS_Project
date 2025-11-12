import sql from "mssql";
import { getConnection } from "../config/dbConfig.js";

// @desc    Get all bills
export const getAllBills = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        b.*, 
        c.FirstName + ' ' + c.LastName AS CustomerName,
        m.MeterNumber,
        ut.UtilityName
      FROM Bill b
      JOIN Customer c ON b.CustomerID = c.CustomerID
      JOIN Meter m ON b.MeterID = m.MeterID
      JOIN UtilityType ut ON m.UtilityTypeID = ut.UtilityTypeID
      ORDER BY b.GeneratedDate DESC
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting all bills:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get a single bill by ID
export const getBillById = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("BillID", sql.Int, req.params.id)
      .query(`
        SELECT 
          b.*, 
          c.FirstName + ' ' + c.LastName AS CustomerName,
          c.Address, c.ContactNumber,
          m.MeterNumber,
          ut.UtilityName, ut.Unit,
          r.CurrentReading, r.PreviousReading
        FROM Bill b
        JOIN Customer c ON b.CustomerID = c.CustomerID
        JOIN Meter m ON b.MeterID = m.MeterID
        JOIN UtilityType ut ON m.UtilityTypeID = ut.UtilityTypeID
        LEFT JOIN MeterReading r ON b.ReadingID = r.ReadingID
        WHERE b.BillID = @BillID
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Bill not found" });
    }
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Error getting bill by ID:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all bills for a specific customer
export const getBillsByCustomer = async (req, res) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input("CustomerID", sql.Int, req.params.customerId);

    // Call your stored procedure
    const result = await request.execute("sp_GetCustomerBillHistory");
    
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting customer bill history:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Generate a new bill
export const generateBill = async (req, res) => {
  const { MeterID, ReadingID } = req.body;

  if (!MeterID || !ReadingID) {
    return res.status(400).json({ message: "MeterID and ReadingID are required" });
  }

  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input("MeterID", sql.Int, MeterID);
    request.input("ReadingID", sql.Int, ReadingID);

    // Call your stored procedure
    // We added the transaction to this SP in our previous discussion
    const result = await request.execute("sp_GenerateBill");

    if (result.recordset[0].ErrorMessage) {
        // Handle errors returned from the CATCH block
        return res.status(500).json({ message: result.recordset[0].ErrorMessage });
    }

    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error("Error generating bill:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Run the batch job to update overdue bills
export const updateOverdueStatus = async (req, res) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    // Call your stored procedure
    const result = await request.execute("sp_UpdateOverdueBills");

    res.status(200).json({ 
        message: "Overdue bill statuses updated successfully",
        updatedBills: result.recordset[0].UpdatedBills 
    });
  } catch (error) {
    console.error("Error updating overdue bills:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUnbilledReadings = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        mr.ReadingID, 
        mr.MeterID, 
        m.MeterNumber, 
        c.FirstName + ' ' + c.LastName AS CustomerName,
        mr.ReadingDate,
        mr.Consumption,
        ut.Unit
      FROM MeterReading mr
      JOIN Meter m ON mr.MeterID = m.MeterID
      JOIN Customer c ON m.CustomerID = c.CustomerID
      JOIN UtilityType ut ON m.UtilityTypeID = ut.UtilityTypeID
      WHERE mr.ReadingID NOT IN (
        SELECT ReadingID FROM Bill WHERE ReadingID IS NOT NULL
      )
      ORDER BY mr.ReadingDate DESC
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting unbilled readings:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all unpaid bills
export const getUnpaidBills = async (req, res) => { // <-- MAKE SURE 'export' IS HERE
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        b.BillID,
        b.TotalAmount,
        (b.TotalAmount - ISNULL(SUM(p.AmountPaid), 0)) AS RemainingBalance,
        c.FirstName + ' ' + c.LastName AS CustomerName,
        m.MeterNumber
      FROM Bill b
      JOIN Customer c ON b.CustomerID = c.CustomerID
      JOIN Meter m ON b.MeterID = m.MeterID
      LEFT JOIN Payment p ON b.BillID = p.BillID
      WHERE b.BillStatus IN ('Pending', 'Partial', 'Overdue')
      GROUP BY b.BillID, b.TotalAmount, c.FirstName, c.LastName, m.MeterNumber, b.BillStatus
      HAVING (b.TotalAmount - ISNULL(SUM(p.AmountPaid), 0)) > 0
      ORDER BY b.BillID DESC
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting unpaid bills:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};