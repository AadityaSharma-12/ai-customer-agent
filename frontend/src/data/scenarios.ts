export interface CustomerProfile {
  name: string;
  email: string;
  company: string;
  avatar: string;
  subscriptionPlan: "Enterprise" | "Growth" | "Starter";
  monthlyPayment: number;
  remainingDays: number;
  churnRiskScore: number; // 0 to 100
  cancellationProbability: number; // 0 to 100
  tags: string[];
}

export interface ToolLog {
  timestamp: string;
  tool: string;
  status: "success" | "running" | "error" | "pending";
  durationMs: number;
  output: string;
}

export interface ReasoningStep {
  title: string;
  details: string;
  formula?: string;
  result?: string;
}

export interface WorkflowState {
  id: string;
  label: string;
  status: "idle" | "active" | "completed" | "error";
  updatedAt?: string;
}

export interface ChatMessage {
  sender: "customer" | "ai";
  text: string;
  timestamp: string;
}

export interface ScenarioStep {
  chat: ChatMessage[];
  tools: ToolLog[];
  reasoning: ReasoningStep[];
  workflow: WorkflowState[];
  currentStepIndex: number;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  customer: CustomerProfile;
  steps: ScenarioStep[];
}

export const scenarios: Scenario[] = [
  {
    id: "enterprise-churn",
    title: "Scenario A: Enterprise At-Risk (NexusCorp)",
    description: "High-value enterprise customer threat. VP of Ops requesting exit due to missing custom CRM mappings and competitor price matching.",
    customer: {
      name: "Alex Rivera",
      email: "a.rivera@nexuscorp.io",
      company: "NexusCorp Inc.",
      avatar: "AR",
      subscriptionPlan: "Enterprise",
      monthlyPayment: 4500,
      remainingDays: 280,
      churnRiskScore: 92,
      cancellationProbability: 88,
      tags: ["High Value", "Competitor Threat", "API Heavy"]
    },
    steps: [
      // Step 0: Customer Initiated Request
      {
        chat: [
          {
            sender: "customer",
            text: "Hello, our team is evaluating alternative solutions. We need to initiate the cancellation of our Enterprise plan. We are currently facing integration friction between your tool and our new customized Salesforce setup, and our budget is being audited.",
            timestamp: "17:20:02"
          }
        ],
        tools: [
          {
            timestamp: "17:20:03",
            tool: "Webhook Listener: cancellation_requested",
            status: "success",
            durationMs: 42,
            output: JSON.stringify({ event: "cancellation_requested", source: "in-app_billing", account_email: "a.rivera@nexuscorp.io" }, null, 2)
          }
        ],
        reasoning: [
          {
            title: "Sentiment Analysis",
            details: "Analyzed customer message. High urgency. Key churn drivers identified: Product Integration Friction (Salesforce CRM) and Contract Cost Review.",
            result: "Sentiment: Critical (-0.85/1.00)"
          }
        ],
        workflow: [
          { id: "request", label: "Customer Request", status: "completed" },
          { id: "auth", label: "Authentication", status: "active" },
          { id: "lookup", label: "Customer Lookup", status: "idle" },
          { id: "offer", label: "Retention Offer", status: "idle" },
          { id: "refund", label: "Refund Calculation", status: "idle" },
          { id: "cancellation", label: "Account Cancellation", status: "idle" },
          { id: "audit", label: "Audit Log Created", status: "idle" }
        ],
        currentStepIndex: 0
      },
      // Step 1: Authentication & Customer Lookup
      {
        chat: [
          {
            sender: "customer",
            text: "Hello, our team is evaluating alternative solutions. We need to initiate the cancellation of our Enterprise plan. We are currently facing integration friction between your tool and our new customized Salesforce setup, and our budget is being audited.",
            timestamp: "17:20:02"
          },
          {
            sender: "ai",
            text: "Initializing secure verification. Checking NexusCorp credentials and fetching active CRM records. Please wait...",
            timestamp: "17:20:10"
          }
        ],
        tools: [
          {
            timestamp: "17:20:03",
            tool: "Webhook Listener: cancellation_requested",
            status: "success",
            durationMs: 42,
            output: JSON.stringify({ event: "cancellation_requested", source: "in-app_billing", account_email: "a.rivera@nexuscorp.io" }, null, 2)
          },
          {
            timestamp: "17:20:11",
            tool: "Auth0 Authenticate User",
            status: "success",
            durationMs: 184,
            output: JSON.stringify({ authenticated: true, identity: "auth0|64f89dbe3a", roles: ["BillingAdmin", "VP_Operations"] }, null, 2)
          },
          {
            timestamp: "17:20:12",
            tool: "Zoho MCP: fetch_record_by_email",
            status: "success",
            durationMs: 312,
            output: JSON.stringify({
              accountId: "zoho_acc_98314",
              name: "NexusCorp Inc.",
              tier: "Enterprise",
              contract_start: "2025-10-01",
              contract_end: "2026-09-30",
              monthly_mrr: 4500,
              dedicated_support: "Yes",
              zoho_integration_active: false
            }, null, 2)
          }
        ],
        reasoning: [
          {
            title: "Sentiment Analysis",
            details: "Analyzed customer message. High urgency. Key churn drivers identified: Product Integration Friction (Salesforce CRM) and Contract Cost Review.",
            result: "Sentiment: Critical (-0.85/1.00)"
          },
          {
            title: "Customer Lookup Complete",
            details: "Retrieved account profile from Zoho CRM. Contract has 280 days remaining. Total remaining contract value (ACV) is substantial.",
            formula: "Remaining Value = Monthly payment ($4,500) * Remaining contract (9.33 months)",
            result: "Contract Value At Churn Risk: $42,000.00"
          }
        ],
        workflow: [
          { id: "request", label: "Customer Request", status: "completed" },
          { id: "auth", label: "Authentication", status: "completed" },
          { id: "lookup", label: "Customer Lookup", status: "completed" },
          { id: "offer", label: "Retention Offer", status: "active" },
          { id: "refund", label: "Refund Calculation", status: "idle" },
          { id: "cancellation", label: "Account Cancellation", status: "idle" },
          { id: "audit", label: "Audit Log Created", status: "idle" }
        ],
        currentStepIndex: 1
      },
      // Step 2: Generative Retention Offer Selection
      {
        chat: [
          {
            sender: "customer",
            text: "Hello, our team is evaluating alternative solutions. We need to initiate the cancellation of our Enterprise plan. We are currently facing integration friction between your tool and our new customized Salesforce setup, and our budget is being audited.",
            timestamp: "17:20:02"
          },
          {
            sender: "ai",
            text: "Initializing secure verification. Checking NexusCorp credentials and fetching active CRM records. Please wait...",
            timestamp: "17:20:10"
          },
          {
            sender: "ai",
            text: "Alex, I completely understand the frustration with custom integrations, and we highly value NexusCorp's partnership. I see that your integration with Salesforce requires custom schema mappings. \n\nBefore initiating cancellation, I would like to offer two immediate resolutions:\n1. **Integration Engineering Assist**: We will deploy an Integration Architect from our team to write a custom Zoho MCP connector mapping for NexusCorp at no charge (valued at $5,000).\n2. **Enterprise Volume Credit**: A 30% contract credit applied to your next 3 invoices ($1,350 monthly credit, total value of $4,050).\n\nWould this resolve your friction and allow NexusCorp to continue with us?",
            timestamp: "17:20:25"
          }
        ],
        tools: [
          {
            timestamp: "17:20:03",
            tool: "Webhook Listener: cancellation_requested",
            status: "success",
            durationMs: 42,
            output: JSON.stringify({ event: "cancellation_requested", source: "in-app_billing", account_email: "a.rivera@nexuscorp.io" }, null, 2)
          },
          {
            timestamp: "17:20:11",
            tool: "Auth0 Authenticate User",
            status: "success",
            durationMs: 184,
            output: JSON.stringify({ authenticated: true, identity: "auth0|64f89dbe3a", roles: ["BillingAdmin", "VP_Operations"] }, null, 2)
          },
          {
            timestamp: "17:20:12",
            tool: "Zoho MCP: fetch_record_by_email",
            status: "success",
            durationMs: 312,
            output: JSON.stringify({
              accountId: "zoho_acc_98314",
              name: "NexusCorp Inc.",
              tier: "Enterprise",
              contract_start: "2025-10-01",
              contract_end: "2026-09-30",
              monthly_mrr: 4500,
              dedicated_support: "Yes",
              zoho_integration_active: false
            }, null, 2)
          },
          {
            timestamp: "17:20:23",
            tool: "Gemini: generate_retention_offer",
            status: "success",
            durationMs: 742,
            output: JSON.stringify({
              retention_path: "high_value_save",
              parameters: {
                ltv: 54000,
                max_discount_allowed: 0.35,
                integration_architect_deploy: true,
                selected_offer: "30% off for 3 months + Custom Engineering Support",
                est_save_probability: 0.82
              }
            }, null, 2)
          }
        ],
        reasoning: [
          {
            title: "Sentiment Analysis",
            details: "Analyzed customer message. High urgency. Key churn drivers: Integration Friction and Cost.",
            result: "Sentiment: Critical (-0.85/1.00)"
          },
          {
            title: "Customer Lookup Complete",
            details: "Retrieved account profile from Zoho CRM. Total remaining contract value (ACV) is substantial.",
            formula: "Remaining Value = $4,500 * 9.33",
            result: "Contract Value At Churn Risk: $42,000.00"
          },
          {
            title: "LTV Optimization Analysis",
            details: "Comparing cost of customer retention package vs. cost of churn. Max discount budget is 35%. Dynamic formula balances immediate discount + custom services.",
            formula: "Net Benefit = (Contract Value * Save Prob) - (Retention Cost + Architect Cost)",
            result: "Net Business Value of Retention: +$29,390"
          }
        ],
        workflow: [
          { id: "request", label: "Customer Request", status: "completed" },
          { id: "auth", label: "Authentication", status: "completed" },
          { id: "lookup", label: "Customer Lookup", status: "completed" },
          { id: "offer", label: "Retention Offer", status: "completed" },
          { id: "refund", label: "Refund Calculation", status: "active" },
          { id: "cancellation", label: "Account Cancellation", status: "idle" },
          { id: "audit", label: "Audit Log Created", status: "idle" }
        ],
        currentStepIndex: 2
      },
      // Step 3: Customer Accepts Offer & Save Triggered
      {
        chat: [
          {
            sender: "customer",
            text: "Hello, our team is evaluating alternative solutions. We need to initiate the cancellation of our Enterprise plan. We are currently facing integration friction between your tool and our new customized Salesforce setup, and our budget is being audited.",
            timestamp: "17:20:02"
          },
          {
            sender: "ai",
            text: "Initializing secure verification. Checking NexusCorp credentials and fetching active CRM records. Please wait...",
            timestamp: "17:20:10"
          },
          {
            sender: "ai",
            text: "Alex, I completely understand the frustration with custom integrations, and we highly value NexusCorp's partnership. I see that your integration with Salesforce requires custom schema mappings. \n\nBefore initiating cancellation, I would like to offer two immediate resolutions:\n1. **Integration Engineering Assist**: We will deploy an Integration Architect from our team to write a custom Zoho MCP connector mapping for NexusCorp at no charge (valued at $5,000).\n2. **Enterprise Volume Credit**: A 30% contract credit applied to your next 3 invoices ($1,350 monthly credit, total value of $4,050).\n\nWould this resolve your friction and allow NexusCorp to continue with us?",
            timestamp: "17:20:25"
          },
          {
            sender: "customer",
            text: "That proposal works for us. Having an architect assist with the Salesforce custom mapping is critical, and the credit helps satisfy our finance audit. We will stay. How do we formalize this?",
            timestamp: "17:20:48"
          },
          {
            sender: "ai",
            text: "Outstanding, Alex! I've executed the updates. Your contract is now secured with a 30% discount applied to your next three billing cycles. Our Integration Architect has been assigned to project 'NEXUS-SF-MAP' in our backlog and will contact you in under two hours. A complete record has been posted to Zoho CRM.",
            timestamp: "17:21:00"
          }
        ],
        tools: [
          {
            timestamp: "17:20:03",
            tool: "Webhook Listener: cancellation_requested",
            status: "success",
            durationMs: 42,
            output: JSON.stringify({ event: "cancellation_requested", source: "in-app_billing", account_email: "a.rivera@nexuscorp.io" }, null, 2)
          },
          {
            timestamp: "17:20:11",
            tool: "Auth0 Authenticate User",
            status: "success",
            durationMs: 184,
            output: JSON.stringify({ authenticated: true, identity: "auth0|64f89dbe3a", roles: ["BillingAdmin", "VP_Operations"] }, null, 2)
          },
          {
            timestamp: "17:20:12",
            tool: "Zoho MCP: fetch_record_by_email",
            status: "success",
            durationMs: 312,
            output: JSON.stringify({
              accountId: "zoho_acc_98314",
              name: "NexusCorp Inc.",
              tier: "Enterprise",
              contract_start: "2025-10-01",
              contract_end: "2026-09-30",
              monthly_mrr: 4500,
              dedicated_support: "Yes",
              zoho_integration_active: false
            }, null, 2)
          },
          {
            timestamp: "17:20:23",
            tool: "Gemini: generate_retention_offer",
            status: "success",
            durationMs: 742,
            output: JSON.stringify({
              retention_path: "high_value_save",
              parameters: {
                ltv: 54000,
                max_discount_allowed: 0.35,
                integration_architect_deploy: true,
                selected_offer: "30% off for 3 months + Custom Engineering Support",
                est_save_probability: 0.82
              }
            }, null, 2)
          },
          {
            timestamp: "17:20:52",
            tool: "Stripe CLI: apply_invoice_discount",
            status: "success",
            durationMs: 420,
            output: JSON.stringify({
              coupon_applied: "ENT-30-PCT-3M",
              invoice_adjustments: ["inv_A8312B", "inv_A8312C", "inv_A8312D"],
              total_discount_value: 4050,
              scheduled_revert_date: "2026-09-08"
            }, null, 2)
          },
          {
            timestamp: "17:20:53",
            tool: "Jira API: create_priority_ticket",
            status: "success",
            durationMs: 220,
            output: JSON.stringify({
              key: "NEXUS-SF-MAP",
              assignee: "s.parker@integration-ops.com",
              priority: "Highest",
              summary: "Deploy Custom Salesforce CRM Integration Schema Mapping for NexusCorp"
            }, null, 2)
          },
          {
            timestamp: "17:20:55",
            tool: "Zoho MCP: update_record_status",
            status: "success",
            durationMs: 290,
            output: JSON.stringify({
              accountId: "zoho_acc_98314",
              fields_updated: {
                contract_status: "Secured_Retained",
                retention_offer_applied: "30% Credit 3M + Architect Support",
                churn_score_override: 15
              }
            }, null, 2)
          },
          {
            timestamp: "17:20:57",
            tool: "Google ADK Ledger: log_audit_trail",
            status: "success",
            durationMs: 65,
            output: JSON.stringify({
              audit_event: "customer_retained",
              timestamp: "2026-06-08T11:50:57Z",
              agent: "Gemini-Retain-Agent-4.1",
              account: "zoho_acc_98314",
              recorded_value_saved: 42000
            }, null, 2)
          }
        ],
        reasoning: [
          {
            title: "Sentiment Analysis",
            details: "Analyzed customer message. High urgency. Key churn drivers: Integration Friction and Cost.",
            result: "Sentiment: Critical (-0.85/1.00)"
          },
          {
            title: "Customer Lookup Complete",
            details: "Retrieved account profile from Zoho CRM. Total remaining contract value (ACV) is substantial.",
            result: "Contract Value At Churn Risk: $42,000.00"
          },
          {
            title: "LTV Optimization Analysis",
            details: "Comparing cost of customer retention package vs. cost of churn. Max discount budget is 35%. Dynamic formula balances immediate discount + custom services.",
            result: "Net Business Value of Retention: +$29,390"
          },
          {
            title: "Financial Ledger Sync",
            details: "Calculated prorated discount amounts, checked invoice logs, applied Stripe adjustments, and drafted Jira ticket assignment details.",
            formula: "Applied Credit = $1,350.00 * 3 months",
            result: "Billing adjustments synchronized. Net Saved Value: $42,000"
          }
        ],
        workflow: [
          { id: "request", label: "Customer Request", status: "completed" },
          { id: "auth", label: "Authentication", status: "completed" },
          { id: "lookup", label: "Customer Lookup", status: "completed" },
          { id: "offer", label: "Retention Offer", status: "completed" },
          { id: "refund", label: "Refund Calculation", status: "completed" },
          { id: "cancellation", label: "Account Cancellation", status: "completed", updatedAt: "Retained" },
          { id: "audit", label: "Audit Log Created", status: "completed" }
        ],
        currentStepIndex: 3
      }
    ]
  },
  {
    id: "smb-budget",
    title: "Scenario B: Budget Reduction (Sarah Jenkins)",
    description: "SMB customer seeking down-scale or cancellation due to macroeconomic pressure and company downsizing.",
    customer: {
      name: "Sarah Jenkins",
      email: "sarah@bytesize.dev",
      company: "ByteSize Software",
      avatar: "SJ",
      subscriptionPlan: "Growth",
      monthlyPayment: 350,
      remainingDays: 45,
      churnRiskScore: 78,
      cancellationProbability: 72,
      tags: ["SMB", "Price Sensitive", "Downsizing"]
    },
    steps: [
      // Step 0: Request Initiated
      {
        chat: [
          {
            sender: "customer",
            text: "Hi, I need to cancel our Growth plan billing starting next month. We downsized our engineering team from 15 users to 4 users, and we can no longer justify $350 a month.",
            timestamp: "17:21:40"
          }
        ],
        tools: [
          {
            timestamp: "17:21:41",
            tool: "Webhook Listener: cancellation_requested",
            status: "success",
            durationMs: 35,
            output: JSON.stringify({ event: "cancellation_requested", source: "billing_portal", account_email: "sarah@bytesize.dev" }, null, 2)
          }
        ],
        reasoning: [
          {
            title: "Churn Drivers",
            details: "Client size reduction: 15 active seats down to 4. Price point of $350/mo is too high for current footprint.",
            result: "Root Cause: Excess Capacity / Overpriced tier"
          }
        ],
        workflow: [
          { id: "request", label: "Customer Request", status: "completed" },
          { id: "auth", label: "Authentication", status: "active" },
          { id: "lookup", label: "Customer Lookup", status: "idle" },
          { id: "offer", label: "Retention Offer", status: "idle" },
          { id: "refund", label: "Refund Calculation", status: "idle" },
          { id: "cancellation", label: "Account Cancellation", status: "idle" },
          { id: "audit", label: "Audit Log Created", status: "idle" }
        ],
        currentStepIndex: 0
      },
      // Step 1: Auth + Zoho Lookup
      {
        chat: [
          {
            sender: "customer",
            text: "Hi, I need to cancel our Growth plan billing starting next month. We downsized our engineering team from 15 users to 4 users, and we can no longer justify $350 a month.",
            timestamp: "17:21:40"
          },
          {
            sender: "ai",
            text: "Verifying credentials for ByteSize Software. Locating billing profile and active contract status...",
            timestamp: "17:21:45"
          }
        ],
        tools: [
          {
            timestamp: "17:21:41",
            tool: "Webhook Listener: cancellation_requested",
            status: "success",
            durationMs: 35,
            output: JSON.stringify({ event: "cancellation_requested", source: "billing_portal", account_email: "sarah@bytesize.dev" }, null, 2)
          },
          {
            timestamp: "17:21:46",
            tool: "Auth0 Authenticate User",
            status: "success",
            durationMs: 98,
            output: JSON.stringify({ authenticated: true, identity: "auth0|91f24dbe", roles: ["Owner"] }, null, 2)
          },
          {
            timestamp: "17:21:47",
            tool: "Zoho MCP: fetch_record_by_email",
            status: "success",
            durationMs: 195,
            output: JSON.stringify({
              accountId: "zoho_acc_10482",
              name: "ByteSize Software",
              tier: "Growth",
              monthly_mrr: 350,
              seats_allocated: 15,
              seats_active: 4,
              contract_remaining_days: 45
            }, null, 2)
          }
        ],
        reasoning: [
          {
            title: "Churn Drivers",
            details: "Client size reduction: 15 active seats down to 4. Price point of $350/mo is too high for current footprint.",
            result: "Root Cause: Excess Capacity / Overpriced tier"
          },
          {
            title: "Contract Metrics",
            details: "Contract has only 45 days remaining. High probability of natural expiration churn if not addressed.",
            formula: "Remaining Contract Value = $350 * (45/30) months",
            result: "Exposure: $525.00"
          }
        ],
        workflow: [
          { id: "request", label: "Customer Request", status: "completed" },
          { id: "auth", label: "Authentication", status: "completed" },
          { id: "lookup", label: "Customer Lookup", status: "completed" },
          { id: "offer", label: "Retention Offer", status: "active" },
          { id: "refund", label: "Refund Calculation", status: "idle" },
          { id: "cancellation", label: "Account Cancellation", status: "idle" },
          { id: "audit", label: "Audit Log Created", status: "idle" }
        ],
        currentStepIndex: 1
      },
      // Step 2: Custom Retention Offer - Plan Downgrade Option
      {
        chat: [
          {
            sender: "customer",
            text: "Hi, I need to cancel our Growth plan billing starting next month. We downsized our engineering team from 15 users to 4 users, and we can no longer justify $350 a month.",
            timestamp: "17:21:40"
          },
          {
            sender: "ai",
            text: "Verifying credentials for ByteSize Software. Locating billing profile and active contract status...",
            timestamp: "17:21:45"
          },
          {
            sender: "ai",
            text: "Hi Sarah, thank you for being a customer. I completely understand. Since your team size has adjusted, we should optimize your billing rather than cancel your access completely. \n\nI can downgrade your account to our **Starter Plan** (supports up to 5 users, perfect for your team of 4) which is only **$59 a month** instead of $350.\n\nAdditionally, to ease your transition, I'll apply a credit that makes your **first 2 months on the Starter Plan completely free**. \n\nWould this plan adjust to your downsized requirements?",
            timestamp: "17:21:55"
          }
        ],
        tools: [
          {
            timestamp: "17:21:41",
            tool: "Webhook Listener: cancellation_requested",
            status: "success",
            durationMs: 35,
            output: JSON.stringify({ event: "cancellation_requested", source: "billing_portal", account_email: "sarah@bytesize.dev" }, null, 2)
          },
          {
            timestamp: "17:21:46",
            tool: "Auth0 Authenticate User",
            status: "success",
            durationMs: 98,
            output: JSON.stringify({ authenticated: true, identity: "auth0|91f24dbe", roles: ["Owner"] }, null, 2)
          },
          {
            timestamp: "17:21:47",
            tool: "Zoho MCP: fetch_record_by_email",
            status: "success",
            durationMs: 195,
            output: JSON.stringify({
              accountId: "zoho_acc_10482",
              name: "ByteSize Software",
              tier: "Growth",
              monthly_mrr: 350,
              seats_allocated: 15,
              seats_active: 4,
              contract_remaining_days: 45
            }, null, 2)
          },
          {
            timestamp: "17:21:54",
            tool: "Gemini: generate_retention_offer",
            status: "success",
            durationMs: 480,
            output: JSON.stringify({
              retention_path: "right_size_downgrade",
              parameters: {
                current_plan: "Growth ($350/mo)",
                suggested_plan: "Starter ($59/mo)",
                credits_applied: 118,
                annual_run_rate_saved: 708
              }
            }, null, 2)
          }
        ],
        reasoning: [
          {
            title: "Churn Drivers",
            details: "Client size reduction: 15 active seats down to 4. Price point of $350/mo is too high for current footprint.",
            result: "Root Cause: Excess Capacity / Overpriced tier"
          },
          {
            title: "Contract Metrics",
            details: "Contract has only 45 days remaining. High probability of natural expiration churn if not addressed.",
            result: "Exposure: $525.00"
          },
          {
            title: "Downgrade Optimization Matrix",
            details: "Starter plan accommodates 4 active users. Giving 2 free months makes the cost friction negligible for immediate cancellation avoidance. Save probability is high.",
            formula: "Expected Saved LTV = Starter ($59) * 12 months = $708 (vs. Churn = $0)",
            result: "Selected Downgrade Option. Retention Offer: Downgrade to Starter ($59/mo) + 2 Months Free ($118 credit)"
          }
        ],
        workflow: [
          { id: "request", label: "Customer Request", status: "completed" },
          { id: "auth", label: "Authentication", status: "completed" },
          { id: "lookup", label: "Customer Lookup", status: "completed" },
          { id: "offer", label: "Retention Offer", status: "completed" },
          { id: "refund", label: "Refund Calculation", status: "active" },
          { id: "cancellation", label: "Account Cancellation", status: "idle" },
          { id: "audit", label: "Audit Log Created", status: "idle" }
        ],
        currentStepIndex: 2
      },
      // Step 3: Customer Accepts + Downgrade Processed
      {
        chat: [
          {
            sender: "customer",
            text: "Hi, I need to cancel our Growth plan billing starting next month. We downsized our engineering team from 15 users to 4 users, and we can no longer justify $350 a month.",
            timestamp: "17:21:40"
          },
          {
            sender: "ai",
            text: "Verifying credentials for ByteSize Software. Locating billing profile and active contract status...",
            timestamp: "17:21:45"
          },
          {
            sender: "ai",
            text: "Hi Sarah, thank you for being a customer. I completely understand. Since your team size has adjusted, we should optimize your billing rather than cancel your access completely. \n\nI can downgrade your account to our **Starter Plan** (supports up to 5 users, perfect for your team of 4) which is only **$59 a month** instead of $350.\n\nAdditionally, to ease your transition, I'll apply a credit that makes your **first 2 months on the Starter Plan completely free**. \n\nWould this plan adjust to your downsized requirements?",
            timestamp: "17:21:55"
          },
          {
            sender: "customer",
            text: "Yes, that is actually perfect. I didn't know you had a Starter Plan. And the 2 months free helps us out during this transition. Let's do that instead of canceling.",
            timestamp: "17:22:15"
          },
          {
            sender: "ai",
            text: "Fantastic, Sarah. I've adjusted your plan. Starting next billing cycle (July 1st), you will move to the Starter plan. I have applied a $118 billing credit, so your invoices for July and August will be $0.00. Normal billing of $59/month will resume on September 1st. Zoho CRM records and billing systems have been fully updated.",
            timestamp: "17:22:25"
          }
        ],
        tools: [
          {
            timestamp: "17:21:41",
            tool: "Webhook Listener: cancellation_requested",
            status: "success",
            durationMs: 35,
            output: JSON.stringify({ event: "cancellation_requested", source: "billing_portal", account_email: "sarah@bytesize.dev" }, null, 2)
          },
          {
            timestamp: "17:21:46",
            tool: "Auth0 Authenticate User",
            status: "success",
            durationMs: 98,
            output: JSON.stringify({ authenticated: true, identity: "auth0|91f24dbe", roles: ["Owner"] }, null, 2)
          },
          {
            timestamp: "17:21:47",
            tool: "Zoho MCP: fetch_record_by_email",
            status: "success",
            durationMs: 195,
            output: JSON.stringify({
              accountId: "zoho_acc_10482",
              name: "ByteSize Software",
              tier: "Growth",
              monthly_mrr: 350,
              seats_allocated: 15,
              seats_active: 4,
              contract_remaining_days: 45
            }, null, 2)
          },
          {
            timestamp: "17:21:54",
            tool: "Gemini: generate_retention_offer",
            status: "success",
            durationMs: 480,
            output: JSON.stringify({
              retention_path: "right_size_downgrade",
              parameters: {
                current_plan: "Growth ($350/mo)",
                suggested_plan: "Starter ($59/mo)",
                credits_applied: 118,
                annual_run_rate_saved: 708
              }
            }, null, 2)
          },
          {
            timestamp: "17:22:18",
            tool: "Stripe CLI: update_subscription_plan",
            status: "success",
            durationMs: 350,
            output: JSON.stringify({
              subscriptionId: "sub_Growth_773",
              new_plan_id: "starter_59",
              credit_balance_added: 118,
              effective_date: "2026-07-01",
              prorated_refund_calculated: 0
            }, null, 2)
          },
          {
            timestamp: "17:22:20",
            tool: "Zoho MCP: update_record_status",
            status: "success",
            durationMs: 240,
            output: JSON.stringify({
              accountId: "zoho_acc_10482",
              fields_updated: {
                contract_status: "Starter_Downgraded",
                seat_count: 5,
                retention_offer_applied: "Starter downgrade + 2M Free",
                churn_score_override: 22
              }
            }, null, 2)
          },
          {
            timestamp: "17:22:22",
            tool: "Google ADK Ledger: log_audit_trail",
            status: "success",
            durationMs: 48,
            output: JSON.stringify({
              audit_event: "customer_retained_downgrade",
              timestamp: "2026-06-08T11:52:22Z",
              agent: "Gemini-Retain-Agent-4.1",
              account: "zoho_acc_10482",
              value_saved_arr: 708
            }, null, 2)
          }
        ],
        reasoning: [
          {
            title: "Churn Drivers",
            details: "Client size reduction: 15 active seats down to 4. Price point of $350/mo is too high for current footprint.",
            result: "Root Cause: Excess Capacity / Overpriced tier"
          },
          {
            title: "Contract Metrics",
            details: "Contract has only 45 days remaining. High probability of natural expiration churn if not addressed.",
            result: "Exposure: $525.00"
          },
          {
            title: "Downgrade Optimization Matrix",
            details: "Starter plan accommodates 4 active users. Giving 2 free months makes the cost friction negligible for immediate cancellation avoidance. Save probability is high.",
            result: "Selected Downgrade Option. Retention Offer: Downgrade to Starter ($59/mo) + 2 Months Free ($118 credit)"
          },
          {
            title: "Stripe Subscription Adjustment",
            details: "Adjusted subscription item pricing in Stripe ledger. Calculated prorated amount (which is 0 because plan switches on invoice anniversary date) and applied billing balance credit of $118.",
            formula: "Credit Applied = Starter Cost ($59/mo) * 2 months",
            result: "Stripe synchronized. Future subscription cost updated."
          }
        ],
        workflow: [
          { id: "request", label: "Customer Request", status: "completed" },
          { id: "auth", label: "Authentication", status: "completed" },
          { id: "lookup", label: "Customer Lookup", status: "completed" },
          { id: "offer", label: "Retention Offer", status: "completed" },
          { id: "refund", label: "Refund Calculation", status: "completed" },
          { id: "cancellation", label: "Account Cancellation", status: "completed", updatedAt: "Downgraded" },
          { id: "audit", label: "Audit Log Created", status: "completed" }
        ],
        currentStepIndex: 3
      }
    ]
  },
  {
    id: "trial-cancel",
    title: "Scenario C: Hard Exit (Liam Carter)",
    description: "Trial/Starter developer with inactive usage, requesting total cancellation and prorated refund.",
    customer: {
      name: "Liam Carter",
      email: "liam@carterdev.net",
      company: "CarterDev (Freelance)",
      avatar: "LC",
      subscriptionPlan: "Starter",
      monthlyPayment: 29,
      remainingDays: 2,
      churnRiskScore: 98,
      cancellationProbability: 95,
      tags: ["Developer", "Low Usage", "Hard Exit"]
    },
    steps: [
      // Step 0: Cancel Request
      {
        chat: [
          {
            sender: "customer",
            text: "I want to cancel my subscription immediately. I only used the API twice and didn't find the results suitable for my hobby project. Can I also get a refund for my current billing month?",
            timestamp: "17:23:01"
          }
        ],
        tools: [
          {
            timestamp: "17:23:02",
            tool: "Webhook Listener: cancellation_requested",
            status: "success",
            durationMs: 38,
            output: JSON.stringify({ event: "cancellation_requested", source: "in-app_billing", account_email: "liam@carterdev.net" }, null, 2)
          }
        ],
        reasoning: [
          {
            title: "Sentiment & Drivers",
            details: "Client requesting total exit and refund. Sentiment is neutral-frustrated. Value misalignment (hobby project, not suitable results). Usage pattern is very low.",
            result: "Churn Type: Direct Exit / Value Misalignment"
          }
        ],
        workflow: [
          { id: "request", label: "Customer Request", status: "completed" },
          { id: "auth", label: "Authentication", status: "active" },
          { id: "lookup", label: "Customer Lookup", status: "idle" },
          { id: "offer", label: "Retention Offer", status: "idle" },
          { id: "refund", label: "Refund Calculation", status: "idle" },
          { id: "cancellation", label: "Account Cancellation", status: "idle" },
          { id: "audit", label: "Audit Log Created", status: "idle" }
        ],
        currentStepIndex: 0
      },
      // Step 1: Auth + Zoho lookup
      {
        chat: [
          {
            sender: "customer",
            text: "I want to cancel my subscription immediately. I only used the API twice and didn't find the results suitable for my hobby project. Can I also get a refund for my current billing month?",
            timestamp: "17:23:01"
          },
          {
            sender: "ai",
            text: "Verifying customer identity and querying Zoho CRM logs for account history...",
            timestamp: "17:23:06"
          }
        ],
        tools: [
          {
            timestamp: "17:23:02",
            tool: "Webhook Listener: cancellation_requested",
            status: "success",
            durationMs: 38,
            output: JSON.stringify({ event: "cancellation_requested", source: "in-app_billing", account_email: "liam@carterdev.net" }, null, 2)
          },
          {
            timestamp: "17:23:07",
            tool: "Auth0 Authenticate User",
            status: "success",
            durationMs: 112,
            output: JSON.stringify({ authenticated: true, identity: "auth0|38b82fac", roles: ["Individual"] }, null, 2)
          },
          {
            timestamp: "17:23:08",
            tool: "Zoho MCP: fetch_record_by_email",
            status: "success",
            durationMs: 185,
            output: JSON.stringify({
              accountId: "zoho_acc_44102",
              name: "Liam Carter",
              tier: "Starter",
              monthly_mrr: 29,
              creation_date: "2026-05-10",
              api_calls_made: 2,
              contract_remaining_days: 2
            }, null, 2)
          }
        ],
        reasoning: [
          {
            title: "Sentiment & Drivers",
            details: "Client requesting total exit and refund. Sentiment is neutral-frustrated. Value misalignment. Usage pattern is very low.",
            result: "Churn Type: Direct Exit"
          },
          {
            title: "LTV Assessment",
            details: "Customer MRR is $29. API consumption is negligible (2 calls in 28 days). The cost to acquire is low but potential of saving is calculated at < 10% because client states lack of product-market fit for their use case.",
            formula: "LTV Value = $29/mo, Save Prob = 5%",
            result: "Expected Saved LTV: $1.45. Retention value is not cost-effective for aggressive discount packages."
          }
        ],
        workflow: [
          { id: "request", label: "Customer Request", status: "completed" },
          { id: "auth", label: "Authentication", status: "completed" },
          { id: "lookup", label: "Customer Lookup", status: "completed" },
          { id: "offer", label: "Retention Offer", status: "active" },
          { id: "refund", label: "Refund Calculation", status: "idle" },
          { id: "cancellation", label: "Account Cancellation", status: "idle" },
          { id: "audit", label: "Audit Log Created", status: "idle" }
        ],
        currentStepIndex: 1
      },
      // Step 2: Refund Calculation & Process Cancellation
      {
        chat: [
          {
            sender: "customer",
            text: "I want to cancel my subscription immediately. I only used the API twice and didn't find the results suitable for my hobby project. Can I also get a refund for my current billing month?",
            timestamp: "17:23:01"
          },
          {
            sender: "ai",
            text: "Verifying customer identity and querying Zoho CRM logs for account history...",
            timestamp: "17:23:06"
          },
          {
            sender: "ai",
            text: "Liam, I understand our platform didn't fit the requirements for your hobby project. I will proceed with your cancellation immediately. \n\nSince you've only made 2 API calls and have 2 days left in your current billing cycle, I am calculating your prorated refund. Because our policy allows a full refund for low-usage cases in their first month, I have authorized a **full refund of your $29.00 payment**.\n\nI am running the transaction refund and closing the account now. One moment.",
            timestamp: "17:23:18"
          }
        ],
        tools: [
          {
            timestamp: "17:23:02",
            tool: "Webhook Listener: cancellation_requested",
            status: "success",
            durationMs: 38,
            output: JSON.stringify({ event: "cancellation_requested", source: "in-app_billing", account_email: "liam@carterdev.net" }, null, 2)
          },
          {
            timestamp: "17:23:07",
            tool: "Auth0 Authenticate User",
            status: "success",
            durationMs: 112,
            output: JSON.stringify({ authenticated: true, identity: "auth0|38b82fac", roles: ["Individual"] }, null, 2)
          },
          {
            timestamp: "17:23:08",
            tool: "Zoho MCP: fetch_record_by_email",
            status: "success",
            durationMs: 185,
            output: JSON.stringify({
              accountId: "zoho_acc_44102",
              name: "Liam Carter",
              tier: "Starter",
              monthly_mrr: 29,
              creation_date: "2026-05-10",
              api_calls_made: 2,
              contract_remaining_days: 2
            }, null, 2)
          },
          {
            timestamp: "17:23:14",
            tool: "FastAPI: calculate_prorated_refund",
            status: "success",
            durationMs: 140,
            output: JSON.stringify({
              cycle_days_total: 30,
              cycle_days_remaining: 2,
              prorated_refund_amount: 1.93,
              low_usage_clause_active: true,
              authorized_override_refund: 29.00
            }, null, 2)
          }
        ],
        reasoning: [
          {
            title: "Sentiment & Drivers",
            details: "Client requesting total exit and refund. Sentiment is neutral-frustrated. Value misalignment. Usage pattern is very low.",
            result: "Churn Type: Direct Exit"
          },
          {
            title: "LTV Assessment",
            details: "Customer MRR is $29. API consumption is negligible (2 calls in 28 days). Expected Saved LTV is not cost-effective for aggressive discount packages.",
            result: "Expected Saved LTV: $1.45"
          },
          {
            title: "Refund Calculation Logic",
            details: "Normal prorated refund for 2 days left equals $1.93. However, checking 'First Month Low Usage Clause' (defined as < 5 API calls in the first 30 days of service). The clause is active, which authorizes the agent to override and issue a full 100% refund of $29.00.",
            formula: "Refund = If(Calls < 5 & Days < 30, Full_MRR ($29.00), Prorated ($1.93))",
            result: "Authorized Refund Amount: $29.00"
          }
        ],
        workflow: [
          { id: "request", label: "Customer Request", status: "completed" },
          { id: "auth", label: "Authentication", status: "completed" },
          { id: "lookup", label: "Customer Lookup", status: "completed" },
          { id: "offer", label: "Retention Offer", status: "completed" },
          { id: "refund", label: "Refund Calculation", status: "completed" },
          { id: "cancellation", label: "Account Cancellation", status: "active" },
          { id: "audit", label: "Audit Log Created", status: "idle" }
        ],
        currentStepIndex: 2
      },
      // Step 3: Cancellation Executed & Audit Recorded
      {
        chat: [
          {
            sender: "customer",
            text: "I want to cancel my subscription immediately. I only used the API twice and didn't find the results suitable for my hobby project. Can I also get a refund for my current billing month?",
            timestamp: "17:23:01"
          },
          {
            sender: "ai",
            text: "Verifying customer identity and querying Zoho CRM logs for account history...",
            timestamp: "17:23:06"
          },
          {
            sender: "ai",
            text: "Liam, I understand our platform didn't fit the requirements for your hobby project. I will proceed with your cancellation immediately. \n\nSince you've only made 2 API calls and have 2 days left in your current billing cycle, I am calculating your prorated refund. Because our policy allows a full refund for low-usage cases in their first month, I have authorized a **full refund of your $29.00 payment**.\n\nI am running the transaction refund and closing the account now. One moment.",
            timestamp: "17:23:18"
          },
          {
            sender: "ai",
            text: "Your subscription has been canceled, and a full refund of $29.00 has been credited back to your card (Stripe Ref: txn_8820B1). The funds will clear in 2-3 business days. Thank you for trying our service, and best of luck with your hobby projects!",
            timestamp: "17:23:32"
          }
        ],
        tools: [
          {
            timestamp: "17:23:02",
            tool: "Webhook Listener: cancellation_requested",
            status: "success",
            durationMs: 38,
            output: JSON.stringify({ event: "cancellation_requested", source: "in-app_billing", account_email: "liam@carterdev.net" }, null, 2)
          },
          {
            timestamp: "17:23:07",
            tool: "Auth0 Authenticate User",
            status: "success",
            durationMs: 112,
            output: JSON.stringify({ authenticated: true, identity: "auth0|38b82fac", roles: ["Individual"] }, null, 2)
          },
          {
            timestamp: "17:23:08",
            tool: "Zoho MCP: fetch_record_by_email",
            status: "success",
            durationMs: 185,
            output: JSON.stringify({
              accountId: "zoho_acc_44102",
              name: "Liam Carter",
              tier: "Starter",
              monthly_mrr: 29,
              creation_date: "2026-05-10",
              api_calls_made: 2,
              contract_remaining_days: 2
            }, null, 2)
          },
          {
            timestamp: "17:23:14",
            tool: "FastAPI: calculate_prorated_refund",
            status: "success",
            durationMs: 140,
            output: JSON.stringify({
              cycle_days_total: 30,
              cycle_days_remaining: 2,
              prorated_refund_amount: 1.93,
              low_usage_clause_active: true,
              authorized_override_refund: 29.00
            }, null, 2)
          },
          {
            timestamp: "17:23:25",
            tool: "Stripe CLI: issue_refund",
            status: "success",
            durationMs: 512,
            output: JSON.stringify({
              refundId: "re_3B8820B1",
              chargeId: "ch_2A8820",
              amount: 2900,
              status: "succeeded",
              currency: "usd"
            }, null, 2)
          },
          {
            timestamp: "17:23:26",
            tool: "Stripe CLI: cancel_subscription",
            status: "success",
            durationMs: 440,
            output: JSON.stringify({
              subscriptionId: "sub_Starter_994",
              status: "canceled",
              cancel_at_period_end: false
            }, null, 2)
          },
          {
            timestamp: "17:23:28",
            tool: "Zoho MCP: update_record_status",
            status: "success",
            durationMs: 195,
            output: JSON.stringify({
              accountId: "zoho_acc_44102",
              fields_updated: {
                contract_status: "Canceled_Refunded",
                churn_date: "2026-06-08",
                refund_issued_usd: 29.00
              }
            }, null, 2)
          },
          {
            timestamp: "17:23:30",
            tool: "Google ADK Ledger: log_audit_trail",
            status: "success",
            durationMs: 52,
            output: JSON.stringify({
              audit_event: "customer_canceled_refunded",
              timestamp: "2026-06-08T11:53:30Z",
              agent: "Gemini-Retain-Agent-4.1",
              account: "zoho_acc_44102",
              refund_issued: 29.00,
              churn_metric_logged: true
            }, null, 2)
          }
        ],
        reasoning: [
          {
            title: "Sentiment & Drivers",
            details: "Client requesting total exit and refund. Sentiment is neutral-frustrated. Value misalignment. Usage pattern is very low.",
            result: "Churn Type: Direct Exit"
          },
          {
            title: "LTV Assessment",
            details: "Customer MRR is $29. API consumption is negligible (2 calls in 28 days). Expected Saved LTV is not cost-effective for aggressive discount packages.",
            result: "Expected Saved LTV: $1.45"
          },
          {
            title: "Refund Calculation Logic",
            details: "First Month Low Usage Clause is active, authorizing 100% refund of $29.00.",
            result: "Authorized Refund Amount: $29.00"
          },
          {
            title: "Cancellation Execution Sync",
            details: "Stripe transaction issued. CRM status changed to Canceled_Refunded. Operations ledger notified.",
            formula: "Net Save Value = $0.00, Refund Cost = $29.00",
            result: "Account terminated. Transaction completed."
          }
        ],
        workflow: [
          { id: "request", label: "Customer Request", status: "completed" },
          { id: "auth", label: "Authentication", status: "completed" },
          { id: "lookup", label: "Customer Lookup", status: "completed" },
          { id: "offer", label: "Retention Offer", status: "completed" },
          { id: "refund", label: "Refund Calculation", status: "completed" },
          { id: "cancellation", label: "Account Cancellation", status: "completed", updatedAt: "Canceled" },
          { id: "audit", label: "Audit Log Created", status: "completed" }
        ],
        currentStepIndex: 3
      }
    ]
  }
];
