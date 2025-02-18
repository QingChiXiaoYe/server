import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UnprocessableEntityException,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Auth } from 'core/decorators/auth.decorator'
import { EventTypes } from '../../gateway/events.types'
import { WebEventsGateway } from '../../gateway/web/events.gateway'
import { MongoIdDto } from '../base/dto/id.dto'
import { OffsetDto } from '../base/dto/pager.dto'
import { RecentlyDto } from './recently.dto'
import { RecentlyService } from './recently.service'

@Controller('recently')
@ApiTags('Recently')
export class RecentlyController {
  constructor(
    private readonly service: RecentlyService,
    private readonly gateway: WebEventsGateway,
  ) {}

  @Get('latest')
  async getLatestOne() {
    return await this.service.getLatestOne()
  }

  @Get('/')
  async getList(@Query() query: OffsetDto) {
    const { before, after, size } = query

    if (before && after) {
      throw new UnprocessableEntityException('before or after must choice one')
    }

    return await this.service.getOffset({ before, after, size })
  }

  @Post('/')
  @Auth()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: RecentlyDto) {
    const res = await this.service.create(body)
    process.nextTick(() => {
      this.gateway.broadcast(EventTypes.RECENTLY_CREATE, res)
    })
    return res
  }

  @Delete('/:id')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async del(@Param() { id }: MongoIdDto) {
    const res = await this.service.delete(id)
    if (!res) {
      throw new UnprocessableEntityException('删除失败')
    }
    process.nextTick(() => {
      this.gateway.broadcast(EventTypes.RECENTLY_DElETE, { id })
    })
    return
  }
}
