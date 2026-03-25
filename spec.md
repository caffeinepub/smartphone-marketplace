# PhoneBazaar

## Current State
Admin dashboard with stats, brand breakdown, listings, seller management. Admin set by first Internet Identity login. No analytics trends. No secondary PIN security layer.

## Requested Changes (Diff)

### Add
- Backend: setAdminPin(pin), verifyAdminPin(pin) -> Bool, getAnalytics() -> AnalyticsData
- Frontend: Admin PIN login gate (Internet Identity + PIN required)
- Frontend: PIN setup screen for first-time admin
- Frontend: Analytics tab with charts (listing trends, message volume, brand pie, sold vs active)

### Modify
- AdminDashboardPage: PIN verification gate + Analytics tab

### Remove
- Nothing

## Implementation Plan
1. Add AnalyticsData type with daily buckets for listings and messages (last 30 days)
2. Add setAdminPin, verifyAdminPin, getAnalytics to main.mo
3. AdminDashboardPage: PIN gate UI using sessionStorage for verified state
4. Analytics tab using shadcn Chart (recharts) for bar/line/pie charts
5. PIN setup flow when admin has not yet set a PIN
