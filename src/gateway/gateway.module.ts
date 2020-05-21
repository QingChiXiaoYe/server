import { Module } from '@nestjs/common'
import { EventsGateway } from './admin/events.gateway'
import { AuthModule } from '../auth/auth.module'
import { WebEventsGateway } from './web/events.gateway'

@Module({
  imports: [AuthModule],
  providers: [EventsGateway, WebEventsGateway],
  exports: [EventsGateway, WebEventsGateway],
})
export class GatewayModule {}
