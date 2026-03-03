# SmartPhone Marketplace

## Current State
The app has a full browse/sell/detail/my-listings flow with PKR pricing, image upload, and Pakistani phone brands. The app starts directly on the BrowsePage with a sticky nav header. There is no dedicated landing/home page.

## Requested Changes (Diff)

### Add
- A new `LandingPage` component as the app's first screen
- Full-viewport hero section with the generated hero background image
- Centered app logo (`/assets/generated/app-logo-transparent.dim_320x320.png`) prominently displayed
- App name "SmartPhone Marketplace" as a large headline
- Tagline text beneath the headline
- Two CTA buttons: "Browse Phones" and "Sell Your Phone"
- Feature highlights row (3 icons + short text) below CTAs
- Animated entrance effects (fade + slide)

### Modify
- `App.tsx`: add `landing` to the Page type and set it as the initial page; navigate away from landing when user clicks Browse or Sell CTAs
- Nav logo click goes to `landing` page (not `browse`)

### Remove
- Nothing removed from existing pages
