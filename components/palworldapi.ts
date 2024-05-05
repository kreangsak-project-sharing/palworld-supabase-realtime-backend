/**
 * Fetches data from the REST API endpoint with Basic Authentication.
 * @param apiurl The API endpoint URL.
 * @returns The fetched data.
 */
export const restAPI = async (apiurl: string) => {
  // Credentials for Basic Authentication
  const username = process.env.NODE_RCON_USER;
  const password = process.env.NODE_RCON_PASSWORD;

  try {
    // Fetch data from the API endpoint
    const response = await fetch(
      `${process.env.NODE_PALWORLD_APIURL}${apiurl}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${btoa(`${username}:${password}`)}`, // Basic Auth header
          //   "Content-Type": "application/json", // Specify JSON content type
        },
        // body: JSON.stringify({ message: "Your message here" }), // Convert object to JSON string
      }
    );

    // Check if response is OK
    if (!response.ok) {
      // Throw an error if response is not OK
      throw new Error(`Failed to fetch API: ${response.statusText}`);
    }

    // Parse response body as JSON
    const data = await response.json();
    return data; // Return the fetched data
  } catch (error) {
    // Handle any errors
    console.error("There was a problem with the fetch operation:", error);
    throw error; // Rethrow the error to handle it outside of this function
  }
};

/**
 * Fetches server information from the REST API.
 * @returns Server information data.
 */
export const apiServerInfo = async () => {
  try {
    return await restAPI("info");
  } catch (error) {
    throw error; // Rethrow any errors
  }
};

/**
 * Fetches player information from the REST API.
 * @returns Player information data.
 */
export const apiShowPlayers = async () => {
  try {
    const rest = await restAPI("players");
    return rest.players;
  } catch (error) {
    throw error; // Rethrow any errors
  }
};

/**
 * Fetches server settings from the REST API.
 * @returns Server settings data.
 */
export const apiServerSettings = async () => {
  try {
    return await restAPI("settings");
  } catch (error) {
    throw error; // Rethrow any errors
  }
};

/**
 * Fetches server metrics from the REST API.
 * @returns Server metrics data.
 */
export const apiServerMetrics = async () => {
  try {
    return await restAPI("metrics");
  } catch (error) {
    throw error; // Rethrow any errors
  }
};

/**
 * Announces a message using the REST API.
 * @returns Announcement response data.
 */
export const apiAnnounceMessage = async () => {
  try {
    return await restAPI("announce");
  } catch (error) {
    throw error; // Rethrow any errors
  }
};
