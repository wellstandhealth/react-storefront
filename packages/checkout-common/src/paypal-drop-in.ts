import * as yup from "yup";

export const postDropInPaypalOrdersBody = yup
  .object({
    checkoutId: yup.string().required(),
    redirectUrl: yup.string().required(),
    totalAmount: yup.number().required(),
  })
  .required();
export type PostDropInPaypalOrdersBody = yup.InferType<typeof postDropInPaypalOrdersBody>;

export const postDropInPaypalOrdersCaptureBody = yup.object({}).required();
export type PostDropInPaypalOrdersCaptureBody = yup.InferType<
  typeof postDropInPaypalOrdersCaptureBody
>;

export type PostDropInPaypalOrdersResponse = { data: PaypalOrderResponse };
export type PostDropInPaypalOrdersCaptureResponse = { data: PaypalOrderCaptureResponse };

export interface PaypalOrderResponse {
  id: string;
  status: string;
  payment_source: {
    paypal: {};
  };
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PaypalOrderCaptureResponse {
  id: string;
  status: string;
  payment_source: {
    paypal: {
      name: {
        given_name: string;
        surname: string;
      };
      email_address: string;
      account_id: string;
    };
  };
  purchase_units: Array<{
    reference_id: string;
    shipping: {
      address: {
        address_line_1: string;
        address_line_2: string;
        admin_area_2: string;
        admin_area_1: string;
        postal_code: string;
        country_code: string;
      };
    };
    payments: {
      captures: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
        seller_protection: {
          status: string;
          dispute_categories: string[];
        };
        final_capture: boolean;
        disbursement_mode: string;
        seller_receivable_breakdown: {
          gross_amount: {
            currency_code: string;
            value: string;
          };
          paypal_fee: {
            currency_code: string;
            value: string;
          };
          net_amount: {
            currency_code: string;
            value: string;
          };
        };
        create_time: Date;
        update_time: Date;
        links: Array<{
          href: string;
          rel: string;
          method: string;
        }>;
      }>;
    };
  }>;
  payer: {
    name: {
      given_name: string;
      surname: string;
    };
    email_address: string;
    payer_id: string;
  };
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}
