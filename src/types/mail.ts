
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
  size: number;
  contentDisposition: string;
  checksum: string;
  contentId: string;
  contentType: string;
  cid: string;
  downloadUrl: string;
}

export interface TestMailEmail {
  id: string;
  oid: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  date: number;
  timestamp: number;
  tag: string;
  namespace: string;
  envelope_to: string;
  envelope_from: string;
  to_parsed: EmailParsedAddress[];
  from_parsed: EmailParsedAddress[];
  cc_parsed: EmailParsedAddress[];
  attachments: TestMailAttachment[];
  downloadUrl: string;
  headers?: TestMailHeader[];
  read?: boolean; // Local UI state
  spam_score?: number;
  spam_report?: string;
}

export interface TestMailResponse {
  result: string;
  message: string | null;
  count: number;
  limit: number;
  offset: number;
  emails: TestMailEmail[];
}
