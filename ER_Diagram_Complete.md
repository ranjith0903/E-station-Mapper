                    EV CHARGING STATION PLATFORM - COMPLETE ER DIAGRAM
                    ==================================================

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER ENTITY                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                              USER                                            │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │ _id (PK)                    │ ObjectId - Auto-generated unique identifier   │   │
│  │ name                        │ String - User's full name                     │   │
│  │ email (UK)                  │ String - Unique email address                 │   │
│  │ password                    │ String - Hashed password                      │   │
│  │ role                        │ Enum: user|owner|admin|onwheel-provider       │   │
│  │ phone                       │ String - Contact number                       │   │
│  │ address                     │ String - Physical address                     │   │
│  │ vehicleType                 │ Object - Vehicle information                  │   │
│  │ createdAt                   │ Date - Account creation timestamp             │   │
│  │ updatedAt                   │ Date - Last update timestamp                 │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N (One user can own multiple stations)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                  STATION ENTITY                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                              STATION                                          │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │ _id (PK)                    │ ObjectId - Auto-generated unique identifier   │   │
│  │ owner (FK)                  │ ObjectId - References USER._id                │   │
│  │ name                        │ String - Station name                         │   │
│  │ address                     │ String - Physical address                     │   │
│  │ location                    │ GeoJSON Point - {type: "Point", coordinates} │   │
│  │ chargingTypes               │ Array - ["slow", "fast", "superfast"]        │   │
│  │ plugTypes                   │ Array - ["Type-1", "Type-2", "CCS", "CHAdeMO"]│   │
│  │ pricePerHour                │ Number - Hourly rate in currency             │   │
│  │ pricePerUnit                │ Number - Price per kWh                       │   │
│  │ isAvailable24x7             │ Boolean - 24/7 availability flag             │   │
│  │ workingHours                │ Array - Operating hours                      │   │
│  │ isCurrentlyAvailable        │ Boolean - Real-time availability             │   │
│  │ contactInfo                 │ Object - Phone, email, website               │   │
│  │ totalBookings               │ Number - Total bookings count                │   │
│  │ totalEarnings               │ Number - Total earnings                      │   │
│  │ status                      │ Enum: active|inactive|suspended              │   │
│  │ createdAt                   │ Date - Creation timestamp                    │   │
│  │ updatedAt                   │ Date - Last update timestamp                │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N (One station can have multiple bookings)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                  BOOKING ENTITY                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                              BOOKING                                          │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │ _id (PK)                    │ ObjectId - Auto-generated unique identifier   │   │
│  │ user (FK)                   │ ObjectId - References USER._id                │   │
│  │ station (FK)                │ ObjectId - References STATION._id             │   │
│  │ date                        │ Date - Booking date                           │   │
│  │ startTime                   │ String - Start time (HH:MM)                  │   │
│  │ endTime                     │ String - End time (HH:MM)                    │   │
│  │ hours                       │ Number - Duration in hours                   │   │
│  │ totalAmount                 │ Number - Total cost                          │   │
│  │ status                      │ Enum: pending|confirmed|completed|cancelled  │   │
│  │ billingDetails              │ Object - Name, email, phone                  │   │
│  │ paymentStatus               │ Enum: pending|completed|failed|refunded     │   │
│  │ paymentIntentId             │ String - Stripe payment intent ID            │   │
│  │ createdAt                   │ Date - Creation timestamp                    │   │
│  │ updatedAt                   │ Date - Last update timestamp                │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               ONWHEEL SERVICE ENTITY                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           ONWHEEL SERVICE                                     │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │ _id (PK)                    │ ObjectId - Auto-generated unique identifier   │   │
│  │ provider (FK)               │ ObjectId - References USER._id                │   │
│  │ companyName                 │ String - Company name                         │   │
│  │ serviceName                 │ String - Service name                         │   │
│  │ description                 │ String - Service description                  │   │
│  │ serviceArea                 │ GeoJSON Point + radius - Coverage area        │   │
│  │ chargingTypes               │ Array - Available charging types              │   │
│  │ plugTypes                   │ Array - Available plug types                  │   │
│  │ pricePerHour                │ Number - Hourly rate                          │   │
│  │ pricePerUnit                │ Number - Price per kWh                        │   │
│  │ minimumCharge               │ Number - Minimum charge amount                │   │
│  │ travelFee                   │ Number - Additional travel fee                │   │
│  │ maxDistance                 │ Number - Maximum travel distance (km)         │   │
│  │ responseTime                │ Number - Average response time (minutes)      │   │
│  │ availability                │ Object - Working hours, 24/7 flag             │   │
│  │ contactInfo                 │ Object - Phone, email, WhatsApp, website      │   │
│  │ vehicleInfo                 │ Object - Vehicle type, capacity, battery      │   │
│  │ ratings                     │ Object - Average rating, total reviews        │   │
│  │ documents                   │ Object - Business license, insurance          │   │
│  │ status                      │ Enum: active|inactive|suspended              │   │
│  │ isPremium                   │ Boolean - Premium listing flag                │   │
│  │ totalServices               │ Number - Total services provided              │   │
│  │ totalEarnings               │ Number - Total earnings                       │   │
│  │ createdAt                   │ Date - Creation timestamp                     │   │
│  │ updatedAt                   │ Date - Last update timestamp                 │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N (One service can have multiple requests)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              ONWHEEL REQUEST ENTITY                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           ONWHEEL REQUEST                                     │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │ _id (PK)                    │ ObjectId - Auto-generated unique identifier   │   │
│  │ user (FK)                   │ ObjectId - References USER._id                │   │
│  │ service (FK)                │ ObjectId - References ONWHEEL_SERVICE._id     │   │
│  │ requestLocation             │ GeoJSON Point + address - Request location    │   │
│  │ vehicleInfo                 │ Object - Vehicle type, number, battery level  │   │
│  │ chargingRequirements        │ Object - Charging type, plug type, duration   │   │
│  │ urgency                     │ Enum: low|medium|high|emergency              │   │
│  │ status                      │ Enum: pending|confirmed|in-progress|completed│   │
│  │ pricing                     │ Object - Base price, travel fee, total amount │   │
│  │ schedule                    │ Object - Requested time, duration             │   │
│  │ contactInfo                 │ Object - User phone, email, notes             │   │
│  │ payment                     │ Object - Payment status, intent ID            │   │
│  │ feedback                    │ Object - Rating, comment, date                │   │
│  │ cancellation                │ Object - Cancellation reason, refund status  │   │
│  │ tracking                    │ Object - Provider location, ETA               │   │
│  │ createdAt                   │ Date - Creation timestamp                     │   │
│  │ updatedAt                   │ Date - Last update timestamp                 │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   REVIEW ENTITY                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                              REVIEW                                            │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │ _id (PK)                    │ ObjectId - Auto-generated unique identifier   │   │
│  │ user (FK)                   │ ObjectId - References USER._id                │   │
│  │ station (FK)                │ ObjectId - References STATION._id             │   │
│  │ rating                      │ Number - Rating (1-5 stars)                   │   │
│  │ comment                     │ String - Review comment                       │   │
│  │ createdAt                   │ Date - Creation timestamp                     │   │
│  │ updatedAt                   │ Date - Last update timestamp                 │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

                    RELATIONSHIPS WITH CARDINALITY
                    ==============================

