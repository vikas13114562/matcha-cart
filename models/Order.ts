import { Schema, model, models } from "mongoose";

const orderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    society: { type: String, required: true },
    tower: { type: String, required: true },
    flatNumber: { type: String, required: true },
    items: [{ flavour: { type: String, required: true }, cupSize: { type: String, required: true }, quantity: { type: Number, required: true }, unitPrice: { type: Number, required: true }, lineTotal: { type: Number, required: true } }],
    totalPrice: { type: Number, required: true },
    preferredDateTime: { type: Date, default: undefined },
    deliveryAt: { type: Date, default: undefined },
  },
  { timestamps: true },
);

export const Order = models.Order || model("Order", orderSchema);
