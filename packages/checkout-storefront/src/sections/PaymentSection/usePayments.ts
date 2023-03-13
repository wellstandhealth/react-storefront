import { PaymentMethod } from "@/checkout-storefront/sections/PaymentSection/types";
import { usePaymentGatewaysInitialize } from "@/checkout-storefront/sections/PaymentSection/usePaymentGatewaysInitialize";
import { getParsedPaymentMethods } from "@/checkout-storefront/sections/PaymentSection/utils";

export const usePayments = () => {
  const { fetching, availablePaymentGateways } = usePaymentGatewaysInitialize();

  const availablePaymentMethods: PaymentMethod[] =
    getParsedPaymentMethods(availablePaymentGateways);

  return { fetching, availablePaymentGateways, availablePaymentMethods };
};
