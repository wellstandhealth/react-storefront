import { PaymentGatewayConfig } from "@/checkout-storefront/graphql";
import { AdyenInitializeData } from "@/checkout-storefront/sections/PaymentSection/AdyenDropIn/types";

export enum PaymentGatewayId {
  adyen = "app.saleor.adyen",
}

interface PaymentGatewayData {
  adyen: AdyenInitializeData;
}

export interface ParsedPaymentGateway<TKey extends keyof PaymentGatewayData | void = void>
  extends Omit<PaymentGatewayConfig, "data"> {
  data: TKey extends keyof PaymentGatewayData ? PaymentGatewayData[TKey] : Record<string, any>;
}

export interface PaymentMethod {
  id: string;
  name: string;
}
