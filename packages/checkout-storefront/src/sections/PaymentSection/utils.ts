import { PaymentGateway, PaymentGatewayConfig } from "@/checkout-storefront/graphql";
import {
  ParsedPaymentGateways,
  PaymentGatewayId,
} from "@/checkout-storefront/sections/PaymentSection/types";
import { compact } from "lodash-es";

const PAYMENT_PLUGIN_PREFIX = "mirumee";

const paymentGatewayMap: Record<PaymentGatewayId, keyof ParsedPaymentGateways> = {
  "app.saleor.adyen": "adyen",
};

export const getParsedPaymentGatewayConfigs = (
  gatewayConfigs: PaymentGatewayConfig[] | undefined | null
): ParsedPaymentGateways => {
  if (!gatewayConfigs) {
    return {};
  }

  return gatewayConfigs.reduce((result, gatewayConfig) => {
    if (!gatewayConfig) {
      return result;
    }

    // TMP until nested data.data in all transaction mutations is fixed
    const { id, data, ...rest } = gatewayConfig;

    return {
      ...result,
      [paymentGatewayMap[id as PaymentGatewayId]]: {
        ...rest,

        // TMP until nested data.data in all transaction mutations is fixed
        data: data?.data as Record<string, any>,
      },
    };
  }, {});
};

export const getFilteredPaymentGateways = (
  paymentGateways: PaymentGateway[] | undefined | null
): PaymentGateway[] => {
  if (!paymentGateways) {
    return [];
  }

  // we want to use only payment apps, not plugins
  return compact(paymentGateways).filter(({ id, name }) => {
    const shouldBeIncluded = Object.keys(paymentGatewayMap).includes(id);
    const isAPlugin = id.includes(PAYMENT_PLUGIN_PREFIX);

    // app is missing in our codebase but is an app and not a plugin
    // hence we'd like to have it handled by default
    if (!shouldBeIncluded && !isAPlugin) {
      console.warn(`Unhandled payment gateway - name: ${name}, id: ${id}`);
      return false;
    }

    return shouldBeIncluded;
  });
};
