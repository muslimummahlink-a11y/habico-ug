export interface QboTokenRow {
  id: string;
  company_id: string;
  realm_id: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  connected_at: string;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QboTokenPayload {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
  realmId: string;
}

export interface QboCompanyInfo {
  CompanyName: string;
  CompanyAddr: { Line1: string; City: string; Country: string; PostalCode: string };
  Email: { Address: string };
  Phone: { FreeFormNumber: string };
}

export interface QboCustomer {
  Id: string;
  DisplayName: string;
  GivenName?: string;
  FamilyName?: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  BillAddr?: { Line1: string; City: string; Country: string; PostalCode: string };
  Active?: boolean;
  SyncToken?: string;
}

export interface QboVendor {
  Id: string;
  DisplayName: string;
  GivenName?: string;
  FamilyName?: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  Active?: boolean;
  SyncToken?: string;
}

export interface QboInvoice {
  Id: string;
  DocNumber?: string;
  CustomerRef: { value: string; name?: string };
  TxnDate: string;
  TotalAmt: number;
  Balance: number;
  DueDate?: string;
  Line: QboInvoiceLine[];
  SyncToken?: string;
  EmailStatus?: string;
  CustomerMemo?: { value: string };
}

export interface QboInvoiceLine {
  Id?: string;
  LineNum?: number;
  Description?: string;
  Amount: number;
  DetailType: string;
  SalesItemLineDetail?: {
    ItemRef?: { value: string; name: string };
    UnitPrice?: number;
    Qty?: number;
    TaxCodeRef?: { value: string };
  };
}

export interface QboBill {
  Id: string;
  DocNumber?: string;
  VendorRef: { value: string; name?: string };
  TxnDate: string;
  TotalAmt: number;
  DueDate?: string;
  Balance?: number;
  Line: QboBillLine[];
  SyncToken?: string;
}

export interface QboBillLine {
  Id?: string;
  Description?: string;
  Amount: number;
  DetailType: string;
  AccountBasedExpenseLineDetail?: {
    AccountRef: { value: string; name: string };
    BillableStatus?: string;
    TaxCodeRef?: { value: string };
  };
}

export interface QboPayment {
  Id: string;
  TotalAmt: number;
  TxnDate: string;
  CustomerRef: { value: string; name?: string };
  SyncToken?: string;
  Line?: QboPaymentLine[];
}

export interface QboPaymentLine {
  Amount: number;
  LinkedTxn: { TxnId: string; TxnType: string }[];
}

export interface QboQueryResponse<T> {
  QueryResponse: {
    [key: string]: T[];
    maxResults?: number;
    totalCount?: number;
    startPosition?: number;
  };
  time: string;
}

export interface QboFault {
  Error: { Message: string; Detail: string; code: string; element?: string }[];
  type: string;
}

export interface QboErrorResponse {
  Fault: QboFault;
  time: string;
}

export interface SyncResult {
  success: boolean;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_message?: string;
}
