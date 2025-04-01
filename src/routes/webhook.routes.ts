import { Router } from "express";
import { prisma } from "../utils/prismaclient.js";

const WebhookRouter = Router();

WebhookRouter.post("/", async (req, res) => {
  console.log("Webhook received");
  console.log(req.body);

  const order = await prisma.order.findUnique({
    where: {
      id: req.body.order_id,
    },
  });

  console.log(order);

  if ( !order ) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if ( !order.awb ) {
    prisma.order.update({
      where: {
        id: req.body.order_id,
      },
      data: {
        awb: req.body.awb,
      },
    });
  }

  prisma.order.update({
    where: {
      id: req.body.order_id,
    },
    data: {
      status: req.body.current_status,
    },
  });


  res.status(200).json({ success: true });
});
export default WebhookRouter;