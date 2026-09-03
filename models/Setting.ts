import { Schema, model, models } from "mongoose";

const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    reopensAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Setting = models.Setting || model("Setting", settingSchema);
