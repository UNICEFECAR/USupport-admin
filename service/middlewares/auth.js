import passport from "passport";
import passportLocal from "passport-local";
import passportJWT from "passport-jwt";
import bcrypt from "bcryptjs";

import {
  getAdminUserByEmail,
  getAdminUserByID,
  createAdminUser,
} from "#queries/admins";

import { adminLoginSchema, createAdminSchema } from "#schemas/authSchemas";

import {
  emailUsed,
  incorrectEmail,
  incorrectPassword,
  notAuthenticated,
} from "#utils/errors";

const localStrategy = passportLocal.Strategy;
const jwtStrategy = passportJWT.Strategy;
const extractJWT = passportJWT.ExtractJwt;

const JWT_KEY = process.env.JWT_KEY;

passport.use(
  "signup",
  new localStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, emailIn, passwordIn, done) => {
      try {
        const language = req.header("x-language-alpha-2");
        const country = req.header("x-country-alpha-2");
        const {
          email,
          password,
          adminCountryId,
          name,
          surname,
          phonePrefix,
          phone,
          role,
        } = await createAdminSchema(language)
          .noUnknown(true)
          .strict()
          .validate({
            ...req.body,
            email: emailIn,
            password: passwordIn,
          })
          .catch((err) => {
            throw err;
          });

        const currentAdmin = await getAdminUserByEmail(country, email)
          .then((res) => res.rows[0])
          .catch((err) => {
            throw err;
          });

        if (currentAdmin && currentAdmin.email) {
          return done(emailUsed(language));
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPass = await bcrypt.hash(password, salt);

        let newAdmin = await createAdminUser({
          poolCountry: country,
          adminCountryId,
          hashedPass,
          name,
          surname,
          phonePrefix,
          phone,
          email,
          role,
        })
          .then(async (res) => res.rows[0])
          .catch((err) => {
            throw err;
          });

        return done(null, newAdmin);
      } catch (error) {
        done(error);
      }
    }
  )
);

passport.use(
  "login",
  new localStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, emailIn, passwordIn, done) => {
      try {
        const language = req.header("x-language-alpha-2");
        const country = req.header("x-country-alpha-2");
        const { email, password } = await adminLoginSchema(language)
          .noUnknown(true)
          .strict()
          .validate({
            password: passwordIn,
            email: emailIn,
          })
          .catch((err) => {
            throw err;
          });

        const adminUser = await getAdminUserByEmail(country, email)
          .then((res) => res.rows[0])
          .catch((err) => {
            throw err;
          });

        if (!adminUser) {
          return done(incorrectEmail(language));
        }

        const validatePassword = await bcrypt.compare(
          password,
          adminUser.password
        );

        if (!validatePassword) {
          return done(incorrectPassword(language));
        }

        return done(null, adminUser);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  "jwt",
  new jwtStrategy(
    {
      jwtFromRequest: extractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_KEY,
      issuer: "online.usupport.adminApi",
      audience: "online.usupport.app",
      algorithms: ["HS256"],
      passReqToCallback: true,
    },
    async (req, jwt_payload, done) => {
      try {
        const country = req.header("x-country-alpha-2");
        const admin_id = jwt_payload.sub;
        const admin = await getAdminUserByID(country, admin_id)
          .then((res) => res.rows[0])
          .catch((err) => {
            throw err;
          });

        if (!admin) {
          done(null, false);
        }

        done(null, admin);
      } catch (error) {
        done(error);
      }
    }
  )
);

export const authenticateJWT = (isMiddleWare, req, res, next) => {
  passport.authenticate("jwt", { session: false }, async (err, admin) => {
    const language = req.header("x-language-alpha-2");

    if (err || !admin) {
      return next(notAuthenticated(language));
    }
    req.user = admin;

    if (isMiddleWare) return next();
    else {
      return res.status(200).send(admin);
    }
  })(req, res, next);
};

export const securedRoute = (req, res, next) => {
  return authenticateJWT(true, req, res, next);
};
