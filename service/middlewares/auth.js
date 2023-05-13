import passport from "passport";
import passportLocal from "passport-local";
import passportJWT from "passport-jwt";
import bcrypt from "bcryptjs";

import {
  getAdminUserByEmail,
  getAdminUserByID,
  createAdminUser,
  createAdminToCountryLink,
  createAdminToRegionLink,
} from "#queries/admins";

import {
  getAuthOTP,
  getAdminLastAuthOTP,
  storeAuthOTP,
  changeOTPToUsed,
} from "#queries/authOTP";

import {
  adminLoginSchema,
  createAdminSchema,
  admin2FARequestSchema,
} from "#schemas/authSchemas";

import {
  emailUsed,
  incorrectEmail,
  incorrectPassword,
  notAuthenticated,
  accountDeactivated,
  invalidOTP,
  tooManyOTPRequests,
} from "#utils/errors";
import { produceRaiseNotification } from "#utils/kafkaProducers";
import { generate4DigitCode } from "#utils/helperFunctions";

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
        const {
          email,
          password,
          adminCountryId,
          adminRegionId,
          name,
          surname,
          phone,
          role,
          isActive,
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

        const currentAdmin = await getAdminUserByEmail(email, role)
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
          adminCountryId,
          adminRegionId,
          hashedPass,
          name,
          surname,
          phone,
          email,
          role,
          isActive,
        })
          .then(async (res) => {
            const admin = res.rows[0];

            if (role === "country") {
              await createAdminToCountryLink({
                countryId: adminCountryId,
                adminId: res.rows[0].admin_id,
              });
            } else if (role === "regional") {
              await createAdminToRegionLink({
                regionId: adminRegionId,
                adminId: res.rows[0].admin_id,
              });
            }

            return admin;
          })
          .catch((err) => {
            throw err;
          });

        delete newAdmin.password;

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

        const role = req.body.role;
        const otp = req.body.otp;

        const { email, password } = await adminLoginSchema
          .noUnknown(true)
          .strict()
          .validate({
            password: passwordIn,
            email: emailIn,
            role,
            otp,
          })
          .catch((err) => {
            throw err;
          });

        const adminUser = await getAdminUserByEmail(email, role)
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

        if (!adminUser.is_active) {
          return done(accountDeactivated(language));
        }

        return done(null, adminUser);

        const adminOTP = await getAuthOTP(otp, adminUser.admin_id).then(
          (data) => data.rows[0]
        );

        if (adminOTP === undefined) {
          // OTP not found or already used
          return done(invalidOTP(language));
        } else {
          const OTPCreatedAt = new Date(adminOTP.created_at).getTime();
          const now = new Date().getTime();

          if ((OTPCreatedAt - now) / 1000 > 60 * 30) {
            // OTP is valid for 30 mins
            return done(invalidOTP(language));
          }
        }

        // each OTP can be used only once
        await changeOTPToUsed(adminOTP.id).catch((err) => {
          throw err;
        });

        delete adminUser.password;

        return done(null, adminUser);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  "2fa-request",
  new localStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, emailIn, passwordIn, done) => {
      try {
        const language = req.header("x-language-alpha-2");
        const role = req.body.role;

        const { email, password } = await admin2FARequestSchema
          .noUnknown(true)
          .strict()
          .validate({ ...req.body, email: emailIn, password: passwordIn })
          .catch((err) => {
            throw err;
          });

        const adminUser = await getAdminUserByEmail(email, role)
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

        if (!adminUser.is_active) {
          return done(accountDeactivated(language));
        }

        const adminLastOTP = await getAdminLastAuthOTP(adminUser.admin_id)
          .then((data) => data.rows[0])
          .catch((err) => {
            throw err;
          });

        if (adminLastOTP !== undefined) {
          const lastOTPTime = new Date(adminLastOTP.created_at).getTime();
          const now = new Date().getTime();

          if ((now - lastOTPTime) / 1000 < 60) {
            // Admins can request one OTP every 60 seconds
            throw tooManyOTPRequests();
          } else {
            // invalidate last OTP generated before generating a new one
            await changeOTPToUsed(adminLastOTP.id).catch((err) => {
              throw err;
            });
          }
        }

        const otp = generate4DigitCode();
        await storeAuthOTP(adminUser.admin_id, otp).catch((err) => {
          throw err;
        });

        produceRaiseNotification({
          channels: ["email"],
          emailArgs: {
            emailType: "login-2fa-request",
            recipientEmail: email,
            data: { otp },
          },
          language,
        }).catch(console.log);

        return done(null, { success: true });
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
        const admin_id = jwt_payload.sub;
        const admin = await getAdminUserByID(admin_id)
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
