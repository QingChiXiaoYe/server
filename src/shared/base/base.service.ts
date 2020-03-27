import { BaseModel } from '@libs/db/models/base.model'
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { DocumentType, ReturnModelType } from '@typegoose/typegoose'
import { AnyParamConstructor } from '@typegoose/typegoose/lib/types'
import { FindAndModifyWriteOpResultObject, MongoError } from 'mongodb'
import {
  DocumentQuery,
  ModelPopulateOptions,
  Query,
  QueryFindOneAndRemoveOptions,
  Types,
  QueryFindOneAndUpdateOptions,
  QueryUpdateOptions,
  MongooseFilterQuery,
  FilterQuery,
} from 'mongoose'
import { AnyType } from 'src/shared/base/interfaces'

export type enumOrderType = 'asc' | 'desc' | 'ascending' | 'descending' | 1 | -1
export type OrderType<T> = {
  created?: enumOrderType
  modified?: enumOrderType
  [key: string]: enumOrderType
}

export type AsyncQueryList<T extends BaseModel> = Promise<
  Array<DocumentType<T>>
>
export type AsyncQueryListWithPaginator<T extends BaseModel> = Promise<{
  data: Array<DocumentType<T>>
  page: Paginator
}>

export type QueryItem<T extends BaseModel> = DocumentQuery<
  DocumentType<T>,
  DocumentType<T>
>
/**
 * 分页器返回结果
 * @export
 * @interface Paginator
 */
export interface Paginator {
  /**
   * 总条数
   */
  total: number
  /**
   * 一页多少条
   */
  size: number
  /**
   * 当前页
   */
  currentPage: number
  /**
   * 总页数
   */
  totalPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

@Injectable()
export abstract class BaseService<T extends BaseModel> {
  constructor(protected model: ReturnModelType<AnyParamConstructor<T>>) {}

  /**
   * @description 抛出mongodb异常
   * @protected
   * @static
   * @param {MongoError} err
   */
  protected static throwMongoError(err: MongoError): never {
    throw new InternalServerErrorException(err, err.errmsg)
  }

  protected throwMongoError(err: MongoError): never {
    BaseService.throwMongoError(err)
  }
  /**
   * @description 将字符串转换成ObjectId
   * @protected
   * @static
   * @param {string} id
   * @returns {Types.ObjectId}
   */
  protected static toObjectId(id: string): Types.ObjectId {
    try {
      return Types.ObjectId(id)
    } catch (e) {
      this.throwMongoError(e)
    }
  }

  protected toObjectId(id: string): Types.ObjectId {
    return BaseService.toObjectId(id)
  }

  public findAll() {
    return this.model.find()
  }

  /**
   * 根据条件查找
   */
  // FIXME async maybe cause some bugs
  public async find(
    condition: AnyType,
    options: {
      lean?: boolean
      populates?: ModelPopulateOptions[] | ModelPopulateOptions
      [key: string]: AnyType
    } = {},
    filter: {
      sort?: OrderType<T>
      limit?: number
      skip?: number
      select?: string | Array<string>
    } = {
      sort: {},
    },
  ): AsyncQueryList<T> {
    return await this.model
      .find(condition, options)
      .sort(filter.sort)
      .limit(filter.limit)
      .skip(filter.skip)
      .select(filter.select)
  }

  public async findWithPaginator(
    condition: AnyType = {},
    options: {
      lean?: boolean
      populates?: ModelPopulateOptions[] | ModelPopulateOptions
      [key: string]: AnyType
    } = {},
    filter: {
      sort?: OrderType<T>
      limit?: number
      skip?: number
      select?: string[] | string
    } = {
      sort: { created: -1 },
      limit: 10,
      skip: 0,
    },
  ): AsyncQueryListWithPaginator<T> {
    filter.limit = filter.limit ?? 10
    const queryList = await this.find(condition, options, filter)
    if (queryList.length === 0) {
      throw new BadRequestException('没有下页啦!')
    }
    const total = await this.countDocument(condition)
    const { skip = 0, limit = 10 } = filter
    const page = skip / limit + 1
    const totalPage = Math.ceil(total / limit)
    return {
      data: queryList,
      page: {
        total,
        size: queryList.length,
        currentPage: page,
        totalPage,
        hasPrevPage: totalPage > page,
        hasNextPage: page !== 1,
      },
    }
  }

  public async countDocument(condition: AnyType): Promise<number> {
    return this.model.countDocuments(condition)
  }

  // FIXME:  <25-03-20 some bugs> //
  public async findByIdAsync(
    id: string | Types.ObjectId,
  ): Promise<DocumentType<T> | null> {
    const query = await this.model.findById(id)
    if (!query) {
      throw new BadRequestException('此记录不存在')
    }
    return query
  }

