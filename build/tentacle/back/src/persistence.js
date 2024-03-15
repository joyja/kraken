"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Persistence = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class Persistence {
    global;
    variables;
    classes;
    filepath;
    data;
    constructor({ filepath = path.resolve(process.cwd(), 'runtime/persistence.json'), variables, global, classes, }) {
        this.global = global;
        this.variables = variables;
        this.classes = classes;
        this.filepath = filepath;
        if (fs.existsSync(filepath)) {
            try {
                this.data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
            }
            catch (error) {
                console.log(error);
                this.data = {};
                void this.writeFile();
            }
        }
        else {
            this.data = {};
            void this.writeFile();
        }
    }
    load() {
        Object.keys(this.global).forEach((key) => {
            if (this.classes
                .map((fb) => fb.name)
                .includes(this.global[key].constructor.name)) {
                Object.keys(this.global[key].constructor.variables)
                    .filter((variableName) => {
                    return this.global[key].constructor.variables[variableName]
                        .persistent;
                })
                    .forEach((variableName) => {
                    if (key in this.data && variableName in this.data[key]) {
                        this.global[key][variableName] = this.data[key][variableName];
                    }
                });
            }
            else {
                if ((this.variables[key]?.persistent !== null && this.variables[key]?.persistent !== undefined) && key in this.data) {
                    this.global[key] = this.data[key];
                }
            }
        });
    }
    persist() {
        const newData = {};
        Object.keys(this.global).forEach((key) => {
            if ((Boolean(this.global[key])) &&
                this.classes
                    .map((fb) => fb.name)
                    .includes(this.global[key].constructor.name)) {
                const fbData = {};
                Object.keys(this.global[key].constructor.variables)
                    .filter((variableName) => {
                    return this.global[key].constructor.variables[variableName]
                        .persistent;
                })
                    .forEach((variableName) => {
                    fbData[variableName] = this.global[key][variableName];
                });
                newData[key] = fbData;
            }
            else {
                if (this.variables[key]?.persistent !== null && this.variables[key]?.persistent !== undefined) {
                    newData[key] = this.global[key];
                }
            }
        });
        this.data = newData;
        try {
            void this.writeFile();
        }
        catch (error) {
            console.log(error);
        }
    }
    async writeFile() {
        await new Promise((resolve, reject) => {
            fs.writeFile(this.filepath, JSON.stringify(this.data, null, 2), (error) => {
                if (error !== null && error !== undefined) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
}
exports.Persistence = Persistence;
