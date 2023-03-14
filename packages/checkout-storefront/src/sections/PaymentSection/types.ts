import { PaymentGatewayConfig } from "@/checkout-storefront/graphql";
import { AdyenInitializeData } from "@/checkout-storefront/sections/PaymentSection/AdyenDropIn/types";
import { PaymentGatewayId } from "@/checkout-storefront/sections/PaymentSection/useGetParsedPaymentGatewaysConfigs";

interface PaymentGatewayData {
  adyen: AdyenInitializeData;
}

export interface ParsedPaymentGateway<TKey extends keyof PaymentGatewayData | void = void>
  extends Omit<PaymentGatewayConfig, "data"> {
  // to be more defined with adyen, mollie etc. subtypes of what this can be
  data: TKey extends keyof PaymentGatewayData ? PaymentGatewayData[TKey] : Record<string, any>;
  // we only have app id and name so in order to differentiate to later show dropins
  // we add our own
  paymentGatewayId: PaymentGatewayId | undefined;
}

export interface PaymentMethod {
  id: string;
  name: string;
}
