# FareHarbor connection

Life Organizer is a public static PWA. It cannot safely keep a FareHarbor API
credential and it cannot receive a booking webhook at a GitHub Pages URL. The
connection therefore has two deliberately separate halves:

1. A private bridge receives FareHarbor booking updates or reads the approved
   software-partner API.
2. `assets/js/fareharbor.js` reads a minimal tour feed from that bridge and puts
   tours assigned to the configured crew name in the Me inbox.

This is the security boundary. Do not bypass it by pasting a FareHarbor API key
into client JavaScript, the repository, a query string, or a backup.

## What is implemented in the app

- Me → Inbox has a FareHarbor connection card.
- The user supplies a private HTTPS bridge URL, bridge access key, and exact
  FareHarbor crew name on his own device.
- The app sends the bridge key in an `Authorization: Bearer …` header.
- The app polls on open and every five minutes while it is running.
- Only assigned tours are retained. New assigned tours become inbox updates and
  may create a quiet system notification when notification permission is on.
- The bridge key is stripped from every exported/GitHub backup and preserved
  locally when a backup is restored.

No customer name, phone, email, payment, party detail, or booking note belongs
in the response or in Life Organizer state.

## Bridge response contract

`GET <bridge-url>?guide=<configured-name>` with a bearer access key returns:

```json
{
  "tours": [
    {
      "id": "stable-assignment-or-availability-id",
      "title": "Tour name",
      "start": "2026-09-17T09:00:00-04:00",
      "end": "2026-09-17T11:00:00-04:00",
      "assignedTo": ["Exact Crew Name"],
      "status": "booked",
      "url": "https://fareharbor.com/.../dashboard/..."
    }
  ]
}
```

The response must allow `GET` from the production PWA origin, return JSON, and
never echo the access key. `id` must remain stable across refreshes so a tour is
not reported as new more than once.

## Remaining account-side setup

1. Ask the FareHarbor account owner/support team for read-only software
   integration or booking-webhook access. Confirm that crew assignments are in
   the approved payload.
2. Deploy a private webhook/API bridge with encrypted server-side secrets.
3. Normalize its response to the contract above and configure CORS for only the
   Life Organizer production origin.
4. Open Me → Inbox → Connect FareHarbor and enter the bridge URL, bridge access
   key, and exact assignment name.
5. Use **Save & test**. The app reports the count returned and begins polling.

The bridge has not been deployed from this repository because no FareHarbor
account authorization, API credential, webhook registration, or server account
was supplied. The client is ready for that final connection without another UI
or schema change.

## Official references

- FareHarbor Integration Center and webhook/API documentation:
  https://fareharbor.com/api/external/v1/
- FareHarbor's official overview says the External API supports read-only
  software integrations and real-time booking data:
  https://fareharbor.com/blog/how-does-the-fareharbor-api-work/
- FareHarbor describes booking webhooks sending availability and customer data
  to approved integrations; the bridge must discard the customer fields:
  https://help.fareharbor.com/hc/en-us/articles/40898258345883-Wherewolf-Integration
- FareHarbor's crew and integration sections document crew notifications and
  employee-scheduling connections:
  https://help.fareharbor.com/hc/en-us/categories/39091375525915-Using-the-Dashboard
