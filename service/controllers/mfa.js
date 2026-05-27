import bcrypt from "bcryptjs";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

import { issueAccessToken, issueRefreshToken } from "#controllers/auth";

import { getAdminUserByID } from "#queries/admins";
import {
  changeOTPToUsed,
  getAdminLastAuthOTP,
  getAuthOTP,
  storeAuthOTP,
} from "#queries/authOTP";
import {
  countPasskeysByAdminIdQuery,
  deletePasskeyChallengeQuery,
  deletePasskeyQuery,
  getPasskeyByCredentialIdQuery,
  getPasskeyByIdQuery,
  getPasskeyChallengeQuery,
  listPasskeysByAdminIdQuery,
  savePasskeyQuery,
  setAdminMfaEnabledQuery,
  storePasskeyChallengeQuery,
  updatePasskeyCounterQuery,
} from "#queries/mfa";

import {
  incorrectPassword,
  invalidOTP,
  mfaNotEnabled,
  notAuthenticated,
  passkeyNotFound,
  passkeyVerificationFailed,
  tooManyOTPRequests,
} from "#utils/errors";
import { generate4DigitCode } from "#utils/helperFunctions";
import { produceRaiseNotification } from "#utils/kafkaProducers";
import {
  completeMfaSession,
  getValidMfaSession,
} from "#utils/mfaSession";

const MFA_METHODS = ["passkey", "email"];
const CHALLENGE_TYPES = {
  REGISTRATION: "registration",
  AUTHENTICATION: "authentication",
};
const CHALLENGE_TTL_MINUTES = 5;

const parseWebAuthnOrigins = () => {
  const raw = process.env.WEBAUTHN_ORIGINS;
  if (!raw) {
    return [
      "https://usupport.online",
      "https://staging.usupport.online",
      "http://localhost:5174",
      "http://localhost:5175",
    ];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return raw.split(",").map((origin) => origin.trim());
  }

  return ["https://usupport.online"];
};

const WEBAUTHN_RP_ID = process.env.WEBAUTHN_RP_ID || "usupport.online";
const WEBAUTHN_RP_NAME = process.env.WEBAUTHN_RP_NAME || "uSupport Admin";
const WEBAUTHN_ORIGINS = parseWebAuthnOrigins();

const toUint8Array = (value) => {
  if (value instanceof Uint8Array) {
    return value;
  }
  return new Uint8Array(value);
};

const decodeClientDataChallenge = (clientDataJSON) => {
  const clientData = JSON.parse(
    Buffer.from(clientDataJSON, "base64url").toString("utf8")
  );
  return clientData.challenge;
};

const completeLogin = async (adminUser) => {
  delete adminUser.password;

  const accessToken = await issueAccessToken({
    admin_id: adminUser.admin_id,
    adminRole: adminUser.role,
  });
  const refreshToken = await issueRefreshToken({
    admin_id: adminUser.admin_id,
  });

  return {
    admin: adminUser,
    token: { ...accessToken, refreshToken },
  };
};

export const getAvailableMethods = async (adminId) => {
  const passkeys = await listPasskeysByAdminIdQuery(adminId).then(
    (res) => res.rows
  );

  const methods = [MFA_METHODS[1]];

  if (passkeys.length > 0) {
    methods.unshift(MFA_METHODS[0]);
  }

  return methods;
};

export const getMfaSettings = async ({ adminId, adminRole, language }) => {
  if (adminRole !== "country") {
    throw notAuthenticated(language);
  }

  const adminUser = await getAdminUserByID(adminId).then((res) => res.rows[0]);
  const passkeyCount = await countPasskeysByAdminIdQuery(adminId).then(
    (res) => res.rows[0].count
  );

  return {
    mfaEnabled: Boolean(adminUser?.mfa_enabled),
    passkeyCount,
    passkeySupported: true,
  };
};

export const updateMfaSettings = async ({
  adminId,
  adminRole,
  enabled,
  password,
  language,
}) => {
  if (adminRole !== "country") {
    throw notAuthenticated(language);
  }

  const adminUser = await getAdminUserByID(adminId).then((res) => res.rows[0]);
  const isValidPassword = await bcrypt.compare(password, adminUser.password);

  if (!isValidPassword) {
    throw incorrectPassword(language);
  }

  await setAdminMfaEnabledQuery({ adminId, enabled });

  return { mfaEnabled: enabled };
};

