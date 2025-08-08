import express from "express";

import {
    getAllGrupUser,
    getGrupUserById,
    createGrupUser,
    updateGrupUser,
    deleteGrupUser
} from "../controllers/grup_user.controller.js";

const router = express.Router();

router.get("/", getAllGrupUser);
router.get("/:id", getGrupUserById);
router.post("/", createGrupUser);
router.put("/:id", updateGrupUser);
router.delete("/:id", deleteGrupUser);

export default router;