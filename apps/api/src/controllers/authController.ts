import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

import { prisma } from '../lib/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { sendOtpSms } from '../services/sms';
import { AuthRequest } from '../middlewares/auth';

const phoneSchema = z.object({
  phone: z.string().regex(/^\+223\d{8}$/, 'Format attendu: +223XXXXXXXX'),
});

const registerSchema = z.object({
  phone: z.string().regex(/^\+223\d{8}$/),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  accountType: z.enum(['FREE', 'PROVIDER']),
});

const loginSchema = z.object({
  phone: z.string().regex(/^\+223\d{8}$/),
  password: z.string().min(1),
});

const resetRequestSchema = z.object({
  phone: z.string().regex(/^\+223\d{8}$/),
});

const resetVerifySchema = z.object({
  phone: z.string().regex(/^\+223\d{8}$/),
  code: z.string().length(6),
  newPassword: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// POST /auth/register - Inscription par mot de passe
export async function register(req: Request, res: Response) {
  try {
    const { phone, password, name, accountType } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: { code: 'PHONE_TAKEN', message: 'Ce numéro est déjà utilisé' },
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        phone,
        passwordHash,
        name,
        role: accountType === 'PROVIDER' ? 'PROVIDER' : 'CLIENT',
        accountType,
      },
      include: { quartier: true },
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshTokenValue = generateRefreshToken(user.id);
    const hashedToken = await bcrypt.hash(refreshTokenValue, 10);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken: refreshTokenValue,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          accountType: user.accountType,
          quartierId: user.quartierId,
          quartierName: user.quartier?.name || null,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString(),
        },
        isNewUser: true,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0].message },
      });
      return;
    }
    throw error;
  }
}

// POST /auth/login - Connexion par mot de passe
export async function loginPassword(req: Request, res: Response) {
  try {
    const { phone, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { phone },
      include: { quartier: true, provider: true },
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Numéro ou mot de passe incorrect' },
      });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Numéro ou mot de passe incorrect' },
      });
      return;
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshTokenValue = generateRefreshToken(user.id);
    const hashedToken = await bcrypt.hash(refreshTokenValue, 10);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: refreshTokenValue,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          accountType: user.accountType,
          quartierId: user.quartierId,
          quartierName: user.quartier?.name || null,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString(),
          providerId: user.provider?.id || null,
        },
        isNewUser: false,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0].message },
      });
      return;
    }
    throw error;
  }
}

// POST /auth/request-reset - Demander un OTP pour réinitialiser le mot de passe
export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { phone } = resetRequestSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      // Ne pas révéler si le compte existe
      res.json({ success: true, data: { expiresIn: 300 } });
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otpSession.create({
      data: { phone, code, purpose: 'RESET_PASSWORD', expiresAt },
    });

    await sendOtpSms(phone, code);

    res.json({ success: true, data: { expiresIn: 300 } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0].message },
      });
      return;
    }
    throw error;
  }
}

// POST /auth/reset-password - Vérifier OTP et changer le mot de passe
export async function resetPassword(req: Request, res: Response) {
  try {
    const { phone, code, newPassword } = resetVerifySchema.parse(req.body);

    const otp = await prisma.otpSession.findFirst({
      where: {
        phone,
        code,
        purpose: 'RESET_PASSWORD',
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_OTP', message: 'Code invalide ou expiré' },
      });
      return;
    }

    await prisma.otpSession.update({
      where: { id: otp.id },
      data: { used: true },
    });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { phone },
      data: { passwordHash },
    });

    // Révoquer tous les refresh tokens
    await prisma.refreshToken.updateMany({
      where: { user: { phone }, revoked: false },
      data: { revoked: true },
    });

    res.json({ success: true, data: { message: 'Mot de passe réinitialisé avec succès' } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0].message },
      });
      return;
    }
    throw error;
  }
}

// POST /auth/refresh
export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const payload = verifyRefreshToken(refreshToken);

    const storedTokens = await prisma.refreshToken.findMany({
      where: { userId: payload.userId, revoked: false, expiresAt: { gt: new Date() } },
    });

    let validToken = false;
    for (const stored of storedTokens) {
      if (await bcrypt.compare(refreshToken, stored.token)) {
        validToken = true;
        break;
      }
    }

    if (!validToken) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Refresh token invalide' },
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Utilisateur introuvable' },
      });
      return;
    }

    const accessToken = generateAccessToken(user.id, user.role);
    res.json({ success: true, data: { accessToken } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0].message },
      });
      return;
    }
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token invalide' },
    });
  }
}

// POST /auth/logout
export async function logout(req: AuthRequest, res: Response) {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    const storedTokens = await prisma.refreshToken.findMany({
      where: { userId: req.userId!, revoked: false },
    });

    for (const stored of storedTokens) {
      if (await bcrypt.compare(refreshToken, stored.token)) {
        await prisma.refreshToken.update({
          where: { id: stored.id },
          data: { revoked: true },
        });
        break;
      }
    }

    res.json({ success: true, data: { message: 'Déconnexion réussie' } });
  } catch {
    res.json({ success: true, data: { message: 'Déconnexion réussie' } });
  }
}
