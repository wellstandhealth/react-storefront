import {
  TransactionInitialize,
  TransactionInitializeMutationVariables,
  TransactionProcessMutationVariables,
  useTransactionInitializeMutation,
  useTransactionProcessMutation,
} from "@/checkout-storefront/graphql";
import { useAlerts } from "@/checkout-storefront/hooks/useAlerts";
import { useCheckout } from "@/checkout-storefront/hooks/useCheckout";
import { useEvent } from "@/checkout-storefront/hooks/useEvent";
import { useSubmit } from "@/checkout-storefront/hooks/useSubmit";
import { useCheckoutSubmit } from "@/checkout-storefront/sections/CheckoutForm/useCheckoutSubmit";
import {
  AdyenCheckoutInstanceOnAdditionalDetails,
  AdyenCheckoutInstanceOnSubmit,
  AdyenCheckoutInstanceState,
} from "@/checkout-storefront/sections/PaymentSection/AdyenDropIn/types";
import { ParsedPaymentGateway } from "@/checkout-storefront/sections/PaymentSection/types";
import { useCheckoutValidationState } from "@/checkout-storefront/state/checkoutValidationStateStore";
import DropinElement from "@adyen/adyen-web/dist/types/components/Dropin";
import { useCallback, useEffect, useState } from "react";

export interface AdyenDropinProps {
  config: ParsedPaymentGateway<"adyen">;
}

export const useAdyenDropin = ({ config }: AdyenDropinProps) => {
  const { id, data } = config;
  const {
    checkout: { id: checkoutId, totalPrice },
  } = useCheckout();
  const { validating } = useCheckoutValidationState();
  const { allFormsValid, validateAllForms } = useCheckoutSubmit();
  const { showCustomErrors } = useAlerts();

  const [, transactionInitialize] = useTransactionInitializeMutation();
  const [, transactionProccess] = useTransactionProcessMutation();

  const [adyenCheckoutSubmitParams, setAdyenCheckoutSubmitParams] = useState<{
    state: AdyenCheckoutInstanceState;
    component: DropinElement;
  } | null>(null);

  const onTransactionProccess = useSubmit<
    TransactionProcessMutationVariables,
    typeof transactionProccess
  >({
    scope: "transactionProcess",
    onSubmit: transactionProccess,
    parse: (formData) => formData,
    onError: () => {
      adyenCheckoutSubmitParams?.component.setStatus("ready");
    },
    onSuccess: ({ result }) => {
      const {
        transactionEvent: { type },
        transaction,
      } = result.data?.transactionProcess;
    },
  });

  // const onAdditionalDetails: AdyenCheckoutInstanceOnAdditionalDetails = useEvent(
  //   async (state, component) => {
  //     const result = await fetchHandleDropInAdyenPaymentDetails({
  //       saleorApiUrl,
  //       checkoutApiUrl,
  //       adyenStateData: state.data,
  //     });
  //     if (!result || "message" in result) {
  //       console.error(result);
  //       showCustomErrors([{ message: result?.message || "Something went wrong…" }]);
  //       component.setStatus("ready");
  //       return;
  //     }

  //     return handlePaymentResult(saleorApiUrl, result, component);
  //   }
  // );

  const onTransactionInitialize = useSubmit<
    TransactionInitializeMutationVariables,
    typeof transactionInitialize
  >({
    scope: "transactionInitialize",
    onSubmit: transactionInitialize,
    parse: (formData) => formData,
    onError: () => {
      adyenCheckoutSubmitParams?.component.setStatus("ready");
    },
    onSuccess: ({ result }) => {
      const {
        transactionEvent: { type },
        // transaction,
        data,
      } = result.data?.transactionInitialize as TransactionInitialize;

      const parsedData = JSON.parse(data);

      if (parsedData?.action) {
        adyenCheckoutSubmitParams?.component.handleAction(parsedData.action);
      }
    },
  });

  const onSubmit: AdyenCheckoutInstanceOnSubmit = useEvent(async (state, component) => {
    component.setStatus("loading");
    console.log(`Calling validateAllForms()`);
    setAdyenCheckoutSubmitParams({ state, component });
    validateAllForms();
  });

  const afterSubmit = useCallback(async () => {
    if (!validating && !allFormsValid && adyenCheckoutSubmitParams) {
      // validated, failed, let's reset the state
      adyenCheckoutSubmitParams.component.setStatus("ready");
      setAdyenCheckoutSubmitParams(null);
      return;
    }

    if (!allFormsValid || !adyenCheckoutSubmitParams || validating) {
      // not validated yet, or still validating, or not all forms valid
      return;
    }

    await onTransactionInitialize({
      checkoutId,
      paymentGateway: {
        id,
        data: JSON.stringify(adyenCheckoutSubmitParams.state.data),
      },
    });

    // if (!result || "message" in result) {
    //   console.error(result);
    //   showCustomErrors([{ message: result?.message || "Something went wrong…" }]);
    //   return;
    // }

    if (result.payment.action) {
      adyenCheckoutSubmitParams.component.handleAction(
        // discrepancy between adyen-api and adyen-web types 🤦‍♂️
        result.payment.action as unknown as Exclude<AdyenWebPaymentResponse["action"], undefined>
      );
      return;
    } else {
      return handlePaymentResult(saleorApiUrl, result, adyenCheckoutSubmitParams.component);
    }
  }, [
    adyenCheckoutSubmitParams,
    allFormsValid,
    checkoutId,
    id,
    showCustomErrors,
    transactionInitialize,
    validating,
  ]);

  useEffect(() => {
    void afterSubmit();
  }, [afterSubmit]);

  return { onSubmit, onAdditionalDetails };
};
