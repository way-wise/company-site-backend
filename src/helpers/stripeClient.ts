import Stripe from "stripe";
import config from "../config/config";

if (!config.stripe.secret_key) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

const stripe = new Stripe(config.stripe.secret_key, {
  apiVersion: "2025-10-29.clover",
  typescript: true,
});

export default stripe;

