import { queryDatabase } from "@/lib/server-utils";
import sql from 'mssql';
import { NextResponse } from "next/server";

/**
 * POST /api/bookings/user-trips
 * Body: { firstName, documentNumber, email? }
 * Returns bookings where a passenger matches BOTH firstName and documentNumber.
 * If firstName/documentNumber is missing but email is provided, it will try to
 * fetch missing values from Users table by email.
 */
export async function POST(request) {
  try {
    let { firstName, documentNumber, email } = await request.json();
    // Try to fill missing fields from Users by email
    if ((!firstName || !documentNumber) && email) {
      const userRows = await queryDatabase(
        `SELECT TOP 1 FirstName, DocumentNumber FROM Users WHERE LOWER(Email) = @email`,
        [{ name: 'email', value: email.toLowerCase() }]
      );
      if (userRows && userRows.length > 0) {
        if (!firstName) firstName = userRows[0].FirstName || firstName;
        if (!documentNumber) documentNumber = userRows[0].DocumentNumber || documentNumber;
      }
    }

    if (!firstName || !documentNumber) {
      console.log("[user-trips] Missing required fields after fallback", { firstName: !!firstName, documentNumber: !!documentNumber, email });
      return NextResponse.json({ success: false, error: "firstName and documentNumber are required" }, { status: 400 });
    }

    // Normalize inputs
    const normFirst = String(firstName).trim().toLowerCase();
    const normDoc = String(documentNumber).trim().toLowerCase();
    console.log("[user-trips] Matching by passenger name + document:", { firstName: normFirst, documentNumber: normDoc, email });

    // Fetch bookings where a passenger matches both criteria (trim + lower)
    const bookings = await queryDatabase(
      `SELECT DISTINCT TOP 50 b.*
       FROM Bookings b
       INNER JOIN Passengers p ON p.BookingID = b.BookingID
       WHERE LOWER(LTRIM(RTRIM(p.FirstName))) = @firstName
         AND LOWER(LTRIM(RTRIM(p.DocumentNumber))) = @doc
       ORDER BY b.BookingDate DESC`,
      [
        { name: 'firstName', value: normFirst },
        { name: 'doc', value: normDoc }
      ]
    );
    console.log(`[user-trips] Bookings found: ${bookings.length}`);

    // Fetch passengers for these bookings
    let bookingIds = bookings.map(b => b.BookingID);
    let passengers = [];
    if (bookingIds.length > 0) {
      const idsParam = bookingIds.map((id, i) => `@id${i}`).join(",");
      const idsInputs = bookingIds.map((id, i) => ({ name: `id${i}`, value: id, type: sql.Int }));
      passengers = await queryDatabase(
        `SELECT * FROM Passengers WHERE BookingID IN (${idsParam})`,
        idsInputs
      );
    }

    // Airline code mapping
    const airlineMap = {
      // India
      'AI': 'Air India',
      '6E': 'IndiGo',
      'UK': 'Vistara',
      'SG': 'SpiceJet',
      'G8': 'Go First',
      'IX': 'Air India Express',
      'I5': 'AirAsia India',
      'QP': 'Akasa Air',
      // International
      'AA': 'American Airlines',
      'UA': 'United Airlines',
      'DL': 'Delta Air Lines',
      'BA': 'British Airways',
      'LH': 'Lufthansa',
      'AF': 'Air France',
      'KL': 'KLM Royal Dutch Airlines',
      'EK': 'Emirates',
      'QR': 'Qatar Airways',
      'EY': 'Etihad Airways',
      'SQ': 'Singapore Airlines',
      'CX': 'Cathay Pacific',
      'QF': 'Qantas',
      'NH': 'All Nippon Airways',
      'JL': 'Japan Airlines',
      'AC': 'Air Canada',
      'TK': 'Turkish Airlines',
      'CA': 'Air China',
      'OZ': 'Asiana Airlines',
      'BR': 'EVA Air',
      'AZ': 'ITA Airways',
      'SU': 'Aeroflot',
      'ET': 'Ethiopian Airlines',
      'SA': 'South African Airways',
      'KE': 'Korean Air',
      'TG': 'Thai Airways',
      'CX': 'Cathay Pacific',
      'EK': 'Emirates',
      'QR': 'Qatar Airways',
      'EY': 'Etihad Airways',
      'SQ': 'Singapore Airlines',
      'QF': 'Qantas',
      'NZ': 'Air New Zealand',
      'FJ': 'Fiji Airways',
      'VS': 'Virgin Atlantic',
      'IB': 'Iberia',
      'SK': 'SAS Scandinavian Airlines',
      'AY': 'Finnair',
      'OS': 'Austrian Airlines',
      'SN': 'Brussels Airlines',
      'TP': 'TAP Air Portugal',
      'LY': 'El Al',
      'SV': 'Saudia',
      'RJ': 'Royal Jordanian',
      'MS': 'EgyptAir',
      'VN': 'Vietnam Airlines',
      'PG': 'Bangkok Airways',
      'UL': 'SriLankan Airlines',
      'MH': 'Malaysia Airlines',
      'PR': 'Philippine Airlines',
      'CI': 'China Airlines',
      'HU': 'Hainan Airlines',
      'JL': 'Japan Airlines',
      'NH': 'All Nippon Airways',
      'CZ': 'China Southern Airlines',
      'MU': 'China Eastern Airlines',
      'SQ': 'Singapore Airlines',
      'CX': 'Cathay Pacific',
      'KE': 'Korean Air',
      'BR': 'EVA Air',
      'OZ': 'Asiana Airlines',
      'TK': 'Turkish Airlines',
      'ET': 'Ethiopian Airlines',
      'SA': 'South African Airways',
      'FJ': 'Fiji Airways',
      'NZ': 'Air New Zealand',
      'QF': 'Qantas',
      'VA': 'Virgin Australia',
      'WS': 'WestJet',
      'AC': 'Air Canada',
      'DL': 'Delta Air Lines',
      'AA': 'American Airlines',
      'UA': 'United Airlines',
      'B6': 'JetBlue',
      'WN': 'Southwest Airlines',
      'AS': 'Alaska Airlines',
      'NK': 'Spirit Airlines',
      'F9': 'Frontier Airlines',
      'G4': 'Allegiant Air',
      'SY': 'Sun Country Airlines',
      // Add more as needed
    };

    // Attach passengers and airline info to bookings
    const bookingsWithPassengers = bookings.map(b => {
      let airlineCode = '';
      let airlineName = '';
      if (b.FlightNo) {
        airlineCode = b.FlightNo.replace(/[^A-Z0-9]/g, '').match(/^[A-Z]+/)?.[0] || '';
        airlineName = airlineMap[airlineCode] || '';
      }
      return {
        ...b,
        passengers: passengers.filter(p => p.BookingID === b.BookingID),
        pnr: b.PNR,
        bookingReference: b.BookingReference,
        airlineName,
      };
    });

    return NextResponse.json({ success: true, bookings: bookingsWithPassengers });
  } catch (error) {
    console.error("user-trips API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
