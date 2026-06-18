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

export type CancelAccountStatus =
  | "invalid_customer"
  | "service_unavailable"
  | "off_topic"
  | "concern_followup"
  | "retention_offer_presented"
  | "clarification_needed"
  | "retained"
  | "cancelled";

export interface CancelAccountResponse {
  status: CancelAccountStatus;
  message: string;
  offer: RetentionOffer | null;
  refund: number | null;
  audit_log_id: number | null;
  customer_id: string;
  customer: CustomerSummary | null;
}
