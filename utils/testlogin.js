/* eslint-disable */
const process = require("process");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const _login = process.env.CYPRESSUSR;
const _pass = process.env.CYPRESSPW;
const outputPath = path.resolve(__dirname, "../cypress/fixtures/_shack_li_.txt");
const body = `get_fields%5B%5D=result&user-identifier=${_login}&supplied-pass=${_pass}&remember-login=0`;

const cookiePromise = axios
    .post("https://www.shacknews.com/account/signin", body, {
        headers: { contentType: "application/x-www-form-urlencoded; charset=UTF-8" },
    })
    .then((res) => {
        const cookies = JSON.stringify(res.headers["set-cookie"]);
        const _rgx = /(_shack_li_)=(.+?); /gim.exec(cookies);
        const data = _rgx && _rgx[2];
        if (data) {
            console.log("got cookie:", data);
            fs.writeFileSync(outputPath, data);
            console.log("cookie written:", outputPath);
            return data;
        } else throw Error("No cookie data received from server!");
    })
    .catch((e) => {
        if (e) throw e;
    });
