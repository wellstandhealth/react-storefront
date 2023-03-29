import { CheckoutValidationState } from "@/checkout-storefront/state/checkoutValidationStateStore/checkoutValidationStateStore";

export const areAllFormsValid = ({
  validating,
  validationState,
}: CheckoutValidationState): boolean =>
  !validating && Object.values(validationState).every((value) => value === "valid");
