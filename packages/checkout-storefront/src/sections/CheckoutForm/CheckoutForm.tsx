import { useCheckout } from "@/checkout-storefront/hooks/useCheckout";
import { Contact } from "@/checkout-storefront/sections/Contact";
import { DeliveryMethods } from "@/checkout-storefront/sections/DeliveryMethods";
import { Suspense, useState } from "react";
import { Button } from "@/checkout-storefront/components/Button";
import { useFormattedMessages } from "@/checkout-storefront/hooks/useFormattedMessages";
import { PaymentSection } from "../PaymentSection";
import { ShippingAddressSection } from "../ShippingAddressSection/ShippingAddressSection";
import { ContactSkeleton } from "@/checkout-storefront/sections/Contact/ContactSkeleton";
import { DeliveryMethodsSkeleton } from "@/checkout-storefront/sections/DeliveryMethods/DeliveryMethodsSkeleton";
import { AddressSectionSkeleton } from "@/checkout-storefront/sections/ShippingAddressSection/AddressSectionSkeleton";
import { useCheckoutSubmit } from "@/checkout-storefront/sections/CheckoutForm/useCheckoutSubmit";
import { commonMessages } from "@/checkout-storefront/lib/commonMessages";
import { checkoutFormLabels, checkoutFormMessages } from "./messages";
import { getQueryParams } from "@/checkout-storefront/lib/utils/url";
import { useFetchPaymentMethods } from "@/checkout-storefront/hooks/useFetchPaymentMethods";
import { PayPalExpressCheckout } from "../PaymentSection/PayPalExpressCheckout/PayPalExpressCheckout";
import { Title } from "@/checkout-storefront/components/Title";

export const CheckoutForm = () => {
  const formatMessage = useFormattedMessages();
  const { checkout } = useCheckout();
  const { passwordResetToken } = getQueryParams();

  const [showOnlyContact, setShowOnlyContact] = useState(!!passwordResetToken);

  const { handleSubmit, isProcessing } = useCheckoutSubmit();

  const { availablePaymentProviders } = useFetchPaymentMethods();
  const shouldShowPayButton = availablePaymentProviders.some(
    (provider) => provider && provider !== "adyen"
  );

  return (
    <div className="checkout-form-container">
      <Title className="w-full mb-4">Express checkout</Title>
      <PayPalExpressCheckout />

      <div className="text-center text-2xl font-bold w-full relative mt-5 mb-[1.8rem] after:bg-text-primary after:w-[calc(50%-3ch)] after:h-[1px] after:absolute before:bg-text-primary before:w-[calc(50%-3ch)] before:h-[1px] before:absolute after:block before:block after:top-1/2 before:top-1/2 after:right-0 before:left-0">
        Or
      </div>

      <div className="checkout-form">
        <Suspense fallback={<ContactSkeleton />}>
          <Contact setShowOnlyContact={setShowOnlyContact} />
        </Suspense>
        <>
          {checkout?.isShippingRequired && (
            <Suspense fallback={<AddressSectionSkeleton />}>
              <ShippingAddressSection collapsed={showOnlyContact} />
            </Suspense>
          )}
          <Suspense fallback={<DeliveryMethodsSkeleton />}>
            <DeliveryMethods collapsed={showOnlyContact} />
          </Suspense>
          <PaymentSection collapsed={showOnlyContact} />
        </>
      </div>
      {shouldShowPayButton &&
        !showOnlyContact &&
        (isProcessing ? (
          <Button
            className="pay-button"
            disabled
            ariaLabel={formatMessage(checkoutFormLabels.pay)}
            label={formatMessage(commonMessages.processing)}
          />
        ) : (
          <Button
            ariaLabel={formatMessage(checkoutFormLabels.pay)}
            label={formatMessage(checkoutFormMessages.pay)}
            className="pay-button"
            onClick={handleSubmit}
            data-testid="pay-button"
          />
        ))}
    </div>
  );
};
