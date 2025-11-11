import { queryDatabase } from "@/lib/server-utils";
import sql from 'mssql';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      userId, // nullable
      contactInfo, // { email, phone }
      passengers, // array
      flight, // object
      pnr,
      reference,
      bookingDate,
      selectedSeats,
      extraServices,
      costs
    } = body;

    // Guest info fallback
    const guestName = passengers && passengers[0] ? `${passengers[0].firstName} ${passengers[0].lastName}` : null;
    const guestEmail = contactInfo?.email || null;
    const guestPhone = contactInfo?.phone || null;

    // Insert into Bookings
    const bookingInsert = await queryDatabase(
      `INSERT INTO Bookings (
        UserID, GuestName, GuestEmail, GuestPhone, AmadeusOfferID, BookingReference, PNR, BookingDate, TotalPrice, Currency,
        PaymentStatus, TravelClass, PriorityService, ExtraLuggage, Origin, Destination, FlightNo, TravelDate, DepartureTime, ArrivalTime,
        Duration, StopoverLocation, StopoverDuration, BaseFare, Tax, PriorityFare, MealCharge, ExtraLuggageCharge, SeatCharge
      ) OUTPUT INSERTED.BookingID VALUES (
        @userId, @guestName, @guestEmail, @guestPhone, @amadeusOfferId, @bookingReference, @pnr, @bookingDate, @totalPrice, @currency,
        @paymentStatus, @travelClass, @priorityService, @extraLuggage, @origin, @destination, @flightNo, @travelDate, @departureTime, @arrivalTime,
        @duration, @stopoverLocation, @stopoverDuration, @baseFare, @tax, @priorityFare, @mealCharge, @extraLuggageCharge, @seatCharge
      )`,
      [
        { name: 'userId', value: userId || null, type: sql.Int },
        { name: 'guestName', value: guestName, type: sql.NVarChar },
        { name: 'guestEmail', value: guestEmail, type: sql.NVarChar },
        { name: 'guestPhone', value: guestPhone, type: sql.NVarChar },
        { name: 'amadeusOfferId', value: flight?.amadeusOfferId || '', type: sql.NVarChar },
        { name: 'bookingReference', value: reference, type: sql.NVarChar },
        { name: 'pnr', value: pnr, type: sql.NVarChar },
        { name: 'bookingDate', value: bookingDate, type: sql.DateTime },
        { name: 'totalPrice', value: costs?.total || 0, type: sql.Decimal(10,2) },
        { name: 'currency', value: 'INR', type: sql.Char(3) },
        { name: 'paymentStatus', value: 'Paid', type: sql.NVarChar },
        { name: 'travelClass', value: flight?.class || 'Economy', type: sql.NVarChar },
        { name: 'priorityService', value: extraServices?.priorityBoarding ? 1 : 0, type: sql.Bit },
        { name: 'extraLuggage', value: extraServices?.extraLuggage > 0 ? 1 : 0, type: sql.Bit },
        { name: 'origin', value: flight?.from, type: sql.NVarChar },
        { name: 'destination', value: flight?.to, type: sql.NVarChar },
        { name: 'flightNo', value: flight?.number || flight?.fullNumber || '', type: sql.NVarChar },
        { name: 'travelDate', value: flight?.date || null, type: sql.Date },
        { name: 'departureTime', value: flight?.departureAtFull || null, type: sql.DateTime },
        { name: 'arrivalTime', value: flight?.arrivalAtFull || null, type: sql.DateTime },
        { name: 'duration', value: flight?.durationMins ? `${flight.durationMins} min` : null, type: sql.NVarChar },
        { name: 'stopoverLocation', value: flight?.stopovers?.[0]?.airport || null, type: sql.NVarChar },
        { name: 'stopoverDuration', value: flight?.stopovers?.[0]?.duration ? `${flight.stopovers[0].duration} min` : null, type: sql.NVarChar },
        { name: 'baseFare', value: costs?.baseFare || 0, type: sql.Decimal(10,2) },
        { name: 'tax', value: costs?.taxes || 0, type: sql.Decimal(10,2) },
        { name: 'priorityFare', value: costs?.services?.boarding || 0, type: sql.Decimal(10,2) },
        { name: 'mealCharge', value: costs?.services?.meals || 0, type: sql.Decimal(10,2) },
        { name: 'extraLuggageCharge', value: costs?.services?.luggage || 0, type: sql.Decimal(10,2) },
        { name: 'seatCharge', value: costs?.seatUpgrade || 0, type: sql.Decimal(10,2) },
      ]
    );
    const bookingId = bookingInsert[0]?.BookingID;

    // Calculate and award loyalty points if user is logged in and uses FFN
    let loyaltyPointsEarned = 0;
    if (userId && passengers && passengers.length > 0) {
      // Check if any passenger used a Frequent Flyer Number
      for (const p of passengers) {
        if (p.frequentFlyerNumber) {
          // Verify this FFN belongs to the logged-in user
          const userCheck = await queryDatabase(
            `SELECT UserID, FrequentFlyerNumber, LoyaltyPoints FROM Users WHERE UserID = @userId`,
            [{ name: 'userId', value: userId, type: sql.Int }]
          );
          
          if (userCheck && userCheck.length > 0) {
            const user = userCheck[0];
            const userFFN = user.FrequentFlyerNumber || user.frequentflyernumber;
            
            // Only award points if passenger FFN matches user's FFN
            if (userFFN && userFFN === p.frequentFlyerNumber) {
              // Formula: 1 point for every ₹200 spent
              const totalSpent = costs?.total || 0;
              const pointsEarned = Math.floor(totalSpent / 200);
              loyaltyPointsEarned = pointsEarned;
              
              if (pointsEarned > 0) {
                // Update user's loyalty points
                const currentPoints = user.LoyaltyPoints || user.loyaltypoints || 0;
                const newPoints = currentPoints + pointsEarned;
                
                await queryDatabase(
                  `UPDATE Users SET LoyaltyPoints = @newPoints WHERE UserID = @userId`,
                  [
                    { name: 'newPoints', value: newPoints, type: sql.Int },
                    { name: 'userId', value: userId, type: sql.Int }
                  ]
                );
                
                // Insert loyalty transaction record
                await queryDatabase(
                  `INSERT INTO LoyaltyTransactions (UserID, BookingID, PointsEarned, TransactionType, TransactionDate)
                   VALUES (@userId, @bookingId, @pointsEarned, @transactionType, GETDATE())`,
                  [
                    { name: 'userId', value: userId, type: sql.Int },
                    { name: 'bookingId', value: bookingId, type: sql.Int },
                    { name: 'pointsEarned', value: pointsEarned, type: sql.Int },
                    { name: 'transactionType', value: 'BOOKING_EARNED', type: sql.VarChar(50) }
                  ]
                );
              }
              
              // Break after finding matching FFN (only award once per booking)
              break;
            }
          }
        }
      }
    }

    // Insert passengers
    for (const p of passengers) {
      await queryDatabase(
        `INSERT INTO Passengers (
          BookingID, FirstName, LastName, DateOfBirth, Gender, DocumentType, DocumentNumber, WheelchairRequired, SeatNumber, MealType
        ) VALUES (
          @bookingId, @firstName, @lastName, @dob, @gender, @docType, @docNum, @wheelchair, @seat, @meal
        )`,
        [
          { name: 'bookingId', value: bookingId, type: sql.Int },
          { name: 'firstName', value: p.firstName, type: sql.NVarChar },
          { name: 'lastName', value: p.lastName, type: sql.NVarChar },
          { name: 'dob', value: p.dateOfBirth, type: sql.Date },
          { name: 'gender', value: p.gender, type: sql.NVarChar },
          { name: 'docType', value: p.idType, type: sql.NVarChar },
          { name: 'docNum', value: p.idNumber, type: sql.NVarChar },
          { name: 'wheelchair', value: p.wheelchairAssistance ? 1 : 0, type: sql.Bit },
          { name: 'seat', value: selectedSeats?.[passengers.indexOf(p)] || null, type: sql.NVarChar },
          { name: 'meal', value: extraServices?.meals?.[passengers.indexOf(p)] || null, type: sql.NVarChar },
        ]
      );
    }

    return Response.json({ 
      success: true, 
      bookingId,
      loyaltyPointsEarned: loyaltyPointsEarned 
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return Response.json({ success: false, error: error.message });
  }
}