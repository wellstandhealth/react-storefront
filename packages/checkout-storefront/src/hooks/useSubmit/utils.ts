import {
  MutationBaseFn,
  MutationData,
  MutationResultData,
  MutationSuccessData,
} from "@/checkout-storefront/hooks/useSubmit/types";

type SuccessDataReturn<TMutationFn extends MutationBaseFn> =
  | {
      success: true;
      data: MutationSuccessData<TMutationFn>;
    }
  | {
      success: false;
      data: null;
    };

export const extractMutationData = <TMutationFn extends MutationBaseFn>(
  result: MutationData<TMutationFn>
): SuccessDataReturn<TMutationFn> => {
  const failedResponse: SuccessDataReturn<TMutationFn> = { success: false, data: null };

  if (result.data) {
    const data: MutationResultData<TMutationFn> = result.data;

    try {
      const mutationNameKey = Object.keys(data as Record<string, any>).filter(
        (key) => !["__typename"].includes(key)
      )?.[0];

      if (mutationNameKey) {
        const mutationReturnData = result.data[mutationNameKey];

        if (mutationReturnData) {
          return { success: true, data: mutationReturnData };
        }
      }
    } catch (e) {
      return failedResponse;
    }
  }

  return failedResponse;
};
