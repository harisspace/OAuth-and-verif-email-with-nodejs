import express, { NextFunction, Request, Response } from "express";
import * as dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";

dotenv.config();

const app = express();

// settings middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes);

app.use(function (req, res) {
  return res.status(404).json({ error: "Page not found" });
});

app.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
  console.log("error bro", err.stack);
  return res.status(404).json({ error: err.message });
});

app.listen(process.env.PORT, () => {
  console.log("running on port " + process.env.PORT);
});

process.on("uncaughtException", () => {
  console.log("error");
  process.exit(1);
});

process.on("unhandledRejection", () => {
  console.log("unhandle");
  process.exit(1);
});
