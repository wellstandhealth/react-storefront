import { ParsedPaymentGateway } from "@/checkout-storefront/sections/PaymentSection/types";
import { ChannelActivePaymentProvidersByChannel, PaymentProviderID } from "checkout-common";

export const getParsedPaymentProviders = (
  activePaymentProvidersByChannel: ChannelActivePaymentProvidersByChannel | null | undefined
): readonly PaymentProviderID[] => {
  if (!activePaymentProvidersByChannel) {
    return [];
  }

  return Object.values(activePaymentProvidersByChannel).filter(
    (paymentProviderId): paymentProviderId is Exclude<typeof paymentProviderId, ""> =>
      !!paymentProviderId
  );
};
// -------

export const getParsedPaymentMethods = (availablePaymentGateways: ParsedPaymentGateway[]) => {
  if (!availablePaymentGateways.length) {
    return [];
  }

  // later add handling mollie etc.
  return [];
};
