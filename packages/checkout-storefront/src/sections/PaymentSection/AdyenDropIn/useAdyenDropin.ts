import {
  TransactionEvent,
  TransactionInitializeMutationVariables,
  TransactionItem,
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
  AdyenPaymentResponse,
  AdyenTransactionProcessResponse,
} from "@/checkout-storefront/sections/PaymentSection/AdyenDropIn/types";
import {
  areAllFormsValid,
  useCheckoutValidationActions,
  useCheckoutValidationState,
} from "@/checkout-storefront/state/checkoutValidationStateStore";
import DropinElement from "@adyen/adyen-web/dist/types/components/Dropin";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getQueryParams } from "@/checkout-storefront/lib/utils/url";
import { ParsedAdyenGateway } from "@/checkout-storefront/sections/PaymentSection/types";
import { getCurrentHref } from "@/checkout-storefront/lib/utils/locale";
import {
  areAnyRequestsInProgress,
  hasFinishedApiChangesWithNoError,
  useCheckoutUpdateState,
} from "@/checkout-storefront/state/updateStateStore";
import { useCheckoutComplete } from "@/checkout-storefront/hooks/useCheckoutComplete";
import { ErrorMessages, useErrorMessages } from "@/checkout-storefront/hooks/useErrorMessages";
import { adyenErrorMessages } from "@/checkout-storefront/sections/PaymentSection/AdyenDropIn/errorMessages";
import { camelCase } from "lodash-es";
import { apiErrorMessages } from "@/checkout-storefront/hooks/useAlerts/messages";

export interface AdyenDropinProps {
  config: ParsedAdyenGateway;
}

