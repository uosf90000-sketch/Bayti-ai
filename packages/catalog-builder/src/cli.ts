#!/usr/bin/env node
import {build} from "./pipeline.js";
const arg=(n:string,d:string)=>{const i=process.argv.indexOf(`--${n}`); return i>=0?process.argv[i+1]:d};
build(arg("input",process.env.CATALOG_INPUT_DIR??"./input"),arg("output",process.env.CATALOG_OUTPUT_DIR??"./output")).then(r=>{console.log(`Canonical products: ${r.report.canonicalProducts}`);console.log(`Merchant offers: ${r.report.merchantOffers}`)}).catch(e=>{console.error(e);process.exit(1)});
