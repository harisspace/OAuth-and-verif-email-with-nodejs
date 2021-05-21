import { NextFunction, Request, Response, Router } from "express";
import { Client } from "pg";
import * as nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import OAuthGoogle from "../utils/OAuth/Google";

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: parseInt(process.env.DB_PORT!),
});

const router = Router();

interface Register {
  username: string;
  email: string;
  password: string;
}

interface Login {
  email: string;
  password: string;
}

interface User {
  username: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
  id: string | number;
  isconfirmed: boolean;
}

// router

router.get("/register", (req: Request, res: Response, next: NextFunction) => {
  const google = new OAuthGoogle();
  const url = google.urlGoogle();
  console.log(url); // you can get url google from this console

  res.json("kamu sedang register");
});

router.get("/dashboard", async (req: Request, res: Response) => {
  const { code } = req.query;

  const google = new OAuthGoogle();

  const accessToken = await google.getAccessTokenFromCode(code);
  const data = await google.getGoogleUserInfo(accessToken);
  console.log(data); // data user account e.g (name, email, familyname, id, local)

  return res.json("welcome to dashboard");
});

router.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password }: Register = req.body;
    if (!username || !email || !password) {
      return res.json({
        error: "username, email and password must be provided",
      });
    }
    client.connect();
    const queryInsert =
      "INSERT INTO users(username, email, password) VALUES ($1,$2,$3) RETURNING *";
    const value = [username, email, password];

    // validation

    // create token
    const token = jwt.sign(username, "secret");
    console.log(token);

    // send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: "hariscoba@gmail.com",
      to: email,
      subject: "Verification signin",
      html: `<b>please click this <a href="http://localhost:4000/auth/confirmation/${token}">link</a> to activation account</b>`,
    });

    // insert to db
    try {
      const data = await client.query(queryInsert, value);
      client.end();
      console.log(data);
      if (data) {
        return res.json({ username, email, password });
      }
    } catch (err) {
      return next(err);
    }
  }
);

router.get("/login", (req: Request, res: Response) => {
  return res.json("login");
});

router.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: Login = req.body;
    console.log(email, password);

    // find username and match password
    let exactPass: string;
    client.connect();
    const result = await client.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    let user: User = result.rows[0];
    exactPass = user.password;
    client.end();

    if (password !== exactPass) {
      return res.status(400).json({ error: "bad user input" });
    }

    if (user.isconfirmed === false) {
      return res
        .status(401)
        .json({ error: "please confirm your account in your email" });
    }

    return res.status(200).json("post login");
  }
);

export default router;
