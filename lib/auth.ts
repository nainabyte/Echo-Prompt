import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key_change_me";
const key = new TextEncoder().encode(JWT_SECRET);

export async function hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
}

export async function signToken(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1d")
        .sign(key);
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: ["HS256"],
        });
        return payload;
    } catch (error) {
        return null;
    }
}
