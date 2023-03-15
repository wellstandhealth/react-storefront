import { usePaymentGatewaysInitializeMutation } from "@/checkout-storefront/graphql";
import { useCheckout } from "@/checkout-storefront/hooks/useCheckout";
import { useSubmit } from "@/checkout-storefront/hooks/useSubmit";
import { ParsedPaymentGateway } from "@/checkout-storefront/sections/PaymentSection/types";
import { compact } from "lodash-es";
import { useEffect, useMemo, useState } from "react";

export const usePaymentGatewaysInitialize = () => {
  const {
    checkout: { id: checkoutId, availablePaymentGateways },
  } = useCheckout();

  const [gatewayConfigs, setGatewayConfigs] = useState<ParsedPaymentGateway[]>([]);

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
          paymentGateways: availablePaymentGateways.map(({ config, id }) => ({
            id,
            data: JSON.stringify(config),
          })),
        }),
        onSuccess: ({ data }) => {
          setGatewayConfigs(
            compact(
              data.gatewayConfigs?.map(({ data, ...rest }) => ({
                ...rest,
                data: typeof data === "string" ? JSON.parse(data) : data,
              }))
            )
          );
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