USER (1) ──────────────────────────────────────── (N) STATION
         [One user can own multiple stations]

USER (1) ──────────────────────────────────────── (N) ONWHEEL_SERVICE  
         [One user can provide multiple on-wheel services]

USER (1) ──────────────────────────────────────── (N) BOOKING
         [One user can make multiple station bookings]

USER (1) ──────────────────────────────────────── (N) ONWHEEL_REQUEST
         [One user can request multiple on-wheel services]

USER (1) ──────────────────────────────────────── (N) REVIEW
         [One user can write multiple reviews]

STATION (1) ───────────────────────────────────── (N) BOOKING
           [One station can receive multiple bookings]

STATION (1) ───────────────────────────────────── (N) REVIEW
           [One station can receive multiple reviews]

ONWHEEL_SERVICE (1) ───────────────────────────── (N) ONWHEEL_REQUEST
                   [One service can receive multiple requests]

                    DATABASE INDEXES
                    ================

GEOSPATIAL INDEXES:
- Station.location (2dsphere)
- OnWheelService.serviceArea (2dsphere)  
- OnWheelRequest.requestLocation (2dsphere)

PERFORMANCE INDEXES:
- User.email (unique)
- Booking.user + Booking.date
- OnWheelRequest.user + OnWheelRequest.status
- Review.station
- Station.owner
- OnWheelService.provider

                    CONSTRAINTS
                    ============

PRIMARY KEYS:
- All entities have _id as primary key (ObjectId)

FOREIGN KEYS:
- Station.owner → User._id
- Booking.user → User._id
- Booking.station → Station._id
- OnWheelService.provider → User._id
- OnWheelRequest.user → User._id
- OnWheelRequest.service → OnWheelService._id
- Review.user → User._id
- Review.station → Station._id

UNIQUE CONSTRAINTS:
- User.email (unique)
- Station.name + Station.owner (unique per owner)

NOT NULL CONSTRAINTS:
- All primary keys
- All foreign keys
- Essential business fields (name, email, password, role, etc.)

                    BUSINESS RULES
                    ==============

1. A user can have only one role at a time
2. A station can only be owned by one user
3. A booking can only be for one station and one user
4. An on-wheel service can only be provided by one user
5. An on-wheel request can only be for one service and one user
6. A review can only be for one station and one user
7. Users can only review stations they have booked
8. Payment must be completed before booking/request confirmation
9. Service areas must have valid GeoJSON Point coordinates
10. Ratings must be between 1 and 5

