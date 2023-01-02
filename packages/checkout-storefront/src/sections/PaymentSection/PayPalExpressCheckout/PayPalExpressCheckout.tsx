import {
  createDropInPaypalOrder,
  createDropInPaypalOrderCapture,
} from "@/checkout-storefront/fetch";
import { Checkout } from "@/checkout-storefront/graphql";
import { useCheckout, useFetch } from "@/checkout-storefront/hooks";
import { useEvent } from "@/checkout-storefront/hooks/useEvent";
import { useLocale } from "@/checkout-storefront/hooks/useLocale";
import { Locale } from "@/checkout-storefront/lib/regions";
import { useAppConfig } from "@/checkout-storefront/providers/AppConfigProvider/AppConfigProvider";
import { PayPalButtonsComponentOptions } from "@paypal/paypal-js";
import {
  PayPalScriptProvider,
  PayPalButtons,
  FUNDING,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";

const saleorLocaleToSupportedPayPalLocale = (locale: Locale) => {
  const [lang, country] = locale.split("-");
  if (!lang || !country) {
    return `en_US`;
  }
  return [lang.toLowerCase(), country.toUpperCase()].join("_");
};

export const PayPalExpressCheckout = () => {
  const { loading, checkout } = useCheckout();

  const { locale } = useLocale();

  if (loading || !checkout) {
    return <div className="w-full h-10" />;
  }

  return (
    <div className="w-full h-10">
      <PayPalScriptProvider
        options={{
          "client-id":
            "AQbCb24HuZ4zrtcXCvTbUtyr5Q9n6GCyqt6IxI12vUuQ_aQVA6me_nnq2OL98wniI2Q6yk33SVBJ-E2s",
          currency: checkout.totalPrice.currency,
          locale: saleorLocaleToSupportedPayPalLocale(locale),
        }}
      >
        <PayPalInside checkout={checkout} />
      </PayPalScriptProvider>
    </div>
  );
};

function PayPalInside({ checkout }: { checkout: Checkout }) {
  // const [{ options }, dispatch] = usePayPalScriptReducer();

  const {
    env: { checkoutApiUrl },
    saleorApiUrl,
  } = useAppConfig();

  const [, fetchCreateDropInPaypalOrder] = useFetch(createDropInPaypalOrder, {
    skip: true,
  });
  const [, fetchCreateDropInPaypalOrderCapture] = useFetch(createDropInPaypalOrderCapture, {
    skip: true,
  });

  const onCreateOrder: PayPalButtonsComponentOptions["createOrder"] = useEvent(async () => {
    const response = await fetchCreateDropInPaypalOrder({
      checkoutApiUrl,
      saleorApiUrl,
      checkoutId: checkout.id,
      redirectUrl: window.location.href,
      totalAmount: checkout.totalPrice.gross.amount,
    });

    if (response && "data" in response) {
      return response.data.id;
    }

    throw new Error(`Something went wrong in create order`);
  });
  const handleApprove: PayPalButtonsComponentOptions["onApprove"] = useEvent(async (data) => {
    const response = await fetchCreateDropInPaypalOrderCapture({
      checkoutApiUrl,
      saleorApiUrl,
      orderId: data.orderID,
    });

    if (response && "data" in response) {
      console.log(response);
      return;
    }

    throw new Error(`Something went wrong in create order capture`);
  });
  const handleCancel: PayPalButtonsComponentOptions["onCancel"] = useEvent(async () => {});

  return (
    <PayPalButtons
      style={{
        shape: "rect",
        height: 40,
      }}
      fundingSource={FUNDING?.PAYPAL}
      createOrder={onCreateOrder}
      onApprove={handleApprove}
      onCancel={handleCancel}
    />
  );
}
