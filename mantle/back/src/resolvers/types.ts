import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
};

export type Alarm = {
  __typename?: 'Alarm';
  acknowledged: Scalars['Boolean']['output'];
  active: Scalars['Boolean']['output'];
  condition: AlarmCondition;
  deviceId: Scalars['String']['output'];
  enabled: Scalars['Boolean']['output'];
  groupId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  metricId: Scalars['String']['output'];
  name: Scalars['String']['output'];
  nodeId: Scalars['String']['output'];
  priority: Scalars['String']['output'];
};

export type AlarmCondition = {
  __typename?: 'AlarmCondition';
  inclusive?: Maybe<Scalars['Boolean']['output']>;
  inclusiveHigh?: Maybe<Scalars['Boolean']['output']>;
  inclusiveLow?: Maybe<Scalars['Boolean']['output']>;
  mode: AlarmConditionMode;
  setpoint?: Maybe<Scalars['Float']['output']>;
  setpointHigh?: Maybe<Scalars['Float']['output']>;
  setpointLow?: Maybe<Scalars['Float']['output']>;
};

export type AlarmConditionInput = {
  inclusive?: InputMaybe<Scalars['Boolean']['input']>;
  inclusiveHigh?: InputMaybe<Scalars['Boolean']['input']>;
  inclusiveLow?: InputMaybe<Scalars['Boolean']['input']>;
  mode: AlarmConditionMode;
  setpoint?: InputMaybe<Scalars['Float']['input']>;
  setpointHigh?: InputMaybe<Scalars['Float']['input']>;
  setpointLow?: InputMaybe<Scalars['Float']['input']>;
};

export enum AlarmConditionMode {
  AboveSetpoint = 'ABOVE_SETPOINT',
  BelowSetpoint = 'BELOW_SETPOINT',
  BetweenSetpoints = 'BETWEEN_SETPOINTS',
  Equal = 'EQUAL',
  NotEqual = 'NOT_EQUAL',
  OutsideSetpoints = 'OUTSIDE_SETPOINTS'
}

export type CreateAlarm = {
  condition: AlarmConditionInput;
  deviceId: Scalars['String']['input'];
  enabled: Scalars['Boolean']['input'];
  groupId: Scalars['String']['input'];
  metricId: Scalars['String']['input'];
  name: Scalars['String']['input'];
  nodeId: Scalars['String']['input'];
  priority: Scalars['String']['input'];
};

export type DeleteAlarm = {
  id: Scalars['String']['input'];
};

/** Read and write queries */
export type Mutation = {
  __typename?: 'Mutation';
  createAlarm: Alarm;
  deleteAlarm: Alarm;
  publishDeviceCommand: Scalars['Boolean']['output'];
  publishNodeCommand: Scalars['Boolean']['output'];
  updateAlarm: Alarm;
};


/** Read and write queries */
export type MutationCreateAlarmArgs = {
  input: CreateAlarm;
};


/** Read and write queries */
export type MutationDeleteAlarmArgs = {
  input: DeleteAlarm;
};


/** Read and write queries */
export type MutationPublishDeviceCommandArgs = {
  command: Scalars['String']['input'];
  deviceId: Scalars['String']['input'];
  nodeId: Scalars['String']['input'];
};


/** Read and write queries */
export type MutationPublishNodeCommandArgs = {
  command: Scalars['String']['input'];
  nodeId: Scalars['String']['input'];
};


/** Read and write queries */
export type MutationUpdateAlarmArgs = {
  input: UpdateAlarm;
};

/** Read only queries */
export type Query = {
  __typename?: 'Query';
  alarms: Array<Alarm>;
  groups: Array<SparkplugGroup>;
  info: Scalars['String']['output'];
};

export type SparkplugDevice = {
  __typename?: 'SparkplugDevice';
  id: Scalars['String']['output'];
  metrics: Array<SparkplugMetric>;
  updatedOn: Scalars['Date']['output'];
};

export type SparkplugGroup = {
  __typename?: 'SparkplugGroup';
  id: Scalars['String']['output'];
  nodes: Array<SparkplugNode>;
  unbornNodes: Array<SparkplugNode>;
  updatedOn: Scalars['Date']['output'];
};

export type SparkplugMetric = {
  __typename?: 'SparkplugMetric';
  history: Array<SparkplugMetricHistory>;
  id: Scalars['String']['output'];
  type: Scalars['String']['output'];
  updateCount: Scalars['Int']['output'];
  updatedOn: Scalars['Date']['output'];
  value?: Maybe<Scalars['String']['output']>;
};

export type SparkplugMetricHistory = {
  __typename?: 'SparkplugMetricHistory';
  timestamp: Scalars['Date']['output'];
  value: Scalars['String']['output'];
};

export type SparkplugNode = {
  __typename?: 'SparkplugNode';
  devices: Array<SparkplugDevice>;
  id: Scalars['String']['output'];
  metrics: Array<SparkplugMetric>;
  unbornDevices: Array<SparkplugDevice>;
  updatedOn: Scalars['Date']['output'];
};

