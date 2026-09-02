import { Schema, model, models } from "mongoose";

const orderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, default: undefined },
    cupSize: { type: String, required: true },
    flavour: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    preferredTime: { type: String, required: true },
  },
  { timestamps: true },
);

export const Order = models.Order || model("Order", orderSchema);