export const requestEmailOtpForSession = async ({
  mfaSessionId,
  language,
}) => {
  const session = await getValidMfaSession({ mfaSessionId, language });
  const adminUser = await getAdminUserByID(session.admin_id).then(
    (res) => res.rows[0]
  );

  const adminLastOTP = await getAdminLastAuthOTP(adminUser.admin_id).then(
    (data) => data.rows[0]
  );

  if (adminLastOTP !== undefined) {
    const lastOTPTime = new Date(adminLastOTP.created_at).getTime();
    const now = Date.now();

    if ((now - lastOTPTime) / 1000 < 60) {
      throw tooManyOTPRequests();
    }

    await changeOTPToUsed(adminLastOTP.id);
  }

  const otp = generate4DigitCode();
  await storeAuthOTP(adminUser.admin_id, otp);

  produceRaiseNotification({
    channels: ["email"],
    emailArgs: {
      emailType: "login-2fa-request",
      recipientEmail: adminUser.email,
      data: { otp },
    },
    language,
  }).catch(console.log);

  return { success: true };
};

export const verifyEmailOtpForSession = async ({
  mfaSessionId,
  otp,
  language,
}) => {
  const session = await getValidMfaSession({ mfaSessionId, language });
  const adminUser = await getAdminUserByID(session.admin_id).then(
    (res) => res.rows[0]
  );

  const adminOTP = await getAuthOTP(otp, adminUser.admin_id).then(
    (data) => data.rows[0]
  );

  if (adminOTP === undefined) {
    throw invalidOTP(language);
  }

  const otpCreatedAt = new Date(adminOTP.created_at).getTime();
  const now = Date.now();

  if ((now - otpCreatedAt) / 1000 > 60 * 30) {
    throw invalidOTP(language);
  }

  await changeOTPToUsed(adminOTP.id);
  await completeMfaSession({ mfaSessionId, language });

  return completeLogin(adminUser);
};

export const generatePasskeyRegistrationOptions = async ({ adminId }) => {
  const adminUser = await getAdminUserByID(adminId).then((res) => res.rows[0]);

  if (!adminUser?.mfa_enabled) {
    throw mfaNotEnabled("en");
  }

  const existingPasskeys = await listPasskeysByAdminIdQuery(adminId).then(
    (res) => res.rows
  );

  const options = await generateRegistrationOptions({
    rpName: WEBAUTHN_RP_NAME,
    rpID: WEBAUTHN_RP_ID,
    userName: adminUser.email,
    userID: Buffer.from(adminUser.admin_id.replace(/-/g, ""), "hex"),
    userDisplayName: `${adminUser.name} ${adminUser.surname}`.trim(),
    attestationType: "none",
    excludeCredentials: existingPasskeys.map((passkey) => ({
      id: passkey.credential_id,
      type: "public-key",
    })),
    authenticatorSelection: {
      residentKey: "discouraged",
      userVerification: "required",
    },
  });

  await storePasskeyChallengeQuery({
    adminId,
    challenge: options.challenge,
    type: CHALLENGE_TYPES.REGISTRATION,
    ttlMinutes: CHALLENGE_TTL_MINUTES,
  });

  return options;
};

export const verifyPasskeyRegistration = async ({
  adminId,
  response,
  friendlyName,
  language,
}) => {
  const adminUser = await getAdminUserByID(adminId).then((res) => res.rows[0]);

  if (!adminUser?.mfa_enabled) {
    throw mfaNotEnabled(language);
  }

  const challenge = decodeClientDataChallenge(response.response.clientDataJSON);
  const challengeRow = await getPasskeyChallengeQuery({
    adminId,
    challenge,
    type: CHALLENGE_TYPES.REGISTRATION,
  }).then((res) => res.rows[0]);

  if (!challengeRow) {
    throw passkeyVerificationFailed(language);
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: WEBAUTHN_ORIGINS,
      expectedRPID: WEBAUTHN_RP_ID,
      requireUserVerification: true,
    });
  } catch (error) {
    console.log("Passkey registration verification failed", error);
    throw passkeyVerificationFailed(language);
  }

  if (!verification.verified || !verification.registrationInfo) {
    throw passkeyVerificationFailed(language);
  }

  const { credential } = verification.registrationInfo;

  await savePasskeyQuery({
    adminId,
    credentialId: credential.id,
    publicKey: Buffer.from(credential.publicKey),
    counter: credential.counter,
    name: friendlyName || null,
  });

  await deletePasskeyChallengeQuery(challengeRow.passkey_challenge_id);

  return { success: true };
};

