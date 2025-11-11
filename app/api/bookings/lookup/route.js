import { NextResponse } from 'next/server'

/**
 * POST /api/bookings/lookup
 * Look up a booking by PNR
 * Body: { pnr: string }
 */
export async function POST(request) {
  try {
    const { pnr } = await request.json()

    if (!pnr || typeof pnr !== 'string' || pnr.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Invalid PNR' },
        { status: 400 }
      )
    }

    // Query database for booking by PNR
    try {
      const { queryDatabase } = await import("@/lib/server-utils")
      const bookingRows = await queryDatabase(
        `SELECT TOP 1 * FROM Bookings WHERE PNR = @pnr`,
        [{ name: "pnr", value: pnr.toUpperCase() }]
      )
      if (!bookingRows || bookingRows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Booking not found in database'
        }, { status: 404 })
      }
      const booking = bookingRows[0]
      // Fetch passengers for this booking
      const sql = (await import('mssql')).default
      const passengerRows = await queryDatabase(
        `SELECT * FROM Passengers WHERE BookingID = @bookingId`,
        [{ name: "bookingId", value: booking.BookingID, type: sql.Int }]
      )
      booking.passengers = passengerRows || []
      return NextResponse.json({ success: true, booking })
    } catch (err) {
      console.error('Booking lookup DB error:', err)
      return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
    }

  } catch (error) {
    console.error('Booking lookup error:', error)
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
