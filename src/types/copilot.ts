export interface SearchEmailsParams {
  query?: string;
  sender?: string;
  subject?: string;
  dateFrom?: string;
  dateTo?: string;
  isUnread?: boolean;
  days?: number;
  [key: string]: unknown;
}

export interface OpenEmailParams {
  emailId?: string;
  sender?: string;
  subject?: string;
  latest?: boolean;
  [key: string]: unknown;
}
