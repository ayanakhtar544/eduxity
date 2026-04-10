
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model PushToken
 * 
 */
export type PushToken = $Result.DefaultSelection<Prisma.$PushTokenPayload>
/**
 * Model LearningSession
 * 
 */
export type LearningSession = $Result.DefaultSelection<Prisma.$LearningSessionPayload>
/**
 * Model LearningItem
 * 
 */
export type LearningItem = $Result.DefaultSelection<Prisma.$LearningItemPayload>
/**
 * Model FeedItem
 * 
 */
export type FeedItem = $Result.DefaultSelection<Prisma.$FeedItemPayload>
/**
 * Model UserInteraction
 * 
 */
export type UserInteraction = $Result.DefaultSelection<Prisma.$UserInteractionPayload>
/**
 * Model LearningStreak
 * 
 */
export type LearningStreak = $Result.DefaultSelection<Prisma.$LearningStreakPayload>
/**
 * Model LeaderboardScore
 * 
 */
export type LeaderboardScore = $Result.DefaultSelection<Prisma.$LeaderboardScorePayload>
/**
 * Model DailyChallenge
 * 
 */
export type DailyChallenge = $Result.DefaultSelection<Prisma.$DailyChallengePayload>

/**
 * Enums
 */
export namespace $Enums {
  export const SessionStatus: {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED'
};

export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus]


export const LearningItemType: {
  quiz: 'quiz',
  flashcard: 'flashcard',
  match: 'match',
  remember: 'remember',
  mini_game: 'mini_game'
};

export type LearningItemType = (typeof LearningItemType)[keyof typeof LearningItemType]


export const InteractionType: {
  VIEW: 'VIEW',
  CORRECT: 'CORRECT',
  WRONG: 'WRONG',
  SKIP: 'SKIP',
  SAVE: 'SAVE',
  LIKE: 'LIKE',
  SHARE: 'SHARE',
  BOOKMARK: 'BOOKMARK'
};

export type InteractionType = (typeof InteractionType)[keyof typeof InteractionType]

}

export type SessionStatus = $Enums.SessionStatus

export const SessionStatus: typeof $Enums.SessionStatus

export type LearningItemType = $Enums.LearningItemType

export const LearningItemType: typeof $Enums.LearningItemType

export type InteractionType = $Enums.InteractionType

