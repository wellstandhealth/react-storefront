import { usePaymentGatewaysInitializeMutation } from "@/checkout-storefront/graphql";
import { useCheckout } from "@/checkout-storefront/hooks/useCheckout";
import { useSubmit } from "@/checkout-storefront/hooks/useSubmit";
import { ParsedPaymentGateways } from "@/checkout-storefront/sections/PaymentSection/types";
import {
  getFilteredPaymentGateways,
  getParsedPaymentGatewayConfigs,
} from "@/checkout-storefront/sections/PaymentSection/utils";
import { useEffect, useMemo, useState } from "react";

export const usePaymentGatewaysInitialize = () => {
  const {
    checkout: { id: checkoutId, availablePaymentGateways },
  } = useCheckout();

  const [gatewayConfigs, setGatewayConfigs] = useState<ParsedPaymentGateways>({});

  const [{ fetching }, paymentGatewaysInitialize] = usePaymentGatewaysInitializeMutation();

  const onSubmit = useSubmit<{}, typeof paymentGatewaysInitialize>(
    useMemo(
      () => ({
        hideAlerts: true,
        scope: "paymentGatewaysInitialize",
        shouldAbort: () => !availablePaymentGateways.length,
        onSubmit: paymentGatewaysInitialize,
        parse: () => ({
          checkoutId,
          paymentGateways: getFilteredPaymentGateways(availablePaymentGateways).map(
            ({ config, id }) => ({
              id,
              data: config,
            })
          ),
        }),
        onSuccess: ({ data }) => {
          setGatewayConfigs(getParsedPaymentGatewayConfigs(data.gatewayConfigs));
        },
        onError: ({ errors }) => {
          console.log({ errors });
        },
      }),
      [availablePaymentGateways, checkoutId, paymentGatewaysInitialize]
    )
  );

  useEffect(() => {
    void onSubmit();
  }, []);

  return {
    fetching,
    availablePaymentGateways: gatewayConfigs || [],
  };
};
