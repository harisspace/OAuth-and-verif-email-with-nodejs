import { google } from "googleapis";
import axios from "axios";

export default class GoogleOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirect: string;

  constructor() {
    this.clientId = process.env.CLIENT_ID!;
    this.clientSecret = process.env.CLIENT_SECRET!;
    this.redirect = process.env.OAUTH_REDIRECT!;
  }

  createConnection() {
    return new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirect
    );
  }

  getDefaultScope() {
    return [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];
  }

  getConnectionUrl(auth: any) {
    return auth.generateAuthUrl({
      access_type: "offline",
      prompt: "consent", // access type and approval prompt will force a new refresh token to be made each time signs in
      scope: this.getDefaultScope(),
    });
  }

  getAuth() {
    return this.createConnection();
  }

  urlGoogle() {
    const url = this.getConnectionUrl(this.getAuth());
    return url;
  }

  async getAccessTokenFromCode(code: any): Promise<string> {
    const { data } = await axios({
      url: `https://oauth2.googleapis.com/token`,
      method: "post",
      data: {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: process.env.OAUTH_REDIRECT,
        grant_type: "authorization_code",
        code,
      },
    });
    console.log(data); // { access_token, expires_in, token_type, refresh_token }
    return data.access_token;
  }

  async getGoogleUserInfo(access_token: string) {
    const { data } = await axios({
      url: "https://www.googleapis.com/oauth2/v2/userinfo",
      method: "get",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    console.log(data); // { id, email, given_name, family_name }
    return data;
  }
}
