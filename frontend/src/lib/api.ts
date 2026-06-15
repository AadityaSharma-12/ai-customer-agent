import { CancelAccountRequest, CancelAccountResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function cancelAccount(
  request: CancelAccountRequest
): Promise<CancelAccountResponse> {
  const res = await fetch(`${API_BASE_URL}/cancel-account`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }

  return res.json() as Promise<CancelAccountResponse>;
}

export async function resetSession(customerId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/session/${customerId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
}
