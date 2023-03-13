import {
  createDropInAdyenPayment,
  createDropInAdyenSession,
  handleDropInAdyenPaymentDetails,
} from "@/checkout-storefront/fetch/requests";

import type { PaymentResponse as AdyenWebPaymentResponse } from "@adyen/adyen-web/dist/types/components/types";

import { useAppConfig } from "@/checkout-storefront/providers/AppConfigProvider";
import AdyenCheckout from "@adyen/adyen-web";
import { FC, memo, useCallback, useEffect, useRef, useState } from "react";
import { useEvent } from "@/checkout-storefront/hooks/useEvent";
import {
  AdyenCheckoutInstanceOnAdditionalDetails,
  AdyenCheckoutInstanceOnSubmit,
  AdyenCheckoutInstanceState,
  createAdyenCheckoutInstance,
  handlePaymentResult,
} from "./createAdyenCheckout";
import { Checkout } from "@/checkout-storefront/graphql";
import { useCheckoutSubmit } from "../../CheckoutForm/useCheckoutSubmit";
import { useCheckoutValidationState } from "@/checkout-storefront/state/checkoutValidationStateStore";
import { useLocale } from "@/checkout-storefront/hooks/useLocale";
import { useAlerts } from "@/checkout-storefront/hooks/useAlerts";
import { useCheckout } from "@/checkout-storefront/hooks/useCheckout";
import { getAdyenIntegerAmountFromSaleor } from "checkout-common";
import { PaymentMethodsResponse } from "@adyen/api-library/lib/src/typings/checkout/paymentMethodsResponse";
import { createAdyenCheckoutConfig } from "@/checkout-storefront/sections/PaymentSection/AdyenDropIn/utils";
import { AdyenInitializeData } from "@/checkout-storefront/sections/PaymentSection/AdyenDropIn/types";
import { useAdyenDropin } from "@/checkout-storefront/sections/PaymentSection/AdyenDropIn/useAdyenDropin";

type AdyenCheckoutInstance = Awaited<ReturnType<typeof AdyenCheckout>>;

interface AdyenDropInProps {
  config: AdyenInitializeData;
}

// fake function just to get the type because can't import it :(
const _hack = (adyenCheckout: AdyenCheckoutInstance) =>
  adyenCheckout.create("dropin").mount("#dropin-container");
type DropinElement = ReturnType<typeof _hack>;

export const AdyenDropIn: FC<AdyenDropInProps> = ({ config }) => {
  const { locale } = useLocale();
  const { onSubmit, onAdditionalDetails } = useAdyenDropin();
  const dropinContainerElRef = useRef<HTMLDivElement>(null);
  const dropinComponentRef = useRef<DropinElement | null>(null);

  useEffect(() => {
    // TMP
    if (dropinComponentRef.current) {
      return;
    }

    const createAdyenCheckoutInstance = async () => {
      const adyenCheckout = await AdyenCheckout(
        createAdyenCheckoutConfig({ ...config, locale, onSubmit, onAdditionalDetails })
      );

      const dropin = adyenCheckout
        .create("dropin", {})
        .mount(dropinContainerElRef?.current as HTMLDivElement);

      dropinComponentRef.current = dropin;
    };

    void createAdyenCheckoutInstance();

    return () => {
      dropinComponentRef.current?.unmount();
    };
  }, [config, locale, onAdditionalDetails, onSubmit]);

  return <div ref={dropinContainerElRef} />;
};

// export const AdyenDropIn = memo<AdyenDropInProps>(({ config }) => {
//   const {
//     env: { checkoutApiUrl },
//     saleorApiUrl,
//   } = useAppConfig();

//   const { checkout, loading: isCheckoutLoading } = useCheckout();
//   const { validating } = useCheckoutValidationState();
//   const { allFormsValid, validateAllForms } = useCheckoutSubmit();

//   const { showCustomErrors } = useAlerts("checkoutPay");

//   // const [, fetchCreateDropInAdyenPayment] = useFetch(createDropInAdyenPayment, {
//   //   skip: true,
//   // });
//   // const [, fetchHandleDropInAdyenPaymentDetails] = useFetch(handleDropInAdyenPaymentDetails, {
//   //   skip: true,
//   // });

//   const [adyenCheckoutSubmitParams, setAdyenCheckoutSubmitParams] = useState<{
//     state: AdyenCheckoutInstanceState;
//     component: DropinElement;
//   } | null>(null);

//

//   const { dropinContainerElRef } = useDropinAdyenElement(
//     config,
//     // checkoutApiUrl,
//     checkout,
//     // isCheckoutLoading,
//     onSubmit,
//     onAdditionalDetails
//   );

