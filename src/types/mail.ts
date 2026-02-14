
export interface EmailParsedAddress {
  address: string;
  name: string;
}

export interface TestMailHeader {
  line: string;
  key: string;
}

export interface TestMailAttachment {
  filename: string;
  contentType?: string;
  checksum?: string;
  size?: number;
  headers?: TestMailHeader[];
  downloadUrl?: string;
  contentId?: string;
  cid?: string;
  related?: boolean;
  // keep older fields for compatibility
  contentDisposition?: string;
}

export interface TestMailEmail {
  id: string;
  oid?: string; // present in JSON API responses; optional for GraphQL
  namespace: string;
  tag: string;
  timestamp: number;
  date?: number;
  messageId?: string;
  references?: string[];
  envelope_from?: string;
  envelope_to?: string;
  from: string;
  from_parsed?: EmailParsedAddress[];
  to?: string;
  to_parsed?: EmailParsedAddress[];
  cc?: string;
  cc_parsed?: EmailParsedAddress[];
  subject: string;
  headers?: TestMailHeader[];
  html?: string;
  text?: string;
  attachments?: TestMailAttachment[];
  SPF?: string;
  dkim?: string;
  spam_score?: number;
  spam_report?: string;
  sender_ip?: string;
  downloadUrl?: string;
  read?: boolean; // Local UI state
}

export interface TestMailResponse {
  result: string;
  message: string | null;
  count: number;
  limit: number;
  offset: number;
  emails: TestMailEmail[];
}