export const useAdyenDropin = (props: AdyenDropinProps) => {
  const { config } = props;
  const { id } = config;

  const {
    checkout: { id: checkoutId, totalPrice },
  } = useCheckout();
  const { errorMessages } = useErrorMessages(adyenErrorMessages);
  const { errorMessages: commonErrorMessages } = useErrorMessages(apiErrorMessages);
  const { validateAllForms } = useCheckoutValidationActions();
  const { validating, validationState } = useCheckoutValidationState();
  const { updateState, loadingCheckout, ...rest } = useCheckoutUpdateState();
  const { showCustomErrors } = useAlerts();

  const [currentTransactionId, setCurrentTransactionId] = useState<string | undefined>();
  const [, transactionInitialize] = useTransactionInitializeMutation();
  const [, transactionProccess] = useTransactionProcessMutation();
  const { onCheckoutComplete } = useCheckoutComplete();
  // const [submitting, setSubmitting] = useState(false);
  const [submitInProgress, setSubmitInProgress] = useState(false);

  const [adyenCheckoutSubmitParams, setAdyenCheckoutSubmitParams] = useState<{
    state: AdyenCheckoutInstanceState;
    component: DropinElement;
  } | null>(null);

  const allFormsValid = areAllFormsValid({ validating, validationState });
  console.log({ validating, validationState });

  const anyRequestsInProgress = areAnyRequestsInProgress({ updateState, loadingCheckout });

  const finishedApiChangesWithNoError = hasFinishedApiChangesWithNoError({
    updateState,
    loadingCheckout,
    ...rest,
  });

  const handlePaymentResult = useCallback(
    ({
      paymentResponse,
      transaction,
      transactionEvent,
    }: {
      paymentResponse: AdyenPaymentResponse;
      transaction: TransactionItem;
      TransactionEvent: TransactionEvent;
    }) => {
      const { action, resultCode } = paymentResponse;

      if (transaction) {
        setCurrentTransactionId(transaction.id);
      }

      if (action) {
        adyenCheckoutSubmitParams?.component.handleAction(action);
      }

      console.log(222, { resultCode, transaction, transactionEvent });

      switch (resultCode) {
        case "Authorised":
          adyenCheckoutSubmitParams?.component.setStatus("success");
          // void onCheckoutComplete();
          return;
        case "Error":
          adyenCheckoutSubmitParams?.component.setStatus("error");
          showCustomErrors([{ message: "There was an error processing your payment." }]);
          return;
        case "Refused":
          setCurrentTransactionId(undefined);
          // adyenCheckoutSubmitParams?.component.setStatus("error", {
          //   //needs translation
          //   message: paymentResponse.refusalReason,
          // });

          adyenCheckoutSubmitParams?.component.setStatus("ready");

          const messageKey = camelCase(paymentResponse.refusalReason);

          showCustomErrors([{ message: errorMessages[messageKey as keyof typeof errorMessages] }]);

          setTimeout(() => {}, 10000);
          return;
        // case "Received":
      }
    },
    [adyenCheckoutSubmitParams?.component, errorMessages, showCustomErrors]
  );

  const onTransactionInitialize = useSubmit<
    TransactionInitializeMutationVariables,
    typeof transactionInitialize
  >(
    useMemo(
      () => ({
        scope: "transactionInitialize",
        onSubmit: transactionInitialize,
        parse: (formData) => formData,
        onError: () => {
          adyenCheckoutSubmitParams?.component.setStatus("error");
        },
        onSuccess: async ({ data }) => {
          // setSubmitting(false);

          if (!data) {
            showCustomErrors([{ message: commonErrorMessages.somethingWentWrong }]);
            return;
          }

          const { transaction, transactionEvent, data: adyenData } = data;

          if (!transaction || !adyenData || !transactionEvent) {
            //alert?
            return;
          }

          if (adyenData) {
            void handlePaymentResult({
              paymentResponse: adyenData.paymentResponse,
              transaction,
              transactionEvent,
            });
          }
        },
      }),
      [
        adyenCheckoutSubmitParams?.component,
        commonErrorMessages.somethingWentWrong,
        handlePaymentResult,
        showCustomErrors,
        transactionInitialize,
      ]
    )
  );

  const onTransactionProccess = useSubmit<
    TransactionProcessMutationVariables,
    typeof transactionProccess
  >(
    useMemo(
      () => ({
        scope: "transactionProcess",
        onSubmit: transactionProccess,
        parse: (formData) => formData,
        // onError: () => {
        //   console.log("YOOOO?");
        //   adyenCheckoutSubmitParams?.component.setStatus("ready");
        // },
        onSuccess: ({ data }) => {
          // setSubmitting(false);

          if (!data?.data) {
            showCustomErrors([{ message: commonErrorMessages.somethingWentWrong }]);
            return;
          }

          const {
            transaction,
            transactionEvent,
            data: { paymentDetailsResponse },
          } = data;

          handlePaymentResult({
            paymentResponse: paymentDetailsResponse,
            transaction,
            transactionEvent,
          });
        },
      }),
      [
        commonErrorMessages.somethingWentWrong,
        handlePaymentResult,
        showCustomErrors,
        transactionProccess,
      ]
    )
  );

  const onSubmitInitialize: AdyenCheckoutInstanceOnSubmit = useEvent(async (state, component) => {
    component.setStatus("loading");
    console.log(`Calling validateAllForms()`);
    setAdyenCheckoutSubmitParams({ state, component });
    validateAllForms();
    setSubmitInProgress(true);
  });

  useEffect(() => {
    console.log({
      submitInProgress,
      validating,
      anyRequestsInProgress,
      finishedApiChangesWithNoError,
      allFormsValid,
    });
    if (!submitInProgress || validating || anyRequestsInProgress || !adyenCheckoutSubmitParams) {
      console.log("NO SUBMIT IN PROGRESS OR VALIDATING OR REQUESTS IN PROGRESS OR NO PARAMS");
      return;
    }

    if (!finishedApiChangesWithNoError || !allFormsValid) {
      // validated, failed, let's reset the state
      console.log("API CHANGES ERROR OR FORMS INVALID");
      adyenCheckoutSubmitParams?.component.setStatus("ready");
      setSubmitInProgress(false);
      // setAdyenCheckoutSubmitParams(null);
      return;
    }

    adyenCheckoutSubmitParams.component.setStatus("loading");
    setSubmitInProgress(false);

    if (currentTransactionId) {
      console.log("SUBMITEN PROCESS");
      void onTransactionProccess({
        data: adyenCheckoutSubmitParams?.state.data,
        id: currentTransactionId,
      });
      return;
    }

    console.log("SUBMITEN INITIALIZE");
    void onTransactionInitialize({
      checkoutId,
      amount: totalPrice.gross.amount,
      paymentGateway: {
        id,
        data: {
          ...adyenCheckoutSubmitParams.state.data,
          returnUrl: getCurrentHref(),
        },
      },
    });
  }, [
    adyenCheckoutSubmitParams,
    allFormsValid,
    anyRequestsInProgress,
    checkoutId,
    currentTransactionId,
    finishedApiChangesWithNoError,
    id,
    onTransactionInitialize,
    onTransactionProccess,
    submitInProgress,
    totalPrice.gross.amount,
    validateAllForms,
    validating,
  ]);

  const onAdditionalDetails: AdyenCheckoutInstanceOnAdditionalDetails = useEvent(
    async (state, component) => {
      setAdyenCheckoutSubmitParams({ state, component });
      if (currentTransactionId) {
        adyenCheckoutSubmitParams?.component?.setStatus("loading");
        setSubmitInProgress(true);
        // void onTransactionProccess({ data: state.data, id: currentTransactionId });
      }
    }
  );

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
      data: { details: decodedRedirectData },
    });
  }, []);

  return { onSubmit: onSubmitInitialize, onAdditionalDetails };
};
