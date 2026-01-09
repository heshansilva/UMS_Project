import sql from "mssql";
import { getConnection } from "../config/dbConfig.js";

// @desc    Get all meters
// @route   GET /api/meters
// @access  Public
// @desc    Get all meters (Restricted by UtilityType for Staff)
export const getAllMeters = async (req, res) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    let query = `
      SELECT 
        m.*, 
        c.FirstName + ' ' + c.LastName AS CustomerName,
        ut.UtilityName,
        ut.Unit
      FROM Meter m
      JOIN Customer c ON m.CustomerID = c.CustomerID
      JOIN UtilityType ut ON m.UtilityTypeID = ut.UtilityTypeID
    `;

    // RESTRICTION LOGIC:
    // If the user has a specific UtilityTypeID, filter the results.
    if (req.user.UtilityTypeID) {
      query += ` WHERE m.UtilityTypeID = @UserUtilityID`;
      request.input("UserUtilityID", sql.Int, req.user.UtilityTypeID);
    }

    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting all meters:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get a single meter by ID
// @route   GET /api/meters/:id
// @access  Public
export const getMeterById = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("MeterID", sql.Int, req.params.id)
      .query(`
        SELECT 
          m.*, 
          c.FirstName + ' ' + c.LastName AS CustomerName,
          c.ContactNumber,
          c.Address,
          ut.UtilityName,
          ut.Unit
        FROM Meter m
        JOIN Customer c ON m.CustomerID = c.CustomerID
        JOIN UtilityType ut ON m.UtilityTypeID = ut.UtilityTypeID
        WHERE m.MeterID = @MeterID
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Meter not found" });
    }
    res.status(200).json(result.recordset[0]);
  } catch (error)
 {
    console.error("Error getting meter by ID:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Insert a new meter reading (Restricted by UtilityType)
// @route   POST /api/meters/reading
// @access  Protected (Meter Readers)
export const addNewReading = async (req, res) => {
  const { MeterID, ReadingDate, CurrentReading, ReadingTakenBy, Notes } = req.body;

  if (!MeterID || !ReadingDate || !CurrentReading) {
    return res.status(400).json({ message: "MeterID, ReadingDate, and CurrentReading are required" });
  }

  try {
    const pool = await getConnection();
    
    // SECURITY CHECK: 
    // Verify that this Meter belongs to the User's Utility Type
    if (req.user && req.user.UtilityTypeID) {
      const checkMeter = await pool.request()
        .input("CheckMeterID", sql.Int, MeterID)
        .query("SELECT UtilityTypeID FROM Meter WHERE MeterID = @CheckMeterID");
      
      if (checkMeter.recordset.length === 0) {
         return res.status(404).json({ message: "Meter not found" });
      }

      if (checkMeter.recordset[0].UtilityTypeID !== req.user.UtilityTypeID) {
         return res.status(403).json({ message: "You are not authorized to add readings for this utility type." });
      }
    }

    // 1. Get the *actual* previous reading from the database
    const lastReadingResult = await pool.request()
      .input("MeterID", sql.Int, MeterID)
      .query(`
        SELECT TOP 1 CurrentReading 
        FROM MeterReading 
        WHERE MeterID = @MeterID 
        ORDER BY ReadingDate DESC, ReadingID DESC
      `);

    let previousReading = 0;
    if (lastReadingResult.recordset.length > 0) {
      previousReading = lastReadingResult.recordset[0].CurrentReading;
    } else {
      // If no readings, get InitialReading from Meter table
      const meterResult = await pool.request()
        .input("MeterID_Init", sql.Int, MeterID) // Changed param name to avoid conflict
        .query("SELECT InitialReading FROM Meter WHERE MeterID = @MeterID_Init");
      if (meterResult.recordset.length > 0) {
        previousReading = meterResult.recordset[0].InitialReading;
      }
    }

    // 2. Insert the new reading.
    await pool.request()
      .input("MeterID", sql.Int, MeterID)
      .input("ReadingDate", sql.Date, ReadingDate)
      .input("CurrentReading", sql.Decimal(10, 2), CurrentReading)
      .input("PreviousReading", sql.Decimal(10, 2), previousReading)
      .input("ReadingTakenBy", sql.VarChar(100), ReadingTakenBy)
      .input("Notes", sql.VarChar(500), Notes)
      .query(`
        INSERT INTO MeterReading (MeterID, ReadingDate, CurrentReading, PreviousReading, ReadingTakenBy, Notes)
        VALUES (@MeterID, @ReadingDate, @CurrentReading, @PreviousReading, @ReadingTakenBy, @Notes)
      `);

    res.status(201).json({ message: "Meter reading added successfully. Consumption calculated by trigger." });
  } catch (error) {
    console.error("Error adding meter reading:", error.message);
    if (error.number === 547) { 
      return res.status(400).json({ message: "Error: Current reading cannot be less than the previous reading." });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get reading history for a meter
// @route   GET /api/meters/:id/readings
// @access  Public
export const getMeterReadingHistory = async (req, res) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input("MeterID", sql.Int, req.params.id);
    
    // Call the stored procedure
    const result = await request.execute("sp_GetMeterReadingHistory");

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting meter reading history:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all utility types
// @route   GET /api/meters/types
// @access  Protected
export const getUtilityTypes = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT UtilityTypeID, UtilityName FROM UtilityType");
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting utility types:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all meters for a specific customer
// @route   GET /api/meters/customer/:id
// @access  Protected
export const getMetersByCustomer = async (req, res) => {
  try {
    // --- SECURITY CHECK START ---
    // If the logged-in user is a Customer, ensure they are requesting THEIR OWN ID.
    if (req.user.RoleName === 'Customer') {
      if (parseInt(req.params.id) !== req.user.UserID) {
        return res.status(403).json({ message: "Access denied. You can only view your own meters." });
      }
    }
    // --- SECURITY CHECK END ---

    const pool = await getConnection();
    const result = await pool.request()
      .input("CustomerID", sql.Int, req.params.id)
      .query(`
        SELECT 
          m.MeterID, m.MeterNumber, m.MeterStatus, m.InstallationDate,
          ut.UtilityName, ut.Unit
        FROM Meter m
        JOIN UtilityType ut ON m.UtilityTypeID = ut.UtilityTypeID
        WHERE m.CustomerID = @CustomerID
        ORDER BY ut.UtilityName
      `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting customer meters:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};