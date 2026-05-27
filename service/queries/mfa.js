import { getDBPool } from "#utils/dbConfig";

export const createMfaSessionQuery = async ({ adminId, ttlMinutes = 5 }) =>
  await getDBPool("masterDb").query(
    `
      INSERT INTO admin_mfa_session (admin_id, expires_at)
      VALUES ($1, NOW() + ($2 || ' minutes')::INTERVAL)
      RETURNING mfa_session_id, admin_id, completed, expires_at, created_at;
    `,
    [adminId, String(ttlMinutes)]
  );

export const getMfaSessionQuery = async (mfaSessionId) =>
  await getDBPool("masterDb").query(
    `
      SELECT mfa_session_id, admin_id, completed, expires_at, created_at
      FROM admin_mfa_session
      WHERE mfa_session_id = $1;
    `,
    [mfaSessionId]
  );

export const completeMfaSessionQuery = async (mfaSessionId) =>
  await getDBPool("masterDb").query(
    `
      UPDATE admin_mfa_session
      SET completed = true
      WHERE mfa_session_id = $1
      RETURNING *;
    `,
    [mfaSessionId]
  );

export const setAdminMfaEnabledQuery = async ({ adminId, enabled }) =>
  await getDBPool("masterDb").query(
    `
      UPDATE admin
      SET mfa_enabled = $2
      WHERE admin_id = $1
      RETURNING admin_id, mfa_enabled;
    `,
    [adminId, enabled]
  );

export const listPasskeysByAdminIdQuery = async (adminId) =>
  await getDBPool("masterDb").query(
    `
      SELECT passkey_id, admin_id, credential_id, counter, name, created_at, last_used_at
      FROM admin_passkey
      WHERE admin_id = $1
      ORDER BY created_at DESC;
    `,
    [adminId]
  );

export const countPasskeysByAdminIdQuery = async (adminId) =>
  await getDBPool("masterDb").query(
    `
      SELECT COUNT(*)::int AS count
      FROM admin_passkey
      WHERE admin_id = $1;
    `,
    [adminId]
  );

export const getPasskeyByCredentialIdQuery = async (credentialId) =>
  await getDBPool("masterDb").query(
    `
      SELECT passkey_id, admin_id, credential_id, public_key, counter, name, created_at, last_used_at
      FROM admin_passkey
      WHERE credential_id = $1;
    `,
    [credentialId]
  );

export const getPasskeyByIdQuery = async ({ passkeyId, adminId }) =>
  await getDBPool("masterDb").query(
    `
      SELECT passkey_id, admin_id, credential_id, public_key, counter, name, created_at, last_used_at
      FROM admin_passkey
      WHERE passkey_id = $1 AND admin_id = $2;
    `,
    [passkeyId, adminId]
  );

export const savePasskeyQuery = async ({
  adminId,
  credentialId,
  publicKey,
  counter,
  name,
}) =>
  await getDBPool("masterDb").query(
    `
      INSERT INTO admin_passkey (admin_id, credential_id, public_key, counter, name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING passkey_id, admin_id, credential_id, counter, name, created_at, last_used_at;
    `,
    [adminId, credentialId, publicKey, counter, name]
  );

export const updatePasskeyCounterQuery = async ({
  passkeyId,
  counter,
}) =>
  await getDBPool("masterDb").query(
    `
      UPDATE admin_passkey
      SET counter = $2, last_used_at = NOW()
      WHERE passkey_id = $1
      RETURNING *;
    `,
    [passkeyId, counter]
  );

export const deletePasskeyQuery = async ({ passkeyId, adminId }) =>
  await getDBPool("masterDb").query(
    `
      DELETE FROM admin_passkey
      WHERE passkey_id = $1 AND admin_id = $2
      RETURNING passkey_id;
    `,
    [passkeyId, adminId]
  );

export const storePasskeyChallengeQuery = async ({
  adminId,
  mfaSessionId,
  challenge,
  type,
  ttlMinutes = 5,
}) =>
  await getDBPool("masterDb").query(
    `
      INSERT INTO admin_passkey_challenge (admin_id, mfa_session_id, challenge, type, expires_at)
      VALUES ($1, $2, $3, $4, NOW() + ($5 || ' minutes')::INTERVAL)
      RETURNING passkey_challenge_id, challenge, type, expires_at;
    `,
    [adminId, mfaSessionId || null, challenge, type, String(ttlMinutes)]
  );

export const getPasskeyChallengeQuery = async ({
  adminId,
  challenge,
  type,
  mfaSessionId,
}) =>
  await getDBPool("masterDb").query(
    `
      SELECT passkey_challenge_id, admin_id, mfa_session_id, challenge, type, expires_at
      FROM admin_passkey_challenge
      WHERE admin_id = $1
        AND challenge = $2
        AND type = $3
        AND ($4::uuid IS NULL OR mfa_session_id = $4)
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1;
    `,
    [adminId, challenge, type, mfaSessionId || null]
  );

export const deletePasskeyChallengeQuery = async (passkeyChallengeId) =>
  await getDBPool("masterDb").query(
    `
      DELETE FROM admin_passkey_challenge
      WHERE passkey_challenge_id = $1;
    `,
    [passkeyChallengeId]
  );

export const deleteExpiredMfaSessionsQuery = async () =>
  await getDBPool("masterDb").query(
    `
      DELETE FROM admin_mfa_session
      WHERE expires_at < NOW() OR completed = true;
    `
  );

export const deleteExpiredPasskeyChallengesQuery = async () =>
  await getDBPool("masterDb").query(
    `
      DELETE FROM admin_passkey_challenge
      WHERE expires_at < NOW();
    `
  );
