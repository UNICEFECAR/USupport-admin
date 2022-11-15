import express from "express";
import helmet from "helmet";
import dotenv from "dotenv";
import passport from "passport";

import v1 from "#routes/index";
import middleware from "#middlewares/index";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;

/*------------- Security Config -------------*/

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());
app.use(passport.initialize());

/*------------- Admin Service Endpoints -------------*/

app.use("/admin/v1/country", v1.CountryRouter);
app.use("/admin/v1/auth", v1.AuthRouter);
app.use("/admin/v1/admin", v1.AdminRouter);

/*------------- Error middleware -------------*/

app.use(middleware.errorMiddleware.notFound);
app.use(middleware.errorMiddleware.errorHandler);

app.listen(PORT, () => {
  console.log(`Admin Server listening on port ${PORT}`);
});
