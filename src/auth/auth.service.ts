import { Injectable, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon from 'argon2';
import { SignUpInput, SignInInput } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // for sign up
  async signup(signUpInput: SignUpInput) {
    try {
      const hashedPassword = await argon.hash(signUpInput.password);
      // Create user
      const user = await this.prisma.user.create({
        data: {
          username: signUpInput.username,
          hashed_password: hashedPassword,
          email: signUpInput.email,
        },
      });
      // Create tokens
      const { access_token, refresh_token } = await this.createTokens(
        user.id,
        user.email,
      );
      // Update refresh token
      await this.updateRefreshToken(user.email, refresh_token);

      return {
        access_token,
        refresh_token,
        user,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint failed
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials taken');
        }
      }
      throw error;
    }
  }

  // for sign in
  async signin(signInInput: SignInInput) {
    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: {
          email: signInInput.email,
        },
      });

      // Check if user exists
      if (!user) {
        throw new ForbiddenException('Credentials invalid');
      }

      // Check if password matches
      const isMatch = await argon.verify(
        user.hashed_password,
        signInInput.password,
      );

      // Check if password matches
      if (!isMatch) {
        throw new ForbiddenException('Credentials invalid');
      }

      // Create tokens
      const { access_token, refresh_token } = await this.createTokens(
        user.id,
        user.email,
      );
      // Update refresh token
      await this.updateRefreshToken(user.email, refresh_token);

      return {
        access_token,
        refresh_token,
        user,
      };
    } catch (error) {
      throw error;
    }
  }

  async logout(user_id: number) {
    try {
      // check id and delete refresh token
      await this.prisma.user.updateMany({
        where: {
          id: user_id,
          hashed_refresh_token: {
            not: null,
          },
        },
        data: {
          hashed_refresh_token: null,
        },
      });

      return { logged_out: true };
    } catch (error) {
      throw error;
    }
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  async createTokens(user_id: number, email: string) {
    const access_token = this.jwtService.sign(
      {
        user_id,
        email,
      },
      { expiresIn: '15m', secret: this.configService.get('SECRET_ACCESS') },
    );
    const refresh_token = this.jwtService.sign(
      {
        user_id,
        email,
        access_token,
      },
      { expiresIn: '7d', secret: this.configService.get('SECRET_REFRESH') },
    );
    return { access_token, refresh_token };
  }

  async updateRefreshToken(email: string, refresh_token: string) {
    const hashedRefreshToken = await argon.hash(refresh_token);
    await this.prisma.user.update({
      where: {
        email: email,
      },
      data: {
        hashed_refresh_token: hashedRefreshToken,
      },
    });
  }
}
