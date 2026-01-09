import sql from "mssql";
import { getConnection } from "../config/dbConfig.js";

// @desc    Get all payments
// @route   GET /api/payments
// @access  Public
// @desc    Get all payments (Restricted by UtilityType for Staff)
export const getAllPayments = async (req, res) => {
  try {
    const pool = await getConnection();
    const request = pool.request();

    // We join Bill -> Meter -> UtilityType to filter by ID
    let query = `
      SELECT 
        p.*,
        c.FirstName + ' ' + c.LastName AS CustomerName,
        b.TotalAmount AS BillAmount,
        ut.UtilityName
      FROM Payment p
      JOIN Customer c ON p.CustomerID = c.CustomerID
      JOIN Bill b ON p.BillID = b.BillID
      JOIN Meter m ON b.MeterID = m.MeterID
      JOIN UtilityType ut ON m.UtilityTypeID = ut.UtilityTypeID
    `;

    // RESTRICTION: Filter by Staff Utility
    if (req.user && req.user.UtilityTypeID) {
      query += ` WHERE m.UtilityTypeID = @UserUtilityID`;
      request.input("UserUtilityID", sql.Int, req.user.UtilityTypeID);
    }

    query += ` ORDER BY p.PaymentDate DESC`;

    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting all payments:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all payments for a specific customer
// @route   GET /api/payments/customer/:id
// @access  Public (Protected by Token)
export const getPaymentsByCustomer = async (req, res) => {
  try {
    // --- SECURITY CHECK START ---
    // If the user is a Customer, they can ONLY view their own ID
    if (req.user.RoleName === 'Customer') {
      if (parseInt(req.params.id) !== req.user.UserID) {
        return res.status(403).json({ message: "Access denied. You can only view your own payments." });
      }
    }
    // --- SECURITY CHECK END ---

    const pool = await getConnection();
    const result = await pool.request()
      .input("CustomerID", sql.Int, req.params.id)
      .query(`
        SELECT 
          p.*,
          b.TotalAmount AS BillAmount,
          b.BillingPeriodEnd
        FROM Payment p
        JOIN Bill b ON p.BillID = b.BillID
        WHERE p.CustomerID = @CustomerID
        ORDER BY p.PaymentDate DESC
      `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting customer payments:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Process a new payment
// @route   POST /api/payments/process
// @access  Public
export const processPayment = async (req, res) => {
  const { BillID, AmountPaid, PaymentMethod, ProcessedBy, TransactionRef } = req.body;

  if (!BillID || !AmountPaid || !PaymentMethod) {
    return res.status(400).json({ message: "BillID, AmountPaid, and PaymentMethod are required" });
  }

  // We should add transaction handling to sp_ProcessPayment as well
  // For now, we'll call it as-is
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input("BillID", sql.Int, BillID);
    request.input("AmountPaid", sql.Decimal(10, 2), AmountPaid);
    request.input("PaymentMethod", sql.VarChar(50), PaymentMethod);
    request.input("ProcessedBy", sql.VarChar(100), ProcessedBy);
    request.input("TransactionRef", sql.VarChar(100), TransactionRef);

    // Call your stored procedure
    const result = await request.execute("sp_ProcessPayment");

    // Check for errors returned by the SP
    if (result.recordset[0].Error) {
        return res.status(400).json({ message: result.recordset[0].Error });
    }

    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error("Error processing payment:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a payment
// @route   DELETE /api/payments/:id
// @access  Admin
export const deletePayment = async (req, res) => {
  try {
    const pool = await getConnection();
    
    // The trg_HandleDeletePayment trigger will automatically
    // update the Bill status and OutstandingBalance.
    await pool.request()
      .input("PaymentID", sql.Int, req.params.id)
      .query("DELETE FROM Payment WHERE PaymentID = @PaymentID");

    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment:", error.message);
    // Handle potential foreign key issues if trigger fails
    if (error.number === 547) {
      return res.status(400).json({ message: "Error deleting payment. Related records might be locked." });
    }
    res.status(500).json({ message: "Server error" });
  }
};