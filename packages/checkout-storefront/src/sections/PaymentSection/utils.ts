import { PaymentGatewayConfig } from "@/checkout-storefront/graphql";
import {
  ParsedPaymentGateways,
  PaymentGatewayId,
} from "@/checkout-storefront/sections/PaymentSection/types";

const paymentGatewayMap: Record<PaymentGatewayId, keyof ParsedPaymentGateways> = {
  "app.saleor.adyen": "adyen",
};

export const getParsedPaymentGateways = (
  paymentGateways: PaymentGatewayConfig[] | undefined | null
): ParsedPaymentGateways => {
  if (!paymentGateways) {
    return {};
  }

  return paymentGateways.reduce((result, gatewayConfig) => {
    if (!gatewayConfig) {
      return result;
    }

    const { data, id, ...rest } = gatewayConfig;

    if (!Object.keys(paymentGatewayMap).includes(id)) {
      console.error(`Unhandled payment gateway - id: ${id}`);
      return result;
    }

    return {
      ...result,
      [paymentGatewayMap[id as PaymentGatewayId]]: {
        ...rest,
        data: typeof data === "string" ? JSON.parse(data).data : data,
      },
    };
  }, {});
};
