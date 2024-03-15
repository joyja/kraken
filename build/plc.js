"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plc = exports.PLC = void 0;
const modbus_1 = require("./modbus");
const opcua_1 = require("./opcua");
const mqtt_1 = require("./mqtt");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const persistence_1 = require("./persistence");
const chokidar_1 = __importDefault(require("chokidar"));
const date_fns_1 = require("date-fns");
const typescript_1 = __importDefault(require("typescript"));
function getDatatype(value) {
    if (typeof value === 'boolean') {
        return 'BOOLEAN';
    }
    else if (typeof value === 'string') {
        return 'STRING';
    }
    else if (typeof value === 'number') {
        return 'FLOAT';
    }
    else {
        console.error(`datatype of ${value} could not be determined.`);
        return 'STRING';
    }
}
function createFileIfNotExists(path, initialValue) {
    if (!fs_1.default.existsSync(path)) {
        fs_1.default.writeFileSync(path, initialValue);
    }
}
function createDirIfNotExists(path) {
    if (!fs_1.default.existsSync(path)) {
        fs_1.default.mkdirSync(path);
    }
}
function findAllFiles(dir, extensions, filelist = []) {
    fs_1.default.readdirSync(dir).forEach(file => {
        const filePath = path_1.default.join(dir, file);
        if (fs_1.default.statSync(filePath).isDirectory()) {
            filelist = findAllFiles(filePath, extensions, filelist);
        }
        else if (extensions.some(extension => filePath.endsWith(extension))) {
            filelist.push(filePath);
        }
    });
    return filelist;
}
function ensureDirExists(filePath) {
    const dirname = path_1.default.dirname(filePath);
    if (!fs_1.default.existsSync(dirname)) {
        fs_1.default.mkdirSync(dirname, { recursive: true });
    }
}
function copyFile(source, target) {
    ensureDirExists(target);
    fs_1.default.copyFileSync(source, target);
}
function removeDir(dir, excludeFiles) {
    if (fs_1.default.existsSync(dir)) {
        fs_1.default.readdirSync(dir).forEach(file => {
            const currentPath = path_1.default.join(dir, file);
            if (fs_1.default.lstatSync(currentPath).isDirectory()) {
                removeDir(currentPath, excludeFiles);
            }
            else {
                // Check if the current file is not in the list of excluded files
                if (!excludeFiles.includes(currentPath)) {
                    fs_1.default.unlinkSync(currentPath);
                }
            }
        });
    }
}
class PLC {
    modbus;
    opcua;
    mqtt;
    intervals;
    global;
    metrics;
    running;
    runtimeDir;
    developmentDir;
    runtimeConfigFile;
    runtimeVariableFile;
    runtimeClassesDir;
    runtimeProgramsDir;
    developmentConfigFile;
    developmentVariableFile;
    developmentClassesDir;
    developmentProgramsDir;
    config;
    variables;
    classes;
    persistence;
    fileChanges = [];
    watcher;
    programCacheId = Date.now();
    constructor() {
        this.modbus = {};
        this.opcua = {};
        this.mqtt = {};
        this.intervals = [];
        this.global = {};
        this.metrics = {};
        this.running = false;
        // Handle runtime dir
        this.runtimeDir = path_1.default.resolve(process.cwd(), 'runtime');
        // createDirIfNotExists(this.runtimeDir)
        this.developmentDir = path_1.default.resolve(process.cwd(), 'development');
        createDirIfNotExists(this.developmentDir);
        // Handle config
        const configInit = JSON.stringify({ tasks: {}, mqtt: {}, modbus: {}, opcua: {} }, null, 2);
        this.runtimeConfigFile = path_1.default.resolve(this.runtimeDir, 'config.json');
        // createFileIfNotExists(this.runtimeConfigFile, configInit)
        this.developmentConfigFile = path_1.default.resolve(this.developmentDir, 'config.json');
        createFileIfNotExists(this.developmentConfigFile, configInit);
        // Handle variables
        const variableInit = JSON.stringify({}, null, 2);
        this.runtimeVariableFile = path_1.default.resolve(this.runtimeDir, 'variables.json');
        // createFileIfNotExists(this.runtimeVariableFile, variableInit)
        this.developmentVariableFile = path_1.default.resolve(this.developmentDir, 'variables.json');
        createFileIfNotExists(this.developmentVariableFile, variableInit);
        // Handle classes dir
        this.runtimeClassesDir = path_1.default.resolve(this.runtimeDir, 'classes');
        // createDirIfNotExists(this.runtimeClassesDir)
        this.developmentClassesDir = path_1.default.resolve(this.developmentDir, 'classes');
        createDirIfNotExists(this.developmentClassesDir);
        // Handle programs dir
        this.runtimeProgramsDir = path_1.default.resolve(this.runtimeDir, 'programs');
        // createDirIfNotExists(this.runtimeProgramsDir)
        this.developmentProgramsDir = path_1.default.resolve(this.developmentDir, 'programs');
        createDirIfNotExists(this.developmentProgramsDir);
    }
    async getConfig() {
        this.config = JSON.parse(fs_1.default.readFileSync(this.runtimeConfigFile, 'utf8'));
        this.variables = JSON.parse(fs_1.default.readFileSync(this.runtimeVariableFile, 'utf8'));
        if (fs_1.default.existsSync(this.runtimeClassesDir)) {
            const classImports = await Promise.all(fs_1.default
                .readdirSync(path_1.default.resolve(this.runtimeClassesDir))
                .map(async (filename) => {
                const classes = import(path_1.default.resolve(this.runtimeClassesDir, `${filename}?update=${this.programCacheId}`));
                return await classes;
            }));
            this.classes = classImports.reduce((acc, current) => {
                return [...acc, ...current];
            }, []);
        }
        else {
            this.classes = [];
        }
        this.persistence = new persistence_1.Persistence({
            variables: this.variables,
            global: this.global,
            classes: this.classes,
        });
        this.fileChanges = [];
        if (this.watcher !== undefined)
            this.watcher.close();
        this.watcher = chokidar_1.default.watch(this.developmentDir).on('all', (event, filePath) => {
            if (filePath !== path_1.default.resolve(process.cwd(), 'development/persistence.json')) {
                this.fileChanges.push({
                    timestamp: Date.now(),
                    event,
                    path: filePath.replace(process.cwd(), ''),
                });
            }
        });
        setTimeout(() => {
            // Clear out changes so initial files don't get put in the log.
            this.fileChanges.length = 0;
        }, 500);
        if (this.config?.modbus !== undefined) {
            Object.keys(this.config.modbus).forEach((modbusKey) => {
                if (this.modbus[modbusKey] !== undefined) {
                    void this.modbus[modbusKey].disconnect();
                }
                this.modbus[modbusKey] = new modbus_1.Modbus({
                    ...this.config.modbus[modbusKey].config,
                    global: this.global,
                });
                void this.modbus[modbusKey].connect();
            });
        }
        if (this.config?.opcua !== undefined) {
            Object.keys(this.config.opcua).forEach((opcuaKey) => {
                if (this.opcua[opcuaKey] !== undefined) {
                    void this.opcua[opcuaKey].disconnect();
                }
                this.opcua[opcuaKey] = new opcua_1.Opcua({
                    ...this.config.opcua[opcuaKey].config,
                    global: this.global,
                });
                void this.opcua[opcuaKey].connect();
            });
        }
        if (this.config?.mqtt !== undefined) {
            Object.keys(this.config.mqtt).forEach((mqttKey) => {
                if (this.mqtt[mqttKey] !== undefined) {
                    void this.mqtt[mqttKey].disconnect();
                }
                this.mqtt[mqttKey] = new mqtt_1.Mqtt({
                    ...this.config.mqtt[mqttKey].config,
                    global: this.global,
                });
                this.mqtt[mqttKey].connect();
            });
        }
    }
    transpile() {
        const sourceDir = path_1.default.resolve(process.cwd(), 'development');
        const outDir = path_1.default.resolve(process.cwd(), 'runtime');
        const options = {
            noEmitOnError: true,
            noImplicitAny: true,
            target: typescript_1.default.ScriptTarget.ESNext,
            module: typescript_1.default.ModuleKind.NodeNext,
            moduleResolution: typescript_1.default.ModuleResolutionKind.NodeNext,
            outDir,
            rootDir: sourceDir
        };
        removeDir(outDir, [path_1.default.join(outDir, 'persistence.json')]);
        ensureDirExists(sourceDir);
        const allFiles = findAllFiles(sourceDir, ['.ts', '.json']);
        const host = typescript_1.default.createCompilerHost(options);
        host.writeFile = (fileName, contents) => {
            const relativePath = path_1.default.relative(sourceDir, fileName);
            const outputPath = path_1.default.join(outDir, relativePath);
            ensureDirExists(outputPath);
            fs_1.default.writeFileSync(outputPath, contents);
        };
        const tsFiles = allFiles.filter(file => file.endsWith('.ts'));
        if (tsFiles.length > 0) {
            const program = typescript_1.default.createProgram(tsFiles, options, host);
            program.emit();
        }
        const jsonFiles = allFiles.filter(file => file.endsWith('.json'));
        if (jsonFiles.length > 0) {
            jsonFiles.forEach(file => {
                const relativePath = path_1.default.relative(sourceDir, file);
                const outputPath = path_1.default.join(outDir, relativePath);
                copyFile(file, outputPath);
            });
        }
        this.programCacheId = Date.now();
        console.log("Compilation and copying completed successfully.");
    }
    async start() {
        if (!this.running) {
            await this.getConfig();
            Object.keys(this.variables).forEach((variableKey) => {
                const variable = this.variables[variableKey];
                if (variable.datatype === 'number' ||
                    variable.datatype === 'boolean' ||
                    variable.datatype === 'string') {
                    this.global[variableKey] = variable.initialValue;
                }
                else if (![null, undefined].includes(this.classes.map((item) => item.name).includes(variable.datatype))) {
                    const VariableClass = this.classes.find((item) => item.name === variable.datatype);
                    this.global[variableKey] = new VariableClass({
                        global: this.global,
                        ...variable.config,
                    });
                    // check for class tasks and run intervals for them
                    if (VariableClass.tasks !== undefined) {
                        this.global[variableKey].intervals = [];
                        Object.keys(VariableClass.tasks).forEach((taskKey) => {
                            this.global[variableKey].intervals.push(setInterval(() => {
                                this.global[variableKey][VariableClass.tasks[taskKey].function]();
                            }, VariableClass.tasks[taskKey].scanRate));
                        });
                    }
                    this.global[variableKey].name = variableKey;
                }
                else {
                    console.log(`the datatype for ${variableKey} is invalid`);
                }
            });
            this.persistence.load();
            Object.keys(this.config.tasks).forEach((taskKey) => {
                this.metrics[taskKey] = {};
                let intervalStart;
                this.intervals.push({
                    interval: setInterval(({ global, persistence, metrics, taskKey, }) => {
                        void (async ({ global, persistence, metrics, taskKey, }) => {
                            const intervalStop = intervalStart !== undefined
                                ? process.hrtime(intervalStart)
                                : [0, 0];
                            metrics[taskKey].intervalExecutionTime = intervalStop !== undefined
                                ? (intervalStop[0] * 1e9 + intervalStop[1]) / 1e6
                                : 0;
                            const functionStart = process.hrtime();
                            try {
                                const { program } = await import(path_1.default.resolve(process.cwd(), `runtime/programs/${this.config.tasks[taskKey].program}.js?update=${this.programCacheId}`));
                                program({ global });
                                for (const variableKey of Object.keys(this.variables)) {
                                    const variable = this.variables[variableKey];
                                    if (variable.source !== undefined) {
                                        if (variable.source.type === 'modbus') {
                                            // await modbus[variable.source.name].write({
                                            //   value: [this.global[variableKey]],
                                            //   ...variable.source.params,
                                            // })
                                            if (this.modbus[variable.source.name].connected) {
                                                void this.modbus[variable.source.name]
                                                    .read(variable.source.params)
                                                    .then((result) => (this.global[variableKey] = result));
                                            }
                                        }
                                        // if (variable.source.type === 'opcua') {
                                        // await opcua[variable.source.name].write({
                                        //   inputValue: this.global[variableKey],
                                        //   ...variable.source.params,
                                        // })
                                        //   if (this.opcua[variable.source.name].connected) {
                                        //     this.opcua[variable.source.name]
                                        //       .read(variable.source.params)
                                        //       .then((result) => (this.global[variableKey] = result))
                                        //   }
                                        // }
                                    }
                                }
                                for (const opcuaKey of Object.keys(this.opcua)) {
                                    const opcuaNodeVariables = Object.keys(this.variables)
                                        .filter((variableKey) => {
                                        return this.variables[variableKey].source?.name === opcuaKey;
                                    })
                                        .filter((variableKey) => {
                                        return this.variables[variableKey].source?.type === 'opcua';
                                    });
                                    const opcuaNodeIds = opcuaNodeVariables.map((variableKey) => {
                                        return this.variables[variableKey].source.params.nodeId;
                                    });
                                    void this.opcua[opcuaKey]
                                        .read({ nodeIds: opcuaNodeIds })
                                        .then((result) => {
                                        if (result != null) {
                                            for (let i = 0; i < result.length; i++) {
                                                this.global[opcuaNodeVariables[i]] = result[i];
                                            }
                                        }
                                    });
                                }
                                for (const key of Object.keys(this.variables)) {
                                    const now = new Date();
                                    const variable = this.variables[key];
                                    const isNumeric = variable.datatype === 'number';
                                    const lastPublished = variable.lastPublished;
                                    const lastValue = variable.lastValue;
                                    const deadbandMaxTime = variable.deadband?.maxTime;
                                    let outsideDeadband = false;
                                    if (isNumeric) {
                                        const deadband = (variable.deadband?.value !== undefined ? variable.deadband.value : 0);
                                        outsideDeadband = variable.lastValue === undefined || Math.abs(this.global[key] - variable.lastValue) > deadband;
                                    }
                                    else {
                                        outsideDeadband = variable.lastValue !== this.global[key];
                                    }
                                    const outsideDeadbandMaxTime = lastValue === undefined || lastPublished === undefined || (0, date_fns_1.differenceInMilliseconds)(now, lastPublished) > deadbandMaxTime;
                                    if (outsideDeadband || outsideDeadbandMaxTime) {
                                        for (const mqttKey of Object.keys(this.mqtt)) {
                                            this.mqtt[mqttKey].queue.push({
                                                name: key.replaceAll('.', '/'),
                                                value: this.global[key],
                                                type: getDatatype(this.global[key]),
                                                timestamp: (0, date_fns_1.getUnixTime)(new Date()),
                                            });
                                        }
                                        variable.lastValue = this.global[key];
                                        variable.lastPublished = now;
                                    }
                                }
                                const functionStop = process.hrtime(functionStart);
                                metrics[taskKey].functionExecutionTime =
                                    (functionStop[0] * 1e9 + functionStop[1]) / 1e6;
                                persistence.persist();
                                metrics[taskKey].totalScanTime =
                                    metrics.main.functionExecutionTime +
                                        metrics.main.intervalExecutionTime;
                            }
                            catch (error) {
                                console.log(error);
                            }
                            intervalStart = process.hrtime();
                        })({
                            global,
                            persistence,
                            metrics,
                            taskKey,
                        });
                    }, this.config.tasks[taskKey].scanRate, {
                        global: this.global,
                        persistence: this.persistence,
                        metrics: this.metrics,
                        variables: this.variables,
                        modbus: this.modbus,
                        opcua: this.opcua,
                        taskKey,
                    }),
                    scanRate: this.config.tasks[taskKey].scanRate,
                    name: taskKey,
                });
            });
            this.running = true;
        }
        else {
            throw Error('The PLC is already running.');
        }
    }
    stop() {
        if (this.running) {
            this.intervals.forEach((interval) => {
                clearInterval(interval.interval);
            });
            this.intervals = [];
            Object.keys(this.global).forEach((variableKey) => {
                if (this.global[variableKey].intervals !== undefined) {
                    this.global[variableKey].intervals.forEach((interval) => {
                        clearInterval(interval);
                    });
                    this.global[variableKey].intervals = [];
                }
            });
            this.running = false;
        }
        else {
            throw Error('The PLC is already stopped.');
        }
    }
    restart() {
        if (this.running) {
            this.stop();
        }
        this.transpile();
        void this.start();
    }
}
exports.PLC = PLC;
exports.plc = new PLC();
