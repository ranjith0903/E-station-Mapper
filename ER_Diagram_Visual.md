# Visual ER Diagram - EV Charging Station Platform

## Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ _id (PK) | name | email (UK) | password | role | phone | address | vehicleType     │
│          |      |            |          |      |       |         | createdAt        │
│          |      |            |          |      |       |         | updatedAt        │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                  STATION                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ _id (PK) | owner (FK) | name | address | location | chargingTypes | plugTypes      │
│          |            |      |         | (GeoJSON)| (Array)       | (Array)        │
│          |            |      |         |          |               | pricePerHour    │
│          |            |      |         |          |               | pricePerUnit    │
│          |            |      |         |          |               | isAvailable24x7 │
│          |            |      |         |          |               | workingHours    │
│          |            |      |         |          |               | contactInfo     │
│          |            |      |         |          |               | status          │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                  BOOKING                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ _id (PK) | user (FK) | station (FK) | date | startTime | endTime | hours           │
│          |           |              |      |           |         | totalAmount     │
│          |           |              |      |           |         | status          │
│          |           |              |      |           |         | billingDetails  │
│          |           |              |      |           |         | paymentStatus   │
│          |           |              |      |           |         | paymentIntentId │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               ONWHEEL SERVICE                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ _id (PK) | provider (FK) | companyName | serviceName | description | serviceArea   │
│          |               |             |             |             | (GeoJSON)     │
│          |               |             |             |             | chargingTypes │
│          |               |             |             |             | plugTypes     │
│          |               |             |             |             | pricePerHour  │
│          |               |             |             |             | travelFee     │
│          |               |             |             |             | maxDistance   │
│          |               |             |             |             | responseTime  │
│          |               |             |             |             | availability  │
│          |               |             |             |             | vehicleInfo   │
│          |               |             |             |             | ratings       │
│          |               |             |             |             | status        │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              ONWHEEL REQUEST                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ _id (PK) | user (FK) | service (FK) | requestLocation | vehicleInfo | requirements │
│          |           |              | (GeoJSON)       |             | urgency       │
│          |           |              |                 |             | status        │
│          |           |              |                 |             | pricing       │
│          |           |              |                 |             | schedule      │
│          |           |              |                 |             | contactInfo   │
│          |           |              |                 |             | payment       │
│          |           |              |                 |             | feedback      │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   REVIEW                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ _id (PK) | user (FK) | station (FK) | rating (1-5) | comment | createdAt          │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Key Relationships

### 1. User Relationships
```
User (1) ──── (N) Station          (User owns multiple stations)
User (1) ──── (N) OnWheelService   (User provides multiple services)
User (1) ──── (N) Booking          (User makes multiple bookings)
User (1) ──── (N) OnWheelRequest   (User requests multiple services)
User (1) ──── (N) Review           (User writes multiple reviews)
```

### 2. Station Relationships
```
Station (1) ──── (N) Booking       (Station receives multiple bookings)
Station (1) ──── (N) Review        (Station receives multiple reviews)
```

### 3. OnWheelService Relationships
```
OnWheelService (1) ──── (N) OnWheelRequest  (Service receives multiple requests)
```

## Data Flow Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │───▶│   Station   │───▶│   Booking   │
│             │    │             │    │             │
│ - Register  │    │ - Add       │    │ - Create    │
│ - Login     │    │ - Update    │    │ - Pay       │
│ - Profile   │    │ - Delete    │    │ - Complete  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ OnWheel     │    │ OnWheel     │    │   Review    │
│ Service     │    │ Request     │    │             │
│             │    │             │    │ - Rate      │
│ - Register  │    │ - Request   │    │ - Comment   │
│ - Update    │    │ - Pay       │    │ - View      │
│ - Delete    │    │ - Track     │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Business Logic Flow

### Station Booking Flow
```
1. User finds nearby station
2. User selects time slot
3. User provides billing details
4. System creates booking
5. User completes payment (Stripe)
6. Booking confirmed
7. User can review after completion
```

### On-Wheel Service Flow
```
1. User finds nearby on-wheel service
2. User clicks "Quick Book"
3. System calculates total (base + travel fee)
4. User completes payment (Stripe)
5. Service request confirmed
6. Provider notified
7. Service delivered
8. User can provide feedback
```

## Security & Authentication

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│                 │    │                 │    │                 │
│ - Login Form    │───▶│ - JWT Auth      │───▶│ - User Data     │
│ - Register      │    │ - Role Check    │    │ - Encrypted     │
│ - Protected     │    │ - Middleware    │    │ - Indexed       │
│   Routes        │    │ - Validation    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Payment Integration

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │   Stripe    │
│             │    │             │    │             │
│ - Payment   │───▶│ - Create    │───▶│ - Payment   │
│   Form      │    │   Intent    │    │   Intent    │
│ - Card      │    │ - Confirm   │    │ - Process   │
│   Details   │    │   Payment   │    │   Payment   │
└─────────────┘    └─────────────┘    └─────────────┘
```

This ER diagram shows the complete structure of your EV charging platform with both static stations and mobile on-wheel services, including all relationships, data flows, and business logic.
