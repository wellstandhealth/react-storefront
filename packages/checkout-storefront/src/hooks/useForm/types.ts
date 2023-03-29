import { FormikConfig, FormikErrors, FormikHelpers, useFormik } from "formik";
import { FocusEvent } from "react";
import { Schema } from "yup";

export type FormDataBase = Record<string, any>;

export type FormErrors<TData extends FormDataBase> = FormikErrors<TData>;

export type FormDataField<TData extends FormDataBase> = Extract<keyof TData, string>;

// we make these types more strict than default formik ones
export type UseFormReturn<TData extends FormDataBase> = Omit<
  ReturnType<typeof useFormik<TData>>,
  "setFieldValue" | "validateForm"
> & {
  // we use keyof FormData instead of plain string
  setFieldValue: <TFieldName extends FormDataField<TData>>(
    field: TFieldName,
    value: TData[TFieldName]
  ) => void;
  validateForm: (values: TData) => FormErrors<TData>;
};

export type FormProps<TData> = Omit<FormikConfig<TData>, "validationSchema"> & {
  initialDirty?: boolean;
  validationSchema: Schema<TData>;
};

export type FormHelpers<TData extends FormDataBase> = Omit<
  FormikHelpers<TData>,
  "validateForm" | "setTouched"
> &
  Pick<UseFormReturn<TData>, "validateForm" | "setTouched">;

export type ChangeHandler<TElement = any> = (e: React.ChangeEvent<TElement>) => void;

export type BlurHandler = (event: FocusEvent<HTMLInputElement>) => void;

export type FormConfig<TData extends FormDataBase> = Omit<FormikConfig<TData>, "onSubmit"> & {
  onSubmit: (formData: TData, formHelpers: FormHelpers<TData>) => void | Promise<any>;
};
