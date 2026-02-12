
import type { AppConfig, TestMailResponse } from '@types/mail';

interface FetchParams {
  config: AppConfig;
  limit?: number;
  offset?: number;
  tag?: string;
  timestamp_from?: number | string;
  liveQuery?: boolean;
}

export async function fetchEmailsApi({ 
  config, 
  limit = 10, 
  offset = 0, 
  tag, 
  timestamp_from, 
  liveQuery = false 
}: FetchParams): Promise<TestMailResponse> {
  if (!config.apiKey || !config.namespace) {
    throw new Error("Missing configuration");
  }

  let url = `https://api.testmail.app/api/json?apikey=${config.apiKey}&namespace=${config.namespace}&pretty=false`;
  
  // Extended metadata
  url += `&headers=true&spam_report=true`;

  if (liveQuery) {
    url += `&livequery=true`;
    url += `&limit=100`; // Capture as many as possible in one go
    url += `&offset=0`;
    // For live query, timestamp_from is handled by the caller (hook) passing the last known timestamp + 1
    if (timestamp_from) url += `&timestamp_from=${timestamp_from}`;
  } else {
    url += `&limit=${limit}&offset=${offset}`;
    if (timestamp_from) {
      const ts = typeof timestamp_from === 'string' ? new Date(timestamp_from).getTime() : timestamp_from;
      url += `&timestamp_from=${ts}`;
    }
  }

  if (tag) url += `&tag=${encodeURIComponent(tag)}`;

  const response = await fetch(url);

  if (!response.ok) {
    // Pass status for handling 502/504 in the hook
    const error: any = new Error(response.statusText);
    error.status = response.status;
    throw error;
  }

  return response.json();
}
