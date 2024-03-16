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

/** Read/Write queries */
export type Mutation = {
  __typename?: 'Mutation';
  /** Stop the PLC runtime, if running, and the start the PLC with the latest runtime configration. */
  restartPlc?: Maybe<Plc>;
  /** Run the function of a class.Example path for classes: motor1.start where motor1 is the class instance and start is a property of motor1's class. */
  runFunction?: Maybe<Scalars['String']['output']>;
  /**
   * Sets the value of an atomic variable. Can only target a single atomic variable or the property of a class.
   * Example path for classes: motor1.running where motor1 is the class instance and running is a property of motor1's class.
   */
  setValue?: Maybe<AtomicVariable>;
  /** Start the PLC runtime if stopped. */
  startPlc?: Maybe<Plc>;
  /** Stop the PLC runtime. */
  stopPlc?: Maybe<Plc>;
};


/** Read/Write queries */
export type MutationRunFunctionArgs = {
  args?: InputMaybe<Scalars['String']['input']>;
  functionPath: Scalars['String']['input'];
};


/** Read/Write queries */
export type MutationSetValueArgs = {
  value: Scalars['String']['input'];
  variablePath: Scalars['String']['input'];
};

/** PLC status and diagnostics information */
export type Plc = {
  __typename?: 'Plc';
  running: Scalars['Boolean']['output'];
};

/** Read only queries */
export type Query = {
  __typename?: 'Query';
  /** Lists all file changes that have occurred since the last PLC restart */
  changes: Array<Change>;
  /** The current configration */
  configuration: Config;
  /** Information about the Tentacle PLC environment as a string. */
  info: Scalars['String']['output'];
  /** Task diagnostic data */
  metrics: Array<TaskMetric>;
  /** Returns the code for a single program */
  program: Scalars['String']['output'];
  /** Lists all programs */
  programs: Array<Scalars['String']['output']>;
  /** Returns the code for a single class */
  tClass: Scalars['String']['output'];
  /** Lists all classes */
  tClasses: Array<Scalars['String']['output']>;
  /** The PLC status information */
  tPlc: Plc;
  /** Single value of an atomic variable or class property.Example path for classes: motor1.running where motor1 is the class instance and running is a property of motor1's class. */
  value?: Maybe<AtomicVariable>;
  /** Lists all variable and class property values */
  values: Array<AtomicVariable>;
  /** Lists all variables */
  variables: Array<Variable>;
};


/** Read only queries */
export type QueryProgramArgs = {
  name: Scalars['String']['input'];
};


/** Read only queries */
export type QueryTClassArgs = {
  name: Scalars['String']['input'];
};


/** Read only queries */
export type QueryValueArgs = {
  variablePath: Scalars['String']['input'];
};

/** Variable configuration */
export type Variable = {
  __typename?: 'Variable';
  changeEvents?: Maybe<EventTracker>;
  children: Array<Variable>;
  datatype: Scalars['String']['output'];
  decimals?: Maybe<Scalars['Int']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  initialValue?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  persistent?: Maybe<Scalars['Boolean']['output']>;
  source?: Maybe<VariableSource>;
};

/** Variable external source basic configuration */
export type VariableSource = {
  __typename?: 'VariableSource';
  name: Scalars['String']['output'];
  params?: Maybe<VariableSourceParams>;
  rate: Scalars['Int']['output'];
  type: Scalars['String']['output'];
};

/** Variable exertnal source parameters, used to configure the source specific to the protocol used */
export type VariableSourceParams = {
  __typename?: 'VariableSourceParams';
  format?: Maybe<Scalars['String']['output']>;
  register?: Maybe<Scalars['Int']['output']>;
  registerType?: Maybe<Scalars['String']['output']>;
};

/** Atomic Variable type used for String, Numbers, and Booleans */
export type AtomicVariable = {
  __typename?: 'atomicVariable';
  datatype: Scalars['String']['output'];
  path: Scalars['String']['output'];
  value?: Maybe<Scalars['String']['output']>;
};

/** File change type to use for change log (since last runtime update) */
export type Change = {
  __typename?: 'change';
  event: Scalars['String']['output'];
  path: Scalars['String']['output'];
  timestamp: Scalars['Date']['output'];
};

/** Overall Tentacle PLC configration */
export type Config = {
  __typename?: 'config';
  modbus: Array<ConfigModbus>;
  mqtt: Array<ConfigMqtt>;
  opcua: Array<ConfigOpcua>;
  tasks: Array<ConfigTask>;
};

