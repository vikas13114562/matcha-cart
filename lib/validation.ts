import { z } from "zod";
import { CUP_SIZES, FLAVOURS, MAX_QUANTITY, MIN_QUANTITY } from "./pricing";

const flavourValues = FLAVOURS.map(({ value }) => value) as [
  (typeof FLAVOURS)[number]["value"],
  ...(typeof FLAVOURS)[number]["value"][],
];

export const orderSchema = z.object({
  customerName: z.string().trim().min(2, "Please enter your name").max(80),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  cupSize: z.enum(CUP_SIZES, { message: "Choose a cup size" }),
  flavour: z.enum(flavourValues, { message: "Choose a flavour" }),
  quantity: z.number().int().min(MIN_QUANTITY).max(MAX_QUANTITY),
  preferredTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a preferred time"),
});

export type OrderInput = z.infer<typeof orderSchema>;

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