//   return <div ref={dropinContainerElRef} />;
// });
// AdyenDropIn.displayName = "AdyenDropIn";

// function useDropinAdyenElement(
//   // checkoutApiUrl: string,
//   config: PaymentMethodsResponse,
//   checkout: Checkout,
//   // isCheckoutLoading: boolean,
//   onSubmit: AdyenCheckoutInstanceOnSubmit,
//   onAdditionalDetails: AdyenCheckoutInstanceOnAdditionalDetails
// ) {
//   const dropinContainerElRef = useRef<HTMLDivElement>(null);
//   const dropinComponentRef = useRef<DropinElement | null>(null);
//   const adyenCheckoutInstanceRef = useRef<AdyenCheckoutInstance | null>(null);
//   const [adyenCheckoutInstanceCreationStatus, setAdyenCheckoutInstanceCreationStatus] = useState<
//     "IDLE" | "IN_PROGRESS" | "DONE" | "ERROR"
//   >("IDLE");
//   // const { saleorApiUrl } = useAppConfig();
//   const { locale } = useLocale();
//   const previousLocale = useRef(locale);

//   // const [adyenSessionResponse] = useFetch(createDropInAdyenSession, {
//   //   args: {
//   //     checkoutApiUrl,
//   //     saleorApiUrl,
//   //     checkoutId: checkout?.id,
//   //     // we send 0 here and update it later inside `onSubmit`
//   //     totalAmount: 0,
//   //     currency: checkout?.totalPrice?.gross?.currency,
//   //     provider: "adyen",
//   //     method: "dropin",
//   //     redirectUrl: window.location.href,
//   //   },
//   //   skip: isCheckoutLoading,
//   // });

//   const updateApplePayAmount = useCallback(() => {
//     if (!adyenCheckoutInstanceRef) {
//       return;
//     }

//     adyenCheckoutInstanceRef.current
//       ?.update({
//         amount: {
//           value: getAdyenIntegerAmountFromSaleor(
//             checkout.totalPrice.gross.amount,
//             checkout.totalPrice.gross.currency
//           ),
//           currency: checkout.totalPrice.gross.currency,
//         },
//         paymentMethodsConfiguration: {
//           applepay: {
//             amount: {
//               value: getAdyenIntegerAmountFromSaleor(
//                 checkout.totalPrice.gross.amount,
//                 checkout.totalPrice.gross.currency
//               ),
//               currency: checkout.totalPrice.gross.currency,
//             },
//           },
//         },
//       })
//       .catch(console.error);
//   }, [checkout.totalPrice.gross.amount, checkout.totalPrice.gross.currency]);

//   // reset dropin on locale change
//   useEffect(() => {
//     if (previousLocale.current !== locale) {
//       if (dropinComponentRef.current) {
//         dropinComponentRef.current.unmount();
//       }
//       setAdyenCheckoutInstanceCreationStatus("IDLE");
//     }
//     previousLocale.current = locale;
//   }, [locale]);

//   useEffect(() => {
//     if (
//       !dropinContainerElRef.current ||
//       !config ||
//       adyenCheckoutInstanceCreationStatus === "IN_PROGRESS" ||
//       adyenCheckoutInstanceCreationStatus === "DONE"
//     ) {
//       return;
//     }

//     setAdyenCheckoutInstanceCreationStatus("IN_PROGRESS");
//     createAdyenCheckoutInstance(config, {
//       onSubmit,
//       onAdditionalDetails,
//       locale,
//     })
//       .then((adyenCheckout) => {
//         adyenCheckoutInstanceRef.current = adyenCheckout;
//         dropinComponentRef.current = adyenCheckout
//           .create("dropin", { instantPaymentTypes: ["applepay"] })
//           .mount(dropinContainerElRef?.current as HTMLDivElement);
//         updateApplePayAmount();

//         setAdyenCheckoutInstanceCreationStatus("DONE");
//       })
//       .catch((err) => {
//         setAdyenCheckoutInstanceCreationStatus("ERROR");
//         console.error(err);
//       });

//     return () => {
//       dropinComponentRef.current?.unmount();
//     };
//   }, [
//     adyenCheckoutInstanceCreationStatus,
//     adyenSessionResponse.data,
//     onAdditionalDetails,
//     onSubmit,
//     locale,
//     updateApplePayAmount,
//   ]);

//   useEffect(() => {
//     updateApplePayAmount();
//   }, [updateApplePayAmount]);

//   return { dropinContainerElRef, adyenCheckoutInstanceRef };
// }
