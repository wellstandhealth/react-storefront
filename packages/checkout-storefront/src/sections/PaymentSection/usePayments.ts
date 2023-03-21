import { usePaymentGatewaysInitialize } from "@/checkout-storefront/sections/PaymentSection/usePaymentGatewaysInitialize";

export const usePayments = () => {
  const { fetching, availablePaymentGateways } = usePaymentGatewaysInitialize();

  return { fetching, availablePaymentGateways };
};
