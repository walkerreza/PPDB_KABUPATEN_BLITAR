import express from "express";

import {
    getAllProvinsi,
    getProvinsiById,
    getProvinsiByNama
} from "../controllers/provinsi.controller.js";

const router = express.Router();

router.get("/", getAllProvinsi);
router.get("/:id", getProvinsiById);
router.post("/nama", getProvinsiByNama);

export default router;