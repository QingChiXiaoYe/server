/*
 * @Author: Innei
 * @Date: 2020-05-21 11:05:42
 * @LastEditTime: 2020-05-31 19:10:09
 * @LastEditors: Innei
 * @FilePath: /mx-server/src/shared/shared.module.ts
 * @Coding with Love
 */

import { Module, HttpModule, forwardRef } from '@nestjs/common'
import { CommentsController } from 'src/shared/comments/comments.controller'
import { CommentsService } from 'src/shared/comments/comments.service'
import { PageController } from 'src/shared/page/page.controller'
import { PageService } from 'src/shared/page/page.service'
import { PostsController } from 'src/shared/posts/posts.controller'
import { PostsService } from 'src/shared/posts/posts.service'
import { TasksModule } from '../../libs/common/src/tasks/tasks.module'
import { GatewayModule } from '../gateway/gateway.module'
import { AggregateController } from './aggregate/aggregate.controller'
import { AggregateService } from './aggregate/aggregate.service'
import { AnalyzeController } from './analyze/analyze.controller'
import { AnalyzeService } from './analyze/analyze.service'
import { BackupsController } from './backups/backups.controller'
import { BackupsService } from './backups/backups.service'
import { CategoriesController } from './categories/categories.controller'
import { CategoriesService } from './categories/categories.service'
import { ImportController } from './import/import.controller'
import { ImportService } from './import/import.service'
import { LinksController } from './links/links.controller'
import { LinksService } from './links/links.service'
import { MenuController } from './menu/menu.controller'
import { MenuService } from './menu/menu.service'
import { NotesController } from './notes/notes.controller'
import { NotesService } from './notes/notes.service'
import { OptionsController } from './options/admin.controller'
import { OptionsService } from './options/admin.service'
import { ProjectsController } from './projects/projects.controller'
import { ProjectsService } from './projects/projects.service'
import { SaysController } from './says/says.controller'
import { SaysService } from './says/says.service'
import { UploadsModule } from './uploads/uploads.module'

@Module({
  imports: [
    UploadsModule,
    TasksModule,
    GatewayModule,
    HttpModule.register({
      timeout: 30000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
      },
    }),
  ],
  providers: [
    OptionsService,
    AggregateService,
    CategoriesService,
    CommentsService,
    MenuService,
    NotesService,
    PageService,
    PostsService,
    ProjectsService,
    SaysService,
    LinksService,
    ImportService,
    AnalyzeService,
    BackupsService,
  ],
  controllers: [
    OptionsController,
    AggregateController,
    CategoriesController,
    CommentsController,
    MenuController,
    NotesController,
    PageController,
    PostsController,
    ProjectsController,
    SaysController,
    LinksController,
    ImportController,
    AnalyzeController,
    BackupsController,
  ],
})
export class SharedModule {}
