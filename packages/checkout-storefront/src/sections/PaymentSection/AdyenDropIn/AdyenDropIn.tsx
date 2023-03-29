import AdyenCheckout from "@adyen/adyen-web";
import { FC, useEffect, useRef } from "react";

import { useLocale } from "@/checkout-storefront/hooks/useLocale";
import { createAdyenCheckoutConfig } from "@/checkout-storefront/sections/PaymentSection/AdyenDropIn/utils";
import {
  AdyenDropinProps,
  useAdyenDropin,
} from "@/checkout-storefront/sections/PaymentSection/AdyenDropIn/useAdyenDropin";
import "@adyen/adyen-web/dist/adyen.css";

type AdyenCheckoutInstance = Awaited<ReturnType<typeof AdyenCheckout>>;

// fake function just to get the type because can't import it :(
const _hack = (adyenCheckout: AdyenCheckoutInstance) =>
  adyenCheckout.create("dropin").mount("#dropin-container");
type DropinElement = ReturnType<typeof _hack>;

export const AdyenDropIn: FC<AdyenDropinProps> = ({ config }) => {
  const { locale } = useLocale();
  const { onSubmit, onAdditionalDetails } = useAdyenDropin({ config });
  const dropinContainerElRef = useRef<HTMLDivElement>(null);
  const dropinComponentRef = useRef<DropinElement | null>(null);

  useEffect(() => {
    // TMP, we need to reinitialize in case e.g locale changes
    if (dropinComponentRef.current) {
      return;
    }

    const createAdyenCheckoutInstance = async () => {
      const adyenCheckout = await AdyenCheckout(
        createAdyenCheckoutConfig({ ...config.data, locale, onSubmit, onAdditionalDetails })
      );

      const dropin = adyenCheckout
        .create("dropin")
        .mount(dropinContainerElRef?.current as HTMLDivElement);

      dropinComponentRef.current = dropin;
    };

    void createAdyenCheckoutInstance();

    return () => {
      dropinComponentRef.current?.unmount();
    };
  }, [config, locale, onAdditionalDetails, onSubmit]);

  return <div ref={dropinContainerElRef} />;
};
