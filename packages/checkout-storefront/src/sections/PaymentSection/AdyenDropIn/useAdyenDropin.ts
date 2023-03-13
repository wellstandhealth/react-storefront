import { useAlerts } from "@/checkout-storefront/hooks/useAlerts";
import { useEvent } from "@/checkout-storefront/hooks/useEvent";
import { useCheckoutSubmit } from "@/checkout-storefront/sections/CheckoutForm/useCheckoutSubmit";
import { useCheckoutValidationActions } from "@/checkout-storefront/state/checkoutValidationStateStore";
import { useCallback, useEffect } from "react";

interface UseAdyenDropin {}

export const useAdyenDropin = () => {
  const { allFormsValid, validateAllForms } = useCheckoutSubmit();
  const { showCustomErrors } = useAlerts();

  const onAdditionalDetails: AdyenCheckoutInstanceOnAdditionalDetails = useEvent(
    async (state, component) => {
      const result = await fetchHandleDropInAdyenPaymentDetails({
        saleorApiUrl,
        checkoutApiUrl,
        adyenStateData: state.data,
      });
      if (!result || "message" in result) {
        console.error(result);
        showCustomErrors([{ message: result?.message || "Something went wrong…" }]);
        component.setStatus("ready");
        return;
      }

      return handlePaymentResult(saleorApiUrl, result, component);
    }
  );

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

    const result = await fetchCreateDropInAdyenPayment({
      checkoutApiUrl,
      saleorApiUrl,
      totalAmount: checkout.totalPrice.gross.amount,
      checkoutId: checkout.id,
      method: "dropin",
      provider: "adyen",
      redirectUrl: window.location.href,
      adyenStateData: adyenCheckoutSubmitParams.state.data,
    });

    if (!result || "message" in result) {
      console.error(result);
      showCustomErrors([{ message: result?.message || "Something went wrong…" }]);
      adyenCheckoutSubmitParams.component.setStatus("ready");
      return;
    }

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
    checkout.id,
    checkout.totalPrice.gross.amount,
    checkoutApiUrl,
    fetchCreateDropInAdyenPayment,
    saleorApiUrl,
    showCustomErrors,
    validating,
  ]);

  useEffect(() => {
    void afterSubmit();
  }, [afterSubmit]);

  return { onSubmit, onAdditionalDetails };
};
