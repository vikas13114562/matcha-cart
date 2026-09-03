import { z } from "zod";
import { CUP_SIZES, FLAVOURS, MAX_QUANTITY, MIN_QUANTITY } from "./pricing";
import { addresses } from "./addresses";

const flavourValues = FLAVOURS.map(({ value }) => value) as [
  (typeof FLAVOURS)[number]["value"],
  ...(typeof FLAVOURS)[number]["value"][],
];

export const orderSchema = z.object({
  customerName: z.string().trim().min(2, "Please enter your name").max(80),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian WhatsApp number"),
  society: z.string().trim().min(1, "Select your society"),
  tower: z.string().trim().min(1, "Select your tower"),
  flatNumber: z.string().trim().min(1, "Enter your floor and flat no.").max(30, "Floor and flat no. must be 30 characters or fewer"),
  cupSize: z.enum(CUP_SIZES, { message: "Choose a cup size" }),
  flavour: z.enum(flavourValues, { message: "Choose a flavour" }),
  quantity: z.number().int().min(MIN_QUANTITY).max(MAX_QUANTITY),
  preferredTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Select your preferred time."),
}).superRefine((input, context) => {
  const location = addresses.find(item => item.society === input.society);
  if (input.society && !location) {
    context.addIssue({ code: "custom", path: ["society"], message: "Select a society we serve" });
  }
  if (input.tower && location && !location.Towers.includes(input.tower)) {
    context.addIssue({ code: "custom", path: ["tower"], message: "Select a tower in your society" });
  }
});

export type OrderInput = z.infer<typeof orderSchema>;

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
