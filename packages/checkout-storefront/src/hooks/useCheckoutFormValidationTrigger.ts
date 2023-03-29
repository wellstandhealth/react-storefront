import { FormDataBase, UseFormReturn } from "@/checkout-storefront/hooks/useForm";
import { useSetCheckoutFormValidationState } from "@/checkout-storefront/hooks/useSetCheckoutFormValidationState";
import {
  CheckoutFormScope,
  useCheckoutValidationState,
} from "@/checkout-storefront/state/checkoutValidationStateStore";
import { useCallback, useEffect } from "react";

interface UseCheckoutFormValidationTriggerProps<TData extends FormDataBase> {
  scope: CheckoutFormScope;
  form: UseFormReturn<TData>;
  skip?: boolean;
}

// tells forms to validate once the pay button is clicked
export const useCheckoutFormValidationTrigger = <TData extends FormDataBase>({
  scope,
  form,
  skip = false,
}: UseCheckoutFormValidationTriggerProps<TData>) => {
  const { validating } = useCheckoutValidationState();
  const { setCheckoutFormValidationState } = useSetCheckoutFormValidationState(scope);

  const handleGlobalValidationTrigger = useCallback(async () => {
    if (validating) {
      void setCheckoutFormValidationState(form);
    }
  }, [form, setCheckoutFormValidationState, validating]);

  useEffect(() => {
    if (!skip) {
      void handleGlobalValidationTrigger();
    }
  }, [handleGlobalValidationTrigger, skip]);
};
