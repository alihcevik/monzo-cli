export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user_id: string;
}

export interface WhoAmIResponse {
  authenticated: boolean;
  client_id: string;
  user_id: string;
}

export interface Account {
  id: string;
  description: string;
  type: string;
  currency: string;
  created: string;
  closed: boolean;
  owners: { user_id: string; preferred_name: string }[];
}

export interface AccountsResponse {
  accounts: Account[];
}

export interface Balance {
  balance: number;
  total_balance: number;
  currency: string;
  spend_today: number;
  local_currency: string;
  local_spend: [{ spend_today: number; currency: string }];
}

export interface Merchant {
  id: string;
  name: string;
  category: string;
  logo?: string;
}

export interface Transaction {
  id: string;
  created: string;
  description: string;
  amount: number;
  currency: string;
  merchant?: Merchant | null;
  notes: string;
  metadata: Record<string, string>;
  category: string;
  is_load: boolean;
  settled: string;
  decline_reason?: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
}
