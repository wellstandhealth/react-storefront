import { PaymentGatewayConfig } from "@/checkout-storefront/graphql";
import { AdyenInitializeData } from "@/checkout-storefront/sections/PaymentSection/AdyenDropIn/types";

export type PaymentGatewayId = "app.saleor.adyen";

export type ParsedAdyenGateway = ParsedPaymentGateway<AdyenInitializeData>;

export type ParsedPaymentGateways = {
  adyen?: ParsedAdyenGateway;
};

export interface ParsedPaymentGateway<TData extends Record<string, any>>
  extends Omit<PaymentGatewayConfig, "data" | "id"> {
  data: TData;
  id: PaymentGatewayId;
}

export interface PaymentMethod {
  id: string;
  name: string;
}
