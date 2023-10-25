import process from "process";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();
const _login = process.env.CYPRESSUSR;
const _pass = process.env.CYPRESSPW;
const outputPath = path.resolve("./tests/fixtures/_shack_li_.json");
const body = `get_fields%5B%5D=result&user-identifier=${_login}&supplied-pass=${_pass}&remember-login=0`;

const serializeCookie = (vals) => {
    return vals.map((h) => {
        const pair = h.split('; ');
        return pair.reduce((a, p) => {
            const [k, v] = p.split('=');
            a[k] = v;
            return a;
        }, {});
    });
};

fetch("https://www.shacknews.com/account/signin", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    body,
})
    .then((res) => {
        const setCookies = res.headers.getSetCookie();
        const outCookies = serializeCookie(setCookies);
        if (outCookies) {
            fs.writeFileSync(outputPath, JSON.stringify(outCookies));
            console.log("cookie written:", outputPath);
        } else throw Error("No cookie data received from server!");
    })
    .catch((e) => {
        if (e) throw e;
    });
