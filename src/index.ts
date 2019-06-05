import * as TypeORM from 'typeorm'

const databaseObjectMetadataKey = Symbol('databaseObjectMetadataKey')

type FieldQueryBuilder<T, C> = (
  qb: TypeORM.SelectQueryBuilder<T>,
  ctx: C,
) => TypeORM.SelectQueryBuilder<T>

export interface TypeGraphORMField<T, C> {
  propertyKey: string
  addSelect: FieldQueryBuilder<T, C>
}

interface DatabaseObjectMetadata<T, C> {
  fields: TypeGraphORMField<T, C>[]
  queryFieldName?: string
}

function makeDefaultDatabaseObjectMetadata<T, C>(): DatabaseObjectMetadata<T, C> {
  return {
    fields: [],
  }
}

export function getDatabaseObjectMetadata<T, C>(target: object): DatabaseObjectMetadata<T, C> {
  const metadata = Reflect.getMetadata(databaseObjectMetadataKey, target)

  if (metadata) {
    return metadata
  } else {
    const defaultMetadata = makeDefaultDatabaseObjectMetadata<T, C>()
    Reflect.defineMetadata(databaseObjectMetadataKey, defaultMetadata, target)
    return defaultMetadata
  }
}

export function Field<T, C>(options: {
  addSelect: FieldQueryBuilder<T, C>
}): PropertyDecorator {
  return (...args: Parameters<PropertyDecorator>): void => {
    const [target, propertyKey] = args
    const metadata = getDatabaseObjectMetadata<T, C>(target)

    if (typeof propertyKey === 'string') {
      metadata.fields.push({
        ...options,
        propertyKey,
      })
    }
  }
}

export function DatabaseObjectType(options?: {
  queryFieldName?: string
}): ClassDecorator {
  return (...args: Parameters<ClassDecorator>): void => {
    const [target] = args
    const metadata = getDatabaseObjectMetadata(target.prototype)
    metadata.queryFieldName = options && options.queryFieldName

    TypeORM.Entity()(target)
  }
}
