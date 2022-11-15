import express from "express";

import { securedRoute } from "#middlewares/auth";

const router = express.Router();

router.get("/", securedRoute, async (req, res) => {
  /**
   * #route   GET /admin/v1/admin
   * #desc    Get current admin user
   */
  return res.status(200).send(req.user);
});

export { router };
