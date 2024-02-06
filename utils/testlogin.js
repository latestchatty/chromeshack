import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import process from "process";

dotenv.config();
const _login = process.env.TESTUSR;
const _pass = process.env.TESTPW;
const outputPath = path.resolve("./.env");
const body = `get_fields%5B%5D=result&user-identifier=${_login}&supplied-pass=${_pass}&remember-login=0`;

const serializeCookie = (vals) => {
  return vals.map((h) => {
    const pair = h.split("; ");
    return pair.reduce((a, p) => {
      const [k, v] = p.split("=");
      a[k] = v;
      return a;
    }, {});
  });
};

fetch("https://www.shacknews.com/account/signin", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  },
  body,
})
  .then((res) => {
    const setCookies = res.headers.getSetCookie();
    const outCookies = serializeCookie(setCookies);
    if (outCookies) {
      // overwrite the contents of the file "./.env" under the key "E2E_SHACKLI" with cookie data
      fs.writeFileSync(outputPath, `E2E_SHACKLI=${JSON.stringify(outCookies)}`);
      console.log("cookie written in .env format to:", outputPath);
    } else throw Error("No cookie data received from server!");
  })
  .catch((e) => {
    if (e) throw e;
  });
