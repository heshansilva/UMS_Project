import sql from "mssql";
import { getConnection } from "../config/dbConfig.js";

// @desc    Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    // Execute the stored procedure
    const result = await request.execute("sp_GetDashboardStats");

    // Your SP returns 6 separate SELECT statements.
    // The mssql package returns these in an array called `recordsets`.
    const stats = {
      totalCustomers: result.recordsets[0][0].TotalCustomers,
      totalActiveMeters: result.recordsets[1][0].TotalActiveMeters,
      totalOutstanding: result.recordsets[2][0].TotalOutstanding,
      monthlyRevenue: result.recordsets[3][0].MonthlyRevenue,
      pendingBills: result.recordsets[4][0].PendingBills,
      openComplaints: result.recordsets[5][0].OpenComplaints,
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error getting dashboard stats:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get monthly revenue data
export const getMonthlyRevenue = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT * FROM vw_MonthlyRevenue ORDER BY Year, Month
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting monthly revenue:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get top consumers data
export const getTopConsumers = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT TOP 10 * FROM vw_TopConsumers ORDER BY TotalConsumption DESC
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting top consumers:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Run Revenue by Period Report
export const getRevenueByPeriod = async (req, res) => {
  const { StartDate, EndDate } = req.body;
  if (!StartDate || !EndDate) {
    return res.status(400).json({ message: "StartDate and EndDate are required" });
  }

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("StartDate", sql.Date, StartDate)
      .input("EndDate", sql.Date, EndDate)
      .execute("sp_RevenueReportByPeriod");
    
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting revenue report:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Run List Defaulters Report
export const getDefaulters = async (req, res) => {
  const { DaysOverdue } = req.body;
  if (DaysOverdue === undefined) {
    return res.status(400).json({ message: "DaysOverdue is required" });
  }

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("DaysOverdue", sql.Int, DaysOverdue)
      .execute("sp_ListDefaulters");
    
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting defaulters report:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};