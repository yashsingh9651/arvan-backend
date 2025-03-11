import { prisma } from "../utils/prismaclient.js";
import { NextFunction, Request, Response } from "express";
import bcrypt from 'bcryptjs';
import { importJWK, JWTPayload, SignJWT } from 'jose';
import { RouteError, ValidationErr } from "../common/routeerror.js";
import HttpStatusCodes from "../common/httpstatuscode.js";
import { randomUUID } from "crypto";

const generateJWT = async (payload: JWTPayload) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }

    const jwk = await importJWK({
        kty: 'oct',
        k: Buffer.from(process.env.JWT_SECRET, 'utf8').toString('base64'),
        alg: 'HS256',
    });

    return new SignJWT({ ...payload, iat: Math.floor(Date.now() / 1000), jti: randomUUID() })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(jwk);
};


const signin = async (req: Request, res: Response, next: NextFunction) => {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
        throw new ValidationErr([
            {
                message: 'Mobile and password are required',
                path: ['mobile', 'password'],
            },
        ]);
    }
    const user = await prisma.user.findUnique({
        where: {
            mobile,
        },
    });
    if (!user || !user.password) {
        throw new RouteError(HttpStatusCodes.BAD_REQUEST, 'Invalid email or password');
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        throw new RouteError(HttpStatusCodes.BAD_REQUEST, 'Invalid email or password');
    }

    const token = await generateJWT({ ...user });

    res.status(HttpStatusCodes.OK).json({ token });
};

const signup = async (req: Request, res: Response, next: NextFunction) => {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
        throw new ValidationErr([
            {
                message: 'Mobile and password are required',
                path: ['mobile', 'password'],
            },
        ]);
    }

    const user = await prisma.user.findUnique({
        where: {
            mobile,
        },
    });
    if (user) {
        throw new RouteError(HttpStatusCodes.BAD_REQUEST, 'User already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
        data: {
            mobile,
            password: hashedPassword,
            role: 'USER',
        }
    });
    res.status(HttpStatusCodes.CREATED).json({ message: 'User created successfully', user: newUser });
}

const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
        throw new ValidationErr([
            {
                message: 'Mobile and OTP are required',
                path: ['mobile', 'otp'],
            },
        ]);
    }
    const user = await prisma.user.findUnique({
        where: {
            mobile: mobile,
        },
    });
    if (!user) {
        throw new RouteError(HttpStatusCodes.BAD_REQUEST, 'User not found');
    }

    // TODO: verify otp

    console.log(parseInt(otp));
    if (999999 !== parseInt(otp)) {
        throw new RouteError(HttpStatusCodes.BAD_REQUEST, 'Invalid OTP');
    }

    // update user
    const updatedUser = await prisma.user.update({
        where: {
            mobile: mobile,
        },
        data: {
            mobileVerified: new Date(),
        }
    });

    const token = await generateJWT({ ...updatedUser });
    res.status(HttpStatusCodes.OK).json({ token });
}

const sendOTP = async (req: Request, res: Response, next: NextFunction) => {
    const { mobile } = req.body;
    if (!mobile) {
        throw new ValidationErr([
            {
                message: 'Mobile is required',
                path: ['mobile'],
            },
        ]);
    }
    const user = await prisma.user.findUnique({
        where: {
            mobile: mobile,
        },
    });
    if (!user) {
        throw new RouteError(HttpStatusCodes.BAD_REQUEST, 'User not found');
    }
    const otp = Math.floor(1000 + Math.random() * 9000);

    // TODO: send otp to user through WhatsApp or SMS

    // send otp to user
    res.status(HttpStatusCodes.OK).json({ message: 'OTP sent successfully', otp });
}
export default {
    signin,
    signup,
    verifyOTP,
    sendOTP,
};