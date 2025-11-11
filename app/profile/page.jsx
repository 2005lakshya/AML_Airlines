"use client"

import RequireAuth from "@/components/require-auth"
import React, { useState, useEffect } from "react"
import Footer from "@/components/footer"
import SignUpButton from "@/components/signup-button"
import { useAuth } from "@/contexts/auth-context"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { queryDatabase } from "@/lib/auth-utils"

// Helper functions for booking management
const getBookingHistory = () => {
  if (typeof window === "undefined") return []
  try {
    const bookings = localStorage.getItem('booking_history')
    return bookings ? JSON.parse(bookings) : []
  } catch (e) {
    console.error('Failed to parse booking history:', e)
    return []
  }
}

const saveBookingToHistory = (booking) => {
  if (typeof window === "undefined") return
  try {
    const bookings = getBookingHistory()
    const bookingWithTimestamp = {
      ...booking,
      bookedAt: new Date().toISOString(),
      status: 'confirmed'
    }
    bookings.push(bookingWithTimestamp)
    localStorage.setItem('booking_history', JSON.stringify(bookings))
  } catch (e) {
    console.error('Failed to save booking to history:', e)
  }
}

const getUserPastTrips = (userEmail, userPhone) => {
  const bookings = getBookingHistory()
  return bookings.filter(booking => {
    // Match by email or phone number
    const matchesEmail = userEmail && booking.email && booking.email.toLowerCase() === userEmail.toLowerCase()
    const matchesPhone = userPhone && booking.phone && booking.phone === userPhone
    return matchesEmail || matchesPhone
  })
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatTime = (timeString) => {
  if (!timeString) return "--:--"
  const [hours, minutes] = timeString.split(':')
  const hour24 = parseInt(hours)
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
  const ampm = hour24 >= 12 ? 'PM' : 'AM'
  return `${hour12}:${minutes} ${ampm}`
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-black flex flex-col pt-24">
        <div className="max-w-4xl mx-auto w-full flex-1 px-6 py-12">
          <ProfileInner />
        </div>
        <Footer />
      </div>
    </RequireAuth>
  )
}


