# EventLayer REST API Documentation

The EventLayer REST API provides read-only access to event and user data through authenticated endpoints.

## Authentication

All API requests require authentication via an API key passed in the `Authorization` header:

```bash
curl -H "Authorization: Bearer el_your_api_key_here" \
  https://yourevent.eventlayer.io/rest/event
```

### Creating API Keys

1. Navigate to `/manage/settings` in your event dashboard
2. Scroll to the "API Keys" section
3. Enter a descriptive name for your key
4. Click "Create"
5. Copy the generated key immediately (it won't be shown again)

## Endpoints

### GET /rest/event

Lists all events (main event and sub-events) associated with your API key.

#### Query Parameters

**Pagination:**
- `limit` (integer, 1-100, default: 50) - Number of results per page
- `offset` (integer, default: 0) - Number of results to skip
- `page` (integer) - Alternative to offset, calculates offset automatically

**Sorting:**
- `sortBy` (string) - Field to sort by: `name`, `startsAt`, `endsAt`, `type`, `createdAt`, `updatedAt`, `ord`
- `sortOrder` (string) - Sort direction: `asc` or `desc` (default: `asc`)

**Filtering:**
- `filter.type` (string) - Filter by event type (e.g., `program`, `panel`, `meal`)
- `filter.eventFor` (string) - Filter by eventFor field (e.g., `all`, `full`, `rsvp`)
- `filter.meta.key` (string) - Filter by event_meta key/value pairs

#### Example Requests

```bash
# Get first 10 events
curl -H "Authorization: Bearer el_..." \
  "https://yourevent.eventlayer.io/rest/event?limit=10"

# Get events sorted by start date (descending)
curl -H "Authorization: Bearer el_..." \
  "https://yourevent.eventlayer.io/rest/event?sortBy=startsAt&sortOrder=desc"

# Get page 2 with 20 results per page
curl -H "Authorization: Bearer el_..." \
  "https://yourevent.eventlayer.io/rest/event?limit=20&page=2"

# Filter by event type
curl -H "Authorization: Bearer el_..." \
  "https://yourevent.eventlayer.io/rest/event?filter.type=panel"

# Filter events with visible_on_site=1 metadata
curl -H "Authorization: Bearer el_..." \
  "https://yourevent.eventlayer.io/rest/event?filter.meta.visible_on_site=1"

# Combine multiple filters
curl -H "Authorization: Bearer el_..." \
  "https://yourevent.eventlayer.io/rest/event?filter.type=program&filter.meta.featured=1&limit=5"
```

#### Response Format

```json
{
  "events": [
    {
      "id": "uuid",
      "name": "Event Name",
      "subtitle": "Event Subtitle",
      "description": "Event description",
      "type": "program",
      "startsAt": "2024-01-15T10:00:00",
      "endsAt": "2024-01-15T11:00:00",
      "maxAttendees": 100,
      "numAttendees": 45,
      "eventFor": "all",
      "showAttendeeList": true,
      "ord": 1,
      "venue": {
        "id": "uuid",
        "name": "Main Hall",
        "description": "First floor main hall"
      },
      "meta": {
        "visible_on_site": "1",
        "featured": "1",
        "custom_field": "value"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "page": 1,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### GET /rest/users

Lists all users associated with the event.

#### Query Parameters

**Pagination:**
- `limit` (integer, 1-100, default: 50) - Number of results per page
- `offset` (integer, default: 0) - Number of results to skip
- `page` (integer) - Alternative to offset

**Sorting:**
- `sortBy` (string) - Field to sort by:
  - User fields: `firstName`, `lastName`, `email`
  - Event user fields: `type`, `status`, `company`, `title`, `createdAt`
- `sortOrder` (string) - Sort direction: `asc` or `desc` (default: `asc`)

**Filtering:**
- `filter.type` (string) - Filter by user type (e.g., `attendee`, `speaker`, `host`)
- `filter.status` (string) - Filter by user status (e.g., `active`, `inactive`)
- `filter.meta.key` (string) - Filter by event_user_info key/value pairs

#### Example Requests

```bash
# Get all users (default: first 50)
curl -H "Authorization: Bearer el_..." \
  "https://yourevent.eventlayer.io/rest/users"

# Get speakers only
curl -H "Authorization: Bearer el_..." \
  "https://yourevent.eventlayer.io/rest/users?filter.type=speaker"

# Sort by last name
curl -H "Authorization: Bearer el_..." \
  "https://yourevent.eventlayer.io/rest/users?sortBy=lastName&sortOrder=asc"

# Filter users with specific metadata
curl -H "Authorization: Bearer el_..." \
  "https://yourevent.eventlayer.io/rest/users?filter.meta.vip=1"

# Get active attendees, sorted by company
curl -H "Authorization: Bearer el_..." \
  "https://yourevent.eventlayer.io/rest/users?filter.type=attendee&filter.status=active&sortBy=company"

# Pagination example
curl -H "Authorization: Bearer el_..." \
  "https://yourevent.eventlayer.io/rest/users?limit=25&page=3"
```

#### Response Format

```json
{
  "users": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "type": "attendee",
      "status": "active",
      "company": "Acme Inc",
      "title": "Software Engineer",
      "bio": "Passionate about technology...",
      "url": "https://johndoe.com",
      "photo": {
        "id": "uuid",
        "url": "https://..."
      },
      "meta": {
        "dietary_restrictions": "vegetarian",
        "t_shirt_size": "L",
        "custom_field": "value"
      }
    }
  ],
  "pagination": {
    "total": 250,
    "limit": 50,
    "offset": 0,
    "page": 1,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Filtering by Metadata

Both endpoints support filtering by metadata fields using the `filter.meta.key=value` syntax.

### Event Metadata Filtering

Event metadata is stored in the `event_meta` table. Only events that have a metadata entry matching both the key and value will be returned.

```bash
# Find events marked as visible
curl -H "Authorization: Bearer el_..." \
  "https://yourevent.eventlayer.io/rest/event?filter.meta.visible_on_site=1"

# Find featured events
curl -H "Authorization: Bearer el_..." \
  "https://yourevent.eventlayer.io/rest/event?filter.meta.featured=true"
```

### User Metadata Filtering

User metadata is stored in the `event_user_info` table. Only users with **public** metadata matching the key and value will be returned.

```bash
# Find VIP attendees
curl -H "Authorization: Bearer el_..." \
  "https://yourevent.eventlayer.io/rest/users?filter.meta.vip=1"

# Find users with specific dietary restrictions
curl -H "Authorization: Bearer el_..." \
  "https://yourevent.eventlayer.io/rest/users?filter.meta.dietary_restrictions=vegetarian"
```

## Rate Limiting

Currently, there are no rate limits, but they may be added in the future. Use pagination and appropriate limits to minimize API load.

## Error Responses

### 401 Unauthorized
```json
{
  "message": "API key required"
}
```

or

```json
{
  "message": "Invalid API key"
}
```

### 400 Bad Request
```json
{
  "message": "Invalid query parameters"
}
```

## Best Practices

1. **Use pagination** - Always use `limit` to prevent loading too much data
2. **Cache responses** - API key usage is tracked; avoid unnecessary requests
3. **Filter efficiently** - Use metadata filters to reduce result sets
4. **Sort on indexed fields** - Sorting by `startsAt`, `createdAt`, or `type` is faster
5. **Secure your API keys** - Never commit API keys to version control or expose them in client-side code

## Example Integration (JavaScript)

```javascript
const API_KEY = 'el_your_api_key_here'
const BASE_URL = 'https://yourevent.eventlayer.io'

async function getEvents(filters = {}) {
  const params = new URLSearchParams(filters)
  const response = await fetch(`${BASE_URL}/rest/event?${params}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  })
  return response.json()
}

// Get featured events
const featuredEvents = await getEvents({
  'filter.meta.featured': '1',
  'sortBy': 'startsAt',
  'limit': 10
})

// Get speakers
async function getSpeakers() {
  const response = await fetch(`${BASE_URL}/rest/users?filter.type=speaker`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  })
  return response.json()
}
```

## Support

For questions or issues with the API, please contact support or create an issue in the repository.
