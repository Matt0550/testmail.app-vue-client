
import type { TestMailResponse } from '@models/mail';
import type { AppConfig } from '@models/config';
import { GraphQLClient } from 'graphql-request';

interface FetchParams {
  config: AppConfig;
  limit?: number;
  offset?: number;
  tag?: string;
  timestamp_from?: number | string;
  liveQuery?: boolean;
  /** server-side subject filter (uses GraphQL advanced_filters) */
  subject?: string;
  /** match type for subject filter (defaults to wildcard) */
  subjectMatch?: 'exact' | 'wildcard';
}

export async function fetchEmailsApi({ 
  config, 
  limit = 10, 
  offset = 0, 
  tag, 
  timestamp_from, 
  liveQuery = false,
  subject,
  subjectMatch = 'wildcard'
}: FetchParams): Promise<TestMailResponse> {
  if (!config.apiKey || !config.namespace) {
    throw new Error('Missing configuration');
  }

  // normalize timestamp_from (accept string or number)
  const ts = timestamp_from ? (typeof timestamp_from === 'string' ? new Date(timestamp_from).getTime() : (timestamp_from as number)) : undefined;

  const client = new GraphQLClient('https://api.testmail.app/api/graphql', {
    headers: { Authorization: `Bearer ${config.apiKey}` }
  });

  const QUERY = `query Inbox($namespace: String!, $tag: String, $timestamp_from: Float, $livequery: Boolean, $limit: Int, $offset: Int, $advanced_filters: [AdvancedFilter]) {
    inbox(
      namespace: $namespace
      tag: $tag
      timestamp_from: $timestamp_from
      livequery: $livequery
      limit: $limit
      offset: $offset
      advanced_filters: $advanced_filters
    ) {
      result
      message
      count
      limit
      offset
      emails {
        id
        namespace
        tag
        timestamp
        date
        messageId
        references
        envelope_from
        envelope_to
        from
        from_parsed { address name group }
        to
        to_parsed { address name group }
        cc
        cc_parsed { address name group }
        subject
        headers { line key }
        html
        text
        attachments { filename contentType checksum size headers { line key } downloadUrl contentId cid related }
        SPF
        dkim
        spam_score
        spam_report
        sender_ip
        downloadUrl
      }
    }
  }`;

  const advanced_filters = subject && subject.trim().length > 0
    ? [{ field: 'subject', match: subjectMatch === 'exact' ? 'exact' : 'wildcard', action: 'include', value: subject.trim() }]
    : undefined;

  const variables: Record<string, unknown> = {
    namespace: config.namespace,
    tag: tag || undefined,
    timestamp_from: ts,
    livequery: liveQuery || false,
    limit: liveQuery ? 100 : limit,
    offset: liveQuery ? 0 : offset,
    advanced_filters
  };

  try {
    const resp = await client.request<{ inbox: any }>(QUERY, variables as any);
    const inbox = resp.inbox;
    if (!inbox) throw new Error('Invalid API response');

    // sanitize emails (ensure arrays are arrays, not null)
    const sanitizeEmail = (em: any) => ({
      ...em,
      references: Array.isArray(em?.references) ? em.references : [],
      from_parsed: Array.isArray(em?.from_parsed) ? em.from_parsed : (em?.from_parsed ? [em.from_parsed] : []),
      to_parsed: Array.isArray(em?.to_parsed) ? em.to_parsed : [],
      cc_parsed: Array.isArray(em?.cc_parsed) ? em.cc_parsed : [],
      headers: Array.isArray(em?.headers) ? em.headers : [],
      attachments: Array.isArray(em?.attachments) ? em.attachments : [],
      subject: em?.subject ?? '',
      tag: em?.tag ?? '',
      namespace: em?.namespace ?? ''
    });

    const emails = Array.isArray(inbox.emails) ? inbox.emails.map(sanitizeEmail) : [];

    const retval: TestMailResponse = {
      result: inbox.result ?? 'fail',
      message: inbox.message ?? null,
      count: inbox.count ?? 0,
      limit: inbox.limit ?? (liveQuery ? 100 : limit),
      offset: inbox.offset ?? (liveQuery ? 0 : offset),
      emails
    };

    return retval;
  } catch (err: any) {
    // If the GraphQL server returned partial data alongside errors, use it (sanitise null arrays)
    const partial = err?.response?.data?.inbox;
    if (partial) {
      const sanitizeEmail = (em: any) => ({
        ...em,
        references: Array.isArray(em?.references) ? em.references : [],
        from_parsed: Array.isArray(em?.from_parsed) ? em.from_parsed : (em?.from_parsed ? [em.from_parsed] : []),
        to_parsed: Array.isArray(em?.to_parsed) ? em.to_parsed : [],
        cc_parsed: Array.isArray(em?.cc_parsed) ? em.cc_parsed : [],
        headers: Array.isArray(em?.headers) ? em.headers : [],
        attachments: Array.isArray(em?.attachments) ? em.attachments : [],
        subject: em?.subject ?? '',
        tag: em?.tag ?? '',
        namespace: em?.namespace ?? ''
      });

      const emails = Array.isArray(partial.emails) ? partial.emails.map(sanitizeEmail) : [];

      const retval: TestMailResponse = {
        result: partial.result ?? 'fail',
        message: partial.message ?? null,
        count: partial.count ?? 0,
        limit: partial.limit ?? (liveQuery ? 100 : limit),
        offset: partial.offset ?? (liveQuery ? 0 : offset),
        emails
      };

      return retval;
    }

    if (err?.response?.status) {
      const e: any = new Error(err.message || 'GraphQL error');
      e.status = err.response.status;
      throw e;
    }
    throw err;
  }
}
