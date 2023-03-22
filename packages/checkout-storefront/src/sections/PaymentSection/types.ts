import { PaymentGatewayConfig } from "@/checkout-storefront/graphql";
import {
  AdyenGatewayId,
  AdyenGatewayInitializePayload,
} from "@/checkout-storefront/sections/PaymentSection/AdyenDropIn/types";

export type PaymentGatewayId = AdyenGatewayId;

//TMP until bug with nested data.data in transaction mutations is fixed
export type ParsedAdyenGateway = { data: ParsedPaymentGateway<AdyenGatewayInitializePayload> };

export type ParsedPaymentGateways = {
  adyen?: ParsedAdyenGateway;
};

export interface ParsedPaymentGateway<TData extends Record<string, any>>
  extends Omit<PaymentGatewayConfig, "data" | "id"> {
  data: TData;
  id: PaymentGatewayId;
}

// export interface PaymentMethod {
//   id: string;
//   name: string;
// }