export const generatePasskeyAuthenticationOptions = async ({
  mfaSessionId,
  language,
}) => {
  const session = await getValidMfaSession({ mfaSessionId, language });
  const passkeys = await listPasskeysByAdminIdQuery(session.admin_id).then(
    (res) => res.rows
  );

  if (passkeys.length === 0) {
    throw passkeyNotFound(language);
  }

  const options = await generateAuthenticationOptions({
    rpID: WEBAUTHN_RP_ID,
    userVerification: "required",
    allowCredentials: passkeys.map((passkey) => ({
      id: passkey.credential_id,
      type: "public-key",
    })),
  });

  await storePasskeyChallengeQuery({
    adminId: session.admin_id,
    mfaSessionId,
    challenge: options.challenge,
    type: CHALLENGE_TYPES.AUTHENTICATION,
    ttlMinutes: CHALLENGE_TTL_MINUTES,
  });

  return options;
};

export const verifyPasskeyAuthentication = async ({
  mfaSessionId,
  response,
  language,
}) => {
  const session = await getValidMfaSession({ mfaSessionId, language });
  const storedPasskey = await getPasskeyByCredentialIdQuery(response.id).then(
    (res) => res.rows[0]
  );

  if (!storedPasskey || storedPasskey.admin_id !== session.admin_id) {
    throw passkeyNotFound(language);
  }

  const challenge = decodeClientDataChallenge(response.response.clientDataJSON);
  const challengeRow = await getPasskeyChallengeQuery({
    adminId: session.admin_id,
    mfaSessionId,
    type: CHALLENGE_TYPES.AUTHENTICATION,
    challenge,
  }).then((res) => res.rows[0]);

  if (!challengeRow) {
    throw passkeyVerificationFailed(language);
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: WEBAUTHN_ORIGINS,
      expectedRPID: WEBAUTHN_RP_ID,
      requireUserVerification: true,
      credential: {
        id: storedPasskey.credential_id,
        publicKey: toUint8Array(storedPasskey.public_key),
        counter: Number(storedPasskey.counter),
      },
    });
  } catch (error) {
    console.log("Passkey authentication verification failed", error);
    throw passkeyVerificationFailed(language);
  }

  if (!verification.verified) {
    throw passkeyVerificationFailed(language);
  }

  const { newCounter } = verification.authenticationInfo;

  if (newCounter > 0 && newCounter <= Number(storedPasskey.counter)) {
    throw passkeyVerificationFailed(language);
  }

  await updatePasskeyCounterQuery({
    passkeyId: storedPasskey.passkey_id,
    counter: Math.max(Number(storedPasskey.counter), newCounter),
  });
  await deletePasskeyChallengeQuery(challengeRow.passkey_challenge_id);
  await completeMfaSession({ mfaSessionId, language });

  const adminUser = await getAdminUserByID(session.admin_id).then(
    (res) => res.rows[0]
  );

  return completeLogin(adminUser);
};

export const listPasskeys = async (adminId) => {
  const passkeys = await listPasskeysByAdminIdQuery(adminId).then(
    (res) => res.rows
  );

  return passkeys.map(({ passkey_id, name, created_at, last_used_at }) => ({
    passkeyId: passkey_id,
    name,
    createdAt: created_at,
    lastUsedAt: last_used_at,
  }));
};

export const deletePasskey = async ({ adminId, passkeyId, language }) => {
  const passkey = await getPasskeyByIdQuery({ passkeyId, adminId }).then(
    (res) => res.rows[0]
  );

  if (!passkey) {
    throw passkeyNotFound(language);
  }

  await deletePasskeyQuery({ passkeyId, adminId });

  return { success: true };
};