export const InteractionType: typeof $Enums.InteractionType

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs>;

  /**
   * `prisma.pushToken`: Exposes CRUD operations for the **PushToken** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PushTokens
    * const pushTokens = await prisma.pushToken.findMany()
    * ```
    */
  get pushToken(): Prisma.PushTokenDelegate<ExtArgs>;

  /**
   * `prisma.learningSession`: Exposes CRUD operations for the **LearningSession** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more LearningSessions
    * const learningSessions = await prisma.learningSession.findMany()
    * ```
    */
  get learningSession(): Prisma.LearningSessionDelegate<ExtArgs>;

  /**
   * `prisma.learningItem`: Exposes CRUD operations for the **LearningItem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more LearningItems
    * const learningItems = await prisma.learningItem.findMany()
    * ```
    */
  get learningItem(): Prisma.LearningItemDelegate<ExtArgs>;

  /**
   * `prisma.feedItem`: Exposes CRUD operations for the **FeedItem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more FeedItems
    * const feedItems = await prisma.feedItem.findMany()
    * ```
    */
  get feedItem(): Prisma.FeedItemDelegate<ExtArgs>;

  /**
   * `prisma.userInteraction`: Exposes CRUD operations for the **UserInteraction** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more UserInteractions
    * const userInteractions = await prisma.userInteraction.findMany()
    * ```
    */
  get userInteraction(): Prisma.UserInteractionDelegate<ExtArgs>;

  /**
   * `prisma.learningStreak`: Exposes CRUD operations for the **LearningStreak** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more LearningStreaks
    * const learningStreaks = await prisma.learningStreak.findMany()
    * ```
    */
  get learningStreak(): Prisma.LearningStreakDelegate<ExtArgs>;

  /**
   * `prisma.leaderboardScore`: Exposes CRUD operations for the **LeaderboardScore** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more LeaderboardScores
    * const leaderboardScores = await prisma.leaderboardScore.findMany()
    * ```
    */
  get leaderboardScore(): Prisma.LeaderboardScoreDelegate<ExtArgs>;

  /**
   * `prisma.dailyChallenge`: Exposes CRUD operations for the **DailyChallenge** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more DailyChallenges
    * const dailyChallenges = await prisma.dailyChallenge.findMany()
    * ```
    */
  get dailyChallenge(): Prisma.DailyChallengeDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    PushToken: 'PushToken',
    LearningSession: 'LearningSession',
    LearningItem: 'LearningItem',
    FeedItem: 'FeedItem',
    UserInteraction: 'UserInteraction',
    LearningStreak: 'LearningStreak',
    LeaderboardScore: 'LeaderboardScore',
    DailyChallenge: 'DailyChallenge'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "user" | "pushToken" | "learningSession" | "learningItem" | "feedItem" | "userInteraction" | "learningStreak" | "leaderboardScore" | "dailyChallenge"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      PushToken: {
        payload: Prisma.$PushTokenPayload<ExtArgs>
        fields: Prisma.PushTokenFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PushTokenFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushTokenPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PushTokenFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushTokenPayload>
          }
          findFirst: {
            args: Prisma.PushTokenFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushTokenPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PushTokenFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushTokenPayload>
          }
          findMany: {
            args: Prisma.PushTokenFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushTokenPayload>[]
          }
          create: {
            args: Prisma.PushTokenCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushTokenPayload>
          }
          createMany: {
            args: Prisma.PushTokenCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PushTokenCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushTokenPayload>[]
          }
          delete: {
            args: Prisma.PushTokenDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushTokenPayload>
          }
          update: {
            args: Prisma.PushTokenUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushTokenPayload>
          }
          deleteMany: {
            args: Prisma.PushTokenDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PushTokenUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PushTokenUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushTokenPayload>
          }
          aggregate: {
            args: Prisma.PushTokenAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePushToken>
          }
          groupBy: {
            args: Prisma.PushTokenGroupByArgs<ExtArgs>
            result: $Utils.Optional<PushTokenGroupByOutputType>[]
          }
          count: {
            args: Prisma.PushTokenCountArgs<ExtArgs>
            result: $Utils.Optional<PushTokenCountAggregateOutputType> | number
          }
        }
      }
      LearningSession: {
        payload: Prisma.$LearningSessionPayload<ExtArgs>
        fields: Prisma.LearningSessionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LearningSessionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningSessionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LearningSessionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningSessionPayload>
          }
          findFirst: {
            args: Prisma.LearningSessionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningSessionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LearningSessionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningSessionPayload>
          }
          findMany: {
            args: Prisma.LearningSessionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningSessionPayload>[]
          }
          create: {
            args: Prisma.LearningSessionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningSessionPayload>
          }
          createMany: {
            args: Prisma.LearningSessionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LearningSessionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningSessionPayload>[]
          }
          delete: {
            args: Prisma.LearningSessionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningSessionPayload>
          }
          update: {
            args: Prisma.LearningSessionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningSessionPayload>
          }
          deleteMany: {
            args: Prisma.LearningSessionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LearningSessionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.LearningSessionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningSessionPayload>
          }
          aggregate: {
            args: Prisma.LearningSessionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLearningSession>
          }
          groupBy: {
            args: Prisma.LearningSessionGroupByArgs<ExtArgs>
            result: $Utils.Optional<LearningSessionGroupByOutputType>[]
          }
          count: {
            args: Prisma.LearningSessionCountArgs<ExtArgs>
            result: $Utils.Optional<LearningSessionCountAggregateOutputType> | number
          }
        }
      }
      LearningItem: {
        payload: Prisma.$LearningItemPayload<ExtArgs>
        fields: Prisma.LearningItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LearningItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LearningItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningItemPayload>
          }
          findFirst: {
            args: Prisma.LearningItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LearningItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningItemPayload>
          }
          findMany: {
            args: Prisma.LearningItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningItemPayload>[]
          }
          create: {
            args: Prisma.LearningItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningItemPayload>
          }
          createMany: {
            args: Prisma.LearningItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LearningItemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningItemPayload>[]
          }
          delete: {
            args: Prisma.LearningItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningItemPayload>
          }
          update: {
            args: Prisma.LearningItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningItemPayload>
          }
          deleteMany: {
            args: Prisma.LearningItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LearningItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.LearningItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningItemPayload>
          }
          aggregate: {
            args: Prisma.LearningItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLearningItem>
          }
          groupBy: {
            args: Prisma.LearningItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<LearningItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.LearningItemCountArgs<ExtArgs>
            result: $Utils.Optional<LearningItemCountAggregateOutputType> | number
          }
        }
      }
      FeedItem: {
        payload: Prisma.$FeedItemPayload<ExtArgs>
        fields: Prisma.FeedItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FeedItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeedItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FeedItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeedItemPayload>
          }
          findFirst: {
            args: Prisma.FeedItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeedItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FeedItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeedItemPayload>
          }
          findMany: {
            args: Prisma.FeedItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeedItemPayload>[]
          }
          create: {
            args: Prisma.FeedItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeedItemPayload>
          }
          createMany: {
            args: Prisma.FeedItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FeedItemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeedItemPayload>[]
          }
          delete: {
            args: Prisma.FeedItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeedItemPayload>
          }
          update: {
            args: Prisma.FeedItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeedItemPayload>
          }
          deleteMany: {
            args: Prisma.FeedItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FeedItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.FeedItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FeedItemPayload>
          }
          aggregate: {
            args: Prisma.FeedItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFeedItem>
          }
          groupBy: {
            args: Prisma.FeedItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<FeedItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.FeedItemCountArgs<ExtArgs>
            result: $Utils.Optional<FeedItemCountAggregateOutputType> | number
          }
        }
      }
      UserInteraction: {
        payload: Prisma.$UserInteractionPayload<ExtArgs>
        fields: Prisma.UserInteractionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserInteractionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserInteractionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserInteractionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserInteractionPayload>
          }
          findFirst: {
            args: Prisma.UserInteractionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserInteractionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserInteractionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserInteractionPayload>
          }
          findMany: {
            args: Prisma.UserInteractionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserInteractionPayload>[]
          }
          create: {
            args: Prisma.UserInteractionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserInteractionPayload>
          }
          createMany: {
            args: Prisma.UserInteractionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserInteractionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserInteractionPayload>[]
          }
          delete: {
            args: Prisma.UserInteractionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserInteractionPayload>
          }
          update: {
            args: Prisma.UserInteractionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserInteractionPayload>
          }
          deleteMany: {
            args: Prisma.UserInteractionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserInteractionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserInteractionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserInteractionPayload>
          }
          aggregate: {
            args: Prisma.UserInteractionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUserInteraction>
          }
          groupBy: {
            args: Prisma.UserInteractionGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserInteractionGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserInteractionCountArgs<ExtArgs>
            result: $Utils.Optional<UserInteractionCountAggregateOutputType> | number
          }
        }
      }
      LearningStreak: {
        payload: Prisma.$LearningStreakPayload<ExtArgs>
        fields: Prisma.LearningStreakFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LearningStreakFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningStreakPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LearningStreakFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningStreakPayload>
          }
          findFirst: {
            args: Prisma.LearningStreakFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningStreakPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LearningStreakFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningStreakPayload>
          }
          findMany: {
            args: Prisma.LearningStreakFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningStreakPayload>[]
          }
          create: {
            args: Prisma.LearningStreakCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningStreakPayload>
          }
          createMany: {
            args: Prisma.LearningStreakCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LearningStreakCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningStreakPayload>[]
          }
          delete: {
            args: Prisma.LearningStreakDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningStreakPayload>
          }
          update: {
            args: Prisma.LearningStreakUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningStreakPayload>
          }
          deleteMany: {
            args: Prisma.LearningStreakDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LearningStreakUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.LearningStreakUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LearningStreakPayload>
          }
          aggregate: {
            args: Prisma.LearningStreakAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLearningStreak>
          }
          groupBy: {
            args: Prisma.LearningStreakGroupByArgs<ExtArgs>
            result: $Utils.Optional<LearningStreakGroupByOutputType>[]
          }
          count: {
            args: Prisma.LearningStreakCountArgs<ExtArgs>
            result: $Utils.Optional<LearningStreakCountAggregateOutputType> | number
          }
        }
      }
      LeaderboardScore: {
        payload: Prisma.$LeaderboardScorePayload<ExtArgs>
        fields: Prisma.LeaderboardScoreFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LeaderboardScoreFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaderboardScorePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LeaderboardScoreFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaderboardScorePayload>
          }
          findFirst: {
            args: Prisma.LeaderboardScoreFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaderboardScorePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LeaderboardScoreFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaderboardScorePayload>
          }
          findMany: {
            args: Prisma.LeaderboardScoreFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaderboardScorePayload>[]
          }
          create: {
            args: Prisma.LeaderboardScoreCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaderboardScorePayload>
          }
          createMany: {
            args: Prisma.LeaderboardScoreCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LeaderboardScoreCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaderboardScorePayload>[]
          }
          delete: {
            args: Prisma.LeaderboardScoreDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaderboardScorePayload>
          }
          update: {
            args: Prisma.LeaderboardScoreUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaderboardScorePayload>
          }
          deleteMany: {
            args: Prisma.LeaderboardScoreDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LeaderboardScoreUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.LeaderboardScoreUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeaderboardScorePayload>
          }
          aggregate: {
            args: Prisma.LeaderboardScoreAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLeaderboardScore>
          }
          groupBy: {
            args: Prisma.LeaderboardScoreGroupByArgs<ExtArgs>
            result: $Utils.Optional<LeaderboardScoreGroupByOutputType>[]
          }
          count: {
            args: Prisma.LeaderboardScoreCountArgs<ExtArgs>
            result: $Utils.Optional<LeaderboardScoreCountAggregateOutputType> | number
          }
        }
      }
      DailyChallenge: {
        payload: Prisma.$DailyChallengePayload<ExtArgs>
        fields: Prisma.DailyChallengeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DailyChallengeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DailyChallengePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DailyChallengeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DailyChallengePayload>
          }
          findFirst: {
            args: Prisma.DailyChallengeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DailyChallengePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DailyChallengeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DailyChallengePayload>
          }
          findMany: {
            args: Prisma.DailyChallengeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DailyChallengePayload>[]
          }
          create: {
            args: Prisma.DailyChallengeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DailyChallengePayload>
          }
          createMany: {
            args: Prisma.DailyChallengeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DailyChallengeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DailyChallengePayload>[]
          }
          delete: {
            args: Prisma.DailyChallengeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DailyChallengePayload>
          }
          update: {
            args: Prisma.DailyChallengeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DailyChallengePayload>
          }
          deleteMany: {
            args: Prisma.DailyChallengeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DailyChallengeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.DailyChallengeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DailyChallengePayload>
          }
          aggregate: {
            args: Prisma.DailyChallengeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDailyChallenge>
          }
          groupBy: {
            args: Prisma.DailyChallengeGroupByArgs<ExtArgs>
            result: $Utils.Optional<DailyChallengeGroupByOutputType>[]
          }
          count: {
            args: Prisma.DailyChallengeCountArgs<ExtArgs>
            result: $Utils.Optional<DailyChallengeCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    pushTokens: number
    sessions: number
    learningItems: number
    interactions: number
    feedItems: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    pushTokens?: boolean | UserCountOutputTypeCountPushTokensArgs
    sessions?: boolean | UserCountOutputTypeCountSessionsArgs
    learningItems?: boolean | UserCountOutputTypeCountLearningItemsArgs
    interactions?: boolean | UserCountOutputTypeCountInteractionsArgs
    feedItems?: boolean | UserCountOutputTypeCountFeedItemsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountPushTokensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PushTokenWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LearningSessionWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountLearningItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LearningItemWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountInteractionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserInteractionWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountFeedItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FeedItemWhereInput
  }


  /**
   * Count Type LearningSessionCountOutputType
   */

  export type LearningSessionCountOutputType = {
    items: number
  }

  export type LearningSessionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    items?: boolean | LearningSessionCountOutputTypeCountItemsArgs
  }

  // Custom InputTypes
  /**
   * LearningSessionCountOutputType without action
   */
  export type LearningSessionCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningSessionCountOutputType
     */
    select?: LearningSessionCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * LearningSessionCountOutputType without action
   */
  export type LearningSessionCountOutputTypeCountItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LearningItemWhereInput
  }


  /**
   * Count Type LearningItemCountOutputType
   */

  export type LearningItemCountOutputType = {
    interactions: number
  }

  export type LearningItemCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    interactions?: boolean | LearningItemCountOutputTypeCountInteractionsArgs
  }

  // Custom InputTypes
  /**
   * LearningItemCountOutputType without action
   */
  export type LearningItemCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningItemCountOutputType
     */
    select?: LearningItemCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * LearningItemCountOutputType without action
   */
  export type LearningItemCountOutputTypeCountInteractionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserInteractionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    preferredDifficulty: number | null
  }

  export type UserSumAggregateOutputType = {
    preferredDifficulty: number | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    name: string | null
    firebaseUid: string | null
    targetExam: string | null
    preferredDifficulty: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    name: string | null
    firebaseUid: string | null
    targetExam: string | null
    preferredDifficulty: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    name: number
    firebaseUid: number
    targetExam: number
    preferredTopics: number
    preferredDifficulty: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    preferredDifficulty?: true
  }

  export type UserSumAggregateInputType = {
    preferredDifficulty?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    name?: true
    firebaseUid?: true
    targetExam?: true
    preferredDifficulty?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    name?: true
    firebaseUid?: true
    targetExam?: true
    preferredDifficulty?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    name?: true
    firebaseUid?: true
    targetExam?: true
    preferredTopics?: true
    preferredDifficulty?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string
    name: string | null
    firebaseUid: string
    targetExam: string | null
    preferredTopics: JsonValue | null
    preferredDifficulty: number | null
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
    firebaseUid?: boolean
    targetExam?: boolean
    preferredTopics?: boolean
    preferredDifficulty?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    pushTokens?: boolean | User$pushTokensArgs<ExtArgs>
    sessions?: boolean | User$sessionsArgs<ExtArgs>
    learningItems?: boolean | User$learningItemsArgs<ExtArgs>
    interactions?: boolean | User$interactionsArgs<ExtArgs>
    feedItems?: boolean | User$feedItemsArgs<ExtArgs>
    streak?: boolean | User$streakArgs<ExtArgs>
    leaderboardScore?: boolean | User$leaderboardScoreArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
    firebaseUid?: boolean
    targetExam?: boolean
    preferredTopics?: boolean
    preferredDifficulty?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    name?: boolean
    firebaseUid?: boolean
    targetExam?: boolean
    preferredTopics?: boolean
    preferredDifficulty?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    pushTokens?: boolean | User$pushTokensArgs<ExtArgs>
    sessions?: boolean | User$sessionsArgs<ExtArgs>
    learningItems?: boolean | User$learningItemsArgs<ExtArgs>
    interactions?: boolean | User$interactionsArgs<ExtArgs>
    feedItems?: boolean | User$feedItemsArgs<ExtArgs>
    streak?: boolean | User$streakArgs<ExtArgs>
    leaderboardScore?: boolean | User$leaderboardScoreArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      pushTokens: Prisma.$PushTokenPayload<ExtArgs>[]
      sessions: Prisma.$LearningSessionPayload<ExtArgs>[]
      learningItems: Prisma.$LearningItemPayload<ExtArgs>[]
      interactions: Prisma.$UserInteractionPayload<ExtArgs>[]
      feedItems: Prisma.$FeedItemPayload<ExtArgs>[]
      streak: Prisma.$LearningStreakPayload<ExtArgs> | null
      leaderboardScore: Prisma.$LeaderboardScorePayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      name: string | null
      firebaseUid: string
      targetExam: string | null
      preferredTopics: Prisma.JsonValue | null
      preferredDifficulty: number | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    pushTokens<T extends User$pushTokensArgs<ExtArgs> = {}>(args?: Subset<T, User$pushTokensArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PushTokenPayload<ExtArgs>, T, "findMany"> | Null>
    sessions<T extends User$sessionsArgs<ExtArgs> = {}>(args?: Subset<T, User$sessionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LearningSessionPayload<ExtArgs>, T, "findMany"> | Null>
    learningItems<T extends User$learningItemsArgs<ExtArgs> = {}>(args?: Subset<T, User$learningItemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LearningItemPayload<ExtArgs>, T, "findMany"> | Null>
    interactions<T extends User$interactionsArgs<ExtArgs> = {}>(args?: Subset<T, User$interactionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserInteractionPayload<ExtArgs>, T, "findMany"> | Null>
    feedItems<T extends User$feedItemsArgs<ExtArgs> = {}>(args?: Subset<T, User$feedItemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FeedItemPayload<ExtArgs>, T, "findMany"> | Null>
    streak<T extends User$streakArgs<ExtArgs> = {}>(args?: Subset<T, User$streakArgs<ExtArgs>>): Prisma__LearningStreakClient<$Result.GetResult<Prisma.$LearningStreakPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    leaderboardScore<T extends User$leaderboardScoreArgs<ExtArgs> = {}>(args?: Subset<T, User$leaderboardScoreArgs<ExtArgs>>): Prisma__LeaderboardScoreClient<$Result.GetResult<Prisma.$LeaderboardScorePayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */ 
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly firebaseUid: FieldRef<"User", 'String'>
    readonly targetExam: FieldRef<"User", 'String'>
    readonly preferredTopics: FieldRef<"User", 'Json'>
    readonly preferredDifficulty: FieldRef<"User", 'Int'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
  }

  /**
   * User.pushTokens
   */
  export type User$pushTokensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushToken
     */
    select?: PushTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PushTokenInclude<ExtArgs> | null
    where?: PushTokenWhereInput
    orderBy?: PushTokenOrderByWithRelationInput | PushTokenOrderByWithRelationInput[]
    cursor?: PushTokenWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PushTokenScalarFieldEnum | PushTokenScalarFieldEnum[]
  }

  /**
   * User.sessions
   */
  export type User$sessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningSession
     */
    select?: LearningSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningSessionInclude<ExtArgs> | null
    where?: LearningSessionWhereInput
    orderBy?: LearningSessionOrderByWithRelationInput | LearningSessionOrderByWithRelationInput[]
    cursor?: LearningSessionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LearningSessionScalarFieldEnum | LearningSessionScalarFieldEnum[]
  }

  /**
   * User.learningItems
   */
  export type User$learningItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningItem
     */
    select?: LearningItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningItemInclude<ExtArgs> | null
    where?: LearningItemWhereInput
    orderBy?: LearningItemOrderByWithRelationInput | LearningItemOrderByWithRelationInput[]
    cursor?: LearningItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LearningItemScalarFieldEnum | LearningItemScalarFieldEnum[]
  }

  /**
   * User.interactions
   */
  export type User$interactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserInteraction
     */
    select?: UserInteractionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInteractionInclude<ExtArgs> | null
    where?: UserInteractionWhereInput
    orderBy?: UserInteractionOrderByWithRelationInput | UserInteractionOrderByWithRelationInput[]
    cursor?: UserInteractionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserInteractionScalarFieldEnum | UserInteractionScalarFieldEnum[]
  }

  /**
   * User.feedItems
   */
  export type User$feedItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FeedItem
     */
    select?: FeedItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeedItemInclude<ExtArgs> | null
    where?: FeedItemWhereInput
    orderBy?: FeedItemOrderByWithRelationInput | FeedItemOrderByWithRelationInput[]
    cursor?: FeedItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FeedItemScalarFieldEnum | FeedItemScalarFieldEnum[]
  }

  /**
   * User.streak
   */
  export type User$streakArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningStreak
     */
    select?: LearningStreakSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningStreakInclude<ExtArgs> | null
    where?: LearningStreakWhereInput
  }

  /**
   * User.leaderboardScore
   */
  export type User$leaderboardScoreArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaderboardScore
     */
    select?: LeaderboardScoreSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaderboardScoreInclude<ExtArgs> | null
    where?: LeaderboardScoreWhereInput
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model PushToken
   */

  export type AggregatePushToken = {
    _count: PushTokenCountAggregateOutputType | null
    _min: PushTokenMinAggregateOutputType | null
    _max: PushTokenMaxAggregateOutputType | null
  }

  export type PushTokenMinAggregateOutputType = {
    id: string | null
    token: string | null
    userId: string | null
  }

  export type PushTokenMaxAggregateOutputType = {
    id: string | null
    token: string | null
    userId: string | null
  }

  export type PushTokenCountAggregateOutputType = {
    id: number
    token: number
    userId: number
    _all: number
  }


  export type PushTokenMinAggregateInputType = {
    id?: true
    token?: true
    userId?: true
  }

  export type PushTokenMaxAggregateInputType = {
    id?: true
    token?: true
    userId?: true
  }

  export type PushTokenCountAggregateInputType = {
    id?: true
    token?: true
    userId?: true
    _all?: true
  }

  export type PushTokenAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PushToken to aggregate.
     */
    where?: PushTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PushTokens to fetch.
     */
    orderBy?: PushTokenOrderByWithRelationInput | PushTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PushTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PushTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PushTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PushTokens
    **/
    _count?: true | PushTokenCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PushTokenMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PushTokenMaxAggregateInputType
  }

  export type GetPushTokenAggregateType<T extends PushTokenAggregateArgs> = {
        [P in keyof T & keyof AggregatePushToken]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePushToken[P]>
      : GetScalarType<T[P], AggregatePushToken[P]>
  }




  export type PushTokenGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PushTokenWhereInput
    orderBy?: PushTokenOrderByWithAggregationInput | PushTokenOrderByWithAggregationInput[]
    by: PushTokenScalarFieldEnum[] | PushTokenScalarFieldEnum
    having?: PushTokenScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PushTokenCountAggregateInputType | true
    _min?: PushTokenMinAggregateInputType
    _max?: PushTokenMaxAggregateInputType
  }

  export type PushTokenGroupByOutputType = {
    id: string
    token: string
    userId: string
    _count: PushTokenCountAggregateOutputType | null
    _min: PushTokenMinAggregateOutputType | null
    _max: PushTokenMaxAggregateOutputType | null
  }

  type GetPushTokenGroupByPayload<T extends PushTokenGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PushTokenGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PushTokenGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PushTokenGroupByOutputType[P]>
            : GetScalarType<T[P], PushTokenGroupByOutputType[P]>
        }
      >
    >


  export type PushTokenSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    token?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pushToken"]>

  export type PushTokenSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    token?: boolean
    userId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pushToken"]>

  export type PushTokenSelectScalar = {
    id?: boolean
    token?: boolean
    userId?: boolean
  }

  export type PushTokenInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type PushTokenIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $PushTokenPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PushToken"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      token: string
      userId: string
    }, ExtArgs["result"]["pushToken"]>
    composites: {}
  }

  type PushTokenGetPayload<S extends boolean | null | undefined | PushTokenDefaultArgs> = $Result.GetResult<Prisma.$PushTokenPayload, S>

  type PushTokenCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PushTokenFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PushTokenCountAggregateInputType | true
    }

  export interface PushTokenDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PushToken'], meta: { name: 'PushToken' } }
    /**
     * Find zero or one PushToken that matches the filter.
     * @param {PushTokenFindUniqueArgs} args - Arguments to find a PushToken
     * @example
     * // Get one PushToken
     * const pushToken = await prisma.pushToken.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PushTokenFindUniqueArgs>(args: SelectSubset<T, PushTokenFindUniqueArgs<ExtArgs>>): Prisma__PushTokenClient<$Result.GetResult<Prisma.$PushTokenPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one PushToken that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PushTokenFindUniqueOrThrowArgs} args - Arguments to find a PushToken
     * @example
     * // Get one PushToken
     * const pushToken = await prisma.pushToken.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PushTokenFindUniqueOrThrowArgs>(args: SelectSubset<T, PushTokenFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PushTokenClient<$Result.GetResult<Prisma.$PushTokenPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first PushToken that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PushTokenFindFirstArgs} args - Arguments to find a PushToken
     * @example
     * // Get one PushToken
     * const pushToken = await prisma.pushToken.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PushTokenFindFirstArgs>(args?: SelectSubset<T, PushTokenFindFirstArgs<ExtArgs>>): Prisma__PushTokenClient<$Result.GetResult<Prisma.$PushTokenPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first PushToken that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PushTokenFindFirstOrThrowArgs} args - Arguments to find a PushToken
     * @example
     * // Get one PushToken
     * const pushToken = await prisma.pushToken.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PushTokenFindFirstOrThrowArgs>(args?: SelectSubset<T, PushTokenFindFirstOrThrowArgs<ExtArgs>>): Prisma__PushTokenClient<$Result.GetResult<Prisma.$PushTokenPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more PushTokens that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PushTokenFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PushTokens
     * const pushTokens = await prisma.pushToken.findMany()
     * 
     * // Get first 10 PushTokens
     * const pushTokens = await prisma.pushToken.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const pushTokenWithIdOnly = await prisma.pushToken.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PushTokenFindManyArgs>(args?: SelectSubset<T, PushTokenFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PushTokenPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a PushToken.
     * @param {PushTokenCreateArgs} args - Arguments to create a PushToken.
     * @example
     * // Create one PushToken
     * const PushToken = await prisma.pushToken.create({
     *   data: {
     *     // ... data to create a PushToken
     *   }
     * })
     * 
     */
    create<T extends PushTokenCreateArgs>(args: SelectSubset<T, PushTokenCreateArgs<ExtArgs>>): Prisma__PushTokenClient<$Result.GetResult<Prisma.$PushTokenPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many PushTokens.
     * @param {PushTokenCreateManyArgs} args - Arguments to create many PushTokens.
     * @example
     * // Create many PushTokens
     * const pushToken = await prisma.pushToken.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PushTokenCreateManyArgs>(args?: SelectSubset<T, PushTokenCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PushTokens and returns the data saved in the database.
     * @param {PushTokenCreateManyAndReturnArgs} args - Arguments to create many PushTokens.
     * @example
     * // Create many PushTokens
     * const pushToken = await prisma.pushToken.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PushTokens and only return the `id`
     * const pushTokenWithIdOnly = await prisma.pushToken.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PushTokenCreateManyAndReturnArgs>(args?: SelectSubset<T, PushTokenCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PushTokenPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a PushToken.
     * @param {PushTokenDeleteArgs} args - Arguments to delete one PushToken.
     * @example
     * // Delete one PushToken
     * const PushToken = await prisma.pushToken.delete({
     *   where: {
     *     // ... filter to delete one PushToken
     *   }
     * })
     * 
     */
    delete<T extends PushTokenDeleteArgs>(args: SelectSubset<T, PushTokenDeleteArgs<ExtArgs>>): Prisma__PushTokenClient<$Result.GetResult<Prisma.$PushTokenPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one PushToken.
     * @param {PushTokenUpdateArgs} args - Arguments to update one PushToken.
     * @example
     * // Update one PushToken
     * const pushToken = await prisma.pushToken.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PushTokenUpdateArgs>(args: SelectSubset<T, PushTokenUpdateArgs<ExtArgs>>): Prisma__PushTokenClient<$Result.GetResult<Prisma.$PushTokenPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more PushTokens.
     * @param {PushTokenDeleteManyArgs} args - Arguments to filter PushTokens to delete.
     * @example
     * // Delete a few PushTokens
     * const { count } = await prisma.pushToken.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PushTokenDeleteManyArgs>(args?: SelectSubset<T, PushTokenDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PushTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PushTokenUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PushTokens
     * const pushToken = await prisma.pushToken.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PushTokenUpdateManyArgs>(args: SelectSubset<T, PushTokenUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PushToken.
     * @param {PushTokenUpsertArgs} args - Arguments to update or create a PushToken.
     * @example
     * // Update or create a PushToken
     * const pushToken = await prisma.pushToken.upsert({
     *   create: {
     *     // ... data to create a PushToken
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PushToken we want to update
     *   }
     * })
     */
    upsert<T extends PushTokenUpsertArgs>(args: SelectSubset<T, PushTokenUpsertArgs<ExtArgs>>): Prisma__PushTokenClient<$Result.GetResult<Prisma.$PushTokenPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of PushTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PushTokenCountArgs} args - Arguments to filter PushTokens to count.
     * @example
     * // Count the number of PushTokens
     * const count = await prisma.pushToken.count({
     *   where: {
     *     // ... the filter for the PushTokens we want to count
     *   }
     * })
    **/
    count<T extends PushTokenCountArgs>(
      args?: Subset<T, PushTokenCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PushTokenCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PushToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PushTokenAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PushTokenAggregateArgs>(args: Subset<T, PushTokenAggregateArgs>): Prisma.PrismaPromise<GetPushTokenAggregateType<T>>

    /**
     * Group by PushToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PushTokenGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PushTokenGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PushTokenGroupByArgs['orderBy'] }
        : { orderBy?: PushTokenGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PushTokenGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPushTokenGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PushToken model
   */
  readonly fields: PushTokenFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PushToken.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PushTokenClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PushToken model
   */ 
  interface PushTokenFieldRefs {
    readonly id: FieldRef<"PushToken", 'String'>
    readonly token: FieldRef<"PushToken", 'String'>
    readonly userId: FieldRef<"PushToken", 'String'>
  }
    

  // Custom InputTypes
  /**
   * PushToken findUnique
   */
  export type PushTokenFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushToken
     */
    select?: PushTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PushTokenInclude<ExtArgs> | null
    /**
     * Filter, which PushToken to fetch.
     */
    where: PushTokenWhereUniqueInput
  }

  /**
   * PushToken findUniqueOrThrow
   */
  export type PushTokenFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushToken
     */
    select?: PushTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PushTokenInclude<ExtArgs> | null
    /**
     * Filter, which PushToken to fetch.
     */
    where: PushTokenWhereUniqueInput
  }

  /**
   * PushToken findFirst
   */
  export type PushTokenFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushToken
     */
    select?: PushTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PushTokenInclude<ExtArgs> | null
    /**
     * Filter, which PushToken to fetch.
     */
    where?: PushTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PushTokens to fetch.
     */
    orderBy?: PushTokenOrderByWithRelationInput | PushTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PushTokens.
     */
    cursor?: PushTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PushTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PushTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PushTokens.
     */
    distinct?: PushTokenScalarFieldEnum | PushTokenScalarFieldEnum[]
  }

  /**
   * PushToken findFirstOrThrow
   */
  export type PushTokenFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushToken
     */
    select?: PushTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PushTokenInclude<ExtArgs> | null
    /**
     * Filter, which PushToken to fetch.
     */
    where?: PushTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PushTokens to fetch.
     */
    orderBy?: PushTokenOrderByWithRelationInput | PushTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PushTokens.
     */
    cursor?: PushTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PushTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PushTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PushTokens.
     */
    distinct?: PushTokenScalarFieldEnum | PushTokenScalarFieldEnum[]
  }

  /**
   * PushToken findMany
   */
  export type PushTokenFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushToken
     */
    select?: PushTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PushTokenInclude<ExtArgs> | null
    /**
     * Filter, which PushTokens to fetch.
     */
    where?: PushTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PushTokens to fetch.
     */
    orderBy?: PushTokenOrderByWithRelationInput | PushTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PushTokens.
     */
    cursor?: PushTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PushTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PushTokens.
     */
    skip?: number
    distinct?: PushTokenScalarFieldEnum | PushTokenScalarFieldEnum[]
  }

  /**
   * PushToken create
   */
  export type PushTokenCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushToken
     */
    select?: PushTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PushTokenInclude<ExtArgs> | null
    /**
     * The data needed to create a PushToken.
     */
    data: XOR<PushTokenCreateInput, PushTokenUncheckedCreateInput>
  }

  /**
   * PushToken createMany
   */
  export type PushTokenCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PushTokens.
     */
    data: PushTokenCreateManyInput | PushTokenCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PushToken createManyAndReturn
   */
  export type PushTokenCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushToken
     */
    select?: PushTokenSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many PushTokens.
     */
    data: PushTokenCreateManyInput | PushTokenCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PushTokenIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PushToken update
   */
  export type PushTokenUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushToken
     */
    select?: PushTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PushTokenInclude<ExtArgs> | null
    /**
     * The data needed to update a PushToken.
     */
    data: XOR<PushTokenUpdateInput, PushTokenUncheckedUpdateInput>
    /**
     * Choose, which PushToken to update.
     */
    where: PushTokenWhereUniqueInput
  }

  /**
   * PushToken updateMany
   */
  export type PushTokenUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PushTokens.
     */
    data: XOR<PushTokenUpdateManyMutationInput, PushTokenUncheckedUpdateManyInput>
    /**
     * Filter which PushTokens to update
     */
    where?: PushTokenWhereInput
  }

  /**
   * PushToken upsert
   */
  export type PushTokenUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushToken
     */
    select?: PushTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PushTokenInclude<ExtArgs> | null
    /**
     * The filter to search for the PushToken to update in case it exists.
     */
    where: PushTokenWhereUniqueInput
    /**
     * In case the PushToken found by the `where` argument doesn't exist, create a new PushToken with this data.
     */
    create: XOR<PushTokenCreateInput, PushTokenUncheckedCreateInput>
    /**
     * In case the PushToken was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PushTokenUpdateInput, PushTokenUncheckedUpdateInput>
  }

  /**
   * PushToken delete
   */
  export type PushTokenDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushToken
     */
    select?: PushTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PushTokenInclude<ExtArgs> | null
    /**
     * Filter which PushToken to delete.
     */
    where: PushTokenWhereUniqueInput
  }

  /**
   * PushToken deleteMany
   */
  export type PushTokenDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PushTokens to delete
     */
    where?: PushTokenWhereInput
  }

  /**
   * PushToken without action
   */
  export type PushTokenDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushToken
     */
    select?: PushTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PushTokenInclude<ExtArgs> | null
  }


  /**
   * Model LearningSession
   */

  export type AggregateLearningSession = {
    _count: LearningSessionCountAggregateOutputType | null
    _avg: LearningSessionAvgAggregateOutputType | null
    _sum: LearningSessionSumAggregateOutputType | null
    _min: LearningSessionMinAggregateOutputType | null
    _max: LearningSessionMaxAggregateOutputType | null
  }

  export type LearningSessionAvgAggregateOutputType = {
    totalGenerated: number | null
    totalCompleted: number | null
  }

  export type LearningSessionSumAggregateOutputType = {
    totalGenerated: number | null
    totalCompleted: number | null
  }

  export type LearningSessionMinAggregateOutputType = {
    id: string | null
    userId: string | null
    topic: string | null
    status: $Enums.SessionStatus | null
    totalGenerated: number | null
    totalCompleted: number | null
    startedAt: Date | null
    completedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LearningSessionMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    topic: string | null
    status: $Enums.SessionStatus | null
    totalGenerated: number | null
    totalCompleted: number | null
    startedAt: Date | null
    completedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LearningSessionCountAggregateOutputType = {
    id: number
    userId: number
    topic: number
    status: number
    totalGenerated: number
    totalCompleted: number
    startedAt: number
    completedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type LearningSessionAvgAggregateInputType = {
    totalGenerated?: true
    totalCompleted?: true
  }

  export type LearningSessionSumAggregateInputType = {
    totalGenerated?: true
    totalCompleted?: true
  }

  export type LearningSessionMinAggregateInputType = {
    id?: true
    userId?: true
    topic?: true
    status?: true
    totalGenerated?: true
    totalCompleted?: true
    startedAt?: true
    completedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LearningSessionMaxAggregateInputType = {
    id?: true
    userId?: true
    topic?: true
    status?: true
    totalGenerated?: true
    totalCompleted?: true
    startedAt?: true
    completedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LearningSessionCountAggregateInputType = {
    id?: true
    userId?: true
    topic?: true
    status?: true
    totalGenerated?: true
    totalCompleted?: true
    startedAt?: true
    completedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type LearningSessionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LearningSession to aggregate.
     */
    where?: LearningSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LearningSessions to fetch.
     */
    orderBy?: LearningSessionOrderByWithRelationInput | LearningSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LearningSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LearningSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LearningSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned LearningSessions
    **/
    _count?: true | LearningSessionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LearningSessionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LearningSessionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LearningSessionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LearningSessionMaxAggregateInputType
  }

  export type GetLearningSessionAggregateType<T extends LearningSessionAggregateArgs> = {
        [P in keyof T & keyof AggregateLearningSession]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLearningSession[P]>
      : GetScalarType<T[P], AggregateLearningSession[P]>
  }




  export type LearningSessionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LearningSessionWhereInput
    orderBy?: LearningSessionOrderByWithAggregationInput | LearningSessionOrderByWithAggregationInput[]
    by: LearningSessionScalarFieldEnum[] | LearningSessionScalarFieldEnum
    having?: LearningSessionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LearningSessionCountAggregateInputType | true
    _avg?: LearningSessionAvgAggregateInputType
    _sum?: LearningSessionSumAggregateInputType
    _min?: LearningSessionMinAggregateInputType
    _max?: LearningSessionMaxAggregateInputType
  }

  export type LearningSessionGroupByOutputType = {
    id: string
    userId: string
    topic: string
    status: $Enums.SessionStatus
    totalGenerated: number
    totalCompleted: number
    startedAt: Date
    completedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: LearningSessionCountAggregateOutputType | null
    _avg: LearningSessionAvgAggregateOutputType | null
    _sum: LearningSessionSumAggregateOutputType | null
    _min: LearningSessionMinAggregateOutputType | null
    _max: LearningSessionMaxAggregateOutputType | null
  }

  type GetLearningSessionGroupByPayload<T extends LearningSessionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LearningSessionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LearningSessionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LearningSessionGroupByOutputType[P]>
            : GetScalarType<T[P], LearningSessionGroupByOutputType[P]>
        }
      >
    >


  export type LearningSessionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    topic?: boolean
    status?: boolean
    totalGenerated?: boolean
    totalCompleted?: boolean
    startedAt?: boolean
    completedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    items?: boolean | LearningSession$itemsArgs<ExtArgs>
    _count?: boolean | LearningSessionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["learningSession"]>

  export type LearningSessionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    topic?: boolean
    status?: boolean
    totalGenerated?: boolean
    totalCompleted?: boolean
    startedAt?: boolean
    completedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["learningSession"]>

  export type LearningSessionSelectScalar = {
    id?: boolean
    userId?: boolean
    topic?: boolean
    status?: boolean
    totalGenerated?: boolean
    totalCompleted?: boolean
    startedAt?: boolean
    completedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type LearningSessionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    items?: boolean | LearningSession$itemsArgs<ExtArgs>
    _count?: boolean | LearningSessionCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type LearningSessionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $LearningSessionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "LearningSession"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      items: Prisma.$LearningItemPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      topic: string
      status: $Enums.SessionStatus
      totalGenerated: number
      totalCompleted: number
      startedAt: Date
      completedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["learningSession"]>
    composites: {}
  }

  type LearningSessionGetPayload<S extends boolean | null | undefined | LearningSessionDefaultArgs> = $Result.GetResult<Prisma.$LearningSessionPayload, S>

  type LearningSessionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<LearningSessionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: LearningSessionCountAggregateInputType | true
    }

  export interface LearningSessionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['LearningSession'], meta: { name: 'LearningSession' } }
    /**
     * Find zero or one LearningSession that matches the filter.
     * @param {LearningSessionFindUniqueArgs} args - Arguments to find a LearningSession
     * @example
     * // Get one LearningSession
     * const learningSession = await prisma.learningSession.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LearningSessionFindUniqueArgs>(args: SelectSubset<T, LearningSessionFindUniqueArgs<ExtArgs>>): Prisma__LearningSessionClient<$Result.GetResult<Prisma.$LearningSessionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one LearningSession that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {LearningSessionFindUniqueOrThrowArgs} args - Arguments to find a LearningSession
     * @example
     * // Get one LearningSession
     * const learningSession = await prisma.learningSession.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LearningSessionFindUniqueOrThrowArgs>(args: SelectSubset<T, LearningSessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LearningSessionClient<$Result.GetResult<Prisma.$LearningSessionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first LearningSession that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningSessionFindFirstArgs} args - Arguments to find a LearningSession
     * @example
     * // Get one LearningSession
     * const learningSession = await prisma.learningSession.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LearningSessionFindFirstArgs>(args?: SelectSubset<T, LearningSessionFindFirstArgs<ExtArgs>>): Prisma__LearningSessionClient<$Result.GetResult<Prisma.$LearningSessionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first LearningSession that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningSessionFindFirstOrThrowArgs} args - Arguments to find a LearningSession
     * @example
     * // Get one LearningSession
     * const learningSession = await prisma.learningSession.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LearningSessionFindFirstOrThrowArgs>(args?: SelectSubset<T, LearningSessionFindFirstOrThrowArgs<ExtArgs>>): Prisma__LearningSessionClient<$Result.GetResult<Prisma.$LearningSessionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more LearningSessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningSessionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all LearningSessions
     * const learningSessions = await prisma.learningSession.findMany()
     * 
     * // Get first 10 LearningSessions
     * const learningSessions = await prisma.learningSession.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const learningSessionWithIdOnly = await prisma.learningSession.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LearningSessionFindManyArgs>(args?: SelectSubset<T, LearningSessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LearningSessionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a LearningSession.
     * @param {LearningSessionCreateArgs} args - Arguments to create a LearningSession.
     * @example
     * // Create one LearningSession
     * const LearningSession = await prisma.learningSession.create({
     *   data: {
     *     // ... data to create a LearningSession
     *   }
     * })
     * 
     */
    create<T extends LearningSessionCreateArgs>(args: SelectSubset<T, LearningSessionCreateArgs<ExtArgs>>): Prisma__LearningSessionClient<$Result.GetResult<Prisma.$LearningSessionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many LearningSessions.
     * @param {LearningSessionCreateManyArgs} args - Arguments to create many LearningSessions.
     * @example
     * // Create many LearningSessions
     * const learningSession = await prisma.learningSession.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LearningSessionCreateManyArgs>(args?: SelectSubset<T, LearningSessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many LearningSessions and returns the data saved in the database.
     * @param {LearningSessionCreateManyAndReturnArgs} args - Arguments to create many LearningSessions.
     * @example
     * // Create many LearningSessions
     * const learningSession = await prisma.learningSession.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many LearningSessions and only return the `id`
     * const learningSessionWithIdOnly = await prisma.learningSession.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LearningSessionCreateManyAndReturnArgs>(args?: SelectSubset<T, LearningSessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LearningSessionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a LearningSession.
     * @param {LearningSessionDeleteArgs} args - Arguments to delete one LearningSession.
     * @example
     * // Delete one LearningSession
     * const LearningSession = await prisma.learningSession.delete({
     *   where: {
     *     // ... filter to delete one LearningSession
     *   }
     * })
     * 
     */
    delete<T extends LearningSessionDeleteArgs>(args: SelectSubset<T, LearningSessionDeleteArgs<ExtArgs>>): Prisma__LearningSessionClient<$Result.GetResult<Prisma.$LearningSessionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one LearningSession.
     * @param {LearningSessionUpdateArgs} args - Arguments to update one LearningSession.
     * @example
     * // Update one LearningSession
     * const learningSession = await prisma.learningSession.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LearningSessionUpdateArgs>(args: SelectSubset<T, LearningSessionUpdateArgs<ExtArgs>>): Prisma__LearningSessionClient<$Result.GetResult<Prisma.$LearningSessionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more LearningSessions.
     * @param {LearningSessionDeleteManyArgs} args - Arguments to filter LearningSessions to delete.
     * @example
     * // Delete a few LearningSessions
     * const { count } = await prisma.learningSession.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LearningSessionDeleteManyArgs>(args?: SelectSubset<T, LearningSessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LearningSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningSessionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many LearningSessions
     * const learningSession = await prisma.learningSession.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LearningSessionUpdateManyArgs>(args: SelectSubset<T, LearningSessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one LearningSession.
     * @param {LearningSessionUpsertArgs} args - Arguments to update or create a LearningSession.
     * @example
     * // Update or create a LearningSession
     * const learningSession = await prisma.learningSession.upsert({
     *   create: {
     *     // ... data to create a LearningSession
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the LearningSession we want to update
     *   }
     * })
     */
    upsert<T extends LearningSessionUpsertArgs>(args: SelectSubset<T, LearningSessionUpsertArgs<ExtArgs>>): Prisma__LearningSessionClient<$Result.GetResult<Prisma.$LearningSessionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of LearningSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningSessionCountArgs} args - Arguments to filter LearningSessions to count.
     * @example
     * // Count the number of LearningSessions
     * const count = await prisma.learningSession.count({
     *   where: {
     *     // ... the filter for the LearningSessions we want to count
     *   }
     * })
    **/
    count<T extends LearningSessionCountArgs>(
      args?: Subset<T, LearningSessionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LearningSessionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a LearningSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningSessionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LearningSessionAggregateArgs>(args: Subset<T, LearningSessionAggregateArgs>): Prisma.PrismaPromise<GetLearningSessionAggregateType<T>>

    /**
     * Group by LearningSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningSessionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LearningSessionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LearningSessionGroupByArgs['orderBy'] }
        : { orderBy?: LearningSessionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LearningSessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLearningSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the LearningSession model
   */
  readonly fields: LearningSessionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for LearningSession.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LearningSessionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    items<T extends LearningSession$itemsArgs<ExtArgs> = {}>(args?: Subset<T, LearningSession$itemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LearningItemPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the LearningSession model
   */ 
  interface LearningSessionFieldRefs {
    readonly id: FieldRef<"LearningSession", 'String'>
    readonly userId: FieldRef<"LearningSession", 'String'>
    readonly topic: FieldRef<"LearningSession", 'String'>
    readonly status: FieldRef<"LearningSession", 'SessionStatus'>
    readonly totalGenerated: FieldRef<"LearningSession", 'Int'>
    readonly totalCompleted: FieldRef<"LearningSession", 'Int'>
    readonly startedAt: FieldRef<"LearningSession", 'DateTime'>
    readonly completedAt: FieldRef<"LearningSession", 'DateTime'>
    readonly createdAt: FieldRef<"LearningSession", 'DateTime'>
    readonly updatedAt: FieldRef<"LearningSession", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * LearningSession findUnique
   */
  export type LearningSessionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningSession
     */
    select?: LearningSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningSessionInclude<ExtArgs> | null
    /**
     * Filter, which LearningSession to fetch.
     */
    where: LearningSessionWhereUniqueInput
  }

  /**
   * LearningSession findUniqueOrThrow
   */
  export type LearningSessionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningSession
     */
    select?: LearningSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningSessionInclude<ExtArgs> | null
    /**
     * Filter, which LearningSession to fetch.
     */
    where: LearningSessionWhereUniqueInput
  }

  /**
   * LearningSession findFirst
   */
  export type LearningSessionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningSession
     */
    select?: LearningSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningSessionInclude<ExtArgs> | null
    /**
     * Filter, which LearningSession to fetch.
     */
    where?: LearningSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LearningSessions to fetch.
     */
    orderBy?: LearningSessionOrderByWithRelationInput | LearningSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LearningSessions.
     */
    cursor?: LearningSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LearningSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LearningSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LearningSessions.
     */
    distinct?: LearningSessionScalarFieldEnum | LearningSessionScalarFieldEnum[]
  }

  /**
   * LearningSession findFirstOrThrow
   */
  export type LearningSessionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningSession
     */
    select?: LearningSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningSessionInclude<ExtArgs> | null
    /**
     * Filter, which LearningSession to fetch.
     */
    where?: LearningSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LearningSessions to fetch.
     */
    orderBy?: LearningSessionOrderByWithRelationInput | LearningSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LearningSessions.
     */
    cursor?: LearningSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LearningSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LearningSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LearningSessions.
     */
    distinct?: LearningSessionScalarFieldEnum | LearningSessionScalarFieldEnum[]
  }

  /**
   * LearningSession findMany
   */
  export type LearningSessionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningSession
     */
    select?: LearningSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningSessionInclude<ExtArgs> | null
    /**
     * Filter, which LearningSessions to fetch.
     */
    where?: LearningSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LearningSessions to fetch.
     */
    orderBy?: LearningSessionOrderByWithRelationInput | LearningSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing LearningSessions.
     */
    cursor?: LearningSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LearningSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LearningSessions.
     */
    skip?: number
    distinct?: LearningSessionScalarFieldEnum | LearningSessionScalarFieldEnum[]
  }

  /**
   * LearningSession create
   */
  export type LearningSessionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningSession
     */
    select?: LearningSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningSessionInclude<ExtArgs> | null
    /**
     * The data needed to create a LearningSession.
     */
    data: XOR<LearningSessionCreateInput, LearningSessionUncheckedCreateInput>
  }

  /**
   * LearningSession createMany
   */
  export type LearningSessionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many LearningSessions.
     */
    data: LearningSessionCreateManyInput | LearningSessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LearningSession createManyAndReturn
   */
  export type LearningSessionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningSession
     */
    select?: LearningSessionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many LearningSessions.
     */
    data: LearningSessionCreateManyInput | LearningSessionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningSessionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * LearningSession update
   */
  export type LearningSessionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningSession
     */
    select?: LearningSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningSessionInclude<ExtArgs> | null
    /**
     * The data needed to update a LearningSession.
     */
    data: XOR<LearningSessionUpdateInput, LearningSessionUncheckedUpdateInput>
    /**
     * Choose, which LearningSession to update.
     */
    where: LearningSessionWhereUniqueInput
  }

  /**
   * LearningSession updateMany
   */
  export type LearningSessionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update LearningSessions.
     */
    data: XOR<LearningSessionUpdateManyMutationInput, LearningSessionUncheckedUpdateManyInput>
    /**
     * Filter which LearningSessions to update
     */
    where?: LearningSessionWhereInput
  }

  /**
   * LearningSession upsert
   */
  export type LearningSessionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningSession
     */
    select?: LearningSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningSessionInclude<ExtArgs> | null
    /**
     * The filter to search for the LearningSession to update in case it exists.
     */
    where: LearningSessionWhereUniqueInput
    /**
     * In case the LearningSession found by the `where` argument doesn't exist, create a new LearningSession with this data.
     */
    create: XOR<LearningSessionCreateInput, LearningSessionUncheckedCreateInput>
    /**
     * In case the LearningSession was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LearningSessionUpdateInput, LearningSessionUncheckedUpdateInput>
  }

  /**
   * LearningSession delete
   */
  export type LearningSessionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningSession
     */
    select?: LearningSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningSessionInclude<ExtArgs> | null
    /**
     * Filter which LearningSession to delete.
     */
    where: LearningSessionWhereUniqueInput
  }

  /**
   * LearningSession deleteMany
   */
  export type LearningSessionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LearningSessions to delete
     */
    where?: LearningSessionWhereInput
  }

  /**
   * LearningSession.items
   */
  export type LearningSession$itemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningItem
     */
    select?: LearningItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningItemInclude<ExtArgs> | null
    where?: LearningItemWhereInput
    orderBy?: LearningItemOrderByWithRelationInput | LearningItemOrderByWithRelationInput[]
    cursor?: LearningItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LearningItemScalarFieldEnum | LearningItemScalarFieldEnum[]
  }

  /**
   * LearningSession without action
   */
  export type LearningSessionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningSession
     */
    select?: LearningSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningSessionInclude<ExtArgs> | null
  }


  /**
   * Model LearningItem
   */

  export type AggregateLearningItem = {
    _count: LearningItemCountAggregateOutputType | null
    _avg: LearningItemAvgAggregateOutputType | null
    _sum: LearningItemSumAggregateOutputType | null
    _min: LearningItemMinAggregateOutputType | null
    _max: LearningItemMaxAggregateOutputType | null
  }

  export type LearningItemAvgAggregateOutputType = {
    difficulty: number | null
    engagementScore: number | null
    reviewInterval: number | null
    reviewCount: number | null
  }

  export type LearningItemSumAggregateOutputType = {
    difficulty: number | null
    engagementScore: number | null
    reviewInterval: number | null
    reviewCount: number | null
  }

  export type LearningItemMinAggregateOutputType = {
    id: string | null
    userId: string | null
    sessionId: string | null
    type: $Enums.LearningItemType | null
    topic: string | null
    difficulty: number | null
    isPublished: boolean | null
    engagementScore: number | null
    masteredByUser: boolean | null
    lastInteractedAt: Date | null
    nextReviewAt: Date | null
    reviewInterval: number | null
    reviewCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LearningItemMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    sessionId: string | null
    type: $Enums.LearningItemType | null
    topic: string | null
    difficulty: number | null
    isPublished: boolean | null
    engagementScore: number | null
    masteredByUser: boolean | null
    lastInteractedAt: Date | null
    nextReviewAt: Date | null
    reviewInterval: number | null
    reviewCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LearningItemCountAggregateOutputType = {
    id: number
    userId: number
    sessionId: number
    type: number
    topic: number
    difficulty: number
    payload: number
    isPublished: number
    engagementScore: number
    masteredByUser: number
    lastInteractedAt: number
    nextReviewAt: number
    reviewInterval: number
    reviewCount: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type LearningItemAvgAggregateInputType = {
    difficulty?: true
    engagementScore?: true
    reviewInterval?: true
    reviewCount?: true
  }

  export type LearningItemSumAggregateInputType = {
    difficulty?: true
    engagementScore?: true
    reviewInterval?: true
    reviewCount?: true
  }

  export type LearningItemMinAggregateInputType = {
    id?: true
    userId?: true
    sessionId?: true
    type?: true
    topic?: true
    difficulty?: true
    isPublished?: true
    engagementScore?: true
    masteredByUser?: true
    lastInteractedAt?: true
    nextReviewAt?: true
    reviewInterval?: true
    reviewCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LearningItemMaxAggregateInputType = {
    id?: true
    userId?: true
    sessionId?: true
    type?: true
    topic?: true
    difficulty?: true
    isPublished?: true
    engagementScore?: true
    masteredByUser?: true
    lastInteractedAt?: true
    nextReviewAt?: true
    reviewInterval?: true
    reviewCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LearningItemCountAggregateInputType = {
    id?: true
    userId?: true
    sessionId?: true
    type?: true
    topic?: true
    difficulty?: true
    payload?: true
    isPublished?: true
    engagementScore?: true
    masteredByUser?: true
    lastInteractedAt?: true
    nextReviewAt?: true
    reviewInterval?: true
    reviewCount?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type LearningItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LearningItem to aggregate.
     */
    where?: LearningItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LearningItems to fetch.
     */
    orderBy?: LearningItemOrderByWithRelationInput | LearningItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LearningItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LearningItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LearningItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned LearningItems
    **/
    _count?: true | LearningItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LearningItemAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LearningItemSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LearningItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LearningItemMaxAggregateInputType
  }

  export type GetLearningItemAggregateType<T extends LearningItemAggregateArgs> = {
        [P in keyof T & keyof AggregateLearningItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLearningItem[P]>
      : GetScalarType<T[P], AggregateLearningItem[P]>
  }




  export type LearningItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LearningItemWhereInput
    orderBy?: LearningItemOrderByWithAggregationInput | LearningItemOrderByWithAggregationInput[]
    by: LearningItemScalarFieldEnum[] | LearningItemScalarFieldEnum
    having?: LearningItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LearningItemCountAggregateInputType | true
    _avg?: LearningItemAvgAggregateInputType
    _sum?: LearningItemSumAggregateInputType
    _min?: LearningItemMinAggregateInputType
    _max?: LearningItemMaxAggregateInputType
  }

  export type LearningItemGroupByOutputType = {
    id: string
    userId: string
    sessionId: string | null
    type: $Enums.LearningItemType
    topic: string
    difficulty: number
    payload: JsonValue
    isPublished: boolean
    engagementScore: number
    masteredByUser: boolean
    lastInteractedAt: Date | null
    nextReviewAt: Date | null
    reviewInterval: number
    reviewCount: number
    createdAt: Date
    updatedAt: Date
    _count: LearningItemCountAggregateOutputType | null
    _avg: LearningItemAvgAggregateOutputType | null
    _sum: LearningItemSumAggregateOutputType | null
    _min: LearningItemMinAggregateOutputType | null
    _max: LearningItemMaxAggregateOutputType | null
  }

  type GetLearningItemGroupByPayload<T extends LearningItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LearningItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LearningItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LearningItemGroupByOutputType[P]>
            : GetScalarType<T[P], LearningItemGroupByOutputType[P]>
        }
      >
    >


  export type LearningItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    sessionId?: boolean
    type?: boolean
    topic?: boolean
    difficulty?: boolean
    payload?: boolean
    isPublished?: boolean
    engagementScore?: boolean
    masteredByUser?: boolean
    lastInteractedAt?: boolean
    nextReviewAt?: boolean
    reviewInterval?: boolean
    reviewCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    session?: boolean | LearningItem$sessionArgs<ExtArgs>
    feedItem?: boolean | LearningItem$feedItemArgs<ExtArgs>
    interactions?: boolean | LearningItem$interactionsArgs<ExtArgs>
    _count?: boolean | LearningItemCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["learningItem"]>

  export type LearningItemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    sessionId?: boolean
    type?: boolean
    topic?: boolean
    difficulty?: boolean
    payload?: boolean
    isPublished?: boolean
    engagementScore?: boolean
    masteredByUser?: boolean
    lastInteractedAt?: boolean
    nextReviewAt?: boolean
    reviewInterval?: boolean
    reviewCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    session?: boolean | LearningItem$sessionArgs<ExtArgs>
  }, ExtArgs["result"]["learningItem"]>

  export type LearningItemSelectScalar = {
    id?: boolean
    userId?: boolean
    sessionId?: boolean
    type?: boolean
    topic?: boolean
    difficulty?: boolean
    payload?: boolean
    isPublished?: boolean
    engagementScore?: boolean
    masteredByUser?: boolean
    lastInteractedAt?: boolean
    nextReviewAt?: boolean
    reviewInterval?: boolean
    reviewCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type LearningItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    session?: boolean | LearningItem$sessionArgs<ExtArgs>
    feedItem?: boolean | LearningItem$feedItemArgs<ExtArgs>
    interactions?: boolean | LearningItem$interactionsArgs<ExtArgs>
    _count?: boolean | LearningItemCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type LearningItemIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    session?: boolean | LearningItem$sessionArgs<ExtArgs>
  }

  export type $LearningItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "LearningItem"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      session: Prisma.$LearningSessionPayload<ExtArgs> | null
      feedItem: Prisma.$FeedItemPayload<ExtArgs> | null
      interactions: Prisma.$UserInteractionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      sessionId: string | null
      type: $Enums.LearningItemType
      topic: string
      difficulty: number
      payload: Prisma.JsonValue
      isPublished: boolean
      engagementScore: number
      masteredByUser: boolean
      lastInteractedAt: Date | null
      nextReviewAt: Date | null
      reviewInterval: number
      reviewCount: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["learningItem"]>
    composites: {}
  }

  type LearningItemGetPayload<S extends boolean | null | undefined | LearningItemDefaultArgs> = $Result.GetResult<Prisma.$LearningItemPayload, S>

  type LearningItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<LearningItemFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: LearningItemCountAggregateInputType | true
    }

  export interface LearningItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['LearningItem'], meta: { name: 'LearningItem' } }
    /**
     * Find zero or one LearningItem that matches the filter.
     * @param {LearningItemFindUniqueArgs} args - Arguments to find a LearningItem
     * @example
     * // Get one LearningItem
     * const learningItem = await prisma.learningItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LearningItemFindUniqueArgs>(args: SelectSubset<T, LearningItemFindUniqueArgs<ExtArgs>>): Prisma__LearningItemClient<$Result.GetResult<Prisma.$LearningItemPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one LearningItem that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {LearningItemFindUniqueOrThrowArgs} args - Arguments to find a LearningItem
     * @example
     * // Get one LearningItem
     * const learningItem = await prisma.learningItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LearningItemFindUniqueOrThrowArgs>(args: SelectSubset<T, LearningItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LearningItemClient<$Result.GetResult<Prisma.$LearningItemPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first LearningItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningItemFindFirstArgs} args - Arguments to find a LearningItem
     * @example
     * // Get one LearningItem
     * const learningItem = await prisma.learningItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LearningItemFindFirstArgs>(args?: SelectSubset<T, LearningItemFindFirstArgs<ExtArgs>>): Prisma__LearningItemClient<$Result.GetResult<Prisma.$LearningItemPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first LearningItem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningItemFindFirstOrThrowArgs} args - Arguments to find a LearningItem
     * @example
     * // Get one LearningItem
     * const learningItem = await prisma.learningItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LearningItemFindFirstOrThrowArgs>(args?: SelectSubset<T, LearningItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__LearningItemClient<$Result.GetResult<Prisma.$LearningItemPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more LearningItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all LearningItems
     * const learningItems = await prisma.learningItem.findMany()
     * 
     * // Get first 10 LearningItems
     * const learningItems = await prisma.learningItem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const learningItemWithIdOnly = await prisma.learningItem.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LearningItemFindManyArgs>(args?: SelectSubset<T, LearningItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LearningItemPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a LearningItem.
     * @param {LearningItemCreateArgs} args - Arguments to create a LearningItem.
     * @example
     * // Create one LearningItem
     * const LearningItem = await prisma.learningItem.create({
     *   data: {
     *     // ... data to create a LearningItem
     *   }
     * })
     * 
     */
    create<T extends LearningItemCreateArgs>(args: SelectSubset<T, LearningItemCreateArgs<ExtArgs>>): Prisma__LearningItemClient<$Result.GetResult<Prisma.$LearningItemPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many LearningItems.
     * @param {LearningItemCreateManyArgs} args - Arguments to create many LearningItems.
     * @example
     * // Create many LearningItems
     * const learningItem = await prisma.learningItem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LearningItemCreateManyArgs>(args?: SelectSubset<T, LearningItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many LearningItems and returns the data saved in the database.
     * @param {LearningItemCreateManyAndReturnArgs} args - Arguments to create many LearningItems.
     * @example
     * // Create many LearningItems
     * const learningItem = await prisma.learningItem.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many LearningItems and only return the `id`
     * const learningItemWithIdOnly = await prisma.learningItem.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LearningItemCreateManyAndReturnArgs>(args?: SelectSubset<T, LearningItemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LearningItemPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a LearningItem.
     * @param {LearningItemDeleteArgs} args - Arguments to delete one LearningItem.
     * @example
     * // Delete one LearningItem
     * const LearningItem = await prisma.learningItem.delete({
     *   where: {
     *     // ... filter to delete one LearningItem
     *   }
     * })
     * 
     */
    delete<T extends LearningItemDeleteArgs>(args: SelectSubset<T, LearningItemDeleteArgs<ExtArgs>>): Prisma__LearningItemClient<$Result.GetResult<Prisma.$LearningItemPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one LearningItem.
     * @param {LearningItemUpdateArgs} args - Arguments to update one LearningItem.
     * @example
     * // Update one LearningItem
     * const learningItem = await prisma.learningItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LearningItemUpdateArgs>(args: SelectSubset<T, LearningItemUpdateArgs<ExtArgs>>): Prisma__LearningItemClient<$Result.GetResult<Prisma.$LearningItemPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more LearningItems.
     * @param {LearningItemDeleteManyArgs} args - Arguments to filter LearningItems to delete.
     * @example
     * // Delete a few LearningItems
     * const { count } = await prisma.learningItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LearningItemDeleteManyArgs>(args?: SelectSubset<T, LearningItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LearningItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many LearningItems
     * const learningItem = await prisma.learningItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LearningItemUpdateManyArgs>(args: SelectSubset<T, LearningItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one LearningItem.
     * @param {LearningItemUpsertArgs} args - Arguments to update or create a LearningItem.
     * @example
     * // Update or create a LearningItem
     * const learningItem = await prisma.learningItem.upsert({
     *   create: {
     *     // ... data to create a LearningItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the LearningItem we want to update
     *   }
     * })
     */
    upsert<T extends LearningItemUpsertArgs>(args: SelectSubset<T, LearningItemUpsertArgs<ExtArgs>>): Prisma__LearningItemClient<$Result.GetResult<Prisma.$LearningItemPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of LearningItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningItemCountArgs} args - Arguments to filter LearningItems to count.
     * @example
     * // Count the number of LearningItems
     * const count = await prisma.learningItem.count({
     *   where: {
     *     // ... the filter for the LearningItems we want to count
     *   }
     * })
    **/
    count<T extends LearningItemCountArgs>(
      args?: Subset<T, LearningItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LearningItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a LearningItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LearningItemAggregateArgs>(args: Subset<T, LearningItemAggregateArgs>): Prisma.PrismaPromise<GetLearningItemAggregateType<T>>

    /**
     * Group by LearningItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningItemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LearningItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LearningItemGroupByArgs['orderBy'] }
        : { orderBy?: LearningItemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LearningItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLearningItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the LearningItem model
   */
  readonly fields: LearningItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for LearningItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LearningItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    session<T extends LearningItem$sessionArgs<ExtArgs> = {}>(args?: Subset<T, LearningItem$sessionArgs<ExtArgs>>): Prisma__LearningSessionClient<$Result.GetResult<Prisma.$LearningSessionPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    feedItem<T extends LearningItem$feedItemArgs<ExtArgs> = {}>(args?: Subset<T, LearningItem$feedItemArgs<ExtArgs>>): Prisma__FeedItemClient<$Result.GetResult<Prisma.$FeedItemPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    interactions<T extends LearningItem$interactionsArgs<ExtArgs> = {}>(args?: Subset<T, LearningItem$interactionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserInteractionPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the LearningItem model
   */ 
  interface LearningItemFieldRefs {
    readonly id: FieldRef<"LearningItem", 'String'>
    readonly userId: FieldRef<"LearningItem", 'String'>
    readonly sessionId: FieldRef<"LearningItem", 'String'>
    readonly type: FieldRef<"LearningItem", 'LearningItemType'>
    readonly topic: FieldRef<"LearningItem", 'String'>
    readonly difficulty: FieldRef<"LearningItem", 'Int'>
    readonly payload: FieldRef<"LearningItem", 'Json'>
    readonly isPublished: FieldRef<"LearningItem", 'Boolean'>
    readonly engagementScore: FieldRef<"LearningItem", 'Float'>
    readonly masteredByUser: FieldRef<"LearningItem", 'Boolean'>
    readonly lastInteractedAt: FieldRef<"LearningItem", 'DateTime'>
    readonly nextReviewAt: FieldRef<"LearningItem", 'DateTime'>
    readonly reviewInterval: FieldRef<"LearningItem", 'Int'>
    readonly reviewCount: FieldRef<"LearningItem", 'Int'>
    readonly createdAt: FieldRef<"LearningItem", 'DateTime'>
    readonly updatedAt: FieldRef<"LearningItem", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * LearningItem findUnique
   */
  export type LearningItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningItem
     */
    select?: LearningItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningItemInclude<ExtArgs> | null
    /**
     * Filter, which LearningItem to fetch.
     */
    where: LearningItemWhereUniqueInput
  }

  /**
   * LearningItem findUniqueOrThrow
   */
  export type LearningItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningItem
     */
    select?: LearningItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningItemInclude<ExtArgs> | null
    /**
     * Filter, which LearningItem to fetch.
     */
    where: LearningItemWhereUniqueInput
  }

  /**
   * LearningItem findFirst
   */
  export type LearningItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningItem
     */
    select?: LearningItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningItemInclude<ExtArgs> | null
    /**
     * Filter, which LearningItem to fetch.
     */
    where?: LearningItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LearningItems to fetch.
     */
    orderBy?: LearningItemOrderByWithRelationInput | LearningItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LearningItems.
     */
    cursor?: LearningItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LearningItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LearningItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LearningItems.
     */
    distinct?: LearningItemScalarFieldEnum | LearningItemScalarFieldEnum[]
  }

  /**
   * LearningItem findFirstOrThrow
   */
  export type LearningItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningItem
     */
    select?: LearningItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningItemInclude<ExtArgs> | null
    /**
     * Filter, which LearningItem to fetch.
     */
    where?: LearningItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LearningItems to fetch.
     */
    orderBy?: LearningItemOrderByWithRelationInput | LearningItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LearningItems.
     */
    cursor?: LearningItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LearningItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LearningItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LearningItems.
     */
    distinct?: LearningItemScalarFieldEnum | LearningItemScalarFieldEnum[]
  }

  /**
   * LearningItem findMany
   */
  export type LearningItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningItem
     */
    select?: LearningItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningItemInclude<ExtArgs> | null
    /**
     * Filter, which LearningItems to fetch.
     */
    where?: LearningItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LearningItems to fetch.
     */
    orderBy?: LearningItemOrderByWithRelationInput | LearningItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing LearningItems.
     */
    cursor?: LearningItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LearningItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LearningItems.
     */
    skip?: number
    distinct?: LearningItemScalarFieldEnum | LearningItemScalarFieldEnum[]
  }

  /**
   * LearningItem create
   */
  export type LearningItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningItem
     */
    select?: LearningItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningItemInclude<ExtArgs> | null
    /**
     * The data needed to create a LearningItem.
     */
    data: XOR<LearningItemCreateInput, LearningItemUncheckedCreateInput>
  }

  /**
   * LearningItem createMany
   */
  export type LearningItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many LearningItems.
     */
    data: LearningItemCreateManyInput | LearningItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LearningItem createManyAndReturn
   */
  export type LearningItemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningItem
     */
    select?: LearningItemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many LearningItems.
     */
    data: LearningItemCreateManyInput | LearningItemCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningItemIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * LearningItem update
   */
  export type LearningItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningItem
     */
    select?: LearningItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningItemInclude<ExtArgs> | null
    /**
     * The data needed to update a LearningItem.
     */
    data: XOR<LearningItemUpdateInput, LearningItemUncheckedUpdateInput>
    /**
     * Choose, which LearningItem to update.
     */
    where: LearningItemWhereUniqueInput
  }

  /**
   * LearningItem updateMany
   */
  export type LearningItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update LearningItems.
     */
    data: XOR<LearningItemUpdateManyMutationInput, LearningItemUncheckedUpdateManyInput>
    /**
     * Filter which LearningItems to update
     */
    where?: LearningItemWhereInput
  }

  /**
   * LearningItem upsert
   */
  export type LearningItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningItem
     */
    select?: LearningItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningItemInclude<ExtArgs> | null
    /**
     * The filter to search for the LearningItem to update in case it exists.
     */
    where: LearningItemWhereUniqueInput
    /**
     * In case the LearningItem found by the `where` argument doesn't exist, create a new LearningItem with this data.
     */
    create: XOR<LearningItemCreateInput, LearningItemUncheckedCreateInput>
    /**
     * In case the LearningItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LearningItemUpdateInput, LearningItemUncheckedUpdateInput>
  }

  /**
   * LearningItem delete
   */
  export type LearningItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningItem
     */
    select?: LearningItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningItemInclude<ExtArgs> | null
    /**
     * Filter which LearningItem to delete.
     */
    where: LearningItemWhereUniqueInput
  }

  /**
   * LearningItem deleteMany
   */
  export type LearningItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LearningItems to delete
     */
    where?: LearningItemWhereInput
  }

  /**
   * LearningItem.session
   */
  export type LearningItem$sessionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningSession
     */
    select?: LearningSessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningSessionInclude<ExtArgs> | null
    where?: LearningSessionWhereInput
  }

  /**
   * LearningItem.feedItem
   */
  export type LearningItem$feedItemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FeedItem
     */
    select?: FeedItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeedItemInclude<ExtArgs> | null
    where?: FeedItemWhereInput
  }

  /**
   * LearningItem.interactions
   */
  export type LearningItem$interactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserInteraction
     */
    select?: UserInteractionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInteractionInclude<ExtArgs> | null
    where?: UserInteractionWhereInput
    orderBy?: UserInteractionOrderByWithRelationInput | UserInteractionOrderByWithRelationInput[]
    cursor?: UserInteractionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserInteractionScalarFieldEnum | UserInteractionScalarFieldEnum[]
  }

  /**
   * LearningItem without action
   */
  export type LearningItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningItem
     */
    select?: LearningItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningItemInclude<ExtArgs> | null
  }


  /**
   * Model FeedItem
   */

  export type AggregateFeedItem = {
    _count: FeedItemCountAggregateOutputType | null
    _min: FeedItemMinAggregateOutputType | null
    _max: FeedItemMaxAggregateOutputType | null
  }

  export type FeedItemMinAggregateOutputType = {
    id: string | null
    learningItemId: string | null
    publishedByUserId: string | null
    publishedAt: Date | null
    createdAt: Date | null
    userId: string | null
  }

  export type FeedItemMaxAggregateOutputType = {
    id: string | null
    learningItemId: string | null
    publishedByUserId: string | null
    publishedAt: Date | null
    createdAt: Date | null
    userId: string | null
  }

  export type FeedItemCountAggregateOutputType = {
    id: number
    learningItemId: number
    publishedByUserId: number
    publishedAt: number
    createdAt: number
    userId: number
    _all: number
  }


  export type FeedItemMinAggregateInputType = {
    id?: true
    learningItemId?: true
    publishedByUserId?: true
    publishedAt?: true
    createdAt?: true
    userId?: true
  }

  export type FeedItemMaxAggregateInputType = {
    id?: true
    learningItemId?: true
    publishedByUserId?: true
    publishedAt?: true
    createdAt?: true
    userId?: true
  }

  export type FeedItemCountAggregateInputType = {
    id?: true
    learningItemId?: true
    publishedByUserId?: true
    publishedAt?: true
    createdAt?: true
    userId?: true
    _all?: true
  }

  export type FeedItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FeedItem to aggregate.
     */
    where?: FeedItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FeedItems to fetch.
     */
    orderBy?: FeedItemOrderByWithRelationInput | FeedItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FeedItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FeedItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FeedItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned FeedItems
    **/
    _count?: true | FeedItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FeedItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FeedItemMaxAggregateInputType
  }

  export type GetFeedItemAggregateType<T extends FeedItemAggregateArgs> = {
        [P in keyof T & keyof AggregateFeedItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFeedItem[P]>
      : GetScalarType<T[P], AggregateFeedItem[P]>
  }




  export type FeedItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FeedItemWhereInput
    orderBy?: FeedItemOrderByWithAggregationInput | FeedItemOrderByWithAggregationInput[]
    by: FeedItemScalarFieldEnum[] | FeedItemScalarFieldEnum
    having?: FeedItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FeedItemCountAggregateInputType | true
    _min?: FeedItemMinAggregateInputType
    _max?: FeedItemMaxAggregateInputType
  }

  export type FeedItemGroupByOutputType = {
    id: string
    learningItemId: string
    publishedByUserId: string | null
    publishedAt: Date
    createdAt: Date
    userId: string | null
    _count: FeedItemCountAggregateOutputType | null
    _min: FeedItemMinAggregateOutputType | null
    _max: FeedItemMaxAggregateOutputType | null
  }

  type GetFeedItemGroupByPayload<T extends FeedItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FeedItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FeedItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FeedItemGroupByOutputType[P]>
            : GetScalarType<T[P], FeedItemGroupByOutputType[P]>
        }
      >
    >


  export type FeedItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    learningItemId?: boolean
    publishedByUserId?: boolean
    publishedAt?: boolean
    createdAt?: boolean
    userId?: boolean
    learningItem?: boolean | LearningItemDefaultArgs<ExtArgs>
    user?: boolean | FeedItem$userArgs<ExtArgs>
  }, ExtArgs["result"]["feedItem"]>

  export type FeedItemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    learningItemId?: boolean
    publishedByUserId?: boolean
    publishedAt?: boolean
    createdAt?: boolean
    userId?: boolean
    learningItem?: boolean | LearningItemDefaultArgs<ExtArgs>
    user?: boolean | FeedItem$userArgs<ExtArgs>
  }, ExtArgs["result"]["feedItem"]>

  export type FeedItemSelectScalar = {
    id?: boolean
    learningItemId?: boolean
    publishedByUserId?: boolean
    publishedAt?: boolean
    createdAt?: boolean
    userId?: boolean
  }

  export type FeedItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    learningItem?: boolean | LearningItemDefaultArgs<ExtArgs>
    user?: boolean | FeedItem$userArgs<ExtArgs>
  }
  export type FeedItemIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    learningItem?: boolean | LearningItemDefaultArgs<ExtArgs>
    user?: boolean | FeedItem$userArgs<ExtArgs>
  }

  export type $FeedItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "FeedItem"
    objects: {
      learningItem: Prisma.$LearningItemPayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      learningItemId: string
      publishedByUserId: string | null
      publishedAt: Date
      createdAt: Date
      userId: string | null
    }, ExtArgs["result"]["feedItem"]>
    composites: {}
  }

  type FeedItemGetPayload<S extends boolean | null | undefined | FeedItemDefaultArgs> = $Result.GetResult<Prisma.$FeedItemPayload, S>

  type FeedItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<FeedItemFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: FeedItemCountAggregateInputType | true
    }

  export interface FeedItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['FeedItem'], meta: { name: 'FeedItem' } }
    /**
     * Find zero or one FeedItem that matches the filter.
     * @param {FeedItemFindUniqueArgs} args - Arguments to find a FeedItem
     * @example
     * // Get one FeedItem
     * const feedItem = await prisma.feedItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FeedItemFindUniqueArgs>(args: SelectSubset<T, FeedItemFindUniqueArgs<ExtArgs>>): Prisma__FeedItemClient<$Result.GetResult<Prisma.$FeedItemPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one FeedItem that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {FeedItemFindUniqueOrThrowArgs} args - Arguments to find a FeedItem
     * @example
     * // Get one FeedItem
     * const feedItem = await prisma.feedItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FeedItemFindUniqueOrThrowArgs>(args: SelectSubset<T, FeedItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FeedItemClient<$Result.GetResult<Prisma.$FeedItemPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first FeedItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FeedItemFindFirstArgs} args - Arguments to find a FeedItem
     * @example
     * // Get one FeedItem
     * const feedItem = await prisma.feedItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FeedItemFindFirstArgs>(args?: SelectSubset<T, FeedItemFindFirstArgs<ExtArgs>>): Prisma__FeedItemClient<$Result.GetResult<Prisma.$FeedItemPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first FeedItem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FeedItemFindFirstOrThrowArgs} args - Arguments to find a FeedItem
     * @example
     * // Get one FeedItem
     * const feedItem = await prisma.feedItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FeedItemFindFirstOrThrowArgs>(args?: SelectSubset<T, FeedItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__FeedItemClient<$Result.GetResult<Prisma.$FeedItemPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more FeedItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FeedItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all FeedItems
     * const feedItems = await prisma.feedItem.findMany()
     * 
     * // Get first 10 FeedItems
     * const feedItems = await prisma.feedItem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const feedItemWithIdOnly = await prisma.feedItem.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FeedItemFindManyArgs>(args?: SelectSubset<T, FeedItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FeedItemPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a FeedItem.
     * @param {FeedItemCreateArgs} args - Arguments to create a FeedItem.
     * @example
     * // Create one FeedItem
     * const FeedItem = await prisma.feedItem.create({
     *   data: {
     *     // ... data to create a FeedItem
     *   }
     * })
     * 
     */
    create<T extends FeedItemCreateArgs>(args: SelectSubset<T, FeedItemCreateArgs<ExtArgs>>): Prisma__FeedItemClient<$Result.GetResult<Prisma.$FeedItemPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many FeedItems.
     * @param {FeedItemCreateManyArgs} args - Arguments to create many FeedItems.
     * @example
     * // Create many FeedItems
     * const feedItem = await prisma.feedItem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FeedItemCreateManyArgs>(args?: SelectSubset<T, FeedItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many FeedItems and returns the data saved in the database.
     * @param {FeedItemCreateManyAndReturnArgs} args - Arguments to create many FeedItems.
     * @example
     * // Create many FeedItems
     * const feedItem = await prisma.feedItem.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many FeedItems and only return the `id`
     * const feedItemWithIdOnly = await prisma.feedItem.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FeedItemCreateManyAndReturnArgs>(args?: SelectSubset<T, FeedItemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FeedItemPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a FeedItem.
     * @param {FeedItemDeleteArgs} args - Arguments to delete one FeedItem.
     * @example
     * // Delete one FeedItem
     * const FeedItem = await prisma.feedItem.delete({
     *   where: {
     *     // ... filter to delete one FeedItem
     *   }
     * })
     * 
     */
    delete<T extends FeedItemDeleteArgs>(args: SelectSubset<T, FeedItemDeleteArgs<ExtArgs>>): Prisma__FeedItemClient<$Result.GetResult<Prisma.$FeedItemPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one FeedItem.
     * @param {FeedItemUpdateArgs} args - Arguments to update one FeedItem.
     * @example
     * // Update one FeedItem
     * const feedItem = await prisma.feedItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FeedItemUpdateArgs>(args: SelectSubset<T, FeedItemUpdateArgs<ExtArgs>>): Prisma__FeedItemClient<$Result.GetResult<Prisma.$FeedItemPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more FeedItems.
     * @param {FeedItemDeleteManyArgs} args - Arguments to filter FeedItems to delete.
     * @example
     * // Delete a few FeedItems
     * const { count } = await prisma.feedItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FeedItemDeleteManyArgs>(args?: SelectSubset<T, FeedItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FeedItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FeedItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many FeedItems
     * const feedItem = await prisma.feedItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FeedItemUpdateManyArgs>(args: SelectSubset<T, FeedItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one FeedItem.
     * @param {FeedItemUpsertArgs} args - Arguments to update or create a FeedItem.
     * @example
     * // Update or create a FeedItem
     * const feedItem = await prisma.feedItem.upsert({
     *   create: {
     *     // ... data to create a FeedItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the FeedItem we want to update
     *   }
     * })
     */
    upsert<T extends FeedItemUpsertArgs>(args: SelectSubset<T, FeedItemUpsertArgs<ExtArgs>>): Prisma__FeedItemClient<$Result.GetResult<Prisma.$FeedItemPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of FeedItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FeedItemCountArgs} args - Arguments to filter FeedItems to count.
     * @example
     * // Count the number of FeedItems
     * const count = await prisma.feedItem.count({
     *   where: {
     *     // ... the filter for the FeedItems we want to count
     *   }
     * })
    **/
    count<T extends FeedItemCountArgs>(
      args?: Subset<T, FeedItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FeedItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a FeedItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FeedItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FeedItemAggregateArgs>(args: Subset<T, FeedItemAggregateArgs>): Prisma.PrismaPromise<GetFeedItemAggregateType<T>>

    /**
     * Group by FeedItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FeedItemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FeedItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FeedItemGroupByArgs['orderBy'] }
        : { orderBy?: FeedItemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FeedItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFeedItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the FeedItem model
   */
  readonly fields: FeedItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for FeedItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FeedItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    learningItem<T extends LearningItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, LearningItemDefaultArgs<ExtArgs>>): Prisma__LearningItemClient<$Result.GetResult<Prisma.$LearningItemPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    user<T extends FeedItem$userArgs<ExtArgs> = {}>(args?: Subset<T, FeedItem$userArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the FeedItem model
   */ 
  interface FeedItemFieldRefs {
    readonly id: FieldRef<"FeedItem", 'String'>
    readonly learningItemId: FieldRef<"FeedItem", 'String'>
    readonly publishedByUserId: FieldRef<"FeedItem", 'String'>
    readonly publishedAt: FieldRef<"FeedItem", 'DateTime'>
    readonly createdAt: FieldRef<"FeedItem", 'DateTime'>
    readonly userId: FieldRef<"FeedItem", 'String'>
  }
    

  // Custom InputTypes
  /**
   * FeedItem findUnique
   */
  export type FeedItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FeedItem
     */
    select?: FeedItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeedItemInclude<ExtArgs> | null
    /**
     * Filter, which FeedItem to fetch.
     */
    where: FeedItemWhereUniqueInput
  }

  /**
   * FeedItem findUniqueOrThrow
   */
  export type FeedItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FeedItem
     */
    select?: FeedItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeedItemInclude<ExtArgs> | null
    /**
     * Filter, which FeedItem to fetch.
     */
    where: FeedItemWhereUniqueInput
  }

  /**
   * FeedItem findFirst
   */
  export type FeedItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FeedItem
     */
    select?: FeedItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeedItemInclude<ExtArgs> | null
    /**
     * Filter, which FeedItem to fetch.
     */
    where?: FeedItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FeedItems to fetch.
     */
    orderBy?: FeedItemOrderByWithRelationInput | FeedItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FeedItems.
     */
    cursor?: FeedItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FeedItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FeedItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FeedItems.
     */
    distinct?: FeedItemScalarFieldEnum | FeedItemScalarFieldEnum[]
  }

  /**
   * FeedItem findFirstOrThrow
   */
  export type FeedItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FeedItem
     */
    select?: FeedItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeedItemInclude<ExtArgs> | null
    /**
     * Filter, which FeedItem to fetch.
     */
    where?: FeedItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FeedItems to fetch.
     */
    orderBy?: FeedItemOrderByWithRelationInput | FeedItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FeedItems.
     */
    cursor?: FeedItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FeedItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FeedItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FeedItems.
     */
    distinct?: FeedItemScalarFieldEnum | FeedItemScalarFieldEnum[]
  }

  /**
   * FeedItem findMany
   */
  export type FeedItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FeedItem
     */
    select?: FeedItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeedItemInclude<ExtArgs> | null
    /**
     * Filter, which FeedItems to fetch.
     */
    where?: FeedItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FeedItems to fetch.
     */
    orderBy?: FeedItemOrderByWithRelationInput | FeedItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing FeedItems.
     */
    cursor?: FeedItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FeedItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FeedItems.
     */
    skip?: number
    distinct?: FeedItemScalarFieldEnum | FeedItemScalarFieldEnum[]
  }

  /**
   * FeedItem create
   */
  export type FeedItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FeedItem
     */
    select?: FeedItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeedItemInclude<ExtArgs> | null
    /**
     * The data needed to create a FeedItem.
     */
    data: XOR<FeedItemCreateInput, FeedItemUncheckedCreateInput>
  }

  /**
   * FeedItem createMany
   */
  export type FeedItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many FeedItems.
     */
    data: FeedItemCreateManyInput | FeedItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * FeedItem createManyAndReturn
   */
  export type FeedItemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FeedItem
     */
    select?: FeedItemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many FeedItems.
     */
    data: FeedItemCreateManyInput | FeedItemCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeedItemIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * FeedItem update
   */
  export type FeedItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FeedItem
     */
    select?: FeedItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeedItemInclude<ExtArgs> | null
    /**
     * The data needed to update a FeedItem.
     */
    data: XOR<FeedItemUpdateInput, FeedItemUncheckedUpdateInput>
    /**
     * Choose, which FeedItem to update.
     */
    where: FeedItemWhereUniqueInput
  }

  /**
   * FeedItem updateMany
   */
  export type FeedItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update FeedItems.
     */
    data: XOR<FeedItemUpdateManyMutationInput, FeedItemUncheckedUpdateManyInput>
    /**
     * Filter which FeedItems to update
     */
    where?: FeedItemWhereInput
  }

  /**
   * FeedItem upsert
   */
  export type FeedItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FeedItem
     */
    select?: FeedItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeedItemInclude<ExtArgs> | null
    /**
     * The filter to search for the FeedItem to update in case it exists.
     */
    where: FeedItemWhereUniqueInput
    /**
     * In case the FeedItem found by the `where` argument doesn't exist, create a new FeedItem with this data.
     */
    create: XOR<FeedItemCreateInput, FeedItemUncheckedCreateInput>
    /**
     * In case the FeedItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FeedItemUpdateInput, FeedItemUncheckedUpdateInput>
  }

  /**
   * FeedItem delete
   */
  export type FeedItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FeedItem
     */
    select?: FeedItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeedItemInclude<ExtArgs> | null
    /**
     * Filter which FeedItem to delete.
     */
    where: FeedItemWhereUniqueInput
  }

  /**
   * FeedItem deleteMany
   */
  export type FeedItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FeedItems to delete
     */
    where?: FeedItemWhereInput
  }

  /**
   * FeedItem.user
   */
  export type FeedItem$userArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
  }

  /**
   * FeedItem without action
   */
  export type FeedItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FeedItem
     */
    select?: FeedItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FeedItemInclude<ExtArgs> | null
  }


  /**
   * Model UserInteraction
   */

  export type AggregateUserInteraction = {
    _count: UserInteractionCountAggregateOutputType | null
    _min: UserInteractionMinAggregateOutputType | null
    _max: UserInteractionMaxAggregateOutputType | null
  }

  export type UserInteractionMinAggregateOutputType = {
    id: string | null
    userId: string | null
    learningItemId: string | null
    type: $Enums.InteractionType | null
    isCorrect: boolean | null
    createdAt: Date | null
  }

  export type UserInteractionMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    learningItemId: string | null
    type: $Enums.InteractionType | null
    isCorrect: boolean | null
    createdAt: Date | null
  }

  export type UserInteractionCountAggregateOutputType = {
    id: number
    userId: number
    learningItemId: number
    type: number
    isCorrect: number
    createdAt: number
    _all: number
  }


  export type UserInteractionMinAggregateInputType = {
    id?: true
    userId?: true
    learningItemId?: true
    type?: true
    isCorrect?: true
    createdAt?: true
  }

  export type UserInteractionMaxAggregateInputType = {
    id?: true
    userId?: true
    learningItemId?: true
    type?: true
    isCorrect?: true
    createdAt?: true
  }

  export type UserInteractionCountAggregateInputType = {
    id?: true
    userId?: true
    learningItemId?: true
    type?: true
    isCorrect?: true
    createdAt?: true
    _all?: true
  }

  export type UserInteractionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserInteraction to aggregate.
     */
    where?: UserInteractionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserInteractions to fetch.
     */
    orderBy?: UserInteractionOrderByWithRelationInput | UserInteractionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserInteractionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserInteractions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserInteractions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned UserInteractions
    **/
    _count?: true | UserInteractionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserInteractionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserInteractionMaxAggregateInputType
  }

  export type GetUserInteractionAggregateType<T extends UserInteractionAggregateArgs> = {
        [P in keyof T & keyof AggregateUserInteraction]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUserInteraction[P]>
      : GetScalarType<T[P], AggregateUserInteraction[P]>
  }




  export type UserInteractionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserInteractionWhereInput
    orderBy?: UserInteractionOrderByWithAggregationInput | UserInteractionOrderByWithAggregationInput[]
    by: UserInteractionScalarFieldEnum[] | UserInteractionScalarFieldEnum
    having?: UserInteractionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserInteractionCountAggregateInputType | true
    _min?: UserInteractionMinAggregateInputType
    _max?: UserInteractionMaxAggregateInputType
  }

  export type UserInteractionGroupByOutputType = {
    id: string
    userId: string
    learningItemId: string
    type: $Enums.InteractionType
    isCorrect: boolean | null
    createdAt: Date
    _count: UserInteractionCountAggregateOutputType | null
    _min: UserInteractionMinAggregateOutputType | null
    _max: UserInteractionMaxAggregateOutputType | null
  }

  type GetUserInteractionGroupByPayload<T extends UserInteractionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserInteractionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserInteractionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserInteractionGroupByOutputType[P]>
            : GetScalarType<T[P], UserInteractionGroupByOutputType[P]>
        }
      >
    >


  export type UserInteractionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    learningItemId?: boolean
    type?: boolean
    isCorrect?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    learningItem?: boolean | LearningItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userInteraction"]>

  export type UserInteractionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    learningItemId?: boolean
    type?: boolean
    isCorrect?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    learningItem?: boolean | LearningItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userInteraction"]>

  export type UserInteractionSelectScalar = {
    id?: boolean
    userId?: boolean
    learningItemId?: boolean
    type?: boolean
    isCorrect?: boolean
    createdAt?: boolean
  }

  export type UserInteractionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    learningItem?: boolean | LearningItemDefaultArgs<ExtArgs>
  }
  export type UserInteractionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    learningItem?: boolean | LearningItemDefaultArgs<ExtArgs>
  }

  export type $UserInteractionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "UserInteraction"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      learningItem: Prisma.$LearningItemPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      learningItemId: string
      type: $Enums.InteractionType
      isCorrect: boolean | null
      createdAt: Date
    }, ExtArgs["result"]["userInteraction"]>
    composites: {}
  }

  type UserInteractionGetPayload<S extends boolean | null | undefined | UserInteractionDefaultArgs> = $Result.GetResult<Prisma.$UserInteractionPayload, S>

  type UserInteractionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UserInteractionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UserInteractionCountAggregateInputType | true
    }

  export interface UserInteractionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['UserInteraction'], meta: { name: 'UserInteraction' } }
    /**
     * Find zero or one UserInteraction that matches the filter.
     * @param {UserInteractionFindUniqueArgs} args - Arguments to find a UserInteraction
     * @example
     * // Get one UserInteraction
     * const userInteraction = await prisma.userInteraction.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserInteractionFindUniqueArgs>(args: SelectSubset<T, UserInteractionFindUniqueArgs<ExtArgs>>): Prisma__UserInteractionClient<$Result.GetResult<Prisma.$UserInteractionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one UserInteraction that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {UserInteractionFindUniqueOrThrowArgs} args - Arguments to find a UserInteraction
     * @example
     * // Get one UserInteraction
     * const userInteraction = await prisma.userInteraction.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserInteractionFindUniqueOrThrowArgs>(args: SelectSubset<T, UserInteractionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserInteractionClient<$Result.GetResult<Prisma.$UserInteractionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first UserInteraction that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserInteractionFindFirstArgs} args - Arguments to find a UserInteraction
     * @example
     * // Get one UserInteraction
     * const userInteraction = await prisma.userInteraction.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserInteractionFindFirstArgs>(args?: SelectSubset<T, UserInteractionFindFirstArgs<ExtArgs>>): Prisma__UserInteractionClient<$Result.GetResult<Prisma.$UserInteractionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first UserInteraction that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserInteractionFindFirstOrThrowArgs} args - Arguments to find a UserInteraction
     * @example
     * // Get one UserInteraction
     * const userInteraction = await prisma.userInteraction.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserInteractionFindFirstOrThrowArgs>(args?: SelectSubset<T, UserInteractionFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserInteractionClient<$Result.GetResult<Prisma.$UserInteractionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more UserInteractions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserInteractionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all UserInteractions
     * const userInteractions = await prisma.userInteraction.findMany()
     * 
     * // Get first 10 UserInteractions
     * const userInteractions = await prisma.userInteraction.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userInteractionWithIdOnly = await prisma.userInteraction.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserInteractionFindManyArgs>(args?: SelectSubset<T, UserInteractionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserInteractionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a UserInteraction.
     * @param {UserInteractionCreateArgs} args - Arguments to create a UserInteraction.
     * @example
     * // Create one UserInteraction
     * const UserInteraction = await prisma.userInteraction.create({
     *   data: {
     *     // ... data to create a UserInteraction
     *   }
     * })
     * 
     */
    create<T extends UserInteractionCreateArgs>(args: SelectSubset<T, UserInteractionCreateArgs<ExtArgs>>): Prisma__UserInteractionClient<$Result.GetResult<Prisma.$UserInteractionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many UserInteractions.
     * @param {UserInteractionCreateManyArgs} args - Arguments to create many UserInteractions.
     * @example
     * // Create many UserInteractions
     * const userInteraction = await prisma.userInteraction.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserInteractionCreateManyArgs>(args?: SelectSubset<T, UserInteractionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many UserInteractions and returns the data saved in the database.
     * @param {UserInteractionCreateManyAndReturnArgs} args - Arguments to create many UserInteractions.
     * @example
     * // Create many UserInteractions
     * const userInteraction = await prisma.userInteraction.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many UserInteractions and only return the `id`
     * const userInteractionWithIdOnly = await prisma.userInteraction.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserInteractionCreateManyAndReturnArgs>(args?: SelectSubset<T, UserInteractionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserInteractionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a UserInteraction.
     * @param {UserInteractionDeleteArgs} args - Arguments to delete one UserInteraction.
     * @example
     * // Delete one UserInteraction
     * const UserInteraction = await prisma.userInteraction.delete({
     *   where: {
     *     // ... filter to delete one UserInteraction
     *   }
     * })
     * 
     */
    delete<T extends UserInteractionDeleteArgs>(args: SelectSubset<T, UserInteractionDeleteArgs<ExtArgs>>): Prisma__UserInteractionClient<$Result.GetResult<Prisma.$UserInteractionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one UserInteraction.
     * @param {UserInteractionUpdateArgs} args - Arguments to update one UserInteraction.
     * @example
     * // Update one UserInteraction
     * const userInteraction = await prisma.userInteraction.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserInteractionUpdateArgs>(args: SelectSubset<T, UserInteractionUpdateArgs<ExtArgs>>): Prisma__UserInteractionClient<$Result.GetResult<Prisma.$UserInteractionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more UserInteractions.
     * @param {UserInteractionDeleteManyArgs} args - Arguments to filter UserInteractions to delete.
     * @example
     * // Delete a few UserInteractions
     * const { count } = await prisma.userInteraction.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserInteractionDeleteManyArgs>(args?: SelectSubset<T, UserInteractionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserInteractions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserInteractionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many UserInteractions
     * const userInteraction = await prisma.userInteraction.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserInteractionUpdateManyArgs>(args: SelectSubset<T, UserInteractionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one UserInteraction.
     * @param {UserInteractionUpsertArgs} args - Arguments to update or create a UserInteraction.
     * @example
     * // Update or create a UserInteraction
     * const userInteraction = await prisma.userInteraction.upsert({
     *   create: {
     *     // ... data to create a UserInteraction
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the UserInteraction we want to update
     *   }
     * })
     */
    upsert<T extends UserInteractionUpsertArgs>(args: SelectSubset<T, UserInteractionUpsertArgs<ExtArgs>>): Prisma__UserInteractionClient<$Result.GetResult<Prisma.$UserInteractionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of UserInteractions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserInteractionCountArgs} args - Arguments to filter UserInteractions to count.
     * @example
     * // Count the number of UserInteractions
     * const count = await prisma.userInteraction.count({
     *   where: {
     *     // ... the filter for the UserInteractions we want to count
     *   }
     * })
    **/
    count<T extends UserInteractionCountArgs>(
      args?: Subset<T, UserInteractionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserInteractionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a UserInteraction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserInteractionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserInteractionAggregateArgs>(args: Subset<T, UserInteractionAggregateArgs>): Prisma.PrismaPromise<GetUserInteractionAggregateType<T>>

    /**
     * Group by UserInteraction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserInteractionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserInteractionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserInteractionGroupByArgs['orderBy'] }
        : { orderBy?: UserInteractionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserInteractionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserInteractionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the UserInteraction model
   */
  readonly fields: UserInteractionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for UserInteraction.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserInteractionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    learningItem<T extends LearningItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, LearningItemDefaultArgs<ExtArgs>>): Prisma__LearningItemClient<$Result.GetResult<Prisma.$LearningItemPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the UserInteraction model
   */ 
  interface UserInteractionFieldRefs {
    readonly id: FieldRef<"UserInteraction", 'String'>
    readonly userId: FieldRef<"UserInteraction", 'String'>
    readonly learningItemId: FieldRef<"UserInteraction", 'String'>
    readonly type: FieldRef<"UserInteraction", 'InteractionType'>
    readonly isCorrect: FieldRef<"UserInteraction", 'Boolean'>
    readonly createdAt: FieldRef<"UserInteraction", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * UserInteraction findUnique
   */
  export type UserInteractionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserInteraction
     */
    select?: UserInteractionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInteractionInclude<ExtArgs> | null
    /**
     * Filter, which UserInteraction to fetch.
     */
    where: UserInteractionWhereUniqueInput
  }

  /**
   * UserInteraction findUniqueOrThrow
   */
  export type UserInteractionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserInteraction
     */
    select?: UserInteractionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInteractionInclude<ExtArgs> | null
    /**
     * Filter, which UserInteraction to fetch.
     */
    where: UserInteractionWhereUniqueInput
  }

  /**
   * UserInteraction findFirst
   */
  export type UserInteractionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserInteraction
     */
    select?: UserInteractionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInteractionInclude<ExtArgs> | null
    /**
     * Filter, which UserInteraction to fetch.
     */
    where?: UserInteractionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserInteractions to fetch.
     */
    orderBy?: UserInteractionOrderByWithRelationInput | UserInteractionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserInteractions.
     */
    cursor?: UserInteractionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserInteractions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserInteractions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserInteractions.
     */
    distinct?: UserInteractionScalarFieldEnum | UserInteractionScalarFieldEnum[]
  }

  /**
   * UserInteraction findFirstOrThrow
   */
  export type UserInteractionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserInteraction
     */
    select?: UserInteractionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInteractionInclude<ExtArgs> | null
    /**
     * Filter, which UserInteraction to fetch.
     */
    where?: UserInteractionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserInteractions to fetch.
     */
    orderBy?: UserInteractionOrderByWithRelationInput | UserInteractionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserInteractions.
     */
    cursor?: UserInteractionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserInteractions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserInteractions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserInteractions.
     */
    distinct?: UserInteractionScalarFieldEnum | UserInteractionScalarFieldEnum[]
  }

  /**
   * UserInteraction findMany
   */
  export type UserInteractionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserInteraction
     */
    select?: UserInteractionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInteractionInclude<ExtArgs> | null
    /**
     * Filter, which UserInteractions to fetch.
     */
    where?: UserInteractionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserInteractions to fetch.
     */
    orderBy?: UserInteractionOrderByWithRelationInput | UserInteractionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing UserInteractions.
     */
    cursor?: UserInteractionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserInteractions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserInteractions.
     */
    skip?: number
    distinct?: UserInteractionScalarFieldEnum | UserInteractionScalarFieldEnum[]
  }

  /**
   * UserInteraction create
   */
  export type UserInteractionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserInteraction
     */
    select?: UserInteractionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInteractionInclude<ExtArgs> | null
    /**
     * The data needed to create a UserInteraction.
     */
    data: XOR<UserInteractionCreateInput, UserInteractionUncheckedCreateInput>
  }

  /**
   * UserInteraction createMany
   */
  export type UserInteractionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many UserInteractions.
     */
    data: UserInteractionCreateManyInput | UserInteractionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * UserInteraction createManyAndReturn
   */
  export type UserInteractionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserInteraction
     */
    select?: UserInteractionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many UserInteractions.
     */
    data: UserInteractionCreateManyInput | UserInteractionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInteractionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * UserInteraction update
   */
  export type UserInteractionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserInteraction
     */
    select?: UserInteractionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInteractionInclude<ExtArgs> | null
    /**
     * The data needed to update a UserInteraction.
     */
    data: XOR<UserInteractionUpdateInput, UserInteractionUncheckedUpdateInput>
    /**
     * Choose, which UserInteraction to update.
     */
    where: UserInteractionWhereUniqueInput
  }

  /**
   * UserInteraction updateMany
   */
  export type UserInteractionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update UserInteractions.
     */
    data: XOR<UserInteractionUpdateManyMutationInput, UserInteractionUncheckedUpdateManyInput>
    /**
     * Filter which UserInteractions to update
     */
    where?: UserInteractionWhereInput
  }

  /**
   * UserInteraction upsert
   */
  export type UserInteractionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserInteraction
     */
    select?: UserInteractionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInteractionInclude<ExtArgs> | null
    /**
     * The filter to search for the UserInteraction to update in case it exists.
     */
    where: UserInteractionWhereUniqueInput
    /**
     * In case the UserInteraction found by the `where` argument doesn't exist, create a new UserInteraction with this data.
     */
    create: XOR<UserInteractionCreateInput, UserInteractionUncheckedCreateInput>
    /**
     * In case the UserInteraction was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserInteractionUpdateInput, UserInteractionUncheckedUpdateInput>
  }

  /**
   * UserInteraction delete
   */
  export type UserInteractionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserInteraction
     */
    select?: UserInteractionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInteractionInclude<ExtArgs> | null
    /**
     * Filter which UserInteraction to delete.
     */
    where: UserInteractionWhereUniqueInput
  }

  /**
   * UserInteraction deleteMany
   */
  export type UserInteractionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserInteractions to delete
     */
    where?: UserInteractionWhereInput
  }

  /**
   * UserInteraction without action
   */
  export type UserInteractionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserInteraction
     */
    select?: UserInteractionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInteractionInclude<ExtArgs> | null
  }


  /**
   * Model LearningStreak
   */

  export type AggregateLearningStreak = {
    _count: LearningStreakCountAggregateOutputType | null
    _avg: LearningStreakAvgAggregateOutputType | null
    _sum: LearningStreakSumAggregateOutputType | null
    _min: LearningStreakMinAggregateOutputType | null
    _max: LearningStreakMaxAggregateOutputType | null
  }

  export type LearningStreakAvgAggregateOutputType = {
    currentStreak: number | null
    longestStreak: number | null
  }

  export type LearningStreakSumAggregateOutputType = {
    currentStreak: number | null
    longestStreak: number | null
  }

  export type LearningStreakMinAggregateOutputType = {
    id: string | null
    userId: string | null
    currentStreak: number | null
    longestStreak: number | null
    lastActiveDate: Date | null
    updatedAt: Date | null
    createdAt: Date | null
  }

  export type LearningStreakMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    currentStreak: number | null
    longestStreak: number | null
    lastActiveDate: Date | null
    updatedAt: Date | null
    createdAt: Date | null
  }

  export type LearningStreakCountAggregateOutputType = {
    id: number
    userId: number
    currentStreak: number
    longestStreak: number
    lastActiveDate: number
    updatedAt: number
    createdAt: number
    _all: number
  }


  export type LearningStreakAvgAggregateInputType = {
    currentStreak?: true
    longestStreak?: true
  }

  export type LearningStreakSumAggregateInputType = {
    currentStreak?: true
    longestStreak?: true
  }

  export type LearningStreakMinAggregateInputType = {
    id?: true
    userId?: true
    currentStreak?: true
    longestStreak?: true
    lastActiveDate?: true
    updatedAt?: true
    createdAt?: true
  }

  export type LearningStreakMaxAggregateInputType = {
    id?: true
    userId?: true
    currentStreak?: true
    longestStreak?: true
    lastActiveDate?: true
    updatedAt?: true
    createdAt?: true
  }

  export type LearningStreakCountAggregateInputType = {
    id?: true
    userId?: true
    currentStreak?: true
    longestStreak?: true
    lastActiveDate?: true
    updatedAt?: true
    createdAt?: true
    _all?: true
  }

  export type LearningStreakAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LearningStreak to aggregate.
     */
    where?: LearningStreakWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LearningStreaks to fetch.
     */
    orderBy?: LearningStreakOrderByWithRelationInput | LearningStreakOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LearningStreakWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LearningStreaks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LearningStreaks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned LearningStreaks
    **/
    _count?: true | LearningStreakCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LearningStreakAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LearningStreakSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LearningStreakMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LearningStreakMaxAggregateInputType
  }

  export type GetLearningStreakAggregateType<T extends LearningStreakAggregateArgs> = {
        [P in keyof T & keyof AggregateLearningStreak]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLearningStreak[P]>
      : GetScalarType<T[P], AggregateLearningStreak[P]>
  }




  export type LearningStreakGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LearningStreakWhereInput
    orderBy?: LearningStreakOrderByWithAggregationInput | LearningStreakOrderByWithAggregationInput[]
    by: LearningStreakScalarFieldEnum[] | LearningStreakScalarFieldEnum
    having?: LearningStreakScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LearningStreakCountAggregateInputType | true
    _avg?: LearningStreakAvgAggregateInputType
    _sum?: LearningStreakSumAggregateInputType
    _min?: LearningStreakMinAggregateInputType
    _max?: LearningStreakMaxAggregateInputType
  }

  export type LearningStreakGroupByOutputType = {
    id: string
    userId: string
    currentStreak: number
    longestStreak: number
    lastActiveDate: Date | null
    updatedAt: Date
    createdAt: Date
    _count: LearningStreakCountAggregateOutputType | null
    _avg: LearningStreakAvgAggregateOutputType | null
    _sum: LearningStreakSumAggregateOutputType | null
    _min: LearningStreakMinAggregateOutputType | null
    _max: LearningStreakMaxAggregateOutputType | null
  }

  type GetLearningStreakGroupByPayload<T extends LearningStreakGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LearningStreakGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LearningStreakGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LearningStreakGroupByOutputType[P]>
            : GetScalarType<T[P], LearningStreakGroupByOutputType[P]>
        }
      >
    >


  export type LearningStreakSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    currentStreak?: boolean
    longestStreak?: boolean
    lastActiveDate?: boolean
    updatedAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["learningStreak"]>

  export type LearningStreakSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    currentStreak?: boolean
    longestStreak?: boolean
    lastActiveDate?: boolean
    updatedAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["learningStreak"]>

  export type LearningStreakSelectScalar = {
    id?: boolean
    userId?: boolean
    currentStreak?: boolean
    longestStreak?: boolean
    lastActiveDate?: boolean
    updatedAt?: boolean
    createdAt?: boolean
  }

  export type LearningStreakInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type LearningStreakIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $LearningStreakPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "LearningStreak"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      currentStreak: number
      longestStreak: number
      lastActiveDate: Date | null
      updatedAt: Date
      createdAt: Date
    }, ExtArgs["result"]["learningStreak"]>
    composites: {}
  }

  type LearningStreakGetPayload<S extends boolean | null | undefined | LearningStreakDefaultArgs> = $Result.GetResult<Prisma.$LearningStreakPayload, S>

  type LearningStreakCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<LearningStreakFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: LearningStreakCountAggregateInputType | true
    }

  export interface LearningStreakDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['LearningStreak'], meta: { name: 'LearningStreak' } }
    /**
     * Find zero or one LearningStreak that matches the filter.
     * @param {LearningStreakFindUniqueArgs} args - Arguments to find a LearningStreak
     * @example
     * // Get one LearningStreak
     * const learningStreak = await prisma.learningStreak.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LearningStreakFindUniqueArgs>(args: SelectSubset<T, LearningStreakFindUniqueArgs<ExtArgs>>): Prisma__LearningStreakClient<$Result.GetResult<Prisma.$LearningStreakPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one LearningStreak that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {LearningStreakFindUniqueOrThrowArgs} args - Arguments to find a LearningStreak
     * @example
     * // Get one LearningStreak
     * const learningStreak = await prisma.learningStreak.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LearningStreakFindUniqueOrThrowArgs>(args: SelectSubset<T, LearningStreakFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LearningStreakClient<$Result.GetResult<Prisma.$LearningStreakPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first LearningStreak that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningStreakFindFirstArgs} args - Arguments to find a LearningStreak
     * @example
     * // Get one LearningStreak
     * const learningStreak = await prisma.learningStreak.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LearningStreakFindFirstArgs>(args?: SelectSubset<T, LearningStreakFindFirstArgs<ExtArgs>>): Prisma__LearningStreakClient<$Result.GetResult<Prisma.$LearningStreakPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first LearningStreak that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningStreakFindFirstOrThrowArgs} args - Arguments to find a LearningStreak
     * @example
     * // Get one LearningStreak
     * const learningStreak = await prisma.learningStreak.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LearningStreakFindFirstOrThrowArgs>(args?: SelectSubset<T, LearningStreakFindFirstOrThrowArgs<ExtArgs>>): Prisma__LearningStreakClient<$Result.GetResult<Prisma.$LearningStreakPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more LearningStreaks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningStreakFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all LearningStreaks
     * const learningStreaks = await prisma.learningStreak.findMany()
     * 
     * // Get first 10 LearningStreaks
     * const learningStreaks = await prisma.learningStreak.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const learningStreakWithIdOnly = await prisma.learningStreak.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LearningStreakFindManyArgs>(args?: SelectSubset<T, LearningStreakFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LearningStreakPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a LearningStreak.
     * @param {LearningStreakCreateArgs} args - Arguments to create a LearningStreak.
     * @example
     * // Create one LearningStreak
     * const LearningStreak = await prisma.learningStreak.create({
     *   data: {
     *     // ... data to create a LearningStreak
     *   }
     * })
     * 
     */
    create<T extends LearningStreakCreateArgs>(args: SelectSubset<T, LearningStreakCreateArgs<ExtArgs>>): Prisma__LearningStreakClient<$Result.GetResult<Prisma.$LearningStreakPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many LearningStreaks.
     * @param {LearningStreakCreateManyArgs} args - Arguments to create many LearningStreaks.
     * @example
     * // Create many LearningStreaks
     * const learningStreak = await prisma.learningStreak.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LearningStreakCreateManyArgs>(args?: SelectSubset<T, LearningStreakCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many LearningStreaks and returns the data saved in the database.
     * @param {LearningStreakCreateManyAndReturnArgs} args - Arguments to create many LearningStreaks.
     * @example
     * // Create many LearningStreaks
     * const learningStreak = await prisma.learningStreak.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many LearningStreaks and only return the `id`
     * const learningStreakWithIdOnly = await prisma.learningStreak.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LearningStreakCreateManyAndReturnArgs>(args?: SelectSubset<T, LearningStreakCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LearningStreakPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a LearningStreak.
     * @param {LearningStreakDeleteArgs} args - Arguments to delete one LearningStreak.
     * @example
     * // Delete one LearningStreak
     * const LearningStreak = await prisma.learningStreak.delete({
     *   where: {
     *     // ... filter to delete one LearningStreak
     *   }
     * })
     * 
     */
    delete<T extends LearningStreakDeleteArgs>(args: SelectSubset<T, LearningStreakDeleteArgs<ExtArgs>>): Prisma__LearningStreakClient<$Result.GetResult<Prisma.$LearningStreakPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one LearningStreak.
     * @param {LearningStreakUpdateArgs} args - Arguments to update one LearningStreak.
     * @example
     * // Update one LearningStreak
     * const learningStreak = await prisma.learningStreak.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LearningStreakUpdateArgs>(args: SelectSubset<T, LearningStreakUpdateArgs<ExtArgs>>): Prisma__LearningStreakClient<$Result.GetResult<Prisma.$LearningStreakPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more LearningStreaks.
     * @param {LearningStreakDeleteManyArgs} args - Arguments to filter LearningStreaks to delete.
     * @example
     * // Delete a few LearningStreaks
     * const { count } = await prisma.learningStreak.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LearningStreakDeleteManyArgs>(args?: SelectSubset<T, LearningStreakDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LearningStreaks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningStreakUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many LearningStreaks
     * const learningStreak = await prisma.learningStreak.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LearningStreakUpdateManyArgs>(args: SelectSubset<T, LearningStreakUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one LearningStreak.
     * @param {LearningStreakUpsertArgs} args - Arguments to update or create a LearningStreak.
     * @example
     * // Update or create a LearningStreak
     * const learningStreak = await prisma.learningStreak.upsert({
     *   create: {
     *     // ... data to create a LearningStreak
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the LearningStreak we want to update
     *   }
     * })
     */
    upsert<T extends LearningStreakUpsertArgs>(args: SelectSubset<T, LearningStreakUpsertArgs<ExtArgs>>): Prisma__LearningStreakClient<$Result.GetResult<Prisma.$LearningStreakPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of LearningStreaks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningStreakCountArgs} args - Arguments to filter LearningStreaks to count.
     * @example
     * // Count the number of LearningStreaks
     * const count = await prisma.learningStreak.count({
     *   where: {
     *     // ... the filter for the LearningStreaks we want to count
     *   }
     * })
    **/
    count<T extends LearningStreakCountArgs>(
      args?: Subset<T, LearningStreakCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LearningStreakCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a LearningStreak.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningStreakAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LearningStreakAggregateArgs>(args: Subset<T, LearningStreakAggregateArgs>): Prisma.PrismaPromise<GetLearningStreakAggregateType<T>>

    /**
     * Group by LearningStreak.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LearningStreakGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LearningStreakGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LearningStreakGroupByArgs['orderBy'] }
        : { orderBy?: LearningStreakGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LearningStreakGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLearningStreakGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the LearningStreak model
   */
  readonly fields: LearningStreakFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for LearningStreak.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LearningStreakClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the LearningStreak model
   */ 
  interface LearningStreakFieldRefs {
    readonly id: FieldRef<"LearningStreak", 'String'>
    readonly userId: FieldRef<"LearningStreak", 'String'>
    readonly currentStreak: FieldRef<"LearningStreak", 'Int'>
    readonly longestStreak: FieldRef<"LearningStreak", 'Int'>
    readonly lastActiveDate: FieldRef<"LearningStreak", 'DateTime'>
    readonly updatedAt: FieldRef<"LearningStreak", 'DateTime'>
    readonly createdAt: FieldRef<"LearningStreak", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * LearningStreak findUnique
   */
  export type LearningStreakFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningStreak
     */
    select?: LearningStreakSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningStreakInclude<ExtArgs> | null
    /**
     * Filter, which LearningStreak to fetch.
     */
    where: LearningStreakWhereUniqueInput
  }

  /**
   * LearningStreak findUniqueOrThrow
   */
  export type LearningStreakFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningStreak
     */
    select?: LearningStreakSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningStreakInclude<ExtArgs> | null
    /**
     * Filter, which LearningStreak to fetch.
     */
    where: LearningStreakWhereUniqueInput
  }

  /**
   * LearningStreak findFirst
   */
  export type LearningStreakFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningStreak
     */
    select?: LearningStreakSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningStreakInclude<ExtArgs> | null
    /**
     * Filter, which LearningStreak to fetch.
     */
    where?: LearningStreakWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LearningStreaks to fetch.
     */
    orderBy?: LearningStreakOrderByWithRelationInput | LearningStreakOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LearningStreaks.
     */
    cursor?: LearningStreakWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LearningStreaks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LearningStreaks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LearningStreaks.
     */
    distinct?: LearningStreakScalarFieldEnum | LearningStreakScalarFieldEnum[]
  }

  /**
   * LearningStreak findFirstOrThrow
   */
  export type LearningStreakFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningStreak
     */
    select?: LearningStreakSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningStreakInclude<ExtArgs> | null
    /**
     * Filter, which LearningStreak to fetch.
     */
    where?: LearningStreakWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LearningStreaks to fetch.
     */
    orderBy?: LearningStreakOrderByWithRelationInput | LearningStreakOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LearningStreaks.
     */
    cursor?: LearningStreakWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LearningStreaks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LearningStreaks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LearningStreaks.
     */
    distinct?: LearningStreakScalarFieldEnum | LearningStreakScalarFieldEnum[]
  }

  /**
   * LearningStreak findMany
   */
  export type LearningStreakFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningStreak
     */
    select?: LearningStreakSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningStreakInclude<ExtArgs> | null
    /**
     * Filter, which LearningStreaks to fetch.
     */
    where?: LearningStreakWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LearningStreaks to fetch.
     */
    orderBy?: LearningStreakOrderByWithRelationInput | LearningStreakOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing LearningStreaks.
     */
    cursor?: LearningStreakWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LearningStreaks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LearningStreaks.
     */
    skip?: number
    distinct?: LearningStreakScalarFieldEnum | LearningStreakScalarFieldEnum[]
  }

  /**
   * LearningStreak create
   */
  export type LearningStreakCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningStreak
     */
    select?: LearningStreakSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningStreakInclude<ExtArgs> | null
    /**
     * The data needed to create a LearningStreak.
     */
    data: XOR<LearningStreakCreateInput, LearningStreakUncheckedCreateInput>
  }

  /**
   * LearningStreak createMany
   */
  export type LearningStreakCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many LearningStreaks.
     */
    data: LearningStreakCreateManyInput | LearningStreakCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LearningStreak createManyAndReturn
   */
  export type LearningStreakCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningStreak
     */
    select?: LearningStreakSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many LearningStreaks.
     */
    data: LearningStreakCreateManyInput | LearningStreakCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningStreakIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * LearningStreak update
   */
  export type LearningStreakUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningStreak
     */
    select?: LearningStreakSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningStreakInclude<ExtArgs> | null
    /**
     * The data needed to update a LearningStreak.
     */
    data: XOR<LearningStreakUpdateInput, LearningStreakUncheckedUpdateInput>
    /**
     * Choose, which LearningStreak to update.
     */
    where: LearningStreakWhereUniqueInput
  }

  /**
   * LearningStreak updateMany
   */
  export type LearningStreakUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update LearningStreaks.
     */
    data: XOR<LearningStreakUpdateManyMutationInput, LearningStreakUncheckedUpdateManyInput>
    /**
     * Filter which LearningStreaks to update
     */
    where?: LearningStreakWhereInput
  }

  /**
   * LearningStreak upsert
   */
  export type LearningStreakUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningStreak
     */
    select?: LearningStreakSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningStreakInclude<ExtArgs> | null
    /**
     * The filter to search for the LearningStreak to update in case it exists.
     */
    where: LearningStreakWhereUniqueInput
    /**
     * In case the LearningStreak found by the `where` argument doesn't exist, create a new LearningStreak with this data.
     */
    create: XOR<LearningStreakCreateInput, LearningStreakUncheckedCreateInput>
    /**
     * In case the LearningStreak was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LearningStreakUpdateInput, LearningStreakUncheckedUpdateInput>
  }

  /**
   * LearningStreak delete
   */
  export type LearningStreakDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningStreak
     */
    select?: LearningStreakSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningStreakInclude<ExtArgs> | null
    /**
     * Filter which LearningStreak to delete.
     */
    where: LearningStreakWhereUniqueInput
  }

  /**
   * LearningStreak deleteMany
   */
  export type LearningStreakDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LearningStreaks to delete
     */
    where?: LearningStreakWhereInput
  }

  /**
   * LearningStreak without action
   */
  export type LearningStreakDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LearningStreak
     */
    select?: LearningStreakSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LearningStreakInclude<ExtArgs> | null
  }


  /**
   * Model LeaderboardScore
   */

  export type AggregateLeaderboardScore = {
    _count: LeaderboardScoreCountAggregateOutputType | null
    _avg: LeaderboardScoreAvgAggregateOutputType | null
    _sum: LeaderboardScoreSumAggregateOutputType | null
    _min: LeaderboardScoreMinAggregateOutputType | null
    _max: LeaderboardScoreMaxAggregateOutputType | null
  }

  export type LeaderboardScoreAvgAggregateOutputType = {
    score: number | null
    correctAnswers: number | null
    sessionsCompleted: number | null
    streak: number | null
  }

  export type LeaderboardScoreSumAggregateOutputType = {
    score: number | null
    correctAnswers: number | null
    sessionsCompleted: number | null
    streak: number | null
  }

  export type LeaderboardScoreMinAggregateOutputType = {
    id: string | null
    userId: string | null
    score: number | null
    correctAnswers: number | null
    sessionsCompleted: number | null
    streak: number | null
    updatedAt: Date | null
  }

  export type LeaderboardScoreMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    score: number | null
    correctAnswers: number | null
    sessionsCompleted: number | null
    streak: number | null
    updatedAt: Date | null
  }

  export type LeaderboardScoreCountAggregateOutputType = {
    id: number
    userId: number
    score: number
    correctAnswers: number
    sessionsCompleted: number
    streak: number
    updatedAt: number
    _all: number
  }


  export type LeaderboardScoreAvgAggregateInputType = {
    score?: true
    correctAnswers?: true
    sessionsCompleted?: true
    streak?: true
  }

  export type LeaderboardScoreSumAggregateInputType = {
    score?: true
    correctAnswers?: true
    sessionsCompleted?: true
    streak?: true
  }

  export type LeaderboardScoreMinAggregateInputType = {
    id?: true
    userId?: true
    score?: true
    correctAnswers?: true
    sessionsCompleted?: true
    streak?: true
    updatedAt?: true
  }

  export type LeaderboardScoreMaxAggregateInputType = {
    id?: true
    userId?: true
    score?: true
    correctAnswers?: true
    sessionsCompleted?: true
    streak?: true
    updatedAt?: true
  }

  export type LeaderboardScoreCountAggregateInputType = {
    id?: true
    userId?: true
    score?: true
    correctAnswers?: true
    sessionsCompleted?: true
    streak?: true
    updatedAt?: true
    _all?: true
  }

  export type LeaderboardScoreAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LeaderboardScore to aggregate.
     */
    where?: LeaderboardScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LeaderboardScores to fetch.
     */
    orderBy?: LeaderboardScoreOrderByWithRelationInput | LeaderboardScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LeaderboardScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LeaderboardScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LeaderboardScores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned LeaderboardScores
    **/
    _count?: true | LeaderboardScoreCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LeaderboardScoreAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LeaderboardScoreSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LeaderboardScoreMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LeaderboardScoreMaxAggregateInputType
  }

  export type GetLeaderboardScoreAggregateType<T extends LeaderboardScoreAggregateArgs> = {
        [P in keyof T & keyof AggregateLeaderboardScore]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLeaderboardScore[P]>
      : GetScalarType<T[P], AggregateLeaderboardScore[P]>
  }




  export type LeaderboardScoreGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LeaderboardScoreWhereInput
    orderBy?: LeaderboardScoreOrderByWithAggregationInput | LeaderboardScoreOrderByWithAggregationInput[]
    by: LeaderboardScoreScalarFieldEnum[] | LeaderboardScoreScalarFieldEnum
    having?: LeaderboardScoreScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LeaderboardScoreCountAggregateInputType | true
    _avg?: LeaderboardScoreAvgAggregateInputType
    _sum?: LeaderboardScoreSumAggregateInputType
    _min?: LeaderboardScoreMinAggregateInputType
    _max?: LeaderboardScoreMaxAggregateInputType
  }

  export type LeaderboardScoreGroupByOutputType = {
    id: string
    userId: string
    score: number
    correctAnswers: number
    sessionsCompleted: number
    streak: number
    updatedAt: Date
    _count: LeaderboardScoreCountAggregateOutputType | null
    _avg: LeaderboardScoreAvgAggregateOutputType | null
    _sum: LeaderboardScoreSumAggregateOutputType | null
    _min: LeaderboardScoreMinAggregateOutputType | null
    _max: LeaderboardScoreMaxAggregateOutputType | null
  }

  type GetLeaderboardScoreGroupByPayload<T extends LeaderboardScoreGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LeaderboardScoreGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LeaderboardScoreGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LeaderboardScoreGroupByOutputType[P]>
            : GetScalarType<T[P], LeaderboardScoreGroupByOutputType[P]>
        }
      >
    >


  export type LeaderboardScoreSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    score?: boolean
    correctAnswers?: boolean
    sessionsCompleted?: boolean
    streak?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["leaderboardScore"]>

  export type LeaderboardScoreSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    score?: boolean
    correctAnswers?: boolean
    sessionsCompleted?: boolean
    streak?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["leaderboardScore"]>

  export type LeaderboardScoreSelectScalar = {
    id?: boolean
    userId?: boolean
    score?: boolean
    correctAnswers?: boolean
    sessionsCompleted?: boolean
    streak?: boolean
    updatedAt?: boolean
  }

  export type LeaderboardScoreInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type LeaderboardScoreIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $LeaderboardScorePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "LeaderboardScore"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      score: number
      correctAnswers: number
      sessionsCompleted: number
      streak: number
      updatedAt: Date
    }, ExtArgs["result"]["leaderboardScore"]>
    composites: {}
  }

  type LeaderboardScoreGetPayload<S extends boolean | null | undefined | LeaderboardScoreDefaultArgs> = $Result.GetResult<Prisma.$LeaderboardScorePayload, S>

  type LeaderboardScoreCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<LeaderboardScoreFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: LeaderboardScoreCountAggregateInputType | true
    }

  export interface LeaderboardScoreDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['LeaderboardScore'], meta: { name: 'LeaderboardScore' } }
    /**
     * Find zero or one LeaderboardScore that matches the filter.
     * @param {LeaderboardScoreFindUniqueArgs} args - Arguments to find a LeaderboardScore
     * @example
     * // Get one LeaderboardScore
     * const leaderboardScore = await prisma.leaderboardScore.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LeaderboardScoreFindUniqueArgs>(args: SelectSubset<T, LeaderboardScoreFindUniqueArgs<ExtArgs>>): Prisma__LeaderboardScoreClient<$Result.GetResult<Prisma.$LeaderboardScorePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one LeaderboardScore that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {LeaderboardScoreFindUniqueOrThrowArgs} args - Arguments to find a LeaderboardScore
     * @example
     * // Get one LeaderboardScore
     * const leaderboardScore = await prisma.leaderboardScore.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LeaderboardScoreFindUniqueOrThrowArgs>(args: SelectSubset<T, LeaderboardScoreFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LeaderboardScoreClient<$Result.GetResult<Prisma.$LeaderboardScorePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first LeaderboardScore that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaderboardScoreFindFirstArgs} args - Arguments to find a LeaderboardScore
     * @example
     * // Get one LeaderboardScore
     * const leaderboardScore = await prisma.leaderboardScore.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LeaderboardScoreFindFirstArgs>(args?: SelectSubset<T, LeaderboardScoreFindFirstArgs<ExtArgs>>): Prisma__LeaderboardScoreClient<$Result.GetResult<Prisma.$LeaderboardScorePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first LeaderboardScore that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaderboardScoreFindFirstOrThrowArgs} args - Arguments to find a LeaderboardScore
     * @example
     * // Get one LeaderboardScore
     * const leaderboardScore = await prisma.leaderboardScore.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LeaderboardScoreFindFirstOrThrowArgs>(args?: SelectSubset<T, LeaderboardScoreFindFirstOrThrowArgs<ExtArgs>>): Prisma__LeaderboardScoreClient<$Result.GetResult<Prisma.$LeaderboardScorePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more LeaderboardScores that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaderboardScoreFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all LeaderboardScores
     * const leaderboardScores = await prisma.leaderboardScore.findMany()
     * 
     * // Get first 10 LeaderboardScores
     * const leaderboardScores = await prisma.leaderboardScore.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const leaderboardScoreWithIdOnly = await prisma.leaderboardScore.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LeaderboardScoreFindManyArgs>(args?: SelectSubset<T, LeaderboardScoreFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LeaderboardScorePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a LeaderboardScore.
     * @param {LeaderboardScoreCreateArgs} args - Arguments to create a LeaderboardScore.
     * @example
     * // Create one LeaderboardScore
     * const LeaderboardScore = await prisma.leaderboardScore.create({
     *   data: {
     *     // ... data to create a LeaderboardScore
     *   }
     * })
     * 
     */
    create<T extends LeaderboardScoreCreateArgs>(args: SelectSubset<T, LeaderboardScoreCreateArgs<ExtArgs>>): Prisma__LeaderboardScoreClient<$Result.GetResult<Prisma.$LeaderboardScorePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many LeaderboardScores.
     * @param {LeaderboardScoreCreateManyArgs} args - Arguments to create many LeaderboardScores.
     * @example
     * // Create many LeaderboardScores
     * const leaderboardScore = await prisma.leaderboardScore.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LeaderboardScoreCreateManyArgs>(args?: SelectSubset<T, LeaderboardScoreCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many LeaderboardScores and returns the data saved in the database.
     * @param {LeaderboardScoreCreateManyAndReturnArgs} args - Arguments to create many LeaderboardScores.
     * @example
     * // Create many LeaderboardScores
     * const leaderboardScore = await prisma.leaderboardScore.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many LeaderboardScores and only return the `id`
     * const leaderboardScoreWithIdOnly = await prisma.leaderboardScore.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LeaderboardScoreCreateManyAndReturnArgs>(args?: SelectSubset<T, LeaderboardScoreCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LeaderboardScorePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a LeaderboardScore.
     * @param {LeaderboardScoreDeleteArgs} args - Arguments to delete one LeaderboardScore.
     * @example
     * // Delete one LeaderboardScore
     * const LeaderboardScore = await prisma.leaderboardScore.delete({
     *   where: {
     *     // ... filter to delete one LeaderboardScore
     *   }
     * })
     * 
     */
    delete<T extends LeaderboardScoreDeleteArgs>(args: SelectSubset<T, LeaderboardScoreDeleteArgs<ExtArgs>>): Prisma__LeaderboardScoreClient<$Result.GetResult<Prisma.$LeaderboardScorePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one LeaderboardScore.
     * @param {LeaderboardScoreUpdateArgs} args - Arguments to update one LeaderboardScore.
     * @example
     * // Update one LeaderboardScore
     * const leaderboardScore = await prisma.leaderboardScore.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LeaderboardScoreUpdateArgs>(args: SelectSubset<T, LeaderboardScoreUpdateArgs<ExtArgs>>): Prisma__LeaderboardScoreClient<$Result.GetResult<Prisma.$LeaderboardScorePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more LeaderboardScores.
     * @param {LeaderboardScoreDeleteManyArgs} args - Arguments to filter LeaderboardScores to delete.
     * @example
     * // Delete a few LeaderboardScores
     * const { count } = await prisma.leaderboardScore.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LeaderboardScoreDeleteManyArgs>(args?: SelectSubset<T, LeaderboardScoreDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LeaderboardScores.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaderboardScoreUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many LeaderboardScores
     * const leaderboardScore = await prisma.leaderboardScore.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LeaderboardScoreUpdateManyArgs>(args: SelectSubset<T, LeaderboardScoreUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one LeaderboardScore.
     * @param {LeaderboardScoreUpsertArgs} args - Arguments to update or create a LeaderboardScore.
     * @example
     * // Update or create a LeaderboardScore
     * const leaderboardScore = await prisma.leaderboardScore.upsert({
     *   create: {
     *     // ... data to create a LeaderboardScore
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the LeaderboardScore we want to update
     *   }
     * })
     */
    upsert<T extends LeaderboardScoreUpsertArgs>(args: SelectSubset<T, LeaderboardScoreUpsertArgs<ExtArgs>>): Prisma__LeaderboardScoreClient<$Result.GetResult<Prisma.$LeaderboardScorePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of LeaderboardScores.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaderboardScoreCountArgs} args - Arguments to filter LeaderboardScores to count.
     * @example
     * // Count the number of LeaderboardScores
     * const count = await prisma.leaderboardScore.count({
     *   where: {
     *     // ... the filter for the LeaderboardScores we want to count
     *   }
     * })
    **/
    count<T extends LeaderboardScoreCountArgs>(
      args?: Subset<T, LeaderboardScoreCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LeaderboardScoreCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a LeaderboardScore.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaderboardScoreAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LeaderboardScoreAggregateArgs>(args: Subset<T, LeaderboardScoreAggregateArgs>): Prisma.PrismaPromise<GetLeaderboardScoreAggregateType<T>>

    /**
     * Group by LeaderboardScore.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaderboardScoreGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LeaderboardScoreGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LeaderboardScoreGroupByArgs['orderBy'] }
        : { orderBy?: LeaderboardScoreGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LeaderboardScoreGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLeaderboardScoreGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the LeaderboardScore model
   */
  readonly fields: LeaderboardScoreFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for LeaderboardScore.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LeaderboardScoreClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the LeaderboardScore model
   */ 
  interface LeaderboardScoreFieldRefs {
    readonly id: FieldRef<"LeaderboardScore", 'String'>
    readonly userId: FieldRef<"LeaderboardScore", 'String'>
    readonly score: FieldRef<"LeaderboardScore", 'Float'>
    readonly correctAnswers: FieldRef<"LeaderboardScore", 'Int'>
    readonly sessionsCompleted: FieldRef<"LeaderboardScore", 'Int'>
    readonly streak: FieldRef<"LeaderboardScore", 'Int'>
    readonly updatedAt: FieldRef<"LeaderboardScore", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * LeaderboardScore findUnique
   */
  export type LeaderboardScoreFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaderboardScore
     */
    select?: LeaderboardScoreSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaderboardScoreInclude<ExtArgs> | null
    /**
     * Filter, which LeaderboardScore to fetch.
     */
    where: LeaderboardScoreWhereUniqueInput
  }

  /**
   * LeaderboardScore findUniqueOrThrow
   */
  export type LeaderboardScoreFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaderboardScore
     */
    select?: LeaderboardScoreSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaderboardScoreInclude<ExtArgs> | null
    /**
     * Filter, which LeaderboardScore to fetch.
     */
    where: LeaderboardScoreWhereUniqueInput
  }

  /**
   * LeaderboardScore findFirst
   */
  export type LeaderboardScoreFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaderboardScore
     */
    select?: LeaderboardScoreSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaderboardScoreInclude<ExtArgs> | null
    /**
     * Filter, which LeaderboardScore to fetch.
     */
    where?: LeaderboardScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LeaderboardScores to fetch.
     */
    orderBy?: LeaderboardScoreOrderByWithRelationInput | LeaderboardScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LeaderboardScores.
     */
    cursor?: LeaderboardScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LeaderboardScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LeaderboardScores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LeaderboardScores.
     */
    distinct?: LeaderboardScoreScalarFieldEnum | LeaderboardScoreScalarFieldEnum[]
  }

  /**
   * LeaderboardScore findFirstOrThrow
   */
  export type LeaderboardScoreFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaderboardScore
     */
    select?: LeaderboardScoreSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaderboardScoreInclude<ExtArgs> | null
    /**
     * Filter, which LeaderboardScore to fetch.
     */
    where?: LeaderboardScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LeaderboardScores to fetch.
     */
    orderBy?: LeaderboardScoreOrderByWithRelationInput | LeaderboardScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LeaderboardScores.
     */
    cursor?: LeaderboardScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LeaderboardScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LeaderboardScores.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LeaderboardScores.
     */
    distinct?: LeaderboardScoreScalarFieldEnum | LeaderboardScoreScalarFieldEnum[]
  }

  /**
   * LeaderboardScore findMany
   */
  export type LeaderboardScoreFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaderboardScore
     */
    select?: LeaderboardScoreSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaderboardScoreInclude<ExtArgs> | null
    /**
     * Filter, which LeaderboardScores to fetch.
     */
    where?: LeaderboardScoreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LeaderboardScores to fetch.
     */
    orderBy?: LeaderboardScoreOrderByWithRelationInput | LeaderboardScoreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing LeaderboardScores.
     */
    cursor?: LeaderboardScoreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LeaderboardScores from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LeaderboardScores.
     */
    skip?: number
    distinct?: LeaderboardScoreScalarFieldEnum | LeaderboardScoreScalarFieldEnum[]
  }

  /**
   * LeaderboardScore create
   */
  export type LeaderboardScoreCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaderboardScore
     */
    select?: LeaderboardScoreSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaderboardScoreInclude<ExtArgs> | null
    /**
     * The data needed to create a LeaderboardScore.
     */
    data: XOR<LeaderboardScoreCreateInput, LeaderboardScoreUncheckedCreateInput>
  }

  /**
   * LeaderboardScore createMany
   */
  export type LeaderboardScoreCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many LeaderboardScores.
     */
    data: LeaderboardScoreCreateManyInput | LeaderboardScoreCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LeaderboardScore createManyAndReturn
   */
  export type LeaderboardScoreCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaderboardScore
     */
    select?: LeaderboardScoreSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many LeaderboardScores.
     */
    data: LeaderboardScoreCreateManyInput | LeaderboardScoreCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaderboardScoreIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * LeaderboardScore update
   */
  export type LeaderboardScoreUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaderboardScore
     */
    select?: LeaderboardScoreSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaderboardScoreInclude<ExtArgs> | null
    /**
     * The data needed to update a LeaderboardScore.
     */
    data: XOR<LeaderboardScoreUpdateInput, LeaderboardScoreUncheckedUpdateInput>
    /**
     * Choose, which LeaderboardScore to update.
     */
    where: LeaderboardScoreWhereUniqueInput
  }

  /**
   * LeaderboardScore updateMany
   */
  export type LeaderboardScoreUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update LeaderboardScores.
     */
    data: XOR<LeaderboardScoreUpdateManyMutationInput, LeaderboardScoreUncheckedUpdateManyInput>
    /**
     * Filter which LeaderboardScores to update
     */
    where?: LeaderboardScoreWhereInput
  }

  /**
   * LeaderboardScore upsert
   */
  export type LeaderboardScoreUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaderboardScore
     */
    select?: LeaderboardScoreSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaderboardScoreInclude<ExtArgs> | null
    /**
     * The filter to search for the LeaderboardScore to update in case it exists.
     */
    where: LeaderboardScoreWhereUniqueInput
    /**
     * In case the LeaderboardScore found by the `where` argument doesn't exist, create a new LeaderboardScore with this data.
     */
    create: XOR<LeaderboardScoreCreateInput, LeaderboardScoreUncheckedCreateInput>
    /**
     * In case the LeaderboardScore was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LeaderboardScoreUpdateInput, LeaderboardScoreUncheckedUpdateInput>
  }

  /**
   * LeaderboardScore delete
   */
  export type LeaderboardScoreDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaderboardScore
     */
    select?: LeaderboardScoreSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaderboardScoreInclude<ExtArgs> | null
    /**
     * Filter which LeaderboardScore to delete.
     */
    where: LeaderboardScoreWhereUniqueInput
  }

  /**
   * LeaderboardScore deleteMany
   */
  export type LeaderboardScoreDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LeaderboardScores to delete
     */
    where?: LeaderboardScoreWhereInput
  }

  /**
   * LeaderboardScore without action
   */
  export type LeaderboardScoreDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LeaderboardScore
     */
    select?: LeaderboardScoreSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaderboardScoreInclude<ExtArgs> | null
  }


  /**
   * Model DailyChallenge
   */

  export type AggregateDailyChallenge = {
    _count: DailyChallengeCountAggregateOutputType | null
    _min: DailyChallengeMinAggregateOutputType | null
    _max: DailyChallengeMaxAggregateOutputType | null
  }

  export type DailyChallengeMinAggregateOutputType = {
    id: string | null
    date: Date | null
    createdAt: Date | null
  }

  export type DailyChallengeMaxAggregateOutputType = {
    id: string | null
    date: Date | null
    createdAt: Date | null
  }

  export type DailyChallengeCountAggregateOutputType = {
    id: number
    date: number
    items: number
    createdAt: number
    _all: number
  }


  export type DailyChallengeMinAggregateInputType = {
    id?: true
    date?: true
    createdAt?: true
  }

  export type DailyChallengeMaxAggregateInputType = {
    id?: true
    date?: true
    createdAt?: true
  }

  export type DailyChallengeCountAggregateInputType = {
    id?: true
    date?: true
    items?: true
    createdAt?: true
    _all?: true
  }

  export type DailyChallengeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DailyChallenge to aggregate.
     */
    where?: DailyChallengeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DailyChallenges to fetch.
     */
    orderBy?: DailyChallengeOrderByWithRelationInput | DailyChallengeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DailyChallengeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DailyChallenges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DailyChallenges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned DailyChallenges
    **/
    _count?: true | DailyChallengeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DailyChallengeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DailyChallengeMaxAggregateInputType
  }

  export type GetDailyChallengeAggregateType<T extends DailyChallengeAggregateArgs> = {
        [P in keyof T & keyof AggregateDailyChallenge]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDailyChallenge[P]>
      : GetScalarType<T[P], AggregateDailyChallenge[P]>
  }




  export type DailyChallengeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DailyChallengeWhereInput
    orderBy?: DailyChallengeOrderByWithAggregationInput | DailyChallengeOrderByWithAggregationInput[]
    by: DailyChallengeScalarFieldEnum[] | DailyChallengeScalarFieldEnum
    having?: DailyChallengeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DailyChallengeCountAggregateInputType | true
    _min?: DailyChallengeMinAggregateInputType
    _max?: DailyChallengeMaxAggregateInputType
  }

  export type DailyChallengeGroupByOutputType = {
    id: string
    date: Date
    items: string[]
    createdAt: Date
    _count: DailyChallengeCountAggregateOutputType | null
    _min: DailyChallengeMinAggregateOutputType | null
    _max: DailyChallengeMaxAggregateOutputType | null
  }

  type GetDailyChallengeGroupByPayload<T extends DailyChallengeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DailyChallengeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DailyChallengeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DailyChallengeGroupByOutputType[P]>
            : GetScalarType<T[P], DailyChallengeGroupByOutputType[P]>
        }
      >
    >


  export type DailyChallengeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    date?: boolean
    items?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["dailyChallenge"]>

  export type DailyChallengeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    date?: boolean
    items?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["dailyChallenge"]>

  export type DailyChallengeSelectScalar = {
    id?: boolean
    date?: boolean
    items?: boolean
    createdAt?: boolean
  }


  export type $DailyChallengePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "DailyChallenge"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      date: Date
      items: string[]
      createdAt: Date
    }, ExtArgs["result"]["dailyChallenge"]>
    composites: {}
  }

  type DailyChallengeGetPayload<S extends boolean | null | undefined | DailyChallengeDefaultArgs> = $Result.GetResult<Prisma.$DailyChallengePayload, S>

  type DailyChallengeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<DailyChallengeFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: DailyChallengeCountAggregateInputType | true
    }

  export interface DailyChallengeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['DailyChallenge'], meta: { name: 'DailyChallenge' } }
    /**
     * Find zero or one DailyChallenge that matches the filter.
     * @param {DailyChallengeFindUniqueArgs} args - Arguments to find a DailyChallenge
     * @example
     * // Get one DailyChallenge
     * const dailyChallenge = await prisma.dailyChallenge.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DailyChallengeFindUniqueArgs>(args: SelectSubset<T, DailyChallengeFindUniqueArgs<ExtArgs>>): Prisma__DailyChallengeClient<$Result.GetResult<Prisma.$DailyChallengePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one DailyChallenge that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {DailyChallengeFindUniqueOrThrowArgs} args - Arguments to find a DailyChallenge
     * @example
     * // Get one DailyChallenge
     * const dailyChallenge = await prisma.dailyChallenge.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DailyChallengeFindUniqueOrThrowArgs>(args: SelectSubset<T, DailyChallengeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DailyChallengeClient<$Result.GetResult<Prisma.$DailyChallengePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first DailyChallenge that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DailyChallengeFindFirstArgs} args - Arguments to find a DailyChallenge
     * @example
     * // Get one DailyChallenge
     * const dailyChallenge = await prisma.dailyChallenge.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DailyChallengeFindFirstArgs>(args?: SelectSubset<T, DailyChallengeFindFirstArgs<ExtArgs>>): Prisma__DailyChallengeClient<$Result.GetResult<Prisma.$DailyChallengePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first DailyChallenge that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DailyChallengeFindFirstOrThrowArgs} args - Arguments to find a DailyChallenge
     * @example
     * // Get one DailyChallenge
     * const dailyChallenge = await prisma.dailyChallenge.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DailyChallengeFindFirstOrThrowArgs>(args?: SelectSubset<T, DailyChallengeFindFirstOrThrowArgs<ExtArgs>>): Prisma__DailyChallengeClient<$Result.GetResult<Prisma.$DailyChallengePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more DailyChallenges that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DailyChallengeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all DailyChallenges
     * const dailyChallenges = await prisma.dailyChallenge.findMany()
     * 
     * // Get first 10 DailyChallenges
     * const dailyChallenges = await prisma.dailyChallenge.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const dailyChallengeWithIdOnly = await prisma.dailyChallenge.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DailyChallengeFindManyArgs>(args?: SelectSubset<T, DailyChallengeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DailyChallengePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a DailyChallenge.
     * @param {DailyChallengeCreateArgs} args - Arguments to create a DailyChallenge.
     * @example
     * // Create one DailyChallenge
     * const DailyChallenge = await prisma.dailyChallenge.create({
     *   data: {
     *     // ... data to create a DailyChallenge
     *   }
     * })
     * 
     */
    create<T extends DailyChallengeCreateArgs>(args: SelectSubset<T, DailyChallengeCreateArgs<ExtArgs>>): Prisma__DailyChallengeClient<$Result.GetResult<Prisma.$DailyChallengePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many DailyChallenges.
     * @param {DailyChallengeCreateManyArgs} args - Arguments to create many DailyChallenges.
     * @example
     * // Create many DailyChallenges
     * const dailyChallenge = await prisma.dailyChallenge.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DailyChallengeCreateManyArgs>(args?: SelectSubset<T, DailyChallengeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many DailyChallenges and returns the data saved in the database.
     * @param {DailyChallengeCreateManyAndReturnArgs} args - Arguments to create many DailyChallenges.
     * @example
     * // Create many DailyChallenges
     * const dailyChallenge = await prisma.dailyChallenge.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many DailyChallenges and only return the `id`
     * const dailyChallengeWithIdOnly = await prisma.dailyChallenge.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DailyChallengeCreateManyAndReturnArgs>(args?: SelectSubset<T, DailyChallengeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DailyChallengePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a DailyChallenge.
     * @param {DailyChallengeDeleteArgs} args - Arguments to delete one DailyChallenge.
     * @example
     * // Delete one DailyChallenge
     * const DailyChallenge = await prisma.dailyChallenge.delete({
     *   where: {
     *     // ... filter to delete one DailyChallenge
     *   }
     * })
     * 
     */
    delete<T extends DailyChallengeDeleteArgs>(args: SelectSubset<T, DailyChallengeDeleteArgs<ExtArgs>>): Prisma__DailyChallengeClient<$Result.GetResult<Prisma.$DailyChallengePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one DailyChallenge.
     * @param {DailyChallengeUpdateArgs} args - Arguments to update one DailyChallenge.
     * @example
     * // Update one DailyChallenge
     * const dailyChallenge = await prisma.dailyChallenge.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DailyChallengeUpdateArgs>(args: SelectSubset<T, DailyChallengeUpdateArgs<ExtArgs>>): Prisma__DailyChallengeClient<$Result.GetResult<Prisma.$DailyChallengePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more DailyChallenges.
     * @param {DailyChallengeDeleteManyArgs} args - Arguments to filter DailyChallenges to delete.
     * @example
     * // Delete a few DailyChallenges
     * const { count } = await prisma.dailyChallenge.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DailyChallengeDeleteManyArgs>(args?: SelectSubset<T, DailyChallengeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DailyChallenges.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DailyChallengeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many DailyChallenges
     * const dailyChallenge = await prisma.dailyChallenge.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DailyChallengeUpdateManyArgs>(args: SelectSubset<T, DailyChallengeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one DailyChallenge.
     * @param {DailyChallengeUpsertArgs} args - Arguments to update or create a DailyChallenge.
     * @example
     * // Update or create a DailyChallenge
     * const dailyChallenge = await prisma.dailyChallenge.upsert({
     *   create: {
     *     // ... data to create a DailyChallenge
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the DailyChallenge we want to update
     *   }
     * })
     */
    upsert<T extends DailyChallengeUpsertArgs>(args: SelectSubset<T, DailyChallengeUpsertArgs<ExtArgs>>): Prisma__DailyChallengeClient<$Result.GetResult<Prisma.$DailyChallengePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of DailyChallenges.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DailyChallengeCountArgs} args - Arguments to filter DailyChallenges to count.
     * @example
     * // Count the number of DailyChallenges
     * const count = await prisma.dailyChallenge.count({
     *   where: {
     *     // ... the filter for the DailyChallenges we want to count
     *   }
     * })
    **/
    count<T extends DailyChallengeCountArgs>(
      args?: Subset<T, DailyChallengeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DailyChallengeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a DailyChallenge.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DailyChallengeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DailyChallengeAggregateArgs>(args: Subset<T, DailyChallengeAggregateArgs>): Prisma.PrismaPromise<GetDailyChallengeAggregateType<T>>

    /**
     * Group by DailyChallenge.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DailyChallengeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DailyChallengeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DailyChallengeGroupByArgs['orderBy'] }
        : { orderBy?: DailyChallengeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DailyChallengeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDailyChallengeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the DailyChallenge model
   */
  readonly fields: DailyChallengeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for DailyChallenge.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DailyChallengeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the DailyChallenge model
   */ 
  interface DailyChallengeFieldRefs {
    readonly id: FieldRef<"DailyChallenge", 'String'>
    readonly date: FieldRef<"DailyChallenge", 'DateTime'>
    readonly items: FieldRef<"DailyChallenge", 'String[]'>
    readonly createdAt: FieldRef<"DailyChallenge", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * DailyChallenge findUnique
   */
  export type DailyChallengeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DailyChallenge
     */
    select?: DailyChallengeSelect<ExtArgs> | null
    /**
     * Filter, which DailyChallenge to fetch.
     */
    where: DailyChallengeWhereUniqueInput
  }

  /**
   * DailyChallenge findUniqueOrThrow
   */
  export type DailyChallengeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DailyChallenge
     */
    select?: DailyChallengeSelect<ExtArgs> | null
    /**
     * Filter, which DailyChallenge to fetch.
     */
    where: DailyChallengeWhereUniqueInput
  }

  /**
   * DailyChallenge findFirst
   */
  export type DailyChallengeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DailyChallenge
     */
    select?: DailyChallengeSelect<ExtArgs> | null
    /**
     * Filter, which DailyChallenge to fetch.
     */
    where?: DailyChallengeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DailyChallenges to fetch.
     */
    orderBy?: DailyChallengeOrderByWithRelationInput | DailyChallengeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DailyChallenges.
     */
    cursor?: DailyChallengeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DailyChallenges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DailyChallenges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DailyChallenges.
     */
    distinct?: DailyChallengeScalarFieldEnum | DailyChallengeScalarFieldEnum[]
  }

  /**
   * DailyChallenge findFirstOrThrow
   */
  export type DailyChallengeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DailyChallenge
     */
    select?: DailyChallengeSelect<ExtArgs> | null
    /**
     * Filter, which DailyChallenge to fetch.
     */
    where?: DailyChallengeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DailyChallenges to fetch.
     */
    orderBy?: DailyChallengeOrderByWithRelationInput | DailyChallengeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DailyChallenges.
     */
    cursor?: DailyChallengeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DailyChallenges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DailyChallenges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DailyChallenges.
     */
    distinct?: DailyChallengeScalarFieldEnum | DailyChallengeScalarFieldEnum[]
  }

  /**
   * DailyChallenge findMany
   */
  export type DailyChallengeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DailyChallenge
     */
    select?: DailyChallengeSelect<ExtArgs> | null
    /**
     * Filter, which DailyChallenges to fetch.
     */
    where?: DailyChallengeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DailyChallenges to fetch.
     */
    orderBy?: DailyChallengeOrderByWithRelationInput | DailyChallengeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing DailyChallenges.
     */
    cursor?: DailyChallengeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DailyChallenges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DailyChallenges.
     */
    skip?: number
    distinct?: DailyChallengeScalarFieldEnum | DailyChallengeScalarFieldEnum[]
  }

  /**
   * DailyChallenge create
   */
  export type DailyChallengeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DailyChallenge
     */
    select?: DailyChallengeSelect<ExtArgs> | null
    /**
     * The data needed to create a DailyChallenge.
     */
    data: XOR<DailyChallengeCreateInput, DailyChallengeUncheckedCreateInput>
  }

  /**
   * DailyChallenge createMany
   */
  export type DailyChallengeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many DailyChallenges.
     */
    data: DailyChallengeCreateManyInput | DailyChallengeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * DailyChallenge createManyAndReturn
   */
  export type DailyChallengeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DailyChallenge
     */
    select?: DailyChallengeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many DailyChallenges.
     */
    data: DailyChallengeCreateManyInput | DailyChallengeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * DailyChallenge update
   */
  export type DailyChallengeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DailyChallenge
     */
    select?: DailyChallengeSelect<ExtArgs> | null
    /**
     * The data needed to update a DailyChallenge.
     */
    data: XOR<DailyChallengeUpdateInput, DailyChallengeUncheckedUpdateInput>
    /**
     * Choose, which DailyChallenge to update.
     */
    where: DailyChallengeWhereUniqueInput
  }

  /**
   * DailyChallenge updateMany
   */
  export type DailyChallengeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update DailyChallenges.
     */
    data: XOR<DailyChallengeUpdateManyMutationInput, DailyChallengeUncheckedUpdateManyInput>
    /**
     * Filter which DailyChallenges to update
     */
    where?: DailyChallengeWhereInput
  }

  /**
   * DailyChallenge upsert
   */
  export type DailyChallengeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DailyChallenge
     */
    select?: DailyChallengeSelect<ExtArgs> | null
    /**
     * The filter to search for the DailyChallenge to update in case it exists.
     */
    where: DailyChallengeWhereUniqueInput
    /**
     * In case the DailyChallenge found by the `where` argument doesn't exist, create a new DailyChallenge with this data.
     */
    create: XOR<DailyChallengeCreateInput, DailyChallengeUncheckedCreateInput>
    /**
     * In case the DailyChallenge was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DailyChallengeUpdateInput, DailyChallengeUncheckedUpdateInput>
  }

  /**
   * DailyChallenge delete
   */
  export type DailyChallengeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DailyChallenge
     */
    select?: DailyChallengeSelect<ExtArgs> | null
    /**
     * Filter which DailyChallenge to delete.
     */
    where: DailyChallengeWhereUniqueInput
  }

  /**
   * DailyChallenge deleteMany
   */
  export type DailyChallengeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DailyChallenges to delete
     */
    where?: DailyChallengeWhereInput
  }

  /**
   * DailyChallenge without action
   */
  export type DailyChallengeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DailyChallenge
     */
    select?: DailyChallengeSelect<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    name: 'name',
    firebaseUid: 'firebaseUid',
    targetExam: 'targetExam',
    preferredTopics: 'preferredTopics',
    preferredDifficulty: 'preferredDifficulty',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const PushTokenScalarFieldEnum: {
    id: 'id',
    token: 'token',
    userId: 'userId'
  };

  export type PushTokenScalarFieldEnum = (typeof PushTokenScalarFieldEnum)[keyof typeof PushTokenScalarFieldEnum]


  export const LearningSessionScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    topic: 'topic',
    status: 'status',
    totalGenerated: 'totalGenerated',
    totalCompleted: 'totalCompleted',
    startedAt: 'startedAt',
    completedAt: 'completedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type LearningSessionScalarFieldEnum = (typeof LearningSessionScalarFieldEnum)[keyof typeof LearningSessionScalarFieldEnum]


  export const LearningItemScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    sessionId: 'sessionId',
    type: 'type',
    topic: 'topic',
    difficulty: 'difficulty',
    payload: 'payload',
    isPublished: 'isPublished',
    engagementScore: 'engagementScore',
    masteredByUser: 'masteredByUser',
    lastInteractedAt: 'lastInteractedAt',
    nextReviewAt: 'nextReviewAt',
    reviewInterval: 'reviewInterval',
    reviewCount: 'reviewCount',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type LearningItemScalarFieldEnum = (typeof LearningItemScalarFieldEnum)[keyof typeof LearningItemScalarFieldEnum]


  export const FeedItemScalarFieldEnum: {
    id: 'id',
    learningItemId: 'learningItemId',
    publishedByUserId: 'publishedByUserId',
    publishedAt: 'publishedAt',
    createdAt: 'createdAt',
    userId: 'userId'
  };

  export type FeedItemScalarFieldEnum = (typeof FeedItemScalarFieldEnum)[keyof typeof FeedItemScalarFieldEnum]


  export const UserInteractionScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    learningItemId: 'learningItemId',
    type: 'type',
    isCorrect: 'isCorrect',
    createdAt: 'createdAt'
  };

  export type UserInteractionScalarFieldEnum = (typeof UserInteractionScalarFieldEnum)[keyof typeof UserInteractionScalarFieldEnum]


  export const LearningStreakScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    currentStreak: 'currentStreak',
    longestStreak: 'longestStreak',
    lastActiveDate: 'lastActiveDate',
    updatedAt: 'updatedAt',
    createdAt: 'createdAt'
  };

  export type LearningStreakScalarFieldEnum = (typeof LearningStreakScalarFieldEnum)[keyof typeof LearningStreakScalarFieldEnum]


  export const LeaderboardScoreScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    score: 'score',
    correctAnswers: 'correctAnswers',
    sessionsCompleted: 'sessionsCompleted',
    streak: 'streak',
    updatedAt: 'updatedAt'
  };

  export type LeaderboardScoreScalarFieldEnum = (typeof LeaderboardScoreScalarFieldEnum)[keyof typeof LeaderboardScoreScalarFieldEnum]


  export const DailyChallengeScalarFieldEnum: {
    id: 'id',
    date: 'date',
    items: 'items',
    createdAt: 'createdAt'
  };

  export type DailyChallengeScalarFieldEnum = (typeof DailyChallengeScalarFieldEnum)[keyof typeof DailyChallengeScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'SessionStatus'
   */
  export type EnumSessionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SessionStatus'>
    


  /**
   * Reference to a field of type 'SessionStatus[]'
   */
  export type ListEnumSessionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SessionStatus[]'>
    


  /**
   * Reference to a field of type 'LearningItemType'
   */
  export type EnumLearningItemTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LearningItemType'>
    


  /**
   * Reference to a field of type 'LearningItemType[]'
   */
  export type ListEnumLearningItemTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LearningItemType[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'InteractionType'
   */
  export type EnumInteractionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'InteractionType'>
    


  /**
   * Reference to a field of type 'InteractionType[]'
   */
  export type ListEnumInteractionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'InteractionType[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    firebaseUid?: StringFilter<"User"> | string
    targetExam?: StringNullableFilter<"User"> | string | null
    preferredTopics?: JsonNullableFilter<"User">
    preferredDifficulty?: IntNullableFilter<"User"> | number | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    pushTokens?: PushTokenListRelationFilter
    sessions?: LearningSessionListRelationFilter
    learningItems?: LearningItemListRelationFilter
    interactions?: UserInteractionListRelationFilter
    feedItems?: FeedItemListRelationFilter
    streak?: XOR<LearningStreakNullableRelationFilter, LearningStreakWhereInput> | null
    leaderboardScore?: XOR<LeaderboardScoreNullableRelationFilter, LeaderboardScoreWhereInput> | null
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrderInput | SortOrder
    firebaseUid?: SortOrder
    targetExam?: SortOrderInput | SortOrder
    preferredTopics?: SortOrderInput | SortOrder
    preferredDifficulty?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    pushTokens?: PushTokenOrderByRelationAggregateInput
    sessions?: LearningSessionOrderByRelationAggregateInput
    learningItems?: LearningItemOrderByRelationAggregateInput
    interactions?: UserInteractionOrderByRelationAggregateInput
    feedItems?: FeedItemOrderByRelationAggregateInput
    streak?: LearningStreakOrderByWithRelationInput
    leaderboardScore?: LeaderboardScoreOrderByWithRelationInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    firebaseUid?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringNullableFilter<"User"> | string | null
    targetExam?: StringNullableFilter<"User"> | string | null
    preferredTopics?: JsonNullableFilter<"User">
    preferredDifficulty?: IntNullableFilter<"User"> | number | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    pushTokens?: PushTokenListRelationFilter
    sessions?: LearningSessionListRelationFilter
    learningItems?: LearningItemListRelationFilter
    interactions?: UserInteractionListRelationFilter
    feedItems?: FeedItemListRelationFilter
    streak?: XOR<LearningStreakNullableRelationFilter, LearningStreakWhereInput> | null
    leaderboardScore?: XOR<LeaderboardScoreNullableRelationFilter, LeaderboardScoreWhereInput> | null
  }, "id" | "email" | "firebaseUid">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrderInput | SortOrder
    firebaseUid?: SortOrder
    targetExam?: SortOrderInput | SortOrder
    preferredTopics?: SortOrderInput | SortOrder
    preferredDifficulty?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    name?: StringNullableWithAggregatesFilter<"User"> | string | null
    firebaseUid?: StringWithAggregatesFilter<"User"> | string
    targetExam?: StringNullableWithAggregatesFilter<"User"> | string | null
    preferredTopics?: JsonNullableWithAggregatesFilter<"User">
    preferredDifficulty?: IntNullableWithAggregatesFilter<"User"> | number | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type PushTokenWhereInput = {
    AND?: PushTokenWhereInput | PushTokenWhereInput[]
    OR?: PushTokenWhereInput[]
    NOT?: PushTokenWhereInput | PushTokenWhereInput[]
    id?: StringFilter<"PushToken"> | string
    token?: StringFilter<"PushToken"> | string
    userId?: StringFilter<"PushToken"> | string
    user?: XOR<UserRelationFilter, UserWhereInput>
  }

  export type PushTokenOrderByWithRelationInput = {
    id?: SortOrder
    token?: SortOrder
    userId?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type PushTokenWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    token?: string
    AND?: PushTokenWhereInput | PushTokenWhereInput[]
    OR?: PushTokenWhereInput[]
    NOT?: PushTokenWhereInput | PushTokenWhereInput[]
    userId?: StringFilter<"PushToken"> | string
    user?: XOR<UserRelationFilter, UserWhereInput>
  }, "id" | "token">

  export type PushTokenOrderByWithAggregationInput = {
    id?: SortOrder
    token?: SortOrder
    userId?: SortOrder
    _count?: PushTokenCountOrderByAggregateInput
    _max?: PushTokenMaxOrderByAggregateInput
    _min?: PushTokenMinOrderByAggregateInput
  }

  export type PushTokenScalarWhereWithAggregatesInput = {
    AND?: PushTokenScalarWhereWithAggregatesInput | PushTokenScalarWhereWithAggregatesInput[]
    OR?: PushTokenScalarWhereWithAggregatesInput[]
    NOT?: PushTokenScalarWhereWithAggregatesInput | PushTokenScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PushToken"> | string
    token?: StringWithAggregatesFilter<"PushToken"> | string
    userId?: StringWithAggregatesFilter<"PushToken"> | string
  }

  export type LearningSessionWhereInput = {
    AND?: LearningSessionWhereInput | LearningSessionWhereInput[]
    OR?: LearningSessionWhereInput[]
    NOT?: LearningSessionWhereInput | LearningSessionWhereInput[]
    id?: StringFilter<"LearningSession"> | string
    userId?: StringFilter<"LearningSession"> | string
    topic?: StringFilter<"LearningSession"> | string
    status?: EnumSessionStatusFilter<"LearningSession"> | $Enums.SessionStatus
    totalGenerated?: IntFilter<"LearningSession"> | number
    totalCompleted?: IntFilter<"LearningSession"> | number
    startedAt?: DateTimeFilter<"LearningSession"> | Date | string
    completedAt?: DateTimeNullableFilter<"LearningSession"> | Date | string | null
    createdAt?: DateTimeFilter<"LearningSession"> | Date | string
    updatedAt?: DateTimeFilter<"LearningSession"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    items?: LearningItemListRelationFilter
  }

  export type LearningSessionOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    topic?: SortOrder
    status?: SortOrder
    totalGenerated?: SortOrder
    totalCompleted?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    items?: LearningItemOrderByRelationAggregateInput
  }

  export type LearningSessionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: LearningSessionWhereInput | LearningSessionWhereInput[]
    OR?: LearningSessionWhereInput[]
    NOT?: LearningSessionWhereInput | LearningSessionWhereInput[]
    userId?: StringFilter<"LearningSession"> | string
    topic?: StringFilter<"LearningSession"> | string
    status?: EnumSessionStatusFilter<"LearningSession"> | $Enums.SessionStatus
    totalGenerated?: IntFilter<"LearningSession"> | number
    totalCompleted?: IntFilter<"LearningSession"> | number
    startedAt?: DateTimeFilter<"LearningSession"> | Date | string
    completedAt?: DateTimeNullableFilter<"LearningSession"> | Date | string | null
    createdAt?: DateTimeFilter<"LearningSession"> | Date | string
    updatedAt?: DateTimeFilter<"LearningSession"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    items?: LearningItemListRelationFilter
  }, "id">

  export type LearningSessionOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    topic?: SortOrder
    status?: SortOrder
    totalGenerated?: SortOrder
    totalCompleted?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: LearningSessionCountOrderByAggregateInput
    _avg?: LearningSessionAvgOrderByAggregateInput
    _max?: LearningSessionMaxOrderByAggregateInput
    _min?: LearningSessionMinOrderByAggregateInput
    _sum?: LearningSessionSumOrderByAggregateInput
  }

  export type LearningSessionScalarWhereWithAggregatesInput = {
    AND?: LearningSessionScalarWhereWithAggregatesInput | LearningSessionScalarWhereWithAggregatesInput[]
    OR?: LearningSessionScalarWhereWithAggregatesInput[]
    NOT?: LearningSessionScalarWhereWithAggregatesInput | LearningSessionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"LearningSession"> | string
    userId?: StringWithAggregatesFilter<"LearningSession"> | string
    topic?: StringWithAggregatesFilter<"LearningSession"> | string
    status?: EnumSessionStatusWithAggregatesFilter<"LearningSession"> | $Enums.SessionStatus
    totalGenerated?: IntWithAggregatesFilter<"LearningSession"> | number
    totalCompleted?: IntWithAggregatesFilter<"LearningSession"> | number
    startedAt?: DateTimeWithAggregatesFilter<"LearningSession"> | Date | string
    completedAt?: DateTimeNullableWithAggregatesFilter<"LearningSession"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"LearningSession"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"LearningSession"> | Date | string
  }

  export type LearningItemWhereInput = {
    AND?: LearningItemWhereInput | LearningItemWhereInput[]
    OR?: LearningItemWhereInput[]
    NOT?: LearningItemWhereInput | LearningItemWhereInput[]
    id?: StringFilter<"LearningItem"> | string
    userId?: StringFilter<"LearningItem"> | string
    sessionId?: StringNullableFilter<"LearningItem"> | string | null
    type?: EnumLearningItemTypeFilter<"LearningItem"> | $Enums.LearningItemType
    topic?: StringFilter<"LearningItem"> | string
    difficulty?: IntFilter<"LearningItem"> | number
    payload?: JsonFilter<"LearningItem">
    isPublished?: BoolFilter<"LearningItem"> | boolean
    engagementScore?: FloatFilter<"LearningItem"> | number
    masteredByUser?: BoolFilter<"LearningItem"> | boolean
    lastInteractedAt?: DateTimeNullableFilter<"LearningItem"> | Date | string | null
    nextReviewAt?: DateTimeNullableFilter<"LearningItem"> | Date | string | null
    reviewInterval?: IntFilter<"LearningItem"> | number
    reviewCount?: IntFilter<"LearningItem"> | number
    createdAt?: DateTimeFilter<"LearningItem"> | Date | string
    updatedAt?: DateTimeFilter<"LearningItem"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    session?: XOR<LearningSessionNullableRelationFilter, LearningSessionWhereInput> | null
    feedItem?: XOR<FeedItemNullableRelationFilter, FeedItemWhereInput> | null
    interactions?: UserInteractionListRelationFilter
  }

  export type LearningItemOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    sessionId?: SortOrderInput | SortOrder
    type?: SortOrder
    topic?: SortOrder
    difficulty?: SortOrder
    payload?: SortOrder
    isPublished?: SortOrder
    engagementScore?: SortOrder
    masteredByUser?: SortOrder
    lastInteractedAt?: SortOrderInput | SortOrder
    nextReviewAt?: SortOrderInput | SortOrder
    reviewInterval?: SortOrder
    reviewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    session?: LearningSessionOrderByWithRelationInput
    feedItem?: FeedItemOrderByWithRelationInput
    interactions?: UserInteractionOrderByRelationAggregateInput
  }

  export type LearningItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: LearningItemWhereInput | LearningItemWhereInput[]
    OR?: LearningItemWhereInput[]
    NOT?: LearningItemWhereInput | LearningItemWhereInput[]
    userId?: StringFilter<"LearningItem"> | string
    sessionId?: StringNullableFilter<"LearningItem"> | string | null
    type?: EnumLearningItemTypeFilter<"LearningItem"> | $Enums.LearningItemType
    topic?: StringFilter<"LearningItem"> | string
    difficulty?: IntFilter<"LearningItem"> | number
    payload?: JsonFilter<"LearningItem">
    isPublished?: BoolFilter<"LearningItem"> | boolean
    engagementScore?: FloatFilter<"LearningItem"> | number
    masteredByUser?: BoolFilter<"LearningItem"> | boolean
    lastInteractedAt?: DateTimeNullableFilter<"LearningItem"> | Date | string | null
    nextReviewAt?: DateTimeNullableFilter<"LearningItem"> | Date | string | null
    reviewInterval?: IntFilter<"LearningItem"> | number
    reviewCount?: IntFilter<"LearningItem"> | number
    createdAt?: DateTimeFilter<"LearningItem"> | Date | string
    updatedAt?: DateTimeFilter<"LearningItem"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    session?: XOR<LearningSessionNullableRelationFilter, LearningSessionWhereInput> | null
    feedItem?: XOR<FeedItemNullableRelationFilter, FeedItemWhereInput> | null
    interactions?: UserInteractionListRelationFilter
  }, "id">

  export type LearningItemOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    sessionId?: SortOrderInput | SortOrder
    type?: SortOrder
    topic?: SortOrder
    difficulty?: SortOrder
    payload?: SortOrder
    isPublished?: SortOrder
    engagementScore?: SortOrder
    masteredByUser?: SortOrder
    lastInteractedAt?: SortOrderInput | SortOrder
    nextReviewAt?: SortOrderInput | SortOrder
    reviewInterval?: SortOrder
    reviewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: LearningItemCountOrderByAggregateInput
    _avg?: LearningItemAvgOrderByAggregateInput
    _max?: LearningItemMaxOrderByAggregateInput
    _min?: LearningItemMinOrderByAggregateInput
    _sum?: LearningItemSumOrderByAggregateInput
  }

  export type LearningItemScalarWhereWithAggregatesInput = {
    AND?: LearningItemScalarWhereWithAggregatesInput | LearningItemScalarWhereWithAggregatesInput[]
    OR?: LearningItemScalarWhereWithAggregatesInput[]
    NOT?: LearningItemScalarWhereWithAggregatesInput | LearningItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"LearningItem"> | string
    userId?: StringWithAggregatesFilter<"LearningItem"> | string
    sessionId?: StringNullableWithAggregatesFilter<"LearningItem"> | string | null
    type?: EnumLearningItemTypeWithAggregatesFilter<"LearningItem"> | $Enums.LearningItemType
    topic?: StringWithAggregatesFilter<"LearningItem"> | string
    difficulty?: IntWithAggregatesFilter<"LearningItem"> | number
    payload?: JsonWithAggregatesFilter<"LearningItem">
    isPublished?: BoolWithAggregatesFilter<"LearningItem"> | boolean
    engagementScore?: FloatWithAggregatesFilter<"LearningItem"> | number
    masteredByUser?: BoolWithAggregatesFilter<"LearningItem"> | boolean
    lastInteractedAt?: DateTimeNullableWithAggregatesFilter<"LearningItem"> | Date | string | null
    nextReviewAt?: DateTimeNullableWithAggregatesFilter<"LearningItem"> | Date | string | null
    reviewInterval?: IntWithAggregatesFilter<"LearningItem"> | number
    reviewCount?: IntWithAggregatesFilter<"LearningItem"> | number
    createdAt?: DateTimeWithAggregatesFilter<"LearningItem"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"LearningItem"> | Date | string
  }

  export type FeedItemWhereInput = {
    AND?: FeedItemWhereInput | FeedItemWhereInput[]
    OR?: FeedItemWhereInput[]
    NOT?: FeedItemWhereInput | FeedItemWhereInput[]
    id?: StringFilter<"FeedItem"> | string
    learningItemId?: StringFilter<"FeedItem"> | string
    publishedByUserId?: StringNullableFilter<"FeedItem"> | string | null
    publishedAt?: DateTimeFilter<"FeedItem"> | Date | string
    createdAt?: DateTimeFilter<"FeedItem"> | Date | string
    userId?: StringNullableFilter<"FeedItem"> | string | null
    learningItem?: XOR<LearningItemRelationFilter, LearningItemWhereInput>
    user?: XOR<UserNullableRelationFilter, UserWhereInput> | null
  }

  export type FeedItemOrderByWithRelationInput = {
    id?: SortOrder
    learningItemId?: SortOrder
    publishedByUserId?: SortOrderInput | SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
    userId?: SortOrderInput | SortOrder
    learningItem?: LearningItemOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type FeedItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    learningItemId?: string
    AND?: FeedItemWhereInput | FeedItemWhereInput[]
    OR?: FeedItemWhereInput[]
    NOT?: FeedItemWhereInput | FeedItemWhereInput[]
    publishedByUserId?: StringNullableFilter<"FeedItem"> | string | null
    publishedAt?: DateTimeFilter<"FeedItem"> | Date | string
    createdAt?: DateTimeFilter<"FeedItem"> | Date | string
    userId?: StringNullableFilter<"FeedItem"> | string | null
    learningItem?: XOR<LearningItemRelationFilter, LearningItemWhereInput>
    user?: XOR<UserNullableRelationFilter, UserWhereInput> | null
  }, "id" | "learningItemId">

  export type FeedItemOrderByWithAggregationInput = {
    id?: SortOrder
    learningItemId?: SortOrder
    publishedByUserId?: SortOrderInput | SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
    userId?: SortOrderInput | SortOrder
    _count?: FeedItemCountOrderByAggregateInput
    _max?: FeedItemMaxOrderByAggregateInput
    _min?: FeedItemMinOrderByAggregateInput
  }

  export type FeedItemScalarWhereWithAggregatesInput = {
    AND?: FeedItemScalarWhereWithAggregatesInput | FeedItemScalarWhereWithAggregatesInput[]
    OR?: FeedItemScalarWhereWithAggregatesInput[]
    NOT?: FeedItemScalarWhereWithAggregatesInput | FeedItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"FeedItem"> | string
    learningItemId?: StringWithAggregatesFilter<"FeedItem"> | string
    publishedByUserId?: StringNullableWithAggregatesFilter<"FeedItem"> | string | null
    publishedAt?: DateTimeWithAggregatesFilter<"FeedItem"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"FeedItem"> | Date | string
    userId?: StringNullableWithAggregatesFilter<"FeedItem"> | string | null
  }

  export type UserInteractionWhereInput = {
    AND?: UserInteractionWhereInput | UserInteractionWhereInput[]
    OR?: UserInteractionWhereInput[]
    NOT?: UserInteractionWhereInput | UserInteractionWhereInput[]
    id?: StringFilter<"UserInteraction"> | string
    userId?: StringFilter<"UserInteraction"> | string
    learningItemId?: StringFilter<"UserInteraction"> | string
    type?: EnumInteractionTypeFilter<"UserInteraction"> | $Enums.InteractionType
    isCorrect?: BoolNullableFilter<"UserInteraction"> | boolean | null
    createdAt?: DateTimeFilter<"UserInteraction"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    learningItem?: XOR<LearningItemRelationFilter, LearningItemWhereInput>
  }

  export type UserInteractionOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    learningItemId?: SortOrder
    type?: SortOrder
    isCorrect?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
    learningItem?: LearningItemOrderByWithRelationInput
  }

  export type UserInteractionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: UserInteractionWhereInput | UserInteractionWhereInput[]
    OR?: UserInteractionWhereInput[]
    NOT?: UserInteractionWhereInput | UserInteractionWhereInput[]
    userId?: StringFilter<"UserInteraction"> | string
    learningItemId?: StringFilter<"UserInteraction"> | string
    type?: EnumInteractionTypeFilter<"UserInteraction"> | $Enums.InteractionType
    isCorrect?: BoolNullableFilter<"UserInteraction"> | boolean | null
    createdAt?: DateTimeFilter<"UserInteraction"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    learningItem?: XOR<LearningItemRelationFilter, LearningItemWhereInput>
  }, "id">

  export type UserInteractionOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    learningItemId?: SortOrder
    type?: SortOrder
    isCorrect?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: UserInteractionCountOrderByAggregateInput
    _max?: UserInteractionMaxOrderByAggregateInput
    _min?: UserInteractionMinOrderByAggregateInput
  }

  export type UserInteractionScalarWhereWithAggregatesInput = {
    AND?: UserInteractionScalarWhereWithAggregatesInput | UserInteractionScalarWhereWithAggregatesInput[]
    OR?: UserInteractionScalarWhereWithAggregatesInput[]
    NOT?: UserInteractionScalarWhereWithAggregatesInput | UserInteractionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"UserInteraction"> | string
    userId?: StringWithAggregatesFilter<"UserInteraction"> | string
    learningItemId?: StringWithAggregatesFilter<"UserInteraction"> | string
    type?: EnumInteractionTypeWithAggregatesFilter<"UserInteraction"> | $Enums.InteractionType
    isCorrect?: BoolNullableWithAggregatesFilter<"UserInteraction"> | boolean | null
    createdAt?: DateTimeWithAggregatesFilter<"UserInteraction"> | Date | string
  }

  export type LearningStreakWhereInput = {
    AND?: LearningStreakWhereInput | LearningStreakWhereInput[]
    OR?: LearningStreakWhereInput[]
    NOT?: LearningStreakWhereInput | LearningStreakWhereInput[]
    id?: StringFilter<"LearningStreak"> | string
    userId?: StringFilter<"LearningStreak"> | string
    currentStreak?: IntFilter<"LearningStreak"> | number
    longestStreak?: IntFilter<"LearningStreak"> | number
    lastActiveDate?: DateTimeNullableFilter<"LearningStreak"> | Date | string | null
    updatedAt?: DateTimeFilter<"LearningStreak"> | Date | string
    createdAt?: DateTimeFilter<"LearningStreak"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
  }

  export type LearningStreakOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    currentStreak?: SortOrder
    longestStreak?: SortOrder
    lastActiveDate?: SortOrderInput | SortOrder
    updatedAt?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type LearningStreakWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: LearningStreakWhereInput | LearningStreakWhereInput[]
    OR?: LearningStreakWhereInput[]
    NOT?: LearningStreakWhereInput | LearningStreakWhereInput[]
    currentStreak?: IntFilter<"LearningStreak"> | number
    longestStreak?: IntFilter<"LearningStreak"> | number
    lastActiveDate?: DateTimeNullableFilter<"LearningStreak"> | Date | string | null
    updatedAt?: DateTimeFilter<"LearningStreak"> | Date | string
    createdAt?: DateTimeFilter<"LearningStreak"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
  }, "id" | "userId">

  export type LearningStreakOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    currentStreak?: SortOrder
    longestStreak?: SortOrder
    lastActiveDate?: SortOrderInput | SortOrder
    updatedAt?: SortOrder
    createdAt?: SortOrder
    _count?: LearningStreakCountOrderByAggregateInput
    _avg?: LearningStreakAvgOrderByAggregateInput
    _max?: LearningStreakMaxOrderByAggregateInput
    _min?: LearningStreakMinOrderByAggregateInput
    _sum?: LearningStreakSumOrderByAggregateInput
  }

  export type LearningStreakScalarWhereWithAggregatesInput = {
    AND?: LearningStreakScalarWhereWithAggregatesInput | LearningStreakScalarWhereWithAggregatesInput[]
    OR?: LearningStreakScalarWhereWithAggregatesInput[]
    NOT?: LearningStreakScalarWhereWithAggregatesInput | LearningStreakScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"LearningStreak"> | string
    userId?: StringWithAggregatesFilter<"LearningStreak"> | string
    currentStreak?: IntWithAggregatesFilter<"LearningStreak"> | number
    longestStreak?: IntWithAggregatesFilter<"LearningStreak"> | number
    lastActiveDate?: DateTimeNullableWithAggregatesFilter<"LearningStreak"> | Date | string | null
    updatedAt?: DateTimeWithAggregatesFilter<"LearningStreak"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"LearningStreak"> | Date | string
  }

  export type LeaderboardScoreWhereInput = {
    AND?: LeaderboardScoreWhereInput | LeaderboardScoreWhereInput[]
    OR?: LeaderboardScoreWhereInput[]
    NOT?: LeaderboardScoreWhereInput | LeaderboardScoreWhereInput[]
    id?: StringFilter<"LeaderboardScore"> | string
    userId?: StringFilter<"LeaderboardScore"> | string
    score?: FloatFilter<"LeaderboardScore"> | number
    correctAnswers?: IntFilter<"LeaderboardScore"> | number
    sessionsCompleted?: IntFilter<"LeaderboardScore"> | number
    streak?: IntFilter<"LeaderboardScore"> | number
    updatedAt?: DateTimeFilter<"LeaderboardScore"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
  }

  export type LeaderboardScoreOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    score?: SortOrder
    correctAnswers?: SortOrder
    sessionsCompleted?: SortOrder
    streak?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type LeaderboardScoreWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: LeaderboardScoreWhereInput | LeaderboardScoreWhereInput[]
    OR?: LeaderboardScoreWhereInput[]
    NOT?: LeaderboardScoreWhereInput | LeaderboardScoreWhereInput[]
    score?: FloatFilter<"LeaderboardScore"> | number
    correctAnswers?: IntFilter<"LeaderboardScore"> | number
    sessionsCompleted?: IntFilter<"LeaderboardScore"> | number
    streak?: IntFilter<"LeaderboardScore"> | number
    updatedAt?: DateTimeFilter<"LeaderboardScore"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
  }, "id" | "userId">

  export type LeaderboardScoreOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    score?: SortOrder
    correctAnswers?: SortOrder
    sessionsCompleted?: SortOrder
    streak?: SortOrder
    updatedAt?: SortOrder
    _count?: LeaderboardScoreCountOrderByAggregateInput
    _avg?: LeaderboardScoreAvgOrderByAggregateInput
    _max?: LeaderboardScoreMaxOrderByAggregateInput
    _min?: LeaderboardScoreMinOrderByAggregateInput
    _sum?: LeaderboardScoreSumOrderByAggregateInput
  }

  export type LeaderboardScoreScalarWhereWithAggregatesInput = {
    AND?: LeaderboardScoreScalarWhereWithAggregatesInput | LeaderboardScoreScalarWhereWithAggregatesInput[]
    OR?: LeaderboardScoreScalarWhereWithAggregatesInput[]
    NOT?: LeaderboardScoreScalarWhereWithAggregatesInput | LeaderboardScoreScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"LeaderboardScore"> | string
    userId?: StringWithAggregatesFilter<"LeaderboardScore"> | string
    score?: FloatWithAggregatesFilter<"LeaderboardScore"> | number
    correctAnswers?: IntWithAggregatesFilter<"LeaderboardScore"> | number
    sessionsCompleted?: IntWithAggregatesFilter<"LeaderboardScore"> | number
    streak?: IntWithAggregatesFilter<"LeaderboardScore"> | number
    updatedAt?: DateTimeWithAggregatesFilter<"LeaderboardScore"> | Date | string
  }

  export type DailyChallengeWhereInput = {
    AND?: DailyChallengeWhereInput | DailyChallengeWhereInput[]
    OR?: DailyChallengeWhereInput[]
    NOT?: DailyChallengeWhereInput | DailyChallengeWhereInput[]
    id?: StringFilter<"DailyChallenge"> | string
    date?: DateTimeFilter<"DailyChallenge"> | Date | string
    items?: StringNullableListFilter<"DailyChallenge">
    createdAt?: DateTimeFilter<"DailyChallenge"> | Date | string
  }

  export type DailyChallengeOrderByWithRelationInput = {
    id?: SortOrder
    date?: SortOrder
    items?: SortOrder
    createdAt?: SortOrder
  }

  export type DailyChallengeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    date?: Date | string
    AND?: DailyChallengeWhereInput | DailyChallengeWhereInput[]
    OR?: DailyChallengeWhereInput[]
    NOT?: DailyChallengeWhereInput | DailyChallengeWhereInput[]
    items?: StringNullableListFilter<"DailyChallenge">
    createdAt?: DateTimeFilter<"DailyChallenge"> | Date | string
  }, "id" | "date">

  export type DailyChallengeOrderByWithAggregationInput = {
    id?: SortOrder
    date?: SortOrder
    items?: SortOrder
    createdAt?: SortOrder
    _count?: DailyChallengeCountOrderByAggregateInput
    _max?: DailyChallengeMaxOrderByAggregateInput
    _min?: DailyChallengeMinOrderByAggregateInput
  }

  export type DailyChallengeScalarWhereWithAggregatesInput = {
    AND?: DailyChallengeScalarWhereWithAggregatesInput | DailyChallengeScalarWhereWithAggregatesInput[]
    OR?: DailyChallengeScalarWhereWithAggregatesInput[]
    NOT?: DailyChallengeScalarWhereWithAggregatesInput | DailyChallengeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"DailyChallenge"> | string
    date?: DateTimeWithAggregatesFilter<"DailyChallenge"> | Date | string
    items?: StringNullableListFilter<"DailyChallenge">
    createdAt?: DateTimeWithAggregatesFilter<"DailyChallenge"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    email: string
    name?: string | null
    firebaseUid: string
    targetExam?: string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    pushTokens?: PushTokenCreateNestedManyWithoutUserInput
    sessions?: LearningSessionCreateNestedManyWithoutUserInput
    learningItems?: LearningItemCreateNestedManyWithoutUserInput
    interactions?: UserInteractionCreateNestedManyWithoutUserInput
    feedItems?: FeedItemCreateNestedManyWithoutUserInput
    streak?: LearningStreakCreateNestedOneWithoutUserInput
    leaderboardScore?: LeaderboardScoreCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    name?: string | null
    firebaseUid: string
    targetExam?: string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    pushTokens?: PushTokenUncheckedCreateNestedManyWithoutUserInput
    sessions?: LearningSessionUncheckedCreateNestedManyWithoutUserInput
    learningItems?: LearningItemUncheckedCreateNestedManyWithoutUserInput
    interactions?: UserInteractionUncheckedCreateNestedManyWithoutUserInput
    feedItems?: FeedItemUncheckedCreateNestedManyWithoutUserInput
    streak?: LearningStreakUncheckedCreateNestedOneWithoutUserInput
    leaderboardScore?: LeaderboardScoreUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    firebaseUid?: StringFieldUpdateOperationsInput | string
    targetExam?: NullableStringFieldUpdateOperationsInput | string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pushTokens?: PushTokenUpdateManyWithoutUserNestedInput
    sessions?: LearningSessionUpdateManyWithoutUserNestedInput
    learningItems?: LearningItemUpdateManyWithoutUserNestedInput
    interactions?: UserInteractionUpdateManyWithoutUserNestedInput
    feedItems?: FeedItemUpdateManyWithoutUserNestedInput
    streak?: LearningStreakUpdateOneWithoutUserNestedInput
    leaderboardScore?: LeaderboardScoreUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    firebaseUid?: StringFieldUpdateOperationsInput | string
    targetExam?: NullableStringFieldUpdateOperationsInput | string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pushTokens?: PushTokenUncheckedUpdateManyWithoutUserNestedInput
    sessions?: LearningSessionUncheckedUpdateManyWithoutUserNestedInput
    learningItems?: LearningItemUncheckedUpdateManyWithoutUserNestedInput
    interactions?: UserInteractionUncheckedUpdateManyWithoutUserNestedInput
    feedItems?: FeedItemUncheckedUpdateManyWithoutUserNestedInput
    streak?: LearningStreakUncheckedUpdateOneWithoutUserNestedInput
    leaderboardScore?: LeaderboardScoreUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    name?: string | null
    firebaseUid: string
    targetExam?: string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    firebaseUid?: StringFieldUpdateOperationsInput | string
    targetExam?: NullableStringFieldUpdateOperationsInput | string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    firebaseUid?: StringFieldUpdateOperationsInput | string
    targetExam?: NullableStringFieldUpdateOperationsInput | string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PushTokenCreateInput = {
    id?: string
    token: string
    user: UserCreateNestedOneWithoutPushTokensInput
  }

  export type PushTokenUncheckedCreateInput = {
    id?: string
    token: string
    userId: string
  }

  export type PushTokenUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    user?: UserUpdateOneRequiredWithoutPushTokensNestedInput
  }

  export type PushTokenUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type PushTokenCreateManyInput = {
    id?: string
    token: string
    userId: string
  }

  export type PushTokenUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
  }

  export type PushTokenUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type LearningSessionCreateInput = {
    id?: string
    topic: string
    status?: $Enums.SessionStatus
    totalGenerated?: number
    totalCompleted?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutSessionsInput
    items?: LearningItemCreateNestedManyWithoutSessionInput
  }

  export type LearningSessionUncheckedCreateInput = {
    id?: string
    userId: string
    topic: string
    status?: $Enums.SessionStatus
    totalGenerated?: number
    totalCompleted?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    items?: LearningItemUncheckedCreateNestedManyWithoutSessionInput
  }

  export type LearningSessionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    status?: EnumSessionStatusFieldUpdateOperationsInput | $Enums.SessionStatus
    totalGenerated?: IntFieldUpdateOperationsInput | number
    totalCompleted?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSessionsNestedInput
    items?: LearningItemUpdateManyWithoutSessionNestedInput
  }

  export type LearningSessionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    status?: EnumSessionStatusFieldUpdateOperationsInput | $Enums.SessionStatus
    totalGenerated?: IntFieldUpdateOperationsInput | number
    totalCompleted?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: LearningItemUncheckedUpdateManyWithoutSessionNestedInput
  }

  export type LearningSessionCreateManyInput = {
    id?: string
    userId: string
    topic: string
    status?: $Enums.SessionStatus
    totalGenerated?: number
    totalCompleted?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LearningSessionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    status?: EnumSessionStatusFieldUpdateOperationsInput | $Enums.SessionStatus
    totalGenerated?: IntFieldUpdateOperationsInput | number
    totalCompleted?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LearningSessionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    status?: EnumSessionStatusFieldUpdateOperationsInput | $Enums.SessionStatus
    totalGenerated?: IntFieldUpdateOperationsInput | number
    totalCompleted?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LearningItemCreateInput = {
    id?: string
    type: $Enums.LearningItemType
    topic: string
    difficulty?: number
    payload: JsonNullValueInput | InputJsonValue
    isPublished?: boolean
    engagementScore?: number
    masteredByUser?: boolean
    lastInteractedAt?: Date | string | null
    nextReviewAt?: Date | string | null
    reviewInterval?: number
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutLearningItemsInput
    session?: LearningSessionCreateNestedOneWithoutItemsInput
    feedItem?: FeedItemCreateNestedOneWithoutLearningItemInput
    interactions?: UserInteractionCreateNestedManyWithoutLearningItemInput
  }

  export type LearningItemUncheckedCreateInput = {
    id?: string
    userId: string
    sessionId?: string | null
    type: $Enums.LearningItemType
    topic: string
    difficulty?: number
    payload: JsonNullValueInput | InputJsonValue
    isPublished?: boolean
    engagementScore?: number
    masteredByUser?: boolean
    lastInteractedAt?: Date | string | null
    nextReviewAt?: Date | string | null
    reviewInterval?: number
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    feedItem?: FeedItemUncheckedCreateNestedOneWithoutLearningItemInput
    interactions?: UserInteractionUncheckedCreateNestedManyWithoutLearningItemInput
  }

  export type LearningItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumLearningItemTypeFieldUpdateOperationsInput | $Enums.LearningItemType
    topic?: StringFieldUpdateOperationsInput | string
    difficulty?: IntFieldUpdateOperationsInput | number
    payload?: JsonNullValueInput | InputJsonValue
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    engagementScore?: FloatFieldUpdateOperationsInput | number
    masteredByUser?: BoolFieldUpdateOperationsInput | boolean
    lastInteractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextReviewAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewInterval?: IntFieldUpdateOperationsInput | number
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutLearningItemsNestedInput
    session?: LearningSessionUpdateOneWithoutItemsNestedInput
    feedItem?: FeedItemUpdateOneWithoutLearningItemNestedInput
    interactions?: UserInteractionUpdateManyWithoutLearningItemNestedInput
  }

  export type LearningItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumLearningItemTypeFieldUpdateOperationsInput | $Enums.LearningItemType
    topic?: StringFieldUpdateOperationsInput | string
    difficulty?: IntFieldUpdateOperationsInput | number
    payload?: JsonNullValueInput | InputJsonValue
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    engagementScore?: FloatFieldUpdateOperationsInput | number
    masteredByUser?: BoolFieldUpdateOperationsInput | boolean
    lastInteractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextReviewAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewInterval?: IntFieldUpdateOperationsInput | number
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    feedItem?: FeedItemUncheckedUpdateOneWithoutLearningItemNestedInput
    interactions?: UserInteractionUncheckedUpdateManyWithoutLearningItemNestedInput
  }

  export type LearningItemCreateManyInput = {
    id?: string
    userId: string
    sessionId?: string | null
    type: $Enums.LearningItemType
    topic: string
    difficulty?: number
    payload: JsonNullValueInput | InputJsonValue
    isPublished?: boolean
    engagementScore?: number
    masteredByUser?: boolean
    lastInteractedAt?: Date | string | null
    nextReviewAt?: Date | string | null
    reviewInterval?: number
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LearningItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumLearningItemTypeFieldUpdateOperationsInput | $Enums.LearningItemType
    topic?: StringFieldUpdateOperationsInput | string
    difficulty?: IntFieldUpdateOperationsInput | number
    payload?: JsonNullValueInput | InputJsonValue
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    engagementScore?: FloatFieldUpdateOperationsInput | number
    masteredByUser?: BoolFieldUpdateOperationsInput | boolean
    lastInteractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextReviewAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewInterval?: IntFieldUpdateOperationsInput | number
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LearningItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumLearningItemTypeFieldUpdateOperationsInput | $Enums.LearningItemType
    topic?: StringFieldUpdateOperationsInput | string
    difficulty?: IntFieldUpdateOperationsInput | number
    payload?: JsonNullValueInput | InputJsonValue
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    engagementScore?: FloatFieldUpdateOperationsInput | number
    masteredByUser?: BoolFieldUpdateOperationsInput | boolean
    lastInteractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextReviewAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewInterval?: IntFieldUpdateOperationsInput | number
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FeedItemCreateInput = {
    id?: string
    publishedByUserId?: string | null
    publishedAt?: Date | string
    createdAt?: Date | string
    learningItem: LearningItemCreateNestedOneWithoutFeedItemInput
    user?: UserCreateNestedOneWithoutFeedItemsInput
  }

  export type FeedItemUncheckedCreateInput = {
    id?: string
    learningItemId: string
    publishedByUserId?: string | null
    publishedAt?: Date | string
    createdAt?: Date | string
    userId?: string | null
  }

  export type FeedItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    publishedByUserId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    learningItem?: LearningItemUpdateOneRequiredWithoutFeedItemNestedInput
    user?: UserUpdateOneWithoutFeedItemsNestedInput
  }

  export type FeedItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    learningItemId?: StringFieldUpdateOperationsInput | string
    publishedByUserId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type FeedItemCreateManyInput = {
    id?: string
    learningItemId: string
    publishedByUserId?: string | null
    publishedAt?: Date | string
    createdAt?: Date | string
    userId?: string | null
  }

  export type FeedItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    publishedByUserId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FeedItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    learningItemId?: StringFieldUpdateOperationsInput | string
    publishedByUserId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type UserInteractionCreateInput = {
    id?: string
    type: $Enums.InteractionType
    isCorrect?: boolean | null
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutInteractionsInput
    learningItem: LearningItemCreateNestedOneWithoutInteractionsInput
  }

  export type UserInteractionUncheckedCreateInput = {
    id?: string
    userId: string
    learningItemId: string
    type: $Enums.InteractionType
    isCorrect?: boolean | null
    createdAt?: Date | string
  }

  export type UserInteractionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumInteractionTypeFieldUpdateOperationsInput | $Enums.InteractionType
    isCorrect?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutInteractionsNestedInput
    learningItem?: LearningItemUpdateOneRequiredWithoutInteractionsNestedInput
  }

  export type UserInteractionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    learningItemId?: StringFieldUpdateOperationsInput | string
    type?: EnumInteractionTypeFieldUpdateOperationsInput | $Enums.InteractionType
    isCorrect?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserInteractionCreateManyInput = {
    id?: string
    userId: string
    learningItemId: string
    type: $Enums.InteractionType
    isCorrect?: boolean | null
    createdAt?: Date | string
  }

  export type UserInteractionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumInteractionTypeFieldUpdateOperationsInput | $Enums.InteractionType
    isCorrect?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserInteractionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    learningItemId?: StringFieldUpdateOperationsInput | string
    type?: EnumInteractionTypeFieldUpdateOperationsInput | $Enums.InteractionType
    isCorrect?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LearningStreakCreateInput = {
    id?: string
    currentStreak?: number
    longestStreak?: number
    lastActiveDate?: Date | string | null
    updatedAt?: Date | string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutStreakInput
  }

  export type LearningStreakUncheckedCreateInput = {
    id?: string
    userId: string
    currentStreak?: number
    longestStreak?: number
    lastActiveDate?: Date | string | null
    updatedAt?: Date | string
    createdAt?: Date | string
  }

  export type LearningStreakUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    currentStreak?: IntFieldUpdateOperationsInput | number
    longestStreak?: IntFieldUpdateOperationsInput | number
    lastActiveDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutStreakNestedInput
  }

  export type LearningStreakUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    currentStreak?: IntFieldUpdateOperationsInput | number
    longestStreak?: IntFieldUpdateOperationsInput | number
    lastActiveDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LearningStreakCreateManyInput = {
    id?: string
    userId: string
    currentStreak?: number
    longestStreak?: number
    lastActiveDate?: Date | string | null
    updatedAt?: Date | string
    createdAt?: Date | string
  }

  export type LearningStreakUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    currentStreak?: IntFieldUpdateOperationsInput | number
    longestStreak?: IntFieldUpdateOperationsInput | number
    lastActiveDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LearningStreakUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    currentStreak?: IntFieldUpdateOperationsInput | number
    longestStreak?: IntFieldUpdateOperationsInput | number
    lastActiveDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LeaderboardScoreCreateInput = {
    id?: string
    score?: number
    correctAnswers?: number
    sessionsCompleted?: number
    streak?: number
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutLeaderboardScoreInput
  }

  export type LeaderboardScoreUncheckedCreateInput = {
    id?: string
    userId: string
    score?: number
    correctAnswers?: number
    sessionsCompleted?: number
    streak?: number
    updatedAt?: Date | string
  }

  export type LeaderboardScoreUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    correctAnswers?: IntFieldUpdateOperationsInput | number
    sessionsCompleted?: IntFieldUpdateOperationsInput | number
    streak?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutLeaderboardScoreNestedInput
  }

  export type LeaderboardScoreUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    correctAnswers?: IntFieldUpdateOperationsInput | number
    sessionsCompleted?: IntFieldUpdateOperationsInput | number
    streak?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LeaderboardScoreCreateManyInput = {
    id?: string
    userId: string
    score?: number
    correctAnswers?: number
    sessionsCompleted?: number
    streak?: number
    updatedAt?: Date | string
  }

  export type LeaderboardScoreUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    correctAnswers?: IntFieldUpdateOperationsInput | number
    sessionsCompleted?: IntFieldUpdateOperationsInput | number
    streak?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LeaderboardScoreUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    correctAnswers?: IntFieldUpdateOperationsInput | number
    sessionsCompleted?: IntFieldUpdateOperationsInput | number
    streak?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DailyChallengeCreateInput = {
    id?: string
    date: Date | string
    items?: DailyChallengeCreateitemsInput | string[]
    createdAt?: Date | string
  }

  export type DailyChallengeUncheckedCreateInput = {
    id?: string
    date: Date | string
    items?: DailyChallengeCreateitemsInput | string[]
    createdAt?: Date | string
  }

  export type DailyChallengeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: DailyChallengeUpdateitemsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DailyChallengeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: DailyChallengeUpdateitemsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DailyChallengeCreateManyInput = {
    id?: string
    date: Date | string
    items?: DailyChallengeCreateitemsInput | string[]
    createdAt?: Date | string
  }

  export type DailyChallengeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: DailyChallengeUpdateitemsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DailyChallengeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: DailyChallengeUpdateitemsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }
  export type JsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type PushTokenListRelationFilter = {
    every?: PushTokenWhereInput
    some?: PushTokenWhereInput
    none?: PushTokenWhereInput
  }

  export type LearningSessionListRelationFilter = {
    every?: LearningSessionWhereInput
    some?: LearningSessionWhereInput
    none?: LearningSessionWhereInput
  }

  export type LearningItemListRelationFilter = {
    every?: LearningItemWhereInput
    some?: LearningItemWhereInput
    none?: LearningItemWhereInput
  }

  export type UserInteractionListRelationFilter = {
    every?: UserInteractionWhereInput
    some?: UserInteractionWhereInput
    none?: UserInteractionWhereInput
  }

  export type FeedItemListRelationFilter = {
    every?: FeedItemWhereInput
    some?: FeedItemWhereInput
    none?: FeedItemWhereInput
  }

  export type LearningStreakNullableRelationFilter = {
    is?: LearningStreakWhereInput | null
    isNot?: LearningStreakWhereInput | null
  }

  export type LeaderboardScoreNullableRelationFilter = {
    is?: LeaderboardScoreWhereInput | null
    isNot?: LeaderboardScoreWhereInput | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type PushTokenOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LearningSessionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LearningItemOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserInteractionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type FeedItemOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    firebaseUid?: SortOrder
    targetExam?: SortOrder
    preferredTopics?: SortOrder
    preferredDifficulty?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    preferredDifficulty?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    firebaseUid?: SortOrder
    targetExam?: SortOrder
    preferredDifficulty?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    firebaseUid?: SortOrder
    targetExam?: SortOrder
    preferredDifficulty?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    preferredDifficulty?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type UserRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type PushTokenCountOrderByAggregateInput = {
    id?: SortOrder
    token?: SortOrder
    userId?: SortOrder
  }

  export type PushTokenMaxOrderByAggregateInput = {
    id?: SortOrder
    token?: SortOrder
    userId?: SortOrder
  }

  export type PushTokenMinOrderByAggregateInput = {
    id?: SortOrder
    token?: SortOrder
    userId?: SortOrder
  }

  export type EnumSessionStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SessionStatus | EnumSessionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SessionStatus[] | ListEnumSessionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SessionStatus[] | ListEnumSessionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSessionStatusFilter<$PrismaModel> | $Enums.SessionStatus
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type LearningSessionCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    topic?: SortOrder
    status?: SortOrder
    totalGenerated?: SortOrder
    totalCompleted?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LearningSessionAvgOrderByAggregateInput = {
    totalGenerated?: SortOrder
    totalCompleted?: SortOrder
  }

  export type LearningSessionMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    topic?: SortOrder
    status?: SortOrder
    totalGenerated?: SortOrder
    totalCompleted?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LearningSessionMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    topic?: SortOrder
    status?: SortOrder
    totalGenerated?: SortOrder
    totalCompleted?: SortOrder
    startedAt?: SortOrder
    completedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LearningSessionSumOrderByAggregateInput = {
    totalGenerated?: SortOrder
    totalCompleted?: SortOrder
  }

  export type EnumSessionStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SessionStatus | EnumSessionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SessionStatus[] | ListEnumSessionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SessionStatus[] | ListEnumSessionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSessionStatusWithAggregatesFilter<$PrismaModel> | $Enums.SessionStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSessionStatusFilter<$PrismaModel>
    _max?: NestedEnumSessionStatusFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type EnumLearningItemTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.LearningItemType | EnumLearningItemTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LearningItemType[] | ListEnumLearningItemTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.LearningItemType[] | ListEnumLearningItemTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumLearningItemTypeFilter<$PrismaModel> | $Enums.LearningItemType
  }
  export type JsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type LearningSessionNullableRelationFilter = {
    is?: LearningSessionWhereInput | null
    isNot?: LearningSessionWhereInput | null
  }

  export type FeedItemNullableRelationFilter = {
    is?: FeedItemWhereInput | null
    isNot?: FeedItemWhereInput | null
  }

  export type LearningItemCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    sessionId?: SortOrder
    type?: SortOrder
    topic?: SortOrder
    difficulty?: SortOrder
    payload?: SortOrder
    isPublished?: SortOrder
    engagementScore?: SortOrder
    masteredByUser?: SortOrder
    lastInteractedAt?: SortOrder
    nextReviewAt?: SortOrder
    reviewInterval?: SortOrder
    reviewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LearningItemAvgOrderByAggregateInput = {
    difficulty?: SortOrder
    engagementScore?: SortOrder
    reviewInterval?: SortOrder
    reviewCount?: SortOrder
  }

  export type LearningItemMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    sessionId?: SortOrder
    type?: SortOrder
    topic?: SortOrder
    difficulty?: SortOrder
    isPublished?: SortOrder
    engagementScore?: SortOrder
    masteredByUser?: SortOrder
    lastInteractedAt?: SortOrder
    nextReviewAt?: SortOrder
    reviewInterval?: SortOrder
    reviewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LearningItemMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    sessionId?: SortOrder
    type?: SortOrder
    topic?: SortOrder
    difficulty?: SortOrder
    isPublished?: SortOrder
    engagementScore?: SortOrder
    masteredByUser?: SortOrder
    lastInteractedAt?: SortOrder
    nextReviewAt?: SortOrder
    reviewInterval?: SortOrder
    reviewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LearningItemSumOrderByAggregateInput = {
    difficulty?: SortOrder
    engagementScore?: SortOrder
    reviewInterval?: SortOrder
    reviewCount?: SortOrder
  }

  export type EnumLearningItemTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LearningItemType | EnumLearningItemTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LearningItemType[] | ListEnumLearningItemTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.LearningItemType[] | ListEnumLearningItemTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumLearningItemTypeWithAggregatesFilter<$PrismaModel> | $Enums.LearningItemType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLearningItemTypeFilter<$PrismaModel>
    _max?: NestedEnumLearningItemTypeFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type LearningItemRelationFilter = {
    is?: LearningItemWhereInput
    isNot?: LearningItemWhereInput
  }

  export type UserNullableRelationFilter = {
    is?: UserWhereInput | null
    isNot?: UserWhereInput | null
  }

  export type FeedItemCountOrderByAggregateInput = {
    id?: SortOrder
    learningItemId?: SortOrder
    publishedByUserId?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
    userId?: SortOrder
  }

  export type FeedItemMaxOrderByAggregateInput = {
    id?: SortOrder
    learningItemId?: SortOrder
    publishedByUserId?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
    userId?: SortOrder
  }

  export type FeedItemMinOrderByAggregateInput = {
    id?: SortOrder
    learningItemId?: SortOrder
    publishedByUserId?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
    userId?: SortOrder
  }

  export type EnumInteractionTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.InteractionType | EnumInteractionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.InteractionType[] | ListEnumInteractionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.InteractionType[] | ListEnumInteractionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumInteractionTypeFilter<$PrismaModel> | $Enums.InteractionType
  }

  export type BoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type UserInteractionCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    learningItemId?: SortOrder
    type?: SortOrder
    isCorrect?: SortOrder
    createdAt?: SortOrder
  }

  export type UserInteractionMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    learningItemId?: SortOrder
    type?: SortOrder
    isCorrect?: SortOrder
    createdAt?: SortOrder
  }

  export type UserInteractionMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    learningItemId?: SortOrder
    type?: SortOrder
    isCorrect?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumInteractionTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.InteractionType | EnumInteractionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.InteractionType[] | ListEnumInteractionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.InteractionType[] | ListEnumInteractionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumInteractionTypeWithAggregatesFilter<$PrismaModel> | $Enums.InteractionType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumInteractionTypeFilter<$PrismaModel>
    _max?: NestedEnumInteractionTypeFilter<$PrismaModel>
  }

  export type BoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type LearningStreakCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    currentStreak?: SortOrder
    longestStreak?: SortOrder
    lastActiveDate?: SortOrder
    updatedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type LearningStreakAvgOrderByAggregateInput = {
    currentStreak?: SortOrder
    longestStreak?: SortOrder
  }

  export type LearningStreakMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    currentStreak?: SortOrder
    longestStreak?: SortOrder
    lastActiveDate?: SortOrder
    updatedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type LearningStreakMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    currentStreak?: SortOrder
    longestStreak?: SortOrder
    lastActiveDate?: SortOrder
    updatedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type LearningStreakSumOrderByAggregateInput = {
    currentStreak?: SortOrder
    longestStreak?: SortOrder
  }

  export type LeaderboardScoreCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    score?: SortOrder
    correctAnswers?: SortOrder
    sessionsCompleted?: SortOrder
    streak?: SortOrder
    updatedAt?: SortOrder
  }

  export type LeaderboardScoreAvgOrderByAggregateInput = {
    score?: SortOrder
    correctAnswers?: SortOrder
    sessionsCompleted?: SortOrder
    streak?: SortOrder
  }

  export type LeaderboardScoreMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    score?: SortOrder
    correctAnswers?: SortOrder
    sessionsCompleted?: SortOrder
    streak?: SortOrder
    updatedAt?: SortOrder
  }

  export type LeaderboardScoreMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    score?: SortOrder
    correctAnswers?: SortOrder
    sessionsCompleted?: SortOrder
    streak?: SortOrder
    updatedAt?: SortOrder
  }

  export type LeaderboardScoreSumOrderByAggregateInput = {
    score?: SortOrder
    correctAnswers?: SortOrder
    sessionsCompleted?: SortOrder
    streak?: SortOrder
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type DailyChallengeCountOrderByAggregateInput = {
    id?: SortOrder
    date?: SortOrder
    items?: SortOrder
    createdAt?: SortOrder
  }

  export type DailyChallengeMaxOrderByAggregateInput = {
    id?: SortOrder
    date?: SortOrder
    createdAt?: SortOrder
  }

  export type DailyChallengeMinOrderByAggregateInput = {
    id?: SortOrder
    date?: SortOrder
    createdAt?: SortOrder
  }

  export type PushTokenCreateNestedManyWithoutUserInput = {
    create?: XOR<PushTokenCreateWithoutUserInput, PushTokenUncheckedCreateWithoutUserInput> | PushTokenCreateWithoutUserInput[] | PushTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PushTokenCreateOrConnectWithoutUserInput | PushTokenCreateOrConnectWithoutUserInput[]
    createMany?: PushTokenCreateManyUserInputEnvelope
    connect?: PushTokenWhereUniqueInput | PushTokenWhereUniqueInput[]
  }

  export type LearningSessionCreateNestedManyWithoutUserInput = {
    create?: XOR<LearningSessionCreateWithoutUserInput, LearningSessionUncheckedCreateWithoutUserInput> | LearningSessionCreateWithoutUserInput[] | LearningSessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LearningSessionCreateOrConnectWithoutUserInput | LearningSessionCreateOrConnectWithoutUserInput[]
    createMany?: LearningSessionCreateManyUserInputEnvelope
    connect?: LearningSessionWhereUniqueInput | LearningSessionWhereUniqueInput[]
  }

  export type LearningItemCreateNestedManyWithoutUserInput = {
    create?: XOR<LearningItemCreateWithoutUserInput, LearningItemUncheckedCreateWithoutUserInput> | LearningItemCreateWithoutUserInput[] | LearningItemUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LearningItemCreateOrConnectWithoutUserInput | LearningItemCreateOrConnectWithoutUserInput[]
    createMany?: LearningItemCreateManyUserInputEnvelope
    connect?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
  }

  export type UserInteractionCreateNestedManyWithoutUserInput = {
    create?: XOR<UserInteractionCreateWithoutUserInput, UserInteractionUncheckedCreateWithoutUserInput> | UserInteractionCreateWithoutUserInput[] | UserInteractionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserInteractionCreateOrConnectWithoutUserInput | UserInteractionCreateOrConnectWithoutUserInput[]
    createMany?: UserInteractionCreateManyUserInputEnvelope
    connect?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
  }

  export type FeedItemCreateNestedManyWithoutUserInput = {
    create?: XOR<FeedItemCreateWithoutUserInput, FeedItemUncheckedCreateWithoutUserInput> | FeedItemCreateWithoutUserInput[] | FeedItemUncheckedCreateWithoutUserInput[]
    connectOrCreate?: FeedItemCreateOrConnectWithoutUserInput | FeedItemCreateOrConnectWithoutUserInput[]
    createMany?: FeedItemCreateManyUserInputEnvelope
    connect?: FeedItemWhereUniqueInput | FeedItemWhereUniqueInput[]
  }

  export type LearningStreakCreateNestedOneWithoutUserInput = {
    create?: XOR<LearningStreakCreateWithoutUserInput, LearningStreakUncheckedCreateWithoutUserInput>
    connectOrCreate?: LearningStreakCreateOrConnectWithoutUserInput
    connect?: LearningStreakWhereUniqueInput
  }

  export type LeaderboardScoreCreateNestedOneWithoutUserInput = {
    create?: XOR<LeaderboardScoreCreateWithoutUserInput, LeaderboardScoreUncheckedCreateWithoutUserInput>
    connectOrCreate?: LeaderboardScoreCreateOrConnectWithoutUserInput
    connect?: LeaderboardScoreWhereUniqueInput
  }

  export type PushTokenUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<PushTokenCreateWithoutUserInput, PushTokenUncheckedCreateWithoutUserInput> | PushTokenCreateWithoutUserInput[] | PushTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PushTokenCreateOrConnectWithoutUserInput | PushTokenCreateOrConnectWithoutUserInput[]
    createMany?: PushTokenCreateManyUserInputEnvelope
    connect?: PushTokenWhereUniqueInput | PushTokenWhereUniqueInput[]
  }

  export type LearningSessionUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<LearningSessionCreateWithoutUserInput, LearningSessionUncheckedCreateWithoutUserInput> | LearningSessionCreateWithoutUserInput[] | LearningSessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LearningSessionCreateOrConnectWithoutUserInput | LearningSessionCreateOrConnectWithoutUserInput[]
    createMany?: LearningSessionCreateManyUserInputEnvelope
    connect?: LearningSessionWhereUniqueInput | LearningSessionWhereUniqueInput[]
  }

  export type LearningItemUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<LearningItemCreateWithoutUserInput, LearningItemUncheckedCreateWithoutUserInput> | LearningItemCreateWithoutUserInput[] | LearningItemUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LearningItemCreateOrConnectWithoutUserInput | LearningItemCreateOrConnectWithoutUserInput[]
    createMany?: LearningItemCreateManyUserInputEnvelope
    connect?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
  }

  export type UserInteractionUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<UserInteractionCreateWithoutUserInput, UserInteractionUncheckedCreateWithoutUserInput> | UserInteractionCreateWithoutUserInput[] | UserInteractionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserInteractionCreateOrConnectWithoutUserInput | UserInteractionCreateOrConnectWithoutUserInput[]
    createMany?: UserInteractionCreateManyUserInputEnvelope
    connect?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
  }

  export type FeedItemUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<FeedItemCreateWithoutUserInput, FeedItemUncheckedCreateWithoutUserInput> | FeedItemCreateWithoutUserInput[] | FeedItemUncheckedCreateWithoutUserInput[]
    connectOrCreate?: FeedItemCreateOrConnectWithoutUserInput | FeedItemCreateOrConnectWithoutUserInput[]
    createMany?: FeedItemCreateManyUserInputEnvelope
    connect?: FeedItemWhereUniqueInput | FeedItemWhereUniqueInput[]
  }

  export type LearningStreakUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<LearningStreakCreateWithoutUserInput, LearningStreakUncheckedCreateWithoutUserInput>
    connectOrCreate?: LearningStreakCreateOrConnectWithoutUserInput
    connect?: LearningStreakWhereUniqueInput
  }

  export type LeaderboardScoreUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<LeaderboardScoreCreateWithoutUserInput, LeaderboardScoreUncheckedCreateWithoutUserInput>
    connectOrCreate?: LeaderboardScoreCreateOrConnectWithoutUserInput
    connect?: LeaderboardScoreWhereUniqueInput
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type PushTokenUpdateManyWithoutUserNestedInput = {
    create?: XOR<PushTokenCreateWithoutUserInput, PushTokenUncheckedCreateWithoutUserInput> | PushTokenCreateWithoutUserInput[] | PushTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PushTokenCreateOrConnectWithoutUserInput | PushTokenCreateOrConnectWithoutUserInput[]
    upsert?: PushTokenUpsertWithWhereUniqueWithoutUserInput | PushTokenUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: PushTokenCreateManyUserInputEnvelope
    set?: PushTokenWhereUniqueInput | PushTokenWhereUniqueInput[]
    disconnect?: PushTokenWhereUniqueInput | PushTokenWhereUniqueInput[]
    delete?: PushTokenWhereUniqueInput | PushTokenWhereUniqueInput[]
    connect?: PushTokenWhereUniqueInput | PushTokenWhereUniqueInput[]
    update?: PushTokenUpdateWithWhereUniqueWithoutUserInput | PushTokenUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: PushTokenUpdateManyWithWhereWithoutUserInput | PushTokenUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: PushTokenScalarWhereInput | PushTokenScalarWhereInput[]
  }

  export type LearningSessionUpdateManyWithoutUserNestedInput = {
    create?: XOR<LearningSessionCreateWithoutUserInput, LearningSessionUncheckedCreateWithoutUserInput> | LearningSessionCreateWithoutUserInput[] | LearningSessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LearningSessionCreateOrConnectWithoutUserInput | LearningSessionCreateOrConnectWithoutUserInput[]
    upsert?: LearningSessionUpsertWithWhereUniqueWithoutUserInput | LearningSessionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: LearningSessionCreateManyUserInputEnvelope
    set?: LearningSessionWhereUniqueInput | LearningSessionWhereUniqueInput[]
    disconnect?: LearningSessionWhereUniqueInput | LearningSessionWhereUniqueInput[]
    delete?: LearningSessionWhereUniqueInput | LearningSessionWhereUniqueInput[]
    connect?: LearningSessionWhereUniqueInput | LearningSessionWhereUniqueInput[]
    update?: LearningSessionUpdateWithWhereUniqueWithoutUserInput | LearningSessionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: LearningSessionUpdateManyWithWhereWithoutUserInput | LearningSessionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: LearningSessionScalarWhereInput | LearningSessionScalarWhereInput[]
  }

  export type LearningItemUpdateManyWithoutUserNestedInput = {
    create?: XOR<LearningItemCreateWithoutUserInput, LearningItemUncheckedCreateWithoutUserInput> | LearningItemCreateWithoutUserInput[] | LearningItemUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LearningItemCreateOrConnectWithoutUserInput | LearningItemCreateOrConnectWithoutUserInput[]
    upsert?: LearningItemUpsertWithWhereUniqueWithoutUserInput | LearningItemUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: LearningItemCreateManyUserInputEnvelope
    set?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
    disconnect?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
    delete?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
    connect?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
    update?: LearningItemUpdateWithWhereUniqueWithoutUserInput | LearningItemUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: LearningItemUpdateManyWithWhereWithoutUserInput | LearningItemUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: LearningItemScalarWhereInput | LearningItemScalarWhereInput[]
  }

  export type UserInteractionUpdateManyWithoutUserNestedInput = {
    create?: XOR<UserInteractionCreateWithoutUserInput, UserInteractionUncheckedCreateWithoutUserInput> | UserInteractionCreateWithoutUserInput[] | UserInteractionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserInteractionCreateOrConnectWithoutUserInput | UserInteractionCreateOrConnectWithoutUserInput[]
    upsert?: UserInteractionUpsertWithWhereUniqueWithoutUserInput | UserInteractionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UserInteractionCreateManyUserInputEnvelope
    set?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
    disconnect?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
    delete?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
    connect?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
    update?: UserInteractionUpdateWithWhereUniqueWithoutUserInput | UserInteractionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UserInteractionUpdateManyWithWhereWithoutUserInput | UserInteractionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UserInteractionScalarWhereInput | UserInteractionScalarWhereInput[]
  }

  export type FeedItemUpdateManyWithoutUserNestedInput = {
    create?: XOR<FeedItemCreateWithoutUserInput, FeedItemUncheckedCreateWithoutUserInput> | FeedItemCreateWithoutUserInput[] | FeedItemUncheckedCreateWithoutUserInput[]
    connectOrCreate?: FeedItemCreateOrConnectWithoutUserInput | FeedItemCreateOrConnectWithoutUserInput[]
    upsert?: FeedItemUpsertWithWhereUniqueWithoutUserInput | FeedItemUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: FeedItemCreateManyUserInputEnvelope
    set?: FeedItemWhereUniqueInput | FeedItemWhereUniqueInput[]
    disconnect?: FeedItemWhereUniqueInput | FeedItemWhereUniqueInput[]
    delete?: FeedItemWhereUniqueInput | FeedItemWhereUniqueInput[]
    connect?: FeedItemWhereUniqueInput | FeedItemWhereUniqueInput[]
    update?: FeedItemUpdateWithWhereUniqueWithoutUserInput | FeedItemUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: FeedItemUpdateManyWithWhereWithoutUserInput | FeedItemUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: FeedItemScalarWhereInput | FeedItemScalarWhereInput[]
  }

  export type LearningStreakUpdateOneWithoutUserNestedInput = {
    create?: XOR<LearningStreakCreateWithoutUserInput, LearningStreakUncheckedCreateWithoutUserInput>
    connectOrCreate?: LearningStreakCreateOrConnectWithoutUserInput
    upsert?: LearningStreakUpsertWithoutUserInput
    disconnect?: LearningStreakWhereInput | boolean
    delete?: LearningStreakWhereInput | boolean
    connect?: LearningStreakWhereUniqueInput
    update?: XOR<XOR<LearningStreakUpdateToOneWithWhereWithoutUserInput, LearningStreakUpdateWithoutUserInput>, LearningStreakUncheckedUpdateWithoutUserInput>
  }

  export type LeaderboardScoreUpdateOneWithoutUserNestedInput = {
    create?: XOR<LeaderboardScoreCreateWithoutUserInput, LeaderboardScoreUncheckedCreateWithoutUserInput>
    connectOrCreate?: LeaderboardScoreCreateOrConnectWithoutUserInput
    upsert?: LeaderboardScoreUpsertWithoutUserInput
    disconnect?: LeaderboardScoreWhereInput | boolean
    delete?: LeaderboardScoreWhereInput | boolean
    connect?: LeaderboardScoreWhereUniqueInput
    update?: XOR<XOR<LeaderboardScoreUpdateToOneWithWhereWithoutUserInput, LeaderboardScoreUpdateWithoutUserInput>, LeaderboardScoreUncheckedUpdateWithoutUserInput>
  }

  export type PushTokenUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<PushTokenCreateWithoutUserInput, PushTokenUncheckedCreateWithoutUserInput> | PushTokenCreateWithoutUserInput[] | PushTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PushTokenCreateOrConnectWithoutUserInput | PushTokenCreateOrConnectWithoutUserInput[]
    upsert?: PushTokenUpsertWithWhereUniqueWithoutUserInput | PushTokenUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: PushTokenCreateManyUserInputEnvelope
    set?: PushTokenWhereUniqueInput | PushTokenWhereUniqueInput[]
    disconnect?: PushTokenWhereUniqueInput | PushTokenWhereUniqueInput[]
    delete?: PushTokenWhereUniqueInput | PushTokenWhereUniqueInput[]
    connect?: PushTokenWhereUniqueInput | PushTokenWhereUniqueInput[]
    update?: PushTokenUpdateWithWhereUniqueWithoutUserInput | PushTokenUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: PushTokenUpdateManyWithWhereWithoutUserInput | PushTokenUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: PushTokenScalarWhereInput | PushTokenScalarWhereInput[]
  }

  export type LearningSessionUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<LearningSessionCreateWithoutUserInput, LearningSessionUncheckedCreateWithoutUserInput> | LearningSessionCreateWithoutUserInput[] | LearningSessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LearningSessionCreateOrConnectWithoutUserInput | LearningSessionCreateOrConnectWithoutUserInput[]
    upsert?: LearningSessionUpsertWithWhereUniqueWithoutUserInput | LearningSessionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: LearningSessionCreateManyUserInputEnvelope
    set?: LearningSessionWhereUniqueInput | LearningSessionWhereUniqueInput[]
    disconnect?: LearningSessionWhereUniqueInput | LearningSessionWhereUniqueInput[]
    delete?: LearningSessionWhereUniqueInput | LearningSessionWhereUniqueInput[]
    connect?: LearningSessionWhereUniqueInput | LearningSessionWhereUniqueInput[]
    update?: LearningSessionUpdateWithWhereUniqueWithoutUserInput | LearningSessionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: LearningSessionUpdateManyWithWhereWithoutUserInput | LearningSessionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: LearningSessionScalarWhereInput | LearningSessionScalarWhereInput[]
  }

  export type LearningItemUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<LearningItemCreateWithoutUserInput, LearningItemUncheckedCreateWithoutUserInput> | LearningItemCreateWithoutUserInput[] | LearningItemUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LearningItemCreateOrConnectWithoutUserInput | LearningItemCreateOrConnectWithoutUserInput[]
    upsert?: LearningItemUpsertWithWhereUniqueWithoutUserInput | LearningItemUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: LearningItemCreateManyUserInputEnvelope
    set?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
    disconnect?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
    delete?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
    connect?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
    update?: LearningItemUpdateWithWhereUniqueWithoutUserInput | LearningItemUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: LearningItemUpdateManyWithWhereWithoutUserInput | LearningItemUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: LearningItemScalarWhereInput | LearningItemScalarWhereInput[]
  }

  export type UserInteractionUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<UserInteractionCreateWithoutUserInput, UserInteractionUncheckedCreateWithoutUserInput> | UserInteractionCreateWithoutUserInput[] | UserInteractionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserInteractionCreateOrConnectWithoutUserInput | UserInteractionCreateOrConnectWithoutUserInput[]
    upsert?: UserInteractionUpsertWithWhereUniqueWithoutUserInput | UserInteractionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UserInteractionCreateManyUserInputEnvelope
    set?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
    disconnect?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
    delete?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
    connect?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
    update?: UserInteractionUpdateWithWhereUniqueWithoutUserInput | UserInteractionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UserInteractionUpdateManyWithWhereWithoutUserInput | UserInteractionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UserInteractionScalarWhereInput | UserInteractionScalarWhereInput[]
  }

  export type FeedItemUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<FeedItemCreateWithoutUserInput, FeedItemUncheckedCreateWithoutUserInput> | FeedItemCreateWithoutUserInput[] | FeedItemUncheckedCreateWithoutUserInput[]
    connectOrCreate?: FeedItemCreateOrConnectWithoutUserInput | FeedItemCreateOrConnectWithoutUserInput[]
    upsert?: FeedItemUpsertWithWhereUniqueWithoutUserInput | FeedItemUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: FeedItemCreateManyUserInputEnvelope
    set?: FeedItemWhereUniqueInput | FeedItemWhereUniqueInput[]
    disconnect?: FeedItemWhereUniqueInput | FeedItemWhereUniqueInput[]
    delete?: FeedItemWhereUniqueInput | FeedItemWhereUniqueInput[]
    connect?: FeedItemWhereUniqueInput | FeedItemWhereUniqueInput[]
    update?: FeedItemUpdateWithWhereUniqueWithoutUserInput | FeedItemUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: FeedItemUpdateManyWithWhereWithoutUserInput | FeedItemUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: FeedItemScalarWhereInput | FeedItemScalarWhereInput[]
  }

  export type LearningStreakUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<LearningStreakCreateWithoutUserInput, LearningStreakUncheckedCreateWithoutUserInput>
    connectOrCreate?: LearningStreakCreateOrConnectWithoutUserInput
    upsert?: LearningStreakUpsertWithoutUserInput
    disconnect?: LearningStreakWhereInput | boolean
    delete?: LearningStreakWhereInput | boolean
    connect?: LearningStreakWhereUniqueInput
    update?: XOR<XOR<LearningStreakUpdateToOneWithWhereWithoutUserInput, LearningStreakUpdateWithoutUserInput>, LearningStreakUncheckedUpdateWithoutUserInput>
  }

  export type LeaderboardScoreUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<LeaderboardScoreCreateWithoutUserInput, LeaderboardScoreUncheckedCreateWithoutUserInput>
    connectOrCreate?: LeaderboardScoreCreateOrConnectWithoutUserInput
    upsert?: LeaderboardScoreUpsertWithoutUserInput
    disconnect?: LeaderboardScoreWhereInput | boolean
    delete?: LeaderboardScoreWhereInput | boolean
    connect?: LeaderboardScoreWhereUniqueInput
    update?: XOR<XOR<LeaderboardScoreUpdateToOneWithWhereWithoutUserInput, LeaderboardScoreUpdateWithoutUserInput>, LeaderboardScoreUncheckedUpdateWithoutUserInput>
  }

  export type UserCreateNestedOneWithoutPushTokensInput = {
    create?: XOR<UserCreateWithoutPushTokensInput, UserUncheckedCreateWithoutPushTokensInput>
    connectOrCreate?: UserCreateOrConnectWithoutPushTokensInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutPushTokensNestedInput = {
    create?: XOR<UserCreateWithoutPushTokensInput, UserUncheckedCreateWithoutPushTokensInput>
    connectOrCreate?: UserCreateOrConnectWithoutPushTokensInput
    upsert?: UserUpsertWithoutPushTokensInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutPushTokensInput, UserUpdateWithoutPushTokensInput>, UserUncheckedUpdateWithoutPushTokensInput>
  }

  export type UserCreateNestedOneWithoutSessionsInput = {
    create?: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSessionsInput
    connect?: UserWhereUniqueInput
  }

  export type LearningItemCreateNestedManyWithoutSessionInput = {
    create?: XOR<LearningItemCreateWithoutSessionInput, LearningItemUncheckedCreateWithoutSessionInput> | LearningItemCreateWithoutSessionInput[] | LearningItemUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: LearningItemCreateOrConnectWithoutSessionInput | LearningItemCreateOrConnectWithoutSessionInput[]
    createMany?: LearningItemCreateManySessionInputEnvelope
    connect?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
  }

  export type LearningItemUncheckedCreateNestedManyWithoutSessionInput = {
    create?: XOR<LearningItemCreateWithoutSessionInput, LearningItemUncheckedCreateWithoutSessionInput> | LearningItemCreateWithoutSessionInput[] | LearningItemUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: LearningItemCreateOrConnectWithoutSessionInput | LearningItemCreateOrConnectWithoutSessionInput[]
    createMany?: LearningItemCreateManySessionInputEnvelope
    connect?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
  }

  export type EnumSessionStatusFieldUpdateOperationsInput = {
    set?: $Enums.SessionStatus
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type UserUpdateOneRequiredWithoutSessionsNestedInput = {
    create?: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSessionsInput
    upsert?: UserUpsertWithoutSessionsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSessionsInput, UserUpdateWithoutSessionsInput>, UserUncheckedUpdateWithoutSessionsInput>
  }

  export type LearningItemUpdateManyWithoutSessionNestedInput = {
    create?: XOR<LearningItemCreateWithoutSessionInput, LearningItemUncheckedCreateWithoutSessionInput> | LearningItemCreateWithoutSessionInput[] | LearningItemUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: LearningItemCreateOrConnectWithoutSessionInput | LearningItemCreateOrConnectWithoutSessionInput[]
    upsert?: LearningItemUpsertWithWhereUniqueWithoutSessionInput | LearningItemUpsertWithWhereUniqueWithoutSessionInput[]
    createMany?: LearningItemCreateManySessionInputEnvelope
    set?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
    disconnect?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
    delete?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
    connect?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
    update?: LearningItemUpdateWithWhereUniqueWithoutSessionInput | LearningItemUpdateWithWhereUniqueWithoutSessionInput[]
    updateMany?: LearningItemUpdateManyWithWhereWithoutSessionInput | LearningItemUpdateManyWithWhereWithoutSessionInput[]
    deleteMany?: LearningItemScalarWhereInput | LearningItemScalarWhereInput[]
  }

  export type LearningItemUncheckedUpdateManyWithoutSessionNestedInput = {
    create?: XOR<LearningItemCreateWithoutSessionInput, LearningItemUncheckedCreateWithoutSessionInput> | LearningItemCreateWithoutSessionInput[] | LearningItemUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: LearningItemCreateOrConnectWithoutSessionInput | LearningItemCreateOrConnectWithoutSessionInput[]
    upsert?: LearningItemUpsertWithWhereUniqueWithoutSessionInput | LearningItemUpsertWithWhereUniqueWithoutSessionInput[]
    createMany?: LearningItemCreateManySessionInputEnvelope
    set?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
    disconnect?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
    delete?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
    connect?: LearningItemWhereUniqueInput | LearningItemWhereUniqueInput[]
    update?: LearningItemUpdateWithWhereUniqueWithoutSessionInput | LearningItemUpdateWithWhereUniqueWithoutSessionInput[]
    updateMany?: LearningItemUpdateManyWithWhereWithoutSessionInput | LearningItemUpdateManyWithWhereWithoutSessionInput[]
    deleteMany?: LearningItemScalarWhereInput | LearningItemScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutLearningItemsInput = {
    create?: XOR<UserCreateWithoutLearningItemsInput, UserUncheckedCreateWithoutLearningItemsInput>
    connectOrCreate?: UserCreateOrConnectWithoutLearningItemsInput
    connect?: UserWhereUniqueInput
  }

  export type LearningSessionCreateNestedOneWithoutItemsInput = {
    create?: XOR<LearningSessionCreateWithoutItemsInput, LearningSessionUncheckedCreateWithoutItemsInput>
    connectOrCreate?: LearningSessionCreateOrConnectWithoutItemsInput
    connect?: LearningSessionWhereUniqueInput
  }

  export type FeedItemCreateNestedOneWithoutLearningItemInput = {
    create?: XOR<FeedItemCreateWithoutLearningItemInput, FeedItemUncheckedCreateWithoutLearningItemInput>
    connectOrCreate?: FeedItemCreateOrConnectWithoutLearningItemInput
    connect?: FeedItemWhereUniqueInput
  }

  export type UserInteractionCreateNestedManyWithoutLearningItemInput = {
    create?: XOR<UserInteractionCreateWithoutLearningItemInput, UserInteractionUncheckedCreateWithoutLearningItemInput> | UserInteractionCreateWithoutLearningItemInput[] | UserInteractionUncheckedCreateWithoutLearningItemInput[]
    connectOrCreate?: UserInteractionCreateOrConnectWithoutLearningItemInput | UserInteractionCreateOrConnectWithoutLearningItemInput[]
    createMany?: UserInteractionCreateManyLearningItemInputEnvelope
    connect?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
  }

  export type FeedItemUncheckedCreateNestedOneWithoutLearningItemInput = {
    create?: XOR<FeedItemCreateWithoutLearningItemInput, FeedItemUncheckedCreateWithoutLearningItemInput>
    connectOrCreate?: FeedItemCreateOrConnectWithoutLearningItemInput
    connect?: FeedItemWhereUniqueInput
  }

  export type UserInteractionUncheckedCreateNestedManyWithoutLearningItemInput = {
    create?: XOR<UserInteractionCreateWithoutLearningItemInput, UserInteractionUncheckedCreateWithoutLearningItemInput> | UserInteractionCreateWithoutLearningItemInput[] | UserInteractionUncheckedCreateWithoutLearningItemInput[]
    connectOrCreate?: UserInteractionCreateOrConnectWithoutLearningItemInput | UserInteractionCreateOrConnectWithoutLearningItemInput[]
    createMany?: UserInteractionCreateManyLearningItemInputEnvelope
    connect?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
  }

  export type EnumLearningItemTypeFieldUpdateOperationsInput = {
    set?: $Enums.LearningItemType
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type UserUpdateOneRequiredWithoutLearningItemsNestedInput = {
    create?: XOR<UserCreateWithoutLearningItemsInput, UserUncheckedCreateWithoutLearningItemsInput>
    connectOrCreate?: UserCreateOrConnectWithoutLearningItemsInput
    upsert?: UserUpsertWithoutLearningItemsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutLearningItemsInput, UserUpdateWithoutLearningItemsInput>, UserUncheckedUpdateWithoutLearningItemsInput>
  }

  export type LearningSessionUpdateOneWithoutItemsNestedInput = {
    create?: XOR<LearningSessionCreateWithoutItemsInput, LearningSessionUncheckedCreateWithoutItemsInput>
    connectOrCreate?: LearningSessionCreateOrConnectWithoutItemsInput
    upsert?: LearningSessionUpsertWithoutItemsInput
    disconnect?: LearningSessionWhereInput | boolean
    delete?: LearningSessionWhereInput | boolean
    connect?: LearningSessionWhereUniqueInput
    update?: XOR<XOR<LearningSessionUpdateToOneWithWhereWithoutItemsInput, LearningSessionUpdateWithoutItemsInput>, LearningSessionUncheckedUpdateWithoutItemsInput>
  }

  export type FeedItemUpdateOneWithoutLearningItemNestedInput = {
    create?: XOR<FeedItemCreateWithoutLearningItemInput, FeedItemUncheckedCreateWithoutLearningItemInput>
    connectOrCreate?: FeedItemCreateOrConnectWithoutLearningItemInput
    upsert?: FeedItemUpsertWithoutLearningItemInput
    disconnect?: FeedItemWhereInput | boolean
    delete?: FeedItemWhereInput | boolean
    connect?: FeedItemWhereUniqueInput
    update?: XOR<XOR<FeedItemUpdateToOneWithWhereWithoutLearningItemInput, FeedItemUpdateWithoutLearningItemInput>, FeedItemUncheckedUpdateWithoutLearningItemInput>
  }

  export type UserInteractionUpdateManyWithoutLearningItemNestedInput = {
    create?: XOR<UserInteractionCreateWithoutLearningItemInput, UserInteractionUncheckedCreateWithoutLearningItemInput> | UserInteractionCreateWithoutLearningItemInput[] | UserInteractionUncheckedCreateWithoutLearningItemInput[]
    connectOrCreate?: UserInteractionCreateOrConnectWithoutLearningItemInput | UserInteractionCreateOrConnectWithoutLearningItemInput[]
    upsert?: UserInteractionUpsertWithWhereUniqueWithoutLearningItemInput | UserInteractionUpsertWithWhereUniqueWithoutLearningItemInput[]
    createMany?: UserInteractionCreateManyLearningItemInputEnvelope
    set?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
    disconnect?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
    delete?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
    connect?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
    update?: UserInteractionUpdateWithWhereUniqueWithoutLearningItemInput | UserInteractionUpdateWithWhereUniqueWithoutLearningItemInput[]
    updateMany?: UserInteractionUpdateManyWithWhereWithoutLearningItemInput | UserInteractionUpdateManyWithWhereWithoutLearningItemInput[]
    deleteMany?: UserInteractionScalarWhereInput | UserInteractionScalarWhereInput[]
  }

  export type FeedItemUncheckedUpdateOneWithoutLearningItemNestedInput = {
    create?: XOR<FeedItemCreateWithoutLearningItemInput, FeedItemUncheckedCreateWithoutLearningItemInput>
    connectOrCreate?: FeedItemCreateOrConnectWithoutLearningItemInput
    upsert?: FeedItemUpsertWithoutLearningItemInput
    disconnect?: FeedItemWhereInput | boolean
    delete?: FeedItemWhereInput | boolean
    connect?: FeedItemWhereUniqueInput
    update?: XOR<XOR<FeedItemUpdateToOneWithWhereWithoutLearningItemInput, FeedItemUpdateWithoutLearningItemInput>, FeedItemUncheckedUpdateWithoutLearningItemInput>
  }

  export type UserInteractionUncheckedUpdateManyWithoutLearningItemNestedInput = {
    create?: XOR<UserInteractionCreateWithoutLearningItemInput, UserInteractionUncheckedCreateWithoutLearningItemInput> | UserInteractionCreateWithoutLearningItemInput[] | UserInteractionUncheckedCreateWithoutLearningItemInput[]
    connectOrCreate?: UserInteractionCreateOrConnectWithoutLearningItemInput | UserInteractionCreateOrConnectWithoutLearningItemInput[]
    upsert?: UserInteractionUpsertWithWhereUniqueWithoutLearningItemInput | UserInteractionUpsertWithWhereUniqueWithoutLearningItemInput[]
    createMany?: UserInteractionCreateManyLearningItemInputEnvelope
    set?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
    disconnect?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
    delete?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
    connect?: UserInteractionWhereUniqueInput | UserInteractionWhereUniqueInput[]
    update?: UserInteractionUpdateWithWhereUniqueWithoutLearningItemInput | UserInteractionUpdateWithWhereUniqueWithoutLearningItemInput[]
    updateMany?: UserInteractionUpdateManyWithWhereWithoutLearningItemInput | UserInteractionUpdateManyWithWhereWithoutLearningItemInput[]
    deleteMany?: UserInteractionScalarWhereInput | UserInteractionScalarWhereInput[]
  }

  export type LearningItemCreateNestedOneWithoutFeedItemInput = {
    create?: XOR<LearningItemCreateWithoutFeedItemInput, LearningItemUncheckedCreateWithoutFeedItemInput>
    connectOrCreate?: LearningItemCreateOrConnectWithoutFeedItemInput
    connect?: LearningItemWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutFeedItemsInput = {
    create?: XOR<UserCreateWithoutFeedItemsInput, UserUncheckedCreateWithoutFeedItemsInput>
    connectOrCreate?: UserCreateOrConnectWithoutFeedItemsInput
    connect?: UserWhereUniqueInput
  }

  export type LearningItemUpdateOneRequiredWithoutFeedItemNestedInput = {
    create?: XOR<LearningItemCreateWithoutFeedItemInput, LearningItemUncheckedCreateWithoutFeedItemInput>
    connectOrCreate?: LearningItemCreateOrConnectWithoutFeedItemInput
    upsert?: LearningItemUpsertWithoutFeedItemInput
    connect?: LearningItemWhereUniqueInput
    update?: XOR<XOR<LearningItemUpdateToOneWithWhereWithoutFeedItemInput, LearningItemUpdateWithoutFeedItemInput>, LearningItemUncheckedUpdateWithoutFeedItemInput>
  }

  export type UserUpdateOneWithoutFeedItemsNestedInput = {
    create?: XOR<UserCreateWithoutFeedItemsInput, UserUncheckedCreateWithoutFeedItemsInput>
    connectOrCreate?: UserCreateOrConnectWithoutFeedItemsInput
    upsert?: UserUpsertWithoutFeedItemsInput
    disconnect?: UserWhereInput | boolean
    delete?: UserWhereInput | boolean
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutFeedItemsInput, UserUpdateWithoutFeedItemsInput>, UserUncheckedUpdateWithoutFeedItemsInput>
  }

  export type UserCreateNestedOneWithoutInteractionsInput = {
    create?: XOR<UserCreateWithoutInteractionsInput, UserUncheckedCreateWithoutInteractionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutInteractionsInput
    connect?: UserWhereUniqueInput
  }

  export type LearningItemCreateNestedOneWithoutInteractionsInput = {
    create?: XOR<LearningItemCreateWithoutInteractionsInput, LearningItemUncheckedCreateWithoutInteractionsInput>
    connectOrCreate?: LearningItemCreateOrConnectWithoutInteractionsInput
    connect?: LearningItemWhereUniqueInput
  }

  export type EnumInteractionTypeFieldUpdateOperationsInput = {
    set?: $Enums.InteractionType
  }

  export type NullableBoolFieldUpdateOperationsInput = {
    set?: boolean | null
  }

  export type UserUpdateOneRequiredWithoutInteractionsNestedInput = {
    create?: XOR<UserCreateWithoutInteractionsInput, UserUncheckedCreateWithoutInteractionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutInteractionsInput
    upsert?: UserUpsertWithoutInteractionsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutInteractionsInput, UserUpdateWithoutInteractionsInput>, UserUncheckedUpdateWithoutInteractionsInput>
  }

  export type LearningItemUpdateOneRequiredWithoutInteractionsNestedInput = {
    create?: XOR<LearningItemCreateWithoutInteractionsInput, LearningItemUncheckedCreateWithoutInteractionsInput>
    connectOrCreate?: LearningItemCreateOrConnectWithoutInteractionsInput
    upsert?: LearningItemUpsertWithoutInteractionsInput
    connect?: LearningItemWhereUniqueInput
    update?: XOR<XOR<LearningItemUpdateToOneWithWhereWithoutInteractionsInput, LearningItemUpdateWithoutInteractionsInput>, LearningItemUncheckedUpdateWithoutInteractionsInput>
  }

  export type UserCreateNestedOneWithoutStreakInput = {
    create?: XOR<UserCreateWithoutStreakInput, UserUncheckedCreateWithoutStreakInput>
    connectOrCreate?: UserCreateOrConnectWithoutStreakInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutStreakNestedInput = {
    create?: XOR<UserCreateWithoutStreakInput, UserUncheckedCreateWithoutStreakInput>
    connectOrCreate?: UserCreateOrConnectWithoutStreakInput
    upsert?: UserUpsertWithoutStreakInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutStreakInput, UserUpdateWithoutStreakInput>, UserUncheckedUpdateWithoutStreakInput>
  }

  export type UserCreateNestedOneWithoutLeaderboardScoreInput = {
    create?: XOR<UserCreateWithoutLeaderboardScoreInput, UserUncheckedCreateWithoutLeaderboardScoreInput>
    connectOrCreate?: UserCreateOrConnectWithoutLeaderboardScoreInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutLeaderboardScoreNestedInput = {
    create?: XOR<UserCreateWithoutLeaderboardScoreInput, UserUncheckedCreateWithoutLeaderboardScoreInput>
    connectOrCreate?: UserCreateOrConnectWithoutLeaderboardScoreInput
    upsert?: UserUpsertWithoutLeaderboardScoreInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutLeaderboardScoreInput, UserUpdateWithoutLeaderboardScoreInput>, UserUncheckedUpdateWithoutLeaderboardScoreInput>
  }

  export type DailyChallengeCreateitemsInput = {
    set: string[]
  }

  export type DailyChallengeUpdateitemsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumSessionStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SessionStatus | EnumSessionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SessionStatus[] | ListEnumSessionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SessionStatus[] | ListEnumSessionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSessionStatusFilter<$PrismaModel> | $Enums.SessionStatus
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedEnumSessionStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SessionStatus | EnumSessionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SessionStatus[] | ListEnumSessionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SessionStatus[] | ListEnumSessionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSessionStatusWithAggregatesFilter<$PrismaModel> | $Enums.SessionStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSessionStatusFilter<$PrismaModel>
    _max?: NestedEnumSessionStatusFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumLearningItemTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.LearningItemType | EnumLearningItemTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LearningItemType[] | ListEnumLearningItemTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.LearningItemType[] | ListEnumLearningItemTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumLearningItemTypeFilter<$PrismaModel> | $Enums.LearningItemType
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedEnumLearningItemTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LearningItemType | EnumLearningItemTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LearningItemType[] | ListEnumLearningItemTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.LearningItemType[] | ListEnumLearningItemTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumLearningItemTypeWithAggregatesFilter<$PrismaModel> | $Enums.LearningItemType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLearningItemTypeFilter<$PrismaModel>
    _max?: NestedEnumLearningItemTypeFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedEnumInteractionTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.InteractionType | EnumInteractionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.InteractionType[] | ListEnumInteractionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.InteractionType[] | ListEnumInteractionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumInteractionTypeFilter<$PrismaModel> | $Enums.InteractionType
  }

  export type NestedBoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type NestedEnumInteractionTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.InteractionType | EnumInteractionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.InteractionType[] | ListEnumInteractionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.InteractionType[] | ListEnumInteractionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumInteractionTypeWithAggregatesFilter<$PrismaModel> | $Enums.InteractionType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumInteractionTypeFilter<$PrismaModel>
    _max?: NestedEnumInteractionTypeFilter<$PrismaModel>
  }

  export type NestedBoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type PushTokenCreateWithoutUserInput = {
    id?: string
    token: string
  }

  export type PushTokenUncheckedCreateWithoutUserInput = {
    id?: string
    token: string
  }

  export type PushTokenCreateOrConnectWithoutUserInput = {
    where: PushTokenWhereUniqueInput
    create: XOR<PushTokenCreateWithoutUserInput, PushTokenUncheckedCreateWithoutUserInput>
  }

  export type PushTokenCreateManyUserInputEnvelope = {
    data: PushTokenCreateManyUserInput | PushTokenCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type LearningSessionCreateWithoutUserInput = {
    id?: string
    topic: string
    status?: $Enums.SessionStatus
    totalGenerated?: number
    totalCompleted?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    items?: LearningItemCreateNestedManyWithoutSessionInput
  }

  export type LearningSessionUncheckedCreateWithoutUserInput = {
    id?: string
    topic: string
    status?: $Enums.SessionStatus
    totalGenerated?: number
    totalCompleted?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    items?: LearningItemUncheckedCreateNestedManyWithoutSessionInput
  }

  export type LearningSessionCreateOrConnectWithoutUserInput = {
    where: LearningSessionWhereUniqueInput
    create: XOR<LearningSessionCreateWithoutUserInput, LearningSessionUncheckedCreateWithoutUserInput>
  }

  export type LearningSessionCreateManyUserInputEnvelope = {
    data: LearningSessionCreateManyUserInput | LearningSessionCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type LearningItemCreateWithoutUserInput = {
    id?: string
    type: $Enums.LearningItemType
    topic: string
    difficulty?: number
    payload: JsonNullValueInput | InputJsonValue
    isPublished?: boolean
    engagementScore?: number
    masteredByUser?: boolean
    lastInteractedAt?: Date | string | null
    nextReviewAt?: Date | string | null
    reviewInterval?: number
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    session?: LearningSessionCreateNestedOneWithoutItemsInput
    feedItem?: FeedItemCreateNestedOneWithoutLearningItemInput
    interactions?: UserInteractionCreateNestedManyWithoutLearningItemInput
  }

  export type LearningItemUncheckedCreateWithoutUserInput = {
    id?: string
    sessionId?: string | null
    type: $Enums.LearningItemType
    topic: string
    difficulty?: number
    payload: JsonNullValueInput | InputJsonValue
    isPublished?: boolean
    engagementScore?: number
    masteredByUser?: boolean
    lastInteractedAt?: Date | string | null
    nextReviewAt?: Date | string | null
    reviewInterval?: number
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    feedItem?: FeedItemUncheckedCreateNestedOneWithoutLearningItemInput
    interactions?: UserInteractionUncheckedCreateNestedManyWithoutLearningItemInput
  }

  export type LearningItemCreateOrConnectWithoutUserInput = {
    where: LearningItemWhereUniqueInput
    create: XOR<LearningItemCreateWithoutUserInput, LearningItemUncheckedCreateWithoutUserInput>
  }

  export type LearningItemCreateManyUserInputEnvelope = {
    data: LearningItemCreateManyUserInput | LearningItemCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type UserInteractionCreateWithoutUserInput = {
    id?: string
    type: $Enums.InteractionType
    isCorrect?: boolean | null
    createdAt?: Date | string
    learningItem: LearningItemCreateNestedOneWithoutInteractionsInput
  }

  export type UserInteractionUncheckedCreateWithoutUserInput = {
    id?: string
    learningItemId: string
    type: $Enums.InteractionType
    isCorrect?: boolean | null
    createdAt?: Date | string
  }

  export type UserInteractionCreateOrConnectWithoutUserInput = {
    where: UserInteractionWhereUniqueInput
    create: XOR<UserInteractionCreateWithoutUserInput, UserInteractionUncheckedCreateWithoutUserInput>
  }

  export type UserInteractionCreateManyUserInputEnvelope = {
    data: UserInteractionCreateManyUserInput | UserInteractionCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type FeedItemCreateWithoutUserInput = {
    id?: string
    publishedByUserId?: string | null
    publishedAt?: Date | string
    createdAt?: Date | string
    learningItem: LearningItemCreateNestedOneWithoutFeedItemInput
  }

  export type FeedItemUncheckedCreateWithoutUserInput = {
    id?: string
    learningItemId: string
    publishedByUserId?: string | null
    publishedAt?: Date | string
    createdAt?: Date | string
  }

  export type FeedItemCreateOrConnectWithoutUserInput = {
    where: FeedItemWhereUniqueInput
    create: XOR<FeedItemCreateWithoutUserInput, FeedItemUncheckedCreateWithoutUserInput>
  }

  export type FeedItemCreateManyUserInputEnvelope = {
    data: FeedItemCreateManyUserInput | FeedItemCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type LearningStreakCreateWithoutUserInput = {
    id?: string
    currentStreak?: number
    longestStreak?: number
    lastActiveDate?: Date | string | null
    updatedAt?: Date | string
    createdAt?: Date | string
  }

  export type LearningStreakUncheckedCreateWithoutUserInput = {
    id?: string
    currentStreak?: number
    longestStreak?: number
    lastActiveDate?: Date | string | null
    updatedAt?: Date | string
    createdAt?: Date | string
  }

  export type LearningStreakCreateOrConnectWithoutUserInput = {
    where: LearningStreakWhereUniqueInput
    create: XOR<LearningStreakCreateWithoutUserInput, LearningStreakUncheckedCreateWithoutUserInput>
  }

  export type LeaderboardScoreCreateWithoutUserInput = {
    id?: string
    score?: number
    correctAnswers?: number
    sessionsCompleted?: number
    streak?: number
    updatedAt?: Date | string
  }

  export type LeaderboardScoreUncheckedCreateWithoutUserInput = {
    id?: string
    score?: number
    correctAnswers?: number
    sessionsCompleted?: number
    streak?: number
    updatedAt?: Date | string
  }

  export type LeaderboardScoreCreateOrConnectWithoutUserInput = {
    where: LeaderboardScoreWhereUniqueInput
    create: XOR<LeaderboardScoreCreateWithoutUserInput, LeaderboardScoreUncheckedCreateWithoutUserInput>
  }

  export type PushTokenUpsertWithWhereUniqueWithoutUserInput = {
    where: PushTokenWhereUniqueInput
    update: XOR<PushTokenUpdateWithoutUserInput, PushTokenUncheckedUpdateWithoutUserInput>
    create: XOR<PushTokenCreateWithoutUserInput, PushTokenUncheckedCreateWithoutUserInput>
  }

  export type PushTokenUpdateWithWhereUniqueWithoutUserInput = {
    where: PushTokenWhereUniqueInput
    data: XOR<PushTokenUpdateWithoutUserInput, PushTokenUncheckedUpdateWithoutUserInput>
  }

  export type PushTokenUpdateManyWithWhereWithoutUserInput = {
    where: PushTokenScalarWhereInput
    data: XOR<PushTokenUpdateManyMutationInput, PushTokenUncheckedUpdateManyWithoutUserInput>
  }

  export type PushTokenScalarWhereInput = {
    AND?: PushTokenScalarWhereInput | PushTokenScalarWhereInput[]
    OR?: PushTokenScalarWhereInput[]
    NOT?: PushTokenScalarWhereInput | PushTokenScalarWhereInput[]
    id?: StringFilter<"PushToken"> | string
    token?: StringFilter<"PushToken"> | string
    userId?: StringFilter<"PushToken"> | string
  }

  export type LearningSessionUpsertWithWhereUniqueWithoutUserInput = {
    where: LearningSessionWhereUniqueInput
    update: XOR<LearningSessionUpdateWithoutUserInput, LearningSessionUncheckedUpdateWithoutUserInput>
    create: XOR<LearningSessionCreateWithoutUserInput, LearningSessionUncheckedCreateWithoutUserInput>
  }

  export type LearningSessionUpdateWithWhereUniqueWithoutUserInput = {
    where: LearningSessionWhereUniqueInput
    data: XOR<LearningSessionUpdateWithoutUserInput, LearningSessionUncheckedUpdateWithoutUserInput>
  }

  export type LearningSessionUpdateManyWithWhereWithoutUserInput = {
    where: LearningSessionScalarWhereInput
    data: XOR<LearningSessionUpdateManyMutationInput, LearningSessionUncheckedUpdateManyWithoutUserInput>
  }

  export type LearningSessionScalarWhereInput = {
    AND?: LearningSessionScalarWhereInput | LearningSessionScalarWhereInput[]
    OR?: LearningSessionScalarWhereInput[]
    NOT?: LearningSessionScalarWhereInput | LearningSessionScalarWhereInput[]
    id?: StringFilter<"LearningSession"> | string
    userId?: StringFilter<"LearningSession"> | string
    topic?: StringFilter<"LearningSession"> | string
    status?: EnumSessionStatusFilter<"LearningSession"> | $Enums.SessionStatus
    totalGenerated?: IntFilter<"LearningSession"> | number
    totalCompleted?: IntFilter<"LearningSession"> | number
    startedAt?: DateTimeFilter<"LearningSession"> | Date | string
    completedAt?: DateTimeNullableFilter<"LearningSession"> | Date | string | null
    createdAt?: DateTimeFilter<"LearningSession"> | Date | string
    updatedAt?: DateTimeFilter<"LearningSession"> | Date | string
  }

  export type LearningItemUpsertWithWhereUniqueWithoutUserInput = {
    where: LearningItemWhereUniqueInput
    update: XOR<LearningItemUpdateWithoutUserInput, LearningItemUncheckedUpdateWithoutUserInput>
    create: XOR<LearningItemCreateWithoutUserInput, LearningItemUncheckedCreateWithoutUserInput>
  }

  export type LearningItemUpdateWithWhereUniqueWithoutUserInput = {
    where: LearningItemWhereUniqueInput
    data: XOR<LearningItemUpdateWithoutUserInput, LearningItemUncheckedUpdateWithoutUserInput>
  }

  export type LearningItemUpdateManyWithWhereWithoutUserInput = {
    where: LearningItemScalarWhereInput
    data: XOR<LearningItemUpdateManyMutationInput, LearningItemUncheckedUpdateManyWithoutUserInput>
  }

  export type LearningItemScalarWhereInput = {
    AND?: LearningItemScalarWhereInput | LearningItemScalarWhereInput[]
    OR?: LearningItemScalarWhereInput[]
    NOT?: LearningItemScalarWhereInput | LearningItemScalarWhereInput[]
    id?: StringFilter<"LearningItem"> | string
    userId?: StringFilter<"LearningItem"> | string
    sessionId?: StringNullableFilter<"LearningItem"> | string | null
    type?: EnumLearningItemTypeFilter<"LearningItem"> | $Enums.LearningItemType
    topic?: StringFilter<"LearningItem"> | string
    difficulty?: IntFilter<"LearningItem"> | number
    payload?: JsonFilter<"LearningItem">
    isPublished?: BoolFilter<"LearningItem"> | boolean
    engagementScore?: FloatFilter<"LearningItem"> | number
    masteredByUser?: BoolFilter<"LearningItem"> | boolean
    lastInteractedAt?: DateTimeNullableFilter<"LearningItem"> | Date | string | null
    nextReviewAt?: DateTimeNullableFilter<"LearningItem"> | Date | string | null
    reviewInterval?: IntFilter<"LearningItem"> | number
    reviewCount?: IntFilter<"LearningItem"> | number
    createdAt?: DateTimeFilter<"LearningItem"> | Date | string
    updatedAt?: DateTimeFilter<"LearningItem"> | Date | string
  }

  export type UserInteractionUpsertWithWhereUniqueWithoutUserInput = {
    where: UserInteractionWhereUniqueInput
    update: XOR<UserInteractionUpdateWithoutUserInput, UserInteractionUncheckedUpdateWithoutUserInput>
    create: XOR<UserInteractionCreateWithoutUserInput, UserInteractionUncheckedCreateWithoutUserInput>
  }

  export type UserInteractionUpdateWithWhereUniqueWithoutUserInput = {
    where: UserInteractionWhereUniqueInput
    data: XOR<UserInteractionUpdateWithoutUserInput, UserInteractionUncheckedUpdateWithoutUserInput>
  }

  export type UserInteractionUpdateManyWithWhereWithoutUserInput = {
    where: UserInteractionScalarWhereInput
    data: XOR<UserInteractionUpdateManyMutationInput, UserInteractionUncheckedUpdateManyWithoutUserInput>
  }

  export type UserInteractionScalarWhereInput = {
    AND?: UserInteractionScalarWhereInput | UserInteractionScalarWhereInput[]
    OR?: UserInteractionScalarWhereInput[]
    NOT?: UserInteractionScalarWhereInput | UserInteractionScalarWhereInput[]
    id?: StringFilter<"UserInteraction"> | string
    userId?: StringFilter<"UserInteraction"> | string
    learningItemId?: StringFilter<"UserInteraction"> | string
    type?: EnumInteractionTypeFilter<"UserInteraction"> | $Enums.InteractionType
    isCorrect?: BoolNullableFilter<"UserInteraction"> | boolean | null
    createdAt?: DateTimeFilter<"UserInteraction"> | Date | string
  }

  export type FeedItemUpsertWithWhereUniqueWithoutUserInput = {
    where: FeedItemWhereUniqueInput
    update: XOR<FeedItemUpdateWithoutUserInput, FeedItemUncheckedUpdateWithoutUserInput>
    create: XOR<FeedItemCreateWithoutUserInput, FeedItemUncheckedCreateWithoutUserInput>
  }

  export type FeedItemUpdateWithWhereUniqueWithoutUserInput = {
    where: FeedItemWhereUniqueInput
    data: XOR<FeedItemUpdateWithoutUserInput, FeedItemUncheckedUpdateWithoutUserInput>
  }

  export type FeedItemUpdateManyWithWhereWithoutUserInput = {
    where: FeedItemScalarWhereInput
    data: XOR<FeedItemUpdateManyMutationInput, FeedItemUncheckedUpdateManyWithoutUserInput>
  }

  export type FeedItemScalarWhereInput = {
    AND?: FeedItemScalarWhereInput | FeedItemScalarWhereInput[]
    OR?: FeedItemScalarWhereInput[]
    NOT?: FeedItemScalarWhereInput | FeedItemScalarWhereInput[]
    id?: StringFilter<"FeedItem"> | string
    learningItemId?: StringFilter<"FeedItem"> | string
    publishedByUserId?: StringNullableFilter<"FeedItem"> | string | null
    publishedAt?: DateTimeFilter<"FeedItem"> | Date | string
    createdAt?: DateTimeFilter<"FeedItem"> | Date | string
    userId?: StringNullableFilter<"FeedItem"> | string | null
  }

  export type LearningStreakUpsertWithoutUserInput = {
    update: XOR<LearningStreakUpdateWithoutUserInput, LearningStreakUncheckedUpdateWithoutUserInput>
    create: XOR<LearningStreakCreateWithoutUserInput, LearningStreakUncheckedCreateWithoutUserInput>
    where?: LearningStreakWhereInput
  }

  export type LearningStreakUpdateToOneWithWhereWithoutUserInput = {
    where?: LearningStreakWhereInput
    data: XOR<LearningStreakUpdateWithoutUserInput, LearningStreakUncheckedUpdateWithoutUserInput>
  }

  export type LearningStreakUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    currentStreak?: IntFieldUpdateOperationsInput | number
    longestStreak?: IntFieldUpdateOperationsInput | number
    lastActiveDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LearningStreakUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    currentStreak?: IntFieldUpdateOperationsInput | number
    longestStreak?: IntFieldUpdateOperationsInput | number
    lastActiveDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LeaderboardScoreUpsertWithoutUserInput = {
    update: XOR<LeaderboardScoreUpdateWithoutUserInput, LeaderboardScoreUncheckedUpdateWithoutUserInput>
    create: XOR<LeaderboardScoreCreateWithoutUserInput, LeaderboardScoreUncheckedCreateWithoutUserInput>
    where?: LeaderboardScoreWhereInput
  }

  export type LeaderboardScoreUpdateToOneWithWhereWithoutUserInput = {
    where?: LeaderboardScoreWhereInput
    data: XOR<LeaderboardScoreUpdateWithoutUserInput, LeaderboardScoreUncheckedUpdateWithoutUserInput>
  }

  export type LeaderboardScoreUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    correctAnswers?: IntFieldUpdateOperationsInput | number
    sessionsCompleted?: IntFieldUpdateOperationsInput | number
    streak?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LeaderboardScoreUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    score?: FloatFieldUpdateOperationsInput | number
    correctAnswers?: IntFieldUpdateOperationsInput | number
    sessionsCompleted?: IntFieldUpdateOperationsInput | number
    streak?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateWithoutPushTokensInput = {
    id?: string
    email: string
    name?: string | null
    firebaseUid: string
    targetExam?: string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    sessions?: LearningSessionCreateNestedManyWithoutUserInput
    learningItems?: LearningItemCreateNestedManyWithoutUserInput
    interactions?: UserInteractionCreateNestedManyWithoutUserInput
    feedItems?: FeedItemCreateNestedManyWithoutUserInput
    streak?: LearningStreakCreateNestedOneWithoutUserInput
    leaderboardScore?: LeaderboardScoreCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutPushTokensInput = {
    id?: string
    email: string
    name?: string | null
    firebaseUid: string
    targetExam?: string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    sessions?: LearningSessionUncheckedCreateNestedManyWithoutUserInput
    learningItems?: LearningItemUncheckedCreateNestedManyWithoutUserInput
    interactions?: UserInteractionUncheckedCreateNestedManyWithoutUserInput
    feedItems?: FeedItemUncheckedCreateNestedManyWithoutUserInput
    streak?: LearningStreakUncheckedCreateNestedOneWithoutUserInput
    leaderboardScore?: LeaderboardScoreUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutPushTokensInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutPushTokensInput, UserUncheckedCreateWithoutPushTokensInput>
  }

  export type UserUpsertWithoutPushTokensInput = {
    update: XOR<UserUpdateWithoutPushTokensInput, UserUncheckedUpdateWithoutPushTokensInput>
    create: XOR<UserCreateWithoutPushTokensInput, UserUncheckedCreateWithoutPushTokensInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutPushTokensInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutPushTokensInput, UserUncheckedUpdateWithoutPushTokensInput>
  }

  export type UserUpdateWithoutPushTokensInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    firebaseUid?: StringFieldUpdateOperationsInput | string
    targetExam?: NullableStringFieldUpdateOperationsInput | string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sessions?: LearningSessionUpdateManyWithoutUserNestedInput
    learningItems?: LearningItemUpdateManyWithoutUserNestedInput
    interactions?: UserInteractionUpdateManyWithoutUserNestedInput
    feedItems?: FeedItemUpdateManyWithoutUserNestedInput
    streak?: LearningStreakUpdateOneWithoutUserNestedInput
    leaderboardScore?: LeaderboardScoreUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutPushTokensInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    firebaseUid?: StringFieldUpdateOperationsInput | string
    targetExam?: NullableStringFieldUpdateOperationsInput | string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sessions?: LearningSessionUncheckedUpdateManyWithoutUserNestedInput
    learningItems?: LearningItemUncheckedUpdateManyWithoutUserNestedInput
    interactions?: UserInteractionUncheckedUpdateManyWithoutUserNestedInput
    feedItems?: FeedItemUncheckedUpdateManyWithoutUserNestedInput
    streak?: LearningStreakUncheckedUpdateOneWithoutUserNestedInput
    leaderboardScore?: LeaderboardScoreUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutSessionsInput = {
    id?: string
    email: string
    name?: string | null
    firebaseUid: string
    targetExam?: string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    pushTokens?: PushTokenCreateNestedManyWithoutUserInput
    learningItems?: LearningItemCreateNestedManyWithoutUserInput
    interactions?: UserInteractionCreateNestedManyWithoutUserInput
    feedItems?: FeedItemCreateNestedManyWithoutUserInput
    streak?: LearningStreakCreateNestedOneWithoutUserInput
    leaderboardScore?: LeaderboardScoreCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSessionsInput = {
    id?: string
    email: string
    name?: string | null
    firebaseUid: string
    targetExam?: string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    pushTokens?: PushTokenUncheckedCreateNestedManyWithoutUserInput
    learningItems?: LearningItemUncheckedCreateNestedManyWithoutUserInput
    interactions?: UserInteractionUncheckedCreateNestedManyWithoutUserInput
    feedItems?: FeedItemUncheckedCreateNestedManyWithoutUserInput
    streak?: LearningStreakUncheckedCreateNestedOneWithoutUserInput
    leaderboardScore?: LeaderboardScoreUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSessionsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
  }

  export type LearningItemCreateWithoutSessionInput = {
    id?: string
    type: $Enums.LearningItemType
    topic: string
    difficulty?: number
    payload: JsonNullValueInput | InputJsonValue
    isPublished?: boolean
    engagementScore?: number
    masteredByUser?: boolean
    lastInteractedAt?: Date | string | null
    nextReviewAt?: Date | string | null
    reviewInterval?: number
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutLearningItemsInput
    feedItem?: FeedItemCreateNestedOneWithoutLearningItemInput
    interactions?: UserInteractionCreateNestedManyWithoutLearningItemInput
  }

  export type LearningItemUncheckedCreateWithoutSessionInput = {
    id?: string
    userId: string
    type: $Enums.LearningItemType
    topic: string
    difficulty?: number
    payload: JsonNullValueInput | InputJsonValue
    isPublished?: boolean
    engagementScore?: number
    masteredByUser?: boolean
    lastInteractedAt?: Date | string | null
    nextReviewAt?: Date | string | null
    reviewInterval?: number
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    feedItem?: FeedItemUncheckedCreateNestedOneWithoutLearningItemInput
    interactions?: UserInteractionUncheckedCreateNestedManyWithoutLearningItemInput
  }

  export type LearningItemCreateOrConnectWithoutSessionInput = {
    where: LearningItemWhereUniqueInput
    create: XOR<LearningItemCreateWithoutSessionInput, LearningItemUncheckedCreateWithoutSessionInput>
  }

  export type LearningItemCreateManySessionInputEnvelope = {
    data: LearningItemCreateManySessionInput | LearningItemCreateManySessionInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutSessionsInput = {
    update: XOR<UserUpdateWithoutSessionsInput, UserUncheckedUpdateWithoutSessionsInput>
    create: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSessionsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSessionsInput, UserUncheckedUpdateWithoutSessionsInput>
  }

  export type UserUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    firebaseUid?: StringFieldUpdateOperationsInput | string
    targetExam?: NullableStringFieldUpdateOperationsInput | string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pushTokens?: PushTokenUpdateManyWithoutUserNestedInput
    learningItems?: LearningItemUpdateManyWithoutUserNestedInput
    interactions?: UserInteractionUpdateManyWithoutUserNestedInput
    feedItems?: FeedItemUpdateManyWithoutUserNestedInput
    streak?: LearningStreakUpdateOneWithoutUserNestedInput
    leaderboardScore?: LeaderboardScoreUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    firebaseUid?: StringFieldUpdateOperationsInput | string
    targetExam?: NullableStringFieldUpdateOperationsInput | string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pushTokens?: PushTokenUncheckedUpdateManyWithoutUserNestedInput
    learningItems?: LearningItemUncheckedUpdateManyWithoutUserNestedInput
    interactions?: UserInteractionUncheckedUpdateManyWithoutUserNestedInput
    feedItems?: FeedItemUncheckedUpdateManyWithoutUserNestedInput
    streak?: LearningStreakUncheckedUpdateOneWithoutUserNestedInput
    leaderboardScore?: LeaderboardScoreUncheckedUpdateOneWithoutUserNestedInput
  }

  export type LearningItemUpsertWithWhereUniqueWithoutSessionInput = {
    where: LearningItemWhereUniqueInput
    update: XOR<LearningItemUpdateWithoutSessionInput, LearningItemUncheckedUpdateWithoutSessionInput>
    create: XOR<LearningItemCreateWithoutSessionInput, LearningItemUncheckedCreateWithoutSessionInput>
  }

  export type LearningItemUpdateWithWhereUniqueWithoutSessionInput = {
    where: LearningItemWhereUniqueInput
    data: XOR<LearningItemUpdateWithoutSessionInput, LearningItemUncheckedUpdateWithoutSessionInput>
  }

  export type LearningItemUpdateManyWithWhereWithoutSessionInput = {
    where: LearningItemScalarWhereInput
    data: XOR<LearningItemUpdateManyMutationInput, LearningItemUncheckedUpdateManyWithoutSessionInput>
  }

  export type UserCreateWithoutLearningItemsInput = {
    id?: string
    email: string
    name?: string | null
    firebaseUid: string
    targetExam?: string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    pushTokens?: PushTokenCreateNestedManyWithoutUserInput
    sessions?: LearningSessionCreateNestedManyWithoutUserInput
    interactions?: UserInteractionCreateNestedManyWithoutUserInput
    feedItems?: FeedItemCreateNestedManyWithoutUserInput
    streak?: LearningStreakCreateNestedOneWithoutUserInput
    leaderboardScore?: LeaderboardScoreCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutLearningItemsInput = {
    id?: string
    email: string
    name?: string | null
    firebaseUid: string
    targetExam?: string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    pushTokens?: PushTokenUncheckedCreateNestedManyWithoutUserInput
    sessions?: LearningSessionUncheckedCreateNestedManyWithoutUserInput
    interactions?: UserInteractionUncheckedCreateNestedManyWithoutUserInput
    feedItems?: FeedItemUncheckedCreateNestedManyWithoutUserInput
    streak?: LearningStreakUncheckedCreateNestedOneWithoutUserInput
    leaderboardScore?: LeaderboardScoreUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutLearningItemsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutLearningItemsInput, UserUncheckedCreateWithoutLearningItemsInput>
  }

  export type LearningSessionCreateWithoutItemsInput = {
    id?: string
    topic: string
    status?: $Enums.SessionStatus
    totalGenerated?: number
    totalCompleted?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutSessionsInput
  }

  export type LearningSessionUncheckedCreateWithoutItemsInput = {
    id?: string
    userId: string
    topic: string
    status?: $Enums.SessionStatus
    totalGenerated?: number
    totalCompleted?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LearningSessionCreateOrConnectWithoutItemsInput = {
    where: LearningSessionWhereUniqueInput
    create: XOR<LearningSessionCreateWithoutItemsInput, LearningSessionUncheckedCreateWithoutItemsInput>
  }

  export type FeedItemCreateWithoutLearningItemInput = {
    id?: string
    publishedByUserId?: string | null
    publishedAt?: Date | string
    createdAt?: Date | string
    user?: UserCreateNestedOneWithoutFeedItemsInput
  }

  export type FeedItemUncheckedCreateWithoutLearningItemInput = {
    id?: string
    publishedByUserId?: string | null
    publishedAt?: Date | string
    createdAt?: Date | string
    userId?: string | null
  }

  export type FeedItemCreateOrConnectWithoutLearningItemInput = {
    where: FeedItemWhereUniqueInput
    create: XOR<FeedItemCreateWithoutLearningItemInput, FeedItemUncheckedCreateWithoutLearningItemInput>
  }

  export type UserInteractionCreateWithoutLearningItemInput = {
    id?: string
    type: $Enums.InteractionType
    isCorrect?: boolean | null
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutInteractionsInput
  }

  export type UserInteractionUncheckedCreateWithoutLearningItemInput = {
    id?: string
    userId: string
    type: $Enums.InteractionType
    isCorrect?: boolean | null
    createdAt?: Date | string
  }

  export type UserInteractionCreateOrConnectWithoutLearningItemInput = {
    where: UserInteractionWhereUniqueInput
    create: XOR<UserInteractionCreateWithoutLearningItemInput, UserInteractionUncheckedCreateWithoutLearningItemInput>
  }

  export type UserInteractionCreateManyLearningItemInputEnvelope = {
    data: UserInteractionCreateManyLearningItemInput | UserInteractionCreateManyLearningItemInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutLearningItemsInput = {
    update: XOR<UserUpdateWithoutLearningItemsInput, UserUncheckedUpdateWithoutLearningItemsInput>
    create: XOR<UserCreateWithoutLearningItemsInput, UserUncheckedCreateWithoutLearningItemsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutLearningItemsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutLearningItemsInput, UserUncheckedUpdateWithoutLearningItemsInput>
  }

  export type UserUpdateWithoutLearningItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    firebaseUid?: StringFieldUpdateOperationsInput | string
    targetExam?: NullableStringFieldUpdateOperationsInput | string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pushTokens?: PushTokenUpdateManyWithoutUserNestedInput
    sessions?: LearningSessionUpdateManyWithoutUserNestedInput
    interactions?: UserInteractionUpdateManyWithoutUserNestedInput
    feedItems?: FeedItemUpdateManyWithoutUserNestedInput
    streak?: LearningStreakUpdateOneWithoutUserNestedInput
    leaderboardScore?: LeaderboardScoreUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutLearningItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    firebaseUid?: StringFieldUpdateOperationsInput | string
    targetExam?: NullableStringFieldUpdateOperationsInput | string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pushTokens?: PushTokenUncheckedUpdateManyWithoutUserNestedInput
    sessions?: LearningSessionUncheckedUpdateManyWithoutUserNestedInput
    interactions?: UserInteractionUncheckedUpdateManyWithoutUserNestedInput
    feedItems?: FeedItemUncheckedUpdateManyWithoutUserNestedInput
    streak?: LearningStreakUncheckedUpdateOneWithoutUserNestedInput
    leaderboardScore?: LeaderboardScoreUncheckedUpdateOneWithoutUserNestedInput
  }

  export type LearningSessionUpsertWithoutItemsInput = {
    update: XOR<LearningSessionUpdateWithoutItemsInput, LearningSessionUncheckedUpdateWithoutItemsInput>
    create: XOR<LearningSessionCreateWithoutItemsInput, LearningSessionUncheckedCreateWithoutItemsInput>
    where?: LearningSessionWhereInput
  }

  export type LearningSessionUpdateToOneWithWhereWithoutItemsInput = {
    where?: LearningSessionWhereInput
    data: XOR<LearningSessionUpdateWithoutItemsInput, LearningSessionUncheckedUpdateWithoutItemsInput>
  }

  export type LearningSessionUpdateWithoutItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    status?: EnumSessionStatusFieldUpdateOperationsInput | $Enums.SessionStatus
    totalGenerated?: IntFieldUpdateOperationsInput | number
    totalCompleted?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSessionsNestedInput
  }

  export type LearningSessionUncheckedUpdateWithoutItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    status?: EnumSessionStatusFieldUpdateOperationsInput | $Enums.SessionStatus
    totalGenerated?: IntFieldUpdateOperationsInput | number
    totalCompleted?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FeedItemUpsertWithoutLearningItemInput = {
    update: XOR<FeedItemUpdateWithoutLearningItemInput, FeedItemUncheckedUpdateWithoutLearningItemInput>
    create: XOR<FeedItemCreateWithoutLearningItemInput, FeedItemUncheckedCreateWithoutLearningItemInput>
    where?: FeedItemWhereInput
  }

  export type FeedItemUpdateToOneWithWhereWithoutLearningItemInput = {
    where?: FeedItemWhereInput
    data: XOR<FeedItemUpdateWithoutLearningItemInput, FeedItemUncheckedUpdateWithoutLearningItemInput>
  }

  export type FeedItemUpdateWithoutLearningItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    publishedByUserId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneWithoutFeedItemsNestedInput
  }

  export type FeedItemUncheckedUpdateWithoutLearningItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    publishedByUserId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type UserInteractionUpsertWithWhereUniqueWithoutLearningItemInput = {
    where: UserInteractionWhereUniqueInput
    update: XOR<UserInteractionUpdateWithoutLearningItemInput, UserInteractionUncheckedUpdateWithoutLearningItemInput>
    create: XOR<UserInteractionCreateWithoutLearningItemInput, UserInteractionUncheckedCreateWithoutLearningItemInput>
  }

  export type UserInteractionUpdateWithWhereUniqueWithoutLearningItemInput = {
    where: UserInteractionWhereUniqueInput
    data: XOR<UserInteractionUpdateWithoutLearningItemInput, UserInteractionUncheckedUpdateWithoutLearningItemInput>
  }

  export type UserInteractionUpdateManyWithWhereWithoutLearningItemInput = {
    where: UserInteractionScalarWhereInput
    data: XOR<UserInteractionUpdateManyMutationInput, UserInteractionUncheckedUpdateManyWithoutLearningItemInput>
  }

  export type LearningItemCreateWithoutFeedItemInput = {
    id?: string
    type: $Enums.LearningItemType
    topic: string
    difficulty?: number
    payload: JsonNullValueInput | InputJsonValue
    isPublished?: boolean
    engagementScore?: number
    masteredByUser?: boolean
    lastInteractedAt?: Date | string | null
    nextReviewAt?: Date | string | null
    reviewInterval?: number
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutLearningItemsInput
    session?: LearningSessionCreateNestedOneWithoutItemsInput
    interactions?: UserInteractionCreateNestedManyWithoutLearningItemInput
  }

  export type LearningItemUncheckedCreateWithoutFeedItemInput = {
    id?: string
    userId: string
    sessionId?: string | null
    type: $Enums.LearningItemType
    topic: string
    difficulty?: number
    payload: JsonNullValueInput | InputJsonValue
    isPublished?: boolean
    engagementScore?: number
    masteredByUser?: boolean
    lastInteractedAt?: Date | string | null
    nextReviewAt?: Date | string | null
    reviewInterval?: number
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    interactions?: UserInteractionUncheckedCreateNestedManyWithoutLearningItemInput
  }

  export type LearningItemCreateOrConnectWithoutFeedItemInput = {
    where: LearningItemWhereUniqueInput
    create: XOR<LearningItemCreateWithoutFeedItemInput, LearningItemUncheckedCreateWithoutFeedItemInput>
  }

  export type UserCreateWithoutFeedItemsInput = {
    id?: string
    email: string
    name?: string | null
    firebaseUid: string
    targetExam?: string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    pushTokens?: PushTokenCreateNestedManyWithoutUserInput
    sessions?: LearningSessionCreateNestedManyWithoutUserInput
    learningItems?: LearningItemCreateNestedManyWithoutUserInput
    interactions?: UserInteractionCreateNestedManyWithoutUserInput
    streak?: LearningStreakCreateNestedOneWithoutUserInput
    leaderboardScore?: LeaderboardScoreCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutFeedItemsInput = {
    id?: string
    email: string
    name?: string | null
    firebaseUid: string
    targetExam?: string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    pushTokens?: PushTokenUncheckedCreateNestedManyWithoutUserInput
    sessions?: LearningSessionUncheckedCreateNestedManyWithoutUserInput
    learningItems?: LearningItemUncheckedCreateNestedManyWithoutUserInput
    interactions?: UserInteractionUncheckedCreateNestedManyWithoutUserInput
    streak?: LearningStreakUncheckedCreateNestedOneWithoutUserInput
    leaderboardScore?: LeaderboardScoreUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutFeedItemsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutFeedItemsInput, UserUncheckedCreateWithoutFeedItemsInput>
  }

  export type LearningItemUpsertWithoutFeedItemInput = {
    update: XOR<LearningItemUpdateWithoutFeedItemInput, LearningItemUncheckedUpdateWithoutFeedItemInput>
    create: XOR<LearningItemCreateWithoutFeedItemInput, LearningItemUncheckedCreateWithoutFeedItemInput>
    where?: LearningItemWhereInput
  }

  export type LearningItemUpdateToOneWithWhereWithoutFeedItemInput = {
    where?: LearningItemWhereInput
    data: XOR<LearningItemUpdateWithoutFeedItemInput, LearningItemUncheckedUpdateWithoutFeedItemInput>
  }

  export type LearningItemUpdateWithoutFeedItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumLearningItemTypeFieldUpdateOperationsInput | $Enums.LearningItemType
    topic?: StringFieldUpdateOperationsInput | string
    difficulty?: IntFieldUpdateOperationsInput | number
    payload?: JsonNullValueInput | InputJsonValue
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    engagementScore?: FloatFieldUpdateOperationsInput | number
    masteredByUser?: BoolFieldUpdateOperationsInput | boolean
    lastInteractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextReviewAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewInterval?: IntFieldUpdateOperationsInput | number
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutLearningItemsNestedInput
    session?: LearningSessionUpdateOneWithoutItemsNestedInput
    interactions?: UserInteractionUpdateManyWithoutLearningItemNestedInput
  }

  export type LearningItemUncheckedUpdateWithoutFeedItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumLearningItemTypeFieldUpdateOperationsInput | $Enums.LearningItemType
    topic?: StringFieldUpdateOperationsInput | string
    difficulty?: IntFieldUpdateOperationsInput | number
    payload?: JsonNullValueInput | InputJsonValue
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    engagementScore?: FloatFieldUpdateOperationsInput | number
    masteredByUser?: BoolFieldUpdateOperationsInput | boolean
    lastInteractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextReviewAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewInterval?: IntFieldUpdateOperationsInput | number
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    interactions?: UserInteractionUncheckedUpdateManyWithoutLearningItemNestedInput
  }

  export type UserUpsertWithoutFeedItemsInput = {
    update: XOR<UserUpdateWithoutFeedItemsInput, UserUncheckedUpdateWithoutFeedItemsInput>
    create: XOR<UserCreateWithoutFeedItemsInput, UserUncheckedCreateWithoutFeedItemsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutFeedItemsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutFeedItemsInput, UserUncheckedUpdateWithoutFeedItemsInput>
  }

  export type UserUpdateWithoutFeedItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    firebaseUid?: StringFieldUpdateOperationsInput | string
    targetExam?: NullableStringFieldUpdateOperationsInput | string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pushTokens?: PushTokenUpdateManyWithoutUserNestedInput
    sessions?: LearningSessionUpdateManyWithoutUserNestedInput
    learningItems?: LearningItemUpdateManyWithoutUserNestedInput
    interactions?: UserInteractionUpdateManyWithoutUserNestedInput
    streak?: LearningStreakUpdateOneWithoutUserNestedInput
    leaderboardScore?: LeaderboardScoreUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutFeedItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    firebaseUid?: StringFieldUpdateOperationsInput | string
    targetExam?: NullableStringFieldUpdateOperationsInput | string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pushTokens?: PushTokenUncheckedUpdateManyWithoutUserNestedInput
    sessions?: LearningSessionUncheckedUpdateManyWithoutUserNestedInput
    learningItems?: LearningItemUncheckedUpdateManyWithoutUserNestedInput
    interactions?: UserInteractionUncheckedUpdateManyWithoutUserNestedInput
    streak?: LearningStreakUncheckedUpdateOneWithoutUserNestedInput
    leaderboardScore?: LeaderboardScoreUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutInteractionsInput = {
    id?: string
    email: string
    name?: string | null
    firebaseUid: string
    targetExam?: string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    pushTokens?: PushTokenCreateNestedManyWithoutUserInput
    sessions?: LearningSessionCreateNestedManyWithoutUserInput
    learningItems?: LearningItemCreateNestedManyWithoutUserInput
    feedItems?: FeedItemCreateNestedManyWithoutUserInput
    streak?: LearningStreakCreateNestedOneWithoutUserInput
    leaderboardScore?: LeaderboardScoreCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutInteractionsInput = {
    id?: string
    email: string
    name?: string | null
    firebaseUid: string
    targetExam?: string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    pushTokens?: PushTokenUncheckedCreateNestedManyWithoutUserInput
    sessions?: LearningSessionUncheckedCreateNestedManyWithoutUserInput
    learningItems?: LearningItemUncheckedCreateNestedManyWithoutUserInput
    feedItems?: FeedItemUncheckedCreateNestedManyWithoutUserInput
    streak?: LearningStreakUncheckedCreateNestedOneWithoutUserInput
    leaderboardScore?: LeaderboardScoreUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutInteractionsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutInteractionsInput, UserUncheckedCreateWithoutInteractionsInput>
  }

  export type LearningItemCreateWithoutInteractionsInput = {
    id?: string
    type: $Enums.LearningItemType
    topic: string
    difficulty?: number
    payload: JsonNullValueInput | InputJsonValue
    isPublished?: boolean
    engagementScore?: number
    masteredByUser?: boolean
    lastInteractedAt?: Date | string | null
    nextReviewAt?: Date | string | null
    reviewInterval?: number
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutLearningItemsInput
    session?: LearningSessionCreateNestedOneWithoutItemsInput
    feedItem?: FeedItemCreateNestedOneWithoutLearningItemInput
  }

  export type LearningItemUncheckedCreateWithoutInteractionsInput = {
    id?: string
    userId: string
    sessionId?: string | null
    type: $Enums.LearningItemType
    topic: string
    difficulty?: number
    payload: JsonNullValueInput | InputJsonValue
    isPublished?: boolean
    engagementScore?: number
    masteredByUser?: boolean
    lastInteractedAt?: Date | string | null
    nextReviewAt?: Date | string | null
    reviewInterval?: number
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    feedItem?: FeedItemUncheckedCreateNestedOneWithoutLearningItemInput
  }

  export type LearningItemCreateOrConnectWithoutInteractionsInput = {
    where: LearningItemWhereUniqueInput
    create: XOR<LearningItemCreateWithoutInteractionsInput, LearningItemUncheckedCreateWithoutInteractionsInput>
  }

  export type UserUpsertWithoutInteractionsInput = {
    update: XOR<UserUpdateWithoutInteractionsInput, UserUncheckedUpdateWithoutInteractionsInput>
    create: XOR<UserCreateWithoutInteractionsInput, UserUncheckedCreateWithoutInteractionsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutInteractionsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutInteractionsInput, UserUncheckedUpdateWithoutInteractionsInput>
  }

  export type UserUpdateWithoutInteractionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    firebaseUid?: StringFieldUpdateOperationsInput | string
    targetExam?: NullableStringFieldUpdateOperationsInput | string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pushTokens?: PushTokenUpdateManyWithoutUserNestedInput
    sessions?: LearningSessionUpdateManyWithoutUserNestedInput
    learningItems?: LearningItemUpdateManyWithoutUserNestedInput
    feedItems?: FeedItemUpdateManyWithoutUserNestedInput
    streak?: LearningStreakUpdateOneWithoutUserNestedInput
    leaderboardScore?: LeaderboardScoreUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutInteractionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    firebaseUid?: StringFieldUpdateOperationsInput | string
    targetExam?: NullableStringFieldUpdateOperationsInput | string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pushTokens?: PushTokenUncheckedUpdateManyWithoutUserNestedInput
    sessions?: LearningSessionUncheckedUpdateManyWithoutUserNestedInput
    learningItems?: LearningItemUncheckedUpdateManyWithoutUserNestedInput
    feedItems?: FeedItemUncheckedUpdateManyWithoutUserNestedInput
    streak?: LearningStreakUncheckedUpdateOneWithoutUserNestedInput
    leaderboardScore?: LeaderboardScoreUncheckedUpdateOneWithoutUserNestedInput
  }

  export type LearningItemUpsertWithoutInteractionsInput = {
    update: XOR<LearningItemUpdateWithoutInteractionsInput, LearningItemUncheckedUpdateWithoutInteractionsInput>
    create: XOR<LearningItemCreateWithoutInteractionsInput, LearningItemUncheckedCreateWithoutInteractionsInput>
    where?: LearningItemWhereInput
  }

  export type LearningItemUpdateToOneWithWhereWithoutInteractionsInput = {
    where?: LearningItemWhereInput
    data: XOR<LearningItemUpdateWithoutInteractionsInput, LearningItemUncheckedUpdateWithoutInteractionsInput>
  }

  export type LearningItemUpdateWithoutInteractionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumLearningItemTypeFieldUpdateOperationsInput | $Enums.LearningItemType
    topic?: StringFieldUpdateOperationsInput | string
    difficulty?: IntFieldUpdateOperationsInput | number
    payload?: JsonNullValueInput | InputJsonValue
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    engagementScore?: FloatFieldUpdateOperationsInput | number
    masteredByUser?: BoolFieldUpdateOperationsInput | boolean
    lastInteractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextReviewAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewInterval?: IntFieldUpdateOperationsInput | number
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutLearningItemsNestedInput
    session?: LearningSessionUpdateOneWithoutItemsNestedInput
    feedItem?: FeedItemUpdateOneWithoutLearningItemNestedInput
  }

  export type LearningItemUncheckedUpdateWithoutInteractionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumLearningItemTypeFieldUpdateOperationsInput | $Enums.LearningItemType
    topic?: StringFieldUpdateOperationsInput | string
    difficulty?: IntFieldUpdateOperationsInput | number
    payload?: JsonNullValueInput | InputJsonValue
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    engagementScore?: FloatFieldUpdateOperationsInput | number
    masteredByUser?: BoolFieldUpdateOperationsInput | boolean
    lastInteractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextReviewAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewInterval?: IntFieldUpdateOperationsInput | number
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    feedItem?: FeedItemUncheckedUpdateOneWithoutLearningItemNestedInput
  }

  export type UserCreateWithoutStreakInput = {
    id?: string
    email: string
    name?: string | null
    firebaseUid: string
    targetExam?: string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    pushTokens?: PushTokenCreateNestedManyWithoutUserInput
    sessions?: LearningSessionCreateNestedManyWithoutUserInput
    learningItems?: LearningItemCreateNestedManyWithoutUserInput
    interactions?: UserInteractionCreateNestedManyWithoutUserInput
    feedItems?: FeedItemCreateNestedManyWithoutUserInput
    leaderboardScore?: LeaderboardScoreCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutStreakInput = {
    id?: string
    email: string
    name?: string | null
    firebaseUid: string
    targetExam?: string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    pushTokens?: PushTokenUncheckedCreateNestedManyWithoutUserInput
    sessions?: LearningSessionUncheckedCreateNestedManyWithoutUserInput
    learningItems?: LearningItemUncheckedCreateNestedManyWithoutUserInput
    interactions?: UserInteractionUncheckedCreateNestedManyWithoutUserInput
    feedItems?: FeedItemUncheckedCreateNestedManyWithoutUserInput
    leaderboardScore?: LeaderboardScoreUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutStreakInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutStreakInput, UserUncheckedCreateWithoutStreakInput>
  }

  export type UserUpsertWithoutStreakInput = {
    update: XOR<UserUpdateWithoutStreakInput, UserUncheckedUpdateWithoutStreakInput>
    create: XOR<UserCreateWithoutStreakInput, UserUncheckedCreateWithoutStreakInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutStreakInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutStreakInput, UserUncheckedUpdateWithoutStreakInput>
  }

  export type UserUpdateWithoutStreakInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    firebaseUid?: StringFieldUpdateOperationsInput | string
    targetExam?: NullableStringFieldUpdateOperationsInput | string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pushTokens?: PushTokenUpdateManyWithoutUserNestedInput
    sessions?: LearningSessionUpdateManyWithoutUserNestedInput
    learningItems?: LearningItemUpdateManyWithoutUserNestedInput
    interactions?: UserInteractionUpdateManyWithoutUserNestedInput
    feedItems?: FeedItemUpdateManyWithoutUserNestedInput
    leaderboardScore?: LeaderboardScoreUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutStreakInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    firebaseUid?: StringFieldUpdateOperationsInput | string
    targetExam?: NullableStringFieldUpdateOperationsInput | string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pushTokens?: PushTokenUncheckedUpdateManyWithoutUserNestedInput
    sessions?: LearningSessionUncheckedUpdateManyWithoutUserNestedInput
    learningItems?: LearningItemUncheckedUpdateManyWithoutUserNestedInput
    interactions?: UserInteractionUncheckedUpdateManyWithoutUserNestedInput
    feedItems?: FeedItemUncheckedUpdateManyWithoutUserNestedInput
    leaderboardScore?: LeaderboardScoreUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutLeaderboardScoreInput = {
    id?: string
    email: string
    name?: string | null
    firebaseUid: string
    targetExam?: string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    pushTokens?: PushTokenCreateNestedManyWithoutUserInput
    sessions?: LearningSessionCreateNestedManyWithoutUserInput
    learningItems?: LearningItemCreateNestedManyWithoutUserInput
    interactions?: UserInteractionCreateNestedManyWithoutUserInput
    feedItems?: FeedItemCreateNestedManyWithoutUserInput
    streak?: LearningStreakCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutLeaderboardScoreInput = {
    id?: string
    email: string
    name?: string | null
    firebaseUid: string
    targetExam?: string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    pushTokens?: PushTokenUncheckedCreateNestedManyWithoutUserInput
    sessions?: LearningSessionUncheckedCreateNestedManyWithoutUserInput
    learningItems?: LearningItemUncheckedCreateNestedManyWithoutUserInput
    interactions?: UserInteractionUncheckedCreateNestedManyWithoutUserInput
    feedItems?: FeedItemUncheckedCreateNestedManyWithoutUserInput
    streak?: LearningStreakUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutLeaderboardScoreInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutLeaderboardScoreInput, UserUncheckedCreateWithoutLeaderboardScoreInput>
  }

  export type UserUpsertWithoutLeaderboardScoreInput = {
    update: XOR<UserUpdateWithoutLeaderboardScoreInput, UserUncheckedUpdateWithoutLeaderboardScoreInput>
    create: XOR<UserCreateWithoutLeaderboardScoreInput, UserUncheckedCreateWithoutLeaderboardScoreInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutLeaderboardScoreInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutLeaderboardScoreInput, UserUncheckedUpdateWithoutLeaderboardScoreInput>
  }

  export type UserUpdateWithoutLeaderboardScoreInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    firebaseUid?: StringFieldUpdateOperationsInput | string
    targetExam?: NullableStringFieldUpdateOperationsInput | string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pushTokens?: PushTokenUpdateManyWithoutUserNestedInput
    sessions?: LearningSessionUpdateManyWithoutUserNestedInput
    learningItems?: LearningItemUpdateManyWithoutUserNestedInput
    interactions?: UserInteractionUpdateManyWithoutUserNestedInput
    feedItems?: FeedItemUpdateManyWithoutUserNestedInput
    streak?: LearningStreakUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutLeaderboardScoreInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    firebaseUid?: StringFieldUpdateOperationsInput | string
    targetExam?: NullableStringFieldUpdateOperationsInput | string | null
    preferredTopics?: NullableJsonNullValueInput | InputJsonValue
    preferredDifficulty?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pushTokens?: PushTokenUncheckedUpdateManyWithoutUserNestedInput
    sessions?: LearningSessionUncheckedUpdateManyWithoutUserNestedInput
    learningItems?: LearningItemUncheckedUpdateManyWithoutUserNestedInput
    interactions?: UserInteractionUncheckedUpdateManyWithoutUserNestedInput
    feedItems?: FeedItemUncheckedUpdateManyWithoutUserNestedInput
    streak?: LearningStreakUncheckedUpdateOneWithoutUserNestedInput
  }

  export type PushTokenCreateManyUserInput = {
    id?: string
    token: string
  }

  export type LearningSessionCreateManyUserInput = {
    id?: string
    topic: string
    status?: $Enums.SessionStatus
    totalGenerated?: number
    totalCompleted?: number
    startedAt?: Date | string
    completedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LearningItemCreateManyUserInput = {
    id?: string
    sessionId?: string | null
    type: $Enums.LearningItemType
    topic: string
    difficulty?: number
    payload: JsonNullValueInput | InputJsonValue
    isPublished?: boolean
    engagementScore?: number
    masteredByUser?: boolean
    lastInteractedAt?: Date | string | null
    nextReviewAt?: Date | string | null
    reviewInterval?: number
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserInteractionCreateManyUserInput = {
    id?: string
    learningItemId: string
    type: $Enums.InteractionType
    isCorrect?: boolean | null
    createdAt?: Date | string
  }

  export type FeedItemCreateManyUserInput = {
    id?: string
    learningItemId: string
    publishedByUserId?: string | null
    publishedAt?: Date | string
    createdAt?: Date | string
  }

  export type PushTokenUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
  }

  export type PushTokenUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
  }

  export type PushTokenUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
  }

  export type LearningSessionUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    status?: EnumSessionStatusFieldUpdateOperationsInput | $Enums.SessionStatus
    totalGenerated?: IntFieldUpdateOperationsInput | number
    totalCompleted?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: LearningItemUpdateManyWithoutSessionNestedInput
  }

  export type LearningSessionUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    status?: EnumSessionStatusFieldUpdateOperationsInput | $Enums.SessionStatus
    totalGenerated?: IntFieldUpdateOperationsInput | number
    totalCompleted?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: LearningItemUncheckedUpdateManyWithoutSessionNestedInput
  }

  export type LearningSessionUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    status?: EnumSessionStatusFieldUpdateOperationsInput | $Enums.SessionStatus
    totalGenerated?: IntFieldUpdateOperationsInput | number
    totalCompleted?: IntFieldUpdateOperationsInput | number
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LearningItemUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumLearningItemTypeFieldUpdateOperationsInput | $Enums.LearningItemType
    topic?: StringFieldUpdateOperationsInput | string
    difficulty?: IntFieldUpdateOperationsInput | number
    payload?: JsonNullValueInput | InputJsonValue
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    engagementScore?: FloatFieldUpdateOperationsInput | number
    masteredByUser?: BoolFieldUpdateOperationsInput | boolean
    lastInteractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextReviewAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewInterval?: IntFieldUpdateOperationsInput | number
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    session?: LearningSessionUpdateOneWithoutItemsNestedInput
    feedItem?: FeedItemUpdateOneWithoutLearningItemNestedInput
    interactions?: UserInteractionUpdateManyWithoutLearningItemNestedInput
  }

  export type LearningItemUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumLearningItemTypeFieldUpdateOperationsInput | $Enums.LearningItemType
    topic?: StringFieldUpdateOperationsInput | string
    difficulty?: IntFieldUpdateOperationsInput | number
    payload?: JsonNullValueInput | InputJsonValue
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    engagementScore?: FloatFieldUpdateOperationsInput | number
    masteredByUser?: BoolFieldUpdateOperationsInput | boolean
    lastInteractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextReviewAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewInterval?: IntFieldUpdateOperationsInput | number
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    feedItem?: FeedItemUncheckedUpdateOneWithoutLearningItemNestedInput
    interactions?: UserInteractionUncheckedUpdateManyWithoutLearningItemNestedInput
  }

  export type LearningItemUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumLearningItemTypeFieldUpdateOperationsInput | $Enums.LearningItemType
    topic?: StringFieldUpdateOperationsInput | string
    difficulty?: IntFieldUpdateOperationsInput | number
    payload?: JsonNullValueInput | InputJsonValue
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    engagementScore?: FloatFieldUpdateOperationsInput | number
    masteredByUser?: BoolFieldUpdateOperationsInput | boolean
    lastInteractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextReviewAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewInterval?: IntFieldUpdateOperationsInput | number
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserInteractionUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumInteractionTypeFieldUpdateOperationsInput | $Enums.InteractionType
    isCorrect?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    learningItem?: LearningItemUpdateOneRequiredWithoutInteractionsNestedInput
  }

  export type UserInteractionUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    learningItemId?: StringFieldUpdateOperationsInput | string
    type?: EnumInteractionTypeFieldUpdateOperationsInput | $Enums.InteractionType
    isCorrect?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserInteractionUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    learningItemId?: StringFieldUpdateOperationsInput | string
    type?: EnumInteractionTypeFieldUpdateOperationsInput | $Enums.InteractionType
    isCorrect?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FeedItemUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    publishedByUserId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    learningItem?: LearningItemUpdateOneRequiredWithoutFeedItemNestedInput
  }

  export type FeedItemUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    learningItemId?: StringFieldUpdateOperationsInput | string
    publishedByUserId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FeedItemUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    learningItemId?: StringFieldUpdateOperationsInput | string
    publishedByUserId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LearningItemCreateManySessionInput = {
    id?: string
    userId: string
    type: $Enums.LearningItemType
    topic: string
    difficulty?: number
    payload: JsonNullValueInput | InputJsonValue
    isPublished?: boolean
    engagementScore?: number
    masteredByUser?: boolean
    lastInteractedAt?: Date | string | null
    nextReviewAt?: Date | string | null
    reviewInterval?: number
    reviewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LearningItemUpdateWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumLearningItemTypeFieldUpdateOperationsInput | $Enums.LearningItemType
    topic?: StringFieldUpdateOperationsInput | string
    difficulty?: IntFieldUpdateOperationsInput | number
    payload?: JsonNullValueInput | InputJsonValue
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    engagementScore?: FloatFieldUpdateOperationsInput | number
    masteredByUser?: BoolFieldUpdateOperationsInput | boolean
    lastInteractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextReviewAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewInterval?: IntFieldUpdateOperationsInput | number
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutLearningItemsNestedInput
    feedItem?: FeedItemUpdateOneWithoutLearningItemNestedInput
    interactions?: UserInteractionUpdateManyWithoutLearningItemNestedInput
  }

  export type LearningItemUncheckedUpdateWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumLearningItemTypeFieldUpdateOperationsInput | $Enums.LearningItemType
    topic?: StringFieldUpdateOperationsInput | string
    difficulty?: IntFieldUpdateOperationsInput | number
    payload?: JsonNullValueInput | InputJsonValue
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    engagementScore?: FloatFieldUpdateOperationsInput | number
    masteredByUser?: BoolFieldUpdateOperationsInput | boolean
    lastInteractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextReviewAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewInterval?: IntFieldUpdateOperationsInput | number
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    feedItem?: FeedItemUncheckedUpdateOneWithoutLearningItemNestedInput
    interactions?: UserInteractionUncheckedUpdateManyWithoutLearningItemNestedInput
  }

  export type LearningItemUncheckedUpdateManyWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumLearningItemTypeFieldUpdateOperationsInput | $Enums.LearningItemType
    topic?: StringFieldUpdateOperationsInput | string
    difficulty?: IntFieldUpdateOperationsInput | number
    payload?: JsonNullValueInput | InputJsonValue
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    engagementScore?: FloatFieldUpdateOperationsInput | number
    masteredByUser?: BoolFieldUpdateOperationsInput | boolean
    lastInteractedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    nextReviewAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewInterval?: IntFieldUpdateOperationsInput | number
    reviewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserInteractionCreateManyLearningItemInput = {
    id?: string
    userId: string
    type: $Enums.InteractionType
    isCorrect?: boolean | null
    createdAt?: Date | string
  }

  export type UserInteractionUpdateWithoutLearningItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumInteractionTypeFieldUpdateOperationsInput | $Enums.InteractionType
    isCorrect?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutInteractionsNestedInput
  }

  export type UserInteractionUncheckedUpdateWithoutLearningItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumInteractionTypeFieldUpdateOperationsInput | $Enums.InteractionType
    isCorrect?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserInteractionUncheckedUpdateManyWithoutLearningItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumInteractionTypeFieldUpdateOperationsInput | $Enums.InteractionType
    isCorrect?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use UserCountOutputTypeDefaultArgs instead
     */
    export type UserCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use LearningSessionCountOutputTypeDefaultArgs instead
     */
    export type LearningSessionCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = LearningSessionCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use LearningItemCountOutputTypeDefaultArgs instead
     */
    export type LearningItemCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = LearningItemCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserDefaultArgs instead
     */
    export type UserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PushTokenDefaultArgs instead
     */
    export type PushTokenArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PushTokenDefaultArgs<ExtArgs>
    /**
     * @deprecated Use LearningSessionDefaultArgs instead
     */
    export type LearningSessionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = LearningSessionDefaultArgs<ExtArgs>
    /**
     * @deprecated Use LearningItemDefaultArgs instead
     */
    export type LearningItemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = LearningItemDefaultArgs<ExtArgs>
    /**
     * @deprecated Use FeedItemDefaultArgs instead
     */
    export type FeedItemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = FeedItemDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserInteractionDefaultArgs instead
     */
    export type UserInteractionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserInteractionDefaultArgs<ExtArgs>
    /**
     * @deprecated Use LearningStreakDefaultArgs instead
     */
    export type LearningStreakArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = LearningStreakDefaultArgs<ExtArgs>
    /**
     * @deprecated Use LeaderboardScoreDefaultArgs instead
     */
    export type LeaderboardScoreArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = LeaderboardScoreDefaultArgs<ExtArgs>
    /**
     * @deprecated Use DailyChallengeDefaultArgs instead
     */
    export type DailyChallengeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = DailyChallengeDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}