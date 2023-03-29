import { useCheckout } from "@/checkout-storefront/hooks/useCheckout";
import { useCheckoutComplete } from "@/checkout-storefront/hooks/useCheckoutComplete";
import { usePaymentGatewaysInitialize } from "@/checkout-storefront/sections/PaymentSection/usePaymentGatewaysInitialize";
import { useEffect } from "react";

export const usePayments = () => {
  const {
    checkout: { chargeStatus },
  } = useCheckout();

  const { fetching, availablePaymentGateways } = usePaymentGatewaysInitialize();

  const { onCheckoutComplete, completingCheckout } = useCheckoutComplete();

  // the checkout was already paid earlier, complete
  useEffect(() => {
    if (!completingCheckout && chargeStatus === "FULL") {
      // TMP for development
      // void onCheckoutComplete();
    }
  }, []);

  return { fetching, availablePaymentGateways };
};