  public findById(
    id: string,
    projection?: object | string,
    options: {
      lean?: boolean
      populates?: ModelPopulateOptions[] | ModelPopulateOptions
      [key: string]: AnyType
    } = {},
  ): QueryItem<T> {
    return this.model.findById(this.toObjectId(id), projection, options)
  }
  /**
   * @description 获取单条数据
   * @param {*} conditions
   * @param {(Object | string)} [projection]
   * @param {({
   *     lean?: boolean;
   *     populates?: ModelPopulateOptions[] | ModelPopulateOptions;
   *     [key: string]: any;
   *   })} [options]
   * @returns {QueryItem<T>}
   */
  public findOne(
    conditions: AnyType,
    projection?: object | string,
    options: {
      lean?: boolean
      populates?: ModelPopulateOptions[] | ModelPopulateOptions
      [key: string]: AnyType
    } = {},
  ): QueryItem<T> {
    return this.model.findOne(conditions, projection || {}, options)
  }

  public async findOneAsync(
    conditions: AnyType,
    projection?: object | string,
    options: {
      lean?: boolean
      populates?: ModelPopulateOptions[] | ModelPopulateOptions
      [key: string]: AnyType
    } = {},
  ): Promise<DocumentType<T>> {
    const { ...option } = options
    const docsQuery = await this.findOne(conditions, projection || {}, option)
    return docsQuery
  }

  /**
   * @description 创建一条数据
   * @param {Partial<T>} docs
   * @returns {Promise<DocumentType<T>>}
   */
  async createNew(data: Partial<T>): Promise<DocumentType<T>> {
    return await this.model.create(data)
  }
  /**
   * @description 删除指定数据
   * @param {(any)} id
   * @param {QueryFindOneAndRemoveOptions} options
   * @returns {QueryItem<T>}
   */
  public delete(
    conditions: AnyType,
    options?: QueryFindOneAndRemoveOptions,
  ): QueryItem<T> {
    return this.model.findOneAndDelete(conditions, options)
  }
  public async deleteAsync(
    conditions: AnyType,
    options?: QueryFindOneAndRemoveOptions,
  ): Promise<DocumentType<T>> {
    return await this.delete(conditions, options).exec()
  }

  /**
   * @description 删除指定id数据
   * @param {(any)} id
   * @param {QueryFindOneAndRemoveOptions} options
   * @returns {Query<FindAndModifyWriteOpResultObject<DocumentType<T>>>}
   */
  public findAndDeleteById(
    id: string | Types.ObjectId,
    options?: QueryFindOneAndRemoveOptions,
  ): Query<FindAndModifyWriteOpResultObject<DocumentType<T>>> {
    return this.model.findByIdAndDelete(this.toObjectId(id as string), options)
  }

  public async findAndDeleteByIdAsync(
    id: string | Types.ObjectId,
    options?: QueryFindOneAndRemoveOptions,
  ): Promise<FindAndModifyWriteOpResultObject<DocumentType<T>>> {
    return await this.findAndDeleteById(id, options).exec()
  }

  public deleteOne(conditions: AnyType) {
    return this.model.deleteOne(conditions)
  }

  public async deleteOneAsync(conditions: AnyType) {
    return await this.deleteOne(conditions)
  }

  /**
   * @description 更新指定id数据
   * @param {string} id
   * @param {Partial<T>} update
   * @param {QueryFindOneAndUpdateOptions}
   * @returns {QueryItem<T>}
   */
  public updateById(
    id: string,
    update: Partial<T>,
    options: QueryFindOneAndUpdateOptions = { omitUndefined: true },
  ): QueryItem<T> {
    return this.model.findByIdAndUpdate(this.toObjectId(id), update, options)
  }

  async updateByIdAsync(
    id: string,
    update: Partial<T>,
    options: QueryFindOneAndUpdateOptions = {},
  ): Promise<DocumentType<T>> {
    return await this.updateById(id, update, options).exec()
  }

  /**
   * @description 更新指定数据
   * @param {any} conditions
   * @param {Partial<T>} update
   * @param {QueryFindOneAndUpdateOptions}
   * @returns {Query<any>}
   */
  public update(
    conditions: AnyType,
    doc: Partial<T>,
    options: QueryUpdateOptions = {},
  ): Query<any> {
    return this.model.updateOne(conditions, doc, options)
  }

  public async updateAsync(
    conditions: AnyType,
    doc: Partial<T>,
    options: QueryUpdateOptions = {},
  ) {
    return await this.update(conditions, doc, options)
  }
}