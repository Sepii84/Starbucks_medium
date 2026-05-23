export type PaymentProviderName = "MOCK";

export type TopUpCheckoutSessionInput = {
  topUpId: string;
  amount: number;
  currency: string;
};

export type TopUpCheckoutSession = {
  provider: PaymentProviderName;
  providerSessionId: string;
  confirmationUrl: string;
};

export type MockPaymentConfirmation = {
  provider: PaymentProviderName;
  providerPaymentId: string;
};

export interface WalletTopUpPaymentProvider {
  getProviderName(): PaymentProviderName;
  createTopUpCheckoutSession(input: TopUpCheckoutSessionInput): Promise<TopUpCheckoutSession>;
  confirmMockPayment(topUpId: string): Promise<MockPaymentConfirmation>;
}
