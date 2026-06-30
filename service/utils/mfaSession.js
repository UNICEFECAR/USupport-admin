import {
  completeMfaSessionQuery,
  createMfaSessionQuery,
  getMfaSessionQuery,
} from "#queries/mfa";

import { invalidMfaSession } from "#utils/errors";

const MFA_SESSION_TTL_MINUTES = 5;

export const createMfaSession = async ({
  adminId,
  ttlMinutes = MFA_SESSION_TTL_MINUTES,
}) => {
  const result = await createMfaSessionQuery({ adminId, ttlMinutes });
  return result.rows[0].mfa_session_id;
};

export const getValidMfaSession = async ({ mfaSessionId, language }) => {
  const result = await getMfaSessionQuery(mfaSessionId);
  const session = result.rows[0];

  if (!session) {
    throw invalidMfaSession(language);
  }

  if (session.completed) {
    throw invalidMfaSession(language);
  }

  const expiresAt = new Date(session.expires_at).getTime();
  if (expiresAt < Date.now()) {
    throw invalidMfaSession(language);
  }

  return session;
};

export const completeMfaSession = async ({ mfaSessionId, language }) => {
  await getValidMfaSession({ mfaSessionId, language });
  await completeMfaSessionQuery(mfaSessionId);
};
