import sql from "mssql";
import { getConnection } from "../config/dbConfig.js";

// @desc    Get all tariff plans
// @route   GET /api/tariffs
// @access  Admin
export const getAllTariffs = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT T.*, U.UtilityName, U.Unit 
      FROM TariffPlan T
      JOIN UtilityType U ON T.UtilityTypeID = U.UtilityTypeID
      ORDER BY U.UtilityName, T.MinUnits
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error getting tariffs:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new tariff plan
// @route   POST /api/tariffs
// @access  Admin
export const createTariff = async (req, res) => {
  const { UtilityTypeID, PlanName, MinUnits, MaxUnits, RatePerUnit, FixedCharge, EffectiveFromDate } = req.body;

  if (!UtilityTypeID || !PlanName || MinUnits === undefined || !RatePerUnit || !EffectiveFromDate) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }

  try {
    const pool = await getConnection();
    await pool.request()
      .input("UtilityTypeID", sql.Int, UtilityTypeID)
      .input("PlanName", sql.VarChar(100), PlanName)
      .input("MinUnits", sql.Decimal(10, 2), MinUnits)
      .input("MaxUnits", sql.Decimal(10, 2), MaxUnits) // Can be null
      .input("RatePerUnit", sql.Decimal(10, 2), RatePerUnit)
      .input("FixedCharge", sql.Decimal(10, 2), FixedCharge)
      .input("EffectiveFromDate", sql.Date, EffectiveFromDate)
      .query(`
        INSERT INTO TariffPlan (UtilityTypeID, PlanName, MinUnits, MaxUnits, RatePerUnit, FixedCharge, EffectiveFromDate, IsActive)
        VALUES (@UtilityTypeID, @PlanName, @MinUnits, @MaxUnits, @RatePerUnit, @FixedCharge, @EffectiveFromDate, 1)
      `);
    res.status(201).json({ message: "Tariff plan created successfully" });
  } catch (error) {
    console.error("Error creating tariff:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a tariff plan
// @route   PUT /api/tariffs/:id
// @access  Admin
export const updateTariff = async (req, res) => {
  const { id } = req.params;
  const { PlanName, MinUnits, MaxUnits, RatePerUnit, FixedCharge, IsActive } = req.body;

  try {
    const pool = await getConnection();
    await pool.request()
      .input("TariffID", sql.Int, id)
      .input("PlanName", sql.VarChar(100), PlanName)
      .input("MinUnits", sql.Decimal(10, 2), MinUnits)
      .input("MaxUnits", sql.Decimal(10, 2), MaxUnits)
      .input("RatePerUnit", sql.Decimal(10, 2), RatePerUnit)
      .input("FixedCharge", sql.Decimal(10, 2), FixedCharge)
      .input("IsActive", sql.Bit, IsActive)
      .query(`
        UPDATE TariffPlan SET
          PlanName = @PlanName,
          MinUnits = @MinUnits,
          MaxUnits = @MaxUnits,
          RatePerUnit = @RatePerUnit,
          FixedCharge = @FixedCharge,
          IsActive = @IsActive
        WHERE TariffID = @TariffID
      `);
    res.status(200).json({ message: "Tariff plan updated successfully" });
  } catch (error) {
    console.error("Error updating tariff:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a tariff plan
// @route   DELETE /api/tariffs/:id
// @access  Admin
export const deleteTariff = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getConnection();
    await pool.request()
      .input("TariffID", sql.Int, id)
      .query("DELETE FROM TariffPlan WHERE TariffID = @TariffID");
    res.status(200).json({ message: "Tariff plan deleted successfully" });
  } catch (error) {
    // Handle foreign key constraint errors
    if (error.number === 547) {
      return res.status(400).json({ message: "Cannot delete tariff. It may be associated with existing bills." });
    }
    console.error("Error deleting tariff:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};