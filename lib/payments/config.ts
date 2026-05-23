export type PaymentProviderConfig = {
  provider: "mock";
};

export function getPaymentProviderConfig(): PaymentProviderConfig {
  const provider = process.env.PAYMENT_PROVIDER?.trim().toLowerCase() || "mock";

  if (provider !== "mock") {
    throw new Error("Only the mock payment provider is enabled in this demo project.");
  }

  return { provider: "mock" };
}
