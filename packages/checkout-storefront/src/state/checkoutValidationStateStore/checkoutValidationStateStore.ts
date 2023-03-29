import create from "zustand";
import shallow from "zustand/shallow";

export type CheckoutFormScope = "shippingAddress" | "billingAddress" | "guestUser";
type CheckoutFormValidationStatus = "valid" | "invalid";

export type CheckoutValidationState = {
  validationState: Record<CheckoutFormScope, CheckoutFormValidationStatus>;
  validating: boolean;
};

interface UseCheckoutValidationStateStore extends CheckoutValidationState {
  actions: {
    validateAllForms: () => void;
    setValidating: (validaing: boolean) => void;
    setValidationState: (scope: CheckoutFormScope, status: CheckoutFormValidationStatus) => void;
  };
}

const useCheckoutValidationStateStore = create<UseCheckoutValidationStateStore>((set) => ({
  validating: false,
  validationState: { shippingAddress: "valid", guestUser: "valid", billingAddress: "valid" },
  actions: {
    validateAllForms: () => set({ validating: true }),
    setValidating: (validating: boolean) => set({ validating }),
    setValidationState: (scope: CheckoutFormScope, status: CheckoutFormValidationStatus) =>
      set((state) => ({
        validationState: { ...state.validationState, [scope]: status },
        validating: false,
      })),
  },
}));

export const useCheckoutValidationActions = () =>
  useCheckoutValidationStateStore((state) => state.actions);

export const useCheckoutValidationState = (): CheckoutValidationState =>
  useCheckoutValidationStateStore(
    ({ validating, validationState }) => ({ validating, validationState }),
    shallow
  );
