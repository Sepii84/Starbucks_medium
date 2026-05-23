import type {
  MockPaymentConfirmation,
  TopUpCheckoutSession,
  TopUpCheckoutSessionInput,
  WalletTopUpPaymentProvider
} from "@/lib/payments/payment-provider";

export class MockPaymentProvider implements WalletTopUpPaymentProvider {
  getProviderName() {
    return "MOCK" as const;
  }

  async createTopUpCheckoutSession(
    input: TopUpCheckoutSessionInput
  ): Promise<TopUpCheckoutSession> {
    return {
      provider: "MOCK",
      providerSessionId: `mock_session_${input.topUpId}`,
      confirmationUrl: `/wallet/top-up/mock-confirm?topUpId=${encodeURIComponent(
        input.topUpId
      )}`
    };
  }

  async confirmMockPayment(topUpId: string): Promise<MockPaymentConfirmation> {
    return {
      provider: "MOCK",
      providerPaymentId: `mock_payment_${topUpId}`
    };
  }
}
