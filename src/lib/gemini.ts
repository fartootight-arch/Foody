import { GoogleGenerativeAI } from "@google/generative-ai";

export const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const geminiModel = gemini.getGenerativeModel({
  model: "gemini-2.0-flash",
});
