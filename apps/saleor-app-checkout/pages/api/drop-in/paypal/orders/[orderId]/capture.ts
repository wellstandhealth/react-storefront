import * as Sentry from "@sentry/nextjs";
import { getSaleorApiUrlFromRequest } from "@/saleor-app-checkout/backend/auth";
import { capturePayment } from "@/saleor-app-checkout/backend/payments/providers/paypal/paypal-api";
import { allowCors } from "@/saleor-app-checkout/backend/utils";
import { unpackPromise, unpackThrowable } from "@/saleor-app-checkout/utils/unpackErrors";
import { NextApiHandler } from "next";
import { PostDropInPaypalOrdersCaptureResponse } from "checkout-common";

const DropInPaypalOrdersOrderIdCaptureHandler: NextApiHandler<
  PostDropInPaypalOrdersCaptureResponse | { message: string }
> = async (req, res) => {
  const [saleorApiUrlError, saleorApiUrl] = unpackThrowable(() => getSaleorApiUrlFromRequest(req));

  if (saleorApiUrlError) {
    res.status(400).json({ message: saleorApiUrlError.message });
    return;
  }

  const orderId = req.query.orderId as string;

  const [paypalOrderCaptureError, paypalOrderCapture] = await unpackPromise(
    capturePayment({ saleorApiUrl, orderId })
  );

  if (paypalOrderCaptureError) {
    console.error(paypalOrderCaptureError);
    Sentry.captureException(paypalOrderCaptureError);
    return res.status(500).json({ message: paypalOrderCaptureError.message });
  }

  // TODO: store payment information such as the transaction ID

  return res.status(200).json({ data: paypalOrderCapture });
};

export default allowCors(DropInPaypalOrdersOrderIdCaptureHandler);
