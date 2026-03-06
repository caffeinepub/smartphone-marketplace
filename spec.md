# PhoneBazaar

## Current State
The app has a full messaging system (send/reply, conversation list, thread view). The nav shows a red unread badge that polls every 30 seconds. There are no in-app toast notifications when a new message arrives while the user is browsing.

## Requested Changes (Diff)

### Add
- In-app toast notification that fires whenever the unread count increases while the user is authenticated and browsing any page.
- Notification toast should show: "New message on [listing title]" with a button/link to open the Inbox.
- A `useMessageNotifications` hook in `useQueries.ts` (or a new file) that tracks the previous unread count and triggers a toast when it goes up.

### Modify
- `App.tsx`: wire up the new notification hook so it runs globally while the user is signed in.
- Poll interval for unread count: reduce from 30s to 15s so notifications feel more responsive.

### Remove
- Nothing removed.

## Implementation Plan
1. Add `useMessageNotifications` hook that polls `getUnreadCount`, compares to previous value, and fires a `toast` (sonner) when it increases.
2. The hook also calls `getConversationSummaries` on change to find the listing title of the newest unread conversation for the toast message.
3. Wire the hook into `App.tsx` so it runs whenever the user is authenticated.
4. Reduce the unread count refetch interval from 30s to 15s in `useUnreadCount`.
