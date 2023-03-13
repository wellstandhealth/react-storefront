import {
  PaymentGatewayConfig,
  PaymentGatewayFragment,
  usePaymentGatewaysInitializeMutation,
} from "@/checkout-storefront/graphql";
import { useCheckout } from "@/checkout-storefront/hooks/useCheckout";
import { useSubmit } from "@/checkout-storefront/hooks/useSubmit";
import { ParsedPaymentGateway } from "@/checkout-storefront/sections/PaymentSection/types";
import { useGetParsedPaymentGatewaysConfigs } from "@/checkout-storefront/sections/PaymentSection/useGetParsedPaymentGatewaysConfigs";
import { useEffect, useMemo, useState } from "react";

interface PaymentGatewaysData {
  paymentGateways: Array<PaymentGatewayFragment>;
}

export const usePaymentGatewaysInitialize = () => {
  const {
    checkout: { id: checkoutId, availablePaymentGateways },
  } = useCheckout();

  const getParsedPaymentGatewaysConfigs =
    useGetParsedPaymentGatewaysConfigs(availablePaymentGateways);

  const [gatewayConfigs, setGatewayConfigs] = useState<ParsedPaymentGateway[]>([]);

  const [{ fetching }, paymentGatewaysInitialize] = usePaymentGatewaysInitializeMutation();

  const onSubmit = useSubmit<PaymentGatewaysData, typeof paymentGatewaysInitialize>(
    useMemo(
      () => ({
        hideAlerts: true,
        scope: "paymentGatewaysInitialize",
        shouldAbort: () => !availablePaymentGateways.length,
        onSubmit: paymentGatewaysInitialize,
        parse: ({ paymentGateways }) => ({ checkoutId, paymentGateways }),
        onSuccess: ({ result }) =>
          setGatewayConfigs(
            getParsedPaymentGatewaysConfigs(result?.data?.paymentGatewayInitialize?.gatewayConfigs)
          ),
        onError: ({ errors }) => {
          console.log({ errors });
        },
      }),
      [
        availablePaymentGateways.length,
        checkoutId,
        getParsedPaymentGatewaysConfigs,
        paymentGatewaysInitialize,
      ]
    )
  );

  useEffect(() => {
    void onSubmit({ paymentGateways: availablePaymentGateways });
  }, []);

  return {
    fetching,
    availablePaymentGateways: gatewayConfigs,
  };
};
