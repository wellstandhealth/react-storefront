import { LanguageCodeEnum } from "@/checkout-storefront/graphql";
import { FormDataBase } from "@/checkout-storefront/hooks/useForm";
import { ApiErrors } from "@/checkout-storefront/hooks/useGetParsedErrors";
import { OperationResult } from "urql";

export type MutationVars<MutationFn> = MutationFn extends (vars: infer Vars) => any ? Vars : never;
export type MutationData<MutationFn> = MutationFn extends (vars: any) => Promise<infer Data>
  ? Data
  : never;

const commonVars = ["languageCode", "channel", "checkoutId"] as const;
export type CommonVar = typeof commonVars[number];

export type CommonVars = Record<CommonVar, string> & { languageCode: LanguageCodeEnum };

export type SubmitReturnWithErrors<TData extends FormDataBase> = Promise<{
  hasErrors: boolean;
  errors: ApiErrors<TData>;
}>;

export type MutationBaseFn = (vars: any) => Promise<Pick<OperationResult<any, any>, "data">>;

export type ParserProps<TData> = TData & CommonVars;

export type ParserFunction<TData extends FormDataBase, TMutationFn extends MutationBaseFn> = (
  data: ParserProps<TData>
) => MutationVars<TMutationFn>;

export type SimpleSubmitFn<TData extends FormDataBase | {}> = keyof TData extends never
  ? () => SubmitReturnWithErrors<TData>
  : (formData: TData) => SubmitReturnWithErrors<TData>;

type ResultOf<TMutationFn extends MutationBaseFn> =
  MutationData<TMutationFn> extends OperationResult<infer TData, any> ? TData : never;

export type OperationName<TMutationFn extends MutationBaseFn> = Exclude<
  keyof ResultOf<TMutationFn>,
  "__typename"
>;

export type MutationReturn<TMutationFn extends MutationBaseFn> = TMutationFn extends (
  vars: any
) => Promise<OperationResult<infer TData>>
  ? TData
  : never;

export type MutationResultData<TMutationFn extends MutationBaseFn> =
  OperationName<TMutationFn> extends keyof MutationReturn<TMutationFn>
    ? MutationReturn<TMutationFn>[OperationName<TMutationFn>]
    : never;

export type MutationSuccessData<TMutationFn extends MutationBaseFn> = Exclude<
  MutationResultData<TMutationFn>,
  null | undefined
>;
