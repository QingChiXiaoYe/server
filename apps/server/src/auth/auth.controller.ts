/*
 * @Author: Innei
 * @Date: 2020-05-26 11:10:24
 * @LastEditTime: 2020-05-30 14:12:53
 * @LastEditors: Innei
 * @FilePath: /mx-server/src/auth/auth.controller.ts
 * @Copyright
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpModule,
  HttpService,
  Post,
  Query,
  Scope,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  isMongoId,
} from 'class-validator'
import { Auth } from '../../../../shared/core/decorators/auth.decorator'
import { Master } from '../../../../shared/core/decorators/guest.decorator'
import { MongoIdDto } from '../shared/base/dto/id.dto'
import { AuthService } from './auth.service'
import { RolesGuard } from './roles.guard'
import { AdminEventsGateway } from '../gateway/admin/events.gateway'
import { OAuthVerifyQueryDto } from './oauth.dto'

export class TokenDto {
  @IsDate()
  @IsOptional()
  @Transform(({ value: v }) => new Date(v))
  expired?: Date

  @IsString()
  @IsNotEmpty()
  name: string
}

@Controller({
  path: 'auth',
  scope: Scope.REQUEST,
})
@ApiTags('Auth Routes')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly adminGateway: AdminEventsGateway,
    private readonly http: HttpService,
  ) {}

  @Get()
  @ApiOperation({ summary: '判断当前 Token 是否有效 ' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  checkLogged(@Master() isMaster: boolean) {
    return { ok: ~~isMaster, isGuest: !isMaster }
  }

  @Get('token')
  @Auth()
  async getOrVerifyToken(
    @Query('token') token?: string,
    @Query('id') id?: string,
  ) {
    if (typeof token === 'string') {
      return await this.authService.verifyCustomToken(token)
    }
    if (id && typeof id === 'string' && isMongoId(id)) {
      return await this.authService.getTokenSecret(id)
    }
    return await this.authService.getAllAccessToken()
  }

  @Post('token')
  @Auth()
  async generateToken(@Body() body: TokenDto) {
    const { expired, name } = body
    const token = await this.authService.generateAccessToken()
    const model = {
      expired,
      token,
      name,
    }
    await this.authService.saveToken(model)
    return model
  }
  @Delete('token')
  @Auth()
  async deleteToken(@Query() query: MongoIdDto) {
    const { id } = query
    await this.authService.deleteToken(id)
    this.adminGateway.handleTokenExpired(id)
    return 'OK'
  }

  @Auth()
  @Get('/oauth/github')
  async verifyGithubOAuth(@Query() query: OAuthVerifyQueryDto) {
    const { code } = query
  }
}
