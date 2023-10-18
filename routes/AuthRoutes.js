import express from "express";

import { checkBody } from "../utils/helpers.js";

import {
  checkUser,
  generateToken,
  getAllUsers,
  onBoardUser,
} from "../controllers/AuthController.js";

const router = express.Router();

router.post("/check-user", checkBody(["email"]), checkUser);
router.post(
  "/onboard-user",
  checkBody(["email", "name", "about", "profileImage"]),
  onBoardUser
);
router.get("/get-contacts", getAllUsers);
router.get("/generate-token/:userId", generateToken);

export default router;
