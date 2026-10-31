import mongoose, { Schema, Document } from "mongoose";

export interface IProvider extends Document {
  name: string;
  phone: string;
  skills: string[];
  experience: number;
  availability: "available" | "busy" | "unavailable";
  rating: number;
  locality: string;
}

const ProviderSchema = new Schema<IProvider>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    skills: { type: [String], default: [] },
    experience: { type: Number, default: 0 },
    availability: {
      type: String,
      enum: ["available", "busy", "unavailable"],
      default: "available",
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    locality: { type: String, default: "Lucknow" },
  },
  { timestamps: true, strict: false }
);

export default mongoose.models.Provider ||
  mongoose.model<IProvider>("Provider", ProviderSchema);
