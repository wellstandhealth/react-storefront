// import { useFormattedMessages } from "@/checkout-storefront/hooks/useFormattedMessages";
// import { SelectBoxGroup } from "@/checkout-storefront/components/SelectBoxGroup";
// import { SelectBox } from "@/checkout-storefront/components/SelectBox";
// import { Text } from "@saleor/ui-kit";
// import { paymentSectionLabels, paymentMethodsMessages } from "./messages";
// import { usePaymentMethodsForm } from "@/checkout-storefront/sections/PaymentSection/usePaymentMethodsForm";
// import { FormProvider } from "@/checkout-storefront/providers/FormProvider";
import { AdyenDropIn } from "@/checkout-storefront/sections/PaymentSection/AdyenDropIn/AdyenDropIn";
import { usePayments } from "@/checkout-storefront/sections/PaymentSection/usePayments";
import { PaymentGatewayId } from "@/checkout-storefront/sections/PaymentSection/useGetParsedPaymentGatewaysConfigs";
import { ParsedPaymentGateway } from "@/checkout-storefront/sections/PaymentSection/types";

export const PaymentMethods = () => {
  // const formatMessage = useFormattedMessages();
  // const { form, availablePaymentMethods, availablePaymentProviders } = usePaymentMethodsForm();
  const { /*availablePaymentMethods,*/ availablePaymentGateways } = usePayments();

  const adyenGateway = availablePaymentGateways.find(
    ({ paymentGatewayId }) => paymentGatewayId === PaymentGatewayId.adyen
  ) as ParsedPaymentGateway<"adyen"> | undefined;

  return adyenGateway ? <AdyenDropIn config={adyenGateway} /> : null;
  // return showAdyenDropin ? (
  //   <AdyenDropIn />
  // ) : (
  //   <FormProvider form={form}>
  //     <SelectBoxGroup
  //       label={formatMessage(paymentSectionLabels.paymentProviders)}
  //       className="flex flex-row gap-2 mb-8"
  //     >
  //       {availablePaymentMethods.map((paymentMethodId) => (
  //         <SelectBox
  //           key={paymentMethodId}
  //           className="shrink"
  //           name="selectedMethodId"
  //           value={paymentMethodId}
  //         >
  //           <Text>{formatMessage(paymentMethodsMessages[paymentMethodId])}</Text>
  //         </SelectBox>
  //       ))}
  //     </SelectBoxGroup>
  //   </FormProvider>
  // );
};
