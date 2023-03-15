import { Locale } from "@/checkout-storefront/lib/regions";
import {
  AdyenCheckoutInstanceOnAdditionalDetails,
  AdyenCheckoutInstanceOnSubmit,
  AdyenInitializeData,
  ApplePayCallback,
} from "@/checkout-storefront/sections/PaymentSection/AdyenDropIn/types";
import DropinElement from "@adyen/adyen-web/dist/types/components/Dropin";
import { CoreOptions } from "@adyen/adyen-web/dist/types/core/types";
import { PaymentMethodsResponseInterface } from "@adyen/adyen-web/dist/types/types";
import { PaymentResponse } from "@adyen/adyen-web/dist/types/components/types";
import { PaymentResponse as AdyenApiPaymentResponse } from "@adyen/api-library/lib/src/typings/checkout/paymentResponse";

interface CreateAdyenCheckoutConfigProps extends AdyenInitializeData {
  locale: Locale;
  onSubmit: AdyenCheckoutInstanceOnSubmit;
  onAdditionalDetails: AdyenCheckoutInstanceOnAdditionalDetails;
}

export const createAdyenCheckoutConfig = ({
  paymentMethodsResponse,
  clientKey,
  environment,
  onSubmit,
  onAdditionalDetails,
  locale,
}: CreateAdyenCheckoutConfigProps): CoreOptions => ({
  paymentMethodsResponse,
  environment,
  clientKey,
  onSubmit,
  onAdditionalDetails,
  locale,
  analytics: {
    enabled: false,
  },
  // Any payment method specific configuration. Find the configuration specific to each payment method: https://docs.adyen.com/payment-methods
  // For example, this is 3D Secure configuration for cards:
  paymentMethodsConfiguration: {
    card: {
      hasHolderName: true,
      holderNameRequired: true,
      billingAddressRequired: false,
    },
    applepay: {
      buttonType: "plain",
      buttonColor: "black",
      onPaymentMethodSelected: (
        resolve: ApplePayCallback,
        reject: ApplePayCallback,
        event: ApplePayJS.ApplePayPaymentMethodSelectedEvent
      ) => {
        console.log({ "event.paymentMethod": event.paymentMethod, event });
        resolve(event.paymentMethod);
      },
      onShippingContactSelected: (
        resolve: ApplePayCallback,
        reject: ApplePayCallback,
        event: ApplePayJS.ApplePayShippingContactSelectedEvent
      ) => {
        console.log({ "event.shippingContact": event.shippingContact, event });
        resolve(event.shippingContact);
      },
      onShippingMethodSelected: (
        resolve: ApplePayCallback,
        reject: ApplePayCallback,
        event: ApplePayJS.ApplePayShippingMethodSelectedEvent
      ) => {
        console.log({ "event.shippingMethod": event.shippingMethod, event });
        resolve(event.shippingMethod);
      },
    },
  },
});

export function handleAdyenPaymentResult(result: PaymentResponse, component: DropinElement) {
  switch (result.resultCode) {
    // @todo https://docs.adyen.com/online-payments/payment-result-codes
    case AdyenApiPaymentResponse.ResultCodeEnum.AuthenticationFinished:
    case AdyenApiPaymentResponse.ResultCodeEnum.Cancelled:
    case AdyenApiPaymentResponse.ResultCodeEnum.ChallengeShopper:
    case AdyenApiPaymentResponse.ResultCodeEnum.Error:
    case AdyenApiPaymentResponse.ResultCodeEnum.IdentifyShopper:
    case AdyenApiPaymentResponse.ResultCodeEnum.Pending:
    case AdyenApiPaymentResponse.ResultCodeEnum.PresentToShopper:
    case AdyenApiPaymentResponse.ResultCodeEnum.Received:
    case AdyenApiPaymentResponse.ResultCodeEnum.RedirectShopper:
    case AdyenApiPaymentResponse.ResultCodeEnum.Refused: {
      console.error(result);
      component.setStatus("error", {
        message: `${result.resultCode}: ${result.refusalReason as string}`,
      });
      return;
    }

    case AdyenApiPaymentResponse.ResultCodeEnum.Authorised:
    case AdyenApiPaymentResponse.ResultCodeEnum.Success: {
      component.setStatus("success");
      return;
    }
  }
}
