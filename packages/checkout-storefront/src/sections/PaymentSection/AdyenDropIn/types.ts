import { CardElementData } from "@adyen/adyen-web/dist/types/components/Card/types";
import DropinElement from "@adyen/adyen-web/dist/types/components/Dropin";
import { PaymentMethodsResponseObject } from "@adyen/adyen-web/dist/types/core/ProcessResponse/PaymentMethodsResponse/types";
import { PaymentResponse } from "@adyen/adyen-web/dist/types/components/types";

export type AdyenCheckoutInstanceState = {
  isValid?: boolean;
  data: CardElementData & Record<string, any>;
};

export type AdyenCheckoutInstanceOnSubmit = (
  state: AdyenCheckoutInstanceState,
  component: DropinElement
) => Promise<void> | void;

export type AdyenCheckoutInstanceOnAdditionalDetails = (
  state: AdyenCheckoutInstanceState,
  component: DropinElement
) => Promise<void> | void;

export interface AdyenInitializeData {
  paymentMethodsResponse: PaymentMethodsResponseObject;
  clientKey: string;
  environment: string;
}

export type ApplePayCallback = <T>(value: T) => void;

type AdyenResultCode =
  | "Authorised"
  | "Error"
  | "Pending"
  | "PresentToShopper"
  | "Refused"
  | "Received";

export interface AdyenPaymentResponse extends Omit<PaymentResponse, "resultCode"> {
  resultCode: AdyenResultCode;
}
