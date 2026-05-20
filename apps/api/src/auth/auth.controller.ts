import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from "@nestjs/common";
import type { Request } from "express";

import { AuthService } from "./auth.service";
import type { AuthenticatedUser } from "./auth.types";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Public } from "./decorators/public.decorator";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.auth.register(dto, requestMeta(req));
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, requestMeta(req));
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.auth.refresh(dto, requestMeta(req));
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}

function requestMeta(req: Request): { userAgent?: string; ip?: string } {
  const ua = req.header("user-agent");
  // `req.ip` is populated by express when "trust proxy" is on, so we get
  // the client IP through Caddy + nginx instead of the docker bridge.
  return { userAgent: ua ?? undefined, ip: req.ip ?? undefined };
}