/** Modbus client basic configuration */
export type ConfigModbus = {
  __typename?: 'configModbus';
  config: ConfigModbusConfig;
  description: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

/** Modbus client configuration */
export type ConfigModbusConfig = {
  __typename?: 'configModbusConfig';
  host?: Maybe<Scalars['String']['output']>;
  port?: Maybe<Scalars['Int']['output']>;
  retryRate?: Maybe<Scalars['Int']['output']>;
  reverseBits?: Maybe<Scalars['Boolean']['output']>;
  reverseWords?: Maybe<Scalars['Boolean']['output']>;
  unitId?: Maybe<Scalars['Int']['output']>;
  zeroBased?: Maybe<Scalars['Boolean']['output']>;
};

/** MQTT Client basic configuration */
export type ConfigMqtt = {
  __typename?: 'configMqtt';
  config: ConfigMqttConfig;
  description: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

/** Mqtt client configuration */
export type ConfigMqttConfig = {
  __typename?: 'configMqttConfig';
  clientId?: Maybe<Scalars['String']['output']>;
  deviceName?: Maybe<Scalars['String']['output']>;
  edgeNode?: Maybe<Scalars['String']['output']>;
  groupId?: Maybe<Scalars['String']['output']>;
  password?: Maybe<Scalars['String']['output']>;
  serverUrl?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

/** OPCUA client basic configuration */
export type ConfigOpcua = {
  __typename?: 'configOpcua';
  config: ConfigOpcuaConfig;
  description: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

/** Opcua client configuration */
export type ConfigOpcuaConfig = {
  __typename?: 'configOpcuaConfig';
  host?: Maybe<Scalars['String']['output']>;
  port?: Maybe<Scalars['Int']['output']>;
  retryRate?: Maybe<Scalars['Int']['output']>;
};

/** Task configuration */
export type ConfigTask = {
  __typename?: 'configTask';
  description: Scalars['String']['output'];
  name: Scalars['String']['output'];
  program: Scalars['String']['output'];
  scanRate: Scalars['Int']['output'];
};

/** Event Tracker for counting events */
export type EventTracker = {
  __typename?: 'eventTracker';
  inLastDay: Scalars['Int']['output'];
  inLastHour: Scalars['Int']['output'];
  inLastMinute: Scalars['Int']['output'];
};

/** Task metrics for diagnostic data */
export type TaskMetric = {
  __typename?: 'taskMetric';
  functionExecutionTime: Scalars['Float']['output'];
  intervalExecutionTime: Scalars['Float']['output'];
  task: Scalars['String']['output'];
  totalScanTime: Scalars['Float']['output'];
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
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Date: ResolverTypeWrapper<Scalars['Date']['output']>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  Plc: ResolverTypeWrapper<Plc>;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Variable: ResolverTypeWrapper<Variable>;
  VariableSource: ResolverTypeWrapper<VariableSource>;
  VariableSourceParams: ResolverTypeWrapper<VariableSourceParams>;
  atomicVariable: ResolverTypeWrapper<AtomicVariable>;
  change: ResolverTypeWrapper<Change>;
  config: ResolverTypeWrapper<Config>;
  configModbus: ResolverTypeWrapper<ConfigModbus>;
  configModbusConfig: ResolverTypeWrapper<ConfigModbusConfig>;
  configMqtt: ResolverTypeWrapper<ConfigMqtt>;
  configMqttConfig: ResolverTypeWrapper<ConfigMqttConfig>;
  configOpcua: ResolverTypeWrapper<ConfigOpcua>;
  configOpcuaConfig: ResolverTypeWrapper<ConfigOpcuaConfig>;
  configTask: ResolverTypeWrapper<ConfigTask>;
  eventTracker: ResolverTypeWrapper<EventTracker>;
  taskMetric: ResolverTypeWrapper<TaskMetric>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean']['output'];
  Date: Scalars['Date']['output'];
  Float: Scalars['Float']['output'];
  Int: Scalars['Int']['output'];
  Mutation: {};
  Plc: Plc;
  Query: {};
  String: Scalars['String']['output'];
  Variable: Variable;
  VariableSource: VariableSource;
  VariableSourceParams: VariableSourceParams;
  atomicVariable: AtomicVariable;
  change: Change;
  config: Config;
  configModbus: ConfigModbus;
  configModbusConfig: ConfigModbusConfig;
  configMqtt: ConfigMqtt;
  configMqttConfig: ConfigMqttConfig;
  configOpcua: ConfigOpcua;
  configOpcuaConfig: ConfigOpcuaConfig;
  configTask: ConfigTask;
  eventTracker: EventTracker;
  taskMetric: TaskMetric;
};

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  restartPlc?: Resolver<Maybe<ResolversTypes['Plc']>, ParentType, ContextType>;
  runFunction?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationRunFunctionArgs, 'functionPath'>>;
  setValue?: Resolver<Maybe<ResolversTypes['atomicVariable']>, ParentType, ContextType, RequireFields<MutationSetValueArgs, 'value' | 'variablePath'>>;
  startPlc?: Resolver<Maybe<ResolversTypes['Plc']>, ParentType, ContextType>;
  stopPlc?: Resolver<Maybe<ResolversTypes['Plc']>, ParentType, ContextType>;
};

export type PlcResolvers<ContextType = any, ParentType extends ResolversParentTypes['Plc'] = ResolversParentTypes['Plc']> = {
  running?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  changes?: Resolver<Array<ResolversTypes['change']>, ParentType, ContextType>;
  configuration?: Resolver<ResolversTypes['config'], ParentType, ContextType>;
  info?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  metrics?: Resolver<Array<ResolversTypes['taskMetric']>, ParentType, ContextType>;
  program?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<QueryProgramArgs, 'name'>>;
  programs?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  tClass?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<QueryTClassArgs, 'name'>>;
  tClasses?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  tPlc?: Resolver<ResolversTypes['Plc'], ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['atomicVariable']>, ParentType, ContextType, RequireFields<QueryValueArgs, 'variablePath'>>;
  values?: Resolver<Array<ResolversTypes['atomicVariable']>, ParentType, ContextType>;
  variables?: Resolver<Array<ResolversTypes['Variable']>, ParentType, ContextType>;
};

export type VariableResolvers<ContextType = any, ParentType extends ResolversParentTypes['Variable'] = ResolversParentTypes['Variable']> = {
  changeEvents?: Resolver<Maybe<ResolversTypes['eventTracker']>, ParentType, ContextType>;
  children?: Resolver<Array<ResolversTypes['Variable']>, ParentType, ContextType>;
  datatype?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  decimals?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  initialValue?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  persistent?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  source?: Resolver<Maybe<ResolversTypes['VariableSource']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type VariableSourceResolvers<ContextType = any, ParentType extends ResolversParentTypes['VariableSource'] = ResolversParentTypes['VariableSource']> = {
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  params?: Resolver<Maybe<ResolversTypes['VariableSourceParams']>, ParentType, ContextType>;
  rate?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type VariableSourceParamsResolvers<ContextType = any, ParentType extends ResolversParentTypes['VariableSourceParams'] = ResolversParentTypes['VariableSourceParams']> = {
  format?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  register?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  registerType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AtomicVariableResolvers<ContextType = any, ParentType extends ResolversParentTypes['atomicVariable'] = ResolversParentTypes['atomicVariable']> = {
  datatype?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ChangeResolvers<ContextType = any, ParentType extends ResolversParentTypes['change'] = ResolversParentTypes['change']> = {
  event?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['config'] = ResolversParentTypes['config']> = {
  modbus?: Resolver<Array<ResolversTypes['configModbus']>, ParentType, ContextType>;
  mqtt?: Resolver<Array<ResolversTypes['configMqtt']>, ParentType, ContextType>;
  opcua?: Resolver<Array<ResolversTypes['configOpcua']>, ParentType, ContextType>;
  tasks?: Resolver<Array<ResolversTypes['configTask']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConfigModbusResolvers<ContextType = any, ParentType extends ResolversParentTypes['configModbus'] = ResolversParentTypes['configModbus']> = {
  config?: Resolver<ResolversTypes['configModbusConfig'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConfigModbusConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['configModbusConfig'] = ResolversParentTypes['configModbusConfig']> = {
  host?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  port?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  retryRate?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  reverseBits?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  reverseWords?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  unitId?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  zeroBased?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConfigMqttResolvers<ContextType = any, ParentType extends ResolversParentTypes['configMqtt'] = ResolversParentTypes['configMqtt']> = {
  config?: Resolver<ResolversTypes['configMqttConfig'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConfigMqttConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['configMqttConfig'] = ResolversParentTypes['configMqttConfig']> = {
  clientId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  deviceName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  edgeNode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  groupId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  password?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  serverUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  username?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConfigOpcuaResolvers<ContextType = any, ParentType extends ResolversParentTypes['configOpcua'] = ResolversParentTypes['configOpcua']> = {
  config?: Resolver<ResolversTypes['configOpcuaConfig'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConfigOpcuaConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['configOpcuaConfig'] = ResolversParentTypes['configOpcuaConfig']> = {
  host?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  port?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  retryRate?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConfigTaskResolvers<ContextType = any, ParentType extends ResolversParentTypes['configTask'] = ResolversParentTypes['configTask']> = {
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  program?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  scanRate?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EventTrackerResolvers<ContextType = any, ParentType extends ResolversParentTypes['eventTracker'] = ResolversParentTypes['eventTracker']> = {
  inLastDay?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  inLastHour?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  inLastMinute?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TaskMetricResolvers<ContextType = any, ParentType extends ResolversParentTypes['taskMetric'] = ResolversParentTypes['taskMetric']> = {
  functionExecutionTime?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  intervalExecutionTime?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  task?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalScanTime?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  Date?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  Plc?: PlcResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Variable?: VariableResolvers<ContextType>;
  VariableSource?: VariableSourceResolvers<ContextType>;
  VariableSourceParams?: VariableSourceParamsResolvers<ContextType>;
  atomicVariable?: AtomicVariableResolvers<ContextType>;
  change?: ChangeResolvers<ContextType>;
  config?: ConfigResolvers<ContextType>;
  configModbus?: ConfigModbusResolvers<ContextType>;
  configModbusConfig?: ConfigModbusConfigResolvers<ContextType>;
  configMqtt?: ConfigMqttResolvers<ContextType>;
  configMqttConfig?: ConfigMqttConfigResolvers<ContextType>;
  configOpcua?: ConfigOpcuaResolvers<ContextType>;
  configOpcuaConfig?: ConfigOpcuaConfigResolvers<ContextType>;
  configTask?: ConfigTaskResolvers<ContextType>;
  eventTracker?: EventTrackerResolvers<ContextType>;
  taskMetric?: TaskMetricResolvers<ContextType>;
};

