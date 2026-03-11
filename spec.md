# PhoneBazaar

## Current State
The app has no dedicated sign-in page. Authentication is triggered via a "Sign In" button in the nav bar that directly calls the Internet Identity login flow. There is no modal or page shown to the user before the II popup opens.

## Requested Changes (Diff)

### Add
- A dedicated SignInPage component that shows:
  - The PhoneBazaar logo (`/assets/uploads/logo-transparent-1.png`) centered and prominent
  - App name and tagline
  - A primary "Sign in with Internet Identity" button
  - Google and Facebook sign-in buttons (visually present but disabled/locked with a tooltip explaining only Internet Identity is supported on this platform)
  - A link/back button to return to the landing page
- When the nav "Sign In" button is clicked, navigate to the new sign-in page instead of directly triggering login
- The sign-in page should be accessible at a `{ name: "signin" }` page state

### Modify
- `App.tsx`: Add `signin` page type, route to `SignInPage`, and update the nav Sign In button to navigate to the sign-in page instead of calling `login()` directly
- If user is already authenticated and navigates to sign-in page, redirect to browse

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/pages/SignInPage.tsx` with logo, app name, tagline, Internet Identity button, and disabled Google/Facebook buttons
2. Update `App.tsx` to add `signin` to the Page type, add the SignInPage route, and change the nav Sign In button to navigate to `{ name: "signin" }` instead of calling `login()` directly
3. Pass `login`, `isLoggingIn`, and `navigate` callbacks into SignInPage
