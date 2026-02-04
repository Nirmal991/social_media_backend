import { Router } from "express";
import data from "./data.routes";
import advice from "./advice.routes";
import retoolApi from "./retoolApi.routes";

const $ = Router();

$.use(data);
$.use(advice);
$.use(retoolApi);

export default $;
