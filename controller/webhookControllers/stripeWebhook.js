import stripe from "../../config/stripe.js";
import Payment from "../../model/payment.model.js";

export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.metadata.paymentId) {
          const payment = await Payment.findByPk(session.metadata.paymentId);
          if (payment) {
            payment.status = "success"; 
            payment.paidAt = new Date();
            payment.stripeSubscriptionId = session.subscription;
            await payment.save();
          }
        }
        // ✅ Mark payment successful
        // await Payment.update(
        //   { status: "succeeded", paidAt: new Date() },
        //   { where: { stripePaymentId: session.id } }
        // );
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const payment = await Payment.findOne({ where: { stripeSubscriptionId: invoice.subscription }, });
        if (payment) {
          payment.status = "success";
          payment.paidAt = new Date();
          await payment.save();
        }
        break;
      }

      case "invoice.finalized": {
        const invoice = event.data.object;
        const payment = await Payment.findOne({ where: { stripeSubscriptionId: invoice.subscription }, });
        if (payment) {
          payment.status = "success";
          payment.paidAt = new Date();
          await payment.save();
        }
        break;
      }

      case "invoice.sent": {
        const invoice = event.data.object;
        const payment = await Payment.findOne({ where: { stripeSubscriptionId: invoice.subscription },  });
        if (payment) {
          payment.status = "success";
          payment.paidAt = new Date();
          await payment.save();
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const payment = await Payment.findOne({
          where: { stripeSubscriptionId: invoice.subscription },
        });
        if (payment) {
          payment.status = "failed";
          await payment.save();
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const payment = await Payment.findOne({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (payment) {
          payment.status = "canceled";
          await payment.save();
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.log("Webhook Handler Error:", error.message);
    res.status(500).send("Webhook handler failed");
  }
};
