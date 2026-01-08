import sql from "mssql";
import { getConnection } from "../config/dbConfig.js";

// @desc    Get dashboard statistics (Restricted)
export const getDashboardStats = async (req, res) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    // Pass the UtilityTypeID from the logged-in user (if it exists)
    if (req.user && req.user.UtilityTypeID) {
      request.input("UtilityTypeID", sql.Int, req.user.UtilityTypeID);
    }

    const result = await request.execute("sp_GetDashboardStats");

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

// @desc    Get monthly revenue data (Restricted)
export const getMonthlyRevenue = async (req, res) => {
  try {
    const pool = await getConnection();
    const request = pool.request();

    let query = `
      SELECT * FROM vw_MonthlyRevenue 
    `;

    // Because 'vw_MonthlyRevenue' is a VIEW, we can't just pass a parameter to it.
    // However, the View has a 'UtilityName' column. 
    // We can join or filter if we map the ID to the Name, OR better yet:
    // Update the query to filter by Name if needed, but since we only have ID in req.user,
    // let's do a join with UtilityType table for security.
    
    query = `
      SELECT v.* FROM vw_MonthlyRevenue v
      JOIN UtilityType u ON v.UtilityName = u.UtilityName
    `;

    if (req.user && req.user.UtilityTypeID) {
      query += ` WHERE u.UtilityTypeID = @UserUtilityID`;
      request.input("UserUtilityID", sql.Int, req.user.UtilityTypeID);
    }

    query += ` ORDER BY v.Year, v.Month`;

    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting monthly revenue:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get top consumers data (Restricted)
export const getTopConsumers = async (req, res) => {
  try {
    const pool = await getConnection();
    const request = pool.request();

    // Similar logic for View
    let query = `
      SELECT TOP 10 v.* FROM vw_TopConsumers v
      JOIN UtilityType u ON v.UtilityName = u.UtilityName
    `;

    if (req.user && req.user.UtilityTypeID) {
      query += ` WHERE u.UtilityTypeID = @UserUtilityID`;
      request.input("UserUtilityID", sql.Int, req.user.UtilityTypeID);
    }

    query += ` ORDER BY v.TotalConsumption DESC`;

    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting top consumers:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Run Revenue by Period Report (Restricted)
export const getRevenueByPeriod = async (req, res) => {
  const { StartDate, EndDate } = req.body;
  if (!StartDate || !EndDate) {
    return res.status(400).json({ message: "StartDate and EndDate are required" });
  }

  try {
    const pool = await getConnection();
    const request = pool.request()
      .input("StartDate", sql.Date, StartDate)
      .input("EndDate", sql.Date, EndDate);

    if (req.user && req.user.UtilityTypeID) {
      request.input("UtilityTypeID", sql.Int, req.user.UtilityTypeID);
    }

    const result = await request.execute("sp_RevenueReportByPeriod");
    
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting revenue report:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Run List Defaulters Report (Restricted)
export const getDefaulters = async (req, res) => {
  const { DaysOverdue } = req.body;
  if (DaysOverdue === undefined) {
    return res.status(400).json({ message: "DaysOverdue is required" });
  }

  try {
    const pool = await getConnection();
    const request = pool.request()
      .input("DaysOverdue", sql.Int, DaysOverdue);

    if (req.user && req.user.UtilityTypeID) {
      request.input("UtilityTypeID", sql.Int, req.user.UtilityTypeID);
    }

    const result = await request.execute("sp_ListDefaulters");
    
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting defaulters report:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};