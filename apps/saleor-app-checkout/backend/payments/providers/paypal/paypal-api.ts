import { getPrivateSettings } from "@/saleor-app-checkout/backend/configuration/settings";
import { MissingPaymentProviderSettingsError } from "../../errors";
import invariant from "ts-invariant";
import {
  PaypalOrderResponse,
  PaypalOrderCaptureResponse,
} from "@/saleor-app-checkout/../../packages/checkout-common/dist";
import { OrderFragment } from "@/saleor-app-checkout/graphql";

const base = "https://api-m.sandbox.paypal.com";

export const getPayPalSecrets = async (saleorApiUrl: string) => {
  const {
    paymentProviders: { paypal },
  } = await getPrivateSettings({ saleorApiUrl, obfuscateEncryptedData: false });

  const missingKeys = [!paypal.clientId && "clientId", !paypal.appSecret && "appSecret"].filter(
    (x): x is string => typeof x === "string"
  );
  if (missingKeys.length > 0) {
    throw new MissingPaymentProviderSettingsError("paypal", missingKeys);
  }

  // redundant check for TypeScript
  invariant(paypal.clientId, "clientId not defined");
  invariant(paypal.appSecret, "appSecret not defined");

  return {
    clientId: paypal.clientId,
    appSecret: paypal.appSecret,
  };
};

// https://github.com/paypal-examples/docs-examples/blob/main/standard-integration/paypal-api.js

export async function createPaypalOrder({
  saleorApiUrl,
  order,
}: {
  saleorApiUrl: string;
  order: OrderFragment;
}): Promise<PaypalOrderResponse> {
  const accessToken = await generateAccessToken({ saleorApiUrl });
  const url = `${base}/v2/checkout/orders`;
  const response = await fetch(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: order.total.gross.currency,
            value: order.total.gross.amount.toString(),
          },
        },
      ],
    }),
  });

  return handleResponse(response);
}

export async function capturePayment({
  saleorApiUrl,
  orderId,
}: {
  saleorApiUrl: string;
  orderId: string;
}): Promise<PaypalOrderCaptureResponse> {
  const accessToken = await generateAccessToken({ saleorApiUrl });
  const url = `${base}/v2/checkout/orders/${orderId}/capture`;
  const response = await fetch(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return handleResponse(response);
}

export async function generateAccessToken({ saleorApiUrl }: { saleorApiUrl: string }) {
  const { clientId, appSecret } = await getPayPalSecrets(saleorApiUrl);
  const auth = Buffer.from(`${clientId}:${appSecret}`).toString("base64");
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "post",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  const jsonData = await handleResponse(response);
  return jsonData.access_token as string;
}

async function handleResponse(response: Response) {
  if (response.status === 200 || response.status === 201) {
    return response.json();
  }

  const errorMessage = await response.text();
  throw new Error(errorMessage);
}
