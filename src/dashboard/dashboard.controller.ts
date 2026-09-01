import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { DashboardService } from './dashboard.service';
import { DashboardGuard } from './dashboard.guard';
import { ConfigService } from '@nestjs/config';
import { renderLoginPage, renderDashboardPage } from './views';
import { UsersService } from '../users/users.service';
import { QueryUsersDto, CreateUserDto, UpdateUserDto } from '../users/dto/user.dto';

@Controller()
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly usersService: UsersService,
      private readonly configService: ConfigService,
    ) {}

  @Get(['/', '/login'])
  getLogin(@Req() req: Request, @Res() res: Response) {
    const token: string | undefined = req.cookies?.['dashboard_token'];
    if (token) {
      try {
        if (this.dashboardService.verifyToken(token)) {
          return res.redirect('/dashboard');
        }
      } catch {
        // fall through to login
      }
    }
    res.setHeader('Content-Type', 'text/html');
    res.send(renderLoginPage());
  }

  @Get('/dashboard')
    async getDashboard(@Req() req: Request, @Res() res: Response) {
      const token: string | undefined = req.cookies?.['dashboard_token'];
      let authenticated = false;
      if (token) {
        try {
          authenticated = this.dashboardService.verifyToken(token);
        } catch {
          authenticated = false;
        }
      }

      if (!authenticated) {
        return res.redirect('/');
      }

      res.setHeader('Content-Type', 'text/html');
      res.send(renderDashboardPage());
    }

  @Post('/dashboard/login')
  async login(
    @Body() body: { username?: string; password?: string },
    @Res() res: Response,
  ) {
    try {
      const { token, expiresInMs } = await this.dashboardService.validateCredentials(
        body.username ?? '',
        body.password ?? '',
      );
      res.cookie('dashboard_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: expiresInMs,
              secure: this.isSecureCookies(),
      });
      return res.json({ success: true });
    } catch {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }
  }

  @Post('/dashboard/logout')
  logout(@Res() res: Response) {
    res.clearCookie('dashboard_token');
    return res.json({ success: true });
  }

    private isSecureCookies(): boolean {
      return (
        this.configService.get<string>('COOKIE_SECURE', 'false') === 'true'
      );
    }

  // -------- Dashboard-scoped user API (cookie auth) --------

  @Get('/dashboard/api/users')
  @UseGuards(DashboardGuard)
    listUsers(@Query() query: QueryUsersDto) {
      return this.usersService.findAll(query);
  }

  @Post('/dashboard/api/users')
  @UseGuards(DashboardGuard)
    createUser(@Body() body: CreateUserDto) {
      return this.usersService.create(body);
  }

  @Patch('/dashboard/api/users/:id')
  @UseGuards(DashboardGuard)
    updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
    const actor = { id: 'dashboard', role: 'ADMIN' } as never;
      return this.usersService.update(id, body, actor);
  }

  @Delete('/dashboard/api/users/:id')
  @UseGuards(DashboardGuard)
  deleteUser(@Param('id') id: string) {
    const actor = { id: 'dashboard', role: 'ADMIN' } as never;
    return this.usersService.remove(id, actor);
  }
}