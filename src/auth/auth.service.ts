import { Injectable, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon from 'argon2';
import { SignUpInput, SignInInput, UpdateAuthInput } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(signUpInput: SignUpInput) {
    try {
      const hashedPassword = await argon.hash(signUpInput.password);
      const user = await this.prisma.user.create({
        data: {
          username: signUpInput.username,
          hashed_password: hashedPassword,
          email: signUpInput.email,
        },
      });
      const { access_token, refresh_token } = await this.createTokens(
        user.id,
        user.email,
      );
      await this.updateRefreshToken(user.email, refresh_token);

      return {
        access_token,
        refresh_token,
        user,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials taken');
        }
      }
      throw error;
    }
  }

  async signin(signInInput: SignInInput) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: signInInput.email,
        },
      });

      if (!user) {
        throw new ForbiddenException('Credentials invalid');
      }
      const isMatch = await argon.verify(
        user.hashed_password,
        signInInput.password,
      );

      if (!isMatch) {
        throw new ForbiddenException('Credentials invalid');
      }

      const { access_token, refresh_token } = await this.createTokens(
        user.id,
        user.email,
      );
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

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthInput: UpdateAuthInput) {
    return `This action updates a #${id} auth`;
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