function ProfileInner() {
  const { user, isAuthenticated } = useAuth();
  const [expanded, setExpanded] = useState("info");
  const [pastTrips, setPastTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    dateOfBirth: "",
    gender: "Male",
    nationality: "Indian",
    address: "",
    city: "",
    country: "India",
    emergencyContactName: "",
    emergencyContactPhone: "",
    preferredSeat: "Window",
    mealPreference: "Vegetarian",
    frequentFlyerNumber: "",
    idType: "Passport",
    idNumber: "",
    idExpiry: ""
  });
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [forceComplete, setForceComplete] = useState(false);

  // Fetch profile and trips from DB when user changes
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    // Fetch profile
    queryDatabase('/api/users', { email: user.email })
      .then((data) => {
        if (data && data.success && data.user) {
          const u = data.user;
          const nameParts = (u.name || u.Name || "").split(" ");
          const mapped = {
            firstName: u.FirstName || u.firstName || nameParts[0] || "",
            lastName: u.LastName || u.lastName || nameParts.slice(1).join(" ") || "",
            email: u.email || u.Email || u.email,
            phone: u.PhoneNumber || u.phone || '',
            dateOfBirth: u.DateOfBirth ? (new Date(u.DateOfBirth)).toISOString().slice(0,10) : (u.dateOfBirth || ''),
            gender: u.Gender || u.gender || 'Male',
            nationality: u.Nationality || u.nationality || 'Indian',
            address: u.StreetAddress || u.address || '',
            city: u.City || u.city || '',
            country: u.Country || u.country || 'India',
            emergencyContactName: u.EmergencyContactName || u.emergencyContactName || '',
            emergencyContactPhone: u.EmergencyContactPhone || u.emergencyContactPhone || '',
            preferredSeat: u.PreferredSeat || u.preferredSeat || 'Window',
            mealPreference: u.MealPreference || u.mealPreference || 'Vegetarian',
            frequentFlyerNumber: u.FrequentFlyerNumber || u.frequentFlyerNumber || '',
            idType: u.DocumentType || u.idType || 'Passport',
            idNumber: u.DocumentNumber || u.idNumber || '',
            idExpiry: u.DocumentExpiry ? (new Date(u.DocumentExpiry)).toISOString().slice(0,10) : (u.idExpiry || ''),
          };
          setProfileData((prev) => ({ ...prev, ...mapped }));
          // Fetch trips from API
          fetchUserTrips(mapped);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch profile data:", err);
        alert('Failed to load profile data. See console for details.');
        setLoading(false);
      });
    // Check profile completeness flag in localStorage
    if (user?.email) {
      const flag = localStorage.getItem(`profile_complete_${user.email}`);
      setIsProfileComplete(!!flag);
      if (!flag) setForceComplete(true);
    }
  }, [user?.email]);

  // Fetch user trips from API
  const fetchUserTrips = async (profile) => {
    if (!profile) {
      setLoading(false);
      return;
    }
    const { firstName, idNumber } = profile;
    console.log('[Profile] Fetching trips with:', { firstName, documentNumber: idNumber, email: user?.email });
    try {
      const res = await queryDatabase('/api/bookings/user-trips', {
        firstName,
        documentNumber: idNumber,
        email: user?.email,
      });
      console.log('[Profile] Trips API response:', res);
      if (res && res.success && Array.isArray(res.bookings)) {
        // Map DB booking to UI trip format
        const trips = res.bookings.map((b) => {
          // Parse flight info
          const flight = {
            origin: b.Origin || b.origin,
            destination: b.Destination || b.destination,
            flightNumber: b.FlightNo || b.flightNo, // Only show flight number (with airline code)
            airlineName: b.airlineName || '',
            date: b.TravelDate || b.travelDate,
            departure: b.DepartureTime ? new Date(b.DepartureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            arrival: b.ArrivalTime ? new Date(b.ArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            duration: b.Duration || b.duration,
          };
          // Parse costs
          const costs = {
            total: b.TotalPrice || b.totalPrice,
            baseFare: b.BaseFare || b.baseFare,
            taxes: b.Tax || b.tax,
            seatUpgrade: b.SeatCharge || b.seatCharge,
            services: {
              boarding: b.PriorityFare || b.priorityFare,
              meals: b.MealCharge || b.mealCharge,
              luggage: b.ExtraLuggageCharge || b.extraLuggageCharge,
            },
          };
          // Parse selected seats
          let selectedSeats = [];
          if (b.passengers && Array.isArray(b.passengers)) {
            selectedSeats = b.passengers.map(p => p.SeatNumber || p.seatNumber).filter(Boolean);
          }
          // Status logic (simple)
          let status = 'confirmed';
          const now = new Date();
          if (b.TravelDate && new Date(b.TravelDate) < now) status = 'completed';
          // Compose trip object
          return {
            flight,
            costs,
            selectedSeats,
            status,
            bookedAt: b.BookingDate || b.bookingDate,
            pnr: b.pnr || b.PNR || '',
            bookingReference: b.bookingReference || b.BookingReference || '',
            email: b.GuestEmail || b.guestEmail || b.Email || b.email,
            phone: b.GuestPhone || b.guestPhone || b.PhoneNumber || b.phone,
            passengerCount: b.passengers ? b.passengers.length : 1,
            ...b,
          };
        });
        setPastTrips(trips);
      } else {
        setPastTrips([]);
      }
    } catch (err) {
      console.error("Failed to fetch user trips:", err);
      setPastTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    
    // If firstName or idNumber (document) is changed, reload past trips
    if (field === 'firstName' || field === 'idNumber') {
      setTimeout(() => {
        fetchUserTrips({ ...profileData, [field]: value })
      }, 100)
    }
  }

  const saveProfile = () => {
    if (!user?.email) return

    // Basic required fields when forcing completion
    if (forceComplete) {
      const required = ['phone', 'emergencyContactPhone', 'idNumber']
      const missing = required.filter(f => !profileData[f])
      if (missing.length > 0) {
        alert('Please fill all required fields: ' + missing.join(', '))
        return
      }
    }

    // map frontend fields to DB columns (FrequentFlyerNumber excluded - auto-generated and read-only)
    const payload = {
      email: user.email,
      name: `${profileData.firstName} ${profileData.lastName}`.trim(),
      FirstName: profileData.firstName,
      LastName: profileData.lastName,
      PhoneNumber: profileData.phone,
      DateOfBirth: profileData.dateOfBirth || null,
      Gender: profileData.gender,
      Nationality: profileData.nationality,
      StreetAddress: profileData.address,
      City: profileData.city,
      Country: profileData.country,
      EmergencyContactName: profileData.emergencyContactName,
      EmergencyContactPhone: profileData.emergencyContactPhone,
      PreferredSeat: profileData.preferredSeat,
      MealPreference: profileData.mealPreference,
      DocumentType: profileData.idType,
      DocumentNumber: profileData.idNumber,
      DocumentExpiry: profileData.idExpiry || null,
    }

    queryDatabase('/api/users/update', payload)
      .then((data) => {
        if (data.success) {
          // mark profile as complete
          localStorage.setItem(`profile_complete_${user.email}`, '1')
          setIsProfileComplete(true)
          setForceComplete(false)
          alert('Profile updated successfully!')
        }
      })
      .catch((err) => console.error("Failed to update profile:", err))
  }

  // Show loading screen while fetching data
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <svg
          className="airplane-flying"
          width="100"
          height="100"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
            fill="white"
          />
        </svg>
        <div className="mt-6 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Loading Your Profile...</h2>
          <p className="text-white/70 text-sm">Fetching your information</p>
          <div className="flex items-center justify-center gap-1 mt-4">
            <span className="loading-dot"></span>
            <span className="loading-dot" style={{ animationDelay: '0.2s' }}></span>
            <span className="loading-dot" style={{ animationDelay: '0.4s' }}></span>
          </div>
        </div>
        <style jsx>{`
          .airplane-flying {
            animation: fly 3s ease-in-out infinite;
            filter: drop-shadow(0 4px 8px rgba(255, 255, 255, 0.3));
          }
          @keyframes fly {
            0%, 100% { transform: translate(0, 0) rotate(-5deg); }
            25% { transform: translate(30px, -20px) rotate(0deg); }
            50% { transform: translate(0, -10px) rotate(5deg); }
            75% { transform: translate(-30px, -20px) rotate(0deg); }
          }
          .loading-dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            background: white;
            border-radius: 50%;
            animation: dot-bounce 1.4s ease-in-out infinite;
          }
          @keyframes dot-bounce {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            40% { transform: scale(1.2); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-8 text-white mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">Profile</h1>
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-white/70">Logged in as {user?.email}</span>
            </div>
          )}
        </div>

        {!isAuthenticated && (
          <div className="mb-6 p-4 bg-white/10 border border-white/30 rounded-lg backdrop-blur">
            <p className="text-sm text-white/80 mb-2">
              You're not signed in. Sign in to manage your profile and view your booking history.
            </p>
            <SignUpButton>Sign up to continue</SignUpButton>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Accordion type="single" collapsible defaultValue="info" className="space-y-4">
          <AccordionItem value="info" className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl px-6 py-4">
            <AccordionTrigger className="text-white hover:text-white/80">User Info</AccordionTrigger>
            <AccordionContent>
              {isAuthenticated ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-white">Basic Information</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white">First Name</label>
                        <input
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white px-3 py-2 text-sm placeholder:text-white/40"
                          value={profileData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white">Last Name</label>
                        <input
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white px-3 py-2 text-sm placeholder:text-white/40"
                          value={profileData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          placeholder="Last name"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white">Email</label>
                        <input
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white px-3 py-2 text-sm placeholder:text-white/40"
                          value={profileData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          type="email"
                          placeholder="your@email.com"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white">Phone Number</label>
                        <input
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white placeholder:text-white/40 px-3 py-2 text-sm"
                          value={profileData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          type="tel"
                          placeholder="+91 XXXXX XXXXX"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white">Date of Birth</label>
                        <input
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white placeholder:text-white/40 px-3 py-2 text-sm"
                          value={profileData.dateOfBirth}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          type="date"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white">Gender</label>
                        <select
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white px-3 py-2 text-sm [&>option]:bg-gray-900 [&>option]:text-white"
                          value={profileData.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white">Nationality</label>
                        <select
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white px-3 py-2 text-sm [&>option]:bg-gray-900 [&>option]:text-white"
                          value={profileData.nationality}
                          onChange={(e) => handleInputChange('nationality', e.target.value)}
                        >
                          <option value="Indian">Indian</option>
                          <option value="American">American</option>
                          <option value="British">British</option>
                          <option value="Canadian">Canadian</option>
                          <option value="Australian">Australian</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-white">Address Information</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-white">Street Address</label>
                        <input
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white placeholder:text-white/40 px-3 py-2 text-sm"
                          value={profileData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="123 Main Street, Apartment 4B"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white">City</label>
                        <input
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white placeholder:text-white/40 px-3 py-2 text-sm"
                          value={profileData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="Mumbai"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white">Country</label>
                        <select
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white px-3 py-2 text-sm [&>option]:bg-gray-900 [&>option]:text-white"
                          value={profileData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                        >
                          <option value="India">India</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Canada">Canada</option>
                          <option value="Australia">Australia</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-white">Emergency Contact</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white">Contact Name</label>
                        <input
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white placeholder:text-white/40 px-3 py-2 text-sm"
                          value={profileData.emergencyContactName}
                          onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                          placeholder="Emergency contact full name"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white">Contact Phone</label>
                        <input
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white placeholder:text-white/40 px-3 py-2 text-sm"
                          value={profileData.emergencyContactPhone}
                          onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                          type="tel"
                          placeholder="+91 XXXXX XXXXX"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Travel Preferences */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-white">Travel Preferences</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white">Preferred Seat</label>
                        <select
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white px-3 py-2 text-sm [&>option]:bg-gray-900 [&>option]:text-white"
                          value={profileData.preferredSeat}
                          onChange={(e) => handleInputChange('preferredSeat', e.target.value)}
                        >
                          <option value="Window">Window</option>
                          <option value="Aisle">Aisle</option>
                          <option value="Middle">Middle</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white">Meal Preference</label>
                        <select
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white px-3 py-2 text-sm [&>option]:bg-gray-900 [&>option]:text-white"
                          value={profileData.mealPreference}
                          onChange={(e) => handleInputChange('mealPreference', e.target.value)}
                        >
                          <option value="Vegetarian">Vegetarian</option>
                          <option value="Non-Vegetarian">Non-Vegetarian</option>
                          <option value="Vegan">Vegan</option>
                          <option value="Jain">Jain</option>
                          <option value="Halal">Halal</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white">Frequent Flyer Number</label>
                        <input
                          className="w-full rounded-md border border-white/30 bg-white/20 text-white placeholder:text-white/40 px-3 py-2 text-sm cursor-not-allowed"
                          value={profileData.frequentFlyerNumber}
                          readOnly
                          disabled
                          placeholder="Auto-generated on signup"
                        />
                        <p className="mt-1 text-xs text-white/60">Automatically assigned when you created your account</p>
                      </div>
                    </div>
                  </div>

                  {/* Travel Document */}
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-white">Travel Document</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white">Document Type</label>
                        <select
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white px-3 py-2 text-sm [&>option]:bg-gray-900 [&>option]:text-white"
                          value={profileData.idType}
                          onChange={(e) => handleInputChange('idType', e.target.value)}
                        >
                          <option value="Passport">Passport</option>
                          <option value="Aadhaar">Aadhaar Card</option>
                          <option value="DrivingLicense">Driving License</option>
                          <option value="VoterID">Voter ID</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white">Document Number</label>
                        <input
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white placeholder:text-white/40 px-3 py-2 text-sm"
                          value={profileData.idNumber}
                          onChange={(e) => handleInputChange('idNumber', e.target.value)}
                          placeholder="Document number"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white">Expiry Date</label>
                        <input
                          className="w-full rounded-md border border-white/30 bg-white/10 text-white placeholder:text-white/40 px-3 py-2 text-sm"
                          value={profileData.idExpiry}
                          onChange={(e) => handleInputChange('idExpiry', e.target.value)}
                          type="date"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4">
                    <button 
                      onClick={saveProfile}
                      className="rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Save All Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Please sign in to view and edit your profile information.</p>
                  <SignUpButton>Sign up</SignUpButton>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="trips" className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl px-6 py-4">
            <AccordionTrigger className="text-white hover:text-white/80">Past Trips ({pastTrips.length})</AccordionTrigger>
            <AccordionContent>
              {isAuthenticated ? (
                <div className="space-y-4">
                  {pastTrips.length > 0 ? (
                    <>
                      <div className="text-sm text-white/70 mb-4">
                        Showing trips where your contact information matches the booking details.
                      </div>
                      <div className="space-y-4">
                        {pastTrips.map((trip, index) => (
                          <div key={index} className="border border-white/30 rounded-lg p-4 bg-white/5 backdrop-blur text-white">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-lg">
                                    {trip.flight?.origin} → {trip.flight?.destination}
                                  </h4>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    trip.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                    trip.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {trip.status?.charAt(0).toUpperCase() + trip.status?.slice(1)}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Date: </span>
                                    {formatDate(trip.flight?.date)}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Departure: </span>
                                    {formatTime(trip.flight?.departure)}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Arrival: </span>
                                    {formatTime(trip.flight?.arrival)}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-2">
                                  <div>
                                    <span className="text-muted-foreground">Airline: </span>
                                    {trip.flight?.airlineName || 'Unknown'}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Flight: </span>
                                    {trip.flight?.flightNumber || 'N/A'}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-2">
                                  <div>
                                    <span className="text-muted-foreground">PNR: </span>
                                    {trip.pnr || 'N/A'}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Booking Ref: </span>
                                    {trip.bookingReference || 'N/A'}
                                  </div>
                                </div>

                                {trip.flight?.duration && (
                                  <div className="text-sm mt-2">
                                    <span className="text-muted-foreground">Duration: </span>
                                    {trip.flight.duration}
                                  </div>
                                )}

                                {trip.selectedSeats && trip.selectedSeats.length > 0 && (
                                  <div className="text-sm mt-2">
                                    <span className="text-muted-foreground">Seats: </span>
                                    {trip.selectedSeats.join(', ')}
                                  </div>
                                )}
                              </div>

                              <div className="text-right">
                                <div className="text-lg font-semibold">
                                  ₹{trip.costs?.total?.toLocaleString('en-IN') || 'N/A'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {trip.passengerCount || 1} passenger{(trip.passengerCount || 1) > 1 ? 's' : ''}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Booked: {formatDate(trip.bookedAt)}
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-border pt-3 mt-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                                <div>
                                  <span className="font-medium">Contact Email: </span>
                                  {trip.email}
                                </div>
                                {trip.phone && (
                                  <div>
                                    <span className="font-medium">Contact Phone: </span>
                                    {trip.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-muted-foreground mb-2">No past trips found</p>
                      <p className="text-sm text-muted-foreground">
                        Past trips will appear here when your email or phone number matches the booking contact information.
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Make sure to update your phone number in the profile if you want to see trips booked with your phone number.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Sign in to view your booking history and past trips.</p>
                  <SignUpButton>Sign up</SignUpButton>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="payments" className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl px-6 py-4">
            <AccordionTrigger className="text-white hover:text-white/80">Saved Payment Methods</AccordionTrigger>
            <AccordionContent>
              {isAuthenticated ? (
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between p-3 border border-border rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                        VISA
                      </div>
                      <span>**** **** **** 4242</span>
                    </div>
                    <button className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:bg-secondary/80">
                      Remove
                    </button>
                  </li>
                  <li className="flex items-center justify-between p-3 border border-border rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-5 bg-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">
                        UPI
                      </div>
                      <span>alex@bank</span>
                    </div>
                    <button className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:bg-secondary/80">
                      Remove
                    </button>
                  </li>
                  <li className="pt-2">
                    <button className="text-sm text-primary hover:underline">+ Add New Payment Method</button>
                  </li>
                </ul>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Sign in to manage your payment methods and billing information.</p>
                  <SignUpButton>Sign up</SignUpButton>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
