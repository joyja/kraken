import { EventEmitter } from 'events';

class VariableEvents extends EventEmitter {}
export const variableEvents = new VariableEvents()
