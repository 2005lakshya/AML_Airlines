import { queryDatabase } from "@/lib/server-utils";
import sql from 'mssql';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// Helper to create a unique 10-digit numeric code
function generateRedemptionCode() {
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += Math.floor(Math.random() * 10);
  }
  // Ensure the first digit isn't 0
  if (code[0] === '0') code = String((Math.floor(Math.random() * 9) + 1)) + code.slice(1);
  return code;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    // Fetch current points from Users table
    const pointsRows = await queryDatabase(
      `SELECT LoyaltyPoints FROM Users WHERE UserID = @userId`,
      [{ name: 'userId', value: parseInt(userId, 10), type: sql.Int }]
    );
    const currentPoints = (pointsRows && pointsRows[0] && (pointsRows[0].LoyaltyPoints ?? pointsRows[0].loyaltypoints)) || 0;

    // Fetch transactions joined with optional booking context
    const transactions = await queryDatabase(
      `SELECT 
        lt.TransactionID, 
        lt.UserID, 
        lt.BookingID, 
        lt.PointsEarned, 
        lt.TransactionType, 
        lt.TransactionDate,
        b.PNR,
        b.Origin,
        b.Destination,
        b.TravelDate
      FROM LoyaltyTransactions lt
      LEFT JOIN Bookings b ON lt.BookingID = b.BookingID
      WHERE lt.UserID = @userId
      ORDER BY lt.TransactionDate DESC`,
      [{ name: 'userId', value: parseInt(userId, 10), type: sql.Int }]
    );
    
    return Response.json({ success: true, points: currentPoints, transactions });
  } catch (error) {
    console.error("Error fetching loyalty transactions:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, userId } = body || {};

    if (!userId) {
      return Response.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    // Handle redemption action: deduct points and create a negative transaction
    if (action === 'redeem') {
      const { points, rewardName } = body;
      const redeemPoints = parseInt(points, 10);
      if (!redeemPoints || redeemPoints <= 0) {
        return Response.json({ success: false, error: "points must be a positive integer" }, { status: 400 });
      }

      // Get current user's points
      const rows = await queryDatabase(
        `SELECT LoyaltyPoints FROM Users WHERE UserID = @userId`,
        [{ name: 'userId', value: parseInt(userId, 10), type: sql.Int }]
      );
      const currentPoints = (rows && rows[0] && (rows[0].LoyaltyPoints ?? rows[0].loyaltypoints)) || 0;
      if (currentPoints < redeemPoints) {
        return Response.json({ success: false, error: "Insufficient points" }, { status: 400 });
      }

      const newPoints = currentPoints - redeemPoints;

      // Update user's points
      await queryDatabase(
        `UPDATE Users SET LoyaltyPoints = @newPoints WHERE UserID = @userId`,
        [
          { name: 'newPoints', value: newPoints, type: sql.Int },
          { name: 'userId', value: parseInt(userId, 10), type: sql.Int }
        ]
      );

      // Insert a redemption transaction (negative points)
      await queryDatabase(
        `INSERT INTO LoyaltyTransactions (UserID, BookingID, PointsEarned, TransactionType, TransactionDate)
         VALUES (@userId, NULL, @pointsEarned, @transactionType, GETDATE())`,
        [
          { name: 'userId', value: parseInt(userId, 10), type: sql.Int },
          { name: 'pointsEarned', value: -Math.abs(redeemPoints), type: sql.Int },
          { name: 'transactionType', value: 'REDEEM', type: sql.VarChar(50) }
        ]
      );

      // Generate a unique 10-digit code to show to the user
      const code = generateRedemptionCode();

      return Response.json({ success: true, message: 'Redeemed successfully', code, newPoints, rewardName: rewardName || null });
    }

    // Fallback: allow recording a generic transaction and updating points if a positive/negative points value is provided
    const { points, type } = body;
    if (!points) {
      return Response.json({ success: false, error: "Missing required field: points" }, { status: 400 });
    }

    const delta = parseInt(points, 10);
    if (!Number.isFinite(delta) || delta === 0) {
      return Response.json({ success: false, error: "points must be a non-zero integer" }, { status: 400 });
    }

    // Update user's points accordingly
    const current = await queryDatabase(
      `SELECT LoyaltyPoints FROM Users WHERE UserID = @userId`,
      [{ name: 'userId', value: parseInt(userId, 10), type: sql.Int }]
    );
    const currentPts = (current && current[0] && (current[0].LoyaltyPoints ?? current[0].loyaltypoints)) || 0;
    const updated = currentPts + delta;
    if (updated < 0) {
      return Response.json({ success: false, error: "Resulting points would be negative" }, { status: 400 });
    }

    await queryDatabase(
      `UPDATE Users SET LoyaltyPoints = @newPoints WHERE UserID = @userId`,
      [
        { name: 'newPoints', value: updated, type: sql.Int },
        { name: 'userId', value: parseInt(userId, 10), type: sql.Int }
      ]
    );

    await queryDatabase(
      `INSERT INTO LoyaltyTransactions (UserID, BookingID, PointsEarned, TransactionType, TransactionDate)
       VALUES (@userId, NULL, @pointsEarned, @transactionType, GETDATE())`,
      [
        { name: 'userId', value: parseInt(userId, 10), type: sql.Int },
        { name: 'pointsEarned', value: delta, type: sql.Int },
        { name: 'transactionType', value: type || (delta > 0 ? 'MANUAL_EARN' : 'ADJUSTMENT'), type: sql.VarChar(50) }
      ]
    );

    return Response.json({ success: true, message: "Loyalty transaction recorded successfully", newPoints: updated });
  } catch (error) {
    console.error("Error recording loyalty transaction:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}