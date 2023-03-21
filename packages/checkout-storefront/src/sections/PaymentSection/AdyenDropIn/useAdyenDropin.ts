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
  AdyenPaymentResponse,
} from "@/checkout-storefront/sections/PaymentSection/AdyenDropIn/types";
import { ParsedAdyenGateway } from "@/checkout-storefront/sections/PaymentSection/types";
import { useCheckoutValidationState } from "@/checkout-storefront/state/checkoutValidationStateStore";
import DropinElement from "@adyen/adyen-web/dist/types/components/Dropin";
import { useCallback, useEffect, useState } from "react";
import { getQueryParams, getUrl, replaceUrl } from "@/checkout-storefront/lib/utils/url";

export interface AdyenDropinProps {
  config: ParsedAdyenGateway;
}

export const useAdyenDropin = ({ config: { id } }: AdyenDropinProps) => {
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

  const handlePaymentResult = ({ resultCode }: AdyenPaymentResponse) => {
    switch (resultCode) {
      case "Authorised":
        adyenCheckoutSubmitParams?.component.setElementStatus("success");
        void onCheckoutComplete({ checkoutId });
        return;
      case "Error":
        adyenCheckoutSubmitParams?.component.setElementStatus("error");
        showCustomErrors([{ message: "There was an error processing your payment." }]);
        return;
      case "Refused":
        adyenCheckoutSubmitParams?.component.setElementStatus("error");
        showCustomErrors([{ message: "Payment refused. Try it again or another method" }]);
        return;
      case "Received":
    }
  };

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
      const parsedData: AdyenPaymentResponse =
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
        handlePaymentResult(parsedData);
        void onCheckoutComplete({ checkoutId });
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
      const parsedData: AdyenPaymentResponse =
        typeof data.data === "string" ? JSON.parse(data.data) : {};
      handlePaymentResult(parsedData);
    },
  });

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
        data: JSON.stringify({
          ...adyenCheckoutSubmitParams.state.data,
          returnUrl: getUrl({ query: { transaction: currentTransactionId } }),
        }),
      },
    });
  }, [
    adyenCheckoutSubmitParams,
    allFormsValid,
    checkoutId,
    currentTransactionId,
    id,
    onTransactionInitialize,
    validating,
  ]);

  const onAdditionalDetails: AdyenCheckoutInstanceOnAdditionalDetails = useEvent(
    async (state, component) => {
      setAdyenCheckoutSubmitParams({ state, component });
      if (currentTransactionId) {
        void onTransactionProccess({ data: JSON.stringify(state.data), id: currentTransactionId });
      }
    }
  );

  useEffect(() => {
    void afterSubmit();
  }, [afterSubmit]);

  // handle when page is opened from previously redirected payment
  useEffect(() => {
    const { redirectResult, transaction } = getQueryParams();

    if (!redirectResult || !transaction) {
      return;
    }

    const decodedRedirectData = Buffer.from(redirectResult, "base64").toString();

    setCurrentTransactionId(transaction);

    void onTransactionProccess({
      id: transaction,
      data: JSON.stringify({ details: decodedRedirectData }),
    });
  }, []);

  return { onSubmit, onAdditionalDetails };
};
