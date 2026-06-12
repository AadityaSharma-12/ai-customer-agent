export interface RetentionOffer {
  type: string;
  description: string;
  eligibility_reason: string;
}

export interface CustomerSummary {
  name: string;
  email: string;
  plan: string;
  status: string;
  subscription_start: string;
}

export interface CancelAccountRequest {
  customer_id: string;
  message: string;
  accept_retention_offer?: boolean | null;
}

export interface CancelAccountResponse {
  status: string;
  message: string;
  offer: RetentionOffer | null;
  refund: number | null;
  audit_log_id: number | null;
  customer_id: string;
  customer: CustomerSummary | null;
}
