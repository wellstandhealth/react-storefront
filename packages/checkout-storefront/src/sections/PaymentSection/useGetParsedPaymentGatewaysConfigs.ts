import { PaymentGatewayConfig, PaymentGatewayFragment } from "@/checkout-storefront/graphql";
import { getById } from "@/checkout-storefront/lib/utils/common";
import { ParsedPaymentGateway } from "@/checkout-storefront/sections/PaymentSection/types";
import { lowerCase } from "lodash-es";
import { useCallback } from "react";

export enum PaymentGatewayId {
  adyen = "adyen",
  mollie = "mollie",
}

export const useGetParsedPaymentGatewaysConfigs = (
  availablePaymentGateways: PaymentGatewayFragment[]
) => {
  const getPaymentGatewayId = useCallback(
    (id: string) => {
      const paymentGatewayName = availablePaymentGateways.find(getById(id))?.name;
      const paymentGatewayId = Object.values(PaymentGatewayId).find(
        (val) => val === lowerCase(paymentGatewayName)
      );

      return paymentGatewayId;
    },
    [availablePaymentGateways]
  );

  const getParsedPaymentGatewaysConfigs = useCallback(
    (paymentGatewaysConfigs: PaymentGatewayConfig[] | undefined | null): ParsedPaymentGateway[] => {
      if (!paymentGatewaysConfigs || !availablePaymentGateways.length) {
        return [];
      }

      return paymentGatewaysConfigs.map(({ data, id, ...rest }) => {
        return {
          ...rest,
          id,
          paymentGatewayId: getPaymentGatewayId(id),
          data: typeof data === "string" ? JSON.parse(data) : {},
        };
      });
    },
    [availablePaymentGateways.length, getPaymentGatewayId]
  );

  return getParsedPaymentGatewaysConfigs;
};
