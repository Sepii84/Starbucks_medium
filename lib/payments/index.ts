import { getPaymentProviderConfig } from "@/lib/payments/config";
import { MockPaymentProvider } from "@/lib/payments/mock-provider";
import type { WalletTopUpPaymentProvider } from "@/lib/payments/payment-provider";

export function getWalletTopUpPaymentProvider(): WalletTopUpPaymentProvider {
  const { provider } = getPaymentProviderConfig();

  if (provider === "mock") {
    return new MockPaymentProvider();
  }

  throw new Error("Only the mock payment provider is enabled in this demo project.");
}