export type UpdateAlarm = {
  condition?: InputMaybe<AlarmConditionInput>;
  deviceId?: InputMaybe<Scalars['String']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  groupId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  metricId?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  nodeId?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<Scalars['String']['input']>;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Alarm: ResolverTypeWrapper<Alarm>;
  AlarmCondition: ResolverTypeWrapper<AlarmCondition>;
  AlarmConditionInput: AlarmConditionInput;
  AlarmConditionMode: AlarmConditionMode;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CreateAlarm: CreateAlarm;
  Date: ResolverTypeWrapper<Scalars['Date']['output']>;
  DeleteAlarm: DeleteAlarm;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  Query: ResolverTypeWrapper<{}>;
  SparkplugDevice: ResolverTypeWrapper<SparkplugDevice>;
  SparkplugGroup: ResolverTypeWrapper<SparkplugGroup>;
  SparkplugMetric: ResolverTypeWrapper<SparkplugMetric>;
  SparkplugMetricHistory: ResolverTypeWrapper<SparkplugMetricHistory>;
  SparkplugNode: ResolverTypeWrapper<SparkplugNode>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  UpdateAlarm: UpdateAlarm;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Alarm: Alarm;
  AlarmCondition: AlarmCondition;
  AlarmConditionInput: AlarmConditionInput;
  Boolean: Scalars['Boolean']['output'];
  CreateAlarm: CreateAlarm;
  Date: Scalars['Date']['output'];
  DeleteAlarm: DeleteAlarm;
  Float: Scalars['Float']['output'];
  Int: Scalars['Int']['output'];
  Mutation: {};
  Query: {};
  SparkplugDevice: SparkplugDevice;
  SparkplugGroup: SparkplugGroup;
  SparkplugMetric: SparkplugMetric;
  SparkplugMetricHistory: SparkplugMetricHistory;
  SparkplugNode: SparkplugNode;
  String: Scalars['String']['output'];
  UpdateAlarm: UpdateAlarm;
};

export type AlarmResolvers<ContextType = any, ParentType extends ResolversParentTypes['Alarm'] = ResolversParentTypes['Alarm']> = {
  acknowledged?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  condition?: Resolver<ResolversTypes['AlarmCondition'], ParentType, ContextType>;
  deviceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  groupId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  metricId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nodeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  priority?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AlarmConditionResolvers<ContextType = any, ParentType extends ResolversParentTypes['AlarmCondition'] = ResolversParentTypes['AlarmCondition']> = {
  inclusive?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  inclusiveHigh?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  inclusiveLow?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  mode?: Resolver<ResolversTypes['AlarmConditionMode'], ParentType, ContextType>;
  setpoint?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  setpointHigh?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  setpointLow?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  createAlarm?: Resolver<ResolversTypes['Alarm'], ParentType, ContextType, RequireFields<MutationCreateAlarmArgs, 'input'>>;
  deleteAlarm?: Resolver<ResolversTypes['Alarm'], ParentType, ContextType, RequireFields<MutationDeleteAlarmArgs, 'input'>>;
  publishDeviceCommand?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationPublishDeviceCommandArgs, 'command' | 'deviceId' | 'nodeId'>>;
  publishNodeCommand?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationPublishNodeCommandArgs, 'command' | 'nodeId'>>;
  updateAlarm?: Resolver<ResolversTypes['Alarm'], ParentType, ContextType, RequireFields<MutationUpdateAlarmArgs, 'input'>>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  alarms?: Resolver<Array<ResolversTypes['Alarm']>, ParentType, ContextType>;
  groups?: Resolver<Array<ResolversTypes['SparkplugGroup']>, ParentType, ContextType>;
  info?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type SparkplugDeviceResolvers<ContextType = any, ParentType extends ResolversParentTypes['SparkplugDevice'] = ResolversParentTypes['SparkplugDevice']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  metrics?: Resolver<Array<ResolversTypes['SparkplugMetric']>, ParentType, ContextType>;
  updatedOn?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SparkplugGroupResolvers<ContextType = any, ParentType extends ResolversParentTypes['SparkplugGroup'] = ResolversParentTypes['SparkplugGroup']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nodes?: Resolver<Array<ResolversTypes['SparkplugNode']>, ParentType, ContextType>;
  unbornNodes?: Resolver<Array<ResolversTypes['SparkplugNode']>, ParentType, ContextType>;
  updatedOn?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SparkplugMetricResolvers<ContextType = any, ParentType extends ResolversParentTypes['SparkplugMetric'] = ResolversParentTypes['SparkplugMetric']> = {
  history?: Resolver<Array<ResolversTypes['SparkplugMetricHistory']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updateCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedOn?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SparkplugMetricHistoryResolvers<ContextType = any, ParentType extends ResolversParentTypes['SparkplugMetricHistory'] = ResolversParentTypes['SparkplugMetricHistory']> = {
  timestamp?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SparkplugNodeResolvers<ContextType = any, ParentType extends ResolversParentTypes['SparkplugNode'] = ResolversParentTypes['SparkplugNode']> = {
  devices?: Resolver<Array<ResolversTypes['SparkplugDevice']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  metrics?: Resolver<Array<ResolversTypes['SparkplugMetric']>, ParentType, ContextType>;
  unbornDevices?: Resolver<Array<ResolversTypes['SparkplugDevice']>, ParentType, ContextType>;
  updatedOn?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  Alarm?: AlarmResolvers<ContextType>;
  AlarmCondition?: AlarmConditionResolvers<ContextType>;
  Date?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  SparkplugDevice?: SparkplugDeviceResolvers<ContextType>;
  SparkplugGroup?: SparkplugGroupResolvers<ContextType>;
  SparkplugMetric?: SparkplugMetricResolvers<ContextType>;
  SparkplugMetricHistory?: SparkplugMetricHistoryResolvers<ContextType>;
  SparkplugNode?: SparkplugNodeResolvers<ContextType>;
};

