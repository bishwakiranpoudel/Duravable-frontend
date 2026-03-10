/**
 * App constants: payment model, location, and copy.
 */

/** Primary flow: cash payment. Secondary: insurance network for large procedures (e.g. $5000+). */
export const PAYMENT_MODEL = {
  PRIMARY: "cash" as const,
  SECONDARY: "insurance_network" as const,
  LARGE_PROCEDURE_THRESHOLD_USD: 5000,
};

/** Doctor discovery is centered around this location. */
export const DEFAULT_SEARCH_LOCATION = {
  zipCode: "78613",
  address: "608 Spanish Mustang Dr, Cedar Park, TX 78613",
  city: "Cedar Park",
  state: "TX",
};

export const HEALTH_CARD_MESSAGING = {
  allocation: (amount: string) =>
    `$${amount} has been deposited into your health card for this visit.`,
  estimatedCost: (amount: string) =>
    `This doctor accepts cash payment. The estimated visit cost is $${amount}.`,
  selectDoctor: "Select Doctor",
  authorizationGranted: "Authorization granted.",
};
