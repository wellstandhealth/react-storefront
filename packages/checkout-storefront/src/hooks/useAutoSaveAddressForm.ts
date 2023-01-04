import { AddressFormData } from "@/checkout-storefront/components/AddressForm/types";
import { useDebouncedSubmit } from "@/checkout-storefront/hooks/useDebouncedSubmit";
import {
  BlurHandler,
  ChangeHandler,
  FormHelpers,
  useForm,
  UseFormReturn,
} from "@/checkout-storefront/hooks/useForm";
import { FormikConfig } from "formik";
import { pick } from "lodash-es";
import { useCallback } from "react";

export type AutoSaveAddressFormData = Partial<AddressFormData>;

export const useAutoSaveAddressForm = (
  formProps: FormikConfig<AutoSaveAddressFormData>
): UseFormReturn<AutoSaveAddressFormData> & { handleSubmit: (event: any) => Promise<void> } => {
  const { initialValues } = formProps;
  const { onSubmit } = formProps;

  const form = useForm<AutoSaveAddressFormData>(formProps);
  const { values, validateForm, dirty, handleBlur, handleChange } = form;

  const debouncedSubmit = useDebouncedSubmit(onSubmit);

  const formHelpers = pick(form, [
    "setErrors",
    "setStatus",
    "setTouched",
    "setValues",
    "setSubmitting",
    "setFormikState",
    "setFieldValue",
    "setFieldTouched",
    "setFieldError",
    "validateForm",
    "validateField",
    "resetForm",
    "submitForm",
  ]) as FormHelpers<AutoSaveAddressFormData>;

  // it'd make sense for onSubmit prop to be optional but formik has ignored this
  // request for forever now https://github.com/jaredpalmer/formik/issues/2675
  // so we're just gonna add a partial submit for guest address form to work
  const partialSubmit = useCallback(async () => {
    console.log({ values });
    const formErrors = await validateForm(values);

    const hasFieldsErrors = !!Object.keys(formErrors).length;

    if (!hasFieldsErrors && dirty) {
      void debouncedSubmit(
        { ...initialValues, countryCode: values.countryCode, ...values },
        formHelpers
      );
    }
  }, [values, dirty, validateForm, debouncedSubmit, initialValues, formHelpers]);

  const onChange: ChangeHandler = (event) => {
    handleChange(event);
    void partialSubmit();
  };

  const onBlur: BlurHandler = (event) => {
    handleBlur(event);
    void partialSubmit();
  };

  return { ...form, handleChange: onChange, handleBlur: onBlur, handleSubmit: partialSubmit };
};
