# Tournament & Competition Sources — Boxer AI seed research (2026-09-23)

Scope: amateur boxing competition opportunities in BC. No clubs or events were invented;
everything below is from observed public sources. Exact URLs are copied verbatim.

## Source 1 — Boxing BC (provincial sanctioning body)

- Calendar (month view): https://boxingbc.ca/events/month/2026-12/
- Example event detail pages:
  - https://boxingbc.ca/event/2026-bronze-gloves-and-provincials/
  - https://boxingbc.ca/event/boxing-wars-2/
  - https://boxingbc.ca/event/full-throttle-fight-night-5/
- Platform: WordPress "The Events Calendar" (Tribe Events) plugin — the
  `events/month/<YYYY-MM>/` URL pattern and per-event export links confirm this.
- Fields published per event: title, start/end date & time, event category
  (e.g. "Club Show"), organizer (name + club), venue name + full address,
  event description, eligibility/divisions, registration deadlines/instructions
  when supplied, and "Add to calendar" links (Google Calendar, iCalendar,
  Outlook 365, Outlook Live).
- Structured feeds: the export links confirm iCalendar data exists per event.
  A global iCal/RSS endpoint was NOT verified — the standard The Events Calendar
  pattern (`?ical=1`) should be tested before relying on it, never assumed.
- Registration: fragmented. Examples observed —
  - Trackie: https://www.trackie.com/event/2026-boxing-bc-provincials/1038097/
    (2026 Boxing BC Provincials; fields: date, venue, eligibility, registration
    open/close, prices/deadlines, seeding, draw)
  - Google Sheets, email instructions, or club-specific systems for smaller shows.
- Example flagship event: 2026 Bronze Gloves & Provincials, Sept 25–27 2026,
  Chilliwack Landing (Chilliwack, BC), hosted by Chilliwack Boxing Club.
  Next milestone event: 2026 Boxing BC Provincials, Nov 27–29 2026.

## Source 2 — Boxing Canada (national body)

- Calendar (month view): https://boxingcanada.org/events/month/
- General event archive: https://boxingcanada.org/?post_type=tribe_events
- Platform: also The Events Calendar (Tribe Events).
- Fields published: title, date/time or multi-day range, venue/address, host,
  description, sanctioning organization, eligibility/event type, and links to
  registration, handbooks, livestreams.
- Registration: https://secure.boxingcanada.org — appears to be a Trackie-backed
  portal. Examples observed:
  - https://secure.boxingcanada.org/register/2026-boxing-canada-u17-u19-u23-national-championships/1018601/
  - https://secure.boxingcanada.org/event/2026-canada-cup-athlete-coach-registration/1018600/
- No public API or RSS feed verified.

## Source 3 — Trackie (registration platform)

- Event search: https://www.trackie.com/online-registration/find-event/
- Example event page: https://www.trackie.com/event/2026-boxing-bc-provincials/1038097/
- No public API or RSS feed was found. Event pages are public HTML and can be
  scraped, but the URL scheme embeds an opaque event ID, so discovery must go
  through Boxing BC/Canada links or Trackie's own search.

## Source 4 — Per-club ticketing/schedule pages

- Clubs announce their own shows on their sites and on ticketing platforms:
  - Chilliwack Boxing Club uses EventBookings and Eventbrite for show tickets.
  - Unified Training Centre (Maple Ridge) lists exhibition/sparring events on
    Eventbrite.
- These are discovery feeds: follow each club's site + Eventbrite organizer
  pages for shows not yet posted to Boxing BC.

## Recommended ingestion approach (Phase 3)

1. **Primary feed**: scrape Boxing BC's `events/month/<YYYY-MM>/` calendar and
   each `/event/<slug>/` detail page (server-rendered HTML — simple HTTP fetch
   + parse, no browser needed). Same for Boxing Canada's calendar.
2. **Structured fallback**: test whether the sites serve the standard
   The Events Calendar iCal feed; if yes, prefer it over HTML scraping.
3. **Registration enrichment**: for each event, follow the registration URL.
   Trackie event pages are public HTML — scrape fields (deadline, price,
   eligibility) into structured columns.
4. **Classification**: not every calendar entry is an athlete opportunity —
   meetings, camps, and official clinics must be filtered out (use the event
   category field, e.g. keep "Club Show" / tournament types).
5. **Cadence**: daily refresh; provincials/nationals timelines change
   (registration windows, weigh-in details) as the event nears.

## Automation blockers

- No documented public API for Boxing BC, Boxing Canada, or Trackie.
- Event detail structure is inconsistent — deadlines and eligibility are often
  free text, PDF handbooks, Google Docs, or email instructions.
- Registration is split across Trackie, secure.boxingcanada.org, Google
  Sheets, and email; deep normalization of registration flows is not
  feasible for v1 — store the registration URL + extracted deadline text.
- Club shows ("Club Show" category) are posted irregularly by member clubs;
  coverage depends on clubs submitting to Boxing BC, so the calendar is
  incomplete by nature — per-club following (Source 4) fills gaps.
- A direct fetch of boxingbc.org failed (domain is boxingbc.ca — the .org
  domain is not the sanctioning body); do not retry boxingbc.org.
