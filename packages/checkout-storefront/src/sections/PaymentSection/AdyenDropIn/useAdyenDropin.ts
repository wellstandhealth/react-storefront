import {
  TransactionInitializeMutationVariables,
  TransactionProcessMutationVariables,
  useCheckoutCompleteMutation,
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
import { handleAdyenPaymentResult } from "@/checkout-storefront/sections/PaymentSection/AdyenDropIn/utils";
import { ParsedPaymentGateway } from "@/checkout-storefront/sections/PaymentSection/types";
import { useCheckoutValidationState } from "@/checkout-storefront/state/checkoutValidationStateStore";
import DropinElement from "@adyen/adyen-web/dist/types/components/Dropin";
import { useCallback, useEffect, useState } from "react";
import { PaymentResponse } from "@adyen/adyen-web/dist/types/components/types";
import { replaceUrl } from "@/checkout-storefront/lib/utils/url";
import { PaymentDetailsResponse } from "@adyen/api-library/lib/src/typings/checkout/paymentDetailsResponse";

export interface AdyenDropinProps {
  config: ParsedPaymentGateway<"adyen">;
}

export const useAdyenDropin = ({ config }: AdyenDropinProps) => {
  const { id, data } = config;
  const {
    checkout: { id: checkoutId },
  } = useCheckout();
  const { validating } = useCheckoutValidationState();
  const { allFormsValid, validateAllForms } = useCheckoutSubmit();
  const { showCustomErrors } = useAlerts();

  const [currentTransactionId, setCurrentTransactionId] = useState<string | undefined>();
  const [, transactionInitialize] = useTransactionInitializeMutation();
  const [, transactionProccess] = useTransactionProcessMutation();
  const [, checkoutComplete] = useCheckoutCompleteMutation();

  const [adyenCheckoutSubmitParams, setAdyenCheckoutSubmitParams] = useState<{
    state: AdyenCheckoutInstanceState;
    component: DropinElement;
  } | null>(null);

  const onCheckoutComplete = useSubmit<{ checkoutId: string }, typeof checkoutComplete>({
    scope: "",
    parse: (formData) => formData,
    onSubmit: checkoutComplete,
    onSuccess: ({ data }) => {
      const order = data.order;

      if (order) {
        replaceUrl({ query: { checkout: undefined, order: order.id } });
      }
    },
  });

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
    onSuccess: ({ data }) => {
      const parsedData = typeof data.data === "string" ? JSON.parse(data.data) : {};

      if (parsedData?.resultCode === PaymentDetailsResponse.ResultCodeEnum.Authorised) {
        void onCheckoutComplete({ checkoutId });
      }
    },
  });

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
    onSuccess: async ({ data }) => {
      const parsedData: PaymentResponse =
        typeof data.data === "string" ? JSON.parse(data.data) : {};

      if (data.transaction) {
        setCurrentTransactionId(data.transaction.id);
      }

      if (!parsedData) {
        return;
      }

      if (parsedData?.action) {
        adyenCheckoutSubmitParams?.component.handleAction(parsedData.action);
      } else {
        handleAdyenPaymentResult(parsedData, adyenCheckoutSubmitParams?.component as DropinElement);
        void onCheckoutComplete({ checkoutId });
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

    void onTransactionInitialize({
      checkoutId,
      paymentGateway: {
        id,
        data: JSON.stringify(adyenCheckoutSubmitParams.state.data),
      },
    });
  }, [
    adyenCheckoutSubmitParams,
    allFormsValid,
    checkoutId,
    id,
    onTransactionInitialize,
    validating,
  ]);

  const onAdditionalDetails: AdyenCheckoutInstanceOnAdditionalDetails = useEvent(
    async (state, component) => {
      setAdyenCheckoutSubmitParams({ state, component });
      void onTransactionProccess({ data: JSON.stringify(state.data), id: currentTransactionId });
    }
  );

  useEffect(() => {
    void afterSubmit();
  }, [afterSubmit]);

  return { onSubmit, onAdditionalDetails };
};
