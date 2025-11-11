-- FlightApp_schema.sql
-- SQL Server schema for the FlightApp database used by the AML_Airlines demo
-- Run this file against your SQL Server instance to create the schema.

-- Create database if needed (uncomment if you have rights to create DB)
-- IF DB_ID('FlightApp') IS NULL
--     CREATE DATABASE FlightApp;
-- GO

USE [FlightApp];
GO

-- Drop tables in safe order (dependents first)
IF OBJECT_ID('dbo.Payments', 'U') IS NOT NULL DROP TABLE dbo.Payments;
IF OBJECT_ID('dbo.LoyaltyTransactions', 'U') IS NOT NULL DROP TABLE dbo.LoyaltyTransactions;
IF OBJECT_ID('dbo.Passengers', 'U') IS NOT NULL DROP TABLE dbo.Passengers;
IF OBJECT_ID('dbo.Bookings', 'U') IS NOT NULL DROP TABLE dbo.Bookings;
IF OBJECT_ID('dbo.Admins', 'U') IS NOT NULL DROP TABLE dbo.Admins;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;

-- ----------------------------
-- Users Table
-- ----------------------------
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FirstName VARCHAR(50) NULL,
    LastName VARCHAR(50) NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    PhoneNumber VARCHAR(20) NULL,
    DateOfBirth DATE NULL,
    Gender VARCHAR(20) NULL,
    Nationality VARCHAR(50) NULL,
    StreetAddress VARCHAR(255) NULL,
    City VARCHAR(100) NULL,
    Country VARCHAR(100) NULL,
    EmergencyContactName VARCHAR(100) NULL,
    EmergencyContactPhone VARCHAR(20) NULL,
    PreferredSeat VARCHAR(20) NULL,
    MealPreference VARCHAR(50) NULL,
    FrequentFlyerNumber VARCHAR(50) NULL,
    DocumentType VARCHAR(50) NULL,
    DocumentNumber VARCHAR(50) NULL,
    DocumentExpiry DATE NULL,
    LoyaltyPoints INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- ----------------------------
-- Bookings Table
-- ----------------------------
CREATE TABLE Bookings (
    BookingID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NULL, -- Nullable for guest bookings
    GuestName VARCHAR(100) NULL,
    GuestEmail VARCHAR(100) NULL,
    GuestPhone VARCHAR(20) NULL,
    AmadeusOfferID VARCHAR(255) NOT NULL,
    BookingReference VARCHAR(50) NULL,
    PNR VARCHAR(20) NULL,
    BookingDate DATETIME DEFAULT GETDATE(),
    TotalPrice DECIMAL(10,2) NOT NULL,
    Currency CHAR(3) NOT NULL,
    PaymentStatus VARCHAR(50) NULL,
    TravelClass VARCHAR(50) NOT NULL,
    PriorityService BIT DEFAULT 0,
    ExtraLuggage BIT DEFAULT 0,
    Origin VARCHAR(100) NULL,
    Destination VARCHAR(100) NULL,
    FlightNo VARCHAR(50) NULL,
    TravelDate DATE NULL,
    DepartureTime DATETIME NULL,
    ArrivalTime DATETIME NULL,
    Duration VARCHAR(50) NULL,
    StopoverLocation VARCHAR(100) NULL,
    StopoverDuration VARCHAR(50) NULL,
    BaseFare DECIMAL(10,2) NULL,
    Tax DECIMAL(10,2) NULL,
    PriorityFare DECIMAL(10,2) NULL,
    MealCharge DECIMAL(10,2) NULL,
    ExtraLuggageCharge DECIMAL(10,2) NULL,
    SeatCharge DECIMAL(10,2) NULL,
    CONSTRAINT FK_Bookings_Users FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- ----------------------------
-- Passengers Table
-- ----------------------------
CREATE TABLE Passengers (
    PassengerID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NOT NULL,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    DateOfBirth DATE NOT NULL,
    Gender VARCHAR(10) NULL,
    DocumentType VARCHAR(50) NULL,
    DocumentNumber VARCHAR(50) NULL,
    WheelchairRequired BIT DEFAULT 0,
    SeatNumber VARCHAR(10) NULL,
    MealType VARCHAR(50) NULL,
    CONSTRAINT FK_Passengers_Bookings FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID)
);

-- ----------------------------
-- LoyaltyTransactions Table
-- ----------------------------
CREATE TABLE LoyaltyTransactions (
    TransactionID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    BookingID INT NOT NULL,
    PointsEarned INT NOT NULL,
    TransactionType VARCHAR(50) NOT NULL,
    TransactionDate DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Loyalty_User FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_Loyalty_Booking FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID)
);

-- ----------------------------
-- Payments Table
-- ----------------------------
CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NOT NULL,
    PaymentDate DATETIME DEFAULT GETDATE(),
    Amount DECIMAL(10,2) NOT NULL,
    Currency CHAR(3) NOT NULL,
    PaymentMethod VARCHAR(50) NOT NULL,
    PaymentStatus VARCHAR(50) DEFAULT 'Pending',
    CONSTRAINT FK_Payments_Booking FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID)
);

-- ----------------------------
-- Admins Table
-- ----------------------------
CREATE TABLE Admins (
    AdminID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- ----------------------------
-- Sample selects and cleanup (commented)
-- ----------------------------
-- SELECT * FROM Users;
-- SELECT * FROM Bookings;
-- SELECT * FROM Passengers;
-- SELECT * FROM LoyaltyTransactions;
-- SELECT * FROM Payments;
-- SELECT * FROM Admins;

-- Destructive cleanup examples (use with caution):
-- DELETE FROM Bookings WHERE GuestName = 'lakshya gupta';
-- DELETE FROM Passengers WHERE FirstName = 'lakshya';
-- DELETE FROM Users WHERE UserID = 1;
-- DROP TABLE IF EXISTS Payments;
-- DROP TABLE IF EXISTS LoyaltyTransactions;
-- DROP TABLE IF EXISTS Passengers;
-- DROP TABLE IF EXISTS Bookings;
-- DROP TABLE IF EXISTS Admins;
-- DROP TABLE IF EXISTS Users;

GO
