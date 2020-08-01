/*
 * @Author: Innei
 * @Date: 2020-05-12 15:52:01
 * @LastEditTime: 2020-05-25 16:31:15
 * @LastEditors: Innei
 * @FilePath: /mx-server/src/app.module.ts
 * @MIT
 */

import { CommonModule } from '@libs/common'
import { DbModule } from '@libs/db'
import {
  Module,
  Provider,
  ValidationPipe,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common'
import { APP_PIPE, APP_GUARD } from '@nestjs/core'
import { GatewayModule } from 'src/gateway/gateway.module'
import { AuthModule } from './auth/auth.module'
import { MasterModule } from './master/master.module'
import { SharedModule } from './shared/shared.module'
import { SpiderGuard } from 'src/core/guards/spider.guard'
import { ConfigsModule } from './configs/configs.module'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { AnalyzeMiddleware } from './core/middlewares/analyze.middleware'
import { SkipBrowserDefaultRequestMiddleware } from './core/middlewares/favicon.middleware'
import { AppController } from './app.controller'
import { SecurityMiddleware } from './core/middlewares/security.middleware'
const providers: Provider<any>[] = [
  {
    provide: APP_PIPE,
    useFactory: () => {
      return new ValidationPipe({
        transform: true,
        whitelist: true,
        errorHttpStatusCode: 422,
      })
    },
  },
]

if (process.env.NODE_ENV === 'production') {
  providers.push({
    provide: APP_GUARD,
    useClass: SpiderGuard,
  })
}

@Module({
  imports: [
    CommonModule,
    DbModule,
    GatewayModule,
    AuthModule,
    MasterModule,
    SharedModule,
    ConfigsModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'admin'),
      renderPath: '/admin',
    }),
  ],
  providers,
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AnalyzeMiddleware)
      .forRoutes({ path: '(.*?)', method: RequestMethod.GET })
      .apply(SkipBrowserDefaultRequestMiddleware, SecurityMiddleware)
      .forRoutes({ path: '(.*?)', method: RequestMethod.ALL })
  }
}
