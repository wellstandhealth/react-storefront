import * as Sentry from "@sentry/nextjs";
import { getSaleorApiUrlFromRequest } from "@/saleor-app-checkout/backend/auth";
import { createOrder } from "@/saleor-app-checkout/backend/payments/providers/paypal/paypal-api";
import { allowCors } from "@/saleor-app-checkout/backend/utils";
import { unpackPromise, unpackThrowable } from "@/saleor-app-checkout/utils/unpackErrors";
import { NextApiHandler } from "next";
import { PostDropInPaypalOrderResponse } from "checkout-common";

const DropInPaypalOrdersHandler: NextApiHandler<
  PostDropInPaypalOrderResponse | { message: string }
> = async (req, res) => {
  const [saleorApiUrlError, saleorApiUrl] = unpackThrowable(() => getSaleorApiUrlFromRequest(req));

  if (saleorApiUrlError) {
    res.status(400).json({ message: saleorApiUrlError.message });
    return;
  }

  const [paypalOrderError, paypalOrder] = await unpackPromise(createOrder({ saleorApiUrl }));

  if (paypalOrderError) {
    console.error(paypalOrderError);
    Sentry.captureException(paypalOrderError);
    return res.status(500).json({ message: paypalOrderError.message });
  }

  return res.status(200).json({ data: paypalOrder });
};

export default allowCors(DropInPaypalOrdersHandler);
