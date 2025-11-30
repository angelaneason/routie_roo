const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GoogleContact {
  resourceName: string;
  names?: Array<{
    displayName?: string;
  }>;
  emailAddresses?: Array<{
    value?: string;
  }>;
  addresses?: Array<{
    formattedValue?: string;
    type?: string;
  }>;
  phoneNumbers?: Array<{
    value?: string;
    type?: string;
  }>;
  photos?: Array<{
    url?: string;
  }>;
  memberships?: Array<{
    contactGroupMembership?: {
      contactGroupResourceName?: string;
    };
  }>;
}

interface GooglePeopleResponse {
  connections: GoogleContact[];
  nextPageToken?: string;
}

/**
 * Generate Google OAuth URL for requesting contacts access
 */
export function getGoogleAuthUrl(redirectUri: string, state?: string): string {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID not configured");
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/contacts https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
    access_type: "offline",
    prompt: "consent",
  });

  if (state) {
    params.append("state", state);
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  return response.json();
}

/**
 * Fetch contacts from Google People API
 */
export async function fetchGoogleContacts(accessToken: string): Promise<GoogleContact[]> {
  const allContacts: GoogleContact[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      personFields: "names,emailAddresses,addresses,phoneNumbers,photos,memberships",
      pageSize: "1000",
    });

    if (pageToken) {
      params.append("pageToken", pageToken);
    }

    const response = await fetch(
      `https://people.googleapis.com/v1/people/me/connections?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch contacts: ${error}`);
    }

    const data: GooglePeopleResponse = await response.json();
    
    if (data.connections) {
      allContacts.push(...data.connections);
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return allContacts;
}

/**
 * Fetch contact group names from Google People API
 */
export async function fetchContactGroupNames(accessToken: string): Promise<Map<string, string>> {
  const groupMap = new Map<string, string>();
  
  try {
    const response = await fetch(
      'https://people.googleapis.com/v1/contactGroups',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch contact groups:', await response.text());
      return groupMap;
    }

    const data = await response.json();
    
    if (data.contactGroups) {
      for (const group of data.contactGroups) {
        if (group.resourceName && group.name) {
          groupMap.set(group.resourceName, group.name);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching contact groups:', error);
  }
  
  return groupMap;
}

/**
 * Parse Google contacts into our format
 */
export function parseGoogleContacts(googleContacts: GoogleContact[], groupNameMap?: Map<string, string>) {
  return googleContacts
    // Filter out contact groups and other non-person entries
    .filter(contact => {
      // Only include entries that start with "people/" (actual contacts)
      // Exclude "contactGroups/" and other resource types
      return contact.resourceName?.startsWith('people/');
    })
    // Also filter out contacts without names (invalid entries)
    .filter(contact => contact.names && contact.names.length > 0)
    .map(contact => {
      const name = contact.names?.[0]?.displayName || "Unknown";
      const email = contact.emailAddresses?.[0]?.value || null;
      const address = contact.addresses?.[0]?.formattedValue || null;
      
      // Parse phone numbers with labels
      const phoneNumbers = contact.phoneNumbers?.map(phone => ({
        value: phone.value || "",
        label: phone.type || "other",
      })) || [];
      
      // Get photo URL
      const photoUrl = contact.photos?.[0]?.url || null;
      
      // Parse contact labels/groups from memberships
      const labelResourceNames = contact.memberships
        ?.filter(m => m.contactGroupMembership)
        ?.map(m => m.contactGroupMembership?.contactGroupResourceName)
        ?.filter(Boolean) || [];
      
      // Resolve group IDs to names if groupNameMap is provided
      const labels = groupNameMap 
        ? labelResourceNames
            .filter((rn): rn is string => !!rn)
            .map(resourceName => {
              const groupName = groupNameMap.get(resourceName);
              // If we have a name, use it; otherwise keep the resource name
              return groupName || resourceName;
            })
        : labelResourceNames;

      return {
        resourceName: contact.resourceName,
        name,
        email,
        address,
        phoneNumbers: JSON.stringify(phoneNumbers),
        photoUrl,
        labels: JSON.stringify(labels),
      };
    });
}

/**
 * Update a contact in Google Contacts
 */
export async function updateGoogleContact(
  accessToken: string,
  resourceName: string,
  updates: {
    name?: string;
    email?: string;
    address?: string;
    phoneNumbers?: Array<{ value: string; label: string }>;
  }
): Promise<void> {
  // First, fetch the current contact to get the etag
  const getResponse = await fetch(
    `https://people.googleapis.com/v1/${resourceName}?personFields=names,emailAddresses,addresses,phoneNumbers`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!getResponse.ok) {
    const error = await getResponse.text();
    throw new Error(`Failed to fetch contact for update: ${error}`);
  }

  const currentContact = await getResponse.json();
  const etag = currentContact.etag;

  // Build the update payload
  const updatePayload: any = {
    etag,
    names: updates.name ? [{ displayName: updates.name }] : currentContact.names,
    emailAddresses: updates.email ? [{ value: updates.email }] : currentContact.emailAddresses,
    addresses: updates.address ? [{ formattedValue: updates.address }] : currentContact.addresses,
    phoneNumbers: updates.phoneNumbers 
      ? updates.phoneNumbers.map(p => ({ value: p.value, type: p.label }))
      : currentContact.phoneNumbers,
  };

  // Update the contact
  const updateResponse = await fetch(
    `https://people.googleapis.com/v1/${resourceName}:updateContact?updatePersonFields=names,emailAddresses,addresses,phoneNumbers`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatePayload),
    }
  );

  if (!updateResponse.ok) {
    const error = await updateResponse.text();
    throw new Error(`Failed to update contact: ${error}`);
  }
}

/**
 * Create a Google Calendar event for a route
 */
/**
 * Fetch user's calendar list from Google Calendar API
 */
export async function getCalendarList(
  accessToken: string
): Promise<Array<{ id: string; summary: string; primary?: boolean; backgroundColor?: string }>> {
  console.log('[Calendar] Fetching calendar list...');
  
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  console.log('[Calendar] Calendar list response status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.error('[Calendar] Failed to fetch calendar list:', error);
    throw new Error(`Failed to fetch calendar list (${response.status}): ${error}`);
  }

  const data = await response.json();
  console.log('[Calendar] Successfully fetched', data.items?.length || 0, 'calendars');
  
  return data.items.map((cal: any) => ({
    id: cal.id,
    summary: cal.summary,
    primary: cal.primary,
    backgroundColor: cal.backgroundColor,
  }));
}

/**
 * Create a calendar event in the specified calendar
 */
export async function createCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    start: string; // ISO 8601 datetime
    end: string; // ISO 8601 datetime
    location?: string;
  },
  calendarId: string = 'primary'
): Promise<{ eventId: string; htmlLink: string }> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start,
          timeZone: "UTC",
        },
        end: {
          dateTime: event.end,
          timeZone: "UTC",
        },
        location: event.location,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create calendar event: ${error}`);
  }

  const data = await response.json();
  return {
    eventId: data.id,
    htmlLink: data.htmlLink,
  };
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  event: {
    summary?: string;
    description?: string;
    start?: string; // ISO 8601 datetime
    end?: string; // ISO 8601 datetime
    location?: string;
  },
  calendarId: string = 'primary'
): Promise<{ eventId: string; htmlLink: string }> {
  const updateData: any = {};
  
  if (event.summary !== undefined) updateData.summary = event.summary;
  if (event.description !== undefined) updateData.description = event.description;
  if (event.start) {
    updateData.start = {
      dateTime: event.start,
      timeZone: "UTC",
    };
  }
  if (event.end) {
    updateData.end = {
      dateTime: event.end,
      timeZone: "UTC",
    };
  }
  if (event.location !== undefined) updateData.location = event.location;
  
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update calendar event: ${error}`);
  }

  const data = await response.json();
  return {
    eventId: data.id,
    htmlLink: data.htmlLink,
  };
}

