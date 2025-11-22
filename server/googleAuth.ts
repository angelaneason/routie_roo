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
    scope: "https://www.googleapis.com/auth/contacts.readonly",
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
      personFields: "names,emailAddresses,addresses,phoneNumbers,photos",
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
 * Parse Google contacts into our format
 */
export function parseGoogleContacts(googleContacts: GoogleContact[]) {
  return googleContacts
    .filter(contact => contact.addresses && contact.addresses.length > 0)
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

      return {
        resourceName: contact.resourceName,
        name,
        email,
        address,
        phoneNumbers: JSON.stringify(phoneNumbers),
        photoUrl,
      };
    })
    .filter(contact => contact.address); // Only return contacts with addresses
}
