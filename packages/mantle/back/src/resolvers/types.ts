import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
	[K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
	[SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
	[SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
	[_ in K]?: never;
};
export type Incremental<T> =
	| T
	| {
			[P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
	  };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & {
	[P in K]-?: NonNullable<T[P]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: { input: string; output: string };
	String: { input: string; output: string };
	Boolean: { input: boolean; output: boolean };
	Int: { input: number; output: number };
	Float: { input: number; output: number };
	Date: { input: any; output: any };
};

export type Alarm = {
	__typename?: 'Alarm';
	acknowledged: Scalars['Boolean']['output'];
	active: Scalars['Boolean']['output'];
	condition: AlarmCondition;
	deviceId?: Maybe<Scalars['String']['output']>;
	enabled: Scalars['Boolean']['output'];
	groupId: Scalars['String']['output'];
	id: Scalars['String']['output'];
	metricId: Scalars['String']['output'];
	name: Scalars['String']['output'];
	nodeId: Scalars['String']['output'];
	priority: AlarmPriority;
	roster?: Maybe<Roster>;
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

export enum AlarmPriority {
	Critical = 'CRITICAL',
	High = 'HIGH',
	Low = 'LOW',
	Medium = 'MEDIUM'
}

export type Axis = {
	__typename?: 'Axis';
	autoRange: Scalars['Boolean']['output'];
	max?: Maybe<Scalars['Float']['output']>;
	min?: Maybe<Scalars['Float']['output']>;
};

export type AxisEntry = {
	autoRange: Scalars['Boolean']['input'];
	max?: InputMaybe<Scalars['Float']['input']>;
	min?: InputMaybe<Scalars['Float']['input']>;
};

export type Chart = {
	__typename?: 'Chart';
	id: Scalars['String']['output'];
	pens: Array<Pen>;
	title: Scalars['String']['output'];
	x: Axis;
	y: Axis;
};

export type ChartPage = {
	__typename?: 'ChartPage';
	charts: Array<Chart>;
	description?: Maybe<Scalars['String']['output']>;
	id: Scalars['String']['output'];
	name?: Maybe<Scalars['String']['output']>;
};

export type CreateAlarm = {
	condition: AlarmConditionInput;
	deviceId?: InputMaybe<Scalars['String']['input']>;
	enabled: Scalars['Boolean']['input'];
	groupId: Scalars['String']['input'];
	metricId: Scalars['String']['input'];
	name: Scalars['String']['input'];
	nodeId: Scalars['String']['input'];
	priority: AlarmPriority;
	rosterId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateChartEntry = {
	chartPageId: Scalars['String']['input'];
	pens?: InputMaybe<Array<CreatePenEntry>>;
	title: Scalars['String']['input'];
	x: AxisEntry;
	y: AxisEntry;
};

export type CreateChartPageEntry = {
	description?: InputMaybe<Scalars['String']['input']>;
	name: Scalars['String']['input'];
};

export type CreateChartPenEntry = {
	color: Scalars['String']['input'];
	deviceId?: InputMaybe<Scalars['String']['input']>;
	groupId: Scalars['String']['input'];
	metricId: Scalars['String']['input'];
	nodeId: Scalars['String']['input'];
};

export type CreatePenEntry = {
	chartId: Scalars['String']['input'];
	color: Scalars['String']['input'];
	deviceId: Scalars['String']['input'];
	groupId: Scalars['String']['input'];
	metricId: Scalars['String']['input'];
	nodeId: Scalars['String']['input'];
};

export type CreateRoster = {
	enabled: Scalars['Boolean']['input'];
	name: Scalars['String']['input'];
	retries: Scalars['Int']['input'];
	timeBetweenRetries: Scalars['Int']['input'];
};

export type CreateRosterEntry = {
	email: Scalars['Boolean']['input'];
	phone: Scalars['Boolean']['input'];
	rosterId: Scalars['String']['input'];
	sms: Scalars['Boolean']['input'];
	userId: Scalars['String']['input'];
};

export type CreateUser = {
	email?: InputMaybe<Scalars['String']['input']>;
	id?: InputMaybe<Scalars['String']['input']>;
	name: Scalars['String']['input'];
	phone?: InputMaybe<Scalars['String']['input']>;
};

export type DeleteAlarm = {
	id: Scalars['String']['input'];
};

export type DeleteChartEntry = {
	id: Scalars['String']['input'];
};

export type DeleteChartPageEntry = {
	id: Scalars['String']['input'];
};

export type DeletePenEntry = {
	id: Scalars['String']['input'];
};

export type DeleteRoster = {
	id: Scalars['String']['input'];
};

export type DeleteRosterEntry = {
	id: Scalars['String']['input'];
};

export type DeleteUser = {
	id: Scalars['String']['input'];
};

export type History = {
	__typename?: 'History';
	deviceId: Scalars['String']['output'];
	groupId: Scalars['String']['output'];
	history: Array<SparkplugMetricHistory>;
	metricId: Scalars['String']['output'];
	nodeId: Scalars['String']['output'];
};

export type HistoryEntry = {
	end: Scalars['Date']['input'];
	interval?: InputMaybe<Scalars['String']['input']>;
	metrics: Array<MetricHistoryEntry>;
	raw?: InputMaybe<Scalars['Boolean']['input']>;
	samples?: InputMaybe<Scalars['Int']['input']>;
	start: Scalars['Date']['input'];
};

export type MetricHistoryEntry = {
	deviceId: Scalars['String']['input'];
	groupId: Scalars['String']['input'];
	metricId: Scalars['String']['input'];
	nodeId: Scalars['String']['input'];
};

export type MoveDownRosterEntry = {
	id: Scalars['String']['input'];
};

export type MoveUpRosterEntry = {
	id: Scalars['String']['input'];
};

/** Read and write queries */
export type Mutation = {
	__typename?: 'Mutation';
	acknowledgeAlarm: Alarm;
	acknowledgeRoster: Roster;
	createAlarm: Alarm;
	createChart: Chart;
	createChartPage: ChartPage;
	createPen: Pen;
	createRoster: Roster;
	createRosterEntry: RosterEntry;
	createUser: User;
	deleteAlarm: Alarm;
	deleteChart: Chart;
	deleteChartPage: ChartPage;
	deletePen: Pen;
	deleteRoster: Roster;
	deleteRosterEntry: RosterEntry;
	deleteUser: User;
	moveDownRosterEntry: RosterEntry;
	moveUpRosterEntry: RosterEntry;
	sendDeviceCommand: Scalars['Boolean']['output'];
	sendNodeCommand: Scalars['Boolean']['output'];
	updateAlarm: Alarm;
	updateChart: Chart;
	updateChartPage: ChartPage;
	updatePen: Pen;
	updateRoster: Roster;
	updateRosterEntry: RosterEntry;
	updateUser: User;
};

/** Read and write queries */
export type MutationAcknowledgeAlarmArgs = {
	id: Scalars['String']['input'];
};

/** Read and write queries */
export type MutationAcknowledgeRosterArgs = {
	id: Scalars['String']['input'];
};

/** Read and write queries */
export type MutationCreateAlarmArgs = {
	input: CreateAlarm;
};

/** Read and write queries */
export type MutationCreateChartArgs = {
	input: CreateChartEntry;
};

/** Read and write queries */
export type MutationCreateChartPageArgs = {
	input: CreateChartPageEntry;
};

/** Read and write queries */
export type MutationCreatePenArgs = {
	input: CreatePenEntry;
};

/** Read and write queries */
export type MutationCreateRosterArgs = {
	input: CreateRoster;
};

/** Read and write queries */
export type MutationCreateRosterEntryArgs = {
	input: CreateRosterEntry;
};

/** Read and write queries */
export type MutationCreateUserArgs = {
	input: CreateUser;
};

/** Read and write queries */
export type MutationDeleteAlarmArgs = {
	input: DeleteAlarm;
};

/** Read and write queries */
export type MutationDeleteChartArgs = {
	input: DeleteChartEntry;
};

/** Read and write queries */
export type MutationDeleteChartPageArgs = {
	input: DeleteChartPageEntry;
};

/** Read and write queries */
export type MutationDeletePenArgs = {
	input: DeletePenEntry;
};

/** Read and write queries */
export type MutationDeleteRosterArgs = {
	input: DeleteRoster;
};

/** Read and write queries */
export type MutationDeleteRosterEntryArgs = {
	input: DeleteRosterEntry;
};

/** Read and write queries */
export type MutationDeleteUserArgs = {
	input: DeleteUser;
};

/** Read and write queries */
export type MutationMoveDownRosterEntryArgs = {
	input: MoveDownRosterEntry;
};

/** Read and write queries */
export type MutationMoveUpRosterEntryArgs = {
	input: MoveUpRosterEntry;
};

/** Read and write queries */
export type MutationSendDeviceCommandArgs = {
	command: Scalars['String']['input'];
	deviceId: Scalars['String']['input'];
	groupId: Scalars['String']['input'];
	nodeId: Scalars['String']['input'];
	value: Scalars['String']['input'];
};

/** Read and write queries */
export type MutationSendNodeCommandArgs = {
	command: Scalars['String']['input'];
	groupId: Scalars['String']['input'];
	nodeId: Scalars['String']['input'];
	value: Scalars['String']['input'];
};

/** Read and write queries */
export type MutationUpdateAlarmArgs = {
	input: UpdateAlarm;
};

/** Read and write queries */
export type MutationUpdateChartArgs = {
	input: UpdateChartEntry;
};

/** Read and write queries */
export type MutationUpdateChartPageArgs = {
	input: UpdateChartPageEntry;
};

/** Read and write queries */
export type MutationUpdatePenArgs = {
	input: UpdatePenEntry;
};

/** Read and write queries */
export type MutationUpdateRosterArgs = {
	input: UpdateRoster;
};

/** Read and write queries */
export type MutationUpdateRosterEntryArgs = {
	input: UpdateRosterEntry;
};

/** Read and write queries */
export type MutationUpdateUserArgs = {
	input: UpdateUser;
};

export type Pen = {
	__typename?: 'Pen';
	chartId?: Maybe<Scalars['String']['output']>;
	color?: Maybe<Scalars['String']['output']>;
	deviceId?: Maybe<Scalars['String']['output']>;
	groupId?: Maybe<Scalars['String']['output']>;
	id: Scalars['String']['output'];
	metricId?: Maybe<Scalars['String']['output']>;
	nodeId?: Maybe<Scalars['String']['output']>;
};

/** Read only queries */
export type Query = {
	__typename?: 'Query';
	alarms: Array<Alarm>;
	chartPages: Array<ChartPage>;
	groups: Array<SparkplugGroup>;
	history: Array<History>;
	info: Scalars['String']['output'];
	rawHistory: Array<SparkplugMetricHistory>;
	rosters: Array<Roster>;
	users: Array<User>;
};

/** Read only queries */
export type QueryGroupsArgs = {
	historyDuration?: InputMaybe<Scalars['Int']['input']>;
};

/** Read only queries */
export type QueryHistoryArgs = {
	input: HistoryEntry;
};

/** Read only queries */
export type QueryRawHistoryArgs = {
	input: HistoryEntry;
};

export type Roster = {
	__typename?: 'Roster';
	alarms: Array<Alarm>;
	enabled?: Maybe<Scalars['Boolean']['output']>;
	id?: Maybe<Scalars['String']['output']>;
	name?: Maybe<Scalars['String']['output']>;
	retired?: Maybe<Scalars['Boolean']['output']>;
	retries?: Maybe<Scalars['Int']['output']>;
	timeBetweenRetries?: Maybe<Scalars['Int']['output']>;
	users: Array<RosterEntry>;
};

export type RosterEntry = {
	__typename?: 'RosterEntry';
	email?: Maybe<Scalars['Boolean']['output']>;
	id?: Maybe<Scalars['String']['output']>;
	order?: Maybe<Scalars['Int']['output']>;
	phone?: Maybe<Scalars['Boolean']['output']>;
	roster?: Maybe<Roster>;
	rosterId?: Maybe<Scalars['String']['output']>;
	sms?: Maybe<Scalars['Boolean']['output']>;
	user?: Maybe<User>;
	userId?: Maybe<Scalars['String']['output']>;
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
	priority?: InputMaybe<AlarmPriority>;
	rosterId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateChartEntry = {
	id: Scalars['String']['input'];
	pens?: InputMaybe<Array<CreatePenEntry>>;
	title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateChartPageEntry = {
	description?: InputMaybe<Scalars['String']['input']>;
	id: Scalars['String']['input'];
	name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePenEntry = {
	color?: InputMaybe<Scalars['String']['input']>;
	deviceId?: InputMaybe<Scalars['String']['input']>;
	groupId?: InputMaybe<Scalars['String']['input']>;
	id: Scalars['String']['input'];
	metricId?: InputMaybe<Scalars['String']['input']>;
	nodeId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateRoster = {
	enabled?: InputMaybe<Scalars['Boolean']['input']>;
	id: Scalars['String']['input'];
	name?: InputMaybe<Scalars['String']['input']>;
	retries?: InputMaybe<Scalars['Int']['input']>;
	timeBetweenRetries?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateRosterEntry = {
	email?: InputMaybe<Scalars['Boolean']['input']>;
	id: Scalars['String']['input'];
	phone?: InputMaybe<Scalars['Boolean']['input']>;
	sms?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateUser = {
	email?: InputMaybe<Scalars['String']['input']>;
	id: Scalars['String']['input'];
	name?: InputMaybe<Scalars['String']['input']>;
	phone?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
	__typename?: 'User';
	RosterEntry?: Maybe<Array<RosterEntry>>;
	email?: Maybe<Scalars['String']['output']>;
	id?: Maybe<Scalars['String']['output']>;
	name?: Maybe<Scalars['String']['output']>;
	phone?: Maybe<Scalars['String']['output']>;
};

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
	resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
	| ResolverFn<TResult, TParent, TContext, TArgs>
	| ResolverWithResolve<TResult, TParent, TContext, TArgs>;

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

export type SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> = {
	subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
	resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
};

export type SubscriptionResolverObject<TResult, TParent, TContext, TArgs> = {
	subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
	resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
};

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
	| SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
	| SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
	TResult,
	TKey extends string,
	TParent = {},
	TContext = {},
	TArgs = {}
> =
	| ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
	| SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
	parent: TParent,
	context: TContext,
	info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
	obj: T,
	context: TContext,
	info: GraphQLResolveInfo
) => boolean | Promise<boolean>;

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
	AlarmPriority: AlarmPriority;
	Axis: ResolverTypeWrapper<Axis>;
	AxisEntry: AxisEntry;
	Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
	Chart: ResolverTypeWrapper<Chart>;
	ChartPage: ResolverTypeWrapper<ChartPage>;
	CreateAlarm: CreateAlarm;
	CreateChartEntry: CreateChartEntry;
	CreateChartPageEntry: CreateChartPageEntry;
	CreateChartPenEntry: CreateChartPenEntry;
	CreatePenEntry: CreatePenEntry;
	CreateRoster: CreateRoster;
	CreateRosterEntry: CreateRosterEntry;
	CreateUser: CreateUser;
	Date: ResolverTypeWrapper<Scalars['Date']['output']>;
	DeleteAlarm: DeleteAlarm;
	DeleteChartEntry: DeleteChartEntry;
	DeleteChartPageEntry: DeleteChartPageEntry;
	DeletePenEntry: DeletePenEntry;
	DeleteRoster: DeleteRoster;
	DeleteRosterEntry: DeleteRosterEntry;
	DeleteUser: DeleteUser;
	Float: ResolverTypeWrapper<Scalars['Float']['output']>;
	History: ResolverTypeWrapper<History>;
	HistoryEntry: HistoryEntry;
	Int: ResolverTypeWrapper<Scalars['Int']['output']>;
	MetricHistoryEntry: MetricHistoryEntry;
	MoveDownRosterEntry: MoveDownRosterEntry;
	MoveUpRosterEntry: MoveUpRosterEntry;
	Mutation: ResolverTypeWrapper<{}>;
	Pen: ResolverTypeWrapper<Pen>;
	Query: ResolverTypeWrapper<{}>;
	Roster: ResolverTypeWrapper<Roster>;
	RosterEntry: ResolverTypeWrapper<RosterEntry>;
	SparkplugDevice: ResolverTypeWrapper<SparkplugDevice>;
	SparkplugGroup: ResolverTypeWrapper<SparkplugGroup>;
	SparkplugMetric: ResolverTypeWrapper<SparkplugMetric>;
	SparkplugMetricHistory: ResolverTypeWrapper<SparkplugMetricHistory>;
	SparkplugNode: ResolverTypeWrapper<SparkplugNode>;
	String: ResolverTypeWrapper<Scalars['String']['output']>;
	UpdateAlarm: UpdateAlarm;
	UpdateChartEntry: UpdateChartEntry;
	UpdateChartPageEntry: UpdateChartPageEntry;
	UpdatePenEntry: UpdatePenEntry;
	UpdateRoster: UpdateRoster;
	UpdateRosterEntry: UpdateRosterEntry;
	UpdateUser: UpdateUser;
	User: ResolverTypeWrapper<User>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
	Alarm: Alarm;
	AlarmCondition: AlarmCondition;
	AlarmConditionInput: AlarmConditionInput;
	Axis: Axis;
	AxisEntry: AxisEntry;
	Boolean: Scalars['Boolean']['output'];
	Chart: Chart;
	ChartPage: ChartPage;
	CreateAlarm: CreateAlarm;
	CreateChartEntry: CreateChartEntry;
	CreateChartPageEntry: CreateChartPageEntry;
	CreateChartPenEntry: CreateChartPenEntry;
	CreatePenEntry: CreatePenEntry;
	CreateRoster: CreateRoster;
	CreateRosterEntry: CreateRosterEntry;
	CreateUser: CreateUser;
	Date: Scalars['Date']['output'];
	DeleteAlarm: DeleteAlarm;
	DeleteChartEntry: DeleteChartEntry;
	DeleteChartPageEntry: DeleteChartPageEntry;
	DeletePenEntry: DeletePenEntry;
	DeleteRoster: DeleteRoster;
	DeleteRosterEntry: DeleteRosterEntry;
	DeleteUser: DeleteUser;
	Float: Scalars['Float']['output'];
	History: History;
	HistoryEntry: HistoryEntry;
	Int: Scalars['Int']['output'];
	MetricHistoryEntry: MetricHistoryEntry;
	MoveDownRosterEntry: MoveDownRosterEntry;
	MoveUpRosterEntry: MoveUpRosterEntry;
	Mutation: {};
	Pen: Pen;
	Query: {};
	Roster: Roster;
	RosterEntry: RosterEntry;
	SparkplugDevice: SparkplugDevice;
	SparkplugGroup: SparkplugGroup;
	SparkplugMetric: SparkplugMetric;
	SparkplugMetricHistory: SparkplugMetricHistory;
	SparkplugNode: SparkplugNode;
	String: Scalars['String']['output'];
	UpdateAlarm: UpdateAlarm;
	UpdateChartEntry: UpdateChartEntry;
	UpdateChartPageEntry: UpdateChartPageEntry;
	UpdatePenEntry: UpdatePenEntry;
	UpdateRoster: UpdateRoster;
	UpdateRosterEntry: UpdateRosterEntry;
	UpdateUser: UpdateUser;
	User: User;
};

export type AlarmResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Alarm'] = ResolversParentTypes['Alarm']
> = {
	acknowledged?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
	active?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
	condition?: Resolver<ResolversTypes['AlarmCondition'], ParentType, ContextType>;
	deviceId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
	groupId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	metricId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	nodeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	priority?: Resolver<ResolversTypes['AlarmPriority'], ParentType, ContextType>;
	roster?: Resolver<Maybe<ResolversTypes['Roster']>, ParentType, ContextType>;
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AlarmConditionResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['AlarmCondition'] = ResolversParentTypes['AlarmCondition']
> = {
	inclusive?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
	inclusiveHigh?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
	inclusiveLow?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
	mode?: Resolver<ResolversTypes['AlarmConditionMode'], ParentType, ContextType>;
	setpoint?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
	setpointHigh?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
	setpointLow?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AxisResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Axis'] = ResolversParentTypes['Axis']
> = {
	autoRange?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
	max?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
	min?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ChartResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Chart'] = ResolversParentTypes['Chart']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	pens?: Resolver<Array<ResolversTypes['Pen']>, ParentType, ContextType>;
	title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	x?: Resolver<ResolversTypes['Axis'], ParentType, ContextType>;
	y?: Resolver<ResolversTypes['Axis'], ParentType, ContextType>;
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ChartPageResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ChartPage'] = ResolversParentTypes['ChartPage']
> = {
	charts?: Resolver<Array<ResolversTypes['Chart']>, ParentType, ContextType>;
	description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DateScalarConfig = {
	name: 'Date';
} & GraphQLScalarTypeConfig<ResolversTypes['Date'], any>;

export type HistoryResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['History'] = ResolversParentTypes['History']
> = {
	deviceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	groupId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	history?: Resolver<Array<ResolversTypes['SparkplugMetricHistory']>, ParentType, ContextType>;
	metricId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	nodeId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']
> = {
	acknowledgeAlarm?: Resolver<
		ResolversTypes['Alarm'],
		ParentType,
		ContextType,
		RequireFields<MutationAcknowledgeAlarmArgs, 'id'>
	>;
	acknowledgeRoster?: Resolver<
		ResolversTypes['Roster'],
		ParentType,
		ContextType,
		RequireFields<MutationAcknowledgeRosterArgs, 'id'>
	>;
	createAlarm?: Resolver<
		ResolversTypes['Alarm'],
		ParentType,
		ContextType,
		RequireFields<MutationCreateAlarmArgs, 'input'>
	>;
	createChart?: Resolver<
		ResolversTypes['Chart'],
		ParentType,
		ContextType,
		RequireFields<MutationCreateChartArgs, 'input'>
	>;
	createChartPage?: Resolver<
		ResolversTypes['ChartPage'],
		ParentType,
		ContextType,
		RequireFields<MutationCreateChartPageArgs, 'input'>
	>;
	createPen?: Resolver<
		ResolversTypes['Pen'],
		ParentType,
		ContextType,
		RequireFields<MutationCreatePenArgs, 'input'>
	>;
	createRoster?: Resolver<
		ResolversTypes['Roster'],
		ParentType,
		ContextType,
		RequireFields<MutationCreateRosterArgs, 'input'>
	>;
	createRosterEntry?: Resolver<
		ResolversTypes['RosterEntry'],
		ParentType,
		ContextType,
		RequireFields<MutationCreateRosterEntryArgs, 'input'>
	>;
	createUser?: Resolver<
		ResolversTypes['User'],
		ParentType,
		ContextType,
		RequireFields<MutationCreateUserArgs, 'input'>
	>;
	deleteAlarm?: Resolver<
		ResolversTypes['Alarm'],
		ParentType,
		ContextType,
		RequireFields<MutationDeleteAlarmArgs, 'input'>
	>;
	deleteChart?: Resolver<
		ResolversTypes['Chart'],
		ParentType,
		ContextType,
		RequireFields<MutationDeleteChartArgs, 'input'>
	>;
	deleteChartPage?: Resolver<
		ResolversTypes['ChartPage'],
		ParentType,
		ContextType,
		RequireFields<MutationDeleteChartPageArgs, 'input'>
	>;
	deletePen?: Resolver<
		ResolversTypes['Pen'],
		ParentType,
		ContextType,
		RequireFields<MutationDeletePenArgs, 'input'>
	>;
	deleteRoster?: Resolver<
		ResolversTypes['Roster'],
		ParentType,
		ContextType,
		RequireFields<MutationDeleteRosterArgs, 'input'>
	>;
	deleteRosterEntry?: Resolver<
		ResolversTypes['RosterEntry'],
		ParentType,
		ContextType,
		RequireFields<MutationDeleteRosterEntryArgs, 'input'>
	>;
	deleteUser?: Resolver<
		ResolversTypes['User'],
		ParentType,
		ContextType,
		RequireFields<MutationDeleteUserArgs, 'input'>
	>;
	moveDownRosterEntry?: Resolver<
		ResolversTypes['RosterEntry'],
		ParentType,
		ContextType,
		RequireFields<MutationMoveDownRosterEntryArgs, 'input'>
	>;
	moveUpRosterEntry?: Resolver<
		ResolversTypes['RosterEntry'],
		ParentType,
		ContextType,
		RequireFields<MutationMoveUpRosterEntryArgs, 'input'>
	>;
	sendDeviceCommand?: Resolver<
		ResolversTypes['Boolean'],
		ParentType,
		ContextType,
		RequireFields<
			MutationSendDeviceCommandArgs,
			'command' | 'deviceId' | 'groupId' | 'nodeId' | 'value'
		>
	>;
	sendNodeCommand?: Resolver<
		ResolversTypes['Boolean'],
		ParentType,
		ContextType,
		RequireFields<MutationSendNodeCommandArgs, 'command' | 'groupId' | 'nodeId' | 'value'>
	>;
	updateAlarm?: Resolver<
		ResolversTypes['Alarm'],
		ParentType,
		ContextType,
		RequireFields<MutationUpdateAlarmArgs, 'input'>
	>;
	updateChart?: Resolver<
		ResolversTypes['Chart'],
		ParentType,
		ContextType,
		RequireFields<MutationUpdateChartArgs, 'input'>
	>;
	updateChartPage?: Resolver<
		ResolversTypes['ChartPage'],
		ParentType,
		ContextType,
		RequireFields<MutationUpdateChartPageArgs, 'input'>
	>;
	updatePen?: Resolver<
		ResolversTypes['Pen'],
		ParentType,
		ContextType,
		RequireFields<MutationUpdatePenArgs, 'input'>
	>;
	updateRoster?: Resolver<
		ResolversTypes['Roster'],
		ParentType,
		ContextType,
		RequireFields<MutationUpdateRosterArgs, 'input'>
	>;
	updateRosterEntry?: Resolver<
		ResolversTypes['RosterEntry'],
		ParentType,
		ContextType,
		RequireFields<MutationUpdateRosterEntryArgs, 'input'>
	>;
	updateUser?: Resolver<
		ResolversTypes['User'],
		ParentType,
		ContextType,
		RequireFields<MutationUpdateUserArgs, 'input'>
	>;
};

export type PenResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Pen'] = ResolversParentTypes['Pen']
> = {
	chartId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	color?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	deviceId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	groupId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	metricId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	nodeId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']
> = {
	alarms?: Resolver<Array<ResolversTypes['Alarm']>, ParentType, ContextType>;
	chartPages?: Resolver<Array<ResolversTypes['ChartPage']>, ParentType, ContextType>;
	groups?: Resolver<
		Array<ResolversTypes['SparkplugGroup']>,
		ParentType,
		ContextType,
		Partial<QueryGroupsArgs>
	>;
	history?: Resolver<
		Array<ResolversTypes['History']>,
		ParentType,
		ContextType,
		RequireFields<QueryHistoryArgs, 'input'>
	>;
	info?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	rawHistory?: Resolver<
		Array<ResolversTypes['SparkplugMetricHistory']>,
		ParentType,
		ContextType,
		RequireFields<QueryRawHistoryArgs, 'input'>
	>;
	rosters?: Resolver<Array<ResolversTypes['Roster']>, ParentType, ContextType>;
	users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
};

export type RosterResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['Roster'] = ResolversParentTypes['Roster']
> = {
	alarms?: Resolver<Array<ResolversTypes['Alarm']>, ParentType, ContextType>;
	enabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
	id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	retired?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
	retries?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
	timeBetweenRetries?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
	users?: Resolver<Array<ResolversTypes['RosterEntry']>, ParentType, ContextType>;
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RosterEntryResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RosterEntry'] = ResolversParentTypes['RosterEntry']
> = {
	email?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
	id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	order?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
	phone?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
	roster?: Resolver<Maybe<ResolversTypes['Roster']>, ParentType, ContextType>;
	rosterId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	sms?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
	user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
	userId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SparkplugDeviceResolvers<
	ContextType = any,
	ParentType extends
		ResolversParentTypes['SparkplugDevice'] = ResolversParentTypes['SparkplugDevice']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	metrics?: Resolver<Array<ResolversTypes['SparkplugMetric']>, ParentType, ContextType>;
	updatedOn?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SparkplugGroupResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SparkplugGroup'] = ResolversParentTypes['SparkplugGroup']
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	nodes?: Resolver<Array<ResolversTypes['SparkplugNode']>, ParentType, ContextType>;
	unbornNodes?: Resolver<Array<ResolversTypes['SparkplugNode']>, ParentType, ContextType>;
	updatedOn?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SparkplugMetricResolvers<
	ContextType = any,
	ParentType extends
		ResolversParentTypes['SparkplugMetric'] = ResolversParentTypes['SparkplugMetric']
> = {
	history?: Resolver<Array<ResolversTypes['SparkplugMetricHistory']>, ParentType, ContextType>;
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	updateCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
	updatedOn?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
	value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SparkplugMetricHistoryResolvers<
	ContextType = any,
	ParentType extends
		ResolversParentTypes['SparkplugMetricHistory'] = ResolversParentTypes['SparkplugMetricHistory']
> = {
	timestamp?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
	value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SparkplugNodeResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SparkplugNode'] = ResolversParentTypes['SparkplugNode']
> = {
	devices?: Resolver<Array<ResolversTypes['SparkplugDevice']>, ParentType, ContextType>;
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
	metrics?: Resolver<Array<ResolversTypes['SparkplugMetric']>, ParentType, ContextType>;
	unbornDevices?: Resolver<Array<ResolversTypes['SparkplugDevice']>, ParentType, ContextType>;
	updatedOn?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']
> = {
	RosterEntry?: Resolver<Maybe<Array<ResolversTypes['RosterEntry']>>, ParentType, ContextType>;
	email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
	Alarm?: AlarmResolvers<ContextType>;
	AlarmCondition?: AlarmConditionResolvers<ContextType>;
	Axis?: AxisResolvers<ContextType>;
	Chart?: ChartResolvers<ContextType>;
	ChartPage?: ChartPageResolvers<ContextType>;
	Date?: GraphQLScalarType;
	History?: HistoryResolvers<ContextType>;
	Mutation?: MutationResolvers<ContextType>;
	Pen?: PenResolvers<ContextType>;
	Query?: QueryResolvers<ContextType>;
	Roster?: RosterResolvers<ContextType>;
	RosterEntry?: RosterEntryResolvers<ContextType>;
	SparkplugDevice?: SparkplugDeviceResolvers<ContextType>;
	SparkplugGroup?: SparkplugGroupResolvers<ContextType>;
	SparkplugMetric?: SparkplugMetricResolvers<ContextType>;
	SparkplugMetricHistory?: SparkplugMetricHistoryResolvers<ContextType>;
	SparkplugNode?: SparkplugNodeResolvers<ContextType>;
	User?: UserResolvers<ContextType>;
};