/**
 * Fetch Google Calendar events for a specific date range
 */
export async function getCalendarEvents(
  accessToken: string,
  timeMin: string, // ISO 8601 datetime
  timeMax: string, // ISO 8601 datetime
  calendarId: string = 'primary'
): Promise<Array<{
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  htmlLink?: string;
  colorId?: string;
}>> {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.append('timeMin', timeMin);
  url.searchParams.append('timeMax', timeMax);
  url.searchParams.append('singleEvents', 'true');
  url.searchParams.append('orderBy', 'startTime');
  url.searchParams.append('maxResults', '250');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch calendar events: ${error}`);
  }

  const data = await response.json();
  
  return (data.items || []).map((event: any) => ({
    id: event.id,
    summary: event.summary || '(No title)',
    description: event.description,
    start: event.start.dateTime || event.start.date,
    end: event.end.dateTime || event.end.date,
    location: event.location,
    htmlLink: event.htmlLink,
    colorId: event.colorId,
  }));
}

/**
 * Fetch events from all user's calendars for a date range
 */
export async function getAllCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
  calendarIds?: string[] // Optional: filter by specific calendar IDs
): Promise<Array<{
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  htmlLink?: string;
  colorId?: string;
  calendarId?: string;
  calendarName?: string;
  backgroundColor?: string;
}>> {
  // First, get all calendars
  const calendars = await getCalendarList(accessToken);
  
  // Filter calendars if calendarIds provided
  const targetCalendars = calendarIds && calendarIds.length > 0
    ? calendars.filter(cal => calendarIds.includes(cal.id))
    : calendars;
  
  // Fetch events from each calendar
  const allEvents = await Promise.all(
    targetCalendars.map(async (calendar) => {
      try {
        const events = await getCalendarEvents(accessToken, timeMin, timeMax, calendar.id);
        return events.map(event => ({
          ...event,
          calendarId: calendar.id,
          calendarName: calendar.summary,
          backgroundColor: calendar.backgroundColor, // Include calendar color
        }));
      } catch (error) {
        console.error(`Failed to fetch events from calendar ${calendar.summary}:`, error);
        return [];
      }
    })
  );
  
  // Flatten and sort by start time
  return allEvents
    .flat()
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}


/**
 * Refresh an expired Google OAuth access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
  };
}
