LucknowSeva AI Assistant — Approval workflow update
====================================================

What this package contains
- server.ts: backend version based on the code you shared, with a basic owner-approval workflow added.
- README_HINDI.txt: installation and safety notes.

Important limitations
- This is a backend update only. The current website UI does not yet have buttons to review/approve/reject pending actions. Those frontend changes are a separate step.
- The approval endpoints require an OWNER_APPROVAL_TOKEN environment variable in Render. Set a long private value there; never paste it into chat or commit it to GitHub.
- Existing /api/providers, /api/bookings, and /api/customer/book routes are kept for compatibility with the current app. They still save directly, so the frontend must be changed to use the new pending-approval endpoints before the whole workflow is approval-gated.
- The app currently stores data in a local JSON file. On Render free instances, local disk data may not be durable across redeploys/restarts unless a persistent disk is configured. Use a database for production.
- Do not put real customer/provider data into a public repository.

New API endpoints
1. POST /api/approval/request
   Body: { "type": "provider" | "booking", "payload": { ... } }
   Creates a pending action; does not save it as a provider/booking.
2. GET /api/approval/pending
   Header: x-owner-token: <OWNER_APPROVAL_TOKEN>
   Lists pending actions.
3. POST /api/approval/:id/approve
   Header: x-owner-token: <OWNER_APPROVAL_TOKEN>
   Saves the provider/booking only after owner approval.
4. POST /api/approval/:id/reject
   Header: x-owner-token: <OWNER_APPROVAL_TOKEN>
   Rejects the pending action.

Deploy steps (Android-friendly)
1. Download and unzip this ZIP.
2. Replace the existing server.ts in GitHub with the server.ts from this ZIP, keeping the filename exactly server.ts.
3. In Render > Environment, add OWNER_APPROVAL_TOKEN with a long private secret value.
4. Commit the change in GitHub and wait for Render deploy to succeed.
5. Do not send the token to anyone or place it in frontend JavaScript.
6. Before using with real bookings, the frontend must be updated to request approval and show an owner-only approval screen.

This does not change your Gemini API key and never prints it in logs.
