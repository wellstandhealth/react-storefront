import * as Sentry from "@sentry/nextjs";
import { getSaleorApiUrlFromRequest } from "@/saleor-app-checkout/backend/auth";
import { createPaypalOrder } from "@/saleor-app-checkout/backend/payments/providers/paypal/paypal-api";
import { allowCors } from "@/saleor-app-checkout/backend/utils";
import { unpackPromise, unpackThrowable } from "@/saleor-app-checkout/utils/unpackErrors";
import { NextApiHandler } from "next";
import { PostDropInPaypalOrdersResponse, postDropInPaypalOrdersBody } from "checkout-common";
import { createParseAndValidateBody } from "@/saleor-app-checkout/utils";
import { createOrderFromBodyOrId } from "@/saleor-app-checkout/backend/payments/createOrderFromBody";

const parseAndValidateBody = createParseAndValidateBody(postDropInPaypalOrdersBody);

const DropInPaypalOrdersHandler: NextApiHandler<
  PostDropInPaypalOrdersResponse | { message: string }
> = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send({ message: "Only POST requests allowed" });
    return;
  }

  const [error, body] = parseAndValidateBody(req.body);

  if (error) {
    console.error(error, req.body);
    res.status(400).send({ message: "Invalid JSON" });
    return;
  }

  const [saleorApiUrlError, saleorApiUrl] = unpackThrowable(() => getSaleorApiUrlFromRequest(req));

  if (saleorApiUrlError) {
    res.status(400).json({ message: saleorApiUrlError.message });
    return;
  }

  const [orderCrationError, order] = await unpackPromise(
    createOrderFromBodyOrId(saleorApiUrl, {
      ...body,
      provider: "paypal",
      method: "paypal",
    })
  );

  if (orderCrationError) {
    console.error(orderCrationError);
    Sentry.captureException(orderCrationError);
    return res.status(500).json({ message: `Error creating order for paypal` });
  }

  const [paypalOrderError, paypalOrder] = await unpackPromise(
    createPaypalOrder({ saleorApiUrl, order })
  );

  if (paypalOrderError) {
    console.error(paypalOrderError);
    Sentry.captureException(paypalOrderError);
    return res.status(500).json({ message: paypalOrderError.message });
  }

  return res.status(200).json({ data: paypalOrder });
};

export default allowCors(DropInPaypalOrdersHandler);
