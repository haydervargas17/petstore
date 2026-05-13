export const env = {
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenMinutes: Number(process.env.ACCESS_TOKEN_MINUTES ?? 15),
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS ?? 7)
};

export function getJwtSecret(kind: "access" | "refresh") {
  const configured =
    kind === "access" ? env.jwtAccessSecret : env.jwtRefreshSecret;

  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error(`Missing JWT_${kind.toUpperCase()}_SECRET`);
  }

  return new TextEncoder().encode(
    configured ?? `dev-${kind}-secret-change-before-production`
  );
}
